import { LAST_WORKSPACE_SLUG_COOKIE } from '@repro-v2/iam/last-workspace-slug-cookie'

export function readLastWorkspaceSlug(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LAST_WORKSPACE_SLUG_COOKIE}=([^;]*)`),
  )

  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function writeLastWorkspaceSlug(slug: string): void {
  if (typeof document === 'undefined') {
    return
  }

  // biome-ignore lint/suspicious/noDocumentCookie: intentional last-workspace preference cookie
  document.cookie = `${LAST_WORKSPACE_SLUG_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; samesite=lax`
}
