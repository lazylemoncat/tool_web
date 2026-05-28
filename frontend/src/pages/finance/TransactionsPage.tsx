/*
  TransactionsPage: 交易列表子页面, 含筛选 + 无限滚动 + 空状态.
*/
import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { Button, EmptyState, IconButton, Skeleton } from '../../components/ui'
import TxFilterBar from '../../components/finance/TxFilterBar'
import TxCard from '../../components/finance/TxCard'
import TxChildrenDrawer from '../../components/finance/TxChildrenDrawer'
import type { Transaction } from '../../hooks/finance'
import type { FinanceContext } from './FinanceLayout'

const TransactionsPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()
  const { t } = useLocale()
  const [childDrawerTx, setChildDrawerTx] = useState<Transaction | null>(null)

  const openChildDrawer = (tx: Transaction) => setChildDrawerTx(tx)
  const childDrawerFreshTx = childDrawerTx
    ? ctx.transactions.find((tx) => tx.id === childDrawerTx.id) ?? childDrawerTx
    : null

  return (
    <div className="finance-placeholder">
      <div className="finance-section-header">
        <h3>{t('finance.transactions')}</h3>
        <Button onClick={() => { ctx.setEditTx(null); ctx.setShowTxForm(true) }}>
          + {t('finance.newTransaction')}
        </Button>
      </div>

      <TxFilterBar
        accounts={ctx.accounts}
        categories={ctx.categories}
        tags={ctx.tags}
        events={ctx.events}
        filters={ctx.txFilters}
        onFiltersChange={ctx.setTxFilters}
      />

      <p className="text-muted">{ctx.total} transactions</p>
      {ctx.txLoading ? (
        <div className="finance-tx-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="finance-tx-row" style={{ pointerEvents: 'none' }}>
              <Skeleton variant="text" width={20} />
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={60} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width={80} />
            </div>
          ))}
        </div>
      ) : ctx.transactions.length === 0 ? (
        <EmptyState
          icon="💸"
          title={t('finance.noTransactions')}
          description={t('finance.noTransactionsHint')}
          action={
            <Button onClick={() => { ctx.setEditTx(null); ctx.setShowTxForm(true) }}>
              + {t('finance.newTransaction')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="finance-tx-list">
            {ctx.transactions.map((tx) => (
              <div key={tx.id} className="finance-tx-row" onClick={() => ctx.handleTransactionClick(tx)}>
                <span className={`finance-tx-type finance-tx-${tx.type}`}>
                  {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : 'S'}
                </span>
                <span className="finance-tx-amount">{ctx.fmt(tx.amount)}</span>
                <span className="finance-tx-cat">{tx.category?.name || '-'}</span>
                <span className="finance-tx-note">{tx.note || ''}</span>
                <button
                  className="finance-child-pill"
                  onClick={(e) => { e.stopPropagation(); openChildDrawer(tx) }}
                >
                  {(tx.children?.length ?? 0) > 0
                    ? `${tx.children!.length} / ${ctx.fmt(tx.children!.reduce((sum, child) => sum + Number(child.amount || 0), 0))}`
                    : t('finance.addChildTransaction')}
                </button>
                <span className="finance-tx-date">{tx.occurred_at?.slice(0, 10)}</span>
                <IconButton
                  aria-label={t('app.delete')}
                  size="sm"
                  variant="danger"
                  onClick={(e) => { e.stopPropagation(); ctx.handleDeleteTransaction(tx.id) }}
                >🗑</IconButton>
              </div>
            ))}
          </div>
          <div className="tx-card-list">
            {ctx.transactions.map((tx) => (
              <TxCard
                key={tx.id}
                tx={tx}
                onClick={ctx.handleTransactionClick}
                onOpenChildren={openChildDrawer}
                onDelete={ctx.handleDeleteTransaction}
                formatAmount={ctx.fmt}
                deleteLabel={t('app.delete')}
                addChildLabel={t('finance.addChildTransaction')}
              />
            ))}
          </div>
          {ctx.hasMore && (
            <div ref={ctx.sentinelRef} className="finance-load-more">
              {ctx.loadingMore ? <Skeleton variant="text" lines={2} /> : ''}
            </div>
          )}
        </>
      )}
      {childDrawerFreshTx && (
        <TxChildrenDrawer
          open={!!childDrawerTx}
          onOpenChange={(open) => { if (!open) setChildDrawerTx(null) }}
          parentTx={childDrawerFreshTx}
          accounts={ctx.accounts}
          categories={ctx.categories}
          tags={ctx.tags}
          onRefresh={ctx.refreshTransactions}
          formatAmount={ctx.fmt}
        />
      )}
    </div>
  )
}

export default TransactionsPage
