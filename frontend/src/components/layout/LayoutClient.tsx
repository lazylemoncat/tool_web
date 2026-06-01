'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import GlobalNav from './GlobalNav';
import SettingsDialog from './SettingsDialog';
import NavManageDialog from './NavManageDialog';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navManageOpen, setNavManageOpen] = useState(false);

  return (
    <>
      <GlobalNav
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNavManage={() => setNavManageOpen(true)}
      />
      <Box sx={{ pt: '64px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NavManageDialog open={navManageOpen} onClose={() => setNavManageOpen(false)} />
    </>
  );
}
