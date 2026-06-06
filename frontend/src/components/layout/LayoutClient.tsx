'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';
import GlobalNav from './GlobalNav';
import SettingsDialog from './SettingsDialog';
import NavManageDialog from './NavManageDialog';
import { LayoutActionsContext } from '@/context/LayoutActionsContext';
import type { LayoutActions } from '@/context/LayoutActionsContext';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navManageOpen, setNavManageOpen] = useState(false);

  const layoutActions: LayoutActions = useMemo(
    () => ({ openSettings: () => setSettingsOpen(true) }),
    [],
  );

  return (
    <LayoutActionsContext.Provider value={layoutActions}>
      {!isAuthPage && (
        <GlobalNav
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenNavManage={() => setNavManageOpen(true)}
        />
      )}
      <Box sx={{ pt: isAuthPage ? 0 : '64px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NavManageDialog open={navManageOpen} onClose={() => setNavManageOpen(false)} />
    </LayoutActionsContext.Provider>
  );
}
