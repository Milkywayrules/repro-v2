import { describe, expect, test } from 'bun:test'

import {
  isNetworkErrorMessage,
  normalizeNetworkErrorMessage,
  normalizeUnknownNetworkError,
} from './network-error'

describe('network-error', () => {
  test('detects common fetch failure messages', () => {
    expect(isNetworkErrorMessage('Failed to fetch')).toBe(true)
    expect(
      isNetworkErrorMessage('NetworkError when attempting to fetch resource'),
    ).toBe(true)
    expect(isNetworkErrorMessage('Load failed')).toBe(true)
  })

  test('normalizes known network messages', () => {
    expect(normalizeNetworkErrorMessage('Failed to fetch')).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })

  test('returns null for unrelated messages', () => {
    expect(normalizeNetworkErrorMessage('Upload link expired')).toBeNull()
  })

  test('normalizes TypeError fetch failures', () => {
    expect(normalizeUnknownNetworkError(new TypeError('Failed to fetch'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })
})
