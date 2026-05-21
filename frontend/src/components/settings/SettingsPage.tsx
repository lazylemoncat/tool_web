import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../i18n'
import { saveTheme, type Theme } from '../../theme'
import { clearThemeConfig } from '../../themeEngine'
import ThemeManager from './ThemeManager'
import AccountSettings from '../auth/AccountSettings'

const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const navigate = useNavigate()

  const [filter, setFilter] = useState(preferences.default_status_filter || 'all')
  const [theme, setTheme] = useState<Theme>((preferences.theme as Theme) || 'system')
  const [customThemeId, setCustomThemeId] = useState<number | null>(
    () => (preferences as any).custom_theme_id ?? null,
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (saved) navigate('/')
  }, [saved, navigate])

  useEffect(() => {
    return () => { clearThemeConfig() }
  }, [])

  const handleThemeChange = (newTheme: Theme, newCustomThemeId: number | null) => {
    setTheme(newTheme)
    setCustomThemeId(newCustomThemeId)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const prefs: any = {
        ...preferences,
        default_status_filter: filter,
        theme,
        language: locale,
        custom_theme_id: customThemeId,
      }
      await updatePreferences(prefs)
      saveTheme(theme)
      if (locale !== preferences.language) setLocale(locale)
      setSaved(true)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-header">
          <button className="settings-back" onClick={() => navigate('/')}>
            ← {t('app.back')}
          </button>
          <h1>{t('settings.title')}</h1>
        </div>

        <div className="settings-section">
          <label>{t('settings.defaultFilter')}</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{t('todo.all')}</option>
            <option value="active">{t('todo.active')}</option>
            <option value="completed">{t('todo.completed')}</option>
          </select>
        </div>

        <ThemeManager
          theme={theme}
          customThemeId={customThemeId}
          onThemeChange={handleThemeChange}
        />

        <div className="settings-section">
          <label>{t('settings.language')}</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value as 'zh' | 'en')}>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <AccountSettings />

        <button className="btn-submit" onClick={handleSave} disabled={saving}>
          {saving ? t('app.saving') : t('settings.save')}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
