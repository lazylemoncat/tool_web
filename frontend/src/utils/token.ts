import {
  decodeTokenPayload,
  getAccessToken,
  getTokenRemainingMs,
  setAccessToken,
  shouldRefreshToken,
} from '../auth/client/token'

export { decodeTokenPayload, getTokenRemainingMs, shouldRefreshToken }

export function setToken(token: string | null): void {
  setAccessToken(token)
}

export function getToken(): string | null {
  return getAccessToken()
}

export function isTokenExpired(token: string): boolean {
  return getTokenRemainingMs(token) <= 0
}
