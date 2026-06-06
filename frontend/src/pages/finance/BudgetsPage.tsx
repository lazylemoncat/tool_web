/*
  BudgetsPage: 预算列表子页面.
*/
import React from 'react'
import { useOutletContext } from 'umi'
import { useLocale } from '../../i18n'
import { Button, EmptyState, IconButton } from '../../components/ui'
import type { FinanceContext } from './FinanceLayout'
import FinanceSortableList from '../../components/finance/FinanceSortableList'

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
        <FinanceSortableList className="budget-cards" items={ctx.budgets} onReorder={ctx.reorderBudgets}>
          {(b) => {
            const pct = Math.min(Number(b.progress_pct) || 0, 100)
            const threshold = b.alert_threshold || 80
            const level = pct >= 100 ? 'danger' : pct >= threshold ? 'warn' : 'safe'

            return (
              <div
                key={b.id}
                className={`budget-card ${pct >= 100 ? 'over-budget' : pct >= threshold ? 'warning-budget' : ''}`}
              >
                <div className="budget-card-header">
                  <span className="budget-card-category">{b.name}</span>
                  {b.rrule && <span className="budget-card-period">{b.rrule}</span>}
                </div>

                <div className="budget-card-amounts">
                  <span className="budget-card-spent">{ctx.fmt(b.current_spent, 0)}</span>
                  <span className="budget-card-total">/ {ctx.fmt(b.amount, 0)}</span>
                </div>

                <div className="budget-progress-bar">
                  <div
                    className={`budget-progress-fill ${level}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="budget-card-footer">
                  <span>{Math.round(pct)}%</span>
                  <span className={`budget-card-status ${level === 'danger' ? 'over' : level}`}>
                    {pct >= 100 ? t('finance.overBudget') : pct >= threshold ? t('finance.nearLimit') : t('finance.onTrack')}
                  </span>
                  <div className="finance-budget-row-actions">
                    <Button size="sm" variant="secondary" onClick={() => ctx.openEditBudget(b)}>{t('app.edit')}</Button>
                    <IconButton aria-label={t('app.delete')} size="sm" variant="danger" onClick={() => ctx.handleDeleteBudget(b.id)}>🗑</IconButton>
                  </div>
                </div>
              </div>
            )
          }}
        </FinanceSortableList>
      )}
    </div>
  )
}

export default BudgetsPage
