/*
  FinanceLayout: 共享布局 + 状态管理, 子页面通过 Outlet context 消费数据.
*/
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'umi'
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
  setActiveTab: (tab: string) => void
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

const SUB_PAGES = ['dashboard', 'transactions', 'budgets', 'events', 'manage'] as const

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

  // Derive activeTab from URL pathname
  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    return SUB_PAGES.includes(last as typeof SUB_PAGES[number]) ? last : 'dashboard'
  }, [location.pathname])

  const setActiveTab = useCallback((tab: string) => {
    navigate(`/finance/${tab}`)
  }, [navigate])

  // Sidebar switch: announce context to the main layout via dataset
  useEffect(() => {
    document.documentElement.dataset.sidebar = 'finance'
    return () => {
      delete document.documentElement.dataset.sidebar
    }
  }, [])

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

  const activeLedger = useMemo(
    () => ledgers.find((l) => l.id === activeLedgerId),
    [ledgers, activeLedgerId],
  )

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
    const ok = await confirm({
      title: t('finance.confirmDeleteBudget'),
      description: t('finance.deleteBudgetDescription'),
      danger: true,
    })
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
    const ok = await confirm({
      title: t('finance.confirmDeleteEvent'),
      description: t('finance.deleteEventDescription'),
      danger: true,
    })
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
    activeTab, setActiveTab,
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
        onTabChange={(tab) => navigate(`/finance/${tab}`)}
        onAddTransaction={() => setShowTxForm(true)}
      />
      <div className="finance-main">
        {activeLedger ? (
          <>
            <div className="finance-header">
              <h1 className="finance-title">记账</h1>
              <div className="finance-ledger-selector">
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

            <nav className="finance-subnav">
              {SUB_PAGES.map((p) => (
                <NavLink
                  key={p}
                  to={`/finance/${p}`}
                  className={({ isActive }) => `finance-subnav-btn ${isActive ? 'active' : ''}`}
                >
                  {t(`finance.${p}`)}
                </NavLink>
              ))}
            </nav>

            <div className="finance-content">
              <Outlet context={ctx} />
            </div>
          </>
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
