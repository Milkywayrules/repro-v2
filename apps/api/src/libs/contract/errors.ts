import { http } from '@/libs/contract'

export function unauthorizedError() {
  return http.error({
    code: http.codes.UNAUTHORIZED,
    message: http.messages.UNAUTHORIZED,
    status: http.status.UNAUTHORIZED,
  })
}

export function notFoundError() {
  return http.error({
    code: http.codes.NOT_FOUND,
    message: http.messages.NOT_FOUND,
    status: http.status.NOT_FOUND,
  })
}

export function forbiddenError() {
  return http.error({
    code: http.codes.FORBIDDEN,
    message: http.messages.FORBIDDEN,
    status: http.status.FORBIDDEN,
  })
}

export function conflictError(message: string) {
  return http.error({
    code: http.codes.CONFLICT,
    message,
    status: http.status.CONFLICT,
  })
}

export function internalServerError() {
  return http.error({
    code: http.codes.INTERNAL_SERVER_ERROR,
    message: http.messages.INTERNAL_SERVER_ERROR,
    status: http.status.INTERNAL_SERVER_ERROR,
  })
}
