/*
  CategoryManager: 树状分类管理, 含展开/折叠, 内联编辑, 新建/删除.
*/
import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import type { FinanceCategory } from '../../hooks/finance'

interface Props {
  categories: FinanceCategory[]
  onCreate: (fields: Record<string, unknown>) => void
  onUpdate: (id: number, fields: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

const flatAll = (cats: FinanceCategory[]): FinanceCategory[] => {
  const result: FinanceCategory[] = []
  const walk = (list: FinanceCategory[]) => {
    for (const c of list) {
      result.push(c)
      if (c.children?.length) walk(c.children)
    }
  }
  walk(cats)
  return result
}

interface NodeState {
  collapsed: Record<number, boolean>
  editing: number | null
  editName: string
  editParent: number | null
  addingChild: number | null
  newChildName: string
  newRootName: string
  showNewRoot: boolean
}

const CategoryManager: React.FC<Props> = ({ categories, onCreate, onUpdate, onDelete }) => {
  const { t } = useLocale()
  const [state, setState] = useState<NodeState>({
    collapsed: {},
    editing: null,
    editName: '',
    editParent: null,
    addingChild: null,
    newChildName: '',
    newRootName: '',
    showNewRoot: false,
  })

  const set = (patch: Partial<NodeState>) => setState((s) => ({ ...s, ...patch }))

  const toggle = (id: number) => set({ collapsed: { ...state.collapsed, [id]: !state.collapsed[id] } })

  const startEdit = (cat: FinanceCategory) => {
    set({ editing: cat.id, editName: cat.name, editParent: cat.parent_id })
  }

  const cancelEdit = () => set({ editing: null })

  const saveEdit = (id: number) => {
    if (!state.editName.trim()) { cancelEdit(); return }
    onUpdate(id, { name: state.editName.trim(), parent_id: state.editParent })
    cancelEdit()
  }

  const createRoot = () => {
    if (!state.newRootName.trim()) return
    onCreate({ name: state.newRootName.trim() })
    set({ newRootName: '', showNewRoot: false })
  }

  const startAddChild = (parentId: number) => set({ addingChild: parentId })

  const createChild = () => {
    if (!state.newChildName.trim() || state.addingChild == null) return
    onCreate({ name: state.newChildName.trim(), parent_id: state.addingChild })
    set({ newChildName: '', addingChild: null })
  }

  const allCats = flatAll(categories)

  const renderNode = (cat: FinanceCategory, depth: number) => {
    const hasChildren = cat.children && cat.children.length > 0
    const isCollapsed = state.collapsed[cat.id] ?? false
    const isEditing = state.editing === cat.id
    const isAddingChild = state.addingChild === cat.id

    return (
      <React.Fragment key={cat.id}>
        <div className="finance-category-node" style={{ paddingLeft: depth * 20 }}>
          {hasChildren ? (
            <button className="finance-category-toggle" onClick={() => toggle(cat.id)} type="button" aria-label={isCollapsed ? t('todo.expand') : t('todo.collapse')}>
              {isCollapsed ? '▶' : '▼'}
            </button>
          ) : (
            <span className="finance-category-toggle" />
          )}

          {isEditing ? (
            <div className="finance-category-edit-row">
              <input
                className="form-input finance-input-sm"
                value={state.editName}
                onChange={(e) => set({ editName: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                autoFocus
              />
              <select
                className="form-select finance-select"
                value={state.editParent ?? ''}
                onChange={(e) => set({ editParent: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('finance.noParent')}</option>
                {allCats.filter((c) => c.id !== cat.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn-submit" onClick={() => saveEdit(cat.id)}>{t('app.confirm')}</button>
              <button className="btn-cancel" onClick={cancelEdit}>{t('app.cancel')}</button>
            </div>
          ) : (
            <>
              <span className="finance-category-name">{cat.icon} {cat.name}</span>
              <div className="finance-category-actions">
                <button className="btn-sm" onClick={() => startAddChild(cat.id)} aria-label={t('finance.addSubCategory')}>+</button>
                <button className="btn-sm" onClick={() => startEdit(cat)}>{t('app.edit')}</button>
                <button className="btn-sm btn-danger" onClick={() => onDelete(cat.id)} aria-label={t('app.delete')}>x</button>
              </div>
            </>
          )}
        </div>

        {isAddingChild && (
          <div className="finance-category-node" style={{ paddingLeft: (depth + 1) * 20 }}>
            <span className="finance-category-toggle" />
            <div className="finance-category-edit-row">
              <input
                className="form-input finance-input-sm"
                value={state.newChildName}
                onChange={(e) => set({ newChildName: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && createChild()}
                placeholder={t('finance.categoryName')}
                autoFocus
              />
              <button className="btn-submit" onClick={createChild}>{t('app.confirm')}</button>
              <button className="btn-cancel" onClick={() => set({ addingChild: null })}>{t('app.cancel')}</button>
            </div>
          </div>
        )}

        {!isCollapsed && hasChildren && cat.children.map((child) => renderNode(child, depth + 1))}
      </React.Fragment>
    )
  }

  return (
    <div className="finance-section">
      <div className="finance-section-header">
        <h3>{t('finance.categories')}</h3>
        {state.showNewRoot ? (
          <div className="finance-category-edit-row">
            <input
              className="form-input finance-input-sm"
              value={state.newRootName}
              onChange={(e) => set({ newRootName: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && createRoot()}
              placeholder={t('finance.categoryName')}
              autoFocus
            />
            <button className="btn-submit" onClick={createRoot}>{t('app.confirm')}</button>
            <button className="btn-cancel" onClick={() => set({ showNewRoot: false })}>{t('app.cancel')}</button>
          </div>
        ) : (
          <button className="btn-sm" onClick={() => set({ showNewRoot: true })}>
            + {t('finance.newCategory')}
          </button>
        )}
      </div>
      <div className="finance-category-tree">
        {categories.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noData')}</p>
        ) : (
          categories.map((cat) => renderNode(cat, 0))
        )}
      </div>
    </div>
  )
}

export default CategoryManager
