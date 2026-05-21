/*
  TransactionForm: 记账表单 (收入/支出/转账), 支持快捷金额输入.
*/

import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import type { Account, FinanceCategory, FinanceTag, Transaction } from '../../hooks/useFinance'

export interface TransactionFormData {
  type: 'expense' | 'income' | 'transfer'
  amount: number
  account_id: number | null
  category_id: number | null
  note: string
  occurred_at: string
  tag_ids: number[]
  split_items: { amount: number; category_id: number | null; note: string }[]
}

interface Props {
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  editTx?: Transaction | null
  onSubmit: (data: TransactionFormData) => void
  onClose: () => void
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]
const TX_TYPES = ['expense', 'income', 'transfer'] as const

const TransactionForm: React.FC<Props> = React.memo(({ accounts, categories, tags, editTx, onSubmit, onClose }) => {
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
  const [showSplit, setShowSplit] = useState((editTx?.split_items?.length ?? 0) > 0)
  const [splitItems, setSplitItems] = useState<{ amount: string; category_id: number | null; note: string }[]>(
    editTx?.split_items?.map((s) => ({
      amount: String(s.amount),
      category_id: s.category_id,
      note: s.note ?? '',
    })) ?? [],
  )

  const handleSubmit = () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    if (accountId == null) return
    onSubmit({
      type: txType,
      amount: numAmount,
      account_id: accountId,
      category_id: categoryId,
      note,
      occurred_at: new Date(occurredAt).toISOString(),
      tag_ids: selectedTags,
      split_items: splitItems
        .filter((s) => s.amount && parseFloat(s.amount) > 0)
        .map((s) => ({ amount: parseFloat(s.amount), category_id: s.category_id, note: s.note })),
    })
  }

  const addSplitItem = () => {
    setSplitItems([...splitItems, { amount: '', category_id: null, note: '' }])
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
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="form-select"
              >
                <option value="">{t('finance.uncategorized')}</option>
                {flatCategories(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? '  ' : ''}{c.icon} {c.name}
                  </option>
                ))}
              </select>
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
            <button className="btn-sm" onClick={() => setShowSplit(!showSplit)}>
              {showSplit ? t('finance.hideSplit') : t('finance.showSplit')}
            </button>
            {showSplit && (
              <div className="finance-split-list">
                {splitItems.map((si, i) => (
                  <div key={i} className="finance-split-row">
                    <input
                      type="number" value={si.amount}
                      onChange={(e) => {
                        const updated = [...splitItems]
                        updated[i] = { ...updated[i], amount: e.target.value }
                        setSplitItems(updated)
                      }}
                      placeholder="0.00" className="finance-input-sm" step="0.01"
                    />
                    <select
                      value={si.category_id ?? ''}
                      onChange={(e) => {
                        const updated = [...splitItems]
                        updated[i] = { ...updated[i], category_id: e.target.value ? Number(e.target.value) : null }
                        setSplitItems(updated)
                      }}
                      className="finance-select" style={{ flex: 1 }}
                    >
                      <option value="">{t('finance.uncategorized')}</option>
                      {flatCategories(categories).map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSplitItems(splitItems.filter((_, idx) => idx !== i))}
                      className="finance-tx-del"
                    >x</button>
                  </div>
                ))}
                <button onClick={addSplitItem} className="btn-sm">
                  {t('finance.addSplitItem')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>{t('app.cancel')}</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!amount || accountId == null}>
            {isEdit ? t('app.save') : t('app.confirm')}
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
