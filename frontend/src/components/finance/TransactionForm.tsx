/*
 TransactionForm — 记账表单, 使用新 Modal + Tab 切分 (基础/扩展/关联).
*/

import React, { useState, useEffect } from 'react'
import { useLocale } from '../../i18n'
import { Modal, Tabs, useToast, FormFooter } from '../ui'
import type { Account, FinanceCategory, FinanceTag, Transaction, Attachment } from '../../hooks/finance'
import api from '../../api/client'
import TxAmountInput from './transactionForm/TxAmountInput'
import TxBasicFields from './transactionForm/TxBasicFields'
import TxSplitSection from './transactionForm/TxSplitSection'
import TxAttachmentsSection from './transactionForm/TxAttachmentsSection'
import TxTodoLinks from './transactionForm/TxTodoLinks'

export interface TransactionFormData {
  type: 'expense' | 'income' | 'transfer'
  amount: number
  account_id: number | null
  category_id: number | null
  note: string
  occurred_at: string
  tag_ids: number[]
  children: { amount: number; category_id: number | null; note: string; attachment_ids?: number[] }[]
  attachment_ids?: number[]
  linked_todo_ids?: number[]
  parent_transaction_id?: number
}

interface Props {
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  editTx?: Transaction | null
  onSubmit: (data: TransactionFormData) => void
  onClose: () => void
  onCreateCategory?: (name: string) => Promise<{ id: number } | null>
  mode?: 'standalone' | 'child'
  parentTxId?: number
  ledgerId?: number | null
  onChildRefresh?: () => void
  surface?: 'modal' | 'inline'
  initialAmount?: number | null
}

const TX_TYPES = ['expense', 'income', 'transfer'] as const

const TransactionForm: React.FC<Props> = React.memo(({ accounts, categories, tags, editTx, onSubmit, onClose, onCreateCategory, mode = 'standalone', parentTxId, ledgerId, onChildRefresh, surface = 'modal', initialAmount = null }) => {
  const { t } = useLocale()
  const toast = useToast()
  const isEdit = !!editTx
  const isChild = mode === 'child'
  const effectiveLedgerId = ledgerId ?? editTx?.ledger_id ?? null

  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>((editTx?.type as any) ?? 'expense')
  const [amount, setAmount] = useState(editTx ? String(editTx.amount) : initialAmount && initialAmount > 0 ? initialAmount.toFixed(2) : '')
  const [accountId, setAccountId] = useState<number | null>(editTx?.account_id ?? null)
  const [categoryId, setCategoryId] = useState<number | null>(editTx?.category_id ?? null)
  const [note, setNote] = useState(editTx?.note ?? '')
  const [occurredAt, setOccurredAt] = useState(editTx?.occurred_at ? editTx.occurred_at.slice(0, 16) : new Date().toISOString().slice(0, 16))
  const [selectedTags, setSelectedTags] = useState<number[]>(editTx?.tags.map((t) => t.id) ?? [])
  const [showChildren, setShowChildren] = useState((editTx?.children?.length ?? 0) > 0)
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(editTx?.attachments ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [availableTodos, setAvailableTodos] = useState<{ id: number; title: string; is_completed: boolean }[]>([])
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>(editTx?.linked_todos?.map((t) => t.id) ?? [])
  const [amountError, setAmountError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [tab, setTab] = useState('basic')

  useEffect(() => {
    api.get('/todos', { params: { limit: 100 } }).then((data: any) => {
      setAvailableTodos(data?.items || [])
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    let valid = true
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setAmountError(t('finance.amountRequired')); valid = false }
    else setAmountError('')
    if (accountId == null) { setAccountError(t('finance.accountRequired')); valid = false }
    else setAccountError('')
    if (!valid) return

    const attachmentIds: number[] = existingAttachments.map((a) => a.id)
    if (newFiles.length > 0) {
      setUploading(true)
      for (const file of newFiles) {
        const fd = new FormData(); fd.append('file', file)
        try { const uploaded = await api.post('/finance/attachments/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }) as Attachment; attachmentIds.push(uploaded.id) } catch { /* skip */ }
      }
      setUploading(false)
    }

    const payload: TransactionFormData = {
      type: txType, amount: numAmount, account_id: accountId, category_id: categoryId,
      note, occurred_at: new Date(occurredAt).toISOString(), tag_ids: selectedTags,
      children: [], attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
      linked_todo_ids: selectedTodoIds.length > 0 ? selectedTodoIds : undefined,
    }
    if (parentTxId) payload.parent_transaction_id = parentTxId
    onSubmit(payload)
  }

  const toggleTag = (tagId: number) => setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId])
  const typeLabel = (tp: string) => t(`finance.${tp}`)

  const footer = (
    <FormFooter
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? t('app.save') : t('app.confirm')}
      submitting={uploading}
      disabled={!amount || accountId == null}
    />
  )

  const content = (
    <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          {
            value: 'basic',
            label: t('finance.basic'),
            content: (
              <>
                <div className="form-group">
                  <div className="finance-type-switch">
                    {TX_TYPES.map((tp) => (
                      <button key={tp} className={`finance-type-btn ${txType === tp ? 'active' : ''} finance-type-${tp}`} onClick={() => setTxType(tp)}>
                        {typeLabel(tp)}
                      </button>
                    ))}
                  </div>
                </div>
                <TxAmountInput value={amount} onChange={(v) => { setAmount(v); if (amountError) setAmountError('') }} error={amountError} />
                <TxBasicFields
                  accounts={accounts} categories={categories}
                  accountId={accountId} onAccountChange={(id) => { setAccountId(id); if (accountError) setAccountError('') }} accountError={accountError}
                  categoryId={categoryId} onCategoryChange={setCategoryId}
                  occurredAt={occurredAt} onOccurredAtChange={setOccurredAt}
                  note={note} onNoteChange={setNote}
                  onCreateCategory={onCreateCategory}
                />
              </>
            ),
          },
          {
            value: 'extended',
            label: t('finance.extended'),
            content: (
              <>
                <div className="form-group">
                  <label className="form-label">{t('finance.tags')}</label>
                  {tags.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                  ) : (
                    <div className="finance-tag-chips">
                      {tags.map((tag) => (
                        <button key={tag.id} className={`finance-tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`} onClick={() => toggleTag(tag.id)}>{tag.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                {!isChild && (
                  <TxSplitSection
                    show={showChildren}
                    onToggle={() => setShowChildren(!showChildren)}
                    parentTxId={isEdit ? (editTx?.id ?? null) : null}
                    childTransactions={editTx?.children ?? []}
                    ledgerId={effectiveLedgerId ?? 0}
                    accounts={accounts}
                    categories={categories}
                    tags={tags}
                    onRefresh={() => onChildRefresh?.()}
                  />
                )}
                <TxAttachmentsSection
                  existingAttachments={existingAttachments} newFiles={newFiles}
                  onRemoveExisting={(id) => setExistingAttachments((prev) => prev.filter((a) => a.id !== id))}
                  onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
                  onRemoveNewFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                />
              </>
            ),
          },
          {
            value: 'linked',
            label: t('finance.linked'),
            content: (
              <TxTodoLinks
                todos={availableTodos} selectedIds={selectedTodoIds}
                onToggle={(id) => setSelectedTodoIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
              />
            ),
          },
        ]}
      />
  )

  if (surface === 'inline') {
    return (
      <div className="transaction-form-inline">
        {content}
        <div className="transaction-form-inline-footer">{footer}</div>
      </div>
    )
  }

  return (
    <Modal open onOpenChange={() => onClose()} size="xl" title={isEdit ? t('finance.editTransaction') : t('finance.newTransaction')} footer={footer}>
      {content}
    </Modal>
  )
})

export default TransactionForm
