import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Divider,
    Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { globalUi, globalShadows } from "./GlobalUiTheme";

export default function PremiumModal({
    open,
    onClose,
    title,
    subtitle,
    icon,
    children,
    actions,
    maxWidth = "md",
    fullWidth = true,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{
                className: "tg-modal-paper",
                sx: {
                    borderRadius: "var(--tg-radius)",
                    overflow: "hidden",
                    boxShadow: globalShadows.modal,
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                className="tg-modal-title"
                sx={{
                    bgcolor: globalUi.black,
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    py: 2,
                    px: 3.2
                }}
            >
                <Box className="tg-modal-title__inner" sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    {icon && (
                        <Box className="tg-modal-title__icon" sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            bgcolor: "rgba(255,255,255,0.1)",
                            p: 0.8,
                            borderRadius: "6px"
                        }}>
                            {icon}
                        </Box>
                    )}
                    <Box>
                        <Typography className="tg-modal-title__heading" sx={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.2px", lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography className="tg-modal-title__subtitle" sx={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", mt: 0.4, fontWeight: 500 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "#fff", mt: -0.5, mr: -1 }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>
            <Divider sx={{ borderColor: globalUi.mustard, borderBottomWidth: 2 }} />

            {/* Content */}
            <DialogContent
                className="tg-modal-content"
                sx={{
                    p: 2.25,
                    pt: 2,
                    bgcolor: "#fff",
                    "& .MuiInputBase-root": { fontSize: "12px" },
                    "& .MuiInputLabel-root": { fontSize: "12px" },
                    "& .MuiMenuItem-root": { fontSize: "12px" }
                }}
            >
                {children}
            </DialogContent>

            {/* Footer / Actions */}
            {actions && (
                <>
                    <Divider />
                    <DialogActions
                        className="tg-modal-actions"
                        sx={{
                            p: 1.75,
                            px: 2,
                            bgcolor: "#fff",
                            gap: 1.5
                        }}
                    >
                        {actions}
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
