/*
 LocaleSection — 语言 / 时区 / 日期格式.
*/

import React from 'react'
import { useI18n } from '../../../context/I18nContext'
import { useAuth } from '../../../context/AuthContext'
import { useLocale } from '../../../i18n'

const LocaleSection: React.FC = () => {
  const { locale, setLocale, t } = useLocale()
  const { preferences, updatePreferences } = useAuth()

  const handleLocaleChange = async (l: 'zh' | 'en') => {
    setLocale(l)
    try {
      await updatePreferences({ ...preferences, language: l })
    } catch { /* ignore */ }
  }

  return (
    <div>
      <h2>{t('settings.locale')}</h2>

      <div className="settings-section-block">
        <h3>{t('settings.language')}</h3>
        <select value={locale} onChange={(e) => handleLocaleChange(e.target.value as 'zh' | 'en')}>
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  )
}

export default LocaleSection
