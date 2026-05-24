/*
 ThemeContext — 响应式主题 Context.
 包装 themeEngine 状态, 提供 useTheme() hook.
*/

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onThemeChange, applyThemeConfig, clearThemeConfig, getActiveConfig } from '../themeEngine'
import { saveTheme, applyTheme, type Theme } from '../theme'
import { useThemes, type UserThemeBrief } from '../hooks/useThemes'
import api from '../api/client'

export type CurrentTheme = 'light' | 'dark' | 'matcha' | 'system' | 'custom'

interface ThemeContextValue {
  currentTheme: CurrentTheme
  themes: UserThemeBrief[]
  switchTheme: (name: string) => void
  applyCustomTheme: (themeId: number) => Promise<void>
  clearCustomTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: 'system',
  themes: [],
  switchTheme: () => {},
  applyCustomTheme: async () => {},
  clearCustomTheme: () => {},
})

function readStoredTheme(): CurrentTheme {
  return (localStorage.getItem('theme') as CurrentTheme) || 'system'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themes } = useThemes()
  const [currentTheme, setCurrentTheme] = useState<CurrentTheme>(readStoredTheme)

  useEffect(() => {
    return onThemeChange((config) => {
      setCurrentTheme(config ? 'custom' : readStoredTheme())
    })
  }, [])

  const switchTheme = useCallback((name: string) => {
    if (getActiveConfig()) {
      clearThemeConfig()
    }
    saveTheme(name as Theme)
    setCurrentTheme(name as CurrentTheme)
  }, [])

  const applyCustomThemeHandler = useCallback(async (themeId: number) => {
    const data = await api.get(`/themes/${themeId}`) as any
    const config = JSON.parse(data.config_json)
    applyThemeConfig(config)
    setCurrentTheme('custom')
  }, [])

  const clearCustomThemeHandler = useCallback(() => {
    clearThemeConfig()
    const stored = readStoredTheme()
    applyTheme(stored as Theme)
    setCurrentTheme(stored)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themes,
        switchTheme,
        applyCustomTheme: applyCustomThemeHandler,
        clearCustomTheme: clearCustomThemeHandler,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
