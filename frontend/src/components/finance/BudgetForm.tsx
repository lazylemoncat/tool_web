/*
  BudgetForm: 创建/编辑预算 Modal.
*/
import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { FormField, NumberInput } from '../../components/ui'
import type { Budget, FinanceCategory, FinanceTag, FinanceEvent } from '../../hooks/finance'

interface Props {
  editBudget?: Budget | null
  categories: FinanceCategory[]
  tags: FinanceTag[]
  events: FinanceEvent[]
  onSubmit: (fields: Record<string, unknown>) => void
  onClose: () => void
}

const flatCategories = (cats: FinanceCategory[]): FinanceCategory[] => {
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

const BudgetForm: React.FC<Props> = ({ editBudget, categories, tags, events, onSubmit, onClose }) => {
  const { t } = useLocale()
  const isEdit = !!editBudget

  const [name, setName] = useState(editBudget?.name ?? '')
  const [amount, setAmount] = useState(editBudget ? String(editBudget.amount) : '')
  const [currency, setCurrency] = useState(editBudget?.currency ?? 'CNY')
  const [rrule, setRrule] = useState(editBudget?.rrule ?? '')
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    editBudget?.filters?.category_ids ?? [],
  )
  const [selectedTags, setSelectedTags] = useState<number[]>(
    editBudget?.filters?.tag_ids ?? [],
  )
  const [selectedEvents, setSelectedEvents] = useState<number[]>(
    editBudget?.filters?.event_ids ?? [],
  )
  const [rollover, setRollover] = useState(editBudget?.rollover ?? false)
  const [alertThreshold, setAlertThreshold] = useState(editBudget?.alert_threshold ?? 80)
  const [nameError, setNameError] = useState('')
  const [amountError, setAmountError] = useState('')

  const allCats = flatCategories(categories)

  const toggleItem = (id: number, selected: number[], setter: (v: number[]) => void) => {
    setter(selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id])
  }

  const buildFilters = () => {
    const f: Record<string, number[]> = {}
    if (selectedCategories.length) f.category_ids = selectedCategories
    if (selectedTags.length) f.tag_ids = selectedTags
    if (selectedEvents.length) f.event_ids = selectedEvents
    return Object.keys(f).length ? f : null
  }

  const handleSubmit = () => {
    let valid = true
    if (!name.trim()) { setNameError(t('finance.nameRequired')); valid = false }
    else setNameError('')
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setAmountError(t('finance.amountRequired')); valid = false }
    else setAmountError('')
    if (!valid) return
    onSubmit({
      name: name.trim(),
      amount: numAmount,
      currency: currency || 'CNY',
      rrule: rrule.trim() || null,
      filters: buildFilters(),
      rollover,
      alert_threshold: alertThreshold,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? t('finance.editBudget') : t('finance.newBudget')}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t('app.close')}>x</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="flex-2">
              <FormField label={t('finance.budgetName')} error={nameError} required>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }}
                  placeholder={t('finance.budgetName')}
                  autoFocus
                />
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label={t('finance.currency')}>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="form-row">
            <div className="flex-1">
              <FormField label={t('finance.budgetAmount')} error={amountError} required>
                <NumberInput
                  value={amount ? parseFloat(amount) : null}
                  onChange={(v) => { setAmount(v !== null ? String(v) : ''); if (amountError) setAmountError('') }}
                  decimals={2}
                  min={0}
                  placeholder="0.00"
                />
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label={`${t('finance.alertThreshold')} (%)`}>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Math.min(100, Math.max(1, Number(e.target.value) || 80)))}
                  min="1"
                  max="100"
                />
              </FormField>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('finance.rrule')}</label>
            <input
              value={rrule}
              onChange={(e) => setRrule(e.target.value)}
              placeholder={t('finance.rruleHint')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('finance.filterCategories')}</label>
            <div className="finance-checkbox-group">
              {allCats.map((cat) => (
                <label key={cat.id} className="finance-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleItem(cat.id, selectedCategories, setSelectedCategories)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('finance.filterTags')}</label>
            <div className="finance-tag-chips">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  className={`finance-tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                  onClick={() => toggleItem(tag.id, selectedTags, setSelectedTags)}
                  type="button"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('finance.filterEvents')}</label>
            <div className="finance-checkbox-group">
              {events.map((ev) => (
                <label key={ev.id} className="finance-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev.id)}
                    onChange={() => toggleItem(ev.id, selectedEvents, setSelectedEvents)}
                  />
                  <span className="dot" style={{ background: ev.color }} /> {ev.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="finance-checkbox-label">
              <input
                type="checkbox"
                checked={rollover}
                onChange={(e) => setRollover(e.target.checked)}
              />
              {t('finance.rollover')}
            </label>
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

export default BudgetForm
