import { env } from '@repro-v2/env/browser-ext'
import { LAST_WORKSPACE_SLUG_COOKIE } from '@repro-v2/iam/last-workspace-slug-cookie'
import { browser } from 'wxt/browser'

export async function readLastWorkspaceSlug(): Promise<string | null> {
  try {
    const cookie = await browser.cookies.get({
      url: env.WXT_CONSOLE_URL,
      name: LAST_WORKSPACE_SLUG_COOKIE,
    })

    return cookie?.value ? decodeURIComponent(cookie.value) : null
  } catch {
    return null
  }
}
