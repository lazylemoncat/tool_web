/*
 主题管理器: 亮/暗/系统切换 + 文件上传 + 自定义主题列表.
*/

import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from '../../i18n'
import { saveTheme, exportCurrentTheme, type Theme } from '../../theme'
import { applyThemeConfig, clearThemeConfig, type ThemeConfig } from '../../themeEngine'
import { useThemes, type UserThemeBrief } from '../../hooks/useThemes'

interface Props {
  theme: Theme
  customThemeId: number | null
  onThemeChange: (theme: Theme, customThemeId: number | null) => void
}

const ThemeManager: React.FC<Props> = ({ theme, customThemeId, onThemeChange }) => {
  const { t } = useLocale()
  const { themes, loading, createTheme, getTheme, deleteTheme, refresh } = useThemes()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [previewId, setPreviewId] = useState<number | null>(customThemeId)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const handleDownloadTemplate = () => {
    const vars = exportCurrentTheme()
    const template: ThemeConfig = {
      name: 'My Theme',
      version: '1.0',
      tokens: {
        light: vars,
        dark: {},
      },
      pages: { todo: { light: {}, dark: {} } },
      buttons: [],
      scripts: '',
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theme-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const cfg = JSON.parse(reader.result as string) as ThemeConfig
        if (!cfg.tokens && !cfg.pages && !cfg.buttons && !cfg.scripts) {
          setUploadError(t('settings.invalidThemeFile'))
          return
        }
        const themeName = cfg.name || file.name.replace(/\.json$/i, '')
        const json = reader.result as string
        const created = await createTheme(themeName, json)
        if (created) {
          applyThemeConfig(cfg)
          saveTheme(theme)
          setPreviewId(created.id)
          onThemeChange(theme, created.id)
        } else {
          setUploadError(t('settings.uploadFailed'))
        }
      } catch {
        setUploadError(t('settings.invalidJson'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleApplyTheme = async (id: number) => {
    const full = await getTheme(id)
    if (!full) return
    try {
      const cfg = JSON.parse(full.config_json) as ThemeConfig
      applyThemeConfig(cfg)
      setPreviewId(id)
    } catch {
      setUploadError(t('settings.invalidJson'))
    }
  }

  const handleDeleteTheme = async (id: number) => {
    await deleteTheme(id)
    setDeleteConfirm(null)
    if (customThemeId === id || previewId === id) {
      clearThemeConfig()
      setPreviewId(null)
      onThemeChange(theme, null)
    }
  }

  const handleThemeRadio = (v: Theme) => {
    saveTheme(v)
    if (customThemeId) {
      onThemeChange(v, customThemeId)
    } else {
      onThemeChange(v, null)
    }
  }

  const isActive = (id: number) => customThemeId === id || previewId === id

  return (
    <div className="theme-manager">
      <div className="settings-section">
        <label>{t('settings.theme')}</label>
        <div className="settings-radio-group">
          {(['light', 'dark', 'matcha', 'system'] as Theme[]).map((v) => (
            <label key={v} className="settings-radio">
              <input
                type="radio"
                name="theme"
                value={v}
                checked={theme === v}
                onChange={() => handleThemeRadio(v)}
              />
              {t(`settings.${v}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <label>{t('settings.customTheme')}</label>
        <p className="settings-hint">{t('settings.customThemeHint')}</p>
        <div className="theme-actions-row">
          <button className="btn-download" onClick={handleDownloadTemplate}>
            {t('settings.downloadTemplate')}
          </button>
          <button className="btn-submit" onClick={() => fileInputRef.current?.click()}>
            {t('settings.uploadTheme')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
        {uploadError && <p className="auth-error">{uploadError}</p>}
      </div>

      <div className="settings-section">
        <label>{t('settings.myThemes')}</label>
        {loading ? (
          <p className="settings-hint">{t('settings.loading')}</p>
        ) : themes.length === 0 ? (
          <p className="settings-hint">{t('settings.noCustomThemes')}</p>
        ) : (
          <div className="theme-list">
            {themes.map((item: UserThemeBrief) => (
              <div key={item.id} className={`theme-list-item ${isActive(item.id) ? 'active' : ''}`}>
                <span className="theme-list-name">{item.name}</span>
                <div className="theme-list-actions">
                  {isActive(item.id) ? (
                    <span className="theme-active-badge">{t('settings.active')}</span>
                  ) : (
                    <button
                      className="btn-submit btn-sm"
                      onClick={() => handleApplyTheme(item.id)}
                    >
                      {t('settings.apply')}
                    </button>
                  )}
                  {deleteConfirm === item.id ? (
                    <>
                      <button
                        className="btn-cancel btn-sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        {t('app.cancel')}
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDeleteTheme(item.id)}
                      >
                        {t('app.confirm')}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-cancel btn-sm"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      {t('app.delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemeManager
