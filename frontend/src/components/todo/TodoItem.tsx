import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import PriorityTag from '../common/PriorityTag'
import SubTaskList from './SubTaskList'
import CustomButtons from '../common/CustomButtons'
import type { Todo } from '../../hooks/useTodos'

interface Props {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onReorder?: (items: { id: number; sort_order: number }[]) => void
  onDetail?: (todo: Todo) => void
}

const TodoItem: React.FC<Props> = React.memo(({ todo, onToggle, onDelete, onAddSub, onEdit, onReorder, onDetail }) => {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Swipe gesture state (touch devices)
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = React.useRef(0)
  const touchStartY = React.useRef(0)
  const swiping = React.useRef(false)
  const ACTION_WIDTH = 104

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    swiping.current = true
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return
    const dx = touchStartX.current - e.touches[0].clientX
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault()
      setSwipeX(Math.max(0, Math.min(dx, ACTION_WIDTH)))
    } else {
      swiping.current = false
      setSwipeX(0)
    }
  }

  const onTouchEnd = () => {
    swiping.current = false
    setSwipeX(prev => prev > ACTION_WIDTH / 2 ? ACTION_WIDTH : 0)
  }

  const hasChildren = todo.children && todo.children.length > 0
  const completedCount = todo.children?.filter((c) => c.is_completed).length ?? 0
  const overdue = todo.due_date && new Date(todo.due_date) < new Date(new Date().toDateString())

  const fmtDate = (d: string | null): string => {
    if (!d) return ''
    const date = new Date(d)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / 86400000)
    if (days < -1) return t('date.daysAgo', { n: Math.abs(days) })
    if (days === -1) return t('date.yesterday')
    if (days === 0) return t('date.today')
    if (days === 1) return t('date.tomorrow')
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
  }

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(todo.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(todo)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleAddSub = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddSub(todo.id)
  }

  return (
    <div
      className="todo-item-wrapper"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="todo-swipe-actions">
        <button className="swipe-btn swipe-edit" onClick={(e) => { e.stopPropagation(); onEdit(todo) }}>{t('app.edit')}</button>
        <button className="swipe-btn swipe-delete" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}>{t('app.delete')}</button>
      </div>

      <div
        className="todo-item-inner"
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: swiping.current ? 'none' : 'transform 0.2s ease',
        }}
      >
        <div className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
          <div className="todo-checkbox" onClick={handleCheck} />

          <div className="todo-content">
              <div className="todo-title">
                {todo.title}
                {todo.recurrence_rules && todo.recurrence_rules.length > 0 && (
                  <span
                    className="recurrence-icon"
                    title={todo.recurrence_rules.map(r => r.rrule_string).join('\n')}
                  >
                    {' '}🔁
                  </span>
                )}
              </div>

            <div className="todo-meta">
              <PriorityTag priority={todo.priority} />
              {todo.due_date && (
                <span className={`due-date ${overdue ? 'overdue' : ''}`}>
                  📅 {fmtDate(todo.due_date)}
                </span>
              )}
              {hasChildren && (
                <span
                  className="subtask-hint"
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                  style={{ cursor: 'pointer' }}
                >
                  {expanded ? '▾' : '▸'} {expanded ? t('todo.collapse') : t('todo.expand')} ({completedCount}/{todo.children.length})
                </span>
              )}
            </div>
            {todo.tags && todo.tags.length > 0 && (
              <div className="todo-tags">
                {todo.tags.map((tag) => (
                  <span key={tag.id} className="tag-badge">{tag.name}</span>
                ))}
              </div>
            )}
          </div>

          <div className="todo-actions">
            <CustomButtons position="todoItem" />
            <button title={t('app.edit')} onClick={handleEdit}>✎</button>
            <button title={t('app.addSubtask')} onClick={handleAddSub}>＋</button>
            {onDetail && (
              <button className="todo-action-btn" onClick={(e) => { e.stopPropagation(); onDetail(todo) }} title={t('auth.taskDetail')}>?</button>
            )}
            {showDeleteConfirm ? (
              <>
                <button className="danger" onClick={(e) => { e.stopPropagation(); onDelete(todo.id); setShowDeleteConfirm(false) }}>{t('app.confirm')}</button>
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}>{t('app.cancel')}</button>
              </>
            ) : (
              <button className="danger" title={t('app.delete')} onClick={handleDelete}>✕</button>
            )}
          </div>
        </div>

        {expanded && hasChildren && (
          <SubTaskList
            subtasks={todo.children}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddSub={onAddSub}
            onEdit={onEdit}
            onReorder={onReorder}
            onDetail={onDetail}
          />
        )}
      </div>
    </div>
  )
})

export default TodoItem
