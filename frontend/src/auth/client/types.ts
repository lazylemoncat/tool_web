export interface CurrentUser {
  id: number
  username: string
  is_admin: boolean
}

export interface Preferences {
  theme?: string
  language?: string
  default_status_filter?: string
  custom_theme_id?: number | null
}

export interface AuthenticatedResponse {
  token: string
  username: string
  preferences: Preferences
  user?: CurrentUser
  csrf_token?: string
}

export interface MfaRequiredResponse {
  status: 'mfa_required'
  challenge_id: string
  available_methods: Array<'totp' | 'recovery_code'>
  expires_in: number
}

export type LoginResponse =
  | ({ status: 'authenticated' } & AuthenticatedResponse)
  | MfaRequiredResponse
