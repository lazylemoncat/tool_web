/*
 SubTaskDrawer — 父子任务独立抽屉, 支持栈式嵌套 (子任务再开子抽屉).
*/

import React, { useState } from 'react'
import { Drawer } from '../ui'
import { useLocale } from '../../i18n'
import SubTaskList from './SubTaskList'
import type { Todo } from '../../hooks/useTodos'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentTodo: Todo
  subtasks: Todo[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onReorder?: (items: { id: number; sort_order: number }[]) => void
  onDetail?: (todo: Todo) => void
  stackLevel?: number
}

const SubTaskDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  parentTodo,
  subtasks,
  onToggle,
  onDelete,
  onAddSub,
  onEdit,
  onReorder,
  onDetail,
  stackLevel = 0,
}) => {
  const { t } = useLocale()
  const completedCount = subtasks.filter((s) => s.is_completed).length

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      stackLevel={stackLevel}
      title={`${t('todo.subtasks')}: ${parentTodo.title}`}
      description={t('todo.subtaskCount', { done: completedCount, total: subtasks.length })}
    >
      <SubTaskList
        subtasks={subtasks}
        onToggle={onToggle}
        onDelete={onDelete}
        onAddSub={onAddSub}
        onEdit={onEdit}
        onReorder={onReorder}
        onDetail={onDetail}
        onOpenSubtasks={onDetail ? (t: Todo) => onDetail?.(t) : undefined}
      />
    </Drawer>
  )
}

export default SubTaskDrawer
