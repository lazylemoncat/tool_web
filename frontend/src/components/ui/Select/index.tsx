import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { useFormField } from '../FormField'
import './styles.css'

export interface SelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  id?: string
  invalid?: boolean
  className?: string
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  size = 'md',
  disabled,
  id,
  invalid,
  className = '',
}) => {
  const field = useFormField()
  const finalInvalid = invalid ?? field?.invalid ?? false
  const describedBy = [field?.errorId, field?.hintId].filter(Boolean).join(' ') || undefined

  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id ?? field?.id}
        className={`ui-select-trigger ui-select-${size} ${finalInvalid ? 'ui-select-invalid' : ''} ${className}`}
        aria-invalid={finalInvalid || undefined}
        aria-describedby={describedBy}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="ui-select-icon" aria-hidden="true">▾</SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={4}>
          <SelectPrimitive.Viewport className="ui-select-viewport">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="ui-select-item"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ui-select-indicator">✓</SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export default Select
