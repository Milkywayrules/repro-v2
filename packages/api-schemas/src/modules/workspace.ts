import { z } from 'zod'

export const workspaceSlugParams = z.object({
  workspaceSlug: z.string().min(1),
})
