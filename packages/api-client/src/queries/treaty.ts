interface TreatyResult<T> {
  data: T | null
  error: unknown
}

export function unwrapTreatyResponse<T>(response: TreatyResult<T>): T {
  if (response.error) {
    throw response.error
  }

  if (response.data === null) {
    throw new Error('Empty treaty response')
  }

  return response.data
}
