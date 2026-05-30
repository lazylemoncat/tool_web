/*
  TransactionsPage: 交易列表子页面, 含筛选 + 无限滚动 + 空状态.
*/

import React from 'react'
import { useOutletContext } from 'umi'
import type { FinanceContext } from './FinanceLayout'
import TxCard from '../../components/finance/TxCard'
import TxFilterBar from '../../components/finance/TxFilterBar'
import FinanceSortableList from '../../components/finance/FinanceSortableList'
import { Skeleton } from '../../components/ui'

const TransactionsPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()

  return (
    <div>
      <TxFilterBar
        accounts={ctx.accounts}
        categories={ctx.categories}
        tags={ctx.tags}
        events={ctx.events}
        filters={ctx.txFilters}
        onFiltersChange={ctx.setTxFilters}
      />

      <div className="db-card">
        {ctx.txLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={48} />
            ))}
          </div>
        ) : ctx.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>没有匹配的交易记录</p>
          </div>
        ) : (
          <FinanceSortableList className="tx-list" items={ctx.transactions} onReorder={ctx.reorderTransactions}>
            {(tx) => (
              <TxCard
                key={tx.id}
                tx={tx}
                onClick={ctx.handleTransactionClick}
                onDelete={ctx.handleDeleteTransaction}
                formatAmount={ctx.fmt}
              />
            )}
          </FinanceSortableList>
        )}

        {ctx.hasMore && (
          <div ref={ctx.sentinelRef} className="finance-load-more">
            {ctx.loadingMore ? '加载中...' : '加载更多'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage
