import { defaultTheme } from 'react-admin'
import { deepmerge } from '@mui/utils'

export const darkTheme = deepmerge(defaultTheme, {
  palette: {
    mode: 'dark',
    primary: { main: '#14b8a6', light: '#5eead4', dark: '#115e59' },
    secondary: { main: '#5eead4' },
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
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          boxShadow: '0 4px 14px rgba(20, 184, 166, 0.4)',
          '&:hover': { background: 'linear-gradient(135deg, #0d9488, #115e59)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
        },
        notchedOutline: { borderColor: '#374151' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: '#0f2f2c', color: '#5eead4', border: '1px solid #134e4a' },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.RaMenuItemLink-active': { backgroundColor: '#134e4a', color: '#5eead4' },
        },
      },
    },
  },
})

export const lightTheme = deepmerge(defaultTheme, {
  palette: {
    mode: 'light',
    primary: { main: '#14b8a6', light: '#5eead4', dark: '#115e59' },
    secondary: { main: '#0d9488' },
    background: { default: '#f0fdfa', paper: '#ffffff' },
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
        paper: { backgroundColor: '#f8fafc', borderRight: '1px solid #e5e7eb' },
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
          backgroundColor: '#f0fdfa',
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
        root: { '&:hover': { backgroundColor: '#f0fdfa !important' } },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          boxShadow: '0 4px 14px rgba(20, 184, 166, 0.3)',
          color: '#ffffff',
          '&:hover': { background: 'linear-gradient(135deg, #0d9488, #115e59)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: '#ccfbf1', color: '#0d9488', border: '1px solid #99f6e4' },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.RaMenuItemLink-active': { backgroundColor: '#ccfbf1', color: '#14b8a6' },
        },
      },
    },
  },
})
