#!/usr/bin/env bun

/**
 * Starts the API, then runs the monorepo test suite against it.
 * Kept until e2e replaces this bootstrap-and-test flow.
 */

import dotenv from 'dotenv'

import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const rootDir = resolve(import.meta.dir, '..')

dotenv.config({ path: resolve(rootDir, 'apps/api/.env') })
dotenv.config({ path: resolve(rootDir, 'apps/console/.env') })

const apiEntry = resolve(rootDir, 'apps/api/src/index.ts')

const apiProcess = spawn('bun', [apiEntry], {
  cwd: resolve(rootDir, 'apps/api'),
  env: process.env,
  stdio: 'inherit',
})

const sleep = (ms: number) =>
  new Promise<void>(resolveSleep => {
    setTimeout(resolveSleep, ms)
  })

const shutdown = () => {
  apiProcess.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  await sleep(2000)

  const testProcess = spawn(
    'bun',
    [
      'test',
      'apps/api/src',
      'apps/console',
      'packages/db',
      'packages/api-client',
      'packages/ui',
    ],
    {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit',
    },
  )

  const exitCode = await new Promise<number>((resolveExit, reject) => {
    testProcess.on('error', reject)
    testProcess.on('close', code => resolveExit(code ?? 1))
  })

  process.exitCode = exitCode
} finally {
  shutdown()
  await sleep(500)
}
