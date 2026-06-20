import { z } from 'zod'

/** Parse `'true'` / `'false'` env strings into booleans with a default. */
export function booleanEnv(defaultValue: boolean) {
  return z
    .enum(['true', 'false'])
    .optional()
    .default(defaultValue ? 'true' : 'false')
    .transform(value => value === 'true')
}
