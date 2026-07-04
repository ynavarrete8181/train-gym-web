export const globalUi = {
    black: "#0f172a", // Slate 900
    mustard: "#f59e0b", // Amber 500
    mustardSoft: "rgba(245, 158, 11, 0.10)",
    mustardBorder: "rgba(245, 158, 11, 0.28)",
    mustardDark: "#d97706",
    indigo: "#4f46e5",
    indigoSoft: "rgba(79, 70, 229, 0.10)",
    indigoDark: "#4338ca",
    emerald: "#10b981",
    emeraldSoft: "rgba(16, 185, 129, 0.10)",
    emeraldDark: "#059669",
    danger: "#ef4444", // Red 500
    dangerSoft: "rgba(239, 68, 68, 0.08)",
    dangerBorder: "rgba(239, 68, 68, 0.24)",
    success: "#2e7d32",
    successSoft: "rgba(46, 125, 50, 0.10)",
    successBorder: "rgba(46, 125, 50, 0.24)",
    muted: "#64748b", // Slate 500
    border: "#e2e8f0", // Slate 200
    borderSoft: "rgba(148, 163, 184, 0.22)",
    paper: "#ffffff",
    bg: "#f8fafc", // Slate 50
    text: "#0f172a",
};

export const globalBorderRadius = {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
};

export const globalShadows = {
    modal: "0 24px 60px rgba(15, 23, 42, 0.25)",
    paper: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
};

export const globalInputSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
        borderRadius: globalBorderRadius.sm,
        backgroundColor: "#fff",
        "& fieldset": { borderColor: "#cbd5e1" },
        "&:hover fieldset": { borderColor: globalUi.mustard },
        "&.Mui-focused fieldset": { borderColor: globalUi.mustard, borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": {
        fontSize: "12px",
        fontWeight: 600,
        color: globalUi.muted,
        "&.Mui-focused": { color: globalUi.mustard },
    },
    "& .MuiInputBase-input": {
        fontSize: "12px",
    },
};

export const globalMenuProps = {
    PaperProps: {
        sx: {
            borderRadius: globalBorderRadius.sm,
            mt: 0.5,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            "& .MuiMenuItem-root": { fontSize: "12px", py: 1 },
        },
    },
};
