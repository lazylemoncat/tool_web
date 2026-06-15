'use client';

import { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { KanbanTaskOut, KanbanColumnData, FieldDef } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FFDAD6', P1: '#FFE0B2', P2: '#FFF8E1', P3: '#F3EDF7',
};

export interface KanbanSubtask {
  id: string;
  title: string;
  completed: boolean;
}

interface KanbanTaskDrawerProps {
  open: boolean;
  task: KanbanTaskOut | null;
  columns: KanbanColumnData[];
  fields: FieldDef[];
  onClose: () => void;
  onMove: (taskId: number, toColId: number) => void;
  onDelete: (taskId: number) => void;
  onEdit?: (task: KanbanTaskOut) => void;
  onAddSubtask?: (task: KanbanTaskOut, title: string) => void;
  onToggleSubtask?: (task: KanbanTaskOut, subtaskId: string) => void;
}

export function getKanbanSubtasks(task: KanbanTaskOut): KanbanSubtask[] {
  const raw = (task.custom_fields as Record<string, unknown> | null)?.__subtasks;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is KanbanSubtask => (
    typeof item === 'object'
    && item !== null
    && typeof (item as KanbanSubtask).id === 'string'
    && typeof (item as KanbanSubtask).title === 'string'
    && typeof (item as KanbanSubtask).completed === 'boolean'
  ));
}

export default function KanbanTaskDrawer({
  open, task, fields, onClose, onDelete, onEdit, onAddSubtask, onToggleSubtask,
}: KanbanTaskDrawerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  if (!task) return null;

  const detailFields = [...fields].sort((a, b) => a.order - b.order);
  const subtasks = getKanbanSubtasks(task);

  const getFieldValue = (field: FieldDef): string | null => {
    if (field.system) {
      return (task as unknown as Record<string, unknown>)[field.key] as string ?? null;
    }
    return (task.custom_fields as Record<string, unknown>)?.[field.key] as string ?? null;
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;
    onAddSubtask(task, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: '90vw' } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
            基本信息
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {task.priority && (
              <Chip label={task.priority} size="small" sx={{
                bgcolor: PRIORITY_COLORS[task.priority] || '#F3EDF7',
                fontWeight: 600, fontSize: '0.7rem',
              }} />
            )}
            {task.task_type && <Chip label={task.task_type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
            {task.version && <Chip label={task.version} size="small" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', bgcolor: 'action.hover' }} />}
          </Box>
          {detailFields.filter((field) => field.show_in_detail && !['title', 'priority', 'task_type', 'version'].includes(field.key)).map((field) => {
            const value = getFieldValue(field);
            if (!value) return null;
            return (
              <Box key={field.key} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>{field.label}</Typography>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1, borderRadius: 1,
                  border: '1px solid', borderColor: 'divider',
                }}>
                  {value}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
            子任务
          </Typography>
          {subtasks.map((subtask) => (
            <Box key={subtask.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
              <Checkbox
                size="small"
                checked={subtask.completed}
                onChange={() => onToggleSubtask?.(task, subtask.id)}
                sx={{ p: 0.25 }}
              />
              <Typography variant="body2" sx={{ textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'text.secondary' : 'text.primary' }}>
                {subtask.title}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="新增子任务"
              value={newSubtaskTitle}
              onChange={(event) => setNewSubtaskTitle(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') handleAddSubtask(); }}
            />
            <IconButton size="small" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEdit && (
            <Button size="small" variant="outlined" onClick={() => onEdit(task)} sx={{ fontSize: '0.75rem' }}>
              编辑
            </Button>
          )}
          <Button color="error" size="small" onClick={() => onDelete(task.id)} sx={{ fontSize: '0.75rem' }}>
            删除任务
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
