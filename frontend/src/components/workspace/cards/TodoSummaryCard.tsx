'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CARD_DEFINITIONS } from '../constants';

interface TodoSummaryCardProps {
  todoCount: number | null;
  activeCount: number | null;
  isManageMode: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function TodoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export default function TodoSummaryCard({
  todoCount,
  activeCount,
  isManageMode,
  onClick,
}: TodoSummaryCardProps) {
  const def = CARD_DEFINITIONS.todo;
  const hasData = todoCount !== null;

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
        <TodoIcon />
      </Box>

      {/* 标题 */}
      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', mb: 0.5 }}>
        {def.label}
      </Typography>

      {/* 描述 */}
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
        {def.description}
      </Typography>

      {/* 统计标签 */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
        {hasData ? (
          <>
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: 'rgba(108,92,231,0.08)',
                color: 'primary.main',
              }}
            >
              {todoCount} 个待办
            </Box>
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: '#D1FAE5',
                color: '#065F46',
              }}
            >
              {activeCount} 个活跃
            </Box>
          </>
        ) : (
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.375,
              borderRadius: 999,
              fontSize: '0.6875rem',
              fontWeight: 600,
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            前往 TODO
          </Box>
        )}
      </Box>
    </Box>
  );
}
