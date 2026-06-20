export interface WorkspaceSessionFields {
  activeOrganizationId?: string | null
}

export function activeWorkspaceId(session: unknown): string | null {
  if (typeof session !== 'object' || session === null) {
    return null
  }

  const value = Reflect.get(session, 'activeOrganizationId')

  return typeof value === 'string' ? value : null
}
