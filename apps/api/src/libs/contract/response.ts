import type {
  ApiMeta,
  ErrorBody,
  ErrorEnvelope,
  SuccessEnvelope,
} from '@repro-v2/api-types/contract'

export function ok<T>(data: T, meta?: ApiMeta): SuccessEnvelope<T> {
  if (meta === undefined) {
    return { data }
  }

  return { data, meta }
}

export function fail(body: ErrorBody): ErrorEnvelope {
  return { error: body }
}
