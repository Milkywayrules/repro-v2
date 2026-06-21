import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

export function workspaceSlugFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const candidate = slug.length > 0 ? slug : 'workspace'

  if (isReservedWorkspaceSlug(candidate)) {
    return `${candidate}-ws`
  }

  return candidate
}
