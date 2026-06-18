import { log } from 'evlog'

import { createApp } from './app'
import { registerGracefulShutdown } from './lifecycle'

if (import.meta.main) {
  const app = createApp()

  const port = Number(process.env.PORT) || 5000

  app.listen(port, () => {
    log.info({ action: 'server.listen', port })
  })

  registerGracefulShutdown(app)
}
