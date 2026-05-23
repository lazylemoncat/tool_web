/*
  DashboardPage: 仪表盘子页面.
*/
import React from 'react'
import { useOutletContext } from 'react-router-dom'
import type { FinanceContext } from './FinanceLayout'
import FinanceDashboard from '../../components/finance/FinanceDashboard'

const DashboardPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()
  return (
    <FinanceDashboard
      dashboard={ctx.dashboard}
      accounts={ctx.accounts}
      budgets={ctx.budgets}
      categories={ctx.categories}
      stats={ctx.stats}
      period={ctx.period}
      onPeriodChange={ctx.setPeriod}
      onCreateAccount={ctx.handleCreateAccount}
      onDeleteAccount={ctx.handleDeleteAccount}
      onCreateCategory={ctx.handleCreateCategory}
      onUpdateCategory={ctx.handleUpdateCategory}
      onDeleteCategory={ctx.handleDeleteCategory}
      tags={ctx.tags}
      onCreateTag={ctx.handleCreateTag}
      onDeleteTag={ctx.handleDeleteTag}
      onTransactionClick={ctx.handleTransactionClick}
    />
  )
}

export default DashboardPage
