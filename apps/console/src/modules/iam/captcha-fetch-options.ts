/** Headers for Better Auth captcha plugin (`x-captcha-response`). Must be top-level on the client request options — nested `fetchOptions.headers` is not merged by the auth client proxy. */
export function captchaFetchOptions(captchaToken: string | null) {
  if (!captchaToken) {
    return
  }

  return {
    headers: {
      'x-captcha-response': captchaToken,
    },
  } as const
}
