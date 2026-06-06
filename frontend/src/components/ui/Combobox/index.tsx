import React, { useMemo, useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import Input from '../Input'
import { useFormField } from '../FormField'
import './styles.css'

export interface ComboboxOption {
  value: string
  label: string
  meta?: React.ReactNode
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | null
  onChange?: (v: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results',
  size = 'md',
  disabled,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const field = useFormField()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [query, options])

  const selected = options.find((o) => o.value === value) ?? null

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={field?.id}
          disabled={disabled}
          aria-invalid={field?.invalid || undefined}
          aria-describedby={[field?.errorId, field?.hintId].filter(Boolean).join(' ') || undefined}
          className={`ui-combobox-trigger ui-combobox-${size} ${field?.invalid ? 'ui-combobox-invalid' : ''} ${className}`}
        >
          <span className={`ui-combobox-value ${selected ? '' : 'ui-combobox-placeholder'}`}>
            {selected?.label ?? placeholder}
          </span>
          <span className="ui-combobox-chevron" aria-hidden="true">▾</span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="ui-combobox-content"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
        >
          <div className="ui-combobox-search">
            <Input
              autoFocus
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="sm"
            />
          </div>
          <div className="ui-combobox-list" role="listbox">
            {filtered.length === 0 ? (
              <div className="ui-combobox-empty">{emptyText}</div>
            ) : (
              filtered.map((o) => {
                const active = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`ui-combobox-item ${active ? 'ui-combobox-item-active' : ''}`}
                    onClick={() => {
                      onChange?.(o.value)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span>{o.label}</span>
                    {o.meta && <span className="ui-combobox-meta">{o.meta}</span>}
                  </button>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default Combobox
