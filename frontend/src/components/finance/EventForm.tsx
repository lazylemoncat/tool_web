/*
 EventForm — 创建/编辑事件. 使用新 Modal 包装.
*/

import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { Modal, FormField, FormFooter } from '../ui'
import type { FinanceEvent } from '../../hooks/finance'

const COLORS = ['#e07050', '#4a7c59', '#6b8cce', '#c4943a', '#9c7cb0', '#5b9e9e', '#d4876b']

interface Props {
  editEvent?: FinanceEvent | null
  onSubmit: (fields: Record<string, unknown>) => void
  onClose: () => void
}

const EventForm: React.FC<Props> = ({ editEvent, onSubmit, onClose }) => {
  const { t } = useLocale()
  const isEdit = !!editEvent

  const [name, setName] = useState(editEvent?.name ?? '')
  const [description, setDescription] = useState(editEvent?.description ?? '')
  const [startAt, setStartAt] = useState(editEvent?.start_at?.slice(0, 16) ?? '')
  const [endAt, setEndAt] = useState(editEvent?.end_at?.slice(0, 16) ?? '')
  const [color, setColor] = useState(editEvent?.color ?? COLORS[0])
  const [nameError, setNameError] = useState('')
  const [dateError, setDateError] = useState('')

  const handleSubmit = () => {
    let valid = true
    if (!name.trim()) { setNameError(t('finance.nameRequired')); valid = false }
    else setNameError('')
    if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
      setDateError(t('finance.endBeforeStart')); valid = false
    } else setDateError('')
    if (!valid) return
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      color,
    })
  }

  return (
    <Modal open onOpenChange={() => onClose()} size="md" title={isEdit ? t('finance.editEvent') : t('finance.newEvent')} footer={<FormFooter onCancel={onClose} onSubmit={handleSubmit} />}>
      <div className="form-group">
        <label className="form-label">{t('finance.eventName')} *</label>
        <input
          className={`form-input ${nameError ? 'has-error' : ''}`}
          value={name}
          onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }}
          placeholder={t('finance.eventName')}
          autoFocus
        />
        {nameError && <span className="form-hint" style={{ color: 'var(--color-expense)' }}>{nameError}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">{t('finance.description')}</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('finance.description')}
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('finance.startAt')}</label>
          <input
            className="form-input"
            type="datetime-local"
            value={startAt}
            onChange={(e) => { setStartAt(e.target.value); if (dateError) setDateError('') }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('finance.endAt')}</label>
          <input
            className={`form-input ${dateError ? 'has-error' : ''}`}
            type="datetime-local"
            value={endAt}
            onChange={(e) => { setEndAt(e.target.value); if (dateError) setDateError('') }}
          />
          {dateError && <span className="form-hint" style={{ color: 'var(--color-expense)' }}>{dateError}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('finance.color')}</label>
        <div className="finance-color-picker">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`finance-color-swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default EventForm
