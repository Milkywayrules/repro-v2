import { describe, expect, test } from 'bun:test'

import { createAppQueryClient } from './create-app-query-client'

const UNAUTHORIZED = 401

function unauthorizedError() {
  const error = new Error('Unauthorized') as Error & { status: number }
  error.status = UNAUTHORIZED
  return error
}

function isUnauthorizedError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === UNAUTHORIZED
  )
}

describe('createAppQueryClient', () => {
  test('does not retry queries on 401', async () => {
    const onUnauthorized = () => undefined

    const queryClient = createAppQueryClient({
      isUnauthorized: isUnauthorizedError,
      onUnauthorized,
    })

    let attempts = 0
    const error = unauthorizedError()

    await expect(
      queryClient.fetchQuery({
        queryKey: ['unauthorized-query'],
        queryFn: () => {
          attempts += 1
          throw error
        },
        retry: queryClient.getDefaultOptions().queries?.retry,
      }),
    ).rejects.toBe(error)

    expect(attempts).toBe(1)
  })

  test('calls onUnauthorized and clears cache on 401', async () => {
    let unauthorizedCalls = 0
    const error = unauthorizedError()

    const queryClient = createAppQueryClient({
      isUnauthorized: isUnauthorizedError,
      onUnauthorized: () => {
        unauthorizedCalls += 1
      },
    })

    queryClient.setQueryData(['cached'], { secret: true })
    expect(queryClient.getQueryData(['cached'])).toEqual({ secret: true })

    await expect(
      queryClient.fetchQuery({
        queryKey: ['unauthorized-query'],
        queryFn: () => {
          throw error
        },
        retry: queryClient.getDefaultOptions().queries?.retry,
      }),
    ).rejects.toBe(error)

    expect(unauthorizedCalls).toBe(1)
    expect(queryClient.getQueryData(['cached'])).toBeUndefined()
  })
})
