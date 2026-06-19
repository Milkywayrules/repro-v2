import { auth } from './auth'

function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}

export const authService = {
  getSession,
}
