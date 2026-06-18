import { HTTP_CONTENT_TYPE_JSON } from './constants'

export interface ApiMeta {
  [key: string]: unknown
}

export interface SuccessEnvelope<T> {
  data: T
  meta?: ApiMeta
}

export interface ErrorBody {
  code: string
  details?: unknown
  fix?: string
  link?: string
  message: string
  why?: string
}

export interface ErrorEnvelope {
  error: ErrorBody
}

export function ok<T>(data: T, meta?: ApiMeta): SuccessEnvelope<T> {
  if (meta === undefined) {
    return { data }
  }

  return { data, meta }
}

export function fail(body: ErrorBody): ErrorEnvelope {
  return { error: body }
}

export function jsonResponse(
  status: number,
  body: SuccessEnvelope<unknown> | ErrorEnvelope,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': HTTP_CONTENT_TYPE_JSON },
  })
}
