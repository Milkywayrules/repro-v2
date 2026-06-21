import { S3Client } from '@aws-sdk/client-s3'
import { env } from '@repro-v2/env/api'

import { resolveS3Endpoint } from './endpoint'

export interface S3Env {
  accessKeyId: string
  accountId: string
  bucketPrivate: string
  bucketPublic: string
  endpoint?: string
  publicBaseUrl: string
  secretAccessKey: string
}

export function createS3ClientFromEnv(): S3Client {
  return createS3Client({
    accountId: env.S3_ACCOUNT_ID,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT,
    bucketPublic: env.S3_BUCKET_PUBLIC,
    bucketPrivate: env.S3_BUCKET_PRIVATE,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL,
  })
}

export function createS3Client(config: S3Env): S3Client {
  const endpoint = resolveS3Endpoint(config.accountId, config.endpoint)

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}
