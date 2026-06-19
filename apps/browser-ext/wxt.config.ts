import { env } from '@repro-v2/env/browser-ext'
import { defineConfig } from 'wxt'

const apiHostPermission = `${new URL(env.WXT_API_URL).origin}/*`

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  targetBrowsers: ['chrome', 'firefox'],
  zip: {
    name: 'browser-ext',
  },
  manifest: {
    name: 'repro v2 - Browser Extension',
    description: 'repro v2 - Browser extension',
    version: '1.0.0',
    host_permissions: [apiHostPermission],
  },
})
