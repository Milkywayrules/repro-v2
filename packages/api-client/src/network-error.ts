export function isNetworkErrorMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  return (
    normalized === 'failed to fetch' ||
    normalized === 'networkerror when attempting to fetch resource' ||
    normalized === 'load failed' ||
    normalized.includes('network request failed')
  )
}

export function normalizeNetworkErrorMessage(message: string): string | null {
  if (isNetworkErrorMessage(message)) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  return null
}

export function normalizeUnknownNetworkError(error: unknown): string {
  if (error instanceof TypeError) {
    const fromMessage = normalizeNetworkErrorMessage(error.message)
    if (fromMessage) {
      return fromMessage
    }
  }

  if (error instanceof Error) {
    const fromMessage = normalizeNetworkErrorMessage(error.message)
    if (fromMessage) {
      return fromMessage
    }
  }

  return 'Could not reach the server. Check your connection and try again.'
}
