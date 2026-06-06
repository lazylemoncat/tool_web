'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import type { KanbanTaskOut, KanbanColumnData, FieldDef } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FFDAD6', P1: '#FFE0B2', P2: '#FFF8E1', P3: '#F3EDF7',
};

interface KanbanTaskDrawerProps {
  open: boolean;
  task: KanbanTaskOut | null;
  columns: KanbanColumnData[];
  fields: FieldDef[];
  onClose: () => void;
  onMove: (taskId: number, toColId: number) => void;
  onDelete: (taskId: number) => void;
  onEdit?: (task: KanbanTaskOut) => void;
}

export default function KanbanTaskDrawer({
  open, task, columns, fields, onClose, onMove, onDelete, onEdit,
}: KanbanTaskDrawerProps) {
  if (!task) return null;

  const detailFields = [...fields].sort((a, b) => a.order - b.order);

  const getFieldValue = (field: FieldDef): string | null => {
    if (field.system) {
      return (task as unknown as Record<string, unknown>)[field.key] as string ?? null;
    }
    return (task.custom_fields as Record<string, unknown>)?.[field.key] as string ?? null;
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
        {/* Basic info - all detail fields */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.06, mb: 1, display: 'block' }}>
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
            {task.version && <Chip label={task.version} size="small" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', bgcolor: '#EDE7F0' }} />}
          </Box>
          {detailFields.filter(f => f.show_in_detail && !['title', 'priority', 'task_type', 'version'].includes(f.key)).map(f => {
            const val = getFieldValue(f);
            if (!val) return null;
            return (
              <Box key={f.key} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>{f.label}</Typography>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1, borderRadius: 1,
                  border: '1px solid', borderColor: 'divider',
                }}>
                  {val}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Edit & Delete */}
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
