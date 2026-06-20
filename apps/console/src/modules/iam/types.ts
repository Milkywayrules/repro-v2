import type { iamFeaturesQueryOptions } from '@repro-v2/api-client/queries'

export type PublicIamFeatures = NonNullable<
  Awaited<
    ReturnType<
      NonNullable<ReturnType<typeof iamFeaturesQueryOptions>['queryFn']>
    >
  >['data']
>
