import { describe, expect, test } from 'bun:test'

import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { v1Routes } from '@/routes/v1'

describe('csrf origin validation', () => {
  const app = new Elysia().use(http.plugin()).use(v1Routes)

  test('POST /api/v1/task-lists rejects disallowed Origin with 403', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Blocked' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('POST /api/v1/task-lists rejects disallowed Referer when Origin absent', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          Referer: 'https://evil.example/page',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Blocked referer' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('POST /api/v1/task-lists allows configured Referer when Origin absent', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          Referer: `${env.CORS_ORIGIN}/tasks`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Allowed referer' }),
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('POST /api/v1/task-lists allows configured CORS_ORIGIN', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Allowed origin' }),
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('POST /api/v1/task-lists rejects missing Origin, Referer, and X-Requested-With', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Same origin' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('POST /api/v1/task-lists allows X-Requested-With when Origin and Referer absent', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ name: 'Api client' }),
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('POST /api/v1/task-lists allows X-Requested-With when Referer is unparseable', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'not-a-valid-url',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ name: 'Api client' }),
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('POST /api/v1/task-lists rejects unparseable Referer without X-Requested-With', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'not-a-valid-url',
        },
        body: JSON.stringify({ name: 'Blocked referer' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('GET /api/v1/task-lists ignores disallowed Origin', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/task-lists', {
        headers: {
          Origin: 'https://evil.example',
        },
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })
})
