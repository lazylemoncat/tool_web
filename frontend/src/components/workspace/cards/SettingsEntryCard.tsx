'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CARD_DEFINITIONS } from '../constants';
import { useLayoutActions } from '@/context/LayoutActionsContext';

interface SettingsEntryCardProps {
  isManageMode: boolean;
  onDelete: () => void;
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function SettingsEntryCard({ isManageMode }: SettingsEntryCardProps) {
  const def = CARD_DEFINITIONS.settings;
  const { openSettings } = useLayoutActions();

  return (
    <Box
      onClick={() => {
        if (isManageMode) return;
        openSettings();
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
          bgcolor: 'action.hover',
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <GearIcon />
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
            bgcolor: 'action.hover',
            color: 'text.secondary',
          }}
        >
          功能入口
        </Box>
      </Box>
    </Box>
  );
}
