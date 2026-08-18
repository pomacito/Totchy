"use client";

import * as React from "react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { createAppTheme } from "./createAppTheme";

const COLOR_MODE_STORAGE_KEY = "status-terytorii-color-mode";

type ColorModeContextValue = {
  mode: PaletteMode;
  toggle: () => void;
};

export const ColorModeContext = React.createContext<ColorModeContextValue>({
  mode: "light",
  toggle: () => {},
});

export function useColorMode() {
  return React.useContext(ColorModeContext);
}

function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => {
    const c = createCache({ key: "mui" });
    c.compat = true;
    return c;
  });

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted).join(" ");
    const styles = Object.values(cache.inserted).join("");
    // eslint-disable-next-line react/no-danger -- required by @emotion SSR extraction pattern
    return <style data-emotion={`${cache.key} ${names}`} dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  // Початковий рендер завжди у світлій темі, щоб збігатися з SSR-розміткою
  // (уникнення гідраційного мисматчу); після монтування застосовуємо
  // збережений вибір користувача чи системну тему. Це можливий короткий
  // "спалах" світлої теми для користувачів темної теми — прийнятний
  // компроміс заради LCP (контент рендериться одразу, без приховування).
  const [mode, setMode] = React.useState<PaletteMode>("light");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY) as PaletteMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
  }, []);

  const toggle = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  const contextValue = React.useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <EmotionRegistry>
      <ColorModeContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/*
            CssBaseline injects the body background as a global emotion
            style rule, which does not reliably re-apply on client-side
            theme-mode changes when combined with the SSR emotion cache
            (the initial light-mode global rule can outlive hydration).
            Painting the background here ties it to a normal component
            re-render instead, so it always matches the active theme.
          */}
          <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
            {children}
          </Box>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </EmotionRegistry>
  );
}
