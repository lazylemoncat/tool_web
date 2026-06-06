'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CARD_DEFINITIONS } from '../constants';

interface HelpEntryCardProps {
  isManageMode: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function QuestionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function HelpEntryCard({ isManageMode, onClick }: HelpEntryCardProps) {
  const def = CARD_DEFINITIONS.help;

  return (
    <Box
      onClick={() => {
        if (isManageMode) return;
        onClick();
      }}
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
        <QuestionIcon />
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', mb: 0.5 }}>
        {def.label}
      </Typography>

      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
        {def.description}
      </Typography>

      <Box sx={{ mt: 'auto' }}>
        <Box
          component="span"
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
          了解更多
        </Box>
      </Box>
    </Box>
  );
}
