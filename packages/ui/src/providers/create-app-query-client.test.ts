import { describe, expect, test } from 'bun:test'

import { createAppQueryClient } from './create-app-query-client'

function unauthorizedError() {
  const error = new Error('Unauthorized') as Error & { status: number }
  error.status = 401
  return error
}

describe('createAppQueryClient', () => {
  test('does not retry queries on 401', async () => {
    const queryClient = createAppQueryClient({
      onUnauthorized: () => undefined,
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
