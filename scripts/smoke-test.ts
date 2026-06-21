#!/usr/bin/env bun

/**
 * Smoke checks for IAM (features, sign-up/sign-in, captcha, social), tasks, and browser-ext builds.
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

/** Cloudflare Turnstile always-pass test token (visible widget). */
const TURNSTILE_TEST_TOKEN = '1x00000000000000000000AA'

const sleep = (ms: number) =>
  new Promise<void>(resolveSleep => {
    setTimeout(resolveSleep, ms)
  })

function fail(message: string) {
  throw new Error(message)
}

function logStep(message: string) {
  process.stdout.write(`smoke: ${message}\n`)
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

type IamFeatureFlags = Record<string, boolean>

function authJsonHeaders(
  sessionCookie: string,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    cookie: sessionCookie,
    origin: consoleOrigin,
    'content-type': 'application/json',
    ...extra,
  }
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
  let firstOrg = organizations?.[0]

  if (!firstOrg) {
    const slug = `smoke-ws-${Date.now()}`
    const create = await fetchJson(`${apiUrl}/api/auth/organization/create`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Smoke workspace',
        slug,
      }),
    })

    if (create.status !== 200) {
      fail(
        `organization/create failed (${create.status}): ${JSON.stringify(create.body)}`,
      )
    }

    const created = create.body as { id?: string } | null
    if (!created?.id) {
      fail('organization/create did not return workspace id')
    }

    firstOrg = { id: created.id }
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

async function signUpEmail(input: {
  email: string
  password: string
  name: string
  captchaToken?: string
}): Promise<{ status: number; body: unknown; sessionCookie: string }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: consoleOrigin,
  }

  if (input.captchaToken) {
    headers['x-captcha-response'] = input.captchaToken
  }

  const signUp = await fetchJson(`${apiUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name,
    }),
  })

  const sessionCookie = cookieHeaderFromSetCookies(
    collectSetCookie(signUp.headers),
  )

  return { status: signUp.status, body: signUp.body, sessionCookie }
}

async function signInEmail(input: {
  email: string
  password: string
  captchaToken?: string
}): Promise<{ status: number; body: unknown; sessionCookie: string }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: consoleOrigin,
  }

  if (input.captchaToken) {
    headers['x-captcha-response'] = input.captchaToken
  }

  const signIn = await fetchJson(`${apiUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  })

  const sessionCookie = cookieHeaderFromSetCookies(
    collectSetCookie(signIn.headers),
  )

  return { status: signIn.status, body: signIn.body, sessionCookie }
}

function getSession(sessionCookie: string) {
  return fetchJson(`${apiUrl}/api/auth/get-session`, {
    headers: { cookie: sessionCookie, origin: consoleOrigin },
  })
}

function signOut(sessionCookie: string) {
  return fetchJson(`${apiUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: authJsonHeaders(sessionCookie),
    body: JSON.stringify({}),
  })
}

async function smokeCaptchaEndpoints(features: IamFeatureFlags) {
  if (!features.captcha) {
    logStep('captcha disabled — skip captcha enforcement checks')
    return
  }

  logStep('captcha enabled — checking auth endpoints reject missing token')

  const probeEmail = `captcha-probe-${Date.now()}@example.com`
  const probePassword = 'captcha-probe-password'

  const signUpWithoutCaptcha = await signUpEmail({
    email: probeEmail,
    password: probePassword,
    name: 'Captcha Probe',
  })

  if (signUpWithoutCaptcha.status === 200) {
    fail(
      'expected sign-up without captcha token to fail when captcha is enabled',
    )
  }

  const signInWithoutCaptcha = await signInEmail({
    email: probeEmail,
    password: probePassword,
  })

  if (signInWithoutCaptcha.status === 200) {
    fail(
      'expected sign-in without captcha token to fail when captcha is enabled',
    )
  }

  if (features.github) {
    const socialWithoutCaptcha = await fetchJson(
      `${apiUrl}/api/auth/sign-in/social`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: consoleOrigin,
        },
        body: JSON.stringify({ provider: 'github' }),
      },
    )

    if (socialWithoutCaptcha.status === 200) {
      fail(
        'expected sign-in/social without captcha token to fail when captcha is enabled',
      )
    }
  }

  const signUpWithTestToken = await signUpEmail({
    email: `captcha-ok-${Date.now()}@example.com`,
    password: probePassword,
    name: 'Captcha OK',
    captchaToken: TURNSTILE_TEST_TOKEN,
  })

  if (signUpWithTestToken.status !== 200) {
    fail(
      `sign-up with Turnstile test token failed (${signUpWithTestToken.status}): ${JSON.stringify(signUpWithTestToken.body)} — use TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA for smoke`,
    )
  }

  logStep('captcha enforcement ok')
}

async function smokeGithubSocial(features: IamFeatureFlags) {
  if (!features.github) {
    logStep('github disabled — skip social sign-in probe')
    return
  }

  logStep('github enabled — probing sign-in/social (no OAuth completion)')

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: consoleOrigin,
  }

  if (features.captcha) {
    headers['x-captcha-response'] = TURNSTILE_TEST_TOKEN
  }

  const social = await fetchJson(`${apiUrl}/api/auth/sign-in/social`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: 'github',
      callbackURL: `${consoleOrigin}/login`,
    }),
  })

  // Without real GitHub OAuth credentials this may be 400/500; we only require it not succeed as anonymous session.
  if (social.status === 200) {
    const body = social.body as { url?: string; redirect?: boolean } | null
    if (!body || (typeof body === 'object' && !('url' in body))) {
      fail('unexpected 200 from sign-in/social without OAuth redirect payload')
    }
  }

  logStep(`github social probe responded ${social.status}`)
}

async function smokeMagicLink(features: IamFeatureFlags) {
  if (!features.magicLink) {
    logStep('magic link disabled — skip')
    return
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: consoleOrigin,
  }

  if (features.captcha) {
    headers['x-captcha-response'] = TURNSTILE_TEST_TOKEN
  }

  const magicLink = await fetchJson(`${apiUrl}/api/auth/sign-in/magic-link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: `magic-${Date.now()}@example.com`,
      callbackURL: `${consoleOrigin}/login`,
    }),
  })

  if (magicLink.status !== 200) {
    fail(
      `magic-link request failed (${magicLink.status}): ${JSON.stringify(magicLink.body)}`,
    )
  }

  logStep('magic-link request ok')
}

async function smokePasswordReset(features: IamFeatureFlags) {
  if (!features.emailPassword) {
    return
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: consoleOrigin,
  }

  if (features.captcha) {
    headers['x-captcha-response'] = TURNSTILE_TEST_TOKEN
  }

  const reset = await fetchJson(`${apiUrl}/api/auth/request-password-reset`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: `reset-${Date.now()}@example.com`,
      redirectTo: `${consoleOrigin}/login`,
    }),
  })

  if (reset.status === 400) {
    const body = reset.body as { code?: string }
    if (body.code === 'RESET_PASSWORD_DISABLED') {
      logStep('password reset not configured — skip')
      return
    }
  }

  if (reset.status !== 200) {
    fail(
      `request-password-reset failed (${reset.status}): ${JSON.stringify(reset.body)}`,
    )
  }

  logStep('password-reset request ok')
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

  const nodeEnv = process.env.NODE_ENV ?? 'undefined'
  logStep(`NODE_ENV=${nodeEnv}`)
  const expectDemoSeed = nodeEnv === 'development'

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

  const features = iamFeaturesBody.data

  await smokeCaptchaEndpoints(features)
  await smokePasswordReset(features)
  await smokeMagicLink(features)
  await smokeGithubSocial(features)

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

  const captchaToken = features.captcha ? TURNSTILE_TEST_TOKEN : undefined

  const signUp = await signUpEmail({
    email: smokeEmail,
    password: smokePassword,
    name: smokeName,
    captchaToken,
  })

  if (signUp.status !== 200) {
    fail(`sign-up failed (${signUp.status}): ${JSON.stringify(signUp.body)}`)
  }

  let sessionCookie = signUp.sessionCookie

  if (!sessionCookie) {
    fail('sign-up did not return session cookie')
  }

  const sessionAfterSignUp = await getSession(sessionCookie)
  if (sessionAfterSignUp.status !== 200) {
    fail(`get-session after sign-up failed (${sessionAfterSignUp.status})`)
  }

  const sessionUser = sessionAfterSignUp.body as { user?: { email?: string } }
  if (sessionUser.user?.email !== smokeEmail) {
    fail('get-session email mismatch after sign-up')
  }

  logStep('sign-up + get-session ok')

  const wrongPassword = await signInEmail({
    email: smokeEmail,
    password: 'wrong-password',
    captchaToken,
  })

  if (wrongPassword.status === 200) {
    fail('expected sign-in with wrong password to fail')
  }

  logStep('sign-in wrong password rejected')

  const signOutResult = await signOut(sessionCookie)
  if (signOutResult.status !== 200) {
    fail(
      `sign-out failed (${signOutResult.status}): ${JSON.stringify(signOutResult.body)}`,
    )
  }

  const sessionAfterSignOut = await getSession(sessionCookie)
  if (
    sessionAfterSignOut.status === 200 &&
    (sessionAfterSignOut.body as { user?: unknown } | null)?.user
  ) {
    fail('session still active after sign-out')
  }

  logStep('sign-out ok')

  const signIn = await signInEmail({
    email: smokeEmail,
    password: smokePassword,
    captchaToken,
  })

  if (signIn.status !== 200) {
    fail(`sign-in failed (${signIn.status}): ${JSON.stringify(signIn.body)}`)
  }

  sessionCookie = signIn.sessionCookie
  if (!sessionCookie) {
    fail('sign-in did not return session cookie')
  }

  logStep('sign-in ok')

  sessionCookie = await ensureActiveWorkspace(
    sessionCookie,
    features.workspace ?? false,
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

  let seededTaskCount = 0

  if (expectDemoSeed) {
    if (!listsBody.data || listsBody.data.length === 0) {
      fail(
        'expected first workspace to seed at least one task list in development',
      )
    }

    const sampleList = listsBody.data.find(
      list => list.name === 'Sample tasks (safe to delete)',
    )
    if (!sampleList) {
      fail('expected sample task list from dev seed after onboarding')
    }

    const tasks = await fetchJson(
      `${apiUrl}/api/v1/tasks?listId=${encodeURIComponent(sampleList.id)}`,
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

    seededTaskCount = tasksBody.data.length
  } else {
    logStep('skipping demo seed assertions (NODE_ENV is not development)')
  }

  const listCount = listsBody.data?.length ?? 0

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
    `smoke: ok — iam-features, auth flows, user ${smokeEmail}, ${listCount} list(s)${expectDemoSeed ? `, ${seededTaskCount} seeded task(s)` : ''}, chrome+firefox builds\n`,
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
