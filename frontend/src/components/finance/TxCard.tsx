/*
 TxCard — 单笔交易卡片 (行内布局).
 支持展开子交易、删除确认、金额颜色区分。
*/

import React, { useState } from 'react'
import type { Transaction } from '../../hooks/finance'
import { useConfirm, useToast } from '../ui'
import { useLocale } from '../../i18n'
import { formatTransactionTitle } from './transactionDisplay'

interface Props {
  tx: Transaction
  onClick: (tx: Transaction) => void
  onDelete: (id: number) => Promise<void>
  formatAmount: (v: unknown, digits?: number) => string
}

const TxCard: React.FC<Props> = ({ tx, onClick, onDelete, formatAmount }) => {
  const confirm = useConfirm()
  const toast = useToast()
  const { t } = useLocale()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await confirm({ title: '删除交易', description: '确定删除该条交易记录吗？', danger: true })
    if (!ok) return
    setDeleting(true)
    try { await onDelete(tx.id) }
    catch { toast({ message: '删除失败', variant: 'error' }) }
    finally { setDeleting(false) }
  }

  const isExpense = tx.type === 'expense'
  const isIncome = tx.type === 'income'
  const amountSign = isExpense ? '-' : isIncome ? '+' : ''
  const amountClass = isExpense ? 'tx-amount-expense' : isIncome ? 'tx-amount-income' : 'tx-amount-transfer'
  const iconClass = isExpense ? 'tx-icon-expense' : isIncome ? 'tx-icon-income' : 'tx-icon-transfer'
  const hasChildren = (tx.children && tx.children.length > 0) || (tx.split_items && tx.split_items.length > 0)
  const fallbackTitle = t('finance.uncategorized')

  return (
    <>
      <div className="tx-row" onClick={() => onClick(tx)}>
        <span className={`tx-row-icon ${iconClass}`}>
          {tx.category?.icon || (isExpense ? '💳' : isIncome ? '💰' : '🔄')}
        </span>
        <div className="tx-row-info">
          <span className="tx-row-title">
            {formatTransactionTitle(tx.category?.name, tx.note, fallbackTitle)}
          </span>
          <span className="tx-row-meta">
            {tx.occurred_at?.slice(0, 10)} · {tx.account?.name || '—'}
            {tx.tags?.map((t: any) => (
              <span key={t.id || t.name} className="tx-tag-pill">{typeof t === 'string' ? t : t.name}</span>
            ))}
            {hasChildren && <span className="tx-split-badge">📎 拆分</span>}
          </span>
        </div>
        <span className={`tx-row-amount ${amountClass}`}>
          {amountSign}¥{formatAmount(tx.amount)}
        </span>
        <button className="tx-row-delete" onClick={handleDelete} disabled={deleting} title="删除">✕</button>
      </div>

      {tx.children?.map((child: Transaction) => {
        const cExpense = child.type === 'expense'
        return (
          <div key={child.id} className="tx-row tx-row-child" onClick={() => onClick(child)}>
            <span className={`tx-row-icon child ${cExpense ? 'tx-icon-expense' : 'tx-icon-income'}`}>
              {child.category?.icon || '💳'}
            </span>
            <div className="tx-row-info">
              <span className="tx-row-title child">└ {formatTransactionTitle(child.category?.name, child.note, fallbackTitle)}</span>
              <span className="tx-row-meta">{child.occurred_at?.slice(0, 10)}</span>
            </div>
            <span className={`tx-row-amount child ${cExpense ? 'tx-amount-expense' : 'tx-amount-income'}`}>
              {cExpense ? '-' : '+'}¥{formatAmount(child.amount)}
            </span>
            <span style={{ width: 28 }} />
          </div>
        )
      })}
    </>
  )
}

export default TxCard
