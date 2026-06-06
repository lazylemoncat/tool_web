import { useState } from 'react';
import type { DragEvent } from 'react';
import Box from '@mui/material/Box';
import TaskItem from './TaskItem';
import TaskDetail from './TaskDetail';
import type { TodoOut, FolderOut } from '@/lib/types';

interface TaskListProps {
  filteredTodos: TodoOut[];
  selectedTasks: Set<number>;
  expandedTask: number | null;
  multiSelectMode: boolean;
  onToggleComplete: (taskId: number) => void;
  onToggleSelect: (taskId: number) => void;
  onExpand: (taskId: number) => void;
  onSelectTask: (taskId: number) => void;
  onEditTask?: (task: TodoOut) => void;
  onDeleteTask?: (task: TodoOut) => void;
  onCreateSubTask?: (task: TodoOut) => void;
  onReorderTasks?: (parentId: number | null, orderedIds: number[]) => void;
  folders?: FolderOut[];
}

type TaskDropPosition = 'before' | 'after';

function moveTaskId(ids: number[], draggedId: number, targetId: number, position: TaskDropPosition): number[] {
  const withoutDragged = ids.filter((id) => id !== draggedId);
  const targetIndex = withoutDragged.indexOf(targetId);
  if (targetIndex < 0) return ids;
  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
  const next = [...withoutDragged];
  next.splice(insertIndex, 0, draggedId);
  return next;
}

export default function TaskList({
  filteredTodos, selectedTasks, expandedTask, multiSelectMode,
  onToggleComplete, onToggleSelect, onExpand, onSelectTask,
  onEditTask, onDeleteTask, onCreateSubTask, onReorderTasks, folders,
}: TaskListProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverTask, setDragOverTask] = useState<{ id: number; position: TaskDropPosition } | null>(null);

  if (filteredTodos.length === 0) return null;

  const handleTaskDragStart = (event: DragEvent<HTMLElement>, taskId: number) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(taskId));
    setDraggingTaskId(taskId);
  };

  const handleTaskDragOver = (event: DragEvent<HTMLElement>, task: TodoOut) => {
    if (draggingTaskId === null || draggingTaskId === task.id) return;
    const draggedTask = filteredTodos.find((item) => item.id === draggingTaskId);
    if (!draggedTask || draggedTask.parent_id !== task.parent_id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const position: TaskDropPosition = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
    setDragOverTask({ id: task.id, position });
  };

  const handleTaskDrop = (event: DragEvent<HTMLElement>, task: TodoOut) => {
    event.preventDefault();
    if (draggingTaskId === null || draggingTaskId === task.id) {
      setDraggingTaskId(null);
      setDragOverTask(null);
      return;
    }
    const draggedTask = filteredTodos.find((item) => item.id === draggingTaskId);
    if (!draggedTask || draggedTask.parent_id !== task.parent_id) {
      setDraggingTaskId(null);
      setDragOverTask(null);
      return;
    }
    const siblingIds = filteredTodos
      .filter((item) => item.parent_id === task.parent_id)
      .map((item) => item.id);
    const orderedIds = moveTaskId(siblingIds, draggingTaskId, task.id, dragOverTask?.position ?? 'before');
    if (orderedIds.join(',') !== siblingIds.join(',')) {
      onReorderTasks?.(task.parent_id, orderedIds);
    }
    setDraggingTaskId(null);
    setDragOverTask(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {filteredTodos.map((task) => (
        <Box key={task.id}>
          <TaskItem
            task={task}
            isSelected={selectedTasks.has(task.id)}
            isExpanded={expandedTask === task.id}
            multiSelectMode={multiSelectMode}
            onToggleComplete={() => onToggleComplete(task.id)}
            onToggleSelect={() => onToggleSelect(task.id)}
            onExpand={() => onExpand(task.id)}
            onClick={() => onSelectTask(task.id)}
            onEdit={() => onEditTask?.(task)}
            onDelete={() => onDeleteTask?.(task)}
            onCreateSubTask={() => onCreateSubTask?.(task)}
            dragOverPosition={dragOverTask?.id === task.id ? dragOverTask.position : null}
            onDragStart={(event) => handleTaskDragStart(event, task.id)}
            onDragOver={(event) => handleTaskDragOver(event, task)}
            onDrop={(event) => handleTaskDrop(event, task)}
            onDragEnd={() => { setDraggingTaskId(null); setDragOverTask(null); }}
          />
          {expandedTask === task.id && (
            <TaskDetail
              task={task}
              folders={folders}
              onEdit={() => onEditTask?.(task)}
              onDelete={() => onDeleteTask?.(task)}
              onReorderTasks={onReorderTasks}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
