/*
  EventForm: 创建/编辑事件 Modal.
*/
import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import type { FinanceEvent } from '../../hooks/useFinance'

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

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      color,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? t('finance.editEvent') : t('finance.newEvent')}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{t('finance.eventName')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('finance.eventName')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('finance.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('finance.description')}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('finance.startAt')}</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('finance.endAt')}</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
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
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>{t('app.cancel')}</button>
          <button className="btn-submit" onClick={handleSubmit}>{t('app.confirm')}</button>
        </div>
      </div>
    </div>
  )
}

export default EventForm
