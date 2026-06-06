/*
 Header — 移动端顶栏 (< 768px).
 汉堡键 + 页面标题 + 头像下拉.
*/

import React from 'react'
import { useNavigate } from 'umi'
import { useLocale } from '../../i18n'
import DropdownMenu, { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../ui/DropdownMenu'

interface Props {
  title: string
  onMenuClick: () => void
  username?: string
  onLogout?: () => void
}

const Header: React.FC<Props> = ({ title, onMenuClick, username, onLogout }) => {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div className="top-bar">
      <button className="menu-btn" onClick={onMenuClick} aria-label={t('app.openMenu')}>
        ☰
      </button>
      <h1>{title}</h1>

      {username && (
        <div style={{ marginLeft: 'auto' }}>
          <DropdownMenu
            trigger={
              <button className="top-bar-avatar-btn">
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
        </div>
      )}
    </div>
  )
}

export default Header
