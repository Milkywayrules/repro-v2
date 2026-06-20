import { env } from '@repro-v2/env/browser-ext'

import { routes } from './routes'

export function getConsoleLoginUrl(): string {
  return new URL(routes.login, env.WXT_CONSOLE_URL).href
}
