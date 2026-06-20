export const IAM_CONTEXT_SKIP_PREFIXES = [
  '/api/auth',
  '/health',
  '/ready',
  '/openapi',
] as const

export function shouldSkipIamContext(pathname: string): boolean {
  if (pathname === '/') {
    return true
  }

  return IAM_CONTEXT_SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
