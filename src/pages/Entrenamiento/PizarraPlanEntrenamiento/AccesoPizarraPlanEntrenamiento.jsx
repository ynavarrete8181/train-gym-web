import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { pagePaperSx } from "../../../modules/personas/personas.utils";
import { filterInputSx, semanticChipSx } from "../../../Styles/muiTheme";

const DAYS = [
    { value: "LUNES", label: "Lunes" },
    { value: "MARTES", label: "Martes" },
    { value: "MIERCOLES", label: "Miércoles" },
    { value: "JUEVES", label: "Jueves" },
    { value: "VIERNES", label: "Viernes" },
    { value: "SABADO", label: "Sábado" },
    { value: "DOMINGO", label: "Domingo" },
];

export default function AccesoPizarraPlanEntrenamiento() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [dias, setDias] = useState([]);
    const [semanaActual, setSemanaActual] = useState(1);
    const [diaSeleccionado, setDiaSeleccionado] = useState("LUNES");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await apiClient.get(`/gimnasio/planes-entrenamiento/${id}`);
                setPlan(data?.plan || null);
                setDias(data?.dias || []);
            } catch (error) {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el acceso a pizarra."), "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const semanasDisponibles = useMemo(
        () => [...new Set(dias.map((item) => Number(item.semana)).filter(Boolean))].sort((a, b) => a - b),
        [dias],
    );

    useEffect(() => {
        if (semanasDisponibles.length) {
            setSemanaActual((prev) => (semanasDisponibles.includes(prev) ? prev : semanasDisponibles[0]));
        }
    }, [semanasDisponibles]);

    const diasSemana = useMemo(
        () => dias.filter((item) => Number(item.semana) === Number(semanaActual)),
        [dias, semanaActual],
    );

    const diasDisponibles = useMemo(
        () => DAYS.filter((day) => diasSemana.some((item) => item.dia === day.value)),
        [diasSemana],
    );

    useEffect(() => {
        if (diasDisponibles.length) {
            setDiaSeleccionado((prev) => (diasDisponibles.some((day) => day.value === prev) ? prev : diasDisponibles[0].value));
        }
    }, [diasDisponibles]);

    const handleOpenTv = () => {
        window.open(`/entrenamiento/planes/${id}/pizarra?semana=${semanaActual}&dia=${diaSeleccionado}&vista=tv`, "_blank", "noopener,noreferrer");
    };

    const handleOpenPreview = () => {
        navigate(`/entrenamiento/planes/${id}/pizarra?semana=${semanaActual}&dia=${diaSeleccionado}&vista=detalle`);
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress color="warning" />
            </Box>
        );
    }

    if (!plan) {
        return (
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 4 }}>
                <Alert severity="error">No se encontró el plan solicitado.</Alert>
            </Paper>
        );
    }

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    p: 3,
                    background: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #374151 100%)",
                    color: "#ffffff",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(circle at top right, rgba(245,158,11,0.28), transparent 32%)",
                        pointerEvents: "none",
                    }}
                />
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
                    <Box>
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "14px",
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                }}
                            >
                                <TvRoundedIcon sx={{ color: "#fbbf24" }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                                    Acceso a pizarra
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.76)" }}>
                                    Elige semana y día antes de abrir la vista limpia para TV.
                                </Typography>
                            </Box>
                        </Stack>

                        <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                            {plan.nombre}
                        </Typography>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                            <Chip label={plan.tipo} sx={{ ...semanticChipSx("mustard"), color: "#111827" }} />
                            <Chip label={plan.alcance || "GRUPAL"} sx={semanticChipSx("success")} />
                            <Chip label={plan.estructura} sx={{ ...semanticChipSx("inventory"), color: "#ffffff", bgcolor: "rgba(59,130,246,0.2)" }} />
                        </Stack>
                    </Box>

                    <PremiumButton
                        variant="outline"
                        startIcon={<ArrowBackRoundedIcon />}
                        sx={{ bgcolor: "rgba(255,255,255,0.92)" }}
                        onClick={() => navigate(`/entrenamiento/planes/${id}/configuracion`)}
                    >
                        Volver
                    </PremiumButton>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>

                    <Stack spacing={3}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#0f172a", mb: 0.5 }}>
                                Selección previa
                            </Typography>
                            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                                Desde aquí eliges qué sesión se proyectará en la pantalla del gym.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
                            <Box sx={{ flex: 0.85 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                                    Semana activa
                                </Typography>
                                <FormControl size="small" sx={{ ...filterInputSx, width: "100%", mb: 2 }}>
                                    <Select value={semanaActual} onChange={(event) => setSemanaActual(Number(event.target.value))}>
                                        {semanasDisponibles.map((week) => (
                                            <MenuItem key={week} value={week}>
                                                Semana {week}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gap: 1.25,
                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                                    }}
                                >
                                    {DAYS.map((day) => {
                                        const enabled = diasDisponibles.some((item) => item.value === day.value);
                                        const active = diaSeleccionado === day.value;

                                        return (
                                            <Box
                                                key={day.value}
                                                onClick={() => enabled && setDiaSeleccionado(day.value)}
                                                sx={{
                                                    borderRadius: "16px",
                                                    px: 2,
                                                    py: 1.6,
                                                    border: `1px solid ${active ? "#111827" : enabled ? "rgba(245,158,11,0.38)" : "#e2e8f0"}`,
                                                    bgcolor: active ? "#111827" : enabled ? "rgba(245,158,11,0.08)" : "#f8fafc",
                                                    color: active ? "#fff" : enabled ? "#92400e" : "#94a3b8",
                                                    fontWeight: 800,
                                                    cursor: enabled ? "pointer" : "not-allowed",
                                                    transition: "all 180ms ease",
                                                }}
                                            >
                                                {enabled ? `${day.label} · listo` : day.label}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid #e2e8f0",
                                    bgcolor: "#f8fafc",
                                }}
                            >
                                <Stack spacing={1.5}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
                                        Vista a proyectar
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Chip label={plan.alcance || "GRUPAL"} sx={semanticChipSx("success")} />
                                        <Chip label={plan.tipo || "SIN TIPO"} sx={semanticChipSx("mustard")} />
                                        <Chip label={`Semana ${semanaActual}`} sx={semanticChipSx("inventory")} />
                                    </Stack>
                                    <Typography sx={{ fontSize: 15, color: "#334155" }}>
                                        <strong>Semana:</strong> {semanaActual}
                                    </Typography>
                                    <Typography sx={{ fontSize: 15, color: "#334155" }}>
                                        <strong>Día:</strong> {DAYS.find((day) => day.value === diaSeleccionado)?.label || diaSeleccionado}
                                    </Typography>
                                    <Typography sx={{ fontSize: 15, color: "#334155" }}>
                                        <strong>Días configurados esa semana:</strong> {diasSemana.length}
                                    </Typography>

                                    <Stack spacing={1}>
                                        <PremiumButton
                                            variant="guardar"
                                            startIcon={<PlayCircleOutlineRoundedIcon />}
                                            onClick={handleOpenTv}
                                            sx={{ mt: 1, alignSelf: "flex-start" }}
                                        >
                                            Abrir pizarra TV
                                        </PremiumButton>
                                        <PremiumButton
                                            variant="outline"
                                            startIcon={<GridViewRoundedIcon />}
                                            onClick={handleOpenPreview}
                                            sx={{ alignSelf: "flex-start" }}
                                        >
                                            Abrir vista previa detallada
                                        </PremiumButton>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Stack>

                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                            }}
                        >
                            {[
                                {
                                    icon: <FactCheckRoundedIcon sx={{ color: "#d97706" }} />,
                                    title: "1. Selección previa",
                                    text: "Primero eliges semana y día para no modificar la pantalla principal delante del grupo.",
                                },
                                {
                                    icon: <TvRoundedIcon sx={{ color: "#d97706" }} />,
                                    title: "2. Pantalla TV",
                                    text: "La vista TV está pensada para proyección limpia, rápida de leer y enfocada en el trabajo del día.",
                                },
                                {
                                    icon: <PlayCircleOutlineRoundedIcon sx={{ color: "#d97706" }} />,
                                    title: "3. Continuidad operativa",
                                    text: "Después el entrenador puede pasar a ejecución y registrar avances individuales o grupales.",
                                },
                            ].map((item) => (
                                <Paper
                                    key={item.title}
                                    elevation={0}
                                    sx={{
                                        ...pagePaperSx,
                                        p: 2.2,
                                        border: "1px solid #e5e7eb",
                                        bgcolor: "#fffdf9",
                                    }}
                                >
                                    <Stack spacing={1.1}>
                                        <Box
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: "14px",
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: "rgba(245,158,11,0.12)",
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Typography sx={{ fontWeight: 900, fontSize: 17, color: "#0f172a" }}>
                                            {item.title}
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                                            {item.text}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            ))}
                        </Box>
                    </Stack>

            </Paper>
        </Stack>
    );
}
