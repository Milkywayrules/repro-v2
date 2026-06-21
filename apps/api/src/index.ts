import { env } from '@repro-v2/env/api'
import { log } from 'evlog'

import { createApp } from './app'
import { registerGracefulShutdown } from './lifecycle'

const url = env.IAM_BETTER_AUTH_URL

if (import.meta.main) {
  const app = createApp()

  const port = Number(process.env.PORT) || 5000

  app.listen(port, () => {
    console.log('---------------------------------------------------------')
    console.log(
      `\x1b[36mAPI server\x1b[0m is running on port \x1b[32m${port}\x1b[0m`,
    )
    console.log(
      `\x1b[36mAPI server\x1b[0m is running on URL \x1b[32m${url}\x1b[0m`,
    )
    console.log('---------------------------------------------------------')
    log.info({ action: 'server.listen', port, url })
  })

  registerGracefulShutdown(app)
}
