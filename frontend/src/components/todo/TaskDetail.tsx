/*
 任务详情只读弹窗: 展示完整任务信息、子任务、重复规则、标签等.
*/

import React from 'react'
import { Todo } from '../../hooks/useTodos'
import { useLocale } from '../../i18n'
import { Button } from '../ui'
import PriorityTag from '../common/PriorityTag'

interface Props {
  todo: Todo
  onClose: () => void
  onEdit: (todo: Todo) => void
}

function describeRRule(rrule: string, t: (key: string) => string, locale: string): string {
  if (rrule === 'FREQ=DAILY') return t('recurrence.daily')
  if (rrule === 'FREQ=WEEKLY') return t('recurrence.weekly')
  if (rrule === 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR') return t('recurrence.weekdays')
  if (rrule === 'FREQ=WEEKLY;BYDAY=SA,SU') return t('recurrence.weekends')
  if (rrule === 'FREQ=MONTHLY') return t('recurrence.monthly')
  // Parse custom BYDAY patterns
  const m = rrule.match(/FREQ=WEEKLY;BYDAY=([A-Z,]+)/)
  if (m) {
    const dayMap: Record<string, string> = locale === 'zh'
      ? { MO: '一', TU: '二', WE: '三', TH: '四', FR: '五', SA: '六', SU: '日' }
      : { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' }
    const days = m[1].split(',').map(d => dayMap[d] || d)
    return locale === 'zh' ? `每${days.join('、')}` : `Every ${days.join(', ')}`
  }
  return rrule
}

const TaskDetail: React.FC<Props> = ({ todo, onClose, onEdit }) => {
  const { t, locale } = useLocale()
  const completedSubCount = todo.children?.filter(c => c.is_completed).length || 0
  const totalSubCount = todo.children?.length || 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h2>{t('auth.taskDetail')}</h2>
          <button className="detail-close" onClick={onClose} aria-label={t('app.close')}>×</button>
        </div>

        <div className="detail-body">
          <div className="detail-field">
            <label>{t('todo.taskName')}</label>
            <span className="detail-title">{todo.title}</span>
          </div>

          <div className="detail-field">
            <label>{t('auth.status')}</label>
            <span>{todo.is_completed ? `✓ ${t('todo.completed')}` : `○ ${t('todo.active')}`}</span>
          </div>

          <div className="detail-field">
            <label>{t('todo.priority')}</label>
            <PriorityTag priority={todo.priority} />
          </div>

          {todo.due_date && (
            <div className="detail-field">
              <label>{t('todo.dueDate')}</label>
              <span>{todo.due_date}</span>
            </div>
          )}

          {todo.tags && todo.tags.length > 0 && (
            <div className="detail-field">
              <label>{t('tag.tags')}</label>
              <div className="detail-tags">
                {todo.tags.map(tag => <span key={tag.id} className="tag-badge">{tag.name}</span>)}
              </div>
            </div>
          )}

          <div className="detail-section">
            <label>{t('todo.note')}</label>
            <div className="detail-note">{todo.note || t('auth.noNote')}</div>
          </div>

          {todo.recurrence_rules && todo.recurrence_rules.length > 0 && (
            <div className="detail-section">
              <label>{t('recurrence.enable')}</label>
              <ul className="detail-rrules">
                {todo.recurrence_rules.map((r, i) => (
                  <li key={i}>{describeRRule(r.rrule_string, t, locale)} <code>({r.rrule_string})</code></li>
                ))}
              </ul>
            </div>
          )}

          {totalSubCount > 0 && (
            <div className="detail-section">
              <label>{t('auth.subtasks')} ({completedSubCount}/{totalSubCount})</label>
              <ul className="detail-subtasks">
                {todo.children!.map(child => (
                  <li key={child.id} className={child.is_completed ? 'completed' : ''}>
                    {child.is_completed ? '✓' : '○'} {child.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail-meta">
            <div><label>{t('auth.createdTime')}</label> {new Date(todo.created_at).toLocaleString()}</div>
            <div><label>{t('auth.updatedTime')}</label> {new Date(todo.updated_at).toLocaleString()}</div>
            {todo.completed_at && <div><label>{t('auth.completedTime')}</label> {new Date(todo.completed_at).toLocaleString()}</div>}
          </div>
        </div>

        <div className="detail-footer">
          <Button onClick={() => onEdit(todo)}>{t('app.edit')}</Button>
          <Button variant="secondary" onClick={onClose}>{t('app.close')}</Button>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
