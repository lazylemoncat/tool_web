'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Collapse from '@mui/material/Collapse';
import type { LedgerOut } from '@/lib/financeTypes';

interface FinanceSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open: boolean;
  onClose: () => void;
  ledgers: LedgerOut[];
  activeLedgerId: number | null;
  onSelectLedger: (id: number) => void;
  onNewLedger: () => void;
}

const NAV_ITEMS: { id: string; label: string; icon: string; badge?: number }[] = [
  { id: 'dashboard', label: '仪表盘', icon: '📊' },
  { id: 'transactions', label: '交易记录', icon: '💳' },
  { id: 'books', label: '账本管理', icon: '📒' },
  { id: 'accounts', label: '账户管理', icon: '🏦' },
  { id: 'categories', label: '分类管理', icon: '🏷' },
  { id: 'tags', label: '标签管理', icon: '🔖' },
  { id: 'budgets', label: '预算管理', icon: '💰' },
  { id: 'events', label: '事件管理', icon: '📅' },
];

export default function FinanceSidebar({
  activeTab, onTabChange, open, onClose,
  ledgers, activeLedgerId, onSelectLedger, onNewLedger,
}: FinanceSidebarProps) {
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);
  const activeLedger = ledgers.find((l) => l.id === activeLedgerId) || ledgers[0] || null;

  const sidebarContent = (
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
      {/* Book Selector */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <Typography
          variant="caption"
          sx={{ px: 1, mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary', fontSize: '0.625rem' }}
        >
          当前账本
        </Typography>
        {activeLedger && (
          <Box
            onClick={() => setBookDropdownOpen(!bookDropdownOpen)}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              bgcolor: 'action.hover', borderRadius: 2, px: 1.5, py: 1, cursor: 'pointer',
              transition: 'background 0.15s',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1rem' }}>{activeLedger.icon || '📒'}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.2 }}>{activeLedger.name}</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{activeLedger.currency}</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', transform: bookDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</Typography>
          </Box>
        )}

        <Collapse in={bookDropdownOpen}>
          <Box sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {ledgers.map((l) => (
              <Box
                key={l.id}
                onClick={() => { onSelectLedger(l.id); setBookDropdownOpen(false); onClose(); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                  fontSize: '0.8125rem', cursor: 'pointer',
                  color: l.id === activeLedgerId ? 'primary.main' : 'text.primary',
                  fontWeight: l.id === activeLedgerId ? 600 : 400,
                  '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography sx={{ fontSize: '0.875rem' }}>{l.icon || '📒'}</Typography>
                <Typography sx={{ fontSize: '0.8125rem', flex: 1 }}>{l.name}</Typography>
                {l.id === activeLedgerId && <Typography sx={{ fontSize: '0.75rem', color: 'primary.main' }}>✓</Typography>}
              </Box>
            ))}
            <Box
              onClick={() => { onNewLedger(); setBookDropdownOpen(false); }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, fontSize: '0.8125rem', color: 'primary.main', fontWeight: 600, borderTop: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
            >
              + 新建账本
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1, py: 0.5, overflowY: 'auto' }}>
        <Typography variant="caption" sx={{ px: 1.5, my: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary', fontSize: '0.625rem' }}>
          导航
        </Typography>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Box
              key={item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, mb: 0.25, borderRadius: 2, cursor: 'pointer',
                fontWeight: isActive ? 600 : 400, color: isActive ? 'primary.main' : 'text.primary',
                bgcolor: isActive ? 'rgba(108,92,231,0.08)' : 'transparent',
                transition: 'all 0.15s', fontSize: '0.8125rem',
                '&:hover': { bgcolor: isActive ? 'rgba(108,92,231,0.08)' : 'action.hover' },
              }}
            >
              <Typography sx={{ fontSize: '1rem' }}>{item.icon}</Typography>
              <Typography sx={{ flex: 1, fontSize: '0.8125rem' }}>{item.label}</Typography>
              {item.badge && (
                <Box sx={{ bgcolor: 'rgba(108,92,231,0.12)', color: 'primary.main', borderRadius: '10px', px: 0.75, py: 0.125, fontSize: '0.625rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                  {item.badge}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="aside" sx={{ width: 240, flexShrink: 0, display: { xs: 'none', md: 'block' }, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        {sidebarContent}
      </Box>
      <SwipeableDrawer anchor="left" open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen
        slotProps={{ paper: { sx: { width: 260, borderRight: '1px solid', borderColor: 'divider' } } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {sidebarContent}
      </SwipeableDrawer>
    </>
  );
}
