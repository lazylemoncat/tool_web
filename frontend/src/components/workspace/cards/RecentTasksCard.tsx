'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { TodoOut } from '@/lib/types';
import { PRIORITY_LABEL } from '@/lib/types';
import { CARD_DEFINITIONS } from '../constants';

interface RecentTasksCardProps {
  tasks: TodoOut[];
  loading: boolean;
  isManageMode: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#FFA726',
  3: '#9CA3AF',
};

export default function RecentTasksCard({
  tasks,
  isManageMode,
  onClick,
}: RecentTasksCardProps) {
  const def = CARD_DEFINITIONS.recent;
  const displayTasks = tasks.filter((t) => !t.is_completed).slice(0, 5);

  return (
    <Box
      component="a"
      onClick={(e: React.MouseEvent) => {
        if (isManageMode) { e.preventDefault(); return; }
        onClick();
      }}
      href="/todo"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1.5px solid',
        borderColor: isManageMode ? 'primary.main' : 'divider',
        p: 2.5,
        cursor: isManageMode ? 'default' : 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        },
      }}
    >
      {/* 图标 */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: def.iconBg,
          color: def.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <ListIcon />
      </Box>

      {/* 标题 */}
      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', mb: 0.5 }}>
        {def.label}
      </Typography>

      {/* 描述 */}
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.25, lineHeight: 1.5 }}>
        {def.description}
      </Typography>

      {/* 任务列表 */}
      {displayTasks.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {displayTasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
              }}
            >
              {/* 优先级圆点 */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: PRIORITY_COLORS[task.priority] || '#9CA3AF',
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {task.title}
              </Typography>
              {/* 优先级标签 */}
              <Typography
                sx={{
                  fontSize: '0.625rem',
                  color: PRIORITY_COLORS[task.priority] || '#9CA3AF',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {PRIORITY_LABEL[task.priority] || ''}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mt: 1 }}>
          暂无待处理的任务
        </Typography>
      )}

      {/* 查看全部 */}
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          查看全部 →
        </Typography>
      </Box>
    </Box>
  );
}
