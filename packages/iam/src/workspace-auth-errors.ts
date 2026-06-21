const ORGANIZATION_TO_WORKSPACE_MESSAGES: Record<string, string> = {
  'You are not allowed to create a new organization':
    'You are not allowed to create a new workspace',
  'You have reached the maximum number of organizations':
    'You have reached the maximum number of workspaces',
  'Organization already exists':
    'A workspace with this URL already exists on your account',
  'Organization slug already taken':
    'A workspace with this URL already exists on your account',
  'Organization not found': 'Workspace not found',
  'User is not a member of the organization':
    'You are not a member of this workspace',
  'You are not allowed to update this organization':
    'You are not allowed to update this workspace',
  'You are not allowed to delete this organization':
    'You are not allowed to delete this workspace',
  'No active organization': 'No active workspace',
  'User is already a member of this organization':
    'You are already a member of this workspace',
  'You cannot leave the organization as the only owner':
    'You cannot leave the workspace as the only owner',
  'You cannot leave the organization without an owner':
    'You cannot leave the workspace without an owner',
  'You are not allowed to invite users to this organization':
    'You are not allowed to invite users to this workspace',
  'User is already invited to this organization':
    'This user is already invited to this workspace',
  'You are not allowed to cancel this invitation':
    'You are not allowed to cancel this invitation',
  'Inviter is no longer a member of the organization':
    'Inviter is no longer a member of this workspace',
  'You are not allowed to invite a user with this role':
    'You are not allowed to invite a user with this role',
  'Organization membership limit reached': 'Workspace membership limit reached',
  'You are not allowed to access this organization as an owner':
    'You are not allowed to access this workspace as an owner',
  'You are not a member of this organization':
    'You are not a member of this workspace',
  'You must be in an organization to create a role':
    'You must be in a workspace to create a role',
  'This organization has too many roles': 'This workspace has too many roles',
}

function mapWorkspaceAuthMessage(message: string): string {
  const mapped = ORGANIZATION_TO_WORKSPACE_MESSAGES[message]
  if (mapped) {
    return mapped
  }

  return message
    .replace(/\bOrganization\b/g, 'Workspace')
    .replace(/\borganization\b/g, 'workspace')
    .replace(/\borganizations\b/g, 'workspaces')
}

function isOrganizationAuthPath(pathname: string, basePath: string): boolean {
  const normalizedBase = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath
  const organizationPath = `${normalizedBase}/organization`
  return (
    pathname === organizationPath || pathname.startsWith(`${organizationPath}/`)
  )
}

export async function mapWorkspaceAuthErrorResponse(
  request: Request,
  response: Response,
  basePath = '/api/auth',
): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (!isOrganizationAuthPath(pathname, basePath)) {
    return response
  }

  if (response.ok) {
    return response
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return response
  }

  let body: Record<string, unknown>
  try {
    body = (await response.clone().json()) as Record<string, unknown>
  } catch {
    return response
  }

  const message = typeof body.message === 'string' ? body.message : undefined

  if (!message) {
    return response
  }

  const mappedMessage = mapWorkspaceAuthMessage(message)
  if (mappedMessage === message) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set('content-type', 'application/json')

  return new Response(JSON.stringify({ ...body, message: mappedMessage }), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
