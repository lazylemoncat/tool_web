import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import './styles.css'

export interface TabItem {
  value: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ items, value, defaultValue, onValueChange, className = '' }) => {
  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={`ui-tabs ${className}`}
    >
      <TabsPrimitive.List className="ui-tabs-list">
        {items.map((it) => (
          <TabsPrimitive.Trigger
            key={it.value}
            value={it.value}
            disabled={it.disabled}
            className="ui-tabs-trigger"
          >
            {it.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((it) => (
        <TabsPrimitive.Content key={it.value} value={it.value} className="ui-tabs-content">
          {it.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

export default Tabs
