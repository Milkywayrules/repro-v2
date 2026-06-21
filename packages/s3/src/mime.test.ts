import { describe, expect, test } from 'bun:test'

import { normalizeMimeType } from './mime'

describe('normalizeMimeType', () => {
  test('strips parameter suffixes', () => {
    expect(normalizeMimeType('image/png; charset=binary')).toBe('image/png')
    expect(normalizeMimeType('application/pdf; name=file.pdf')).toBe(
      'application/pdf',
    )
  })

  test('returns bare MIME unchanged', () => {
    expect(normalizeMimeType('image/jpeg')).toBe('image/jpeg')
  })
})
