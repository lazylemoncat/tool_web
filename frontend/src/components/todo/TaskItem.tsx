import { useState } from 'react';
import type { DragEventHandler } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PriorityDot from '@/components/shared/PriorityDot';
import type { TodoOut } from '@/lib/types';
import dayjs from 'dayjs';

interface TaskItemProps {
  task: TodoOut;
  isSelected: boolean;
  isExpanded: boolean;
  multiSelectMode: boolean;
  onToggleComplete: () => void;
  onToggleSelect: () => void;
  onExpand: () => void;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreateSubTask?: () => void;
  dragOverPosition?: 'before' | 'after' | null;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
}

function RoundCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <Checkbox checked={checked} onChange={(e) => { e.stopPropagation(); onChange(); }}
      icon={<Box sx={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid oklch(82% 0.01 275)', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main' } }} />}
      checkedIcon={<Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
        '&::after': { content: '""', width: 8, height: 4, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translateY(-0.5px)' },
      }} />}
      sx={{ p: 0 }}
    />
  );
}

export default function TaskItem({
  task, isSelected, isExpanded, multiSelectMode,
  onToggleComplete, onToggleSelect, onExpand, onClick,
  onEdit, onDelete, onCreateSubTask,
  dragOverPosition = null, onDragStart, onDragOver, onDrop, onDragEnd,
}: TaskItemProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const isOverdue = task.due_date ? dayjs(task.due_date).isBefore(dayjs(), 'day') && !task.is_completed : false;
  const childCount = task.children?.length ?? 0;
  const doneChildCount = task.children?.filter(c => c.is_completed).length ?? 0;

  return (
    <>
      <Box
        onClick={() => (multiSelectMode ? onToggleSelect() : onClick())}
        onDragOver={onDragOver}
        onDrop={onDrop}
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.75, bgcolor: 'background.paper', borderRadius: 3, border: '1.5px solid transparent', transition: 'all 0.15s', cursor: 'pointer',
          position: 'relative', opacity: task.is_completed ? 0.6 : 1,
          ...(isSelected && { borderColor: 'primary.main', bgcolor: 'oklch(90% 0.08 285)' }),
          ...(dragOverPosition === 'before' ? { borderTopColor: 'primary.main' } : {}),
          ...(dragOverPosition === 'after' ? { borderBottomColor: 'primary.main' } : {}),
          '&:hover': { borderColor: isSelected ? 'primary.main' : 'oklch(88% 0.01 275)', boxShadow: '0 1px 3px oklch(0% 0 0 / 0.08)' },
      }}>
        <Box
          component="span"
          draggable={Boolean(onDragStart)}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onClick={(e) => e.stopPropagation()}
          sx={{ width: 20, height: 20, flexShrink: 0, color: 'oklch(82% 0.01 275)', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25, cursor: onDragStart ? 'grab' : 'default', '&:active': { cursor: onDragStart ? 'grabbing' : 'default' } }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
          </svg>
        </Box>

        <Box sx={{ mt: 0.25 }}><RoundCheckbox checked={task.is_completed} onChange={onToggleComplete} /></Box>

        {isOverdue && (
          <Box component="span" sx={{ mt: 0.75, flexShrink: 0, color: 'error.main' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </Box>
        )}

        <Box sx={{ mt: 0.75 }}><PriorityDot priority={task.priority} /></Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, mb: 0.5, textDecoration: task.is_completed ? 'line-through' : 'none', color: task.is_completed ? 'text.secondary' : 'text.primary' }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {task.due_date && (
              <Chip label={task.due_date} size="small"
                sx={{ fontSize: '0.6875rem', fontWeight: 500, borderRadius: '999px', bgcolor: isOverdue ? 'oklch(95% 0.08 25)' : 'action.hover', color: isOverdue ? 'oklch(30% 0.12 25)' : 'text.secondary', height: 22 }} />
            )}
            {task.tags?.map((tag) => (
              <Chip key={tag.id} label={`#${tag.name}`} size="small"
                sx={{ fontSize: '0.6875rem', fontWeight: 500, borderRadius: '999px', bgcolor: 'oklch(92% 0.06 300)', color: 'oklch(22% 0.08 300)', height: 22 }} />
            ))}
            {childCount > 0 && (
              <Chip icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>} label={`${doneChildCount}/${childCount}`} size="small"
                sx={{ fontSize: '0.6875rem', fontWeight: 500, borderRadius: '999px', bgcolor: 'action.hover', color: 'text.secondary', height: 22, '& .MuiChip-icon': { mx: 0, ml: 0.5, color: 'inherit' } }} />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, mt: 0.25 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExpand(); }} aria-label={isExpanded ? '收起详情' : '展开详情'}
            sx={{ width: 32, height: 32, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transformOrigin: 'center', transition: 'transform 0.2s' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </IconButton>
          <IconButton size="small" aria-label="添加子任务" onClick={(e) => { e.stopPropagation(); onCreateSubTask?.(); }}
            sx={{ width: 32, height: 32, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </IconButton>
          <IconButton size="small" aria-label="更多" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            sx={{ width: 32, height: 32, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </IconButton>
        </Box>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => { setMenuAnchor(null); onEdit?.(); }}>
          <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>✏️</Box>编辑
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onDelete?.(); }} sx={{ color: 'error.main' }}>
          <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>🗑️</Box>删除
        </MenuItem>
      </Menu>
    </>
  );
}
