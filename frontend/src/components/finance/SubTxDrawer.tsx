/*
  SubTxDrawer — 子账单表单 Drawer. 复用 TransactionForm (mode=child).
  子单字段与父单完全一致, 通过 parentTxId 关联父单.
*/

import React from 'react'
import { Drawer, useToast } from '../ui'
import { useLocale } from '../../i18n'
import TransactionForm from './TransactionForm'
import type { TransactionFormData } from './TransactionForm'
import type { Account, FinanceCategory, FinanceTag, Transaction } from '../../hooks/finance'
import api from '../../api/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentTxId: number
  ledgerId: number
  editTx?: Transaction | null
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  onSuccess: () => void
}

const SubTxDrawer: React.FC<Props> = ({
  open, onOpenChange, parentTxId, ledgerId, editTx,
  accounts, categories, tags, onSuccess,
}) => {
  const { t } = useLocale()
  const toast = useToast()
  const isEdit = !!editTx

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      const payload: Record<string, unknown> = {
        ledger_id: ledgerId,
        account_id: data.account_id,
        type: data.type,
        amount: data.amount,
        currency: 'CNY',
        occurred_at: data.occurred_at,
        category_id: data.category_id,
        note: data.note,
        tag_ids: data.tag_ids,
        parent_transaction_id: parentTxId,
        attachment_ids: data.attachment_ids,
        linked_todo_ids: data.linked_todo_ids,
      }

      if (isEdit) {
        await api.put(`/finance/transactions/${editTx!.id}`, payload)
        toast({ message: t('finance.childTxUpdated'), variant: 'success' })
      } else {
        await api.post('/finance/transactions', payload)
        toast({ message: t('finance.childTxCreated'), variant: 'success' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ message: err?.message || t('finance.transactionCreateFailed'), variant: 'error' })
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      stackLevel={1}
      title={isEdit ? t('finance.editChildTransaction') : t('finance.newChildTransaction')}
    >
      <TransactionForm
        accounts={accounts}
        categories={categories}
        tags={tags}
        editTx={editTx}
        onSubmit={handleSubmit}
        onClose={() => onOpenChange(false)}
        mode="child"
        parentTxId={parentTxId}
      />
    </Drawer>
  )
}

export default SubTxDrawer
