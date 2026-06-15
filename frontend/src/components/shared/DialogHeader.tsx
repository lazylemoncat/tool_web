'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

interface DialogHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  sx?: SxProps<Theme>;
}

export default function DialogHeader({
  title,
  icon,
  onClose,
  closeLabel = '关闭',
  sx,
}: DialogHeaderProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          px: 3,
          py: 2.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        {icon ? (
          <Box
            component="span"
            aria-hidden
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Typography variant="h2" sx={{ fontSize: '1.125rem', fontWeight: 700, color: 'text.primary' }}>
          {title}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} aria-label={closeLabel} sx={{ color: 'text.secondary' }}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
