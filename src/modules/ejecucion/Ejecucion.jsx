import { useEffect, useState } from "react";
import {
    Box,
    Chip,
    Paper,
    Stack,
    TextField,
    Typography,
    Autocomplete,
    Fade,
    InputAdornment,
    MenuItem,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import Swal from "sweetalert2";

import PageHeader from "../../components/ui/PageHeader";
import { semanticChipSx, filterInputSx } from "../../Styles/muiTheme";
import { apiClient } from "../../services/apiClient";
import PremiumModal from "../../components/ui/PremiumModal";
import { pagePaperSx } from "../personas/personas.utils";

const metricCardSx = {
    ...pagePaperSx,
    p: 2.2,
    minHeight: 110,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
};

const formatCompact = (value) => {
    const numeric = Number(value || 0);
    if (numeric >= 1000) return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1)}k`;
    return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
};

const getComplianceColor = (value) => {
    const numeric = Number(value || 0);
    if (numeric >= 90) return "#10b981";
    if (numeric >= 70) return "#f59e0b";
    return "#ef4444";
};

const formatLoadReps = (load, reps) => {
    const loadNumber = Number(load || 0);
    const loadText = loadNumber > 0 ? `${formatCompact(loadNumber)} kg` : "Libre";
    return `${loadText} x ${formatCompact(reps)} reps`;
};

const MetricBar = ({ label, value, max, color }) => {
    const width = `${Math.max(3, Math.min(100, (Number(value || 0) / Math.max(Number(max || 0), 1)) * 100))}%`;

    return (
        <Box sx={{ display: "grid", gap: 0.5 }}>
            <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>{label}</Typography>
                <Typography sx={{ fontSize: 11, color: "#0f172a", fontWeight: 900 }}>{formatCompact(value)} reps</Typography>
            </Stack>
            <Box sx={{ height: 9, borderRadius: 999, bgcolor: "#e2e8f0", overflow: "hidden" }}>
                <Box sx={{ width, height: "100%", borderRadius: 999, bgcolor: color }} />
            </Box>
        </Box>
    );
};

const getMonthLabel = (date) => {
    if (!date) return null;
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

const buildMonthlyReport = (weeks) => {
    const months = {};

    weeks.forEach((week) => {
        (week.exercises || []).forEach((exercise) => {
            const label = getMonthLabel(exercise.date);
            if (!label) return;
            if (!months[label]) {
                months[label] = {
                    label,
                    week: null,
                    plannedReps: 0,
                    actualReps: 0,
                    plannedVolume: 0,
                    actualVolume: 0,
                    exercises: [],
                };
            }

            months[label].plannedReps += Number(exercise.plannedReps || 0);
            months[label].actualReps += Number(exercise.actualReps || 0);
            months[label].plannedVolume += Number(exercise.plannedVolume || 0);
            months[label].actualVolume += Number(exercise.actualVolume || 0);
            months[label].exercises.push(exercise);
        });
    });

    return Object.values(months).map((month) => ({
        ...month,
        plannedReps: Math.round(month.plannedReps),
        actualReps: Math.round(month.actualReps),
        plannedVolume: Number(month.plannedVolume.toFixed(1)),
        actualVolume: Number(month.actualVolume.toFixed(1)),
        compliance: month.plannedReps > 0 ? Math.round((month.actualReps / month.plannedReps) * 100) : 0,
    }));
};

const ReporteSecuenciasPanel = ({ data, filter, onFilterChange, onSelectWeek, onExplain }) => {
    if (!data) return null;

    const weeks = Array.isArray(data.weeks) ? data.weeks : [];
    const months = buildMonthlyReport(weeks);
    const visibleItems = filter === "mes"
        ? months
        : filter.startsWith("semana_")
            ? weeks.filter((week) => Number(week.week) === Number(filter.replace("semana_", "")))
            : weeks;
    const maxReps = Math.max(...visibleItems.flatMap((item) => [Number(item.plannedReps || 0), Number(item.actualReps || 0)]), 1);
    const visibleTotals = visibleItems.reduce((acc, item) => {
        acc.plannedReps += Number(item.plannedReps || 0);
        acc.actualReps += Number(item.actualReps || 0);
        acc.plannedVolume += Number(item.plannedVolume || 0);
        acc.actualVolume += Number(item.actualVolume || 0);
        return acc;
    }, { plannedReps: 0, actualReps: 0, plannedVolume: 0, actualVolume: 0 });
    const visibleCompliance = visibleTotals.plannedReps > 0 ? Math.round((visibleTotals.actualReps / visibleTotals.plannedReps) * 100) : 0;
    const filterOptions = [
        ...weeks.map((week) => ({ value: `semana_${week.week}`, label: week.label })),
        { value: "mes", label: "Mes" },
        { value: "plan", label: "Todo el plan" },
    ];

    return (
        <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
                    <Box>
                        <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>Reporte de Peso y Repeticiones</Typography>
                        <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Plan vs Secuencia para seguimiento de administrador y coach</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Box
                            onClick={() => onExplain({ totals: visibleTotals, compliance: visibleCompliance, filter, items: visibleItems })}
                            sx={{
                                px: 1.4,
                                py: 0.7,
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                color: "#475569",
                                fontSize: 12,
                                fontWeight: 900,
                                cursor: "pointer",
                                "&:hover": { borderColor: "#f0b400", color: "#0f172a", bgcolor: "#fffaf0" },
                            }}
                        >
                            Explicar reporte
                        </Box>
                        <Chip
                            label={`${visibleCompliance || 0}% cumplimiento`}
                            size="small"
                            sx={{ ...semanticChipSx((visibleCompliance || 0) >= 90 ? "success" : (visibleCompliance || 0) >= 70 ? "mustard" : "danger"), fontWeight: 900 }}
                        />
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {filterOptions.map((option) => {
                        const active = filter === option.value;
                        return (
                            <Box
                                key={option.value}
                                onClick={() => onFilterChange(option.value)}
                                sx={{
                                    px: 1.5,
                                    py: 0.8,
                                    borderRadius: "8px",
                                    border: active ? "1px solid #f0b400" : "1px solid #e2e8f0",
                                    bgcolor: active ? "rgba(240, 180, 0, 0.12)" : "#ffffff",
                                    color: active ? "#0f172a" : "#64748b",
                                    fontSize: 12,
                                    fontWeight: 900,
                                    cursor: "pointer",
                                }}
                            >
                                {option.label}
                            </Box>
                        );
                    })}
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
                    {[
                        { label: "Secuencia", value: `${formatCompact(visibleTotals.actualReps)} reps`, color: "#ef4444" },
                        { label: "Plan reps", value: `${formatCompact(visibleTotals.plannedReps)} reps`, color: "#10b981" },
                        { label: "Volumen", value: `${formatCompact(visibleTotals.actualVolume)} kg`, color: "#3b82f6" },
                        { label: "Vol. plan", value: `${formatCompact(visibleTotals.plannedVolume)} kg`, color: "#8b5cf6" },
                    ].map((metric) => (
                        <Box key={metric.label} sx={{ p: 1.5, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: metric.color }} />
                                <Box>
                                    <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>{metric.label}</Typography>
                                    <Typography sx={{ fontSize: 16, color: "#0f172a", fontWeight: 950 }}>{metric.value}</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    ))}
                </Box>

                {visibleItems.length > 0 ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, 1fr)" }, gap: 1.5 }}>
                        {visibleItems.map((week) => {
                            const compliance = Number(week.compliance || 0);
                            return (
                                <Paper
                                    key={week.label}
                                    elevation={0}
                                    onClick={() => onSelectWeek(week)}
                                    sx={{
                                        p: 1.8,
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        cursor: "pointer",
                                        transition: "0.18s ease",
                                        "&:hover": { borderColor: "#f0b400", boxShadow: "0 12px 30px rgba(15,23,42,0.08)" },
                                    }}
                                >
                                    <Stack spacing={1.3}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{week.label}</Typography>
                                            <Typography sx={{ fontSize: 14, color: getComplianceColor(compliance), fontWeight: 950 }}>{compliance}%</Typography>
                                        </Stack>
                                        <MetricBar label="Plan" value={week.plannedReps} max={maxReps} color="#10b981" />
                                        <MetricBar label="Secuencia" value={week.actualReps} max={maxReps} color="#ef4444" />
                                        <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>
                                            {week.exercises?.length || 0} ejercicios · clic para ver series
                                        </Typography>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                    <Box sx={{ p: 3, borderRadius: "8px", bgcolor: "#f8fafc", textAlign: "center" }}>
                        <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>Aún no hay datos de secuencia para este plan.</Typography>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
};

const ReporteExplicacionModal = ({ open, data, onClose }) => {
    const totals = data?.totals || {};
    const compliance = Number(data?.compliance || 0);
    const items = Array.isArray(data?.items) ? data.items : [];
    const plannedReps = Number(totals.plannedReps || 0);
    const actualReps = Number(totals.actualReps || 0);
    const plannedVolume = Number(totals.plannedVolume || 0);
    const actualVolume = Number(totals.actualVolume || 0);
    const pendingReps = Math.max(plannedReps - actualReps, 0);
    const filterLabel = data?.filter === "mes"
        ? "el mes seleccionado"
        : data?.filter === "plan"
            ? "todo el plan"
            : items[0]?.label || "la semana seleccionada";

    const interpretation = compliance >= 90
        ? "El cliente esta cumpliendo casi todo lo programado."
        : compliance >= 70
            ? "El cliente tiene un avance aceptable, pero aun hay repeticiones pendientes."
            : "El cliente esta por debajo de lo planificado y conviene revisar asistencia, fatiga o adherencia.";

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title="Como leer este reporte"
            subtitle="Plan vs Secuencia para administrador y coach"
            icon={<RuleFolderRoundedIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
        >
            <Stack spacing={2}>
                <Box sx={{ p: 1.8, borderRadius: "8px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 950, color: "#0f172a", mb: 0.6 }}>
                        Lectura actual: {filterLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 750, color: "#475569", lineHeight: 1.7 }}>
                        Este reporte compara lo que el entrenador programo en el plan contra lo que el cliente registro realmente en su secuencia de entrenamiento.
                    </Typography>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.2 }}>
                    {[
                        { title: "Plan reps", value: `${formatCompact(plannedReps)} reps`, text: "Total de repeticiones que estaban programadas.", color: "#10b981" },
                        { title: "Secuencia", value: `${formatCompact(actualReps)} reps`, text: "Total de repeticiones que el cliente ejecuto y registro.", color: "#ef4444" },
                        { title: "Cumplimiento", value: `${compliance}%`, text: `Equivale a ${formatCompact(actualReps)} de ${formatCompact(plannedReps)} reps.`, color: getComplianceColor(compliance) },
                        { title: "Pendiente", value: `${formatCompact(pendingReps)} reps`, text: "Diferencia entre lo planificado y lo ejecutado.", color: "#f59e0b" },
                    ].map((item) => (
                        <Box key={item.title} sx={{ p: 1.6, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
                            <Stack direction="row" spacing={1.1} alignItems="flex-start">
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color, mt: 0.6 }} />
                                <Box>
                                    <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 950, textTransform: "uppercase" }}>{item.title}</Typography>
                                    <Typography sx={{ fontSize: 18, color: "#0f172a", fontWeight: 950 }}>{item.value}</Typography>
                                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 750, lineHeight: 1.5 }}>{item.text}</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ p: 1.8, borderRadius: "8px", bgcolor: "#fffaf0", border: "1px solid #fde68a" }}>
                    <Typography sx={{ fontSize: 13, color: "#92400e", fontWeight: 950, mb: 0.6 }}>Interpretacion</Typography>
                    <Typography sx={{ fontSize: 13, color: "#78350f", fontWeight: 750, lineHeight: 1.7 }}>
                        {interpretation} Si una semana aparece en 0%, significa que no hay secuencias registradas para esa parte del plan.
                    </Typography>
                </Box>

                <Box sx={{ p: 1.8, borderRadius: "8px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 950, mb: 0.8 }}>Sobre el volumen</Typography>
                    <Typography sx={{ fontSize: 13, color: "#475569", fontWeight: 750, lineHeight: 1.7 }}>
                        Volumen significa carga x repeticiones. Si aparece 0 kg, normalmente es porque el ejercicio fue registrado como peso libre, sin carga en kg, o porque el plan no tiene carga fija definida.
                    </Typography>
                </Box>

                <Box sx={{ p: 1.8, borderRadius: "8px", bgcolor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 950, mb: 0.8 }}>Como usarlo para seguimiento</Typography>
                    <Stack spacing={0.8}>
                        {[
                            "Semana: sirve para revisar el avance puntual de una semana del plan.",
                            "Mes: agrupa las secuencias registradas dentro del mes.",
                            "Todo el plan: muestra el cumplimiento general del cliente.",
                            "Al abrir una tarjeta se ven ejercicios y series: Plan vs Secuencia por cada serie.",
                        ].map((text) => (
                            <Typography key={text} sx={{ fontSize: 13, color: "#475569", fontWeight: 750, lineHeight: 1.5 }}>
                                {text}
                            </Typography>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </PremiumModal>
    );
};

export default function Ejecucion() {
    const [personas, setPersonas] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);
    const [reporteSecuencias, setReporteSecuencias] = useState(null);
    const [filtroReporte, setFiltroReporte] = useState("plan");
    const [detalleReporte, setDetalleReporte] = useState({ open: false, week: null, exercise: null });
    const [explicacionReporte, setExplicacionReporte] = useState({ open: false, data: null });

    const fetchPersonas = async () => {
        try {
            const { data } = await apiClient.get("/gimnasio/personas?cliente=true");
            setPersonas(data || []);
        } catch (error) {
            Swal.fire("Error", "No se pudieron cargar los clientes.", "error");
        }
    };

    const fetchPlanesPorCliente = async () => {
        try {
            const { data } = await apiClient.get("/gimnasio/ejecucion/planes");
            const planesDelCliente = (data || []).filter(p => p.cedula === clienteSeleccionado?.cedula || p.destino?.includes(clienteSeleccionado?.nombres));
            setPlanes(planesDelCliente);
            if (planesDelCliente.length > 0) {
                setPlanSeleccionado(planesDelCliente[0]);
            } else {
                setPlanSeleccionado(null);
                setReporteSecuencias(null);
            }
        } catch (error) {
            Swal.fire("Error", "No se pudieron cargar los planes del cliente.", "error");
        }
    };

    const fetchReporteSecuencias = async (planId) => {
        if (!planId) return;
        try {
            const { data } = await apiClient.get("/gimnasio/ejecuciones/reporte-secuencias", { params: { plan_id: planId } });
            setReporteSecuencias(data || null);
        } catch (error) {
            setReporteSecuencias(null);
            Swal.fire("Error", "No se pudo cargar el reporte de secuencias.", "error");
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, []);

    useEffect(() => {
        if (clienteSeleccionado) {
            setFiltroReporte("plan");
            setReporteSecuencias(null);
            fetchPlanesPorCliente();
        } else {
            setPlanes([]);
            setPlanSeleccionado(null);
            setReporteSecuencias(null);
            setFiltroReporte("plan");
        }
    }, [clienteSeleccionado]);

    useEffect(() => {
        if (planSeleccionado) {
            setFiltroReporte("plan");
            fetchReporteSecuencias(planSeleccionado.id);
        }
    }, [planSeleccionado]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Ejecución del Entrenamiento"
                            rightContent={
                                <Box sx={{ px: 2, py: 0.8, borderRadius: "6px", bgcolor: "rgba(15, 23, 42, 0.05)", color: "#0f172a", fontSize: "11px", fontWeight: 900 }}>
                                    {personas.length} CLIENTES
                                </Box>
                            }
                        />

                        <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                <Autocomplete
                                    options={personas}
                                    getOptionLabel={(option) => `${option.cedula || ""} - ${option.nombres || ""}`}
                                    onChange={(e, value) => setClienteSeleccionado(value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Buscar Cliente (Nombre o Cédula)"
                                            size="small"
                                            sx={{ ...filterInputSx, minWidth: 320 }}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start" sx={{ pl: 1 }}>
                                                            <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    sx={{ flexGrow: 1, maxWidth: 500 }}
                                />
                                <TextField
                                    select
                                    size="small"
                                    value={planSeleccionado?.id || ""}
                                    onChange={(e) => {
                                        const nextPlan = planes.find((plan) => String(plan.id) === String(e.target.value)) || null;
                                        setPlanSeleccionado(nextPlan);
                                    }}
                                    disabled={!clienteSeleccionado || planes.length === 0}
                                    sx={{ ...filterInputSx, minWidth: 260 }}
                                >
                                    {planes.length === 0 ? (
                                        <MenuItem value="">Sin planes activos</MenuItem>
                                    ) : (
                                        planes.map((plan) => (
                                            <MenuItem key={plan.id} value={plan.id}>
                                                {plan.nombre}
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Box>
                        </Paper>

                        {clienteSeleccionado && planSeleccionado && (
                            <ReporteSecuenciasPanel
                                data={reporteSecuencias}
                                filter={filtroReporte}
                                onFilterChange={setFiltroReporte}
                                onExplain={(data) => setExplicacionReporte({ open: true, data })}
                                onSelectWeek={(week) => setDetalleReporte({ open: true, week, exercise: null })}
                            />
                        )}
                    </Stack>
                </Fade>
            </Box>

            <ReporteExplicacionModal
                open={explicacionReporte.open}
                data={explicacionReporte.data}
                onClose={() => setExplicacionReporte({ open: false, data: null })}
            />

            <PremiumModal
                open={detalleReporte.open}
                onClose={() => setDetalleReporte({ open: false, week: null, exercise: null })}
                title={detalleReporte.exercise ? detalleReporte.exercise.name : `Detalle ${detalleReporte.week?.label || ""}`}
                subtitle={detalleReporte.exercise ? "Series planificadas vs ejecutadas" : "Ejercicios de la semana"}
                icon={<FitnessCenterRoundedIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="md"
            >
                {detalleReporte.exercise ? (
                    <Stack spacing={1.5}>
                        <Box
                            onClick={() => setDetalleReporte((prev) => ({ ...prev, exercise: null }))}
                            sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, color: "#b45309", fontWeight: 900, fontSize: 13, cursor: "pointer", width: "fit-content" }}
                        >
                            ← Volver a ejercicios
                        </Box>
                        {Array.from({
                            length: Math.max(detalleReporte.exercise.plannedSeries?.length || 0, detalleReporte.exercise.actualSeries?.length || 0),
                        }).map((_, index) => {
                            const planned = detalleReporte.exercise.plannedSeries?.[index] || {};
                            const actual = (detalleReporte.exercise.actualSeries || []).find((item) => Number(item.number) === index + 1) || detalleReporte.exercise.actualSeries?.[index] || {};
                            const plannedReps = Number(planned.reps || 0);
                            const actualReps = Number(actual.reps || 0);
                            const plannedLoad = Number(planned.load || 0);
                            const actualLoad = Number(actual.load || 0);
                            const plannedVolume = plannedLoad * plannedReps;
                            const actualVolume = actualLoad * actualReps;
                            const percent = plannedVolume > 0 ? Math.round((actualVolume / plannedVolume) * 100) : (plannedReps > 0 ? Math.round((actualReps / plannedReps) * 100) : 0);

                            return (
                                <Box key={`serie-${index}`} sx={{ p: 1.7, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fffaf0" }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>Serie {index + 1}</Typography>
                                        <Typography sx={{ fontSize: 14, color: getComplianceColor(percent), fontWeight: 950 }}>{percent}%</Typography>
                                    </Stack>
                                    <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 850 }}>Plan: {formatLoadReps(plannedLoad, plannedReps)}</Typography>
                                    <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 850 }}>Secuencia: {formatLoadReps(actualLoad, actualReps)}</Typography>
                                </Box>
                            );
                        })}
                        {detalleReporte.exercise.observation && (
                            <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 700 }}>
                                {detalleReporte.exercise.observation}
                            </Box>
                        )}
                    </Stack>
                ) : (
                    <Stack spacing={1.5}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                            <Box sx={{ p: 1.3, borderRadius: "8px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                <Typography sx={{ fontSize: 11, color: "#166534", fontWeight: 900, textTransform: "uppercase" }}>Plan</Typography>
                                <Typography sx={{ fontSize: 17, color: "#0f172a", fontWeight: 950 }}>{formatCompact(detalleReporte.week?.plannedReps)} reps</Typography>
                            </Box>
                            <Box sx={{ p: 1.3, borderRadius: "8px", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                                <Typography sx={{ fontSize: 11, color: "#991b1b", fontWeight: 900, textTransform: "uppercase" }}>Secuencia</Typography>
                                <Typography sx={{ fontSize: 17, color: "#0f172a", fontWeight: 950 }}>{formatCompact(detalleReporte.week?.actualReps)} reps</Typography>
                            </Box>
                            <Box sx={{ p: 1.3, borderRadius: "8px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>Cumplimiento</Typography>
                                <Typography sx={{ fontSize: 17, color: getComplianceColor(detalleReporte.week?.compliance), fontWeight: 950 }}>{detalleReporte.week?.compliance || 0}%</Typography>
                            </Box>
                        </Box>

                        {(detalleReporte.week?.exercises || []).map((exercise) => {
                            const max = Math.max(Number(exercise.plannedReps || 0), Number(exercise.actualReps || 0), 1);
                            return (
                                <Box
                                    key={exercise.id}
                                    onClick={() => setDetalleReporte((prev) => ({ ...prev, exercise }))}
                                    sx={{ p: 1.6, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#ffffff", cursor: "pointer", "&:hover": { borderColor: "#f0b400" } }}
                                >
                                    <Stack spacing={1.2}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                            <Box>
                                                <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{exercise.name}</Typography>
                                                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 750 }}>
                                                    {exercise.day || "Día"} · Plan {formatCompact(exercise.plannedReps)} reps / Secuencia {formatCompact(exercise.actualReps)} reps
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: 13, color: getComplianceColor(exercise.compliance), fontWeight: 950 }}>{exercise.compliance || 0}%</Typography>
                                        </Stack>
                                        <MetricBar label="Plan" value={exercise.plannedReps} max={max} color="#10b981" />
                                        <MetricBar label="Secuencia" value={exercise.actualReps} max={max} color="#ef4444" />
                                        <Typography sx={{ color: "#b45309", fontSize: 11, fontWeight: 900 }}>Ver series ›</Typography>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </PremiumModal>

        </Box>
    );
}
