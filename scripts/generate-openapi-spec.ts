#!/usr/bin/env bun

import dotenv from 'dotenv'

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = resolve(import.meta.dir, '..')
dotenv.config({ path: resolve(rootDir, 'apps/api/.env') })

// Force OpenAPI on so prod .env (OPENAPI_ENABLED=false) does not break generation.
process.env.OPENAPI_ENABLED = 'true'

const generatedDir = resolve(rootDir, 'packages/api-types/src/generated')
const specPath = resolve(generatedDir, 'openapi.json')

mkdirSync(generatedDir, { recursive: true })

try {
  const { createApp } = await import('../apps/api/src/app.ts')
  const app = createApp()

  const response = await app.handle(
    new Request('http://localhost/openapi/json'),
  )

  if (!response.ok) {
    process.stderr.write(
      `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}\n`,
    )
    process.exit(1)
  }

  const spec = await response.json()
  writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Failed to generate OpenAPI spec: ${message}\n`)
  process.exit(1)
}
