export const WORKSPACE_STORAGE_SLUG_SEPARATOR = ':'

export function workspaceStorageSlug(
  ownerUserId: string,
  publicSlug: string,
): string {
  const normalized = publicSlug.trim().toLowerCase()
  return `${ownerUserId}${WORKSPACE_STORAGE_SLUG_SEPARATOR}${normalized}`
}

export function isWorkspaceStorageSlug(
  slug: string,
  ownerUserId: string,
): boolean {
  return slug.startsWith(`${ownerUserId}${WORKSPACE_STORAGE_SLUG_SEPARATOR}`)
}

export function publicSlugFromStorageSlug(
  storageSlug: string,
  ownerUserId?: string,
): string {
  const normalized = storageSlug.trim().toLowerCase()

  if (ownerUserId) {
    const prefix = `${ownerUserId}${WORKSPACE_STORAGE_SLUG_SEPARATOR}`
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length)
    }
  }

  const separatorIndex = normalized.indexOf(WORKSPACE_STORAGE_SLUG_SEPARATOR)
  if (separatorIndex > 0) {
    return normalized.slice(separatorIndex + 1)
  }

  return normalized
}

export function parseWorkspaceMetadata(metadata: unknown): {
  publicSlug?: string
} {
  if (!metadata) {
    return {}
  }

  if (typeof metadata === 'object' && metadata !== null) {
    const record = metadata as { publicSlug?: unknown }
    if (typeof record.publicSlug === 'string') {
      return { publicSlug: record.publicSlug.trim().toLowerCase() }
    }
    return {}
  }

  if (typeof metadata === 'string') {
    try {
      return parseWorkspaceMetadata(JSON.parse(metadata))
    } catch {
      return {}
    }
  }

  return {}
}

export function workspacePublicSlug(
  storageSlug: string,
  metadata: unknown,
  ownerUserId?: string,
): string {
  const fromMetadata = parseWorkspaceMetadata(metadata).publicSlug
  if (fromMetadata) {
    return fromMetadata
  }

  return publicSlugFromStorageSlug(storageSlug, ownerUserId)
}
