import { describe, expect, test } from 'bun:test'

import {
  ALLOWED_CONTENT_TYPES,
  isAllowedContentType,
  MAX_OBJECT_BYTES,
} from '@repro-v2/s3/constants'

describe('@repro-v2/s3/constants subpath', () => {
  test('exports upload limits without server dependencies', () => {
    expect(MAX_OBJECT_BYTES).toBe(10 * 1024 * 1024)
    expect(ALLOWED_CONTENT_TYPES).toContain('image/png')
    expect(isAllowedContentType('image/png')).toBe(true)
    expect(isAllowedContentType('application/octet-stream')).toBe(false)
  })
})
