/*
 SettingsPage — 设置独立页, 左侧分组导航 + 右侧内容区 (<Outlet />).
*/

import React from 'react'
import { Outlet, NavLink, useNavigate } from 'umi'
import { useLocale } from '../../i18n'
import './SettingsPage.css'

const NAV_ITEMS = [
  { path: '/settings/account', labelKey: 'settings.account' },
  { path: '/settings/appearance', labelKey: 'settings.appearance' },
  { path: '/settings/locale', labelKey: 'settings.locale' },
  { path: '/settings/notifications', labelKey: 'settings.notifications' },
  { path: '/settings/data', labelKey: 'settings.data' },
]

const SettingsPage: React.FC = () => {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <button className="settings-back-link" onClick={() => navigate('/')}>
          ← {t('app.back')}
        </button>
        <h2 className="settings-sidebar-title">{t('settings.title')}</h2>
        <nav className="settings-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="settings-content">
        <Outlet />
      </main>
    </div>
  )
}

export default SettingsPage
