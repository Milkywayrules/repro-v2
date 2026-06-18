export const AUTH_CONTEXT_SKIP_PREFIXES = [
  '/api/auth',
  '/health',
  '/ready',
  '/openapi',
] as const

export function shouldSkipAuthContext(pathname: string): boolean {
  if (pathname === '/') {
    return true
  }

  return AUTH_CONTEXT_SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
