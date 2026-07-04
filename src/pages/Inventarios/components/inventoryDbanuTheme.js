export const inventoryUi = {
  black: "#0f172a",
  blue: "#144985",
  blueDark: "#0f3a6b",
  blueSoft: "rgba(20, 73, 133, 0.08)",
  blueHeader: "#dce8f7",
  blueBorder: "#c7d8ee",
  mustard: "#f59e0b",
  mustardSoft: "rgba(245, 158, 11, 0.10)",
  success: "#16a34a",
  successSoft: "rgba(22, 163, 74, 0.10)",
  successBorder: "rgba(22, 163, 74, 0.24)",
  danger: "#dc2626",
  dangerSoft: "rgba(220, 38, 38, 0.10)",
  dangerBorder: "rgba(220, 38, 38, 0.22)",
  muted: "#64748b",
  border: "#e2e8f0",
  text: "#0f172a",
  bg: "#f4f6f8",
  paper: "#ffffff",
};

export const inventoryFontSx = {
  fontFamily: '"Inter", "system-ui", sans-serif',
};

export const inventoryPageShellSx = {
  ...inventoryFontSx,
  minHeight: "100vh",
  bgcolor: inventoryUi.bg,
  p: { xs: 2, md: 3 },
};

export const inventoryPagePaperSx = {
  backgroundColor: inventoryUi.paper,
  borderRadius: "8px",
  border: `1px solid ${inventoryUi.border}`,
};

export const inventoryHeaderPaperSx = {
  ...inventoryPagePaperSx,
  px: 4,
  py: "12px !important",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const inventoryIconBadgeSx = {
  width: 44,
  height: 44,
  borderRadius: "10px",
  bgcolor: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: inventoryUi.blue,
  border: `1px solid ${inventoryUi.blueBorder}`,
};

export const inventoryResultChipSx = {
  px: 2.5,
  py: 0.8,
  borderRadius: "6px",
  bgcolor: "#f0fdf4",
  border: "1px solid #dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.5px",
};

export const inventoryToolbarButtonSx = (mode = "primary") => {
  if (mode === "excel") {
    return {
      bgcolor: "#2e7d32 !important",
      color: "#ffffff !important",
      fontWeight: 800,
      fontSize: "11px",
      height: 34,
      px: 2,
      borderRadius: "6px",
      "&:hover": { bgcolor: "#1b5e20 !important" },
    };
  }

  if (mode === "pdf") {
    return {
      bgcolor: "#d32f2f !important",
      color: "#ffffff !important",
      fontWeight: 800,
      fontSize: "11px",
      height: 34,
      px: 2,
      borderRadius: "6px",
      "&:hover": { bgcolor: "#b71c1c !important" },
    };
  }

  if (mode === "outlineMustard") {
    return {
      height: 34,
      px: 2.5,
      borderRadius: "6px",
      bgcolor: "#ffffff !important",
      border: `2px solid ${inventoryUi.mustard} !important`,
      color: `${inventoryUi.black} !important`,
      fontWeight: 950,
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      gap: 1,
      "& .icon-box": {
        bgcolor: inventoryUi.mustard,
        color: inventoryUi.black,
        display: "flex",
        p: 0.2,
        borderRadius: "3px",
      },
      "&:hover": {
        bgcolor: "rgba(240, 180, 0, 0.12) !important",
      },
    };
  }

  return {
    backgroundColor: inventoryUi.blue,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "12px",
    borderRadius: "8px",
    height: 36,
    px: 2.2,
    "&:hover": {
      backgroundColor: inventoryUi.blueDark,
    },
  };
};
