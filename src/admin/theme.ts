import { defaultTheme } from 'react-admin'
import { deepmerge } from '@mui/utils'

export const darkTheme = deepmerge(defaultTheme, {
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
    secondary: { main: '#a78bfa' },
    background: { default: '#0a0a0f', paper: '#13131a' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
    divider: '#374151',
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'system-ui, -apple-system, sans-serif' },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#13131a', borderBottom: '1px solid #374151', boxShadow: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#0d0d14', borderRight: '1px solid #374151' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundColor: '#13131a', border: '1px solid #374151', boxShadow: 'none' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: '#1f2937' },
        head: {
          backgroundColor: '#0d0d14',
          color: '#9ca3af',
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#1a1a24 !important' } },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
          '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #5b21b6)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' },
        },
        notchedOutline: { borderColor: '#374151' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: '#1f1b3a', color: '#a78bfa', border: '1px solid #4c1d95' },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.RaMenuItemLink-active': { backgroundColor: '#2d1b69', color: '#a78bfa' },
        },
      },
    },
  },
})

export const lightTheme = deepmerge(defaultTheme, {
  palette: {
    mode: 'light',
    primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
    secondary: { main: '#6d28d9' },
    background: { default: '#f5f3ff', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#6b7280' },
    divider: '#e5e7eb',
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'system-ui, -apple-system, sans-serif' },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: 'none',
          color: '#1f2937',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#faf9ff', borderRight: '1px solid #e5e7eb' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e5e7eb', boxShadow: 'none' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f9f7ff',
          color: '#6b7280',
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#f5f3ff !important' } },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
          color: '#ffffff',
          '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #5b21b6)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.RaMenuItemLink-active': { backgroundColor: '#ede9fe', color: '#7c3aed' },
        },
      },
    },
  },
})
