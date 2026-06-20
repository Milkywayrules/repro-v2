export const IAM_CONTEXT_SKIP_PREFIXES = [
  '/api/auth',
  '/health',
  '/ready',
  '/openapi',
] as const

export const IAM_CONTEXT_SKIP_EXACT_PATHS = [
  '/api/v1/platform/iam-features',
] as const

export function shouldSkipIamContext(pathname: string): boolean {
  if (pathname === '/') {
    return true
  }

  if (
    IAM_CONTEXT_SKIP_EXACT_PATHS.some(
      path => pathname === path || pathname === `${path}/`,
    )
  ) {
    return true
  }

  return IAM_CONTEXT_SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
