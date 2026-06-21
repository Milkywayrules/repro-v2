import { describe, expect, test } from 'bun:test'

import { captchaFetchOptions } from './captcha-fetch-options'

describe('captchaFetchOptions', () => {
  test('returns undefined when token is null', () => {
    expect(captchaFetchOptions(null)).toBeUndefined()
  })

  test('returns x-captcha-response header when token is set', () => {
    expect(captchaFetchOptions('turnstile-token')).toEqual({
      headers: {
        'x-captcha-response': 'turnstile-token',
      },
    })
  })
})
