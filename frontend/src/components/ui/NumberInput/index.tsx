import React, { forwardRef, useState, useEffect } from 'react'
import Input, { type InputProps } from '../Input'

export interface NumberInputProps
  extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'type'> {
  value?: number | null
  defaultValue?: number | null
  onChange?: (value: number | null) => void
  thousandSeparator?: boolean
  decimals?: number
  min?: number
  max?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

function formatNumber(
  n: number | null,
  thousand: boolean,
  decimals: number | undefined,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return ''
  let s = decimals !== undefined ? n.toFixed(decimals) : String(n)
  if (thousand) {
    const [int, frac] = s.split('.')
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    s = frac !== undefined ? `${withSep}.${frac}` : withSep
  }
  return s
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isNaN(n) ? null : n
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      thousandSeparator = true,
      decimals,
      min,
      max,
      ...rest
    },
    ref,
  ) => {
    const controlled = value !== undefined
    const [internal, setInternal] = useState<number | null>(defaultValue ?? null)
    const [focused, setFocused] = useState(false)
    const [draft, setDraft] = useState<string>(() =>
      formatNumber(controlled ? (value ?? null) : (defaultValue ?? null), thousandSeparator, decimals),
    )

    useEffect(() => {
      if (controlled && !focused) {
        setDraft(formatNumber(value ?? null, thousandSeparator, decimals))
      }
    }, [value, controlled, focused, thousandSeparator, decimals])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (!/^-?[\d,]*\.?\d*$/.test(raw)) return
      setDraft(raw)
      const parsed = parseNumber(raw)
      let bounded = parsed
      if (parsed !== null) {
        if (min !== undefined && parsed < min) bounded = min
        if (max !== undefined && parsed > max) bounded = max
      }
      if (!controlled) setInternal(bounded)
      onChange?.(bounded)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      const current = controlled ? (value ?? null) : internal
      setDraft(current === null ? '' : String(current))
      rest.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      const current = controlled ? (value ?? null) : internal
      setDraft(formatNumber(current, thousandSeparator, decimals))
      rest.onBlur?.(e)
    }

    return (
      <Input
        ref={ref}
        inputMode="decimal"
        value={draft}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'

export default NumberInput
