/*
  Finance 主页面: Dashboard, Transaction List, Budget, Event 子页面.
*/

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useLedgers, useAccounts, useCategories, useFinanceTags,
  useTransactions, useEvents, useBudgets, useDashboard, useStats,
  type TransactionFilters,
  type Transaction,
} from '../hooks/useFinance'
import { useLocale } from '../i18n'
import { useToast } from '../components/common/Toast'
import FinanceDashboard from '../components/finance/FinanceDashboard'
import TransactionForm, { type TransactionFormData } from '../components/finance/TransactionForm'
import BudgetForm from '../components/finance/BudgetForm'
import EventForm from '../components/finance/EventForm'
import TxFilterBar from '../components/finance/TxFilterBar'
import TransactionDetail from '../components/finance/TransactionDetail'

type SubPage = 'dashboard' | 'transactions' | 'budgets' | 'events'

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const FinancePage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useLocale()
  const { toast } = useToast()
  const [activeLedgerId, setActiveLedgerId] = useState<number | null>(null)
  const [subPage, setSubPage] = useState<SubPage>('dashboard')
  const [showNewLedger, setShowNewLedger] = useState(false)
  const [newLedgerName, setNewLedgerName] = useState('')
  const [showTxForm, setShowTxForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<import('../hooks/useFinance').Budget | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<import('../hooks/useFinance').FinanceEvent | null>(null)
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
  const { transactions, total, loadingMore, hasMore, fetchTransactions, loadMore, createTransaction, updateTransaction, deleteTransaction } = useTransactions(activeLedgerId, txFilters)

  React.useEffect(() => {
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

  const handleTransactionClick = (tx: Transaction) => {
    setDetailTx(tx)
  }

  const handleEditFromDetail = () => {
    setDetailTx(null)
    setEditTx(detailTx)
    setShowTxForm(true)
  }

  const handleDeleteFromDetail = async (id: number) => {
    try {
      await deleteTransaction(id)
      setDetailTx(null)
    } catch {
      toast(t('finance.transactionDeleteFailed'), 'error')
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id)
    } catch {
      toast(t('finance.transactionDeleteFailed'), 'error')
    }
  }

  const handleCreateBudget = async (fields: Record<string, unknown>) => {
    try {
      await createBudget({ ...fields, ledger_id: activeLedgerId })
      setShowBudgetForm(false)
      setEditingBudget(null)
    } catch {
      toast(t('finance.budgetCreateFailed'), 'error')
    }
  }

  const handleUpdateBudget = async (fields: Record<string, unknown>) => {
    if (!editingBudget) return
    try {
      await updateBudget(editingBudget.id, fields)
      setShowBudgetForm(false)
      setEditingBudget(null)
    } catch {
      toast(t('finance.budgetUpdateFailed'), 'error')
    }
  }

  const handleDeleteBudget = async (id: number) => {
    try {
      await deleteBudget(id)
    } catch {
      toast(t('finance.budgetDeleteFailed'), 'error')
    }
  }

  const openEditBudget = (b: import('../hooks/useFinance').Budget) => {
    setEditingBudget(b)
    setShowBudgetForm(true)
  }

  const openNewBudget = () => {
    setEditingBudget(null)
    setShowBudgetForm(true)
  }

  const handleCreateEvent = async (fields: Record<string, unknown>) => {
    try {
      await createEvent({ ...fields, ledger_id: activeLedgerId })
      setShowEventForm(false)
      setEditingEvent(null)
    } catch {
      toast(t('finance.eventCreateFailed'), 'error')
    }
  }

  const handleUpdateEvent = async (fields: Record<string, unknown>) => {
    if (!editingEvent) return
    try {
      await updateEvent(editingEvent.id, fields)
      setShowEventForm(false)
      setEditingEvent(null)
    } catch {
      toast(t('finance.eventUpdateFailed'), 'error')
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteEvent(id)
    } catch {
      toast(t('finance.eventDeleteFailed'), 'error')
    }
  }

  const openEditEvent = (ev: import('../hooks/useFinance').FinanceEvent) => {
    setEditingEvent(ev)
    setShowEventForm(true)
  }

  const openNewEvent = () => {
    setEditingEvent(null)
    setShowEventForm(true)
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <button className="finance-back-btn" onClick={() => navigate('/')} title="Home">
          ← Home
        </button>
        <h1 className="finance-title">Finance</h1>
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

      {activeLedger ? (
        <>
          <nav className="finance-subnav">
            {(['dashboard', 'transactions', 'budgets', 'events'] as SubPage[]).map((p) => (
              <button
                key={p}
                className={`finance-subnav-btn ${subPage === p ? 'active' : ''}`}
                onClick={() => setSubPage(p)}
              >
                {t(`finance.${p}`)}
              </button>
            ))}
          </nav>

          <div className="finance-content">
            {subPage === 'dashboard' && (
              <FinanceDashboard
                dashboard={dashboard}
                accounts={accounts}
                budgets={budgets}
                categories={categories}
                stats={stats}
                period={period}
                onPeriodChange={setPeriod}
                onCreateAccount={(f) => createAccount({ ...f, ledger_id: activeLedgerId })}
                onDeleteAccount={(id) => deleteAccount(id)}
                onCreateCategory={(f) => createCategory({ ...f, ledger_id: activeLedgerId })}
                onUpdateCategory={(id, f) => updateCategory(id, f)}
                onDeleteCategory={(id) => deleteCategory(id)}
                tags={tags}
                onCreateTag={(name) => createTag(activeLedgerId!, name)}
                onDeleteTag={(id) => deleteTag(id)}
                onTransactionClick={handleTransactionClick}
              />
            )}

            {subPage === 'transactions' && (
              <div className="finance-placeholder">
                <div className="finance-section-header">
                  <h3>{t('finance.transactions')}</h3>
                  <button className="btn-submit" onClick={() => { setEditTx(null); setShowTxForm(true) }}>
                    + {t('finance.newTransaction')}
                  </button>
                </div>

                <TxFilterBar
                  accounts={accounts}
                  categories={categories}
                  tags={tags}
                  events={events}
                  filters={txFilters}
                  onFiltersChange={setTxFilters}
                />

                <p className="text-muted">{total} transactions</p>
                {transactions.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem', padding: '20px 0' }}>
                    {t('finance.noTransactions')}
                  </p>
                ) : (
                  <div className="finance-tx-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="finance-tx-row" onClick={() => handleTransactionClick(tx)}>
                        <span className={`finance-tx-type finance-tx-${tx.type}`}>
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : 'S'}
                        </span>
                        <span className="finance-tx-amount">{fmt(tx.amount)}</span>
                        <span className="finance-tx-cat">{tx.category?.name || '-'}</span>
                        <span className="finance-tx-note">{tx.note || ''}</span>
                        <span className="finance-tx-date">{tx.occurred_at?.slice(0, 10)}</span>
                        <button
                          className="finance-tx-del"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id) }}
                        >x</button>
                      </div>
                    ))}
                    {hasMore && (
                      <div ref={sentinelRef} className="finance-load-more">
                        {loadingMore ? t('finance.loading') : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {subPage === 'budgets' && (
              <div className="finance-placeholder">
                <div className="finance-section-header">
                  <h3>{t('finance.budgets')}</h3>
                  <button className="btn-submit" onClick={openNewBudget}>+ {t('finance.newBudget')}</button>
                </div>
                {budgets.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noBudgets')}</p>
                ) : (
                  budgets.map((b) => (
                    <div key={b.id} className="finance-budget-row">
                      <span>{b.name}</span>
                      <div className="finance-budget-bar">
                        <div
                          className="finance-budget-fill"
                          style={{ width: `${Math.min(Number(b.progress_pct) || 0, 100)}%` }}
                        />
                      </div>
                      <span>{fmt(b.current_spent, 0)} / {fmt(b.amount, 0)}</span>
                      <div className="finance-budget-row-actions">
                        <button className="btn-sm" onClick={() => openEditBudget(b)}>{t('app.edit')}</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDeleteBudget(b.id)}>x</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {subPage === 'events' && (
              <div className="finance-placeholder">
                <div className="finance-section-header">
                  <h3>{t('finance.events')}</h3>
                  <button className="btn-submit" onClick={openNewEvent}>+ {t('finance.newEvent')}</button>
                </div>
                {events.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noEvents')}</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="finance-event-row">
                      <span className="dot" style={{ background: ev.color }} />
                      <span>{ev.name}</span>
                      <span>{ev.transaction_count} tx</span>
                      <span>{fmt(ev.total_amount)}</span>
                      <div className="finance-budget-row-actions">
                        <button className="btn-sm" onClick={() => openEditEvent(ev)}>{t('app.edit')}</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDeleteEvent(ev.id)}>x</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="finance-empty">
          <p>{t('finance.noLedger')}</p>
          <button className="btn-submit" onClick={() => setShowNewLedger(true)}>
            {t('finance.createFirstLedger')}
          </button>
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
          onEdit={handleEditFromDetail}
          onDelete={() => handleDeleteFromDetail(detailTx.id)}
          onClose={() => setDetailTx(null)}
        />
      )}
    </div>
  )
}

export default FinancePage
