/*
  TagManager: 标签管理, 列表 + 新建 + 删除.
*/
import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import type { FinanceTag } from '../../hooks/finance'

interface Props {
  tags: FinanceTag[]
  onCreate: (name: string) => void
  onDelete: (id: number) => void
}

const TagManager: React.FC<Props> = ({ tags, onCreate, onDelete }) => {
  const { t } = useLocale()
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className="finance-section">
      <div className="finance-section-header">
        <h3>{t('finance.tags')}</h3>
        {showAdd ? (
          <div className="finance-category-edit-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder={t('finance.accountType')}
              className="finance-input-sm"
              autoFocus
            />
            <button className="btn-submit" onClick={handleCreate}>{t('app.confirm')}</button>
            <button className="btn-cancel" onClick={() => setShowAdd(false)}>{t('app.cancel')}</button>
          </div>
        ) : (
          <button className="btn-sm" onClick={() => setShowAdd(true)}>
            + {t('finance.addType')}
          </button>
        )}
      </div>
      {tags.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noData')}</p>
      ) : (
        <div className="finance-tag-chips">
          {tags.map((tag) => (
            <span key={tag.id} className="finance-type-tag">
              {tag.name}
              <button className="finance-type-del" onClick={() => onDelete(tag.id)} aria-label={t('app.delete')}>x</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagManager
