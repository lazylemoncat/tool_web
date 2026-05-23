/*
  TxBasicFields: 账户选择 + 分类 + 日期 + 备注.
*/
import React from 'react'
import { useLocale } from '../../../i18n'
import type { Account, FinanceCategory } from '../../../hooks/finance'

interface Props {
  accounts: Account[]
  categories: FinanceCategory[]
  accountId: number | null
  onAccountChange: (id: number | null) => void
  accountError?: string
  categoryId: number | null
  onCategoryChange: (id: number | null) => void
  occurredAt: string
  onOccurredAtChange: (v: string) => void
  note: string
  onNoteChange: (v: string) => void
  onCreateCategory?: (name: string) => Promise<{ id: number } | null>
}

const flatCategories = (cats: FinanceCategory[]): FinanceCategory[] => {
  const result: FinanceCategory[] = []
  const walk = (list: FinanceCategory[], _depth: number) => {
    for (const c of list) {
      result.push(c)
      if (c.children?.length) walk(c.children, _depth + 1)
    }
  }
  walk(cats, 0)
  return result
}

const fmt = (v: unknown): string => {
  const n = Number(v)
  return isNaN(n) ? '0' : n.toFixed(0)
}

const TxBasicFields: React.FC<Props> = ({
  accounts, categories, accountId, onAccountChange, accountError,
  categoryId, onCategoryChange, occurredAt, onOccurredAtChange,
  note, onNoteChange, onCreateCategory,
}) => {
  const { t } = useLocale()
  const [newCatName, setNewCatName] = React.useState('')
  const [showNewCat, setShowNewCat] = React.useState(false)

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !onCreateCategory) return
    const cat = await onCreateCategory(newCatName.trim())
    if (cat) {
      onCategoryChange(cat.id)
      setNewCatName('')
      setShowNewCat(false)
    }
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label">{t('finance.selectAccount')}</label>
          <select
            value={accountId ?? ''}
            onChange={(e) => onAccountChange(e.target.value ? Number(e.target.value) : null)}
            className="form-select"
          >
            <option value="">{t('finance.selectAccount')}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({fmt(a.current_balance)})</option>
            ))}
          </select>
          {accountError && <p className="form-error">{accountError}</p>}
        </div>
        <div className="form-group flex-1">
          <label className="form-label">{t('finance.categories')}</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <select
              value={categoryId ?? ''}
              onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
              className="form-select flex-1"
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
            <div className="finance-category-edit-row mt-1">
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
        <label className="form-label">{t('finance.startAt')}</label>
        <input
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => onOccurredAtChange(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t('finance.optionalNote')}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t('finance.optionalNote')}
          className="form-input"
          maxLength={2000}
        />
      </div>
    </>
  )
}

export default TxBasicFields
