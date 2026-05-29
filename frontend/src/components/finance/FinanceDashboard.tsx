import React, { useState } from 'react'
import type { DashboardSummary, Account, Budget, FinanceCategory, Transaction, StatsData } from '../../hooks/finance'
import FinanceCharts from './FinanceCharts'
import { formatTransactionTitle } from './transactionDisplay'
import { useLocale } from '../../i18n'

interface Props {
  dashboard: DashboardSummary | null
  accounts: Account[]
  budgets: Budget[]
  categories: FinanceCategory[]
  stats: StatsData | null
  period: string
  onPeriodChange: (p: string) => void
  onTransactionClick: (tx: Transaction) => void
}

const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FinanceDashboard: React.FC<Props> = ({
  dashboard, accounts, budgets, categories, stats, period, onPeriodChange,
  onTransactionClick,
}) => {
  const { t } = useLocale()
  const [showBudgetItems, setShowBudgetItems] = useState(false)
  const [hiddenBudgetIds, setHiddenBudgetIds] = useState<number[]>([])
  const income = dashboard?.month_income ?? 0
  const expense = dashboard?.month_expense ?? 0
  const balance = income - expense
  const budgetPct = dashboard?.budget_usage_pct ?? 0
  const totalAssets = accounts.reduce((s, a) => s + (a.current_balance || 0), 0)
  const recentTxs = dashboard?.recent_transactions ?? []
  const toggleBudgetVisibility = (id: number) => {
    setHiddenBudgetIds((prev) => prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id])
  }

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
      <div className="dashboard-section-card" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">预算使用率</span>
          {budgets.length > 0 && (
            <button className="btn-sm" type="button" onClick={() => setShowBudgetItems((v) => !v)}>
              {showBudgetItems ? t('finance.hideBudgetItems') : t('finance.showBudgetItems')}
            </button>
          )}
        </div>
        <div className="dashboard-budget-overview">
          <span className="dashboard-budget-amount">
            ¥{fmtShort(budgets.reduce((s, b) => s + (b.current_spent || 0), 0))}
          </span>
          <span className="dashboard-budget-total">
            / ¥{fmtShort(budgets.reduce((s, b) => s + b.amount, 0))}
          </span>
          <span className="dashboard-budget-pct">{Number(budgetPct).toFixed(1)}%</span>
        </div>
        <div className="dashboard-progress-bar">
          <div
            className={`dashboard-progress-fill ${budgetPct > 100 ? 'danger' : budgetPct > 80 ? 'warn' : 'safe'}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
        {showBudgetItems && (
          <div className="dashboard-budget-items">
            {budgets.map((budget) => {
              const isHidden = hiddenBudgetIds.includes(budget.id)
              const pct = Math.min(Number(budget.progress_pct) || 0, 100)
              const level = pct >= 100 ? 'danger' : pct >= (budget.alert_threshold || 80) ? 'warn' : 'safe'
              return (
                <div key={budget.id} className={`dashboard-budget-item ${isHidden ? 'is-hidden' : ''}`}>
                  <div className="dashboard-budget-item-main">
                    <span className="dashboard-budget-item-name">{budget.name}</span>
                    {isHidden ? (
                      <span className="dashboard-budget-item-muted">{t('finance.hidden')}</span>
                    ) : (
                      <span className="dashboard-budget-item-amount">
                        ¥{fmtShort(Number(budget.current_spent) || 0)} / ¥{fmtShort(Number(budget.amount) || 0)}
                      </span>
                    )}
                  </div>
                  {!isHidden && (
                    <div className="dashboard-budget-item-bar">
                      <div className={`dashboard-budget-item-fill ${level}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <button className="btn-sm" type="button" onClick={() => toggleBudgetVisibility(budget.id)}>
                    {isHidden ? t('finance.show') : t('finance.hide')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
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
      <div className="dashboard-section-card" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">最近交易</span>
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
                  <span className="dashboard-tx-name">{formatTransactionTitle(cat?.name, tx.note, t('finance.uncategorized'))}</span>
                  <span className="dashboard-tx-meta">
                    {tx.occurred_at?.slice(0, 10)} · {acc?.name || '—'}
                    {tx.tags?.map((t: any) => (
                      <span key={t.id} className="tag-pill">{t.name}</span>
                    ))}
                  </span>
                </div>
                <span className={`dashboard-tx-amount ${isExpense ? 'expense' : isIncome ? 'income' : 'transfer'}`}>
                  {isExpense ? '-' : isIncome ? '+' : ''}¥{Number(tx.amount).toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default FinanceDashboard
