/**
 * JWT token utilities: decode, expiry check. Reads token from in-memory store,
 * not localStorage (httpOnly cookie handles actual auth).
 */

let _token: string | null = null

export function setToken(token: string | null): void {
  _token = token
}

export function getToken(): string | null {
  return _token
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) str += "="
  return atob(str)
}

export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return true
  return (payload.exp as number) * 1000 < Date.now()
}

export function getTokenRemainingMs(token: string): number {
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return 0
  const remaining = (payload.exp as number) * 1000 - Date.now()
  return Math.max(0, remaining)
}

/** True if token expires within 5 minutes and should be refreshed pre-emptively. */
export function shouldRefreshToken(token: string): boolean {
  return getTokenRemainingMs(token) < 5 * 60 * 1000
}
