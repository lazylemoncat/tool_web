/*
  TxSplitSection — 子账单列表 (real child transactions via parent_transaction_id).
  列表行 [金额 类型] [分类] [备注] [编辑] [删除].
  新增/编辑走 SubTxDrawer, 删除走 confirm dialog + API.
*/

import React, { useState } from 'react'
import { useLocale } from '../../../i18n'
import { Tooltip, useConfirm, useToast } from '../../ui'
import type { Account, FinanceCategory, FinanceTag, Transaction } from '../../../hooks/finance'
import api from '../../../api/client'
import SubTxDrawer from '../SubTxDrawer'

interface Props {
  show: boolean
  onToggle: () => void
  parentTxId: number | null
  childTransactions: Transaction[]
  ledgerId: number
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  onRefresh: () => void
}

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const TxSplitSection: React.FC<Props> = ({
  show, onToggle, parentTxId, childTransactions,
  ledgerId, accounts, categories, tags, onRefresh,
}) => {
  const { t } = useLocale()
  const confirm = useConfirm()
  const toast = useToast()
  const [subTxDrawer, setSubTxDrawer] = useState<{ open: boolean; editTx?: Transaction }>({ open: false })

  const openCreate = () => setSubTxDrawer({ open: true })
  const openEdit = (tx: Transaction) => setSubTxDrawer({ open: true, editTx: tx })
  const closeDrawer = () => setSubTxDrawer({ open: false })

  const handleDelete = async (child: Transaction) => {
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

  const isParentNew = parentTxId == null
  const count = childTransactions.length

  return (
    <div className="form-group">
      <button className="btn-sm" onClick={onToggle}>
        {show ? t('finance.hideChildTx') : t('finance.childTransactions')}
        {count > 0 && ` (${count})`}
      </button>
      {show && (
        <div className="finance-split-list">
          {childTransactions.length === 0 && (
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noChildTx')}</span>
          )}
          {childTransactions.map((child) => (
            <div key={child.id} className="finance-child-row">
              <div className="finance-child-header">
                <span className={`finance-tx-type finance-tx-${child.type}`}>
                  {child.type === 'expense' ? '↳ -' : child.type === 'income' ? '↳ +' : '↳ S'}
                </span>
                <span className="tx-split-amount">{fmt(child.amount)}</span>
              </div>
              <div className="finance-child-fields">
                <span className="tx-split-meta">{child.category?.name || t('finance.uncategorized')}</span>
                <span className="tx-split-note" style={{ flex: 1 }}>{child.note || ''}</span>
                <button className="btn-sm" onClick={() => openEdit(child)}>{t('app.edit')}</button>
                <button className="finance-tx-del" onClick={() => handleDelete(child)} aria-label={t('app.delete')}>x</button>
              </div>
            </div>
          ))}
          <Tooltip content={t('finance.saveParentFirst')} disabled={!isParentNew}>
            <button
              className="btn-sm"
              onClick={openCreate}
              disabled={isParentNew}
              style={{ marginTop: 8 }}
            >
              + {t('finance.addChildTransaction')}
            </button>
          </Tooltip>
        </div>
      )}

      {subTxDrawer.open && parentTxId != null && (
        <SubTxDrawer
          open={subTxDrawer.open}
          onOpenChange={(o) => { if (!o) closeDrawer() }}
          parentTxId={parentTxId}
          ledgerId={ledgerId}
          childTransactions={childTransactions}
          editTx={subTxDrawer.editTx || null}
          accounts={accounts}
          categories={categories}
          tags={tags}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}

export default TxSplitSection
