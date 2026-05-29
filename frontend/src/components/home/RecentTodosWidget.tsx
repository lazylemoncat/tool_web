/*
 RecentTodosWidget — 首页最近任务列表.
 读取待办数据并渲染为 HomePage 仪表盘卡片内的内容区.
*/

import React from 'react'
import { useNavigate } from 'umi'
import { useLocale } from '../../i18n'
import { useTodos } from '../../hooks/useTodos'
import { Skeleton } from '../ui'

const RecentTodosWidget: React.FC = () => {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { todos, loading } = useTodos({})

  const recent = todos.slice(0, 5)

  return (
    <div className="home-recent-widget">
      {loading ? (
        <div className="home-widget-skeletons">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" width={`${68 + i * 6}%`} />)}
        </div>
      ) : recent.length === 0 ? (
        <p className="home-widget-empty">{t('todo.emptyState')}</p>
      ) : (
        <ul className="home-recent-list">
          {recent.map((todo) => (
            <li key={todo.id}>
              <button
                type="button"
                className={todo.is_completed ? 'completed' : ''}
                onClick={() => navigate('/todo')}
              >
                <span className="home-task-status" aria-hidden="true" />
                <span className="home-task-copy">
                  <span className="home-task-title">{todo.title}</span>
                  <span className="home-task-meta">
                    {todo.due_date || t('home.noDueDate')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentTodosWidget
