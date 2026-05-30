/*
 HomeModuleCard — 首页大模块入口卡片.
 用于 TODO, 记账及后续新增顶级功能模块, 统一图标, 标题, 描述, 箭头和管理控件插槽.
*/

import React from 'react'

interface HomeModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  accent: string
  managing?: boolean
  controls?: React.ReactNode
  onOpen?: () => void
}

const HomeModuleCard: React.FC<HomeModuleCardProps> = ({
  title,
  description,
  icon,
  accent,
  managing = false,
  controls,
  onOpen,
}) => (
  <section
    className={`home-dashboard-card home-module-card home-module-card-${accent} ${managing ? 'is-managing' : ''}`}
    onClick={() => { if (!managing) onOpen?.() }}
  >
    {controls}
    <div className="home-module-main">
      <span className="home-module-icon">
        {icon}
      </span>
      <div className="home-module-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
    {!managing && (
      <span className="home-module-arrow" aria-hidden="true">
        &gt;
      </span>
    )}
  </section>
)

export default HomeModuleCard
