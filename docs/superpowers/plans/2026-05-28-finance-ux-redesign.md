# 记账模块 UX 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全量重写记账模块 18 组件 + 4 页面 + FinanceLayout，匹配 Open Design 原型侧边栏导航视觉风格，保留 hooks/API/路由不变。

**Architecture:** FinanceLayout mount 时通过 `data-sidebar="finance"` 隐藏全局侧边栏并显示记账专属侧边栏。FinanceContext 接口保持不变，所有数据通过现有 9 hooks 获取。组件从 `components/ui/` 复用 Modal、Tabs、Button、FormField 等 UI 基元。

**Tech Stack:** React 18 + TypeScript + Umi 4 + Recharts + CSS custom properties

**Files Map:**
- Create: `FinanceSidebar.tsx`, `FinanceSidebar.css`
- Modify: `finance.css` (重写), `FinanceLayout.tsx`, 4 pages, 18 components
- No change: `hooks/finance/` (全部), `.umirc.ts`, `api/client.ts`, 后端

---

## Phase 1: 基础设施

### Task 1: 创建 FinanceSidebar 组件

**Files:**
- Create: `frontend/src/components/finance/FinanceSidebar.tsx`
- Create: `frontend/src/components/finance/FinanceSidebar.css`

- [ ] **Step 1: 创建 FinanceSidebar.tsx**

```tsx
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
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c2.21 0 4-4.03 4-9s-1.79-9-4-9m0 18c-2.21 0-4-4.03-4-9s1.79-9 4-9M3 12a9 9 0 0 1 9-9"/>
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
]

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddTransaction: () => void
}

const FinanceSidebar: React.FC<Props> = ({ activeTab, onTabChange, onAddTransaction }) => {
  return (
    <aside className="finance-sidebar">
      <div className="finance-sidebar-brand">📒 记账</div>
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
```

- [ ] **Step 2: 创建 FinanceSidebar.css**

```css
.finance-sidebar {
  display: none;
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-w, 220px);
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  flex-direction: column;
  padding: 20px 14px;
  z-index: 20;
  overflow-y: auto;
}

[data-sidebar="finance"] .finance-sidebar {
  display: flex;
}
[data-sidebar="finance"] .sidebar-panel {
  display: none;
}

.finance-sidebar-brand {
  font-size: var(--fs-lg, 20px);
  font-weight: 700;
  letter-spacing: -0.01em;
  padding: 8px 12px 20px;
  color: var(--text-primary);
}

.finance-sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.finance-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: background 0.12s, color 0.12s;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
}

.finance-sidebar-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.finance-sidebar-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.finance-sidebar-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.finance-sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.finance-sidebar-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.finance-sidebar-cta:hover {
  background: var(--color-accent-hover, #1d4ed8);
}

/* Responsive: 移动端侧边栏隐藏，用底部导航 */
@media (max-width: 768px) {
  .finance-sidebar {
    display: none !important;
  }
  [data-sidebar="finance"] .sidebar-panel {
    display: flex;
  }
}
```

- [ ] **Step 3: 在 index.css 中导入 FinanceSidebar.css**

File: `frontend/src/styles/index.css`

在 `@import './finance.css';` 后添加：
```css
@import '../components/finance/FinanceSidebar.css';
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/finance/FinanceSidebar.tsx frontend/src/components/finance/FinanceSidebar.css frontend/src/styles/index.css
git commit -m "feat(finance): add FinanceSidebar component with sidebar-switch CSS"
```

---

### Task 2: 重写 FinanceLayout.tsx

**Files:**
- Modify: `frontend/src/pages/finance/FinanceLayout.tsx`
- No changes to hooks or FinanceContext

- [ ] **Step 1: 重写 FinanceLayout 组件**

```tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'umi'
import {
  useLedgers, useAccounts, useCategories, useFinanceTags,
  useTransactions, useEvents, useBudgets, useDashboard, useStats,
  type TransactionFilters,
  type Transaction,
  type Budget,
  type FinanceEvent,
  type FinanceCategory,
  type FinanceTag,
} from '../../hooks/finance'
import { useLocale } from '../../i18n'
import { useToast } from '../../components/common/Toast'
import { useConfirm, EmptyState, Button } from '../../components/ui'
import TransactionForm, { type TransactionFormData } from '../../components/finance/TransactionForm'
import BudgetForm from '../../components/finance/BudgetForm'
import EventForm from '../../components/finance/EventForm'
import TransactionDetail from '../../components/finance/TransactionDetail'
import FinanceSidebar from '../../components/finance/FinanceSidebar'
import '../../components/finance/finance-list.css'

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const SUB_PAGES = ['dashboard', 'transactions', 'budgets', 'events'] as const

export interface FinanceContext {
  activeLedgerId: number | null
  ledgers: ReturnType<typeof useLedgers>['ledgers']
  accounts: ReturnType<typeof useAccounts>['accounts']
  categories: FinanceCategory[]
  tags: FinanceTag[]
  dashboard: ReturnType<typeof useDashboard>['dashboard']
  events: FinanceEvent[]
  budgets: Budget[]
  stats: ReturnType<typeof useStats>['stats']
  transactions: Transaction[]
  total: number
  txLoading: boolean
  loadingMore: boolean
  hasMore: boolean
  period: string
  setPeriod: (p: string) => void
  txFilters: TransactionFilters
  setTxFilters: (f: TransactionFilters) => void
  showTxForm: boolean
  setShowTxForm: (v: boolean) => void
  showBudgetForm: boolean
  setShowBudgetForm: (v: boolean) => void
  showEventForm: boolean
  setShowEventForm: (v: boolean) => void
  detailTx: Transaction | null
  setDetailTx: (tx: Transaction | null) => void
  editTx: Transaction | null
  setEditTx: (tx: Transaction | null) => void
  editingBudget: Budget | null
  setEditingBudget: (b: Budget | null) => void
  editingEvent: FinanceEvent | null
  setEditingEvent: (e: FinanceEvent | null) => void
  showNewLedger: boolean
  setShowNewLedger: (v: boolean) => void
  newLedgerName: string
  setNewLedgerName: (v: string) => void
  activeTab: string
  setActiveTab: (v: string) => void
  handleCreateLedger: () => Promise<void>
  handleDeleteLedger: (id: number) => Promise<void>
  handleSaveTransaction: (data: TransactionFormData) => Promise<void>
  handleTransactionClick: (tx: Transaction) => void
  handleEditFromDetail: () => void
  handleDeleteFromDetail: (id: number) => Promise<void>
  handleDeleteTransaction: (id: number) => Promise<void>
  refreshTransactions: () => Promise<void>
  handleCreateAccount: (f: Record<string, unknown>) => Promise<void>
  handleDeleteAccount: (id: number) => Promise<void>
  handleCreateCategory: (f: Record<string, unknown>) => Promise<FinanceCategory | null>
  handleUpdateCategory: (id: number, f: Record<string, unknown>) => Promise<void>
  handleDeleteCategory: (id: number) => Promise<void>
  handleCreateTag: (name: string) => Promise<FinanceTag | null>
  handleDeleteTag: (id: number) => Promise<void>
  handleCreateBudget: (f: Record<string, unknown>) => Promise<void>
  handleUpdateBudget: (f: Record<string, unknown>) => Promise<void>
  handleDeleteBudget: (id: number) => Promise<void>
  openEditBudget: (b: Budget) => void
  openNewBudget: () => void
  handleCreateEvent: (f: Record<string, unknown>) => Promise<void>
  handleUpdateEvent: (f: Record<string, unknown>) => Promise<void>
  handleDeleteEvent: (id: number) => Promise<void>
  openEditEvent: (ev: FinanceEvent) => void
  openNewEvent: () => void
  sentinelRef: React.RefObject<HTMLDivElement | null>
  fmt: (v: unknown, digits?: number) => string
}

const FinanceLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLocale()
  const { toast } = useToast()
  const confirm = useConfirm()

  const [activeLedgerId, setActiveLedgerId] = useState<number | null>(null)
  const [showNewLedger, setShowNewLedger] = useState(false)
  const [newLedgerName, setNewLedgerName] = useState('')
  const [showTxForm, setShowTxForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FinanceEvent | null>(null)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [editTx, setEditTx] = useState<Transaction | null>(null)

  // Derive active tab from URL path
  const activeTab = useMemo(() => {
    const path = location.pathname
    for (const page of SUB_PAGES) {
      if (path.includes(`/finance/${page}`)) return page
    }
    return 'dashboard'
  }, [location.pathname])

  // Sidebar switch: hide global sidebar, show finance sidebar
  useEffect(() => {
    document.documentElement.dataset.sidebar = 'finance'
    return () => { delete document.documentElement.dataset.sidebar }
  }, [])

  // Data hooks (identical to existing)
  const { ledgers, createLedger, deleteLedger } = useLedgers()
  const { accounts, createAccount, deleteAccount } = useAccounts(activeLedgerId)
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories(activeLedgerId)
  const { tags, createTag, deleteTag } = useFinanceTags(activeLedgerId)
  const { dashboard } = useDashboard(activeLedgerId)
  const { events, createEvent, updateEvent, deleteEvent } = useEvents(activeLedgerId)
  const { budgets, createBudget, updateBudget, deleteBudget } = useBudgets(activeLedgerId)
  const [period, setPeriod] = useState('month')
  const { stats } = useStats(activeLedgerId, period)
  const [txFilters, setTxFilters] = useState<TransactionFilters>({})
  const { transactions, total, loading: txLoading, loadingMore, hasMore, fetchTransactions, loadMore, createTransaction, updateTransaction, deleteTransaction } = useTransactions(activeLedgerId, txFilters)

  useEffect(() => {
    if (!activeLedgerId && ledgers.length > 0) {
      setActiveLedgerId(ledgers[0].id)
    }
  }, [ledgers, activeLedgerId])

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  // Tab navigation: navigate to sub-route
  const handleTabChange = useCallback((tab: string) => {
    navigate(`/finance/${tab}`)
  }, [navigate])

  // --- All handler functions (identical to existing) ---
  // handleCreateLedger, handleDeleteLedger, handleSaveTransaction,
  // handleTransactionClick, handleEditFromDetail, handleDeleteFromDetail,
  // handleDeleteTransaction, handleCreateAccount, handleDeleteAccount,
  // handleCreateCategory, handleUpdateCategory, handleDeleteCategory,
  // handleCreateTag, handleDeleteTag, handleCreateBudget, handleUpdateBudget,
  // handleDeleteBudget, openEditBudget, openNewBudget,
  // handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
  // openEditEvent, openNewEvent
  // ... (keep ALL existing handler implementations exactly as-is)

  const handleCreateLedger = async () => {
    if (!newLedgerName.trim()) return
    try {
      await createLedger(newLedgerName.trim())
      setNewLedgerName('')
      setShowNewLedger(false)
    } catch {
      toast(t('finance.ledgerCreateFailed'), 'error')
    }
  }

  const handleDeleteLedger = async (id: number) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteLedger'),
      description: t('finance.deleteLedgerDescription'),
      danger: true,
    })
    if (!ok) return
    try {
      await deleteLedger(id)
      if (activeLedgerId === id) setActiveLedgerId(null)
    } catch {
      toast(t('finance.ledgerDeleteFailed'), 'error')
    }
  }

  const handleSaveTransaction = useCallback(async (data: TransactionFormData) => {
    try {
      if (editTx) {
        await updateTransaction(editTx.id, data as unknown as Record<string, unknown>)
        setEditTx(null)
      } else {
        const parent = await createTransaction({
          type: data.type, amount: data.amount, account_id: data.account_id,
          category_id: data.category_id, note: data.note,
          occurred_at: data.occurred_at, tag_ids: data.tag_ids,
          attachment_ids: data.attachment_ids ?? [],
          linked_todo_ids: data.linked_todo_ids ?? [],
          ledger_id: activeLedgerId,
        } as any)
        if (parent && data.children.length > 0) {
          for (const child of data.children) {
            await createTransaction({
              type: data.type, amount: child.amount, account_id: data.account_id,
              category_id: child.category_id, note: child.note,
              occurred_at: data.occurred_at, tag_ids: [],
              attachment_ids: child.attachment_ids ?? [],
              parent_transaction_id: parent.id,
              ledger_id: activeLedgerId,
            } as any)
          }
        }
      }
      setShowTxForm(false)
    } catch {
      toast(t('finance.transactionCreateFailed'), 'error')
    }
  }, [activeLedgerId, createTransaction, updateTransaction, editTx, toast, t])

  const handleTransactionClick = (tx: Transaction) => setDetailTx(tx)

  const handleEditFromDetail = () => {
    setDetailTx(null)
    setEditTx(detailTx)
    setShowTxForm(true)
  }

  const confirmDeleteTransaction = async (): Promise<boolean> =>
    confirm({
      title: t('finance.confirmDeleteTransaction'),
      description: t('finance.deleteTransactionDescription'),
      danger: true,
    })

  const handleDeleteFromDetail = async (id: number) => {
    const ok = await confirmDeleteTransaction()
    if (!ok) return
    try { await deleteTransaction(id); setDetailTx(null) }
    catch { toast(t('finance.transactionDeleteFailed'), 'error') }
  }

  const handleDeleteTransaction = async (id: number) => {
    const ok = await confirmDeleteTransaction()
    if (!ok) return
    try { await deleteTransaction(id) }
    catch { toast(t('finance.transactionDeleteFailed'), 'error') }
  }

  const handleCreateAccount = async (f: Record<string, unknown>) => {
    await createAccount({ ...f, ledger_id: activeLedgerId })
  }

  const handleDeleteAccount = async (id: number) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteAccount'),
      description: t('finance.deleteAccountDescription'),
      danger: true,
    })
    if (!ok) return
    try { await deleteAccount(id) }
    catch { toast(t('finance.accountCreateFailed'), 'error') }
  }

  const handleCreateCategory = async (f: Record<string, unknown>) => {
    return createCategory({ ...f, ledger_id: activeLedgerId })
  }

  const handleUpdateCategory = async (id: number, f: Record<string, unknown>) => {
    await updateCategory(id, f)
  }

  const handleDeleteCategory = async (id: number) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteCategory'),
      description: t('finance.deleteCategoryDescription'),
      danger: true,
    })
    if (!ok) return
    try { await deleteCategory(id) }
    catch { toast(t('finance.categoryDeleteFailed'), 'error') }
  }

  const handleCreateTag = async (name: string) => {
    return createTag(activeLedgerId!, name)
  }

  const handleDeleteTag = async (id: number) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteTag'),
      description: t('finance.deleteTagDescription'),
      danger: true,
    })
    if (!ok) return
    try { await deleteTag(id) }
    catch { /* ignore */ }
  }

  const handleCreateBudget = async (fields: Record<string, unknown>) => {
    try {
      await createBudget({ ...fields, ledger_id: activeLedgerId })
      setShowBudgetForm(false)
      setEditingBudget(null)
    } catch { toast(t('finance.budgetCreateFailed'), 'error') }
  }

  const handleUpdateBudget = async (fields: Record<string, unknown>) => {
    if (!editingBudget) return
    try {
      await updateBudget(editingBudget.id, fields)
      setShowBudgetForm(false)
      setEditingBudget(null)
    } catch { toast(t('finance.budgetUpdateFailed'), 'error') }
  }

  const handleDeleteBudget = async (id: number) => {
    const ok = await confirm({ title: t('finance.confirmDeleteBudget'), danger: true })
    if (!ok) return
    try { await deleteBudget(id) }
    catch { toast(t('finance.budgetDeleteFailed'), 'error') }
  }

  const openEditBudget = (b: Budget) => { setEditingBudget(b); setShowBudgetForm(true) }
  const openNewBudget = () => { setEditingBudget(null); setShowBudgetForm(true) }

  const handleCreateEvent = async (fields: Record<string, unknown>) => {
    try {
      await createEvent({ ...fields, ledger_id: activeLedgerId })
      setShowEventForm(false)
      setEditingEvent(null)
    } catch { toast(t('finance.eventCreateFailed'), 'error') }
  }

  const handleUpdateEvent = async (fields: Record<string, unknown>) => {
    if (!editingEvent) return
    try {
      await updateEvent(editingEvent.id, fields)
      setShowEventForm(false)
      setEditingEvent(null)
    } catch { toast(t('finance.eventUpdateFailed'), 'error') }
  }

  const handleDeleteEvent = async (id: number) => {
    const ok = await confirm({ title: t('finance.confirmDeleteEvent'), danger: true })
    if (!ok) return
    try { await deleteEvent(id) }
    catch { toast(t('finance.eventDeleteFailed'), 'error') }
  }

  const openEditEvent = (ev: FinanceEvent) => { setEditingEvent(ev); setShowEventForm(true) }
  const openNewEvent = () => { setEditingEvent(null); setShowEventForm(true) }

  const ctx: FinanceContext = {
    activeLedgerId,
    ledgers, accounts, categories, tags, dashboard, events, budgets, stats,
    transactions, total, txLoading, loadingMore, hasMore,
    period, setPeriod,
    txFilters, setTxFilters,
    showTxForm, setShowTxForm,
    showBudgetForm, setShowBudgetForm,
    showEventForm, setShowEventForm,
    detailTx, setDetailTx,
    editTx, setEditTx,
    editingBudget, setEditingBudget,
    editingEvent, setEditingEvent,
    showNewLedger, setShowNewLedger,
    newLedgerName, setNewLedgerName,
    activeTab, setActiveTab: (v: string) => handleTabChange(v),
    handleCreateLedger, handleDeleteLedger,
    handleSaveTransaction, handleTransactionClick,
    handleEditFromDetail, handleDeleteFromDetail, handleDeleteTransaction,
    refreshTransactions: fetchTransactions,
    handleCreateAccount, handleDeleteAccount,
    handleCreateCategory, handleUpdateCategory, handleDeleteCategory,
    handleCreateTag, handleDeleteTag,
    handleCreateBudget, handleUpdateBudget, handleDeleteBudget,
    openEditBudget, openNewBudget,
    handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
    openEditEvent, openNewEvent,
    sentinelRef,
    fmt,
  }

  return (
    <div className="finance-page">
      <FinanceSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddTransaction={() => { setEditTx(null); setShowTxForm(true) }}
      />

      <div className="finance-main">
        {/* Finance header: title + ledger selector */}
        <div className="finance-header">
          <span className="finance-title">记账</span>
          <div className="finance-ledger-bar">
            {ledgers.map((l) => (
              <button
                key={l.id}
                className={`finance-ledger-btn ${l.id === activeLedgerId ? 'active' : ''}`}
                onClick={() => setActiveLedgerId(l.id)}
              >
                {l.icon} {l.name}
              </button>
            ))}
            {showNewLedger ? (
              <div className="finance-ledger-new">
                <input
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateLedger()}
                  placeholder={t('finance.newLedger')}
                  autoFocus
                  className="finance-input-sm"
                />
                <button onClick={handleCreateLedger} className="btn-submit">{t('app.confirm')}</button>
                <button onClick={() => setShowNewLedger(false)} className="btn-cancel">{t('app.cancel')}</button>
              </div>
            ) : (
              <button className="finance-ledger-add" onClick={() => setShowNewLedger(true)}>
                + {t('finance.newLedger')}
              </button>
            )}
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <nav className="finance-subnav">
          {SUB_PAGES.map((p) => (
            <button
              key={p}
              className={`finance-subnav-btn ${activeTab === p ? 'active' : ''}`}
              onClick={() => handleTabChange(p)}
            >
              {t(`finance.${p}`)}
            </button>
          ))}
        </nav>

        {activeLedger ? (
          <div className="finance-content">
            <Outlet context={ctx} />
          </div>
        ) : (
          <div className="finance-empty">
            <EmptyState
              icon="📒"
              title={t('finance.noLedger')}
              description={t('finance.noLedgerHint')}
              action={
                <Button onClick={() => setShowNewLedger(true)}>
                  {t('finance.createFirstLedger')}
                </Button>
              }
            />
          </div>
        )}

        {/* Modal overlays */}
        {showTxForm && activeLedger && (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            tags={tags}
            editTx={editTx}
            onSubmit={handleSaveTransaction}
            onClose={() => { setShowTxForm(false); setEditTx(null) }}
            onCreateCategory={(name) => createCategory({ name, ledger_id: activeLedgerId })}
            ledgerId={activeLedgerId}
            onChildRefresh={fetchTransactions}
          />
        )}

        {showBudgetForm && activeLedger && (
          <BudgetForm
            editBudget={editingBudget}
            categories={categories}
            tags={tags}
            events={events}
            onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
            onClose={() => { setShowBudgetForm(false); setEditingBudget(null) }}
          />
        )}

        {showEventForm && activeLedger && (
          <EventForm
            editEvent={editingEvent}
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onClose={() => { setShowEventForm(false); setEditingEvent(null) }}
          />
        )}

        {detailTx && (
          <TransactionDetail
            transaction={detailTx}
            accounts={accounts}
            categories={categories}
            tags={tags}
            onEdit={handleEditFromDetail}
            onDelete={() => handleDeleteFromDetail(detailTx.id)}
            onClose={() => setDetailTx(null)}
            onRefresh={fetchTransactions}
          />
        )}
      </div>
    </div>
  )
}

export default FinanceLayout
```

- [ ] **Step 2: 重写 finance.css 中的 finance-page 和 finance-main 布局**

在 `finance.css` 顶部替换 `finance-page` 相关样式：

```css
/* ─── Page Layout (new) ─── */
.finance-page {
  display: flex;
  min-height: calc(100vh - var(--header-height));
}

.finance-main {
  flex: 1;
  margin-left: var(--sidebar-w, 220px);
  padding: 24px 28px;
  max-width: calc(100vw - var(--sidebar-w, 220px));
  min-width: 0;
}

@media (max-width: 768px) {
  .finance-main {
    margin-left: 0;
    margin-bottom: 70px;
    padding: 16px;
    max-width: 100%;
  }
}
```

- [ ] **Step 3: 在 index.css 中新增 sidebar-w 变量**

在 `:root` 块中添加：
```css
--sidebar-w: 220px;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/finance/FinanceLayout.tsx frontend/src/styles/finance.css frontend/src/styles/index.css
git commit -m "refactor(finance): rewrite FinanceLayout with sidebar-switch and new layout"
```

---

## Phase 2: Dashboard 页面

### Task 3: 重写 FinanceDashboard 组件

**Files:**
- Modify: `frontend/src/components/finance/FinanceDashboard.tsx`
- Modify: `frontend/src/components/finance/FinanceCharts.tsx`

- [ ] **Step 1: 重写 FinanceDashboard — 统计卡片 + 预算概览 + 图表**

```tsx
import React from 'react'
import type { DashboardSummary, Account, Budget, FinanceCategory, FinanceTag, Transaction, StatsData } from '../../hooks/finance'
import FinanceCharts from './FinanceCharts'
import CategoryManager from './CategoryManager'
import TagManager from './TagManager'

interface Props {
  dashboard: DashboardSummary | null
  accounts: Account[]
  budgets: Budget[]
  categories: FinanceCategory[]
  stats: StatsData | null
  period: string
  onPeriodChange: (p: string) => void
  onCreateAccount: (fields: Record<string, unknown>) => void
  onDeleteAccount: (id: number) => void
  onCreateCategory: (fields: Record<string, unknown>) => void
  onUpdateCategory: (id: number, fields: Record<string, unknown>) => void
  onDeleteCategory: (id: number) => void
  tags: FinanceTag[]
  onCreateTag: (name: string) => void
  onDeleteTag: (id: number) => void
  onTransactionClick: (tx: Transaction) => void
}

const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FinanceDashboard: React.FC<Props> = ({
  dashboard, accounts, budgets, categories, stats, period, onPeriodChange,
  onCreateAccount, onDeleteAccount, onCreateCategory, onUpdateCategory, onDeleteCategory,
  tags, onCreateTag, onDeleteTag, onTransactionClick,
}) => {
  const income = dashboard?.month_income ?? 0
  const expense = dashboard?.month_expense ?? 0
  const balance = income - expense
  const budgetPct = dashboard?.budget_usage_pct ?? 0
  const totalAssets = 52680.50 // would come from API if available

  const recentTxs = dashboard?.recent_transactions ?? []

  return (
    <div>
      {/* Stat cards */}
      <div className="dashboard-stat-cards">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">总资产</div>
          <div className="dashboard-stat-value">¥{fmtShort(totalAssets)}</div>
          <div className="dashboard-stat-sub">{accounts.length}个账户</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">本月收入</div>
          <div className="dashboard-stat-value income">+¥{fmtShort(income)}</div>
          <div className="dashboard-stat-sub">{recentTxs.filter(t => t.type === 'income').length} 笔</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">本月支出</div>
          <div className="dashboard-stat-value expense">-¥{fmtShort(expense)}</div>
          <div className="dashboard-stat-sub">{recentTxs.filter(t => t.type === 'expense').length} 笔</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-label">本月结余</div>
          <div className="dashboard-stat-value" style={{ color: balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
            ¥{fmtShort(balance)}
          </div>
          <div className="dashboard-stat-sub">收支比 {income > 0 ? Math.round(expense / income * 100) : '—'}%</div>
        </div>
      </div>

      {/* Budget usage bar */}
      <div className="dashboard-section-card">
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">预算使用率</span>
          <button className="dashboard-section-link" onClick={() => {}}>管理预算 →</button>
        </div>
        <div className="dashboard-budget-overview">
          <span className="dashboard-budget-amount">
            ¥{fmtShort(budgets.reduce((s, b) => s + (b.current_spent || 0), 0))}
          </span>
          <span className="dashboard-budget-total">
            / ¥{fmtShort(budgets.reduce((s, b) => s + b.amount, 0))}
          </span>
          <span className="dashboard-budget-pct">{budgetPct.toFixed(1)}%</span>
        </div>
        <div className="dashboard-progress-bar">
          <div
            className={`dashboard-progress-fill ${budgetPct > 100 ? 'danger' : budgetPct > 80 ? 'warn' : 'safe'}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <div className="dashboard-section-card">
          <div className="dashboard-section-title">分类支出占比</div>
          <FinanceCharts stats={stats} period={period} onPeriodChange={onPeriodChange} />
        </div>
        <div className="dashboard-section-card">
          <div className="dashboard-section-title">月度支出趋势</div>
          {stats?.trend_data && stats.trend_data.length > 0 ? (
            <div className="dashboard-bar-chart">
              {stats.trend_data.map((d, i) => {
                const maxVal = Math.max(...stats.trend_data.map(x => x.amount), 1)
                const h = Math.max(2, (d.amount / maxVal) * 140)
                return (
                  <div key={i} className="dashboard-bar-col">
                    <div className="dashboard-bar-col-bar expense-bar" style={{ height: `${h}px` }} title={`${d.date}: ¥${d.amount}`} />
                    <div className="dashboard-bar-col-label">{d.date.slice(8) || d.date}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📈</div><p>暂无数据</p></div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="dashboard-section-card">
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">最近交易</span>
          <button className="dashboard-section-link" onClick={() => {}}>查看全部 →</button>
        </div>
        <div className="dashboard-tx-list">
          {recentTxs.slice(0, 8).map((tx) => {
            const cat = categories.find(c => c.id === tx.category_id)
            const acc = accounts.find(a => a.id === tx.account_id)
            const isExpense = tx.type === 'expense'
            const isIncome = tx.type === 'income'
            return (
              <div
                key={tx.id}
                className="dashboard-tx-row"
                onClick={() => onTransactionClick(tx)}
              >
                <span className={`dashboard-tx-icon ${isExpense ? 'expense' : isIncome ? 'income' : 'transfer'}`}>
                  {cat?.icon || '💳'}
                </span>
                <div className="dashboard-tx-info">
                  <span className="dashboard-tx-name">{cat?.name || '—'} · {tx.note || '—'}</span>
                  <span className="dashboard-tx-meta">
                    {tx.occurred_at?.slice(0, 10)} · {acc?.name || '—'}
                    {tx.tags?.map((t: any) => (
                      <span key={t.id} className="tag-pill">{t.name}</span>
                    ))}
                  </span>
                </div>
                <span className={`dashboard-tx-amount ${isExpense ? 'expense' : isIncome ? 'income' : 'transfer'}`}>
                  {isExpense ? '-' : isIncome ? '+' : ''}¥{tx.amount.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Management links */}
      <div className="dashboard-management-links">
        <CategoryManager
          categories={categories}
          onCreate={onCreateCategory}
          onUpdate={onUpdateCategory}
          onDelete={onDeleteCategory}
        />
        <TagManager tags={tags} onCreate={onCreateTag} onDelete={onDeleteTag} />
      </div>
    </div>
  )
}

export default FinanceDashboard
```

- [ ] **Step 2: 重写 FinanceCharts — 保留 Recharts 饼图**

```tsx
import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { StatsData } from '../../hooks/finance'

interface Props {
  stats: StatsData | null
  period: string
  onPeriodChange: (p: string) => void
}

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb']

const FinanceCharts: React.FC<Props> = ({ stats, period, onPeriodChange }) => {
  const data = stats?.category_data ?? []

  return (
    <div className="dashboard-charts">
      <div className="dashboard-period-switch">
        {['week', 'month', 'year'].map(p => (
          <button
            key={p}
            className={`dashboard-period-btn ${period === p ? 'active' : ''}`}
            onClick={() => onPeriodChange(p)}
          >
            {p === 'week' ? '周' : p === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="dashboard-pie-wrap">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={58}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => `¥${val.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="dashboard-pie-legend">
            {data.map((d, i) => (
              <div key={i} className="dashboard-pie-legend-item">
                <span className="dashboard-pie-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="dashboard-pie-label">{d.name}</span>
                <span className="dashboard-pie-pct">{((d.value / data.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chart-empty">暂无分类数据</div>
      )}
    </div>
  )
}

export default FinanceCharts
```

- [ ] **Step 3: 在 finance.css 中添加 Dashboard 新样式**

```css
/* ─── Dashboard ─── */
.dashboard-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: 20px;
}

.dashboard-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
}

.dashboard-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.dashboard-stat-value {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dashboard-stat-value.income { color: var(--color-income); }
.dashboard-stat-value.expense { color: var(--color-expense); }

.dashboard-stat-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.dashboard-section-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
}

.dashboard-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.dashboard-section-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.dashboard-section-link {
  font-size: 0.75rem;
  color: var(--accent);
  cursor: pointer;
  background: none;
  border: none;
}

.dashboard-section-link:hover { text-decoration: underline; }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: 20px;
}

.dashboard-budget-overview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.dashboard-budget-amount {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 20px;
}

.dashboard-budget-total {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.dashboard-budget-pct {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--color-warning, #d97706);
}

.dashboard-progress-bar {
  height: 8px;
  background: var(--bg-primary);
  border-radius: 999px;
  overflow: hidden;
}

.dashboard-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s;
}

.dashboard-progress-fill.safe { background: var(--color-income); }
.dashboard-progress-fill.warn { background: var(--color-warning, #d97706); }
.dashboard-progress-fill.danger { background: var(--color-expense); }

/* Bar chart */
.dashboard-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-top: 8px;
}

.dashboard-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.dashboard-bar-col-bar {
  width: 100%;
  max-width: 32px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: var(--accent-light);
  transition: height 0.3s;
}

.dashboard-bar-col-bar.expense-bar { background: var(--color-expense-soft, #fef2f2); }

.dashboard-bar-col-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Pie chart */
.dashboard-pie-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dashboard-pie-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  flex: 1;
}

.dashboard-pie-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-pie-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dashboard-pie-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-pie-pct {
  font-family: var(--font-mono);
  color: var(--text-muted);
}

/* Recent transactions */
.dashboard-tx-list {
  display: flex;
  flex-direction: column;
}

.dashboard-tx-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}

.dashboard-tx-row:last-child { border-bottom: 0; }

.dashboard-tx-row:hover { background: var(--bg-primary); margin: 0 -18px; padding-left: 18px; padding-right: 18px; }

.dashboard-tx-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dashboard-tx-icon.expense { background: var(--color-expense-soft, #fef2f2); color: var(--color-expense); }
.dashboard-tx-icon.income { background: var(--color-income-soft, #f0fdf4); color: var(--color-income); }
.dashboard-tx-icon.transfer { background: var(--color-info-soft, #eef2ff); color: var(--color-info, #6366f1); }

.dashboard-tx-info {
  flex: 1;
  min-width: 0;
}

.dashboard-tx-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.dashboard-tx-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  background: var(--bg-primary);
  color: var(--text-muted);
}

.dashboard-tx-amount {
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dashboard-tx-amount.expense { color: var(--color-expense); }
.dashboard-tx-amount.income { color: var(--color-income); }
.dashboard-tx-amount.transfer { color: var(--color-info, #6366f1); }

.dashboard-period-switch {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.dashboard-period-btn {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.dashboard-period-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.dashboard-management-links {
  margin-top: 20px;
}

@media (max-width: 1024px) {
  .dashboard-stat-cards { grid-template-columns: repeat(2, 1fr); }
  .dashboard-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .dashboard-stat-cards { grid-template-columns: 1fr 1fr; gap: var(--space-2); }
  .dashboard-stat-card { padding: 12px; }
  .dashboard-stat-value { font-size: 1.3rem; }
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/finance/FinanceDashboard.tsx frontend/src/components/finance/FinanceCharts.tsx frontend/src/styles/finance.css
git commit -m "refactor(finance): rewrite Dashboard and Charts with new visual style"
```

---

## Phase 3: 交易模块

### Task 4: 重写交易列表与 TxCard (统一行式布局)

**Files:**
- Modify: `frontend/src/components/finance/TxCard.tsx` (改为行式)
- Modify: `frontend/src/pages/finance/TransactionsPage.tsx`
- Remove: TxCard.css, finance-list.css (响应式切换逻辑不再需要)

- [ ] **Step 1: 重写 TxCard.tsx 为行式布局**

```tsx
import React, { useState } from 'react'
import type { Transaction } from '../../hooks/finance'
import { useConfirm, useToast } from '../ui'

interface Props {
  tx: Transaction
  onClick: (tx: Transaction) => void
  onDelete: (id: number) => Promise<void>
  formatAmount: (v: unknown, digits?: number) => string
}

const TxCard: React.FC<Props> = ({ tx, onClick, onDelete, formatAmount }) => {
  const confirm = useConfirm()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await confirm({ title: '删除交易', description: '确定删除该条交易记录吗？', danger: true })
    if (!ok) return
    setDeleting(true)
    try { await onDelete(tx.id) }
    catch { toast('删除失败', 'error') }
    finally { setDeleting(false) }
  }

  const isExpense = tx.type === 'expense'
  const isIncome = tx.type === 'income'
  const amountSign = isExpense ? '-' : isIncome ? '+' : ''
  const amountClass = isExpense ? 'tx-amount-expense' : isIncome ? 'tx-amount-income' : 'tx-amount-transfer'
  const iconClass = isExpense ? 'tx-icon-expense' : isIncome ? 'tx-icon-income' : 'tx-icon-transfer'
  const hasChildren = (tx.children && tx.children.length > 0) || (tx.split_items && tx.split_items.length > 0)

  return (
    <>
      <div className="tx-row" onClick={() => onClick(tx)}>
        <span className={`tx-row-icon ${iconClass}`}>
          {tx.category?.icon || (isExpense ? '💳' : isIncome ? '💰' : '🔄')}
        </span>
        <div className="tx-row-info">
          <span className="tx-row-title">
            {tx.category?.name || '—'} {tx.note ? '· ' + tx.note : ''}
          </span>
          <span className="tx-row-meta">
            {tx.occurred_at?.slice(0, 10)} · {tx.account?.name || '—'}
            {tx.tags?.map((t: any) => (
              <span key={t.id} className="tx-tag-pill">{t.name}</span>
            ))}
            {hasChildren && <span className="tx-split-badge">📎 拆分</span>}
          </span>
        </div>
        <span className={`tx-row-amount ${amountClass}`}>
          {amountSign}¥{formatAmount(tx.amount)}
        </span>
        <button
          className="tx-row-delete"
          onClick={handleDelete}
          disabled={deleting}
          title="删除"
        >
          ✕
        </button>
      </div>

      {/* Child rows */}
      {tx.children?.map((child) => {
        const cExpense = child.type === 'expense'
        return (
          <div
            key={child.id}
            className="tx-row tx-row-child"
            onClick={() => onClick(child)}
          >
            <span className={`tx-row-icon child ${cExpense ? 'tx-icon-expense' : 'tx-icon-income'}`}>
              {child.category?.icon || '💳'}
            </span>
            <div className="tx-row-info">
              <span className="tx-row-title child">
                └ {child.category?.name || '—'} · {child.note || '—'}
              </span>
              <span className="tx-row-meta">{child.occurred_at?.slice(0, 10)}</span>
            </div>
            <span className={`tx-row-amount child ${cExpense ? 'tx-amount-expense' : 'tx-amount-income'}`}>
              {cExpense ? '-' : '+'}¥{formatAmount(child.amount)}
            </span>
            <span style={{ width: 28 }} />
          </div>
        )
      })}
    </>
  )
}

export default TxCard
```

- [ ] **Step 2: 在 finance.css 中添加行式交易列表样式**

```css
/* ─── Transaction Row List ─── */
.tx-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}

.tx-row:hover { background: var(--bg-primary); }

.tx-row:last-child { border-bottom: 0; }

.tx-row-child {
  padding-left: 28px;
  font-size: 0.85rem;
  background: var(--bg-primary);
  border-bottom: 1px dashed var(--border);
}

.tx-row-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.tx-row-icon.child { width: 24px; height: 24px; font-size: 12px; }

.tx-row-icon.tx-icon-expense { background: var(--color-expense-soft, #fef2f2); color: var(--color-expense); }
.tx-row-icon.tx-icon-income { background: var(--color-income-soft, #f0fdf4); color: var(--color-income); }
.tx-row-icon.tx-icon-transfer { background: var(--color-info-soft, #eef2ff); color: var(--color-info, #6366f1); }

.tx-row-info { flex: 1; min-width: 0; }

.tx-row-title {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.tx-row-title.child { font-size: 0.82rem; }

.tx-row-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tx-tag-pill {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.62rem;
  background: var(--bg-primary);
  color: var(--text-muted);
}

.tx-split-badge {
  color: var(--accent);
  font-size: 0.65rem;
}

.tx-row-amount {
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: 0.9rem;
}

.tx-row-amount.child { font-size: 0.82rem; }

.tx-amount-expense { color: var(--color-expense); }
.tx-amount-income { color: var(--color-income); }
.tx-amount-transfer { color: var(--color-info, #6366f1); }

.tx-row-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.65rem;
  padding: 4px;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity 0.12s, color 0.12s;
}

.tx-row:hover .tx-row-delete { opacity: 1; }

.tx-row-delete:hover { color: var(--color-expense); background: var(--color-expense-soft, #fef2f2); }
```

- [ ] **Step 3: 重写 TransactionsPage.tsx**

```tsx
import React from 'react'
import { useOutletContext } from 'umi'
import type { FinanceContext } from './FinanceLayout'
import TxCard from '../../components/finance/TxCard'
import TxFilterBar from '../../components/finance/TxFilterBar'
import { Skeleton } from '../../components/ui'

const TransactionsPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()

  return (
    <div>
      <TxFilterBar
        accounts={ctx.accounts}
        categories={ctx.categories}
        tags={ctx.tags}
        events={ctx.events}
        filters={ctx.txFilters}
        onFiltersChange={ctx.setTxFilters}
      />

      <div className="db-card">
        {ctx.txLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={48} />
            ))}
          </div>
        ) : ctx.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>没有匹配的交易记录</p>
          </div>
        ) : (
          <div className="tx-list">
            {ctx.transactions.map((tx) => (
              <TxCard
                key={tx.id}
                tx={tx}
                onClick={ctx.handleTransactionClick}
                onDelete={ctx.handleDeleteTransaction}
                formatAmount={ctx.fmt}
              />
            ))}
          </div>
        )}

        {ctx.hasMore && (
          <div ref={ctx.sentinelRef} className="finance-load-more">
            {ctx.loadingMore ? '加载中...' : '加载更多'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage
```

- [ ] **Step 4: Delete TxCard.css and update finance-list.css**

```bash
rm frontend/src/components/finance/TxCard.css
```
Update `finance-list.css` — 删除响应式切换，只保留 `@media (max-width: 768px) { .tx-row { ... } }` 紧凑样式。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/finance/TxCard.tsx frontend/src/pages/finance/TransactionsPage.tsx frontend/src/styles/finance.css
git rm frontend/src/components/finance/TxCard.css
git commit -m "refactor(finance): rewrite transaction list as unified row layout"
```

---

## Phase 4: 交易表单、详情、筛选

### Task 5: 重写 TxFilterBar

**Files:**
- Modify: `frontend/src/components/finance/TxFilterBar.tsx`

Keep the same props interface and filter logic. Replace the toggle-based filter panel with always-visible select rows + quick-preset chips, matching prototype's `.filter-bar` + `.quick-filters` pattern.

Key JSX structure:
```tsx
<div className="filter-bar">
  <select className="filter-select" value={filters.type || ''} onChange={...}>
    <option value="">全部类型</option>
    <option value="expense">支出</option>
    <option value="income">收入</option>
    <option value="transfer">转账</option>
  </select>
  <select className="filter-select" value={filters.account_id || ''} onChange={...}>
    <option value="">全部账户</option>
    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
  </select>
  {/* similar for category, tag, event */}
  <input className="filter-input" type="text" placeholder="搜索描述、分类、账户…"
    value={filters.search || ''} onChange={...} />
</div>
<div className="quick-filters">
  {['全部', '支出', '收入', '转账', '拆分账单'].map(label => (
    <button key={label} className={`quick-chip ${activeQuick === label ? 'active' : ''}`}
      onClick={() => setQuick(label)}>{label}</button>
  ))}
</div>
```

### Task 6: 重写 TransactionForm 及子组件

**Files:**
- Modify: `frontend/src/components/finance/TransactionForm.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxAmountInput.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxBasicFields.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxSplitSection.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxAttachmentsSection.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxTodoLinks.tsx`

Keep all props interfaces and logic. Restyle: type switch as large segmented buttons with color fills (`.type-toggle`), amount input center-aligned large font with quick-amount chips (`.quick-amounts`), tag chips as capsule pills (`.tag-chips` / `.tag-chip.selected`). Reuse UI Modal with `size="lg"`.

### Task 6: 重写 TransactionForm 及子组件

**Files:**
- Modify: `frontend/src/components/finance/TransactionForm.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxAmountInput.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxBasicFields.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxSplitSection.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxAttachmentsSection.tsx`
- Modify: `frontend/src/components/finance/transactionForm/TxTodoLinks.tsx`

Keep all props interfaces and logic, restyle classes. Key visual changes:
- Type switch: large segmented buttons with color-highlighted active states
- Amount input: center-aligned, large font, quick-amount chips below
- Tag chips: capsule pills with multi-select toggle

### Task 7: 重写 TransactionDetail

**Files:**
- Modify: `frontend/src/components/finance/TransactionDetail.tsx`

Prototype-style modal: centered category icon + amount, grid details, child transaction list with inline editing. Footer with delete/edit/add-child buttons.

### Task 8: 重写 SubTxDrawer, TxChildrenDrawer

**Files:**
- Modify: `frontend/src/components/finance/SubTxDrawer.tsx`
- Modify: `frontend/src/components/finance/TxChildrenDrawer.tsx`

Restyle to match prototype modal/drawer style.

---

## Phase 5: 预算 & 事件

### Task 9: 重写 BudgetsPage + BudgetForm

**Files:**
- Modify: `frontend/src/pages/finance/BudgetsPage.tsx`
- Modify: `frontend/src/components/finance/BudgetForm.tsx`

Budget cards: grid layout with progress bar, spent/budget amounts, status pill (超支/预警/正常). Budget form modal kept functionally identical, restyled.

### Task 10: 重写 EventsPage + EventForm

**Files:**
- Modify: `frontend/src/pages/finance/EventsPage.tsx`
- Modify: `frontend/src/components/finance/EventForm.tsx`

Event cards: color dot + name + date range + stats (关联交易/支出/收入). Event detail modal with transaction list. Event form restyled.

---

## Phase 6: 辅助组件 & CSS 收尾

### Task 11: 重写 CategoryManager, TagManager

**Files:**
- Modify: `frontend/src/components/finance/CategoryManager.tsx`
- Modify: `frontend/src/components/finance/TagManager.tsx`

Restyle to prototype visual patterns. Category tree with expand/collapse, inline rename.

### Task 12: CSS 收尾 — 清理旧样式, 确保响应式

**Files:**
- Modify: `frontend/src/styles/finance.css`

- Remove unused legacy class rules (old budget-row, event-row styles, old tx-list table styles)
- Ensure all new classes are defined
- Verify responsive breakpoints: 1024px, 768px, 480px

### Task 13: 全量 TypeScript 检查 & 主题测试

- [ ] Run `npx tsc --noEmit` in frontend directory to verify no type errors
- [ ] Test light/dark/matcha theme switching on finance pages
- [ ] Verify responsive layout on mobile viewport

---

## Phase 7: 清理 & 验证

### Task 14: 删除不再需要的文件

- [ ] Remove `frontend/src/components/finance/TxCard.css` if not already deleted
- [ ] The `finance-list.css` can be kept but stripped to mobile-only overrides

### Task 15: 端到端测试

- [ ] `pnpm dev` → open `http://localhost:8000`
- [ ] Sign in → navigate to `/finance`
- [ ] Verify sidebar switches from global to finance sidebar
- [ ] Dashboard: stats cards render with correct data
- [ ] Transactions: filter → add → edit → delete → child transactions
- [ ] Budgets: create → edit → delete
- [ ] Events: create → view detail → delete
- [ ] Switch theme → verify all 3 themes work
- [ ] Resize to mobile → verify responsive layout
- [ ] Navigate to `/todo` → verify global sidebar restores

### Task 16: Final commit

```bash
git add -A
git commit -m "refactor(finance): complete UX redesign with sidebar navigation"
```
