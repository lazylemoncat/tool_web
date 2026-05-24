/*
 TxTodoLinks — 关联待办选择. 搜索输入 + 已完成灰显 + >10 条滚动.
*/

import React, { useState, useMemo } from 'react'
import { useLocale } from '../../../i18n'

interface Todo {
  id: number
  title: string
  is_completed: boolean
}

interface Props {
  todos: Todo[]
  selectedIds: number[]
  onToggle: (id: number) => void
}

const TxTodoLinks: React.FC<Props> = ({ todos, selectedIds, onToggle }) => {
  const { t } = useLocale()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return todos
    const q = search.toLowerCase()
    return todos.filter((td) => td.title.toLowerCase().includes(q))
  }, [todos, search])

  const active = filtered.filter((td) => !td.is_completed)
  const completed = filtered.filter((td) => td.is_completed)
  const count = selectedIds.length

  return (
    <div className="form-group">
      <label className="form-label">
        {t('finance.linkedTodos')}
        {count > 0 && <span className="tag-badge" style={{ marginLeft: 8 }}>{count}</span>}
      </label>

      <input
        type="text"
        className="finance-input-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('finance.search')}
        style={{ marginBottom: 8 }}
      />

      {todos.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.78rem' }}>{t('finance.noLinkedTodos')}</p>
      ) : (
        <div className="finance-todo-link-list" style={{ maxHeight: 200, overflowY: 'auto' }}>
          {active.map((todo) => (
            <label key={todo.id} className="finance-checkbox-label">
              <input type="checkbox" checked={selectedIds.includes(todo.id)} onChange={() => onToggle(todo.id)} />
              {todo.title}
            </label>
          ))}
          {completed.map((todo) => (
            <label key={todo.id} className="finance-checkbox-label" style={{ opacity: 0.5 }}>
              <input type="checkbox" checked={selectedIds.includes(todo.id)} onChange={() => onToggle(todo.id)} />
              <s>{todo.title}</s>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default TxTodoLinks
