import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import logoPng from "../../../assets/imagenes/logo.png";
import bgImage from "../../../assets/imagenes/gym-bg.jpg";

export default function LeftPanel() {
    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#fff",
                // Background image is HERE in the left panel only
                background: `url(${bgImage}) center center/cover no-repeat`,
            }}
        >
            {/* Dark gradient overlay so text is readable */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)",
                }}
            />

            {/* Content Container */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { xs: 3, md: 4, lg: 5 },
                }}
            >
                {/* Logo Section */}
                <Box>
                    <Box
                        component="img"
                        src={logoPng}
                        alt="Revive Sports"
                        sx={{
                            width: "auto",
                            height: { xs: "40px", md: "50px" },
                            objectFit: "contain",
                        }}
                    />
                </Box>

                {/* Main Text Section */}
                <Box sx={{ mt: "auto", mb: 2 }}>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            fontSize: { xs: "2rem", md: "2.8rem", lg: "3.2rem" },
                            lineHeight: 1.1,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        ENTRENA.<br />
                        PROGRESA.<br />
                        <span style={{ color: "var(--tg-primary)" }}>REVIVE.</span>
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            color: "rgba(255,255,255,0.8)",
                            maxWidth: "340px",
                            lineHeight: 1.5,
                        }}
                    >
                        Todo lo que necesitas para alcanzar tu mejor versión, en un solo lugar.
                    </Typography>
                </Box>

                {/* Bottom Features */}
                <Box>
                    <Stack
                        direction="row"
                        spacing={3}
                        sx={{
                            borderTop: "1px solid rgba(255,255,255,0.15)",
                            pt: 2,
                            pb: 1,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(240,180,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--tg-primary)",
                                }}
                            >
                                <FitnessCenterIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.75rem" }}>Rutinas</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>personalizadas</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(240,180,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--tg-primary)",
                                }}
                            >
                                <PersonOutlineIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.75rem" }}>Control de</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>membresías</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(240,180,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--tg-primary)",
                                }}
                            >
                                <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.75rem" }}>Fichas y facturas</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>digitales</Typography>
                            </Box>
                        </Box>
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.4)", mt: 1, display: "block" }}
                    >
                        © 2026 Revive Sports. Todos los derechos reservados.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
