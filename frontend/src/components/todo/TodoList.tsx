/*
 主任务列表组件: 支持拖拽排序.
*/

import React from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLocale } from '../../i18n'
import TodoItem from './TodoItem'
import type { Todo } from '../../hooks/useTodos'

interface Props {
  todos: Todo[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onReorder: (items: { id: number; sort_order: number }[]) => void
  onDetail?: (todo: Todo) => void
  selectMode?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
}

interface SortableTodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onReorder?: (items: { id: number; sort_order: number }[]) => void
  onDetail?: (todo: Todo) => void
  selectMode?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = ({ todo, onToggle, onDelete, onAddSub, onEdit, onReorder, onDetail, selectMode, selectedIds, onToggleSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} className={`todo-item-wrapper ${isDragging ? 'sortable-dragging' : ''} ${selectMode ? 'select-mode' : ''}`}>
      <span className="todo-drag-handle" {...attributes} {...listeners}>⠿</span>
      {selectMode && (
        <input
          type="checkbox"
          checked={selectedIds?.has(todo.id) ?? false}
          onChange={() => onToggleSelect?.(todo.id)}
          className="bulk-checkbox"
        />
      )}
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        onAddSub={onAddSub}
        onEdit={onEdit}
        onReorder={onReorder}
        onDetail={onDetail}
      />
    </div>
  )
}

const TodoList: React.FC<Props> = React.memo(({ todos, onToggle, onDelete, onAddSub, onEdit, onReorder, onDetail, selectMode, selectedIds, onToggleSelect }) => {
  const { t } = useLocale()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>{t('todo.emptyState')}</p>
      </div>
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex((t) => t.id === active.id)
    const newIndex = todos.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...todos]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onReorder(reordered.map((t, i) => ({ id: t.id, sort_order: i })))
  }

  const ids = todos.map((t) => t.id)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="todo-list">
          {todos.map((t) => (
            <SortableTodoItem
              key={t.id}
              todo={t}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onReorder={onReorder}
              onDetail={onDetail}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
})

export default TodoList
