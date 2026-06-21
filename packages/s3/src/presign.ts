import {
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const DEFAULT_PUT_EXPIRES_SECONDS = 300
const DEFAULT_GET_EXPIRES_SECONDS = 300

export async function presignPut(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = DEFAULT_PUT_EXPIRES_SECONDS,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
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
