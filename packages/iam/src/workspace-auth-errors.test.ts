import { describe, expect, test } from 'bun:test'

import { mapWorkspaceAuthErrorResponse } from './workspace-auth-errors'

describe('mapWorkspaceAuthErrorResponse', () => {
  test('rewrites organization errors on organization routes', async () => {
    const request = new Request(
      'http://localhost:5000/api/auth/organization/create',
      { method: 'POST' },
    )
    const response = new Response(
      JSON.stringify({
        message: 'Organization already exists',
        code: 'ORGANIZATION_ALREADY_EXISTS',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      },
    )

    const mapped = await mapWorkspaceAuthErrorResponse(request, response)
    const body = (await mapped.json()) as { message?: string }

    expect(body.message).toBe(
      'A workspace with this URL already exists on your account',
    )
  })

  test('leaves non-organization routes unchanged', async () => {
    const request = new Request(
      'http://localhost:5000/api/auth/sign-in/email',
      {
        method: 'POST',
      },
    )
    const response = new Response(
      JSON.stringify({ message: 'Organization already exists' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      },
    )

    const mapped = await mapWorkspaceAuthErrorResponse(request, response)
    const body = (await mapped.json()) as { message?: string }

    expect(body.message).toBe('Organization already exists')
  })
})
