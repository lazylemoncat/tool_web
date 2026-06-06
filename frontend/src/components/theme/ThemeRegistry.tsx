'use client';

import {
  useMemo,
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/theme';
import { useI18n } from '@/context/I18nContext';
import type { Locale } from '@/i18n/messages';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

export const themeModes = ['light', 'dark'] as const;
export const themePreferences = ['system', ...themeModes] as const;

export type ThemeMode = (typeof themeModes)[number];
export type ThemePreference = (typeof themePreferences)[number];

const THEME_STORAGE_KEY = 'toolweb-theme';
const THEME_CHANGED_EVENT = 'toolweb-theme-change';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
const dateAdapterLocales: Record<Locale, string> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
};

const ThemeCtx = createContext<{
  mode: ThemeMode;
  preference: ThemePreference;
  toggle: () => void;
  setMode: (m: ThemePreference) => void;
}>({
  mode: 'light',
  preference: 'system',
  toggle: () => {},
  setMode: () => {},
});

export const useThemeCtx = () => useContext(ThemeCtx);

function isThemePreference(value: string | null): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

function getThemePreferenceSnapshot(): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_THEME_PREFERENCE;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(saved) ? saved : DEFAULT_THEME_PREFERENCE;
}

function getServerThemePreferenceSnapshot(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE;
}

function getSystemThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

function getServerSystemThemeSnapshot(): ThemeMode {
  return 'light';
}

function subscribeThemePreference(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_CHANGED_EVENT, onStoreChange);
  };
}

function subscribeSystemTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  const media = window.matchMedia(SYSTEM_THEME_QUERY);
  if (media.addEventListener) {
    media.addEventListener('change', onStoreChange);
    return () => media.removeEventListener('change', onStoreChange);
  }

  media.addListener(onStoreChange);
  return () => media.removeListener(onStoreChange);
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeThemePreference,
    getThemePreferenceSnapshot,
    getServerThemePreferenceSnapshot,
  );
  const systemMode = useSyncExternalStore<ThemeMode>(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot,
  );
  const mode = preference === 'system' ? systemMode : preference;

  const adapterLocale = dateAdapterLocales[language];
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const setMode = useCallback((nextPreference: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  return (
    <ThemeCtx.Provider value={{ mode, preference, toggle, setMode }}>
      <ThemeProvider theme={theme} defaultMode={mode}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
