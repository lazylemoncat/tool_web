'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';

export type FocusTab = 'timer' | 'overview' | 'records' | 'tags';

interface FocusSidebarProps {
  activeTab: FocusTab;
  open: boolean;
  onClose: () => void;
  onTabChange: (tab: FocusTab) => void;
}

const NAV_ITEMS: { id: FocusTab; label: string; icon: React.ReactNode }[] = [
  { id: 'timer', label: '计时', icon: <TimerRoundedIcon fontSize="small" /> },
  { id: 'overview', label: '数据总览', icon: <InsightsRoundedIcon fontSize="small" /> },
  { id: 'records', label: '记录', icon: <ListAltRoundedIcon fontSize="small" /> },
  { id: 'tags', label: '标签', icon: <LocalOfferRoundedIcon fontSize="small" /> },
];

export default function FocusSidebar({
  activeTab,
  open,
  onClose,
  onTabChange,
}: FocusSidebarProps) {
  const content = (
    <Box
      sx={{
        width: 240,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: { xs: 'none', md: '1px solid' },
        borderColor: 'divider',
      }}
    >
      <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', mb: 0.75 }}>
          FOCUS
        </Typography>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
          番茄钟
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
          计时, 归档, 复盘
        </Typography>
      </Box>

      <Box sx={{ flex: 1, px: 1, py: 1.25 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Box
              key={item.id}
              onClick={() => { onTabChange(item.id); onClose(); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                mb: 0.25,
                borderRadius: 2,
                cursor: 'pointer',
                color: isActive ? 'primary.main' : 'text.primary',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8125rem',
                transition: 'background 0.15s, color 0.15s',
                '&:hover': { bgcolor: isActive ? 'action.selected' : 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', color: isActive ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </Box>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 'inherit' }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="aside" sx={{ width: 240, flexShrink: 0, display: { xs: 'none', md: 'block' }, height: 'calc(100vh - 64px)' }}>
        {content}
      </Box>
      <SwipeableDrawer
        anchor="left"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        slotProps={{ paper: { sx: { width: 260, borderRight: '1px solid', borderColor: 'divider' } } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {content}
      </SwipeableDrawer>
    </>
  );
}
