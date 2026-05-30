import api from '../../api/client'
import type { AuthenticatedResponse, LoginResponse, Preferences } from './types'

export const authClient = {
  register(username: string, password: string): Promise<AuthenticatedResponse> {
    return api.post('/auth/register', { username, password })
  },
  login(
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<LoginResponse> {
    return api.post('/auth/login', {
      username,
      password,
      remember_me: rememberMe,
    })
  },
  verifyMfa(input: {
    challenge_id: string
    method: 'totp' | 'recovery_code'
    code: string
    remember_me?: boolean
  }): Promise<AuthenticatedResponse> {
    return api.post('/auth/mfa/verify', input)
  },
  refresh(): Promise<AuthenticatedResponse> {
    return api.post('/auth/refresh')
  },
  logout(): Promise<void> {
    return api.post('/auth/logout')
  },
  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return api.put('/auth/password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },
  deleteAccount(password: string): Promise<void> {
    return api.delete('/auth/account', { data: { password } })
  },
  updatePreferences(preferences: Preferences): Promise<void> {
    return api.put('/auth/preferences', { preferences })
  },
  getPasswordPolicy(): Promise<{
    min_length: number
    require_letter: boolean
    require_digit: boolean
  }> {
    return api.get('/auth/password-policy')
  },
  startTotpSetup(): Promise<{ method_id: string; otpauth_uri: string }> {
    return api.post('/auth/mfa/totp/setup')
  },
  confirmTotpSetup(
    methodId: string,
    code: string,
  ): Promise<{ recovery_codes: string[] }> {
    return api.post('/auth/mfa/totp/confirm', { method_id: methodId, code })
  },
}
