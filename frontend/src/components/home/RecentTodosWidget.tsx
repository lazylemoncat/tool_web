/*
 RecentTodosWidget — 最近 5 条待办任务.
*/

import React from 'react'
import { useNavigate } from 'umi'
import { useLocale } from '../../i18n'
import { useTodos } from '../../hooks/useTodos'
import { Card, CardHeader, CardBody, Skeleton } from '../ui'

const RecentTodosWidget: React.FC = () => {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { todos, loading } = useTodos({})

  const recent = todos.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{t('home.recentTodos')}</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" width={`${60 + i * 10}%`} />)
        ) : recent.length === 0 ? (
          <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.85rem' }}>{t('todo.emptyState')}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recent.map((todo) => (
              <li
                key={todo.id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: todo.is_completed ? 'var(--color-fg-muted)' : 'var(--color-fg)',
                  textDecoration: todo.is_completed ? 'line-through' : 'none',
                }}
                onClick={() => navigate('/todo')}
              >
                {todo.title}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

export default RecentTodosWidget
