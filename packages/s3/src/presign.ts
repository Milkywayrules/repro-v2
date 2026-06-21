import {
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const DEFAULT_PUT_EXPIRES_SECONDS = 300
const DEFAULT_GET_EXPIRES_SECONDS = 300

export function presignPutExpiresAt(
  expiresIn = DEFAULT_PUT_EXPIRES_SECONDS,
): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString()
}

export async function presignPut(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  options?: { contentLength?: number; expiresIn?: number },
): Promise<string> {
  const expiresIn = options?.expiresIn ?? DEFAULT_PUT_EXPIRES_SECONDS
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(options?.contentLength !== undefined && {
      ContentLength: options.contentLength,
    }),
  })

  return await getSignedUrl(client, command, { expiresIn })
}

export async function presignGet(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn = DEFAULT_GET_EXPIRES_SECONDS,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  return await getSignedUrl(client, command, { expiresIn })
}
