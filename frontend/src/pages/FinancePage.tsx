/*
  Finance 主页面: Dashboard, Transaction List, Budget, Event 子页面.
*/

import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useLedgers, useAccounts, useCategories, useFinanceTags,
  useTransactions, useEvents, useBudgets, useDashboard, useStats,
  type TransactionFilters,
} from '../hooks/useFinance'
import { useLocale } from '../i18n'
import { useToast } from '../components/common/Toast'
import FinanceDashboard from '../components/finance/FinanceDashboard'
import TransactionForm, { type TransactionFormData } from '../components/finance/TransactionForm'

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

  const { ledgers, createLedger, deleteLedger } = useLedgers()
  const { accounts, createAccount } = useAccounts(activeLedgerId)
  const { categories, createCategory } = useCategories(activeLedgerId)
  const { tags, createTag } = useFinanceTags(activeLedgerId)
  const { dashboard } = useDashboard(activeLedgerId)
  const { events } = useEvents(activeLedgerId)
  const { budgets } = useBudgets(activeLedgerId)

  const [txFilters, setTxFilters] = useState<TransactionFilters>({})
  const { transactions, total, fetchTransactions, createTransaction, deleteTransaction } = useTransactions(activeLedgerId, txFilters)

  React.useEffect(() => {
    if (!activeLedgerId && ledgers.length > 0) {
      setActiveLedgerId(ledgers[0].id)
    }
  }, [ledgers, activeLedgerId])

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

  const handleCreateTransaction = useCallback(async (data: TransactionFormData) => {
    try {
      await createTransaction({
        ...data,
        ledger_id: activeLedgerId,
      } as unknown as Record<string, unknown>)
      setShowTxForm(false)
    } catch {
      toast(t('finance.transactionCreateFailed'), 'error')
    }
  }, [activeLedgerId, createTransaction, toast, t])

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id)
    } catch {
      toast(t('finance.transactionDeleteFailed'), 'error')
    }
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
                onCreateAccount={(f) => createAccount({ ...f, ledger_id: activeLedgerId })}
              />
            )}

            {subPage === 'transactions' && (
              <div className="finance-placeholder">
                <div className="finance-section-header">
                  <h3>{t('finance.transactions')}</h3>
                  <button className="btn-submit" onClick={() => setShowTxForm(true)}>
                    + {t('finance.newTransaction')}
                  </button>
                </div>
                <p className="text-muted">{total} transactions</p>
                {transactions.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem', padding: '20px 0' }}>
                    {t('finance.noTransactions')}
                  </p>
                ) : (
                  <div className="finance-tx-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="finance-tx-row">
                        <span className={`finance-tx-type finance-tx-${tx.type}`}>
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : 'S'}
                        </span>
                        <span className="finance-tx-amount">{fmt(tx.amount)}</span>
                        <span className="finance-tx-cat">{tx.category?.name || '-'}</span>
                        <span className="finance-tx-note">{tx.note || ''}</span>
                        <span className="finance-tx-date">{tx.occurred_at?.slice(0, 10)}</span>
                        <button
                          className="finance-tx-del"
                          onClick={() => handleDeleteTransaction(tx.id)}
                        >x</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {subPage === 'budgets' && (
              <div className="finance-placeholder">
                <h3>{t('finance.budgets')}</h3>
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
                    </div>
                  ))
                )}
              </div>
            )}

            {subPage === 'events' && (
              <div className="finance-placeholder">
                <h3>{t('finance.events')}</h3>
                {events.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noEvents')}</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="finance-event-row">
                      <span className="dot" style={{ background: ev.color }} />
                      <span>{ev.name}</span>
                      <span>{ev.transaction_count} tx</span>
                      <span>{fmt(ev.total_amount)}</span>
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
          onSubmit={handleCreateTransaction}
          onClose={() => setShowTxForm(false)}
        />
      )}
    </div>
  )
}

export default FinancePage
