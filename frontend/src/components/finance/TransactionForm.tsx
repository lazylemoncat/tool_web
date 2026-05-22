/*
  TransactionForm: 记账表单 (收入/支出/转账), 支持快捷金额输入.
*/

import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from '../../i18n'
import type { Account, FinanceCategory, FinanceTag, Transaction, Attachment } from '../../hooks/useFinance'
import api from '../../api/client'

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

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]
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
  interface ChildState { amount: string; category_id: number | null; note: string; files: File[]; existingId?: number; existingAttachmentIds: number[] }
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
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [availableTodos, setAvailableTodos] = useState<{ id: number; title: string; is_completed: boolean }[]>([])
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>(
    editTx?.linked_todos?.map((t) => t.id) ?? [],
  )

  useEffect(() => {
    api.get('/todos', { params: { limit: 100 } }).then((data: any) => {
      setAvailableTodos((data?.items || []).filter((t: any) => !t.is_completed))
    }).catch(() => {})
  }, [])

  const handleRemoveExisting = (id: number) => {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleRemoveNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !onCreateCategory) return
    const cat = await onCreateCategory(newCatName.trim())
    if (cat) {
      setCategoryId(cat.id)
      setNewCatName('')
      setShowNewCat(false)
    }
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    if (accountId == null) return

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
        } catch { /* upload failed, skip */ }
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

  const addChild = () => {
    setChildren([...children, { amount: '', category_id: null, note: '', files: [], existingAttachmentIds: [] }])
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const flatCategories = (cats: FinanceCategory[]): FinanceCategory[] => {
    const result: FinanceCategory[] = []
    const walk = (list: FinanceCategory[], depth: number) => {
      for (const c of list) {
        result.push(c)
        if (c.children?.length) walk(c.children, depth + 1)
      }
    }
    walk(cats, 0)
    return result
  }

  const typeLabel = (tp: string) => t(`finance.${tp}`)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? t('finance.editTransaction') : t('finance.newTransaction')}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
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

          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="finance-amount-input"
              autoFocus
              step="0.01"
              min="0"
            />
            <div className="finance-quick-amounts">
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  className="finance-quick-btn"
                  onClick={() => setAmount(String(qa))}
                >{qa}</button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Account</label>
              <select
                value={accountId ?? ''}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : null)}
                className="form-select"
              >
                <option value="">{t('finance.selectAccount')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({fmt(a.current_balance)})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="form-select"
                  style={{ flex: 1 }}
                >
                  <option value="">{t('finance.uncategorized')}</option>
                  {flatCategories(categories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '  ' : ''}{c.icon} {c.name}
                    </option>
                  ))}
                </select>
                {onCreateCategory && (
                  <button type="button" className="btn-sm" onClick={() => setShowNewCat(!showNewCat)} title={t('finance.newCategory')}>+</button>
                )}
              </div>
              {showNewCat && (
                <div className="finance-category-edit-row" style={{ marginTop: 4 }}>
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    placeholder={t('finance.categoryName')}
                    className="finance-input-sm"
                    autoFocus
                  />
                  <button className="btn-submit" onClick={handleCreateCategory}>{t('app.confirm')}</button>
                  <button className="btn-cancel" onClick={() => { setShowNewCat(false); setNewCatName('') }}>{t('app.cancel')}</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
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

          <div className="form-group">
            <label className="form-label">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('finance.optionalNote')}
              className="form-input"
              maxLength={2000}
            />
          </div>

          <div className="form-group">
            <button className="btn-sm" onClick={() => setShowChildren(!showChildren)}>
              {showChildren ? t('finance.hideSplit') : t('finance.addChildTransaction')}
            </button>
            {showChildren && (
              <div className="finance-split-list">
                {children.map((ch, i) => (
                  <div key={i} className="finance-child-row">
                    <div className="finance-child-header">
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>#{i + 1}</span>
                      <button onClick={() => setChildren(children.filter((_, idx) => idx !== i))} className="finance-tx-del">x</button>
                    </div>
                    <div className="finance-child-fields">
                      <input
                        type="number" value={ch.amount}
                        onChange={(e) => {
                          const updated = [...children]
                          updated[i] = { ...updated[i], amount: e.target.value }
                          setChildren(updated)
                        }}
                        placeholder="0.00" className="finance-input-sm" step="0.01"
                      />
                      <select
                        value={ch.category_id ?? ''}
                        onChange={(e) => {
                          const updated = [...children]
                          updated[i] = { ...updated[i], category_id: e.target.value ? Number(e.target.value) : null }
                          setChildren(updated)
                        }}
                        className="finance-select" style={{ flex: 1 }}
                      >
                        <option value="">{t('finance.uncategorized')}</option>
                        {flatCategories(categories).map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="finance-child-fields">
                      <input
                        type="text" value={ch.note}
                        onChange={(e) => {
                          const updated = [...children]
                          updated[i] = { ...updated[i], note: e.target.value }
                          setChildren(updated)
                        }}
                        placeholder={t('finance.optionalNote')} className="finance-input-sm" style={{ flex: 1 }}
                      />
                      <input
                        type="file" multiple
                        onChange={(e) => {
                          const updated = [...children]
                          updated[i] = { ...updated[i], files: [...updated[i].files, ...Array.from(e.target.files || [])] }
                          setChildren(updated)
                        }}
                        className="finance-file-input"
                      />
                    </div>
                    {(ch.files.length > 0 || ch.existingAttachmentIds.length > 0) && (
                      <div className="finance-attachment-list" style={{ marginTop: 2 }}>
                        {ch.files.map((f, fi) => (
                          <span key={fi} className="finance-attachment-item">
                            {f.name} <button className="finance-type-del" onClick={() => {
                              const updated = [...children]
                              updated[i] = { ...updated[i], files: updated[i].files.filter((_, fii) => fii !== fi) }
                              setChildren(updated)
                            }}>x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addChild} className="btn-sm">
                  + {t('finance.addChildTransaction')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('finance.attachments')}</label>
          {existingAttachments.length > 0 && (
            <div className="finance-attachment-list">
              {existingAttachments.map((a) => (
                <span key={a.id} className="finance-attachment-item">
                  {a.url.split('/').pop()}
                  <button className="finance-type-del" onClick={() => handleRemoveExisting(a.id)}>x</button>
                </span>
              ))}
            </div>
          )}
          {newFiles.length > 0 && (
            <div className="finance-attachment-list">
              {newFiles.map((f, i) => (
                <span key={i} className="finance-attachment-item">
                  {f.name}
                  <button className="finance-type-del" onClick={() => handleRemoveNewFile(i)}>x</button>
                </span>
              ))}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={(e) => setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
            className="finance-file-input"
            style={{ marginTop: 8 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('finance.linkedTodos')}</label>
          {availableTodos.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>{t('finance.noLinkedTodos')}</p>
          ) : (
            <div className="finance-checkbox-group">
              {availableTodos.map((todo) => (
                <label key={todo.id} className="finance-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTodoIds.includes(todo.id)}
                    onChange={() => setSelectedTodoIds((prev) =>
                      prev.includes(todo.id) ? prev.filter((id) => id !== todo.id) : [...prev, todo.id],
                    )}
                  />
                  {todo.title}
                </label>
              ))}
            </div>
          )}
        </div>

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

const fmt = (v: unknown): string => {
  const n = Number(v)
  return isNaN(n) ? '0' : n.toFixed(0)
}

export default TransactionForm
