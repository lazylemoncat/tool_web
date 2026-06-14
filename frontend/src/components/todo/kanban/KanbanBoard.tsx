'use client';

import { useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import KanbanColumn from './KanbanColumn';
import type { KanbanColumnData, KanbanTaskOut, FieldDef } from '@/lib/types';

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  tasks: KanbanTaskOut[];
  fields: FieldDef[];
  onTaskClick: (task: KanbanTaskOut) => void;
  onConfirm: (task: KanbanTaskOut, fromColId: number) => void;
  onMoveTask: (taskId: number, fromColId: number, toColId: number) => void;
  onNewTask?: (colId: number) => void;
}

export default function KanbanBoard({
  columns, tasks, fields, onTaskClick, onConfirm, onMoveTask, onNewTask,
}: KanbanBoardProps) {
  const dragRef = useRef<{ taskId: number; fromColId: number } | null>(null);

  const handleDragStart = useCallback((taskId: number, fromColId: number) => {
    dragRef.current = { taskId, fromColId };
  }, []);

  const handleDrop = useCallback((toColId: number) => {
    if (dragRef.current) {
      onMoveTask(dragRef.current.taskId, dragRef.current.fromColId, toColId);
      dragRef.current = null;
    }
  }, [onMoveTask]);

  const sorted = [...columns].sort((a, b) => a.sort_order - b.sort_order);
  const lastColId = sorted[sorted.length - 1]?.id;

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, overflowX: 'scroll', flex: 1,
      pb: 2.5, minHeight: 0,
      scrollbarWidth: 'auto',
      scrollbarColor: 'var(--mui-palette-text-disabled) var(--mui-palette-background-default)',
      '&::-webkit-scrollbar': { height: 20 },
      '&::-webkit-scrollbar-track': { bgcolor: 'background.default', borderRadius: 10 },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: 'text.disabled',
        borderRadius: 10,
        border: '4px solid',
        borderColor: 'background.default',
      },
      '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'text.secondary' },
    }}>
      {sorted.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          tasks={col.id === -1 ? tasks.filter(t => t.column_id === null) : tasks.filter(t => t.column_id === col.id)}
          fields={fields}
          isLastColumn={col.id === lastColId}
          onTaskClick={onTaskClick}
          onConfirm={onConfirm}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onNewTask={onNewTask}
        />
      ))}
    </Box>
  );
}
