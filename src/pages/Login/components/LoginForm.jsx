import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Divider
} from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";
import AppleIcon from "@mui/icons-material/Apple";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import escudoPng from "../../../assets/imagenes/escudo.png";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [cedula, setCedula] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login({ user: cedula, password });
            if (result.ok) {
                navigate("/");
            } else {
                setError("Cédula o contraseña incorrecta");
            }
        } catch {
            setError("Error de conexión. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 480,
                mx: "auto",
                borderRadius: "16px",
                px: { xs: 3, sm: 6 },
                pt: "min(5vh, 40px)",
                pb: "min(4vh, 32px)",
                border: "2px solid var(--tg-primary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                maxHeight: "90vh",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                    display: "none"
                },
                scrollbarWidth: "none",
                msOverflowStyle: "none"
            }}
        >
            {/* Shield Logo */}
            <Box
                component="img"
                src={escudoPng}
                alt="Revive Icon"
                sx={{ 
                    width: "min(10vh, 70px)", 
                    height: "min(10vh, 70px)", 
                    objectFit: "contain",
                    mb: "min(2vh, 16px)",
                }}
            />

            <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "min(5vh, 2rem)", mb: "min(1vh, 4px)" }}>
                Bienvenido de nuevo
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "min(2.5vh, 1rem)", mb: "min(4vh, 32px)" }}>
                Accede a tu panel Revive Sports
            </Typography>

            {error && (
                <Typography sx={{ color: "#ef4444", fontSize: "0.8rem", mb: 1.5, textAlign: "center" }}>
                    {error}
                </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
                {/* Cédula */}
                <Typography sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, fontSize: "0.75rem", mb: 1 }}>
                    Cédula
                </Typography>
                <TextField
                    fullWidth
                    placeholder="Ingresa tu cédula"
                    variant="outlined"
                    size="small"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    sx={{
                        mb: "min(2.5vh, 20px)",
                        "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            backgroundColor: "#121212", // Fondo oscuro sólido
                            borderRadius: "10px",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "var(--tg-primary)" },
                        },
                        "& .MuiInputBase-input": { 
                            py: 1.5, 
                            fontSize: "1rem",
                            "&:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 100px #121212 inset !important",
                                WebkitTextFillColor: "#fff !important",
                                borderRadius: "inherit"
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonOutlineOutlinedIcon sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }} />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Contraseña */}
                <Typography sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, fontSize: "0.75rem", mb: 1 }}>
                    Contraseña
                </Typography>
                <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    variant="outlined"
                    size="small"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                        mb: "min(1.5vh, 8px)",
                        "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            backgroundColor: "#121212", // Fondo oscuro sólido
                            borderRadius: "10px",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "var(--tg-primary)" },
                        },
                        "& .MuiInputBase-input": { 
                            py: 1.5, 
                            fontSize: "1rem",
                            "&:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 100px #121212 inset !important",
                                WebkitTextFillColor: "#fff !important",
                                borderRadius: "inherit"
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockOutlinedIcon sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ color: "rgba(255,255,255,0.4)" }} size="small">
                                    {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: "min(3vh, 24px)" }}>
                    <Typography
                        sx={{
                            color: "var(--tg-primary)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            "&:hover": { textDecoration: "underline" },
                        }}
                    >
                        ¿Olvidaste tu contraseña?
                    </Typography>
                </Box>

                {/* Login Button */}
                <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        bgcolor: "var(--tg-primary)",
                        color: "#000",
                        py: 1.5,
                        borderRadius: "10px",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "1.1rem",
                        "&:hover": { bgcolor: "#d6a000" },
                        "&.Mui-disabled": { bgcolor: "rgba(240,180,0,0.5)", color: "rgba(0,0,0,0.5)" },
                        mb: "min(3vh, 24px)"
                    }}
                >
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                </Button>

                {/* Divider */}
                <Divider sx={{ "&::before, &::after": { borderColor: "rgba(255,255,255,0.1)" }, color: "rgba(255,255,255,0.4)", mb: "min(3vh, 24px)" }}>
                    <Typography sx={{ fontSize: "0.85rem" }}>o continúa con</Typography>
                </Divider>

                {/* Social Buttons */}
                <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                            borderColor: "rgba(255,255,255,0.15)",
                            bgcolor: "rgba(240,180,0,0.12)",
                            py: 0.8,
                            borderRadius: "8px",
                            minWidth: 0,
                            "&:hover": { bgcolor: "rgba(240,180,0,0.2)", borderColor: "rgba(240,180,0,0.3)" }
                        }}
                    >
                        <GoogleIcon sx={{ color: "#DB4437", fontSize: 20 }} />
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                            borderColor: "rgba(255,255,255,0.15)",
                            bgcolor: "rgba(255,255,255,0.04)",
                            py: 0.8,
                            borderRadius: "8px",
                            minWidth: 0,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
                        }}
                    >
                        <FacebookIcon sx={{ color: "#4267B2", fontSize: 20 }} />
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                            borderColor: "rgba(255,255,255,0.15)",
                            bgcolor: "rgba(255,255,255,0.04)",
                            py: 0.8,
                            borderRadius: "8px",
                            minWidth: 0,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
                        }}
                    >
                        <AppleIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Button>
                </Box>

                <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", mt: 1 }}>
                    ¿No tienes una cuenta?{" "}
                    <span style={{ color: "var(--tg-primary)", cursor: "pointer", textDecoration: "underline" }}>
                        Contáctanos
                    </span>
                </Typography>
            </Box>
        </Box>
    );
}
