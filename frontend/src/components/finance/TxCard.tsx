/*
 TxCard: 单笔交易卡片. < 768px 移动端用此组件堆叠展示, 替代溢出的桌面表格行.
 桌面端 (>= 768px) 由 FinancePage 的表格行直接渲染, 不走此组件.
*/

import React from 'react'
import type { Transaction } from '../../hooks/finance'
import IconButton from '../ui/IconButton'
import './TxCard.css'

interface Props {
  tx: Transaction
  onClick: (tx: Transaction) => void
  onDelete: (id: number) => void
  formatAmount: (v: unknown, digits?: number) => string
  deleteLabel: string
}

const TxCard: React.FC<Props> = ({ tx, onClick, onDelete, formatAmount, deleteLabel }) => {
  const sign = tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''
  const variantClass = `tx-card-amount tx-card-amount-${tx.type}`
  return (
    <div className="tx-card" onClick={() => onClick(tx)} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick(tx) }}>
      <div className="tx-card-row1">
        <span className="tx-card-cat">{tx.category?.name || '—'}</span>
        <span className={variantClass}>{sign}{formatAmount(tx.amount)}</span>
      </div>
      <div className="tx-card-row2">
        <span className="tx-card-meta">{tx.account?.name || '—'}</span>
        <span className="tx-card-meta">{tx.occurred_at?.slice(0, 10) || ''}</span>
      </div>
      {tx.note && <p className="tx-card-note">{tx.note}</p>}
      <div className="tx-card-actions" onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label={deleteLabel}
          size="sm"
          variant="danger"
          onClick={() => onDelete(tx.id)}
        >🗑</IconButton>
      </div>
    </div>
  )
}

export default TxCard
