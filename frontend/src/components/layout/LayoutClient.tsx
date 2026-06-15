'use client';

import { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';
import GlobalNav, { DEFAULT_NAV_ITEMS, type NavItem } from './GlobalNav';
import SettingsDialog from './SettingsDialog';
import NavManageDialog from './NavManageDialog';
import { LayoutActionsContext } from '@/context/LayoutActionsContext';
import type { LayoutActions } from '@/context/LayoutActionsContext';

const NAV_STORAGE_KEY = 'toolweb-nav-items';

function mergeNavItems(saved: unknown): NavItem[] {
  if (!Array.isArray(saved)) return DEFAULT_NAV_ITEMS;

  const savedById = new Map(
    saved
      .filter((item): item is Partial<NavItem> => item && typeof item === 'object')
      .map((item) => [item.id, item]),
  );

  const orderedIds = saved
    .map((item) => (item && typeof item === 'object' ? (item as Partial<NavItem>).id : null))
    .filter((id): id is string => DEFAULT_NAV_ITEMS.some((defaultItem) => defaultItem.id === id));
  const missingIds = DEFAULT_NAV_ITEMS
    .map((item) => item.id)
    .filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...missingIds].map((id) => {
    const defaultItem = DEFAULT_NAV_ITEMS.find((item) => item.id === id)!;
    const savedItem = savedById.get(id);
    return {
      ...defaultItem,
      label: typeof savedItem?.label === 'string' && savedItem.label.trim() ? savedItem.label.trim() : defaultItem.label,
      visible: typeof savedItem?.visible === 'boolean' ? savedItem.visible : defaultItem.visible,
    };
  });
}

function loadNavItems(): NavItem[] {
  if (typeof window === 'undefined') return DEFAULT_NAV_ITEMS;
  try {
    return mergeNavItems(JSON.parse(localStorage.getItem(NAV_STORAGE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_NAV_ITEMS;
  }
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navManageOpen, setNavManageOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(loadNavItems);

  const layoutActions: LayoutActions = useMemo(
    () => ({ openSettings: () => setSettingsOpen(true) }),
    [],
  );

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(navItems));
  }, [navItems]);

  return (
    <LayoutActionsContext.Provider value={layoutActions}>
      {!isAuthPage && (
        <GlobalNav
          navItems={navItems}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenNavManage={() => setNavManageOpen(true)}
        />
      )}
      <Box sx={{ pt: isAuthPage ? 0 : '64px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NavManageDialog
        open={navManageOpen}
        items={navItems}
        onChange={setNavItems}
        onReset={() => setNavItems(DEFAULT_NAV_ITEMS)}
        onClose={() => setNavManageOpen(false)}
      />
    </LayoutActionsContext.Provider>
  );
}
