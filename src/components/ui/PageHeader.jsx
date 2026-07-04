import React from "react";
import { Paper, Box, Typography, Stack } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { globalUi } from "./GlobalUiTheme";

export default function PageHeader({
    title,
    icon = <Inventory2Icon sx={{ fontSize: 24 }} />,
    rightContent
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: globalUi.paper,
                borderRadius: "var(--tg-radius)",
                border: "1px solid var(--tg-card-border)",
                px: 4,
                py: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: globalUi.black }}>
                {icon}
                <Typography sx={{ fontWeight: 900, color: globalUi.black, fontSize: "16px" }}>
                    {title}
                </Typography>
            </Box>

            {rightContent && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {rightContent}
                </Stack>
            )}
        </Paper>
    );
}
