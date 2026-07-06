import React from "react";
import { Box } from "@mui/material";
import LoginForm from "./components/LoginForm";
import LeftPanel from "./components/LeftPanel";

export default function Login() {
    return (
        <Box 
            sx={{ 
                width: "100vw", 
                height: "100vh", 
                overflow: "hidden",
                display: "flex",
                bgcolor: "#0a0a0a", // Dark base background for the whole page
            }}
        >
            {/* Left Panel - Background image + text */}
            <Box
                sx={{
                    display: { xs: "none", md: "block" },
                    width: { md: "55%", lg: "58%" },
                    height: "100%",
                    flexShrink: 0,
                }}
            >
                <LeftPanel />
            </Box>

            {/* Right Panel - Form on dark background */}
            <Box
                sx={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#0a0a0a",
                    p: { xs: 2, sm: 3, md: 4 },
                    overflowY: "auto", // Permite scroll si la pantalla es muy bajita
                }}
            >
                <LoginForm />
            </Box>
        </Box>
    );
}
