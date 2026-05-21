import React from 'react'
import { useLocale } from '../../i18n'

const labels: Record<number, { key: string; cls: string }> = {
  1: { key: 'priority.high', cls: 'high' },
  2: { key: 'priority.mid', cls: 'medium' },
  3: { key: 'priority.low', cls: 'low' },
}

interface Props {
  priority: number
}

const PriorityTag: React.FC<Props> = ({ priority }) => {
  const { t } = useLocale()
  const item = labels[priority] || labels[2]
  return <span className={`priority-tag ${item.cls}`}>{t(item.key)}</span>
}

export default PriorityTag
