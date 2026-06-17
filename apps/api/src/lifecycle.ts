import { closeDatabaseConnection } from '@repro-v2/db'

const SHUTDOWN_TIMEOUT_MS = 30_000

interface StoppableServer {
  stop: (closeActiveConnections?: boolean) => Promise<unknown>
}

let isShuttingDown = false

export function isDraining(): boolean {
  return isShuttingDown
}

export function registerGracefulShutdown(app: StoppableServer): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true
    console.log(`Received ${signal}, starting graceful shutdown`)

    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)

    try {
      await app.stop()
      await closeDatabaseConnection()
      console.log('Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      console.error('Error during graceful shutdown', error)
      process.exit(1)
    } finally {
      clearTimeout(forceExitTimer)
    }
  }

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      shutdown(signal).catch(error => {
        console.error('Unhandled shutdown error', error)
        process.exit(1)
      })
    })
  }
}
