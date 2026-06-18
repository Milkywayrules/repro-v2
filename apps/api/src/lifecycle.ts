import { closeDatabaseConnection } from '@repro-v2/db'
import { log, parseError } from 'evlog'

const SHUTDOWN_TIMEOUT_MS = 30_000

interface StoppableServer {
  stop: (closeActiveConnections?: boolean) => Promise<unknown>
}

let isShuttingDown = false

export function isDraining(): boolean {
  return isShuttingDown
}

/** @internal Test-only hook to simulate drain state. */
export function setDrainingForTests(value: boolean): void {
  isShuttingDown = value
}

export function registerGracefulShutdown(app: StoppableServer): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true
    log.info({ action: 'lifecycle.shutdown', signal, phase: 'start' })

    const forceExitTimer = setTimeout(() => {
      log.error({ action: 'lifecycle.shutdown', phase: 'timeout' })
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)

    try {
      await app.stop()
      await closeDatabaseConnection()
      log.info({ action: 'lifecycle.shutdown', phase: 'complete' })
      process.exit(0)
    } catch (error) {
      log.error({
        action: 'lifecycle.shutdown',
        phase: 'error',
        error: parseError(error),
      })
      process.exit(1)
    } finally {
      clearTimeout(forceExitTimer)
    }
  }

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      shutdown(signal).catch(error => {
        log.error({
          action: 'lifecycle.shutdown',
          phase: 'unhandled',
          error: parseError(error),
        })
        process.exit(1)
      })
    })
  }
}
