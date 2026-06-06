'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface WorkspaceHeaderProps {
  isManageMode: boolean;
  onToggleManage: () => void;
}

export default function WorkspaceHeader({ isManageMode, onToggleManage }: WorkspaceHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        maxWidth: 1200,
        mx: 'auto',
        mb: 3,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box>
        <Typography
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.375rem', sm: '1.625rem' },
            color: 'text.primary',
            letterSpacing: '-0.5px',
            mb: 0.5,
          }}
        >
          工作台
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          一站式管理任务与记账
        </Typography>
      </Box>

      {/* 管理模式 pill 切换按钮 */}
      <Box
        component="button"
        onClick={onToggleManage}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 2,
          py: 0.75,
          borderRadius: 999,
          border: '1.5px solid',
          borderColor: isManageMode ? 'primary.main' : 'divider',
          bgcolor: isManageMode ? 'rgba(108,92,231,0.08)' : 'background.paper',
          color: isManageMode ? 'primary.main' : 'text.secondary',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
          '&:hover': {
            borderColor: 'primary.main',
            color: isManageMode ? 'primary.main' : 'primary.main',
          },
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {isManageMode ? '完成' : '管理模式'}
      </Box>
    </Box>
  );
}
