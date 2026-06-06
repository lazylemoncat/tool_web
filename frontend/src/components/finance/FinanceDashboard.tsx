/*
  Finance Dashboard: 资产卡片 + 预算卡片 + 最近交易.
*/

import React from 'react'
import type { DashboardSummary, Account, Budget, StatsData, FinanceCategory, FinanceTag, Transaction } from '../../hooks/useFinance'
import { useLocale } from '../../i18n'
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

const DEFAULT_TYPES = ['现金', '微信', '支付宝', '银行卡', '信用卡']

const loadTypes = (): string[] => {
  try {
    const saved = localStorage.getItem('finance-account-types')
    return saved ? JSON.parse(saved) : DEFAULT_TYPES
  } catch { return DEFAULT_TYPES }
}

const saveTypes = (types: string[]) => {
  localStorage.setItem('finance-account-types', JSON.stringify(types))
}

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const FinanceDashboard: React.FC<Props> = ({ dashboard, accounts, budgets, categories, tags, stats, period, onPeriodChange, onCreateAccount, onDeleteAccount, onCreateCategory, onUpdateCategory, onDeleteCategory, onCreateTag, onDeleteTag, onTransactionClick }) => {
  const { t } = useLocale()
  const [showNewAccount, setShowNewAccount] = React.useState(false)
  const [acctName, setAcctName] = React.useState('')
  const [acctType, setAcctType] = React.useState('现金')
  const [editTypes, setEditTypes] = React.useState(false)
  const [types, setTypes] = React.useState<string[]>(loadTypes)
  const [newType, setNewType] = React.useState('')

  const addType = () => {
    const trimmed = newType.trim()
    if (trimmed && !types.includes(trimmed)) {
      const updated = [...types, trimmed]
      setTypes(updated)
      saveTypes(updated)
      setAcctType(trimmed)
    }
    setNewType('')
    setEditTypes(false)
  }

  const removeType = (name: string) => {
    const updated = types.filter((t) => t !== name)
    setTypes(updated)
    saveTypes(updated)
    if (acctType === name) setAcctType(updated[0] || '现金')
  }

  const handleCreateAccount = async () => {
    if (!acctName.trim()) return
    onCreateAccount({ name: acctName.trim(), type: acctType })
    setAcctName('')
    setShowNewAccount(false)
  }

  if (!dashboard) {
    return <div className="finance-loading"><p>{t('finance.loading')}</p></div>
  }

  return (
    <div className="finance-dashboard">
      <div className="finance-summary-cards">
        <div className="finance-summary-card">
          <div className="finance-summary-label">{t('finance.totalAssets')}</div>
          <div className="finance-summary-value">{fmt(dashboard.total_assets)}</div>
        </div>
        <div className="finance-summary-card income">
          <div className="finance-summary-label">{t('finance.monthIncome')}</div>
          <div className="finance-summary-value">+{fmt(dashboard.month_income)}</div>
        </div>
        <div className="finance-summary-card expense">
          <div className="finance-summary-label">{t('finance.monthExpense')}</div>
          <div className="finance-summary-value">-{fmt(dashboard.month_expense)}</div>
        </div>
        <div className="finance-summary-card">
          <div className="finance-summary-label">{t('finance.budgetUsage')}</div>
          <div className="finance-summary-value">{fmt(dashboard.budget_usage_pct, 0)}%</div>
        </div>
      </div>

      <FinanceCharts stats={stats} period={period} onPeriodChange={onPeriodChange} />

      <div className="finance-section">
        <div className="finance-section-header">
          <h3>{t('finance.accounts')}</h3>
          <button onClick={() => setShowNewAccount(!showNewAccount)} className="btn-sm">
            + {t('finance.newAccount')}
          </button>
        </div>
        {showNewAccount && (
          <div className="finance-form-row">
            <input
              value={acctName}
              onChange={(e) => setAcctName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
              placeholder={t('finance.accountName')}
              className="finance-input"
              autoFocus
            />
            {editTypes ? (
              <div className="finance-type-editor">
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addType()}
                  placeholder={t('finance.typePlaceholder')}
                  className="finance-input-sm"
                  autoFocus
                />
                <button onClick={addType} className="btn-submit">{t('app.confirm')}</button>
                <button onClick={() => setEditTypes(false)} className="btn-cancel">{t('app.cancel')}</button>
              </div>
            ) : (
              <div className="finance-type-picker">
                <select value={acctType} onChange={(e) => setAcctType(e.target.value)} className="finance-select">
                  {types.map((tp) => (
                    <option key={tp} value={tp}>{tp}</option>
                  ))}
                </select>
                <button
                  onClick={() => setEditTypes(true)}
                  className="btn-sm"
                  title={t('finance.editTypes')}
                >+/-</button>
              </div>
            )}
            <button onClick={handleCreateAccount} className="btn-submit">{t('app.confirm')}</button>
          </div>
        )}
        {editTypes && !showNewAccount && (
          <div className="finance-type-list">
            {types.map((tp) => (
              <span key={tp} className="finance-type-tag">
                {tp}
                {types.length > 1 && (
                  <button
                    className="finance-type-del"
                    onClick={() => removeType(tp)}
                    title={t('finance.deleteType')}
                  >x</button>
                )}
              </span>
            ))}
            <div className="finance-type-editor" style={{ display: 'inline-flex', marginTop: 4 }}>
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addType()}
                placeholder={t('finance.typePlaceholder')}
                className="finance-input-sm"
              />
              <button onClick={addType} className="btn-submit">{t('finance.addType')}</button>
            </div>
          </div>
        )}
        {accounts.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noAccounts')}</p>
        ) : (
          <div className="finance-account-list">
            {accounts.map((a) => (
              <div key={a.id} className="finance-account-card">
                <span className="finance-account-name">{a.name}</span>
                <span className="finance-account-type">{a.type}</span>
                <span className="finance-account-balance">{fmt(a.current_balance)}</span>
                <button className="finance-type-del" onClick={() => onDeleteAccount(a.id)} title={t('app.delete')}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryManager
        categories={categories}
        onCreate={onCreateCategory}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
      />

      <TagManager
        tags={tags}
        onCreate={onCreateTag}
        onDelete={onDeleteTag}
      />

      <div className="finance-section">
        <h3>{t('finance.recentTransactions')}</h3>
        {dashboard.recent_transactions.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noTransactions')}</p>
        ) : (
          <div className="finance-tx-list">
            {dashboard.recent_transactions.map((tx) => (
              <div key={tx.id} className="finance-tx-row" onClick={() => onTransactionClick(tx)}>
                <span className={`finance-tx-type finance-tx-${tx.type}`}>
                  {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : 'S'}
                </span>
                <span className="finance-tx-amount">{fmt(tx.amount)}</span>
                <span className="finance-tx-cat">{tx.category?.name || '-'}</span>
                <span className="finance-tx-note">{tx.note || ''}</span>
                <span className="finance-tx-date">{tx.occurred_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FinanceDashboard
