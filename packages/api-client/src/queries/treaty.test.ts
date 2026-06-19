import { describe, expect, test } from 'bun:test'

import { errorCodes } from '@repro-v2/api-types/constants'

import { unwrapTreatyResponse } from './treaty'

describe('unwrapTreatyResponse', () => {
  test('returns data when present', () => {
    const body = { data: [{ id: '1' }], meta: { total: 1 } }

    expect(
      unwrapTreatyResponse({
        data: body,
        error: null,
      }),
    ).toEqual(body)
  })

  test('throws treaty error', () => {
    const error = {
      value: {
        error: {
          code: errorCodes.NOT_FOUND,
          message: 'Not found',
        },
      },
    }

    expect(() =>
      unwrapTreatyResponse({
        data: null,
        error,
      }),
    ).toThrow()
  })

  test('throws on empty response', () => {
    expect(() =>
      unwrapTreatyResponse({
        data: null,
        error: null,
      }),
    ).toThrow('Empty treaty response')
  })
})
