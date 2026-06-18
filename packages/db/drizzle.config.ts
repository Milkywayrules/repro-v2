import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({
  path: '../../apps/api/.env',
})

// biome-ignore lint/style/noDefaultExport: we need this for drizzle
export default defineConfig({
  schema: './src/schema/auth.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
})
