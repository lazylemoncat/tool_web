import React, { useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'umi'
import { useAuth } from '../context/AuthContext'
import { LocaleProvider } from '../i18n'
import { initTheme } from '../theme'
import { applyThemeConfig, switchPage } from '../themeEngine'
import api from '../api/client'
import { ThemeProvider } from '../context/ThemeContext'
import { ConfirmDialogProvider } from '../components/ui'
import AuthPage from '../components/auth/AuthPage'
import AppTopBar from '../components/layout/AppTopBar'
import { getThemePageFromPath } from '../utils/pageTheme'

const AppLayout: React.FC = () => {
  const { token, preferences, sessionChecked, username, logout } = useAuth()
  const location = useLocation()
  const lang = (preferences.language as 'zh' | 'en') || 'zh'
  const themePage = useMemo(
    () => getThemePageFromPath(location.pathname),
    [location.pathname],
  )

  useEffect(() => {
    initTheme(preferences)
  }, [preferences])

  useEffect(() => {
    switchPage(themePage)
    if (themePage) {
      document.documentElement.dataset.page = themePage
    } else {
      delete document.documentElement.dataset.page
    }
  }, [themePage])

  useEffect(() => {
    const customId = preferences.custom_theme_id
    if (!customId) return
    api.get(`/themes/${customId}`)
      .then((data: any) => {
        try {
          applyThemeConfig(JSON.parse(data.config_json))
        } catch {
          // ignore invalid saved theme
        }
      })
      .catch(() => {})
  }, [preferences.custom_theme_id])

  if (!sessionChecked) {
    return (
      <LocaleProvider initial={lang}>
        <div className="app-layout">
          <main className="main-area">
            <div className="empty-state"><p>Loading...</p></div>
          </main>
        </div>
      </LocaleProvider>
    )
  }

  if (!token) {
    if (process.env.NODE_ENV === 'development' && location.pathname === '/ui-preview') {
      return (
        <LocaleProvider initial={lang}>
          <ConfirmDialogProvider>
            <Outlet />
          </ConfirmDialogProvider>
        </LocaleProvider>
      )
    }

    return (
      <LocaleProvider initial={lang}>
        <AuthPage />
      </LocaleProvider>
    )
  }

  return (
    <LocaleProvider initial={lang}>
      <ThemeProvider>
        <ConfirmDialogProvider>
          <AppTopBar username={username!} onLogout={logout} />
          <div className={`app-main-content ${themePage ? `app-main-content-${themePage}` : ''}`}>
            <Outlet />
          </div>
        </ConfirmDialogProvider>
      </ThemeProvider>
    </LocaleProvider>
  )
}

export default AppLayout
