'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { KanbanTaskOut, FieldDef } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FFDAD6', P1: '#FFE0B2', P2: '#FFF8E1', P3: '#F3EDF7',
};
const PRIORITY_TEXT: Record<string, string> = {
  P0: '#410002', P1: '#5E3C00', P2: '#5E5200', P3: '#49454F',
};
const TYPE_COLORS: Record<string, string> = {
  feature: '#DCE8FF', bug: '#FFDAD6', chore: '#F3EDF7',
  refactor: '#E8DEF8', docs: '#D9F2DA', test: '#C6F0F0',
};

interface KanbanCardProps {
  task: KanbanTaskOut;
  fields: FieldDef[];
  isLastColumn: boolean;
  onClick: () => void;
  onConfirm: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDraggable?: boolean;
}

export default function KanbanCard({
  task, fields, isLastColumn, onClick, onConfirm,
  onDragStart, isDraggable = true,
}: KanbanCardProps) {
  const cardFields = fields
    .filter(f => f.show_on_card && f.key !== 'title')
    .sort((a, b) => a.order - b.order);

  const getFieldValue = (field: FieldDef): string | null => {
    if (field.system) {
      return (task as unknown as Record<string, unknown>)[field.key] as string ?? null;
    }
    return (task.custom_fields as Record<string, unknown>)?.[field.key] as string ?? null;
  };

  return (
    <Box
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onClick}
      sx={{
        bgcolor: 'background.paper', borderRadius: 2, border: '1px solid',
        borderColor: 'divider', p: 1.5, cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 1, transform: 'translateY(-1px)' },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Chip row: priority + type + version */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
        {task.priority && (
          <Chip label={task.priority} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 600,
            bgcolor: PRIORITY_COLORS[task.priority] || '#F3EDF7',
            color: PRIORITY_TEXT[task.priority] || '#49454F',
            '& .MuiChip-label': { px: 0.75 },
          }} />
        )}
        {task.task_type && (
          <Chip label={task.task_type} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 500,
            bgcolor: TYPE_COLORS[task.task_type] || '#F3EDF7',
            color: '#1D1B20', '& .MuiChip-label': { px: 0.75 },
          }} />
        )}
        {task.version && (
          <Chip label={task.version} size="small" sx={{
            height: 20, fontSize: '0.6rem', fontWeight: 500,
            bgcolor: 'action.hover', fontFamily: 'monospace',
            '& .MuiChip-label': { px: 0.5 },
          }} />
        )}
      </Box>

      {/* Title */}
      <Typography variant="body2" sx={{
        fontWeight: 500, fontSize: '0.8125rem', mb: 0.5,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {task.title}
      </Typography>

      {/* Other card fields (e.g., story_point, module) */}
      {cardFields.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
          {cardFields.map(f => {
            const val = getFieldValue(f);
            return val ? (
              <Chip key={f.key} label={`${f.label}: ${val}`} size="small" variant="outlined"
                sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
            ) : null;
          })}
        </Box>
      )}

      {/* Confirm button */}
      {!isLastColumn && (
        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small" variant="contained" fullWidth
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            sx={{
              height: 28, fontSize: '0.7rem', fontWeight: 600,
              borderRadius: 2, bgcolor: '#6750A4',
              '&:hover': { bgcolor: '#5A4292' },
            }}
          >
            确认 →
          </Button>
        </Box>
      )}
    </Box>
  );
}
