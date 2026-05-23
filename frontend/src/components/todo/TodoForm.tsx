import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { FormField, Input, Textarea, Button, IconButton } from '../ui'
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

const TodoForm: React.FC<Props> = React.memo(({ folders, defaultFolderId, parentId, editTodo, onSubmit, onClose }) => {
  const { t, locale } = useLocale()
  const isEdit = !!editTodo
  const [title, setTitle] = useState(editTodo?.title ?? '')
  const [folderId, setFolderId] = useState<number | null>(editTodo?.folder_id ?? defaultFolderId ?? null)
  const [priority, setPriority] = useState(editTodo?.priority ?? 2)
  const [dueDate, setDueDate] = useState(editTodo?.due_date?.replace(/-/g, '/') ?? '')
  const [note, setNote] = useState(editTodo?.note ?? '')
  const [tags, setTags] = useState<Tag[]>(editTodo?.tags ?? [])
  const [titleError, setTitleError] = useState('')

  // Recurrence state
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(
    (editTodo?.recurrence_rules?.length ?? 0) > 0
  )
  const [recurrenceRules, setRecurrenceRules] = useState<string[]>(
    editTodo?.recurrence_rules?.map(r => r.rrule_string) ?? []
  )

  const RECURRENCE_PRESETS = [
    { label: t('recurrence.daily'), value: 'FREQ=DAILY' },
    { label: t('recurrence.weekly'), value: 'FREQ=WEEKLY' },
    { label: t('recurrence.weekdays'), value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
    { label: t('recurrence.weekends'), value: 'FREQ=WEEKLY;BYDAY=SA,SU' },
    { label: t('recurrence.monthly'), value: 'FREQ=MONTHLY' },
  ]

  const addRecurrenceRule = (rrule: string) => {
    if (rrule.trim()) {
      setRecurrenceRules(prev => [...prev, rrule.trim()])
    }
  }

  const removeRecurrenceRule = (index: number) => {
    setRecurrenceRules(prev => prev.filter((_, i) => i !== index))
  }

  const updateRecurrenceRule = (index: number, rrule: string) => {
    setRecurrenceRules(prev => prev.map((r, i) => i === index ? rrule : r))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError(t('ui.form.required'))
      return
    }
    setTitleError('')
    onSubmit({
      title: title.trim(),
      folder_id: folderId,
      parent_id: parentId ?? null,
      priority,
      due_date: dueDate.replace(/\//g, '-') || '',
      note: note.trim(),
      tag_ids: tags.map((t) => t.id),
      recurrence_rules: recurrenceEnabled ? recurrenceRules : [],
    })
  }

  const heading = isEdit ? t('todo.editTask') : parentId ? t('todo.addSubtask') : t('todo.newTask')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{heading}</h2>
        <form onSubmit={handleSubmit}>
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
              <label>{t('todo.folder')}</label>
              <select
                value={folderId ?? ''}
                onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('todo.none')}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('todo.priority')}</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                <option value={1}>{t('priority.high')}</option>
                <option value={2}>{t('priority.mid')}</option>
                <option value={3}>{t('priority.low')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('todo.dueDate')}</label>
            <Input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder={locale === 'zh' ? '年/月/日' : 'yyyy/mm/dd'}
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={recurrenceEnabled}
                onChange={(e) => setRecurrenceEnabled(e.target.checked)}
              />
              {' '}🔁 {t('recurrence.enable')}
            </label>
          </div>

          {recurrenceEnabled && (
            <div className="recurrence-section">
              {recurrenceRules.map((rrule, i) => (
                <div key={i} className="recurrence-rule-row">
                  <select
                    className="recurrence-preset"
                    value={RECURRENCE_PRESETS.find(p => p.value === rrule)?.value ?? ''}
                    onChange={(e) => {
                      if (e.target.value) updateRecurrenceRule(i, e.target.value)
                    }}
                  >
                    <option value="">{t('recurrence.custom')}</option>
                    {RECURRENCE_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <input
                    className="recurrence-input"
                    value={rrule}
                    onChange={(e) => updateRecurrenceRule(i, e.target.value)}
                    placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                  />
                  <IconButton
                    aria-label={t('app.delete')}
                    size="sm"
                    variant="danger"
                    type="button"
                    onClick={() => removeRecurrenceRule(i)}
                  >✕</IconButton>
                </div>
              ))}
              <button
                type="button"
                className="recurrence-add-btn"
                onClick={() => addRecurrenceRule('FREQ=DAILY')}
              >
                ＋ {t('recurrence.addRule')}
              </button>
            </div>
          )}

          <div className="form-group">
            <label>{t('todo.note')}</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('todo.optional')}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>{t('tag.tags')}</label>
            <TagInput selectedTags={tags} onChange={setTags} />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>{t('app.cancel')}</Button>
            <Button type="submit">{isEdit ? t('app.save') : t('todo.create')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
})

export default TodoForm
