#!/usr/bin/env bun

/**
 * Smoke checks for IAM (iam-features, sign-up), tasks, and browser-ext builds.
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

function mergeCookieHeader(
  existingCookie: string,
  setCookies: string[],
): string {
  const jar = new Map<string, string>()

  for (const part of existingCookie.split(';')) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf('=')
    if (separator > 0) {
      jar.set(trimmed.slice(0, separator), trimmed.slice(separator + 1))
    }
  }

  for (const setCookie of setCookies) {
    const pair = setCookie.split(';')[0]?.trim()
    if (!pair) {
      continue
    }

    const separator = pair.indexOf('=')
    if (separator > 0) {
      jar.set(pair.slice(0, separator), pair.slice(separator + 1))
    }
  }

  return [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

async function ensureActiveWorkspace(
  sessionCookie: string,
  workspaceEnabled: boolean,
): Promise<string> {
  if (!workspaceEnabled) {
    return sessionCookie
  }

  const authHeaders = {
    cookie: sessionCookie,
    origin: consoleOrigin,
  }

  const list = await fetchJson(`${apiUrl}/api/auth/organization/list`, {
    headers: authHeaders,
  })

  if (list.status !== 200) {
    fail(
      `organization/list failed (${list.status}): ${JSON.stringify(list.body)}`,
    )
  }

  const organizations = list.body as Array<{ id: string }> | null
  const firstOrg = organizations?.[0]

  if (!firstOrg) {
    fail('sign-up did not provision a workspace')
  }

  const setActive = await fetchJson(
    `${apiUrl}/api/auth/organization/set-active`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ organizationId: firstOrg.id }),
    },
  )

  if (setActive.status !== 200) {
    fail(
      `organization/set-active failed (${setActive.status}): ${JSON.stringify(setActive.body)}`,
    )
  }

  return mergeCookieHeader(sessionCookie, collectSetCookie(setActive.headers))
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

  const iamFeatures = await fetchJson(
    `${apiUrl}/api/v1/platform/iam-features`,
    {
      headers: { origin: consoleOrigin },
    },
  )

  if (iamFeatures.status !== 200) {
    fail(
      `iam-features failed (${iamFeatures.status}): ${JSON.stringify(iamFeatures.body)}`,
    )
  }

  const iamFeaturesBody = iamFeatures.body as {
    data?: Record<string, boolean>
    meta?: { apiVersion?: string }
  }

  if (!iamFeaturesBody.data) {
    fail('iam-features response missing data envelope')
  }

  for (const [key, value] of Object.entries(iamFeaturesBody.data)) {
    if (typeof value !== 'boolean') {
      fail(`iam-features.${key} is not a boolean`)
    }
  }

  if (!iamFeaturesBody.data.emailPassword) {
    fail('iam-features.emailPassword must be true for smoke sign-up')
  }

  const taskListsUnauthed = await fetchJson(`${apiUrl}/api/v1/task-lists`, {
    headers: { origin: consoleOrigin },
  })

  if (taskListsUnauthed.status !== 401) {
    fail(
      `expected 401 for unauthenticated task-lists, got ${taskListsUnauthed.status}`,
    )
  }

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
  let sessionCookie = cookieHeaderFromSetCookies(signUpCookies)

  if (!sessionCookie) {
    fail('sign-up did not return session cookie')
  }

  sessionCookie = await ensureActiveWorkspace(
    sessionCookie,
    iamFeaturesBody.data.workspace,
  )

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
    `smoke: ok — iam-features, user ${smokeEmail}, ${listsBody.data.length} list(s), ${tasksBody.data.length} task(s), chrome+firefox builds\n`,
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
