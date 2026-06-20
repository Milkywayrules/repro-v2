import { z } from 'zod'

/**
 * Parse `'true'` / `'false'` env strings into booleans with a default.
 * Reads {@link process.env} so empty strings are not coerced to defaults via
 * `emptyStringAsUndefined`.
 */
export function booleanEnv(envKey: string, defaultValue: boolean) {
  return z.preprocess(
    () => {
      const raw = process.env[envKey]

      if (raw === undefined) {
        return defaultValue ? 'true' : 'false'
      }

      if (raw === '') {
        return 'false'
      }

      return raw
    },
    z
      .enum(['true', 'false'], {
        error: `${envKey} must be "true" or "false"`,
      })
      .transform(value => value === 'true'),
  )
}
