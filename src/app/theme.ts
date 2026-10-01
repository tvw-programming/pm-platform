import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { brand, accent, graphite, semantic, radius, shadowRamp, layout } from './tokens';

export type ColorMode = 'light' | 'dark';

const fontStack = [
  '"Inter var"',
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

const monoStack = ['"JetBrains Mono"', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace'].join(',');

/** Replaces MUI's default shadow ramp so elevation stays flat and enterprise-y. */
function buildShadows(): Theme['shadows'] {
  const ramp = [
    shadowRamp.none,
    shadowRamp.xs,
    shadowRamp.xs,
    shadowRamp.sm,
    shadowRamp.sm,
    shadowRamp.md,
    shadowRamp.md,
    shadowRamp.md,
    shadowRamp.lg,
  ];
  const filled = Array.from({ length: 25 }, (_, i) => ramp[i] ?? shadowRamp.xl);
  return filled as unknown as Theme['shadows'];
}

const typography: ThemeOptions['typography'] = {
  fontFamily: fontStack,
  htmlFontSize: 16,
  fontSize: 14,
  h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h2: { fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.018em' },
  h3: { fontSize: '1.375rem', fontWeight: 650, lineHeight: 1.3, letterSpacing: '-0.015em' },
  h4: { fontSize: '1.125rem', fontWeight: 650, lineHeight: 1.35, letterSpacing: '-0.01em' },
  h5: { fontSize: '1rem', fontWeight: 650, lineHeight: 1.4 },
  h6: { fontSize: '0.9375rem', fontWeight: 650, lineHeight: 1.4 },
  subtitle1: { fontSize: '0.9375rem', fontWeight: 550, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },
  body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
  button: { fontSize: '0.8438rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  caption: { fontSize: '0.75rem', lineHeight: 1.45 },
  overline: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },
};

function palette(mode: ColorMode): ThemeOptions['palette'] {
  const isLight = mode === 'light';
  return {
    mode,
    primary: {
      main: isLight ? brand[500] : brand[300],
      light: isLight ? brand[300] : brand[200],
      dark: isLight ? brand[700] : brand[500],
      contrastText: isLight ? '#FFFFFF' : graphite[950],
    },
    secondary: {
      main: isLight ? accent[500] : accent[300],
      light: isLight ? accent[300] : accent[200],
      dark: isLight ? accent[700] : accent[500],
      contrastText: isLight ? '#FFFFFF' : graphite[950],
    },
    success: { main: isLight ? semantic.success : '#43B872', contrastText: '#FFFFFF' },
    warning: { main: isLight ? semantic.warning : '#DFA038', contrastText: isLight ? '#FFFFFF' : graphite[950] },
    error: { main: isLight ? semantic.error : '#E8695C', contrastText: '#FFFFFF' },
    info: { main: isLight ? semantic.info : '#5BA7D8', contrastText: '#FFFFFF' },
    divider: isLight ? graphite[200] : '#2C3540',
    background: {
      default: isLight ? graphite[50] : graphite[950],
      paper: isLight ? '#FFFFFF' : '#161C23',
    },
    text: {
      primary: isLight ? graphite[900] : '#E8EDF2',
      secondary: isLight ? graphite[600] : '#9BA7B4',
      disabled: isLight ? graphite[400] : '#5C6875',
    },
    action: {
      hover: isLight ? 'rgba(14, 143, 134, 0.06)' : 'rgba(95, 194, 183, 0.10)',
      selected: isLight ? 'rgba(14, 143, 134, 0.10)' : 'rgba(95, 194, 183, 0.16)',
      disabledOpacity: 0.45,
    },
    grey: {
      50: graphite[50],
      100: graphite[100],
      200: graphite[200],
      300: graphite[300],
      400: graphite[400],
      500: graphite[500],
      600: graphite[600],
      700: graphite[700],
      800: graphite[800],
      900: graphite[900],
    },
  };
}

export function buildTheme(mode: ColorMode): Theme {
  const base = createTheme({
    palette: palette(mode),
    typography,
    shape: { borderRadius: radius.md },
    shadows: buildShadows(),
    spacing: 8,
    breakpoints: { values: { xs: 0, sm: 640, md: 900, lg: 1280, xl: 1600 } },
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': { colorScheme: mode },
          'html, body, #root': { height: '100%' },
          html: { overflowX: 'hidden' },
          body: {
            backgroundColor: base.palette.background.default,
            WebkitFontSmoothing: 'antialiased',
            // Wide surfaces (board, tables, timeline) own their own horizontal
            // scrollers, so the page itself should never scroll sideways.
            overflowX: 'hidden',
          },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? graphite[300] : '#39434F',
            borderRadius: radius.pill,
            border: `2px solid ${base.palette.background.default}`,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: mode === 'light' ? graphite[400] : '#4A5663',
          },
          // Visible, consistent focus ring across every interactive surface.
          '*:focus-visible': {
            outline: `2px solid ${base.palette.primary.main}`,
            outlineOffset: 2,
          },
          code: { fontFamily: monoStack, fontSize: '0.8125em' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: base.palette.divider },
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            borderColor: base.palette.divider,
            transition: 'box-shadow 150ms ease, border-color 150ms ease',
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: { padding: base.spacing(2, 2.5, 1) },
          title: { ...base.typography.h6 },
          subheader: { ...base.typography.caption, color: base.palette.text.secondary },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: base.spacing(1.5, 2.5, 2.5) } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: radius.sm, paddingInline: base.spacing(1.75) },
          sizeSmall: { paddingInline: base.spacing(1.25), minHeight: 32 },
          sizeMedium: { minHeight: 38 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: radius.sm } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.sm, fontWeight: 600, fontSize: '0.75rem' },
          sizeSmall: { height: 22 },
          label: { paddingInline: 8 },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 350 },
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'light' ? graphite[800] : graphite[100],
            color: mode === 'light' ? '#FFFFFF' : graphite[900],
            fontSize: '0.75rem',
            borderRadius: radius.sm,
            paddingInline: 10,
          },
          arrow: { color: mode === 'light' ? graphite[800] : graphite[100] },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 2, borderRadius: radius.pill },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8438rem',
            paddingInline: base.spacing(1.75),
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 6, borderRadius: radius.pill, backgroundColor: base.palette.action.hover },
          bar: { borderRadius: radius.pill },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: radius.sm } },
      },
      MuiInputLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
      MuiMenu: {
        styleOverrides: { paper: { borderRadius: radius.md, boxShadow: shadowRamp.lg, minWidth: 180 } },
      },
      MuiMenuItem: {
        styleOverrides: { root: { fontSize: '0.8438rem', borderRadius: radius.xs, margin: '2px 6px' } },
      },
      MuiListItemButton: {
        styleOverrides: { root: { borderRadius: radius.sm } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: radius.lg } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundImage: 'none', borderColor: base.palette.divider } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: radius.md, fontSize: '0.8438rem' } },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontSize: '0.75rem', fontWeight: 700 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: base.palette.divider, fontSize: '0.8438rem' },
          head: { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' },
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: radius.sm } },
      },
      MuiSkeleton: { defaultProps: { animation: 'wave' } },
    },
  });
}

export { layout };
