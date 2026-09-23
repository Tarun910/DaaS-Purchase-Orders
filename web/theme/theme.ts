"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F4C81",
      dark: "#0A3559",
      light: "#3B6F9B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#2F6F4E",
      dark: "#214F37",
      light: "#588F72",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    error: {
      main: "#B42318",
    },
    success: {
      main: "#067647",
    },
    warning: {
      main: "#B54708",
    },
    text: {
      primary: "#1A2332",
      secondary: "#5B6777",
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 650, letterSpacing: "-0.02em" },
    h5: { fontWeight: 650, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "1px solid",
          borderColor: "#E3E8EF",
        },
      },
    },
  },
});
