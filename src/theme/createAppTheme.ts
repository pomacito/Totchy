import { createTheme, type PaletteMode } from "@mui/material/styles";
import { ukUA as coreUkUA } from "@mui/material/locale";
import { darkTokens, lightTokens } from "./tokens";

export function createAppTheme(mode: PaletteMode) {
  const tokens = mode === "light" ? lightTokens : darkTokens;

  return createTheme(
    {
      palette: {
        mode,
        primary: { main: tokens.primary, contrastText: tokens.onPrimary },
        secondary: { main: tokens.secondary, contrastText: tokens.onSecondary },
        error: { main: tokens.error, contrastText: tokens.onError },
        background: { default: tokens.background, paper: tokens.surface },
        text: { primary: tokens.onBackground, secondary: tokens.onSurfaceVariant },
        divider: tokens.outline,
      },
      shape: { borderRadius: 12 },
      typography: {
        // Системний стек шрифтів (без завантаження зовнішніх веб-шрифтів):
        // передбачувано працює офлайн і не залежить від доступності
        // сторонніх CDN у виробничому середовищі.
        fontFamily: [
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ].join(","),
        h1: { fontWeight: 700, letterSpacing: -0.5 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
      },
      components: {
        MuiButton: {
          styleOverrides: { root: { borderRadius: 100 } },
        },
        MuiChip: {
          styleOverrides: { root: { borderRadius: 8 } },
        },
        MuiCard: {
          styleOverrides: { root: { borderRadius: 16 } },
        },
        MuiPaper: {
          styleOverrides: { root: { backgroundImage: "none" } },
        },
      },
    },
    coreUkUA
  );
}
