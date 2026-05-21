/*
 子任务列表组件: 支持拖拽排序.
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
import TodoItem from './TodoItem'
import type { Todo } from '../../hooks/useTodos'

interface Props {
  subtasks: Todo[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onReorder?: (items: { id: number; sort_order: number }[]) => void
  onDetail?: (todo: Todo) => void
}

interface SortableItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSub: (parentId: number) => void
  onEdit: (todo: Todo) => void
  onDetail?: (todo: Todo) => void
}

const SortableItem: React.FC<SortableItemProps> = ({ todo, onToggle, onDelete, onAddSub, onEdit, onDetail }) => {
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
    <div ref={setNodeRef} style={style} className={`todo-item-wrapper ${isDragging ? 'sortable-dragging' : ''}`}>
      <span className="todo-drag-handle" {...attributes} {...listeners}>⠿</span>
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        onAddSub={onAddSub}
        onEdit={onEdit}
        onDetail={onDetail}
      />
    </div>
  )
}

const SubTaskList: React.FC<Props> = React.memo(({ subtasks, onToggle, onDelete, onAddSub, onEdit, onReorder, onDetail }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = subtasks.findIndex((t) => t.id === active.id)
    const newIndex = subtasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...subtasks]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onReorder?.(reordered.map((t, i) => ({ id: t.id, sort_order: i })))
  }

  const ids = subtasks.map((t) => t.id)

  if (!onReorder) {
    return (
      <div className="subtask-list">
        {subtasks.map((st) => (
          <TodoItem
            key={st.id}
            todo={st}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddSub={onAddSub}
            onEdit={onEdit}
            onDetail={onDetail}
          />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="subtask-list">
          {subtasks.map((st) => (
            <SortableItem
              key={st.id}
              todo={st}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onDetail={onDetail}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
})

export default SubTaskList
