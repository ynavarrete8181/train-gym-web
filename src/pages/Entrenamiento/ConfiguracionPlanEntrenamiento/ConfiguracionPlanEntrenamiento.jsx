import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import PremiumModal from "../../../components/ui/PremiumModal";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { pagePaperSx } from "../../../modules/personas/personas.utils";
import { filterInputSx, modalFieldSx, semanticChipSx } from "../../../Styles/muiTheme";
import DayPlanEditor from "../PlanesEntrenamiento/components/DayPlanEditor";
import WeekDaySelector from "./components/WeekDaySelector";

const DAYS = [
    { value: "LUNES", label: "Lunes" },
    { value: "MARTES", label: "Martes" },
    { value: "MIERCOLES", label: "Miércoles" },
    { value: "JUEVES", label: "Jueves" },
    { value: "VIERNES", label: "Viernes" },
    { value: "SABADO", label: "Sábado" },
    { value: "DOMINGO", label: "Domingo" },
];

const getRecommendedDays = (estructura) => {
    if (estructura === "MENSUAL") return DAYS.slice(0, 5);
    if (estructura === "PERSONALIZADO") return DAYS;
    return DAYS.slice(0, 5);
};

const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const calculatePlanWeeks = (plan) => {
    if (!plan?.fecha_inicio || !plan?.fecha_fin) return 1;

    const start = parseLocalDate(plan.fecha_inicio);
    const end = parseLocalDate(plan.fecha_fin);

    if (!start || !end || end < start) return 1;

    const diffInDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (plan.estructura === "MENSUAL") {
        return Math.max(1, Math.ceil(diffInDays / 28));
    }

    return Math.max(1, Math.ceil(diffInDays / 7));
};

export default function ConfiguracionPlanEntrenamiento() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [plan, setPlan] = useState(null);
    const [dias, setDias] = useState([]);
    const [ejercicios, setEjercicios] = useState([]);
    const [semanaActual, setSemanaActual] = useState(1);
    const [diaSeleccionado, setDiaSeleccionado] = useState("LUNES");
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [semanaOrigenSeleccionada, setSemanaOrigenSeleccionada] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [{ data: planData }, { data: ejerciciosData }] = await Promise.all([
                apiClient.get(`/gimnasio/planes-entrenamiento/${id}`),
                apiClient.get("/gimnasio/ejercicios", {
                    params: { estado: "ACTIVO", limit: 500 },
                }),
            ]);

            setPlan(planData?.plan || null);
            setDias(planData?.dias || []);
            setEjercicios(ejerciciosData || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar la configuración del plan."), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const diasRecomendados = useMemo(
        () => getRecommendedDays(plan?.estructura),
        [plan?.estructura],
    );

    const semanasDisponibles = useMemo(
        () => Array.from({ length: calculatePlanWeeks(plan) }, (_, index) => index + 1),
        [plan],
    );

    useEffect(() => {
        if (!semanasDisponibles.includes(semanaActual)) {
            setSemanaActual(semanasDisponibles[0] || 1);
        }
    }, [semanaActual, semanasDisponibles]);

    const savedDaysMap = useMemo(
        () => dias.reduce((acc, item) => {
            acc[`${item.semana}-${item.dia}`] = item;
            return acc;
        }, {}),
        [dias],
    );

    const semanasConfiguradas = useMemo(
        () => [...new Set(dias.map((item) => Number(item.semana)).filter(Boolean))].sort((a, b) => a - b),
        [dias],
    );

    const sourceWeeks = useMemo(
        () => semanasConfiguradas.filter((week) => week !== semanaActual),
        [semanasConfiguradas, semanaActual],
    );

    const currentDay = savedDaysMap[`${semanaActual}-${diaSeleccionado}`] || null;

    const resumenSemana = useMemo(() => {
        const diasSemana = dias.filter((item) => item.semana === semanaActual);
        return {
            sesiones: diasSemana.length,
            bloques: diasSemana.reduce((acc, item) => acc + (item.bloques?.length || 0), 0),
            ejercicios: diasSemana.reduce(
                (acc, item) => acc + (item.bloques || []).reduce((sum, bloque) => sum + (bloque.ejercicios?.length || 0), 0),
                0,
            ),
        };
    }, [dias, semanaActual]);

    const handleSaveDay = async (payload) => {
        setSaving(true);
        try {
            await apiClient.post(`/gimnasio/planes-entrenamiento/${id}/dias/sync`, {
                semana: semanaActual,
                dia: diaSeleccionado,
                ...payload,
            });

            await fetchData();
            Swal.fire("Éxito", `${diaSeleccionado} de la semana ${semanaActual} se guardó correctamente.`, "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el día configurado."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicateWeek = async () => {
        if (!sourceWeeks.length) {
            Swal.fire("Sin semanas base", "Primero configura al menos otra semana para poder duplicarla.", "info");
            return;
        }
        setSemanaOrigenSeleccionada(String(sourceWeeks[0] || ""));
        setDuplicateModalOpen(true);
    };

    const confirmDuplicateWeek = async () => {
        if (!semanaOrigenSeleccionada) {
            Swal.fire("Falta seleccionar", "Selecciona una semana origen para duplicar.", "warning");
            return;
        }

        const destinoTieneDatos = dias.some((item) => Number(item.semana) === semanaActual);
        if (destinoTieneDatos) {
            const confirmOverwrite = await Swal.fire({
                title: "Sobrescribir semana destino",
                text: `La semana ${semanaActual} ya tiene días configurados. Se reemplazarán por la copia de la semana ${semanaOrigenSeleccionada}.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, reemplazar",
                cancelButtonText: "Cancelar",
            });

            if (!confirmOverwrite.isConfirmed) return;
        }

        setSaving(true);
        try {
            await apiClient.post(`/gimnasio/planes-entrenamiento/${id}/semanas/duplicar`, {
                semana_origen: Number(semanaOrigenSeleccionada),
                semana_destino: semanaActual,
            });

            await fetchData();
            setDuplicateModalOpen(false);
            Swal.fire("Éxito", `Se duplicó la semana ${semanaOrigenSeleccionada} hacia la semana ${semanaActual}.`, "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo duplicar la semana."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenBoard = () => {
        navigate(`/entrenamiento/planes/${id}/pizarra/acceso`);
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
            <PremiumModal
                open={duplicateModalOpen}
                onClose={() => setDuplicateModalOpen(false)}
                title="Duplicar semana"
                subtitle={`Copia una semana ya configurada hacia la semana ${semanaActual}.`}
                icon={<ContentCopyRoundedIcon sx={{ fontSize: 20, color: "#fff" }} />}
                maxWidth="sm"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setDuplicateModalOpen(false)}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={confirmDuplicateWeek} disabled={!semanaOrigenSeleccionada || saving}>
                            Duplicar
                        </PremiumButton>
                    </>
                }
            >
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Box>
                        <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                            Semana origen
                        </InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            value={semanaOrigenSeleccionada}
                            onChange={(event) => setSemanaOrigenSeleccionada(event.target.value)}
                            sx={modalFieldSx}
                        >
                            {sourceWeeks.map((week) => (
                                <MenuItem key={week} value={String(week)}>
                                    Semana {week}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                        Se copiarán días, bloques, ejercicios, series y transferencias a la semana {semanaActual}.
                    </Typography>
                </Box>
            </PremiumModal>

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
                                <FitnessCenterIcon sx={{ color: "#fbbf24" }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                                    {plan.nombre}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.76)" }}>
                                    Configuración premium del plan con estructura {String(plan.estructura || "SEMANAL").toLowerCase()}.
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip label={plan.tipo} sx={{ ...semanticChipSx("mustard"), color: "#111827" }} />
                            <Chip label={plan.alcance || "GRUPAL"} sx={semanticChipSx("success")} />
                            <Chip label={plan.estructura} sx={{ ...semanticChipSx("inventory"), color: "#ffffff", bgcolor: "rgba(59,130,246,0.2)" }} />
                            <Chip label={plan.estado} sx={{ ...semanticChipSx(plan.estado === "ACTIVO" ? "success" : "neutral") }} />
                        </Stack>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }}>
                        <PremiumButton
                            variant="outline"
                            startIcon={<TvRoundedIcon />}
                            sx={{ bgcolor: "rgba(255,255,255,0.92)" }}
                            onClick={handleOpenBoard}
                        >
                            Abrir pizarra
                        </PremiumButton>
                        <PremiumButton
                            variant="outline"
                            startIcon={<ContentCopyRoundedIcon />}
                            sx={{ bgcolor: "rgba(255,255,255,0.92)" }}
                            onClick={handleDuplicateWeek}
                            disabled={saving}
                        >
                            Duplicar semana
                        </PremiumButton>
                        <PremiumButton
                            variant="outline"
                            startIcon={<ArrowBackRoundedIcon />}
                            sx={{ bgcolor: "rgba(255,255,255,0.92)" }}
                            onClick={() => navigate("/entrenamiento/planes")}
                        >
                            Volver
                        </PremiumButton>
                    </Stack>
                </Stack>
            </Paper>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 0.95 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 0.5 }}>
                                Arquitectura del plan
                            </Typography>
                            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                                Aquí definimos la semana activa, el día a trabajar y el enfoque de construcción.
                            </Typography>
                        </Box>

                        <TextField
                            size="small"
                            label="Objetivo general"
                            value={plan.objetivo || ""}
                            disabled
                            sx={filterInputSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={filterInputSx}>
                            <Select value={semanaActual} onChange={(event) => setSemanaActual(Number(event.target.value))}>
                                {semanasDisponibles.map((week) => (
                                    <MenuItem key={week} value={week}>
                                        Semana {week}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <WeekDaySelector
                            days={diasRecomendados}
                            selectedDay={diaSeleccionado}
                            onSelect={setDiaSeleccionado}
                            savedDaysMap={diasRecomendados.reduce((acc, item) => {
                                acc[item.value] = savedDaysMap[`${semanaActual}-${item.value}`];
                                return acc;
                            }, {})}
                        />

                        <Box
                            sx={{
                                borderRadius: "18px",
                                border: "1px solid #e2e8f0",
                                bgcolor: "#f8fafc",
                                p: 2,
                            }}
                        >
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
                                <CalendarMonthRoundedIcon sx={{ color: "#f59e0b" }} />
                                <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                    Resumen de la semana {semanaActual}
                                </Typography>
                            </Stack>
                            <Stack spacing={1}>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                    Sesiones configuradas: <strong>{resumenSemana.sesiones}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                    Bloques registrados: <strong>{resumenSemana.bloques}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                    Ejercicios cargados: <strong>{resumenSemana.ejercicios}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                    Semanas esperadas por fechas: <strong>{semanasDisponibles.length}</strong>
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 2 }}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 0.5 }}>
                                Día en configuración: {DAYS.find((item) => item.value === diaSeleccionado)?.label || diaSeleccionado}
                            </Typography>
                            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                                Aquí cargamos bloques, ejercicios, series, repeticiones, porcentajes RM y transferencias como en la pizarra, pero estructurado.
                            </Typography>
                        </Box>

                        <DayPlanEditor
                            key={`${semanaActual}-${diaSeleccionado}-${currentDay?.id || "nuevo"}`}
                            dayName={`${DAYS.find((item) => item.value === diaSeleccionado)?.label || diaSeleccionado} · Semana ${semanaActual}`}
                            initialDay={currentDay}
                            ejercicios={ejercicios}
                            saving={saving}
                            onSave={handleSaveDay}
                            onCancel={() => navigate("/entrenamiento/planes")}
                        />
                    </Stack>
                </Paper>
            </Stack>
        </Stack>
    );
}
