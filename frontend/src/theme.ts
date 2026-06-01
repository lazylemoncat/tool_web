'use client';

import { createTheme, type ThemeOptions } from '@mui/material/styles';

const shared: ThemeOptions = {
  cssVariables: true,
  spacing: 6,
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: 14,
    h1: { fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontSize: '1.125rem', fontWeight: 700 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { transition: 'background-color 0.3s, color 0.3s' },
        '#__next': { height: '100%' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)' },
        backdrop: { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.40)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.6875rem', fontWeight: 500, height: 'auto', padding: '1px 6px' },
        label: { padding: '0 2px' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 28, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)' } },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, fontSize: '0.875rem',
            '& fieldset': { borderColor: '#CDCBD5', borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: '#CDCBD5' },
            '&.Mui-focused fieldset': { borderColor: '#6C5CE7', borderWidth: '1.5px', boxShadow: '0 0 0 3px #E8E0FF' },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { gap: 0, border: '1.5px solid #CDCBD5', borderRadius: 28, overflow: 'hidden', backgroundColor: '#FCFCFE' },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none', borderRight: '1px solid #CDCBD5', borderRadius: 0, padding: '0 14px',
          fontSize: '0.8125rem', fontWeight: 500, color: '#636068', textTransform: 'none',
          '&:last-child': { borderRight: 'none' },
          '&:hover': { backgroundColor: '#EDECF2' },
          '&.Mui-selected': { backgroundColor: '#E8E0FF', color: '#2D1F5E', fontWeight: 600, '&:hover': { backgroundColor: '#E8E0FF' } },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: { root: { padding: 0, '&.Mui-checked': { color: '#6C5CE7' } } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: '1px solid', borderColor: 'divider' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, margin: '1px 8px',
          '&.Mui-selected': { backgroundColor: '#E8E0FF', color: '#2D1F5E', fontWeight: 600, '&:hover': { backgroundColor: '#E8E0FF' } },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: 160 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', fontWeight: 500, py: 1, '&:hover': { backgroundColor: '#EDECF2' } },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', padding: '8px', minWidth: 220 },
      },
    },
  },
};

export function createAppTheme(mode: 'light' | 'dark') {
  return createTheme({
    ...shared,
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#6C5CE7', light: '#A78BFA', dark: '#4834A8', contrastText: '#fff' },
            success: { main: '#4CAF50', light: '#81C784', dark: '#2E7D32' },
            error: { main: '#E53935', light: '#EF9A9A', dark: '#C62828' },
            warning: { main: '#FFA726', light: '#FFCC80', dark: '#F57F17' },
            background: { default: '#F5F4F8', paper: '#FCFCFE' },
            text: { primary: '#1E1C24', secondary: '#636068' },
            divider: '#E0DEE5',
          }
        : {
            primary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C6EE0', contrastText: '#1E1C24' },
            success: { main: '#66BB6A', light: '#A5D6A7', dark: '#388E3C' },
            error: { main: '#EF5350', light: '#EF9A9A', dark: '#C62828' },
            warning: { main: '#FFA726', light: '#FFCC80', dark: '#F57F17' },
            background: { default: '#121016', paper: '#1C1A23' },
            text: { primary: '#EAE8F0', secondary: '#A5A2AD' },
            divider: '#32303B',
          }),
    },
  });
}
