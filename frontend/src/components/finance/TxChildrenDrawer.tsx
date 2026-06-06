import React, { useMemo, useState } from 'react'
import { Button, Drawer, useConfirm, useToast } from '../ui'
import { useLocale } from '../../i18n'
import type { Account, FinanceCategory, FinanceTag, Transaction } from '../../hooks/finance'
import api from '../../api/client'
import SubTxDrawer from './SubTxDrawer'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentTx: Transaction
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  onRefresh: () => void
  formatAmount: (v: unknown, digits?: number) => string
}

const TxChildrenDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  parentTx,
  accounts,
  categories,
  tags,
  onRefresh,
  formatAmount,
}) => {
  const { t } = useLocale()
  const confirm = useConfirm()
  const toast = useToast()
  const [childForm, setChildForm] = useState<{ open: boolean; editTx?: Transaction }>({ open: false })

  const children = parentTx.children ?? []
  const parentAmount = Number(parentTx.amount || 0)
  const childTotal = useMemo(
    () => children.reduce((sum, child) => sum + Number(child.amount || 0), 0),
    [children],
  )
  const remaining = Math.max(parentAmount - childTotal, 0)
  const overAllocated = childTotal - parentAmount > 0.005
  const isBalanced = Math.abs(parentAmount - childTotal) <= 0.005
  const canAddChild = remaining > 0.005 && !overAllocated

  const openCreateChild = () => setChildForm({ open: true })
  const openEditChild = (child: Transaction) => setChildForm({ open: true, editTx: child })
  const closeChildForm = () => setChildForm({ open: false })

  const handleDeleteChild = async (child: Transaction) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteTransaction'),
      description: t('finance.deleteTransactionDescription'),
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/finance/transactions/${child.id}`)
      toast({ message: t('finance.transactionDeleted'), variant: 'success' })
      onRefresh()
    } catch {
      toast({ message: t('finance.transactionDeleteFailed'), variant: 'error' })
    }
  }

  const description = isBalanced
    ? t('finance.childBalanceOk')
    : t('finance.childBalanceRemaining', { amount: formatAmount(remaining) })

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={`${t('finance.childTransactions')}: ${parentTx.note || parentTx.category?.name || t('finance.uncategorized')}`}
      description={description}
      className="tx-children-drawer"
    >
      <div className="tx-child-summary">
        <div>
          <span>{t('finance.parentAmount')}</span>
          <strong>{formatAmount(parentAmount)}</strong>
        </div>
        <div>
          <span>{t('finance.childAllocated')}</span>
          <strong>{formatAmount(childTotal)}</strong>
        </div>
        <div className={isBalanced ? 'is-balanced' : overAllocated ? 'is-over' : ''}>
          <span>{t('finance.childRemaining')}</span>
          <strong>{formatAmount(remaining)}</strong>
        </div>
      </div>

      <div className="finance-split-list">
        {children.length === 0 && (
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noChildTx')}</span>
        )}
        {children.map((child) => (
          <div key={child.id} className="finance-child-row">
            <div className="finance-child-header">
              <span className={`finance-tx-type finance-tx-${child.type}`}>
                {child.type === 'expense' ? '-' : child.type === 'income' ? '+' : 'S'}
              </span>
              <span className="tx-split-amount">{formatAmount(child.amount)}</span>
            </div>
            <div className="finance-child-fields">
              <span className="tx-split-meta">{child.category?.name || t('finance.uncategorized')}</span>
              <span className="tx-split-note">{child.note || ''}</span>
              <Button variant="secondary" size="sm" onClick={() => openEditChild(child)}>{t('app.edit')}</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteChild(child)}>{t('app.delete')}</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="tx-child-actions">
        <Button onClick={openCreateChild} disabled={!canAddChild}>
          {t('finance.addChildTransaction')}
        </Button>
      </div>

      {childForm.open && (
        <SubTxDrawer
          open={childForm.open}
          onOpenChange={(nextOpen) => { if (!nextOpen) closeChildForm() }}
          parentTxId={parentTx.id}
          ledgerId={parentTx.ledger_id}
          parentAmount={parentTx.amount}
          childTransactions={children}
          editTx={childForm.editTx || null}
          accounts={accounts}
          categories={categories}
          tags={tags}
          onSuccess={() => {
            onRefresh()
            closeChildForm()
          }}
        />
      )}
    </Drawer>
  )
}

export default TxChildrenDrawer
