import { createParser } from 'nuqs'
import { z } from 'zod'

const uuidSchema = z.uuid()

export const parseAsListId = createParser({
  parse(queryValue) {
    if (queryValue === '') {
      return null
    }

    const result = uuidSchema.safeParse(queryValue)
    return result.success ? result.data : null
  },
  serialize(value) {
    return value ?? ''
  },
})
