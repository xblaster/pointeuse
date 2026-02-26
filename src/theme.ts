import {
  experimental_extendTheme as extendTheme,
  PaletteColorOptions,
} from '@mui/material/styles';

// Augmenter la palette MUI pour inclure la couleur M3 "tertiary"
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: import('@mui/material').PaletteColor;
  }
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }
  interface ColorSchemeOverrides {
    tertiary: true;
  }
}

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1565C0',
          light: '#42A5F5',
          dark: '#0D47A1',
        },
        secondary: {
          main: '#546E7A',
        },
        tertiary: {
          main: '#F9A825',
          light: '#FDD835',
          dark: '#F57F17',
          contrastText: '#000',
        },
        error: {
          main: '#C62828',
        },
        background: {
          default: '#F8FAFC',
          paper: '#FFFFFF',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#90CAF9',
          light: '#BBDEFB',
          dark: '#42A5F5',
        },
        secondary: {
          main: '#B0BEC5',
        },
        tertiary: {
          main: '#FFD54F',
          light: '#FFE082',
          dark: '#FFC107',
          contrastText: '#000',
        },
        error: {
          main: '#EF9A9A',
        },
        background: {
          default: '#0A0F1C',
          paper: '#111827',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 700,
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
  },
});

export default theme;
