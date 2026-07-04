import { createTheme } from "@mui/material/styles";

export const tgAccent = {
  mustard: "var(--tg-primary, #e0a100)",
  mustardStrong: "var(--tg-primary-strong, #bb8600)",
  mustardSoft: "rgba(224, 161, 0, 0.10)",
};

export const tgSemantic = {
  mustard: {
    color: tgAccent.mustard,
    strong: tgAccent.mustardStrong,
    soft: tgAccent.mustardSoft,
    textOnAccent: "#ffffff",
  },
  danger: {
    color: "#ef4444",
    strong: "#dc2626",
    soft: "rgba(239, 68, 68, 0.10)",
    textOnAccent: "#ffffff",
  },
  success: {
    color: "#2e7d32",
    strong: "#1b5e20",
    soft: "rgba(46, 125, 50, 0.10)",
    textOnAccent: "#ffffff",
  },
  inventory: {
    color: "#6366f1",
    strong: "#4338ca",
    soft: "rgba(99, 102, 241, 0.10)",
    textOnAccent: "#ffffff",
  },
  neutral: {
    color: "#0f172a",
    strong: "#020617",
    soft: "rgba(15, 23, 42, 0.08)",
    textOnAccent: "#ffffff",
  },
};

const resolveSemanticTone = (tone) =>
  typeof tone === "string" ? tgSemantic[tone] ?? tgSemantic.neutral : tone;

export const semanticIconButtonSx = (tone = "neutral") => {
  const t = resolveSemanticTone(tone);

  return {
    width: 32,
    height: 32,
    borderRadius: "6px",
    color: t.color,
    bgcolor: "#ffffff",
    border: `1px solid ${t.color}`,
    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.04)",
    transition: "all 180ms ease",
    "&:hover": {
      bgcolor: t.soft,
      borderColor: t.color,
      boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
      transform: "translateY(-1px)",
    },
  };
};

export const semanticOutlineButtonSx = (tone = "neutral", options = {}) => {
  const t = resolveSemanticTone(tone);
  const {
    height = 38,
    px = 3,
    withIconBox = false,
    borderWidth = 1,
    hoverBg = t.soft,
  } = options;

  return {
    height,
    px,
    borderRadius: "6px",
    bgcolor: "#ffffff !important",
    border: `${borderWidth}px solid ${t.color} !important`,
    color: `${tone === "danger" ? t.color : "#0f172a"} !important`,
    fontWeight: 900,
    fontSize: "12px",
    textTransform: "none",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.03)",
    display: "flex",
    alignItems: "center",
    gap: withIconBox ? 1 : undefined,
    "& .icon-box": withIconBox
      ? {
          bgcolor: t.color,
          color: t.textOnAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 17,
          height: 17,
          borderRadius: "3px",
        }
      : undefined,
    "&:hover": {
      bgcolor: `${hoverBg} !important`,
      borderColor: `${t.color} !important`,
    },
  };
};

export const semanticChipSx = (tone = "neutral") => {
  const t = resolveSemanticTone(tone);

  return {
    height: 24,
    borderRadius: "6px",
    fontSize: 10.5,
    fontWeight: 900,
    bgcolor: "#ffffff",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.03)",
    color: t.color,
    border: `1px solid ${t.color}`,
  };
};

export const modalPaperSx = {
  borderRadius: "var(--tg-radius-sm)",
  overflow: "hidden",
  border: "1px solid var(--tg-card-border)",
  boxShadow: "var(--tg-shadow)",
};

export const modalTitleSx = {
  backgroundColor: "#101010",
  color: "#ffffff",
  fontWeight: 900,
  py: 2,
  px: 2.5,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

export const modalContentSx = {
  backgroundColor: "#f7f3ea",
  pt: 3,
  pb: 2,
};

export const modalActionsSx = {
  backgroundColor: "#f1ebde",
  px: 2.5,
  py: 1.5,
  borderTop: "1px solid rgba(17,17,17,0.08)",
  gap: 1.5,
  display: "flex",
  justifyContent: "flex-end",
};

export const modalCancelButtonSx = {
  minHeight: 42,
  px: 2.5,
  fontWeight: 900,
  borderRadius: "var(--tg-radius-xs)",
  color: "#d32f2f",
  borderColor: "#d32f2f",
  backgroundColor: "#ffffff",
  textTransform: "none",
  "&:hover": {
    borderColor: "#b71c1c",
    backgroundColor: "rgba(211, 47, 47, 0.08)",
  },
};

export const modalPrimaryButtonSx = {
  minHeight: 42,
  px: 2.5,
  fontWeight: 900,
  borderRadius: "var(--tg-radius-xs)",
  borderWidth: "1.5px",
  borderColor: "var(--tg-primary)",
  backgroundColor: "#ffffff",
  color: "#101010",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    borderColor: "var(--tg-primary-strong)",
    backgroundColor: "rgba(240, 180, 0, 0.08)",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    borderColor: "rgba(240, 180, 0, 0.45)",
    backgroundColor: "#ffffff",
    color: "rgba(163, 120, 0, 0.55)",
  },
};

export const modalFieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    borderRadius: "var(--tg-radius-xs)",
  },
  "& .MuiInputLabel-root": {
    fontSize: "13px",
  },
};

// Estilos adicionales para Inventario (Migrados de uiInventario.js)
export const sectionPaperSx = {
  p: 2.5,
  borderRadius: "var(--tg-radius-sm)",
  border: "1px solid var(--tg-card-border)",
  backgroundColor: "var(--tg-card-bg)",
  boxShadow: "none",
  position: "relative",
};

export const sectionTitleSx = {
  fontWeight: 900,
  color: "var(--tg-text-dark)",
  fontSize: 12,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  mb: 2,
  pb: 1,
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

export const metricCardSx = {
  p: 1.5,
  borderRadius: "var(--tg-radius-sm)",
  border: "1px solid var(--tg-card-border)",
  backgroundColor: "var(--tg-card-bg)",
};

export const iconButtonSx = (color = "#111", bg = "rgba(0,0,0,0.05)") => ({
  width: 32,
  height: 32,
  borderRadius: "var(--tg-radius-sm)",
  color,
  backgroundColor: bg,
  border: "1px solid transparent",
  "&:hover": {
    borderColor: color,
    backgroundColor: bg,
  },
});

export const tableSx = {
  "& th": {
    fontSize: 11,
    fontWeight: 900,
    color: "var(--tg-text-dark)",
    backgroundColor: "rgba(15,23,42,0.04) !important",
    borderBottom: "1px solid var(--tg-card-border)",
    py: 1,
    textTransform: "uppercase",
  },
  "& td": {
    fontSize: 12,
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    py: 0.8,
  },
  "& tbody tr:hover": {
    backgroundColor: "rgba(0,0,0,0.015)",
  },
};

// Aliases para compatibilidad con módulos existentes
export const pageCardSx = sectionPaperSx;

export const btnSquareSx = (color = "#111") => ({
  minHeight: 40,
  px: 2,
  borderRadius: "var(--tg-radius-xs)",
  textTransform: "none",
  fontSize: "12px",
  fontWeight: 800,
  border: `1px solid ${color}`,
  color: color,
  "&:hover": {
    backgroundColor: `${color}10`,
    borderColor: color,
  },
});

export const filterInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "var(--tg-radius-xs)",
    backgroundColor: "#ffffff",
  },
};

export const iconActionSx = (color = "#111") => ({
  width: 32,
  height: 32,
  borderRadius: "var(--tg-radius-xs)",
  color,
  backgroundColor: "rgba(0,0,0,0.04)",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});

export function buildTheme() {
    const s = getComputedStyle(document.documentElement);
    const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback;

    const primary = v("--tg-primary", "#f2b100");
    const primaryStrong = v("--tg-primary-strong", "#cf9800");
    const contentBg = v("--tg-content-bg", "#f5f6f8");
    const paperBg = v("--tg-card-bg", "#ffffff");
    const textPrimary = v("--tg-text-dark", "#0f172a");
    const textSecondary = v("--tg-muted-dark", "rgba(15, 23, 42, 0.65)");
    const divider = v("--tg-card-border", "rgba(17, 24, 39, 0.12)");

    const radius = parseFloat(v("--tg-radius", "16")) || 16;
    const radiusSm = parseFloat(v("--tg-radius-sm", "6")) || 6;

    const t = createTheme({
        palette: {
            mode: "light",
            primary: { main: primary },
            secondary: { main: textPrimary },
            background: { default: contentBg, paper: paperBg },
            text: { primary: textPrimary, secondary: textSecondary },
            divider,
        },
        shape: { borderRadius: radius },
        typography: {
            fontFamily: `"Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", sans-serif`,
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusSm,
                        border: `1px solid ${divider}`,
                        backgroundImage: "none",
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusSm,
                        boxShadow: "var(--tg-shadow)",
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusSm,
                        textTransform: "none",
                        fontWeight: 800,
                        boxShadow: "none",
                        paddingInline: 16,
                    },
                    containedPrimary: {
                        backgroundColor: primary,
                        color: "#101010",
                        "&:hover": {
                            backgroundColor: primaryStrong,
                            boxShadow: "none",
                        },
                    },
                    outlined: {
                        borderWidth: "1px",
                    },
                },
            },
            MuiChip: { styleOverrides: { root: { borderRadius: radiusSm, fontWeight: 800 } } },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusSm,
                        "& fieldset": {
                            borderColor: divider,
                        },
                    },
                },
            },
            MuiSelect: { styleOverrides: { root: { borderRadius: radiusSm } } },
            MuiIconButton: { styleOverrides: { root: { borderRadius: radiusSm } } },
            MuiDialog: { styleOverrides: { paper: { borderRadius: radiusSm } } },
            MuiAlert: { styleOverrides: { root: { borderRadius: radiusSm } } },
            MuiMenuItem: { styleOverrides: { root: { borderRadius: radiusSm } } },
            MuiPaginationItem: { styleOverrides: { root: { borderRadius: radiusSm } } },
            MuiTableContainer: {
                styleOverrides: {
                    root: { borderRadius: radiusSm, overflow: "hidden", border: `1px solid ${divider}`, boxShadow: "none" },
                },
            },
            MuiTableHead: { styleOverrides: { root: { backgroundColor: "rgba(15,23,42,0.04)" } } },
            MuiTableCell: { styleOverrides: { head: { fontWeight: 900 } } },
        },
    });

    t.shape.borderRadiusSm = radiusSm;

    return t;
}
