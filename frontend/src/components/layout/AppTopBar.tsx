/*
 AppTopBar — 桌面顶栏 (≥768px).
 左侧: logo + 模块切换 nav
 右侧: 主题循环按钮 + 语言切换 + 账号 DropdownMenu
 < 768px 隐藏, 由 Header 汉堡菜单代替.
*/

import React from 'react'
import { useNavigate, useLocation } from 'umi'
import { useTheme } from '../../context/ThemeContext'
import { useI18n } from '../../context/I18nContext'
import DropdownMenu, { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../ui/DropdownMenu'
import IconButton from '../ui/IconButton'
import './AppTopBar.css'

interface AppTopBarProps {
  username?: string
  onLogout?: () => void
}

interface NavItem {
  path: string
  labelKey: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/todo', labelKey: 'sidebar.todo' },
  { path: '/finance', labelKey: 'sidebar.finance' },
  { path: '/settings', labelKey: 'app.settings' },
  { path: '/help', labelKey: 'app.help' },
]

const THEME_CYCLE: { name: string; icon: string; next: string }[] = [
  { name: 'light', icon: '☀', next: 'dark' },
  { name: 'dark', icon: '☾', next: 'matcha' },
  { name: 'matcha', icon: '🍵', next: 'system' },
  { name: 'system', icon: '◐', next: 'light' },
]

const THEME_MAP = new Map(THEME_CYCLE.map((t) => [t.name, t]))

const AppTopBar: React.FC<AppTopBarProps> = ({ username, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentTheme, switchTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()

  const themeEntry = THEME_MAP.get(currentTheme) ?? THEME_MAP.get('system')!
  const handleThemeClick = () => switchTheme(themeEntry.next)

  const activeModule = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))

  return (
    <header className="app-top-bar">
      <div className="app-top-bar-left">
        <div className="app-top-bar-logo" onClick={() => navigate('/')} title={t('app.home')}>
          Tool<span>Web</span>
        </div>

        <nav className="app-top-bar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`app-top-bar-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      </div>

      <div className="app-top-bar-right">
        <IconButton
          aria-label={t('theme.switchTo', { name: themeEntry.next })}
          size="md"
          onClick={handleThemeClick}
          title={themeEntry.name}
        >
          {themeEntry.icon}
        </IconButton>

        <select
          className="app-top-bar-locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'zh' | 'en')}
          aria-label={t('settings.language')}
        >
          <option value="zh">中文</option>
          <option value="en">EN</option>
        </select>

        {username && (
          <DropdownMenu
            trigger={
              <button className="app-top-bar-avatar-btn">
                {username.slice(0, 2).toUpperCase()}
              </button>
            }
            align="end"
          >
            <DropdownMenuLabel>{username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/account')}>
              {t('settings.account')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              {t('app.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/help')}>
              {t('app.help')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={onLogout}>
              {t('app.logout')}
            </DropdownMenuItem>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

export default AppTopBar
