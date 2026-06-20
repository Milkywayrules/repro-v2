import { describe, expect, test } from 'bun:test'

import { type EmailKind, emailConfig } from './config'

const emailKinds = [
  'iam.magic-link',
  'iam.verify-email',
  'iam.password-reset',
  'workspace.invite',
] as const satisfies readonly EmailKind[]

describe('emailConfig', () => {
  test('defines a sender for every EmailKind', () => {
    for (const kind of emailKinds) {
      expect(emailConfig.senders[kind].from).toContain('@')
    }
  })

  test('only contains known EmailKind keys', () => {
    expect(Object.keys(emailConfig.senders).toSorted()).toEqual(
      [...emailKinds].toSorted(),
    )
  })
})
