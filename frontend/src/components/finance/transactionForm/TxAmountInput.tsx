/*
  TxAmountInput: 金额输入 (NumberInput) + 快捷金额按钮.
*/
import React from 'react'
import { useLocale } from '../../../i18n'
import { FormField, NumberInput } from '../../ui'

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

interface Props {
  value: string
  onChange: (v: string) => void
  error?: string
  label?: string
}

const TxAmountInput: React.FC<Props> = ({ value, onChange, error, label = 'Amount' }) => {
  const numVal = value ? parseFloat(value) : null

  return (
    <FormField label={label} error={error} required>
      <NumberInput
        value={!isNaN(numVal as number) ? numVal : null}
        onChange={(v) => onChange(v !== null ? String(v) : '')}
        decimals={2}
        min={0}
        placeholder="0.00"
        className="finance-amount-input"
        autoFocus
      />
      <div className="finance-quick-amounts">
        {QUICK_AMOUNTS.map((qa) => (
          <button
            key={qa}
            className="quick-amt-chip"
            onClick={() => onChange(String(qa))}
          >{qa}</button>
        ))}
      </div>
    </FormField>
  )
}

export default TxAmountInput
