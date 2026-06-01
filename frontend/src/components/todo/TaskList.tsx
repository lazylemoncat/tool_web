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
  folders?: FolderOut[];
}

export default function TaskList({
  filteredTodos, selectedTasks, expandedTask, multiSelectMode,
  onToggleComplete, onToggleSelect, onExpand, onSelectTask,
  onEditTask, onDeleteTask, onCreateSubTask, folders,
}: TaskListProps) {
  if (filteredTodos.length === 0) return null;

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
          />
          {expandedTask === task.id && <TaskDetail task={task} folders={folders} onEdit={() => onEditTask?.(task)} onDelete={() => onDeleteTask?.(task)} />}
        </Box>
      ))}
    </Box>
  );
}
