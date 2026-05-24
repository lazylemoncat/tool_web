/*
 AppearanceSection — 主题预设选择 + 自定义主题列表入口.
*/

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useLocale } from '../../../i18n'
import { Button } from '../../ui'

const AppearanceSection: React.FC = () => {
  const { currentTheme, switchTheme, themes, applyCustomTheme, clearCustomTheme } = useTheme()
  const { t } = useLocale()
  const navigate = useNavigate()

  const presets = ['light', 'dark', 'matcha', 'system'] as const

  return (
    <div>
      <h2>{t('settings.appearance')}</h2>

      <div className="settings-section-block">
        <h3>{t('settings.theme')}</h3>
        <div className="settings-radio-group" style={{ maxWidth: 400 }}>
          {presets.map((v) => (
            <label key={v} className="settings-radio">
              <input
                type="radio"
                name="appearance-theme"
                value={v}
                checked={currentTheme === v}
                onChange={() => switchTheme(v)}
              />
              {t(`settings.${v}`)}
            </label>
          ))}
        </div>
        {currentTheme === 'custom' && (
          <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--color-fg-muted)' }}>
            {t('settings.customThemeActive')}
            <button
              className="settings-back-link"
              onClick={clearCustomTheme}
              style={{ marginLeft: 8 }}
            >
              {t('settings.revertToDefault')}
            </button>
          </p>
        )}
      </div>

      <div className="settings-section-block">
        <h3>{t('settings.customTheme')}</h3>
        <p>{t('settings.customThemeHint')}</p>
        <Button variant="secondary" onClick={() => navigate('/settings/appearance/custom')}>
          {t('settings.manageCustomThemes')}
        </Button>
      </div>
    </div>
  )
}

export default AppearanceSection
