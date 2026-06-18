import { describe, expect, test } from 'bun:test'

import { createId } from './id'

const uuidV7Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('createId', () => {
  test('returns a UUID v7 string', () => {
    const id = createId()

    expect(id).toMatch(uuidV7Pattern)
  })

  test('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()))

    expect(ids.size).toBe(100)
  })

  test('generates monotonically increasing identifiers', () => {
    const first = createId()
    const second = createId()

    expect(first.localeCompare(second)).toBeLessThan(0)
  })
})
