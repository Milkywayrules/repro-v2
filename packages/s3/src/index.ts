// biome-ignore lint/performance/noBarrelFile: package public entry
export {
  createS3Client,
  createS3ClientFromEnv,
  type S3Env,
} from './client'
export {
  ALLOWED_CONTENT_TYPES,
  type AllowedContentType,
  extensionForContentType,
  isAllowedContentType,
  isWithinSizeLimit,
  MAX_OBJECT_BYTES,
} from './constants'
export { resolveS3Endpoint } from './endpoint'
export { type HeadObjectResult, headObject } from './head'
export {
  attachmentObjectKey,
  avatarObjectKey,
  isAttachmentKeyForTask,
  isAvatarKeyForUser,
  publicObjectUrl,
} from './keys'
export { normalizeMimeType } from './mime'
export {
  DEFAULT_PUT_EXPIRES_SECONDS,
  presignGet,
  presignPut,
  presignPutExpiresAt,
} from './presign'
