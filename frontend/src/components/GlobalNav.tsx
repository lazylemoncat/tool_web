'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeMode } from './ThemeRegistry';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'todo', label: '任务', href: '/todo' },
  { key: 'finance', label: '记账', href: '/finance' },
  { key: 'settings', label: '设置', href: '/settings' },
  { key: 'help', label: '帮助', href: '/help' },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default function GlobalNav() {
  const pathname = usePathname();
  const { mode, toggleTheme } = useThemeMode();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const avatarText = (user?.username ?? 'U').slice(0, 1).toUpperCase();

  const activeKey = (() => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/todo')) return 'todo';
    if (pathname.startsWith('/finance')) return 'finance';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/help')) return 'help';
    return '';
  })();

  return (
    <div id="global-nav">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-brand-text">ToolWeb</div>
        </div>

        <div className="topnav-links">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`topnav-link${activeKey === item.key ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="topnav-right">
          <button className="topnav-icon-btn" onClick={toggleTheme} aria-label="切换主题">
            {mode === 'light' ? (
              <Icon><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Icon>
            ) : (
              <Icon><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></Icon>
            )}
          </button>
          <span className="topnav-lang">中文</span>
          <div className="user-menu-wrap">
            <button className="topnav-avatar" onClick={() => setOpen((value) => !value)}>
              {avatarText}
            </button>
            <div className={`user-menu${open ? ' open' : ''}`}>
              <div className="menu-item">
                <Icon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
                {user?.username ?? '我的资料'}
              </div>
              <Link className="menu-item" href="/settings" onClick={() => setOpen(false)}>
                <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.22.49.71.82 1.25.82H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" /></Icon>
                偏好设置
              </Link>
              <Link className="menu-item" href="/help" onClick={() => setOpen(false)}>
                <Icon><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></Icon>
                帮助
              </Link>
              <div className="menu-divider" />
              <button className="menu-item danger" onClick={() => { setOpen(false); void logout(); }}>
                <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
