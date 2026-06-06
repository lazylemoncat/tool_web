import React from 'react'
import './FinanceSidebar.css'

interface NavItem {
  tab: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    tab: 'dashboard',
    label: '仪表盘',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>,
  },
  {
    tab: 'transactions',
    label: '交易记录',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>,
  },
  {
    tab: 'budgets',
    label: '预算管理',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9-9H3m9 9a9 9 0 0 1-9-9m9 9c2.21 0 4-4.03 4-9s-1.79-9-4-9m0 18c-2.21 0-4-4.03-4-9s1.79-9 4-9M3 12a9 9 0 0 1 9-9"/>
    </svg>,
  },
  {
    tab: 'events',
    label: '事件管理',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>,
  },
  {
    tab: 'manage',
    label: '基础管理',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16"/>
      <path d="M7 12h10"/>
      <path d="M10 17h4"/>
      <circle cx="6" cy="7" r="2"/>
      <circle cx="18" cy="12" r="2"/>
      <circle cx="9" cy="17" r="2"/>
    </svg>,
  },
]

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddTransaction: () => void
}

const FinanceSidebar: React.FC<Props> = ({ activeTab, onTabChange, onAddTransaction }) => {
  return (
    <aside className="finance-sidebar">
      <div className="finance-sidebar-brand">记账</div>
      <nav className="finance-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            className={`finance-sidebar-item ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => onTabChange(item.tab)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="finance-sidebar-footer">
        <button className="finance-sidebar-cta" onClick={onAddTransaction}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>记一笔</span>
        </button>
      </div>
    </aside>
  )
}

export { NAV_ITEMS }
export default FinanceSidebar
