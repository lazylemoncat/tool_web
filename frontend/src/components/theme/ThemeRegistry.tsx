'use client';

import { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/theme';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/zh-cn';

type ThemeMode = 'light' | 'dark';

const ThemeCtx = createContext<{
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}>({
  mode: 'light',
  toggle: () => {},
  setMode: () => {},
});

export const useThemeCtx = () => useContext(ThemeCtx);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('toolweb-theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('toolweb-theme', mode);
  }, [mode, mounted]);

  // SSR/hydration uses 'light' to match server HTML.
  // Client switches to saved theme after useEffect fires (post-hydration).
  const activeMode = mounted ? mode : 'light';
  const theme = useMemo(() => createAppTheme(activeMode), [activeMode]);

  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeCtx.Provider value={{ mode: activeMode, toggle, setMode }}>
      <ThemeProvider theme={theme} defaultMode={activeMode}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
