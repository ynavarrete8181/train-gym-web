import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
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

const formatSeconds = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return `${value} seg`;
};

const formatMeters = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return `${value} m`;
};

const formatSeriesLine = (serie) => {
    const items = [];
    if (serie.repeticiones) items.push(`${serie.repeticiones} reps`);
    if (serie.tiempo_segundos !== null && serie.tiempo_segundos !== undefined) items.push(`${serie.tiempo_segundos} seg`);
    if (serie.distancia_metros !== null && serie.distancia_metros !== undefined) items.push(`${serie.distancia_metros} m`);
    if (serie.descanso_segundos !== null && serie.descanso_segundos !== undefined) items.push(`descanso ${serie.descanso_segundos} seg`);
    if (serie.rpe !== null && serie.rpe !== undefined && serie.rpe !== "") items.push(`RPE ${serie.rpe}`);
    if (serie.tempo) items.push(`tempo ${serie.tempo}`);
    if (serie.carga_fija !== null && serie.carga_fija !== undefined && serie.carga_fija !== "") {
        items.push(`carga ${serie.carga_fija}${serie.unidad_carga ? ` ${serie.unidad_carga}` : ""}`);
    } else if (serie.porcentaje_rm !== null && serie.porcentaje_rm !== undefined && serie.porcentaje_rm !== "") {
        items.push(`${serie.porcentaje_rm}% RM`);
    }
    return items.join(" · ");
};

const getDayLabel = (value) => DAYS.find((item) => item.value === value)?.label || value;

export default function PizarraPlanEntrenamiento() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [dias, setDias] = useState([]);
    const [semanaActual, setSemanaActual] = useState(Number(searchParams.get("semana") || 1));
    const [diaSeleccionado, setDiaSeleccionado] = useState(searchParams.get("dia") || "LUNES");
    const [viewMode, setViewMode] = useState(searchParams.get("vista") === "detalle" ? "detalle" : "tv");
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchBoard = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const { data } = await apiClient.get(`/gimnasio/planes-entrenamiento/${id}`);
            setPlan(data?.plan || null);
            setDias(data?.dias || []);
            setLastUpdated(new Date());
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar la pizarra del plan."), "error");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
    }, [id]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchBoard({ silent: true });
        }, 60000);
        return () => clearInterval(interval);
    }, [id]);

    const semanasDisponibles = useMemo(
        () => [...new Set(dias.map((item) => Number(item.semana)).filter(Boolean))].sort((a, b) => a - b),
        [dias],
    );

    useEffect(() => {
        if (semanasDisponibles.length && !semanasDisponibles.includes(semanaActual)) {
            setSemanaActual(semanasDisponibles[0]);
        }
    }, [semanasDisponibles, semanaActual]);

    const diasSemana = useMemo(
        () => dias.filter((item) => Number(item.semana) === Number(semanaActual)),
        [dias, semanaActual],
    );

    const diasDisponiblesSemana = useMemo(
        () => DAYS.filter((day) => diasSemana.some((item) => item.dia === day.value)),
        [diasSemana],
    );

    useEffect(() => {
        if (diasDisponiblesSemana.length && !diasDisponiblesSemana.some((day) => day.value === diaSeleccionado)) {
            setDiaSeleccionado(diasDisponiblesSemana[0].value);
        }
    }, [diasDisponiblesSemana, diaSeleccionado]);

    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("semana", String(semanaActual));
        nextParams.set("dia", diaSeleccionado);
        nextParams.set("vista", viewMode);
        setSearchParams(nextParams, { replace: true });
    }, [semanaActual, diaSeleccionado, viewMode]);

    const currentDay = useMemo(
        () => dias.find((item) => Number(item.semana) === Number(semanaActual) && item.dia === diaSeleccionado) || null,
        [dias, semanaActual, diaSeleccionado],
    );

    const totalExercises = useMemo(
        () => (currentDay?.bloques || []).reduce((acc, bloque) => acc + (bloque.ejercicios?.length || 0), 0),
        [currentDay],
    );

    const totalSeries = useMemo(
        () => (currentDay?.bloques || []).reduce(
            (acc, bloque) => acc + (bloque.ejercicios || []).reduce((sum, ejercicio) => sum + (ejercicio.series?.length || 0), 0),
            0,
        ),
        [currentDay],
    );

    const compactExercises = useMemo(
        () => (currentDay?.bloques || []).flatMap((bloque) =>
            (bloque.ejercicios || []).map((ejercicio) => ({ ...ejercicio, bloque_nombre: bloque.nombre, bloque_tipo: bloque.tipo_bloque })),
        ),
        [currentDay],
    );

    const handleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.();
        } else {
            await document.exitFullscreen?.();
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1120" }}>
                <CircularProgress color="warning" />
            </Box>
        );
    }

    if (!plan) {
        return (
            <Box sx={{ minHeight: "100vh", p: 4, bgcolor: "#0b1120" }}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 4 }}>
                    <Alert severity="error">No se encontró el plan solicitado.</Alert>
                </Paper>
            </Box>
        );
    }

    const renderTvCard = (ejercicio) => (
        <Paper
            key={ejercicio.id}
            elevation={0}
            sx={{
                p: 1.4,
                borderRadius: "18px",
                border: "1px solid #dbe2ea",
                bgcolor: "#f8fafc",
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            <Stack spacing={1}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: 16, xl: 18 },
                                color: "#0f172a",
                                lineHeight: 1.1,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {ejercicio.orden}. {ejercicio.ejercicio_nombre}
                        </Typography>
                        {ejercicio.observaciones && (
                            <Typography
                                sx={{
                                    mt: 0.45,
                                    fontSize: 12,
                                    color: "#64748b",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {ejercicio.observaciones}
                            </Typography>
                        )}
                    </Box>
                    <Chip label={ejercicio.bloque_tipo || "BLOQUE"} sx={{ ...semanticChipSx("mustard"), flexShrink: 0 }} />
                </Stack>

                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {(ejercicio.series || []).map((serie) => (
                        <Chip
                            key={serie.id}
                            label={`S${serie.numero_serie}: ${formatSeriesLine(serie) || "Libre"}`}
                            sx={{
                                ...semanticChipSx("neutral"),
                                maxWidth: "100%",
                                "& .MuiChip-label": {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                },
                            }}
                        />
                    ))}
                </Stack>

                {(ejercicio.transferencias || []).length > 0 && (
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        {(ejercicio.transferencias || []).map((transferencia) => (
                            <Chip
                                key={transferencia.id}
                                icon={<SwapHorizRoundedIcon />}
                                label={transferencia.ejercicio_nombre}
                                sx={{ ...semanticChipSx("inventory"), maxWidth: "100%" }}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #0b1120 0%, #111827 45%, #172033 100%)",
                p: { xs: 1.5, md: 2 },
                overflow: viewMode === "tv" ? "hidden" : "auto",
            }}
        >
            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        ...pagePaperSx,
                        p: { xs: 1.75, md: 2.25 },
                        background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(17,24,39,0.96) 24%, rgba(15,23,42,1) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                    }}
                >
                    <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} justifyContent="space-between">
                        <Box>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.9 }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "14px",
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <TvRoundedIcon sx={{ color: "#fbbf24", fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 900, lineHeight: 1 }}>
                                        Pizarra de entrenamiento
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12, mt: 0.3 }}>
                                        Vista para TV, proyector o monitor del área de trabajo.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
                                <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 900 }}>
                                    {plan.nombre}
                                </Typography>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip label={plan.tipo || "SIN TIPO"} sx={{ ...semanticChipSx("mustard"), color: "#111827" }} />
                                    <Chip label={plan.estructura || "SEMANAL"} sx={{ ...semanticChipSx("inventory"), color: "#fff", bgcolor: "rgba(99,102,241,0.2)" }} />
                                    <Chip label={plan.alcance || "GRUPAL"} sx={semanticChipSx("success")} />
                                    <Chip label={plan.estado || "BORRADOR"} sx={{ ...semanticChipSx(plan.estado === "ACTIVO" ? "success" : "neutral") }} />
                                </Stack>
                            </Stack>
                        </Box>

                        <Stack spacing={0.9} alignItems={{ xs: "stretch", md: "flex-end" }}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <PremiumButton variant="outline" startIcon={<RefreshRoundedIcon />} onClick={() => fetchBoard()}>
                                    Actualizar
                                </PremiumButton>
                                <PremiumButton
                                    variant="outline"
                                    startIcon={viewMode === "tv" ? <ViewAgendaRoundedIcon /> : <GridViewRoundedIcon />}
                                    onClick={() => setViewMode((prev) => prev === "tv" ? "detalle" : "tv")}
                                >
                                    {viewMode === "tv" ? "Vista detallada" : "Vista TV"}
                                </PremiumButton>
                                {viewMode === "tv" && (
                                    <PremiumButton
                                        variant="outline"
                                        startIcon={<TvRoundedIcon />}
                                        onClick={() => navigate(`/entrenamiento/planes/${id}/pizarra/acceso`)}
                                    >
                                        Cambiar sesión
                                    </PremiumButton>
                                )}
                                <PremiumButton variant="outline" startIcon={<OpenInFullRoundedIcon />} onClick={handleFullscreen}>
                                    Pantalla completa
                                </PremiumButton>
                                <PremiumButton variant="outline" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(`/entrenamiento/planes/${id}/configuracion`)}>
                                    Volver
                                </PremiumButton>
                            </Stack>
                            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.68)" }}>
                                Última actualización: {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--"}
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>

                {viewMode === "tv" ? (
                    <Stack spacing={1.6} sx={{ minHeight: "calc(100vh - 180px)" }}>
                        {!currentDay ? (
                            <Paper elevation={0} sx={{ ...pagePaperSx, p: 4, bgcolor: "rgba(255,255,255,0.98)" }}>
                                <Alert severity="info">
                                    La semana {semanaActual} todavía no tiene configurado el día {getDayLabel(diaSeleccionado)}.
                                </Alert>
                            </Paper>
                        ) : (
                            <>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        ...pagePaperSx,
                                        p: 1.8,
                                        bgcolor: "rgba(255,255,255,0.98)",
                                    }}
                                >
                                    <Stack direction={{ xs: "column", xl: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xl: "center" }}>
                                        <Box>
                                            <Typography sx={{ fontSize: { xs: 26, xl: 32 }, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                                                {getDayLabel(diaSeleccionado)} · Semana {semanaActual}
                                            </Typography>
                                            <Typography sx={{ fontSize: 14, color: "#64748b", mt: 0.45 }}>
                                                {currentDay?.nombre_sesion || `Sesión de ${getDayLabel(diaSeleccionado)}`}
                                            </Typography>
                                            {currentDay?.observaciones && (
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: "#334155",
                                                        mt: 0.6,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {currentDay.observaciones}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            <Chip label={`${currentDay?.bloques?.length || 0} bloques`} sx={semanticChipSx("neutral")} />
                                            <Chip label={`${totalExercises} ejercicios`} sx={semanticChipSx("success")} />
                                            <Chip label={`${totalSeries} series`} sx={semanticChipSx("inventory")} />
                                            {(currentDay.bloques || []).map((bloque) => (
                                                <Chip
                                                    key={bloque.id}
                                                    label={`Bloque ${bloque.orden}: ${bloque.nombre}`}
                                                    sx={semanticChipSx("mustard")}
                                                />
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Paper>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gap: 1.2,
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "repeat(2, minmax(0, 1fr))",
                                            xl: totalExercises >= 7 ? "repeat(4, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
                                        },
                                        alignItems: "stretch",
                                    }}
                                >
                                    {compactExercises.map(renderTvCard)}
                                </Box>
                            </>
                        )}
                    </Stack>
                ) : (
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
                        <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, minWidth: { lg: 300 }, bgcolor: "rgba(255,255,255,0.98)" }}>
                            <Stack spacing={2.25}>
                                <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
                                    Selector de pizarra
                                </Typography>

                                <FormControl size="small" sx={filterInputSx}>
                                    <Select value={semanaActual} onChange={(event) => setSemanaActual(Number(event.target.value))}>
                                        {semanasDisponibles.map((week) => (
                                            <MenuItem key={week} value={week}>
                                                Semana {week}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Stack spacing={1} useFlexGap>
                                    {DAYS.map((day) => {
                                        const enabled = diasSemana.some((item) => item.dia === day.value);
                                        const active = diaSeleccionado === day.value;
                                        return (
                                            <Box
                                                key={day.value}
                                                onClick={() => enabled && setDiaSeleccionado(day.value)}
                                                sx={{
                                                    borderRadius: "14px",
                                                    px: 1.6,
                                                    py: 1.35,
                                                    cursor: enabled ? "pointer" : "not-allowed",
                                                    border: `1px solid ${active ? "#111827" : enabled ? "rgba(245,158,11,0.38)" : "#e2e8f0"}`,
                                                    bgcolor: active ? "#111827" : enabled ? "rgba(245,158,11,0.1)" : "#f8fafc",
                                                    color: active ? "#fff" : enabled ? "#92400e" : "#94a3b8",
                                                    fontWeight: 800,
                                                    transition: "all 180ms ease",
                                                }}
                                            >
                                                {enabled ? `${day.label} · listo` : day.label}
                                            </Box>
                                        );
                                    })}
                                </Stack>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: "18px",
                                        p: 2,
                                        bgcolor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                            Resumen visible
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                            Día actual: <strong>{getDayLabel(diaSeleccionado)}</strong>
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                            Bloques: <strong>{currentDay?.bloques?.length || 0}</strong>
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                            Ejercicios: <strong>{totalExercises}</strong>
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Paper>

                        <Stack spacing={3} sx={{ flex: 1 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    ...pagePaperSx,
                                    p: { xs: 2.25, md: 3 },
                                    bgcolor: "rgba(255,255,255,0.98)",
                                }}
                            >
                                <Stack direction={{ xs: "column", xl: "row" }} spacing={2} justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                                            {getDayLabel(diaSeleccionado)} · Semana {semanaActual}
                                        </Typography>
                                        <Typography sx={{ fontSize: 15, color: "#64748b", mt: 0.9 }}>
                                            {currentDay?.nombre_sesion || `Sesión de ${getDayLabel(diaSeleccionado)}`}
                                        </Typography>
                                        {currentDay?.observaciones && (
                                            <Typography sx={{ fontSize: 14, color: "#334155", mt: 1.25 }}>
                                                {currentDay.observaciones}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="flex-start">
                                        <Chip label={`${currentDay?.bloques?.length || 0} bloques`} sx={semanticChipSx("neutral")} />
                                        <Chip label={`${totalExercises} ejercicios`} sx={semanticChipSx("success")} />
                                    </Stack>
                                </Stack>
                            </Paper>

                            {!currentDay ? (
                                <Paper elevation={0} sx={{ ...pagePaperSx, p: 4, bgcolor: "rgba(255,255,255,0.98)" }}>
                                    <Alert severity="info">
                                        La semana {semanaActual} todavía no tiene configurado el día {getDayLabel(diaSeleccionado)}.
                                    </Alert>
                                </Paper>
                            ) : (
                                <Stack spacing={2.5}>
                                    {(currentDay.bloques || []).map((bloque) => (
                                        <Paper
                                            key={bloque.id}
                                            elevation={0}
                                            sx={{
                                                ...pagePaperSx,
                                                p: { xs: 2.2, md: 2.8 },
                                                bgcolor: "rgba(255,255,255,0.98)",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <Stack spacing={2.25}>
                                                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                                                    <Box>
                                                        <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900, color: "#0f172a" }}>
                                                            Bloque {bloque.orden}: {bloque.nombre}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                                                            {bloque.tipo_bloque && <Chip label={bloque.tipo_bloque} sx={semanticChipSx("mustard")} />}
                                                            <Chip label={`${bloque.ejercicios?.length || 0} ejercicios`} sx={semanticChipSx("inventory")} />
                                                        </Stack>
                                                    </Box>
                                                    {bloque.observaciones && (
                                                        <Typography sx={{ fontSize: 14, color: "#475569", maxWidth: 360 }}>
                                                            {bloque.observaciones}
                                                        </Typography>
                                                    )}
                                                </Stack>

                                                <Stack spacing={2}>
                                                    {(bloque.ejercicios || []).map((ejercicio) => (
                                                        <Paper
                                                            key={ejercicio.id}
                                                            elevation={0}
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: "20px",
                                                                border: "1px solid #e2e8f0",
                                                                bgcolor: "#f8fafc",
                                                            }}
                                                        >
                                                            <Stack spacing={1.6}>
                                                                <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} justifyContent="space-between">
                                                                    <Box>
                                                                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                                            <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 22 }, color: "#0f172a" }}>
                                                                                {ejercicio.orden}. {ejercicio.ejercicio_nombre}
                                                                            </Typography>
                                                                            {ejercicio.lado && <Chip label={`Lado: ${ejercicio.lado}`} sx={semanticChipSx("neutral")} />}
                                                                            {ejercicio.usa_rm && <Chip label="Usa RM" sx={semanticChipSx("success")} />}
                                                                        </Stack>
                                                                        {ejercicio.observaciones && (
                                                                            <Typography sx={{ fontSize: 14, color: "#475569", mt: 0.8 }}>
                                                                                {ejercicio.observaciones}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>

                                                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-start">
                                                                        {ejercicio.tempo && <Chip icon={<TimerOutlinedIcon />} label={`Tempo ${ejercicio.tempo}`} sx={semanticChipSx("inventory")} />}
                                                                        {formatSeconds(ejercicio.descanso_segundos) && (
                                                                            <Chip icon={<TimerOutlinedIcon />} label={`Descanso ${formatSeconds(ejercicio.descanso_segundos)}`} sx={semanticChipSx("mustard")} />
                                                                        )}
                                                                        {ejercicio.rpe_objetivo !== null && ejercicio.rpe_objetivo !== undefined && (
                                                                            <Chip label={`RPE ${ejercicio.rpe_objetivo}`} sx={semanticChipSx("success")} />
                                                                        )}
                                                                    </Stack>
                                                                </Stack>

                                                                <Box
                                                                    sx={{
                                                                        display: "grid",
                                                                        gap: 1.25,
                                                                        gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
                                                                    }}
                                                                >
                                                                    {(ejercicio.series || []).map((serie) => (
                                                                        <Box
                                                                            key={serie.id}
                                                                            sx={{
                                                                                borderRadius: "16px",
                                                                                px: 1.5,
                                                                                py: 1.2,
                                                                                bgcolor: "#ffffff",
                                                                                border: "1px solid #e2e8f0",
                                                                            }}
                                                                        >
                                                                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                                                <Chip icon={<RepeatRoundedIcon />} label={`Serie ${serie.numero_serie}`} sx={semanticChipSx("neutral")} />
                                                                                {serie.distancia_metros !== null && serie.distancia_metros !== undefined && (
                                                                                    <Chip icon={<StraightenRoundedIcon />} label={formatMeters(serie.distancia_metros)} sx={semanticChipSx("inventory")} />
                                                                                )}
                                                                                <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
                                                                                    {formatSeriesLine(serie) || "Serie libre"}
                                                                                </Typography>
                                                                            </Stack>
                                                                        </Box>
                                                                    ))}
                                                                </Box>

                                                                {(ejercicio.transferencias || []).length > 0 && (
                                                                    <Box
                                                                        sx={{
                                                                            borderRadius: "18px",
                                                                            p: 1.6,
                                                                            border: "1px dashed rgba(245,158,11,0.45)",
                                                                            bgcolor: "rgba(245,158,11,0.07)",
                                                                        }}
                                                                    >
                                                                        <Stack spacing={1.15}>
                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                <SwapHorizRoundedIcon sx={{ color: "#d97706", fontSize: 20 }} />
                                                                                <Typography sx={{ fontWeight: 900, color: "#92400e" }}>
                                                                                    Transferencias
                                                                                </Typography>
                                                                            </Stack>

                                                                            {(ejercicio.transferencias || []).map((transferencia) => (
                                                                                <Box key={transferencia.id}>
                                                                                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#78350f" }}>
                                                                                        {transferencia.orden}. {transferencia.ejercicio_nombre}
                                                                                    </Typography>
                                                                                    {transferencia.observaciones && (
                                                                                        <Typography sx={{ fontSize: 13, color: "#92400e", mt: 0.4 }}>
                                                                                            {transferencia.observaciones}
                                                                                        </Typography>
                                                                                    )}
                                                                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.9 }}>
                                                                                        {(transferencia.series || []).map((serie) => (
                                                                                            <Chip
                                                                                                key={serie.id}
                                                                                                label={`Serie ${serie.numero_serie}: ${formatSeriesLine(serie) || "libre"}`}
                                                                                                sx={semanticChipSx("mustard")}
                                                                                            />
                                                                                        ))}
                                                                                    </Stack>
                                                                                </Box>
                                                                            ))}
                                                                        </Stack>
                                                                    </Box>
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
