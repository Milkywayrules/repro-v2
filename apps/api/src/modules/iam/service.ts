import { iam } from './iam'

function getSession(headers: Headers) {
  return iam.api.getSession({ headers })
}

export const iamService = {
  getSession,
}
