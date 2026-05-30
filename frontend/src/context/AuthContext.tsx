/*
 认证上下文: cookie-based token, login/register/logout, 偏好同步, changePassword/deleteAccount.
*/

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import axios from 'axios'
import { authClient } from '../auth/client/AuthClient'
import { setAccessToken, setCsrfToken } from '../auth/client/token'

interface Preferences {
  theme?: string
  language?: string
  default_status_filter?: string
  custom_theme_id?: number | null
}

interface AuthState {
  token: string | null
  username: string | null
  preferences: Preferences
  loading: boolean
  sessionChecked: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  updatePreferences: (prefs: Preferences) => Promise<void>
}

const defaultPreferences: Preferences = {
  theme: 'system',
  language: 'zh',
  default_status_filter: 'all',
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem('preferences')
    return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Token lives in memory (httpOnly cookie handles actual auth), but we keep
  // a copy for expiry checks. On mount, we don't know if the cookie exists;
  // the first API call will confirm via 200 or 401.
  const [token, setTokenState] = useState<string | null>(() => null)
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'))
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [loading, setLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  const savePrefs = (prefs: Preferences) => {
    setPreferences(prefs)
    localStorage.setItem('preferences', JSON.stringify(prefs))
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const body = res.data
        if (!cancelled && body.token) {
          setAccessToken(body.token)
          setTokenState(body.token)
          setCsrfToken(body.csrf_token || null)
          localStorage.setItem('username', body.username)
          setUsername(body.username)
          if (body.preferences) {
            savePrefs({ ...defaultPreferences, ...body.preferences })
          }
        }
      } catch {} finally {
        if (!cancelled) setSessionChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleAuthSuccess = (data: any) => {
    setAccessToken(data.token)
    setTokenState(data.token)
    setCsrfToken(data.csrf_token || null)
    localStorage.setItem('username', data.username)
    setUsername(data.username)
    if (data.preferences) {
      savePrefs({ ...defaultPreferences, ...data.preferences })
    }
  }

  const login = useCallback(async (u: string, p: string, rememberMe: boolean = false) => {
    setLoading(true)
    try {
      const data = await authClient.login(u, p, rememberMe) as any
      if (data.status === 'mfa_required') {
        throw new Error('MFA required')
      }
      handleAuthSuccess(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (u: string, p: string) => {
    setLoading(true)
    try {
      const data = await authClient.register(u, p) as any
      handleAuthSuccess(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authClient.logout()
    } catch {
      // ignore errors — clear state regardless
    }
    setAccessToken(null)
    setCsrfToken(null)
    setTokenState(null)
    localStorage.removeItem('username')
    setUsername(null)
  }, [])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await authClient.changePassword(oldPassword, newPassword)
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    await authClient.deleteAccount(password)
    setAccessToken(null)
    setCsrfToken(null)
    setTokenState(null)
    localStorage.removeItem('username')
    setUsername(null)
  }, [])

  const updatePreferences = useCallback(async (prefs: Preferences) => {
    await authClient.updatePreferences(prefs)
    savePrefs(prefs)
  }, [])

  const value = useMemo(() => ({
    token, username, preferences, loading, sessionChecked, login, register, logout,
    changePassword, deleteAccount, updatePreferences,
  }), [token, username, preferences, loading, sessionChecked, login, register, logout,
       changePassword, deleteAccount, updatePreferences])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
