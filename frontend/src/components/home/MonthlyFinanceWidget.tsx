/*
 MonthlyFinanceWidget — 本月收支概览.
*/

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { useLedgers } from '../../hooks/finance/useLedgers'
import { useDashboard } from '../../hooks/finance/useDashboard'
import { Card, CardHeader, CardBody, Skeleton } from '../ui'

const MonthlyFinanceWidget: React.FC = () => {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { ledgers, loading: ledgersLoading } = useLedgers()
  const firstLedgerId = ledgers.length > 0 ? ledgers[0].id : null
  const { dashboard, loading } = useDashboard(firstLedgerId)

  const income = Number(dashboard?.month_income ?? 0)
  const expense = Number(dashboard?.month_expense ?? 0)
  const balance = income - expense

  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{t('home.monthlyFinance')}</h3>
      </CardHeader>
      <CardBody>
        {(ledgersLoading || loading) ? (
          <>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </>
        ) : firstLedgerId === null ? (
          <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.85rem' }}>{t('finance.noLedgers')}</p>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>{t('finance.income')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-income)' }}>+¥{income.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>{t('finance.expense')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-expense)' }}>-¥{expense.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>{t('finance.balance')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>¥{balance.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default MonthlyFinanceWidget
