import React from "react";
import { Button, CircularProgress } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export default function PremiumButton({
    variant = "default", // guardar, cancelar, excel, pdf, anadir, outline
    children,
    loading = false,
    disabled = false,
    onClick,
    startIcon,
    sx = {},
    className = "",
    ...props
}) {
    let baseSx = {};
    let buttonIcon = startIcon;
    let buttonClass = "";

    switch (variant) {
        case "guardar":
            buttonClass = "btn-save";
            buttonIcon = loading ? <CircularProgress size={18} color="inherit" /> : (startIcon || <SaveIcon />);
            break;
        case "cancelar":
            buttonClass = "btn-cancel";
            buttonIcon = startIcon || <CloseIcon />;
            break;
        case "excel":
            buttonClass = "btn-excel";
            buttonIcon = startIcon || <GridOnIcon fontSize="small" />;
            break;
        case "pdf":
            buttonClass = "btn-pdf";
            buttonIcon = startIcon || <PictureAsPdfIcon fontSize="small" />;
            break;
        case "anadir":
            buttonClass = "btn-add";
            buttonIcon = startIcon || <AddIcon />;
            break;
        case "outline":
            baseSx = {
                minHeight: "40px",
                px: 2,
                borderRadius: "var(--tg-radius-sm)",
                bgcolor: "#fff",
                border: `1px solid var(--tg-card-border)`,
                color: "var(--tg-text-dark)",
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                    bgcolor: "var(--tg-primary-soft)",
                    borderColor: "var(--tg-primary)",
                },
            };
            break;
        default:
            baseSx = {
                borderRadius: "var(--tg-radius-sm)",
                textTransform: "none",
                fontWeight: 800,
            };
            break;
    }

    return (
        <Button
            className={[buttonClass, className].filter(Boolean).join(" ")}
            onClick={onClick}
            disabled={disabled || loading}
            startIcon={buttonIcon}
            sx={{ ...baseSx, ...sx }}
            {...props}
        >
            {loading ? (variant === "guardar" ? "Guardando..." : "Cargando...") : children}
        </Button>
    );
}
