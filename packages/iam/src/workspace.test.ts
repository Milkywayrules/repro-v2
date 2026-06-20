import { describe, expect, it } from 'bun:test'

import { ensureActiveWorkspace } from './workspace'

function mockClient(options: {
  session?: { session: unknown; user: unknown } | null
  sessionError?: { message?: string }
  organizations?: Array<{ id: string }>
  listError?: { message?: string }
  setActiveError?: { message?: string }
}) {
  return {
    getSession: async () => ({
      data: options.session ?? null,
      error: options.sessionError ?? null,
    }),
    organization: {
      list: async () => ({
        data: options.organizations ?? null,
        error: options.listError ?? null,
      }),
      setActive: async () => ({
        error: options.setActiveError ?? null,
      }),
    },
  }
}

describe('ensureActiveWorkspace', () => {
  it('returns existing activeOrganizationId without listing', async () => {
    const client = mockClient({
      session: {
        session: { activeOrganizationId: 'ws-existing' },
        user: { id: 'user-1' },
      },
    })

    const result = await ensureActiveWorkspace(client)

    expect(result).toEqual({ ok: true, workspaceId: 'ws-existing' })
  })

  it('sets first organization when session has no active workspace', async () => {
    const client = mockClient({
      session: {
        session: {},
        user: { id: 'user-1' },
      },
      organizations: [{ id: 'ws-first' }],
    })

    const result = await ensureActiveWorkspace(client)

    expect(result).toEqual({ ok: true, workspaceId: 'ws-first' })
  })

  it('returns no_workspace when user has no organizations', async () => {
    const client = mockClient({
      session: {
        session: {},
        user: { id: 'user-1' },
      },
      organizations: [],
    })

    const result = await ensureActiveWorkspace(client)

    expect(result).toEqual({ ok: false, reason: 'no_workspace' })
  })

  it('returns no_session when getSession fails', async () => {
    const client = mockClient({
      sessionError: { message: 'Unauthorized' },
    })

    const result = await ensureActiveWorkspace(client)

    expect(result).toEqual({
      ok: false,
      reason: 'no_session',
      error: 'Unauthorized',
    })
  })
})
