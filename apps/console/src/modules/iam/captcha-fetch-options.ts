export function captchaFetchOptions(captchaToken: string | null) {
  if (!captchaToken) {
    return
  }

  return {
    fetchOptions: {
      headers: {
        'x-captcha-response': captchaToken,
      },
    },
  } as const
}
