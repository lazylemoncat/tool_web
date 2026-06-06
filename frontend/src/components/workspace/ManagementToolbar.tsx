'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

interface ManagementToolbarProps {
  onAddCard: () => void;
  onExitManage: () => void;
}

export default function ManagementToolbar({ onAddCard, onExitManage }: ManagementToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        maxWidth: 1200,
        mx: 'auto',
        mb: 2,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'primary.main',
          bgcolor: 'rgba(108,92,231,0.08)',
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
        }}
      >
        编辑模式
      </Box>
      <Button
        onClick={onAddCard}
        size="small"
        sx={{
          borderRadius: 999,
          border: '1.5px solid',
          borderColor: 'divider',
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'none',
          px: 2,
          '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
        }}
      >
        + 添加卡片
      </Button>
      <Button
        onClick={onExitManage}
        size="small"
        sx={{
          borderRadius: 999,
          bgcolor: 'primary.main',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'none',
          px: 2,
          '&:hover': { bgcolor: '#5A4DE0' },
        }}
      >
        退出管理模式
      </Button>
    </Box>
  );
}
