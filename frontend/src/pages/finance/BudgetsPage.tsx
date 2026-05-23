/*
  BudgetsPage: 预算列表子页面.
*/
import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { Button, EmptyState, IconButton } from '../../components/ui'
import type { FinanceContext } from './FinanceLayout'

const BudgetsPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()
  const { t } = useLocale()

  return (
    <div className="finance-placeholder">
      <div className="finance-section-header">
        <h3>{t('finance.budgets')}</h3>
        <Button onClick={ctx.openNewBudget}>+ {t('finance.newBudget')}</Button>
      </div>
      {ctx.budgets.length === 0 ? (
        <EmptyState
          icon="📊"
          title={t('finance.noBudgets')}
          description={t('finance.noBudgetsHint')}
          action={<Button onClick={ctx.openNewBudget}>+ {t('finance.newBudget')}</Button>}
        />
      ) : (
        ctx.budgets.map((b) => (
          <div key={b.id} className="finance-budget-row">
            <span>{b.name}</span>
            <div className="finance-budget-bar">
              <div
                className="finance-budget-fill"
                style={{ width: `${Math.min(Number(b.progress_pct) || 0, 100)}%` }}
              />
            </div>
            <span>{ctx.fmt(b.current_spent, 0)} / {ctx.fmt(b.amount, 0)}</span>
            <div className="finance-budget-row-actions">
              <Button size="sm" variant="secondary" onClick={() => ctx.openEditBudget(b)}>{t('app.edit')}</Button>
              <IconButton aria-label={t('app.delete')} size="sm" variant="danger" onClick={() => ctx.handleDeleteBudget(b.id)}>🗑</IconButton>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default BudgetsPage
