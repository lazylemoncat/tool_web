/*
  TxSplitSection: 子交易/拆单管理 (显示/隐藏 + 列表 + 添加).
*/
import React from 'react'
import { useLocale } from '../../../i18n'
import type { FinanceCategory } from '../../../hooks/finance'

interface ChildState {
  amount: string
  category_id: number | null
  note: string
  files: File[]
  existingId?: number
  existingAttachmentIds: number[]
}

interface Props {
  children: ChildState[]
  categories: FinanceCategory[]
  show: boolean
  onToggle: () => void
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<ChildState>) => void
  onRemove: (index: number) => void
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

const TxSplitSection: React.FC<Props> = ({ children, categories, show, onToggle, onAdd, onUpdate, onRemove }) => {
  const { t } = useLocale()

  return (
    <div className="form-group">
      <button className="btn-sm" onClick={onToggle}>
        {show ? t('finance.hideSplit') : t('finance.addChildTransaction')}
      </button>
      {show && (
        <div className="finance-split-list">
          {children.map((ch, i) => (
            <div key={i} className="finance-child-row">
              <div className="finance-child-header">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>#{i + 1}</span>
                <button onClick={() => onRemove(i)} className="finance-tx-del" aria-label={t('app.delete')}>x</button>
              </div>
              <div className="finance-child-fields">
                <input
                  type="number" value={ch.amount}
                  onChange={(e) => onUpdate(i, { amount: e.target.value })}
                  placeholder="0.00" className="finance-input-sm" step="0.01"
                />
                <select
                  value={ch.category_id ?? ''}
                  onChange={(e) => onUpdate(i, { category_id: e.target.value ? Number(e.target.value) : null })}
                  className="finance-select flex-1"
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
                  onChange={(e) => onUpdate(i, { note: e.target.value })}
                  placeholder={t('finance.optionalNote')} className="finance-input-sm flex-1"
                />
                <input
                  type="file" multiple
                  onChange={(e) => onUpdate(i, { files: [...ch.files, ...Array.from(e.target.files || [])] })}
                  className="finance-file-input"
                />
              </div>
              {(ch.files.length > 0 || ch.existingAttachmentIds.length > 0) && (
                <div className="finance-attachment-list mt-1">
                  {ch.files.map((f, fi) => (
                    <span key={fi} className="finance-attachment-item">
                      {f.name} <button className="finance-type-del" aria-label={t('app.delete')} onClick={() => {
                        onUpdate(i, { files: ch.files.filter((_, fii) => fii !== fi) })
                      }}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={onAdd} className="btn-sm">
            + {t('finance.addChildTransaction')}
          </button>
        </div>
      )}
    </div>
  )
}

export default TxSplitSection
