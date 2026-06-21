import { uuidv7 } from 'uuidv7'

import { extensionForContentType } from './constants'

const TRAILING_SLASH = /\/$/

export function avatarObjectKey(userId: string, contentType: string): string {
  const ext = extensionForContentType(contentType)
  if (!ext) {
    throw new Error('Unsupported content type for avatar key')
  }

  return `avatars/${userId}/${uuidv7()}.${ext}`
}

export function attachmentObjectKey(
  workspaceId: string,
  taskId: string,
  contentType: string,
): string {
  const ext = extensionForContentType(contentType)
  if (!ext) {
    throw new Error('Unsupported content type for attachment key')
  }

  return `attachments/${workspaceId}/${taskId}/${uuidv7()}.${ext}`
}

export function isAvatarKeyForUser(key: string, userId: string): boolean {
  return key.startsWith(`avatars/${userId}/`)
}

export function isAttachmentKeyForTask(
  key: string,
  workspaceId: string,
  taskId: string,
): boolean {
  return key.startsWith(`attachments/${workspaceId}/${taskId}/`)
}

export function publicObjectUrl(baseUrl: string, key: string): string {
  const normalizedBase = baseUrl.replace(TRAILING_SLASH, '')
  return `${normalizedBase}/${key}`
}
