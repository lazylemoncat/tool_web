/*
 TodoItem — 单条任务行.
 子树不内联展开, 改为 badge 点击 → 父组件打开 SubTaskDrawer.
*/

import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { useConfirm, IconButton } from '../ui'
import PriorityTag from '../common/PriorityTag'
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
  onOpenSubtasks?: (todo: Todo) => void
}

const TodoItem: React.FC<Props> = React.memo(({ todo, onToggle, onDelete, onAddSub, onEdit, onReorder, onDetail, onOpenSubtasks }) => {
  const { t, locale } = useLocale()
  const confirm = useConfirm()

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
    setSwipeX((prev) => (prev > ACTION_WIDTH / 2 ? ACTION_WIDTH : 0))
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

  const handleCheck = (e: React.MouseEvent) => { e.stopPropagation(); onToggle(todo.id) }
  const handleEdit = (e: React.MouseEvent) => { e.stopPropagation(); onEdit(todo) }
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await confirm({ title: t('app.confirmDelete'), description: `"${todo.title}"`, danger: true })
    if (ok) onDelete(todo.id)
  }
  const handleAddSub = (e: React.MouseEvent) => { e.stopPropagation(); onAddSub(todo.id) }
  const handleOpenSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenSubtasks?.(todo)
  }

  return (
    <div className="todo-item-wrapper" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="todo-swipe-actions">
        <button className="swipe-btn swipe-edit" onClick={(e) => { e.stopPropagation(); onEdit(todo) }}>{t('app.edit')}</button>
        <button className="swipe-btn swipe-delete" onClick={handleDelete}>{t('app.delete')}</button>
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
                <span className="recurrence-icon" title={todo.recurrence_rules.map((r) => r.rrule_string).join('\n')}>
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
                <span className="subtask-hint subtask-badge" onClick={handleOpenSubtasks}>
                  {completedCount}/{todo.children.length}
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
            <IconButton aria-label={t('app.edit')} size="sm" onClick={handleEdit}>✎</IconButton>
            <IconButton aria-label={t('app.addSubtask')} size="sm" onClick={handleAddSub}>＋</IconButton>
            {onDetail && (
              <IconButton aria-label={t('auth.taskDetail')} size="sm" onClick={(e) => { e.stopPropagation(); onDetail(todo) }}>?</IconButton>
            )}
            <IconButton aria-label={t('app.delete')} size="sm" variant="danger" onClick={handleDelete}>✕</IconButton>
          </div>
        </div>
      </div>
    </div>
  )
})

export default TodoItem
