/*
 CustomThemePage — 自定义主题编辑器 (迁移 ThemeManager 逻辑).
*/

import React, { useState, useRef } from 'react'
import { useNavigate } from 'umi'
import { useTheme } from '../../context/ThemeContext'
import { useLocale } from '../../i18n'
import { applyThemeConfig, clearThemeConfig, type ThemeConfig } from '../../themeEngine'
import { useThemes } from '../../hooks/useThemes'
import { exportCurrentTheme } from '../../theme'
import { Button } from '../../components/ui'

const CustomThemePage: React.FC = () => {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { currentTheme, switchTheme } = useTheme()
  const { themes, loading, createTheme, getTheme, deleteTheme } = useThemes()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadError, setUploadError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const handleDownloadTemplate = () => {
    const vars = exportCurrentTheme()
    const template: ThemeConfig = {
      name: 'My Theme',
      version: '1.0',
      tokens: { light: vars, dark: {} },
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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const cfg = JSON.parse(reader.result as string) as ThemeConfig
        const name = cfg.name || file.name.replace(/\.json$/i, '')
        await createTheme(name, reader.result as string)
        applyThemeConfig(cfg)
      } catch {
        setUploadError(t('settings.invalidJson'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleApply = async (id: number) => {
    const full = await getTheme(id)
    if (!full) return
    try {
      const cfg = JSON.parse(full.config_json) as ThemeConfig
      applyThemeConfig(cfg)
    } catch {
      setUploadError(t('settings.invalidJson'))
    }
  }

  const handleDelete = async (id: number) => {
    await deleteTheme(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="standalone-page">
      <button className="settings-back-link" onClick={() => navigate('/settings/appearance')}>
        ← {t('app.back')}
      </button>
      <h2>{t('settings.customTheme')}</h2>

      <div className="settings-section-block">
        <p className="settings-hint">{t('settings.customThemeHint')}</p>
        <div className="theme-actions-row">
          <button className="btn-download" onClick={handleDownloadTemplate}>
            {t('settings.downloadTemplate')}
          </button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {t('settings.uploadTheme')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
        {uploadError && <p className="auth-error">{uploadError}</p>}
      </div>

      <div className="settings-section-block">
        <h3>{t('settings.myThemes')}</h3>
        {loading ? (
          <p className="settings-hint">{t('settings.loading')}</p>
        ) : themes.length === 0 ? (
          <p className="settings-hint">{t('settings.noCustomThemes')}</p>
        ) : (
          <div className="theme-list">
            {themes.map((item) => (
              <div key={item.id} className="theme-list-item">
                <span className="theme-list-name">{item.name}</span>
                <div className="theme-list-actions">
                  <button className="btn-submit btn-sm" onClick={() => handleApply(item.id)}>
                    {t('settings.apply')}
                  </button>
                  {deleteConfirm === item.id ? (
                    <>
                      <button className="btn-cancel btn-sm" onClick={() => setDeleteConfirm(null)}>
                        {t('app.cancel')}
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                        {t('app.confirm')}
                      </button>
                    </>
                  ) : (
                    <button className="btn-cancel btn-sm" onClick={() => setDeleteConfirm(item.id)}>
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

export default CustomThemePage
