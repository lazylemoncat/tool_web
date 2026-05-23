/*
  TxTodoLinks: 关联待办选择.
*/
import React from 'react'
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

  return (
    <div className="form-group">
      <label className="form-label">{t('finance.linkedTodos')}</label>
      {todos.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.78rem' }}>{t('finance.noLinkedTodos')}</p>
      ) : (
        <div className="finance-checkbox-group">
          {todos.map((todo) => (
            <label key={todo.id} className="finance-checkbox-label">
              <input
                type="checkbox"
                checked={selectedIds.includes(todo.id)}
                onChange={() => onToggle(todo.id)}
              />
              {todo.title}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default TxTodoLinks
