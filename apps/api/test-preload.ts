import dotenv from 'dotenv'

import { resolve } from 'node:path'

dotenv.config({ path: resolve(import.meta.dir, '.env') })

const s3TestDefaults: Record<string, string> = {
  S3_ACCOUNT_ID: '00000000000000000000000000000000',
  S3_ACCESS_KEY_ID: 'test-access-key',
  S3_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET_PUBLIC: 'test-public-bucket',
  S3_BUCKET_PRIVATE: 'test-private-bucket',
  S3_PUBLIC_BASE_URL: 'https://cdn.example.test',
}

for (const [key, value] of Object.entries(s3TestDefaults)) {
  if (!process.env[key]) {
    process.env[key] = value
  }
}
