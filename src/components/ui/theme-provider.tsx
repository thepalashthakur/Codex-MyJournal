"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const systemFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === "dark";
  const colors = dark ? {
    background: "#181a19", paper: "#222522", subtle: "#2c302d", text: "#f5f4f0",
    secondary: "#b8beb7", divider: "#3c423c", primary: "#a8c8eb", hover: "#343b36",
  } : {
    background: "#f8f7f4", paper: "#fffefb", subtle: "#f0f0eb", text: "#252925",
    secondary: "#626b63", divider: "#e2e5dd", primary: "#315f91", hover: "#e9ede7",
  };

  return createTheme({
    palette: {
      mode,
      primary: { main: colors.primary, contrastText: dark ? "#172432" : "#ffffff" },
      secondary: { main: dark ? "#c4b5fd" : "#6652a3" },
      success: { main: dark ? "#71d3a4" : "#207454" },
      warning: { main: dark ? "#f0c277" : "#94600c" },
      error: { main: dark ? "#ff9b9b" : "#ba3b42" },
      info: { main: colors.primary },
      background: { default: colors.background, paper: colors.paper },
      text: { primary: colors.text, secondary: colors.secondary },
      divider: colors.divider,
      action: { hover: colors.hover, selected: colors.subtle, disabled: dark ? "#7b8390" : "#89919e" },
    },
    shape: { borderRadius: 10 },
    spacing: 8,
    typography: {
      fontFamily: systemFont,
      h1: { fontSize: "clamp(1.8rem, 2.4vw, 2.15rem)", fontWeight: 620, letterSpacing: "-.035em", lineHeight: 1.2 },
      h2: { fontSize: "1.3rem", fontWeight: 600, letterSpacing: "-.025em" },
      h3: { fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-.015em" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    },
    transitions: { duration: { shortest: 120, shorter: 160, short: 190, standard: 220 } },
    components: {
      MuiCssBaseline: { styleOverrides: {
        body: { backgroundColor: colors.background, color: colors.text },
        "*:focus-visible": { outline: `2px solid ${colors.primary}`, outlineOffset: 2 },
        "@media (prefers-reduced-motion: reduce)": { "*, *::before, *::after": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" } },
      } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { minHeight: 40, borderRadius: 9, paddingInline: 12, "@media (max-width: 767px)": { minHeight: 44 } },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: colors.divider, "&:hover": { borderColor: colors.primary, backgroundColor: colors.hover } },
      } },
      MuiIconButton: { styleOverrides: { root: { minWidth: 40, minHeight: 40, borderRadius: 9, "@media (max-width: 767px)": { minWidth: 44, minHeight: 44 } } } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" }, outlined: { borderColor: colors.divider } } },
      MuiCard: { defaultProps: { variant: "outlined" }, styleOverrides: { root: { borderColor: colors.divider, boxShadow: "none" } } },
      MuiDialog: { defaultProps: { fullWidth: true, maxWidth: "sm" }, styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${colors.divider}` } } },
      MuiTextField: { defaultProps: { variant: "outlined", size: "small" } },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 9, backgroundColor: colors.paper, minHeight: 40, "@media (max-width: 767px)": { minHeight: 44 } } } },
      MuiInputLabel: { styleOverrides: { root: { color: colors.secondary } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 10, minHeight: 44, "&.Mui-selected": { backgroundColor: colors.subtle }, "&.Mui-selected:hover": { backgroundColor: colors.hover } } } },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 40, "@media (max-width: 767px)": { minHeight: 44 } } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiSkeleton: { defaultProps: { animation: "wave" } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8 } } },
    },
  });
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const preference = document.documentElement.dataset.theme;
      setMode(preference === "dark" || (preference !== "light" && media.matches) ? "dark" : "light");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    media.addEventListener("change", update);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
