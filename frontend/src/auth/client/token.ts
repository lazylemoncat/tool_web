let accessToken: string | null = null
let csrfToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token
}

export function getCsrfToken(): string | null {
  return csrfToken
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

export function decodeTokenPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export function getTokenRemainingMs(token: string): number {
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return 0
  return Math.max(0, (payload.exp as number) * 1000 - Date.now())
}

export function shouldRefreshToken(token: string): boolean {
  return getTokenRemainingMs(token) < 5 * 60 * 1000
}
