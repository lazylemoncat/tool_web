/*
 顶部栏 (移动端): 汉堡菜单 + 当前页面标题.
*/

import React from 'react'
import { useLocale } from '../../i18n'

interface Props {
  title: string
  onMenuClick: () => void
}

const Header: React.FC<Props> = ({ title, onMenuClick }) => {
  const { t } = useLocale()
  return (
    <div className="top-bar">
      <button className="menu-btn" onClick={onMenuClick} aria-label={t('app.openMenu')}>
        ☰
      </button>
      <h1>{title}</h1>
    </div>
  )
}

export default Header
