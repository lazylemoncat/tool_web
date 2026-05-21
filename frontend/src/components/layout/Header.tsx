/*
 顶部栏 (移动端): 汉堡菜单 + 当前页面标题.
*/

import React from 'react'

interface Props {
  title: string
  onMenuClick: () => void
}

const Header: React.FC<Props> = ({ title, onMenuClick }) => {
  return (
    <div className="top-bar">
      <button className="menu-btn" onClick={onMenuClick}>
        ☰
      </button>
      <h1>{title}</h1>
    </div>
  )
}

export default Header
