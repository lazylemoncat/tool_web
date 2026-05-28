/*
 TxCard — 单笔交易卡片 (移动端). 删除走 DropdownMenu + ConfirmDialog + Toast 撤销.
*/

import React, { useState } from 'react'
import type { Transaction } from '../../hooks/finance'
import DropdownMenu, { DropdownMenuItem } from '../ui/DropdownMenu'
import IconButton from '../ui/IconButton'
import { useConfirm, useToast } from '../ui'
import './TxCard.css'

interface Props {
  tx: Transaction
  onClick: (tx: Transaction) => void
  onOpenChildren?: (tx: Transaction) => void
  onDelete: (id: number) => Promise<void>
  formatAmount: (v: unknown, digits?: number) => string
  deleteLabel: string
  addChildLabel: string
}

const TxCard: React.FC<Props> = ({ tx, onClick, onOpenChildren, onDelete, formatAmount, deleteLabel, addChildLabel }) => {
  const confirm = useConfirm()
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)

  const sign = tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''
  const variantClass = `tx-card-amount tx-card-amount-${tx.type}`
  const isChild = tx.parent_transaction_id != null
  const childCount = tx.children?.length ?? 0
  const childTotal = tx.children?.reduce((sum, child) => sum + Number(child.amount || 0), 0) ?? 0

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete transaction',
      description: `"${tx.note || tx.category?.name || '—'}" — ${sign}${formatAmount(tx.amount)}`,
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await onDelete(tx.id)
      toast({ message: 'Transaction deleted', variant: 'success' })
    } catch {
      toast({ message: 'Delete failed', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`tx-card${isChild ? ' tx-card-child' : ''}`} onClick={() => onClick(tx)} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick(tx) }}>
      <div className="tx-card-row1">
        <span className="tx-card-cat">
          {isChild && <span className="tx-card-child-indicator">↳ </span>}
          {tx.category?.name || '—'}
        </span>
        <span className={variantClass}>
          {sign}{formatAmount(tx.amount)}
          {childCount > 0 && <span className="tx-card-child-chip"> {childCount} sub</span>}
        </span>
      </div>
      <div className="tx-card-row2">
        <span className="tx-card-meta">{tx.account?.name || '—'}</span>
        <span className="tx-card-meta">{tx.occurred_at?.slice(0, 10) || ''}</span>
      </div>
      {!isChild && (
        <button
          className="tx-card-child-action"
          onClick={(e) => { e.stopPropagation(); onOpenChildren?.(tx) }}
        >
          {childCount > 0 ? `${childCount} / ${formatAmount(childTotal)}` : addChildLabel}
        </button>
      )}
      {tx.note && <p className="tx-card-note">{tx.note}</p>}
      <div className="tx-card-actions" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu
          trigger={
            <IconButton aria-label={deleteLabel} size="sm">⋯</IconButton>
          }
          align="end"
        >
          <DropdownMenuItem danger onClick={handleDelete} disabled={deleting}>
            {deleting ? '...' : deleteLabel}
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TxCard
