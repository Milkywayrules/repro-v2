import 'dotenv/config'

import babel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'wxt'
import { z } from 'zod'

const apiUrl = z.url().parse(process.env.WXT_API_URL)
const apiHostPermission = `${new URL(apiUrl).origin}/*`
const consoleUrl = z.url().parse(process.env.WXT_CONSOLE_URL)
const consoleHostPermission = `${new URL(consoleUrl).origin}/*`

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [babel({ presets: [reactCompilerPreset()] })],
  }),
  targetBrowsers: ['chrome', 'firefox'],
  zip: {
    name: 'browser-ext',
  },
  suppressWarnings: {
    firefoxDataCollection: true,
  },
  manifest: ({ browser }) => ({
    name: 'repro v2 - Browser Extension',
    description: 'repro v2 - Browser extension',
    version: '1.0.0',
    host_permissions: [apiHostPermission, consoleHostPermission],
    permissions: ['cookies'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'repro-v2@localhost',
            },
          },
        }
      : {}),
  }),
})
