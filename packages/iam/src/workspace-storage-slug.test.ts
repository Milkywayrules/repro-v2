import { describe, expect, test } from 'bun:test'

import {
  isWorkspaceStorageSlug,
  publicSlugFromStorageSlug,
  workspacePublicSlug,
  workspaceStorageSlug,
} from './workspace-storage-slug'

const ownerId = '00000000-0000-7000-8000-000000000001'

describe('workspaceStorageSlug', () => {
  test('encodes owner and public slug', () => {
    expect(workspaceStorageSlug(ownerId, 'Acme')).toBe(`${ownerId}:acme`)
  })

  test('detects storage slug for owner', () => {
    const storage = workspaceStorageSlug(ownerId, 'zxc')
    expect(isWorkspaceStorageSlug(storage, ownerId)).toBe(true)
    expect(isWorkspaceStorageSlug('zxc', ownerId)).toBe(false)
  })
})

describe('publicSlugFromStorageSlug', () => {
  test('extracts public slug from storage slug', () => {
    expect(publicSlugFromStorageSlug(`${ownerId}:zxc`, ownerId)).toBe('zxc')
  })

  test('returns legacy slug unchanged', () => {
    expect(publicSlugFromStorageSlug('zxc', ownerId)).toBe('zxc')
  })

  test('extracts without owner hint when prefixed', () => {
    expect(publicSlugFromStorageSlug(`${ownerId}:zxc`)).toBe('zxc')
  })
})

describe('workspacePublicSlug', () => {
  test('prefers metadata publicSlug', () => {
    expect(
      workspacePublicSlug(`${ownerId}:other`, { publicSlug: 'zxc' }, ownerId),
    ).toBe('zxc')
  })

  test('falls back to storage slug parsing', () => {
    expect(workspacePublicSlug(`${ownerId}:zxc`, null, ownerId)).toBe('zxc')
  })
})
