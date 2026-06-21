const TRAILING_SLASH = /\/$/

export function resolveS3Endpoint(
  accountId: string,
  endpoint?: string,
): string {
  if (endpoint) {
    return endpoint.replace(TRAILING_SLASH, '')
  }

  return `https://${accountId}.r2.cloudflarestorage.com`
}
