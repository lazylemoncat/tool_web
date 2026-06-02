'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';
import GlobalNav from './GlobalNav';
import SettingsDialog from './SettingsDialog';
import NavManageDialog from './NavManageDialog';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navManageOpen, setNavManageOpen] = useState(false);

  return (
    <>
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
    </>
  );
}
