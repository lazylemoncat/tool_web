'use client';

// Global top navigation. Provides desktop links, mobile route menu, and account actions.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useThemeCtx } from '@/components/theme/ThemeRegistry';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

interface GlobalNavProps {
  onOpenSettings: () => void;
  onOpenNavManage?: () => void;
  navItems?: NavItem[];
}

export interface NavItem {
  id: string;
  href: string;
  label: string;
  visible: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '/', label: '首页', visible: true },
  { id: 'todo', href: '/todo', label: '任务', visible: true },
  { id: 'calendar', href: '/calendar', label: '日历', visible: true },
  { id: 'finance', href: '/finance', label: '记账', visible: true },
];

export default function GlobalNav({ onOpenSettings, onOpenNavManage, navItems = DEFAULT_NAV_ITEMS }: GlobalNavProps) {
  const { mode, toggle } = useThemeCtx();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);
  const [mobileNavAnchor, setMobileNavAnchor] = useState<null | HTMLElement>(null);
  const visibleNavItems = navItems.filter((item) => item.visible);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    window.location.href = '/login';
  };

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 3 },
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 1, md: 3 } }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem',
          }}
        >
          T
        </Box>
        <Typography variant="h2" sx={{ fontSize: '1.125rem', fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>
          ToolWeb
        </Typography>
      </Box>

      <Tooltip title="导航菜单">
        <IconButton
          size="small"
          onClick={(e) => setMobileNavAnchor(e.currentTarget)}
          sx={{ width: 36, height: 36, color: 'text.secondary', display: { xs: 'inline-flex', md: 'none' }, '&:hover': { bgcolor: 'action.hover' } }}
          aria-label="打开导航菜单"
          aria-controls={mobileNavAnchor ? 'mobile-nav-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={mobileNavAnchor ? 'true' : undefined}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="mobile-nav-menu"
        anchorEl={mobileNavAnchor}
        open={Boolean(mobileNavAnchor)}
        onClose={() => setMobileNavAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {visibleNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <MenuItem
              key={item.href}
              component="a"
              href={item.href}
              selected={active}
              onClick={() => setMobileNavAnchor(null)}
              sx={{ minWidth: 160, fontWeight: active ? 700 : 500 }}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, mr: 'auto' }}>
        {visibleNavItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={isActive(item.href)} />
        ))}
      </Box>

      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      <Tooltip title={mode === 'light' ? '切换深色模式' : '切换浅色模式'}>
        <IconButton size="small" onClick={toggle} sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
          {mode === 'light' ? <MoonIcon /> : <SunIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title="帮助">
        <IconButton size="small" onClick={(e) => setHelpAnchor(e.currentTarget)} sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={helpAnchor} open={Boolean(helpAnchor)} onClose={() => setHelpAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => setHelpAnchor(null)}>功能介绍</MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>快捷键参考</MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>关于 ToolWeb</MenuItem>
      </Menu>

      <Tooltip title="设置">
        <IconButton size="small" onClick={() => onOpenSettings()} sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      {onOpenNavManage && (
        <Tooltip title="导航管理">
          <IconButton size="small" onClick={() => onOpenNavManage()} sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
            <ManageNavIcon />
          </IconButton>
        </Tooltip>
      )}

      <Avatar onClick={(e) => setUserMenuAnchor(e.currentTarget)}
        sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', ml: 0.5 }}>
        {user?.username?.charAt(0)?.toUpperCase() || '?'}
      </Avatar>
      <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem disabled sx={{ opacity: 1, fontWeight: 600, fontSize: '0.875rem' }}>
          {user?.username || '未登录'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setUserMenuAnchor(null); onOpenSettings(); }}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>偏好设置
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>退出登录
        </MenuItem>
      </Menu>
    </Box>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Box component="a" href={href} aria-current={active ? 'page' : undefined} sx={{ px: 1.5, py: 0.75, borderRadius: 2, fontSize: '0.875rem', fontWeight: active ? 600 : 500, color: active ? 'primary.main' : 'text.secondary', bgcolor: active ? 'rgba(108,92,231,0.08)' : 'transparent', textDecoration: 'none', transition: 'all 0.15s', '&:hover': { bgcolor: active ? 'rgba(108,92,231,0.08)' : 'action.hover', color: active ? 'primary.main' : 'text.primary' } }}>
      {label}
    </Box>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ManageNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
