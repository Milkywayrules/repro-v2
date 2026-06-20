import { z } from 'zod'

export const apiV1MetaSchema = z.object({
  apiVersion: z.string().optional(),
})

export function okV1Envelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: apiV1MetaSchema.optional(),
  })
}
