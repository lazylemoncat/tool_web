/*
 TodoForm — 任务创建/编辑表单, 使用新 Modal 包装.
 分组: 基础 / 标签&文件夹 / 重复规则.
*/

import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { Modal, FormField, Input, Textarea, Button } from '../ui'
import type { Folder } from '../../hooks/useFolders'
import type { Todo } from '../../hooks/useTodos'
import TagInput from './TagInput'
import type { Tag } from '../../hooks/useTags'

export interface TodoFormData {
  title: string
  folder_id: number | null
  parent_id: number | null
  priority: number
  note: string
  due_date: string | null
  tag_ids: number[]
  recurrence_rules: string[]
}

interface Props {
  folders: Folder[]
  defaultFolderId?: number | null
  parentId?: number | null
  editTodo?: Todo | null
  onSubmit: (data: {
    title: string
    folder_id: number | null
    parent_id: number | null
    priority: number
    due_date: string
    note: string
    tag_ids: number[]
    recurrence_rules: string[]
  }) => void
  onClose: () => void
}

const RRULE_PRESETS: { labelKey: string; value: string }[] = [
  { labelKey: 'recurrence.daily', value: 'FREQ=DAILY' },
  { labelKey: 'recurrence.weekly', value: 'FREQ=WEEKLY' },
  { labelKey: 'recurrence.weekdays', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { labelKey: 'recurrence.monthly', value: 'FREQ=MONTHLY' },
]

const TodoForm: React.FC<Props> = React.memo(({ folders, defaultFolderId, parentId, editTodo, onSubmit, onClose }) => {
  const { t } = useLocale()
  const isEdit = !!editTodo
  const [title, setTitle] = useState(editTodo?.title ?? '')
  const [folderId, setFolderId] = useState<number | null>(editTodo?.folder_id ?? defaultFolderId ?? null)
  const [priority, setPriority] = useState(editTodo?.priority ?? 2)
  const [dueDate, setDueDate] = useState(editTodo?.due_date ?? '')
  const [note, setNote] = useState(editTodo?.note ?? '')
  const [tags, setTags] = useState<Tag[]>(editTodo?.tags ?? [])
  const [titleError, setTitleError] = useState('')
  const [recurrenceEnabled, setRecurrenceEnabled] = useState((editTodo?.recurrence_rules?.length ?? 0) > 0)
  const [recurrenceRules, setRecurrenceRules] = useState<string[]>(
    editTodo?.recurrence_rules?.map((r) => r.rrule_string) ?? [],
  )

  const addRecurrenceRule = (rrule: string) => {
    if (rrule.trim()) setRecurrenceRules((prev) => [...prev, rrule.trim()])
  }

  const removeRecurrenceRule = (index: number) => {
    setRecurrenceRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setTitleError(t('ui.form.required')); return }
    setTitleError('')
    onSubmit({
      title: title.trim(),
      folder_id: folderId,
      parent_id: parentId ?? null,
      priority,
      due_date: dueDate || '',
      note: note.trim(),
      tag_ids: tags.map((t) => t.id),
      recurrence_rules: recurrenceEnabled ? recurrenceRules : [],
    })
  }

  const heading = isEdit ? t('todo.editTask') : parentId ? t('todo.addSubtask') : t('todo.newTask')

  return (
    <Modal open onOpenChange={() => onClose()} size="lg" title={heading}>
      <form onSubmit={handleSubmit}>
        {/* ── 基础 ── */}
        <FormField label={t('todo.taskName')} error={titleError} required>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError('') }}
            placeholder={t('todo.enterTask')}
            autoFocus
          />
        </FormField>

        <div className="form-row">
          <div className="form-group">
            <label>{t('todo.priority')}</label>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              <option value={1}>{t('priority.high')}</option>
              <option value={2}>{t('priority.mid')}</option>
              <option value={3}>{t('priority.low')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('todo.dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="todo-date-input"
            />
          </div>
        </div>

        {/* ── 标签 & 文件夹 ── */}
        <div className="form-row">
          <div className="form-group">
            <label>{t('todo.folder')}</label>
            <select value={folderId ?? ''} onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('todo.none')}</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{t('tag.tags')}</label>
          <TagInput selectedTags={tags} onChange={setTags} />
        </div>

        <div className="form-group">
          <label>{t('todo.note')}</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('todo.optional')} rows={2} />
        </div>

        {/* ── 重复规则 ── */}
        <div className="form-group">
          <label className="form-checkbox-label">
            <input type="checkbox" checked={recurrenceEnabled} onChange={(e) => setRecurrenceEnabled(e.target.checked)} />
            {' '}🔁 {t('recurrence.enable')}
          </label>
        </div>

        {recurrenceEnabled && (
          <div className="recurrence-section">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {RRULE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className="filter-btn"
                  onClick={() => addRecurrenceRule(p.value)}
                >
                  {t(p.labelKey)}
                </button>
              ))}
              <button
                type="button"
                className="filter-btn"
                onClick={() => addRecurrenceRule('')}
              >
                {t('recurrence.custom')}
              </button>
            </div>

            {recurrenceRules.map((rrule, i) => (
              <div key={i} className="recurrence-rule-row">
                <select
                  className="recurrence-preset"
                  value={RRULE_PRESETS.find((p) => p.value === rrule)?.value ?? ''}
                  onChange={(e) => {
                    const newRules = [...recurrenceRules]
                    newRules[i] = e.target.value
                    setRecurrenceRules(newRules)
                  }}
                >
                  <option value="">{t('recurrence.custom')}</option>
                  {RRULE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
                  ))}
                </select>
                <input
                  className="recurrence-input"
                  value={rrule}
                  onChange={(e) => {
                    const newRules = [...recurrenceRules]
                    newRules[i] = e.target.value
                    setRecurrenceRules(newRules)
                  }}
                  placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                />
                <button
                  type="button"
                  className="recurrence-remove-btn"
                  onClick={() => removeRecurrenceRule(i)}
                  aria-label={t('app.delete')}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="recurrence-add-btn" onClick={() => addRecurrenceRule('FREQ=DAILY')}>
              ＋ {t('recurrence.addRule')}
            </button>
          </div>
        )}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{t('app.cancel')}</Button>
          <Button type="submit">{isEdit ? t('app.save') : t('todo.create')}</Button>
        </div>
      </form>
    </Modal>
  )
})

export default TodoForm
