'use client';

import { alpha, createTheme, type ThemeOptions } from '@mui/material/styles';

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
        html: { backgroundColor: 'var(--mui-palette-background-default)' },
        body: {
          backgroundColor: 'var(--mui-palette-background-default)',
          color: 'var(--mui-palette-text-primary)',
          transition: 'background-color 0.3s, color 0.3s',
        },
        '#__next': { height: '100%' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          fontSize: '0.875rem',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.secondary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '1.5px',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 16, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
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
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, fontSize: '0.875rem',
            '& fieldset': { borderColor: theme.palette.divider, borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: theme.palette.text.secondary },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '1.5px',
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
            },
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          gap: 0,
          border: `1.5px solid ${theme.palette.divider}`,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 'none', borderRight: `1px solid ${theme.palette.divider}`, borderRadius: 0, padding: '0 14px',
          fontSize: '0.8125rem', fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'none',
          '&:last-child': { borderRight: 'none' },
          '&:hover': { backgroundColor: theme.palette.action.hover },
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.16),
            color: theme.palette.primary.main,
            fontWeight: 600,
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
          },
        }),
      },
    },
    MuiCheckbox: {
      styleOverrides: { root: ({ theme }) => ({ padding: 0, '&.Mui-checked': { color: theme.palette.primary.main } }) },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: '1px solid', borderColor: 'divider' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8, margin: '1px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.16),
            color: theme.palette.primary.main,
            fontWeight: 600,
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
          },
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: theme.palette.mode === 'dark' ? '0 8px 28px rgba(0,0,0,0.36)' : '0 8px 28px rgba(0,0,0,0.12)',
          minWidth: 160,
          border: '1px solid',
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({ fontSize: '0.8125rem', fontWeight: 500, py: 1, '&:hover': { backgroundColor: theme.palette.action.hover } }),
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: theme.palette.mode === 'dark' ? '0 8px 28px rgba(0,0,0,0.36)' : '0 8px 28px rgba(0,0,0,0.12)',
          padding: '8px',
          minWidth: 220,
          border: '1px solid',
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: ({ theme }) => ({ color: theme.palette.text.secondary }),
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
            action: { hover: 'rgba(108,92,231,0.08)', selected: 'rgba(108,92,231,0.12)' },
          }
        : {
            primary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C6EE0', contrastText: '#1E1C24' },
            success: { main: '#66BB6A', light: '#A5D6A7', dark: '#388E3C' },
            error: { main: '#EF5350', light: '#EF9A9A', dark: '#C62828' },
            warning: { main: '#FFA726', light: '#FFCC80', dark: '#F57F17' },
            background: { default: '#121016', paper: '#1C1A23' },
            text: { primary: '#EAE8F0', secondary: '#A5A2AD' },
            divider: '#32303B',
            action: { hover: 'rgba(167,139,250,0.12)', selected: 'rgba(167,139,250,0.18)' },
          }),
    },
  });
}
