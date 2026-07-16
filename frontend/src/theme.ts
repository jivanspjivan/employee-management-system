import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f7045',
    },
    background: {
      default: '#eff4f0',
      paper: '#ffffff',
    },
    divider: '#dae4dc',
    text: {
      primary: '#17211b',
      secondary: '#637269',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
})
