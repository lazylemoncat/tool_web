'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import KanbanCard from './KanbanCard';
import type { KanbanColumnData, KanbanTaskOut, FieldDef } from '@/lib/types';

interface KanbanColumnProps {
  column: KanbanColumnData;
  tasks: KanbanTaskOut[];
  fields: FieldDef[];
  isLastColumn: boolean;
  onTaskClick: (task: KanbanTaskOut) => void;
  onConfirm: (task: KanbanTaskOut, fromColId: number) => void;
  onDrop: (colId: number) => void;
  onDragStart: (taskId: number, fromColId: number) => void;
  onNewTask?: (colId: number) => void;
}

export default function KanbanColumn({
  column, tasks, fields, isLastColumn, onTaskClick, onConfirm,
  onDrop, onDragStart, onNewTask,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const isFirstColumn = column.sort_order === 0;
  const capBar = column.capacity != null ? `${tasks.length}/${column.capacity}` : null;

  return (
    <Box sx={{
      minWidth: 280, maxWidth: 300,
      display: 'flex', flexDirection: 'column',
      bgcolor: 'background.paper', borderRadius: 2,
      borderTop: 3, borderColor: column.color || '#6750A4',
      ...(dragOver ? { bgcolor: 'action.selected' } : {}),
    }}
      onDragOver={column.id !== -1 ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
      onDragLeave={column.id !== -1 ? () => setDragOver(false) : undefined}
      onDrop={column.id !== -1 ? (e) => { e.preventDefault(); setDragOver(false); onDrop(column.id); } : undefined}
    >
      {/* Column header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 1.5, py: 1,
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', flex: 1 }}>
          {column.name}
        </Typography>
        {capBar && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            {capBar}
          </Typography>
        )}
        {isFirstColumn && onNewTask && (
          <IconButton size="small" onClick={() => onNewTask(column.id)}
            sx={{ p: 0.25, color: 'primary.main', fontSize: '1rem' }}>
            +
          </IconButton>
        )}
      </Box>

      {/* Card list */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 1.5, pb: 1,
        display: 'flex', flexDirection: 'column', gap: 1,
        minHeight: 80,
      }}>
        {tasks.length === 0 ? (
          <Box sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed', borderColor: 'divider', borderRadius: 2,
            minHeight: 60,
          }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>暂无任务</Typography>
          </Box>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              fields={fields}
              isLastColumn={isLastColumn}
              onClick={() => onTaskClick(task)}
              onConfirm={() => onConfirm(task, column.id)}
              onDragStart={() => onDragStart(task.id, column.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
