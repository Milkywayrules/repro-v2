import { iamFeaturesQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

export function useIamFeatures() {
  const query = useQuery(iamFeaturesQueryOptions(apiClient))

  return {
    ...query,
    features: query.data?.data,
  }
}
