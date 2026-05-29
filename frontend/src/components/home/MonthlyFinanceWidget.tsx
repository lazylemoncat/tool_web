/*
 MonthlyFinanceWidget — 首页本月记账概览.
 展示首个账本的收入, 支出, 结余和紧凑柱状图.
*/

import React from 'react'
import { useLocale } from '../../i18n'
import { useLedgers } from '../../hooks/finance/useLedgers'
import { useDashboard } from '../../hooks/finance/useDashboard'
import { Skeleton } from '../ui'

const MonthlyFinanceWidget: React.FC = () => {
  const { t } = useLocale()
  const { ledgers, loading: ledgersLoading } = useLedgers()
  const firstLedgerId = ledgers.length > 0 ? ledgers[0].id : null
  const { dashboard, loading } = useDashboard(firstLedgerId)

  const income = Number(dashboard?.month_income ?? 0)
  const expense = Number(dashboard?.month_expense ?? 0)
  const balance = income - expense
  const maxAmount = Math.max(income, expense, Math.abs(balance), 1)
  const chartItems = [
    { key: 'income', label: t('finance.income'), value: income, tone: 'income' },
    { key: 'expense', label: t('finance.expense'), value: expense, tone: 'expense' },
    { key: 'balance', label: t('finance.balance'), value: Math.abs(balance), tone: balance >= 0 ? 'income' : 'expense' },
  ]

  return (
    <div className="home-bookkeeping-widget">
      {(ledgersLoading || loading) ? (
        <div className="home-widget-skeletons">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="64%" />
          <Skeleton variant="block" width="100%" height={96} />
        </div>
      ) : firstLedgerId === null ? (
        <p className="home-widget-empty">{t('finance.noLedgers')}</p>
      ) : (
        <>
          <div className="home-bookkeeping-summary">
            <div>
              <span>{t('finance.income')}</span>
              <strong className="income">+¥ {income.toFixed(2)}</strong>
            </div>
            <div>
              <span>{t('finance.expense')}</span>
              <strong className="expense">-¥ {expense.toFixed(2)}</strong>
            </div>
            <div>
              <span>{t('finance.balance')}</span>
              <strong className={balance >= 0 ? 'income' : 'expense'}>
                {balance >= 0 ? '+' : '-'}¥ {Math.abs(balance).toFixed(2)}
              </strong>
            </div>
          </div>
          <div className="home-bookkeeping-chart" aria-label={t('home.monthlyBookkeepingChart')}>
            {chartItems.map((item) => (
              <div key={item.key} className="home-bookkeeping-bar-group">
                <div className="home-bookkeeping-bar-track">
                  <span
                    className={`home-bookkeeping-bar ${item.tone}`}
                    style={{ height: `${Math.max((item.value / maxAmount) * 100, 8)}%` }}
                  />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MonthlyFinanceWidget
