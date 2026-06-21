import { HeadObjectCommand, type S3Client } from '@aws-sdk/client-s3'

export interface HeadObjectResult {
  contentLength: number | undefined
  contentType: string | undefined
  exists: boolean
}

export async function headObject(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<HeadObjectResult> {
  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )

    return {
      exists: true,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    }
  } catch (error) {
    const statusCode =
      error &&
      typeof error === 'object' &&
      '$metadata' in error &&
      error.$metadata &&
      typeof error.$metadata === 'object' &&
      'httpStatusCode' in error.$metadata
        ? error.$metadata.httpStatusCode
        : undefined

    if (statusCode === 404) {
      return {
        exists: false,
        contentType: undefined,
        contentLength: undefined,
      }
    }

    throw error
  }
}
