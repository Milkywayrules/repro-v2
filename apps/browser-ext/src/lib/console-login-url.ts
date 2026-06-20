import { env } from '@repro-v2/env/browser-ext'

export const consoleLoginUrl = new URL('/login', env.WXT_CONSOLE_URL).href
