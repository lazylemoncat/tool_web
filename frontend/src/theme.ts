'use client';

import { createTheme } from '@mui/material/styles';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// Mirror ToolWeb Material Design 3 tokens
const lightPalette = {
  primary: { main: '#6442D6', light: '#8B6FE8', dark: '#4C2DAB' },
  secondary: { main: '#C8B3FD', light: '#DDD0FE', dark: '#A98DE8' },
  error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
  warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
  success: { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
  info: { main: '#1A73E8', light: '#4285F4', dark: '#1557B0' },
  background: {
    default: '#f8fafd',
    paper: '#ffffff',
  },
  text: {
    primary: '#202124',
    secondary: '#5f6368',
  },
  divider: '#dadce0',
};

const darkPalette = {
  primary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C3AED' },
  secondary: { main: '#8B6FE8', light: '#A78BFA', dark: '#6D28D9' },
  error: { main: '#F87171', light: '#FCA5A5', dark: '#DC2626' },
  warning: { main: '#FBBF24', light: '#FCD34D', dark: '#D97706' },
  success: { main: '#4ADE80', light: '#86EFAC', dark: '#16A34A' },
  info: { main: '#60A5FA', light: '#93C5FD', dark: '#2563EB' },
  background: {
    default: '#0f1118',
    paper: '#1a1d27',
  },
  text: {
    primary: '#e8eaed',
    secondary: '#9aa0a6',
  },
  divider: '#2d3140',
};

export function getTheme(mode: 'light' | 'dark' | 'matcha') {
  const palette = mode === 'dark' ? darkPalette :
    mode === 'matcha' ? matchaPalette : lightPalette;

  return createTheme({
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light',
      ...palette,
    },
    typography: {
      fontFamily: `${plusJakarta.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.5 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 20px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': { borderRadius: 12 },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: '1px solid',
          },
        },
      },
    },
  });
}

// Matcha theme — soft green palette
const matchaPalette = {
  primary: { main: '#6B8E5A', light: '#8FAD7A', dark: '#4A6D3C' },
  secondary: { main: '#A3B899', light: '#C5D4BC', dark: '#7E9A6E' },
  error: { main: '#D9756B', light: '#E89990', dark: '#C0554A' },
  warning: { main: '#D9A85B', light: '#E8C480', dark: '#C08A3A' },
  success: { main: '#5A8F5A', light: '#7EAD7E', dark: '#3D6D3D' },
  info: { main: '#5A8F8F', light: '#7EADAD', dark: '#3D6D6D' },
  background: {
    default: '#f5f3ee',
    paper: '#faf9f5',
  },
  text: {
    primary: '#2d3028',
    secondary: '#6b6e63',
  },
  divider: '#d8d5c8',
};
