/*
  TransactionForm: 记账表单容器. 子组件处理各区域渲染.
*/
import React, { useState, useEffect } from 'react'
import { useLocale } from '../../i18n'
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
  children: {
    amount: number
    category_id: number | null
    note: string
    attachment_ids?: number[]
  }[]
  attachment_ids?: number[]
  linked_todo_ids?: number[]
}

interface Props {
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  editTx?: Transaction | null
  onSubmit: (data: TransactionFormData) => void
  onClose: () => void
  onCreateCategory?: (name: string) => Promise<{ id: number } | null>
}

interface ChildState {
  amount: string; category_id: number | null; note: string
  files: File[]; existingId?: number; existingAttachmentIds: number[]
}

const TX_TYPES = ['expense', 'income', 'transfer'] as const

const TransactionForm: React.FC<Props> = React.memo(({ accounts, categories, tags, editTx, onSubmit, onClose, onCreateCategory }) => {
  const { t } = useLocale()
  const isEdit = !!editTx

  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>(
    (editTx?.type as 'expense' | 'income' | 'transfer') ?? 'expense',
  )
  const [amount, setAmount] = useState(editTx ? String(editTx.amount) : '')
  const [accountId, setAccountId] = useState<number | null>(editTx?.account_id ?? null)
  const [categoryId, setCategoryId] = useState<number | null>(editTx?.category_id ?? null)
  const [note, setNote] = useState(editTx?.note ?? '')
  const [occurredAt, setOccurredAt] = useState(
    editTx?.occurred_at ? editTx.occurred_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
  )
  const [selectedTags, setSelectedTags] = useState<number[]>(editTx?.tags.map((t) => t.id) ?? [])
  const [showChildren, setShowChildren] = useState((editTx?.children?.length ?? 0) > 0)
  const [children, setChildren] = useState<ChildState[]>(
    editTx?.children?.map((c) => ({
      amount: String(c.amount),
      category_id: c.category_id,
      note: c.note ?? '',
      files: [],
      existingId: c.id,
      existingAttachmentIds: c.attachments?.map((a) => a.id) ?? [],
    })) ?? [],
  )
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(editTx?.attachments ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [availableTodos, setAvailableTodos] = useState<{ id: number; title: string; is_completed: boolean }[]>([])
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>(
    editTx?.linked_todos?.map((t) => t.id) ?? [],
  )
  const [amountError, setAmountError] = useState('')
  const [accountError, setAccountError] = useState('')

  useEffect(() => {
    api.get('/todos', { params: { limit: 100 } }).then((data: any) => {
      setAvailableTodos((data?.items || []).filter((t: any) => !t.is_completed))
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
        const formData = new FormData()
        formData.append('file', file)
        try {
          const uploaded = await api.post('/finance/attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }) as Attachment
          attachmentIds.push(uploaded.id)
        } catch { /* skip */ }
      }
      setUploading(false)
    }

    const childData = await Promise.all(children
      .filter((c) => c.amount && parseFloat(c.amount) > 0)
      .map(async (c) => {
        const childAttachmentIds = [...c.existingAttachmentIds]
        for (const file of c.files) {
          const fd = new FormData()
          fd.append('file', file)
          try {
            const uploaded = await api.post('/finance/attachments/upload', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }) as Attachment
            childAttachmentIds.push(uploaded.id)
          } catch { /* skip */ }
        }
        return {
          amount: parseFloat(c.amount),
          category_id: c.category_id,
          note: c.note,
          attachment_ids: childAttachmentIds.length > 0 ? childAttachmentIds : undefined,
        }
      }))

    onSubmit({
      type: txType,
      amount: numAmount,
      account_id: accountId,
      category_id: categoryId,
      note,
      occurred_at: new Date(occurredAt).toISOString(),
      tag_ids: selectedTags,
      children: childData,
      attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
      linked_todo_ids: selectedTodoIds.length > 0 ? selectedTodoIds : undefined,
    })
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const addChild = () => {
    setChildren([...children, { amount: '', category_id: null, note: '', files: [], existingAttachmentIds: [] }])
  }

  const typeLabel = (tp: string) => t(`finance.${tp}`)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? t('finance.editTransaction') : t('finance.newTransaction')}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t('app.close')}>x</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <div className="finance-type-switch">
              {TX_TYPES.map((tp) => (
                <button
                  key={tp}
                  className={`finance-type-btn ${txType === tp ? 'active' : ''} finance-type-${tp}`}
                  onClick={() => setTxType(tp)}
                >
                  {typeLabel(tp)}
                </button>
              ))}
            </div>
          </div>

          <TxAmountInput value={amount} onChange={(v) => { setAmount(v); if (amountError) setAmountError('') }} error={amountError} />

          <TxBasicFields
            accounts={accounts}
            categories={categories}
            accountId={accountId}
            onAccountChange={(id) => { setAccountId(id); if (accountError) setAccountError('') }}
            accountError={accountError}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            occurredAt={occurredAt}
            onOccurredAtChange={setOccurredAt}
            note={note}
            onNoteChange={setNote}
            onCreateCategory={onCreateCategory}
          />

          <div className="form-group">
            <label className="form-label">{t('finance.tags')}</label>
            {tags.length === 0 ? (
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
            ) : (
              <div className="finance-tag-chips">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`finance-tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                  >{tag.name}</button>
                ))}
              </div>
            )}
          </div>

          <TxSplitSection
            children={children}
            categories={categories}
            show={showChildren}
            onToggle={() => setShowChildren(!showChildren)}
            onAdd={addChild}
            onUpdate={(i, patch) => {
              const updated = [...children]
              updated[i] = { ...updated[i], ...patch }
              setChildren(updated)
            }}
            onRemove={(i) => setChildren(children.filter((_, idx) => idx !== i))}
          />
        </div>

        <TxAttachmentsSection
          existingAttachments={existingAttachments}
          newFiles={newFiles}
          onRemoveExisting={(id) => setExistingAttachments((prev) => prev.filter((a) => a.id !== id))}
          onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
          onRemoveNewFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
        />

        <TxTodoLinks
          todos={availableTodos}
          selectedIds={selectedTodoIds}
          onToggle={(id) => setSelectedTodoIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
          )}
        />

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>{t('app.cancel')}</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!amount || accountId == null || uploading}>
            {uploading ? '...' : isEdit ? t('app.save') : t('app.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
})

export default TransactionForm
