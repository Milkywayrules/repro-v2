import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import type { UploadMeta } from '../upload-limits'
import { unwrapTreatyResponse } from './treaty'

export async function presignAvatar(client: ApiClient, body: UploadMeta) {
  const response = await client.api.v1.me.avatar.presign.post(body)
  return unwrapTreatyResponse(response)
}

export async function completeAvatar(
  client: ApiClient,
  body: { key: string; sizeBytes: number },
) {
  const response = await client.api.v1.me.avatar.complete.post(body)
  return unwrapTreatyResponse(response)
}

export function meProfileQueryOptions(client: ApiClient) {
  return queryOptions({
    queryKey: ['me', 'profile'] as const,
    queryFn: async () => {
      const response = await client.api.v1.get()
      return unwrapTreatyResponse(response)
    },
  })
}
