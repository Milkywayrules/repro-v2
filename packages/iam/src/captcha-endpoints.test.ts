import { describe, expect, test } from 'bun:test'

import { buildCaptchaEndpoints } from './captcha-endpoints'

describe('buildCaptchaEndpoints', () => {
  test('includes social only when github is enabled', () => {
    const withoutGithub = buildCaptchaEndpoints({
      emailPassword: true,
      magicLink: false,
      github: false,
      workspace: true,
      multiSession: true,
      captcha: true,
    })

    expect(withoutGithub).not.toContain('/sign-in/social')

    const withGithub = buildCaptchaEndpoints({
      emailPassword: true,
      magicLink: false,
      github: true,
      workspace: true,
      multiSession: true,
      captcha: true,
    })

    expect(withGithub).toContain('/sign-in/social')
  })

  test('includes magic-link only when magic link is enabled', () => {
    const withoutMagicLink = buildCaptchaEndpoints({
      emailPassword: true,
      magicLink: false,
      github: true,
      workspace: true,
      multiSession: true,
      captcha: true,
    })

    expect(withoutMagicLink).not.toContain('/sign-in/magic-link')

    const withMagicLink = buildCaptchaEndpoints({
      emailPassword: true,
      magicLink: true,
      github: true,
      workspace: true,
      multiSession: true,
      captcha: true,
    })

    expect(withMagicLink).toContain('/sign-in/magic-link')
  })
})
