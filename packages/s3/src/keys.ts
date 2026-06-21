import { uuidv7 } from 'uuidv7'

import { extensionForContentType } from './constants'

const TRAILING_SLASH = /\/$/

function isSafeStorageKey(key: string): boolean {
  return !(key.includes('..') || key.startsWith('/') || key.includes('\\'))
}

function extensionForObjectKey(
  contentType: string,
  kind: 'avatar' | 'attachment',
) {
  const ext = extensionForContentType(contentType)
  if (!ext) {
    throw new Error(`Unsupported content type for ${kind} key`)
  }

  return ext
}

export function avatarObjectKey(userId: string, contentType: string): string {
  const ext = extensionForObjectKey(contentType, 'avatar')
  return `avatars/${userId}/${uuidv7()}.${ext}`
}

export function attachmentObjectKey(
  workspaceId: string,
  taskId: string,
  contentType: string,
): string {
  const ext = extensionForObjectKey(contentType, 'attachment')
  return `attachments/${workspaceId}/${taskId}/${uuidv7()}.${ext}`
}

export function isAvatarKeyForUser(key: string, userId: string): boolean {
  return isSafeStorageKey(key) && key.startsWith(`avatars/${userId}/`)
}

export function isAttachmentKeyForTask(
  key: string,
  workspaceId: string,
  taskId: string,
): boolean {
  return (
    isSafeStorageKey(key) &&
    key.startsWith(`attachments/${workspaceId}/${taskId}/`)
  )
}

export function publicObjectUrl(baseUrl: string, key: string): string {
  const normalizedBase = baseUrl.replace(TRAILING_SLASH, '')
  return `${normalizedBase}/${key}`
}
