#!/usr/bin/env bun

/**
 * Smoke checks for API auth + tasks, console route build, and browser-ext targets.
 */

import dotenv from 'dotenv'

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = resolve(import.meta.dir, '..')

dotenv.config({ path: resolve(rootDir, 'apps/api/.env') })
dotenv.config({ path: resolve(rootDir, 'apps/console/.env') })

const apiUrl = process.env.IAM_BETTER_AUTH_URL ?? 'http://localhost:5000'
const consoleOrigin = 'http://localhost:5001'

const sleep = (ms: number) =>
  new Promise<void>(resolveSleep => {
    setTimeout(resolveSleep, ms)
  })

function fail(message: string) {
  throw new Error(message)
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const response = await fetch(url, init)
  const text = await response.text()
  let body: unknown = text

  if (text.length > 0) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  return { status: response.status, body, headers: response.headers }
}

function collectSetCookie(headers: Headers): string[] {
  const getSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof getSetCookie.getSetCookie === 'function') {
    return getSetCookie.getSetCookie()
  }

  const single = headers.get('set-cookie')
  return single ? [single] : []
}

function cookieHeaderFromSetCookies(setCookies: string[]): string {
  return setCookies
    .map(cookie => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ')
}

async function waitForReady(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const { status } = await fetchJson(`${apiUrl}/ready`)
      if (status === 200) {
        return
      }
    } catch {
      /* API still starting */
    }

    await sleep(500)
  }

  throw new Error(`API not ready at ${apiUrl}/ready`)
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<number> {
  return await new Promise((resolveExit, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', code => resolveExit(code ?? 1))
  })
}

const apiEntry = resolve(rootDir, 'apps/api/src/index.ts')
const apiProcess = spawn('bun', [apiEntry], {
  cwd: resolve(rootDir, 'apps/api'),
  env: process.env,
  stdio: 'inherit',
})

const shutdown = () => {
  apiProcess.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  await waitForReady()

  const smokeEmail = `smoke-${Date.now()}@example.com`
  const smokePassword = 'smoke-password-123'
  const smokeName = 'Smoke User'

  const signUp = await fetchJson(`${apiUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: consoleOrigin,
    },
    body: JSON.stringify({
      email: smokeEmail,
      password: smokePassword,
      name: smokeName,
    }),
  })

  if (signUp.status !== 200) {
    fail(`sign-up failed (${signUp.status}): ${JSON.stringify(signUp.body)}`)
  }

  const signUpCookies = collectSetCookie(signUp.headers)
  const sessionCookie = cookieHeaderFromSetCookies(signUpCookies)

  if (!sessionCookie) {
    fail('sign-up did not return session cookie')
  }

  const taskLists = await fetchJson(`${apiUrl}/api/v1/task-lists`, {
    headers: {
      cookie: sessionCookie,
      origin: consoleOrigin,
    },
  })

  if (taskLists.status !== 200) {
    fail(
      `task-lists failed (${taskLists.status}): ${JSON.stringify(taskLists.body)}`,
    )
  }

  const listsBody = taskLists.body as {
    data?: Array<{ id: string; name: string }>
  }

  if (!listsBody.data || listsBody.data.length === 0) {
    fail('expected dev sign-up to seed at least one task list')
  }

  const inbox = listsBody.data.find(list => list.name === 'Inbox')
  if (!inbox) {
    fail('expected Inbox list from dev seed')
  }

  const tasks = await fetchJson(
    `${apiUrl}/api/v1/tasks?listId=${encodeURIComponent(inbox.id)}`,
    {
      headers: {
        cookie: sessionCookie,
        origin: consoleOrigin,
      },
    },
  )

  if (tasks.status !== 200) {
    fail(`tasks failed (${tasks.status}): ${JSON.stringify(tasks.body)}`)
  }

  const tasksBody = tasks.body as { data?: Array<{ title: string }> }
  if (!tasksBody.data || tasksBody.data.length < 2) {
    fail('expected at least two seeded tasks')
  }

  const chromeBuildCode = await runCommand(
    'bun',
    ['run', 'build'],
    resolve(rootDir, 'apps/browser-ext'),
  )
  if (chromeBuildCode !== 0) {
    fail('browser-ext chrome build failed')
  }

  const firefoxBuildCode = await runCommand(
    'bun',
    ['run', 'build:firefox'],
    resolve(rootDir, 'apps/browser-ext'),
  )
  if (firefoxBuildCode !== 0) {
    fail('browser-ext firefox build failed')
  }

  const chromeManifest = resolve(
    rootDir,
    'apps/browser-ext/.output/chrome-mv3/manifest.json',
  )
  const firefoxManifest = resolve(
    rootDir,
    'apps/browser-ext/.output/firefox-mv2/manifest.json',
  )

  if (!existsSync(chromeManifest)) {
    fail(`missing chrome manifest at ${chromeManifest}`)
  }

  if (!existsSync(firefoxManifest)) {
    fail(`missing firefox manifest at ${firefoxManifest}`)
  }

  process.stdout.write(
    `smoke: ok — user ${smokeEmail}, ${listsBody.data.length} list(s), ${tasksBody.data.length} task(s), chrome+firefox builds\n`,
  )
} catch (error) {
  process.stderr.write(
    `smoke: ${error instanceof Error ? error.message : 'unknown error'}\n`,
  )
  process.exitCode = 1
} finally {
  shutdown()
  await sleep(500)
}
