/*
  FinanceSortableList: shared drag sorting shell for finance list/card rows.
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

interface SortableItemProps<T extends { id: number }> {
  item: T
  children: (item: T) => React.ReactNode
}

const SortableItem = <T extends { id: number }>({ item, children }: SortableItemProps<T>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={`finance-sortable-item ${isDragging ? 'sortable-dragging' : ''}`}>
      <span className="finance-drag-handle" {...attributes} {...listeners}>⠿</span>
      <div className="finance-sortable-content">{children(item)}</div>
    </div>
  )
}

interface Props<T extends { id: number }> {
  items: T[]
  className?: string
  onReorder: (items: { id: number; sort_order: number }[]) => void
  children: (item: T) => React.ReactNode
}

const FinanceSortableList = <T extends { id: number }>({ items, className = '', onReorder, children }: Props<T>) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorder(reordered.map((item, index) => ({ id: item.id, sort_order: index })))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} item={item}>{children}</SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default FinanceSortableList
