import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
    Autocomplete,
    Collapse,
    List,
    ListItemButton,
    ListItemText,
    Fade,
    InputAdornment,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TimelineIcon from "@mui/icons-material/Timeline";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import PageHeader from "../../components/ui/PageHeader";
import { semanticChipSx, filterInputSx, modalPaperSx, modalTitleSx, modalContentSx } from "../../Styles/muiTheme";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import PremiumModal from "../../components/ui/PremiumModal";
import { pagePaperSx } from "../personas/personas.utils";
import { buildExecutionRecommendations } from "../reportes/recomendaciones";

// Utilidades para estados y colores
const estadoOptions = [
    { value: "PENDIENTE", label: "Pendiente", tone: "neutral" },
    { value: "EN_PROGRESO", label: "En progreso", tone: "inventory" },
    { value: "PARCIAL", label: "Parcial", tone: "mustard" },
    { value: "COMPLETADO", label: "Completado", tone: "success" },
    { value: "COMPLETADO_CON_AJUSTE", label: "Completado con ajuste", tone: "mustard" },
    { value: "OMITIDO", label: "Omitido", tone: "danger" },
];

const normalizeExecutionState = (value) => value || "PENDIENTE";

const emptyExecutionForm = (rutina) => ({
    estado: normalizeExecutionState(rutina.ejecucion_estado),
    series_completadas: rutina.series_completadas ?? rutina.series ?? "",
    repeticiones_reales: rutina.repeticiones_reales ?? rutina.repeticiones ?? "",
    carga_real: rutina.carga_real ?? rutina.carga_objetivo ?? "",
    unidad_carga_real: rutina.unidad_carga_real ?? rutina.unidad_objetivo ?? "",
    rpe_real: rutina.rpe_real ?? rutina.rpe ?? "",
    dolor_nivel: rutina.dolor_nivel ?? "",
    observaciones: rutina.ejecucion_observaciones ?? "",
});

const getNumericDelta = (planned, actual) => {
    const plannedNum = Number(planned);
    const actualNum = Number(actual);
    if (Number.isNaN(plannedNum) || Number.isNaN(actualNum)) return null;
    return Number((actualNum - plannedNum).toFixed(2));
};

const getComparisonTone = (planned, actual) => {
    if (actual === "" || actual === null || actual === undefined) return { tone: "neutral", label: "Sin dato" };
    if (String(planned ?? "").trim() === String(actual ?? "").trim()) return { tone: "success", label: "Igual al plan" };
    return { tone: "mustard", label: "Ajustado" };
};

const metricCardSx = {
    ...pagePaperSx,
    p: 2.2,
    minHeight: 110,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
};

// Tooltip Personalizado Premium para el Gráfico
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ 
                bgcolor: "rgba(255, 255, 255, 0.95)", 
                p: 2.5, 
                borderRadius: "16px", 
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", 
                border: "1px solid rgba(226, 232, 240, 0.8)",
                backdropFilter: "blur(8px)",
                minWidth: "220px"
            }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 2, fontSize: 13, textTransform: "capitalize", borderBottom: "1px solid #f1f5f9", pb: 1 }}>
                    {new Date(label).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                </Typography>
                <Stack spacing={1.5}>
                    {payload.map((entry, index) => (
                        <Stack key={index} direction="row" justifyContent="space-between" alignItems="center" spacing={4}>
                            <Stack direction="row" alignItems="center" spacing={1.2}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                                <Typography sx={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{entry.name}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 14, fontWeight: 900, color: entry.color }}>
                                {entry.value} {entry.name.includes('Carga') || entry.name.includes('Volumen') ? 'kg' : ''}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>
        );
    }
    return null;
};

export default function Ejecucion() {
    const [personas, setPersonas] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    
    const [planes, setPlanes] = useState([]);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);

    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [detalle, setDetalle] = useState({ plan: null, rutinas: [] });
    const [forms, setForms] = useState({});
    
    // Gráficos y progreso
    const [progresoPlan, setProgresoPlan] = useState([]);
    const [chartDialog, setChartDialog] = useState({ open: false, ejercicioId: null, nombre: "" });

    // Navegación Sidebar
    const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [semanasAbiertas, setSemanasAbiertas] = useState({});
    
    // States for Chart
    const [chartOpen, setChartOpen] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [selectedEjercicioNombre, setSelectedEjercicioNombre] = useState("");

    // 1. Cargar todas las personas (Buscador)
    const fetchPersonas = async () => {
        try {
            const { data } = await apiClient.get("/gimnasio/personas?cliente=true");
            setPersonas(data || []);
        } catch (error) {
            Swal.fire("Error", "No se pudieron cargar los clientes.", "error");
        }
    };

    // 2. Cargar planes asignados cuando se selecciona cliente
    const fetchPlanesPorCliente = async (personaId) => {
        try {
            const { data } = await apiClient.get("/gimnasio/ejecucion/planes");
            // Filtramos en el frontend temporalmente
            const planesDelCliente = (data || []).filter(p => p.cedula === clienteSeleccionado?.cedula || p.destino?.includes(clienteSeleccionado?.nombres));
            setPlanes(planesDelCliente);
            if (planesDelCliente.length > 0) {
                setPlanSeleccionado(planesDelCliente[0]);
            } else {
                setPlanSeleccionado(null);
                setDetalle({ plan: null, rutinas: [] });
                setProgresoPlan([]);
            }
        } catch (error) {
            Swal.fire("Error", "No se pudieron cargar los planes del cliente.", "error");
        }
    };

    // 3. Cargar el detalle completo del plan y su progreso
    const fetchDetalle = async (planId, fechaActual) => {
        if (!planId) return;
        try {
            const [detalleRes, progresoRes] = await Promise.all([
                apiClient.get("/gimnasio/ejecuciones", { params: { plan_id: planId, fecha: fechaActual } }),
                apiClient.get("/gimnasio/ejecuciones/progreso", { params: { plan_id: planId } })
            ]);
            
            const data = detalleRes.data;
            const rutinas = data?.rutinas || [];
            setDetalle(data || { plan: null, rutinas: [] });
            setProgresoPlan(progresoRes.data || []);
            
            // Llenar formularios iniciales
            const initForms = {};
            rutinas.forEach(r => { initForms[r.id] = emptyExecutionForm(r); });
            setForms(initForms);

            // Auto-abrir la primera semana si no hay selección
            const semanas = [...new Set(rutinas.map(r => r.semana).filter(Boolean))].sort((a,b)=>a-b);
            if (semanas.length > 0 && !semanaSeleccionada) {
                setSemanasAbiertas({ [semanas[0]]: true });
            }

        } catch (error) {
            Swal.fire("Error", "No se pudo cargar la ejecución del plan.", "error");
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, []);

    useEffect(() => {
        if (clienteSeleccionado) {
            fetchPlanesPorCliente(clienteSeleccionado.id);
        } else {
            setPlanes([]);
            setPlanSeleccionado(null);
            setDetalle({ plan: null, rutinas: [] });
        }
    }, [clienteSeleccionado]);

    useEffect(() => {
        if (planSeleccionado) {
            fetchDetalle(planSeleccionado.id, fecha);
        }
    }, [planSeleccionado, fecha]);

    // Lógica para estructurar el menú lateral
    const estructuraPlan = useMemo(() => {
        const est = {};
        detalle.rutinas.forEach(item => {
            if (!item.semana || !item.dia) return;
            if (!est[item.semana]) est[item.semana] = new Set();
            est[item.semana].add(item.dia);
        });
        return est;
    }, [detalle.rutinas]);

    const toggleSemana = (sem) => {
        setSemanasAbiertas(prev => ({ ...prev, [sem]: !prev[sem] }));
    };

    const handleSelectDay = (sem, dia) => {
        setSemanaSeleccionada(sem);
        setDiaSeleccionado(dia);
    };

    // Filtrar rutinas para la vista principal
    const rutinasVisibles = useMemo(() => {
        if (!semanaSeleccionada || !diaSeleccionado) return [];
        return detalle.rutinas.filter(r => r.semana == semanaSeleccionada && r.dia == diaSeleccionado);
    }, [detalle.rutinas, semanaSeleccionada, diaSeleccionado]);

    // Resumen de cumplimiento del día actual
    const resumen = useMemo(() => {
        const base = { total: 0, completados: 0, ajustados: 0, omitidos: 0, enProgreso: 0 };
        rutinasVisibles.forEach(item => {
            base.total += 1;
            const estado = normalizeExecutionState(forms[item.id]?.estado || item.ejecucion_estado);
            if (estado === "COMPLETADO") base.completados += 1;
            if (estado === "COMPLETADO_CON_AJUSTE") base.ajustados += 1;
            if (estado === "OMITIDO") base.omitidos += 1;
            if (estado === "EN_PROGRESO") base.enProgreso += 1;
        });
        base.cumplimiento = base.total ? Math.round(((base.completados + base.ajustados*0.5) / base.total) * 100) : 0;
        return base;
    }, [rutinasVisibles, forms]);

    const updateForm = (rutinaId, field, value) => {
        setForms(prev => ({
            ...prev,
            [rutinaId]: { ...prev[rutinaId], [field]: value }
        }));
    };

    const handleSave = async (rutina) => {
        const form = forms[rutina.id];
        try {
            await apiClient.post("/gimnasio/ejecuciones", {
                plan_id: rutina.plan_id,
                plan_ejercicio_id: rutina.id,
                fecha_ejecucion: fecha,
                estado: normalizeExecutionState(form.estado),
                series_completadas: form.series_completadas ? Number(form.series_completadas) : null,
                repeticiones_reales: form.repeticiones_reales || null,
                carga_real: form.carga_real ? Number(form.carga_real) : null,
                unidad_carga_real: form.unidad_carga_real || null,
                rpe_real: form.rpe_real ? Number(form.rpe_real) : null,
                dolor_nivel: form.dolor_nivel ? Number(form.dolor_nivel) : null,
                observaciones: form.observaciones || null,
            });
            await fetchDetalle(planSeleccionado.id, fecha);
            Swal.fire("Éxito", "Ejecución guardada", "success");
        } catch (error) {
            Swal.fire("Error", "No se pudo guardar", "error");
        }
    };

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

                        {/* ENCABEZADO DE BÚSQUEDA */}
                        <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                <Autocomplete
                                    options={personas}
                                    getOptionLabel={(option) => `${option.cedula || ''} - ${option.nombres || ''}`}
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
                                    type="date"
                                    size="small"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    sx={{ ...filterInputSx, width: 180 }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </Paper>

                        {clienteSeleccionado && (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" }, gap: 3, alignItems: "start" }}>
                                {/* SIDEBAR NAVEGACIÓN PLAN */}
                                <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Navegación del Plan</Typography>
                                        {planSeleccionado ? (
                                            <Chip label={planSeleccionado.nombre} size="small" sx={{ mt: 1, ...semanticChipSx("neutral") }} />
                                        ) : (
                                            <Typography sx={{ fontSize: 12, color: "#dc2626", mt: 1 }}>El cliente no tiene un plan activo.</Typography>
                                        )}
                                    </Box>
                                    
                                    <List component="nav" sx={{ p: 0 }}>
                                        {Object.entries(estructuraPlan).map(([semana, diasSet]) => (
                                            <Box key={`sem-${semana}`}>
                                                <ListItemButton onClick={() => toggleSemana(semana)} sx={{ bgcolor: semanasAbiertas[semana] ? "rgba(15,23,42,0.03)" : "transparent" }}>
                                                    <EventAvailableRoundedIcon sx={{ mr: 1.5, color: "#64748b", fontSize: 20 }} />
                                                    <ListItemText primary={`Semana ${semana}`} primaryTypographyProps={{ fontWeight: 800, fontSize: 14 }} />
                                                    {semanasAbiertas[semana] ? <ExpandLess /> : <ExpandMore />}
                                                </ListItemButton>
                                                <Collapse in={semanasAbiertas[semana]} timeout="auto" unmountOnExit>
                                                    <List component="div" disablePadding>
                                                        {Array.from(diasSet).map(dia => {
                                                            const isSelected = semanaSeleccionada == semana && diaSeleccionado == dia;
                                                            return (
                                                                <ListItemButton 
                                                                    key={`sem-${semana}-dia-${dia}`} 
                                                                    sx={{ pl: 5, bgcolor: isSelected ? "rgba(240, 180, 0, 0.1)" : "transparent", borderLeft: isSelected ? "3px solid #f0b400" : "3px solid transparent" }}
                                                                    onClick={() => handleSelectDay(semana, dia)}
                                                                >
                                                                    <ListItemText primary={dia} primaryTypographyProps={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: isSelected ? "#0f172a" : "#475569" }} />
                                                                </ListItemButton>
                                                            )
                                                        })}
                                                    </List>
                                                </Collapse>
                                            </Box>
                                        ))}
                                    </List>
                                </Paper>

                                {/* VISTA DEL DÍA SELECCIONADO */}
                                <Box>
                                    {(!semanaSeleccionada || !diaSeleccionado) ? (
                                        <Paper elevation={0} sx={{ ...pagePaperSx, p: 6, textAlign: "center", border: "1px solid #e2e8f0" }}>
                                            <FitnessCenterRoundedIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 2 }} />
                                            <Typography sx={{ fontWeight: 800, color: "#64748b", fontSize: 18 }}>Selecciona un día en el menú lateral</Typography>
                                            <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>Podrás registrar la ejecución de los ejercicios para la fecha establecida.</Typography>
                                        </Paper>
                                    ) : (
                                        <Stack spacing={3}>
                                            {/* HEADER DEL DIA */}
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>Semana {semanaSeleccionada} · {diaSeleccionado}</Typography>
                                                    <Typography sx={{ fontSize: 13, color: "#64748b" }}>Registro de sesión para {fecha}</Typography>
                                                </Box>
                                                <Paper sx={{ px: 2, py: 1, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
                                                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#166534", textTransform: "uppercase" }}>Cumplimiento</Typography>
                                                    <Typography sx={{ fontSize: 24, fontWeight: 950, color: "#15803d" }}>{resumen.cumplimiento}%</Typography>
                                                </Paper>
                                            </Stack>

                                            {/* LISTA DE EJERCICIOS DEL DIA */}
                                            {rutinasVisibles.map((rutina, idx) => {
                                                const form = forms[rutina.id] || emptyExecutionForm(rutina);
                                                
                                                // Parse sets: from JSON (mobile) or build editable array
                                                let sets = [];
                                                const seriesPlanificadas = Number(rutina.series) || 1;
                                                try {
                                                    if (typeof form.repeticiones_reales === 'string' && form.repeticiones_reales.trim().startsWith('[')) {
                                                        sets = JSON.parse(form.repeticiones_reales);
                                                    }
                                                } catch (e) {}
                                                if (!Array.isArray(sets) || sets.length === 0) {
                                                    sets = Array.from({ length: seriesPlanificadas }, (_, i) => ({
                                                        set: i + 1,
                                                        carga: form.carga_real || "",
                                                        reps: (typeof form.repeticiones_reales === 'string' && !form.repeticiones_reales.trim().startsWith('[')) ? form.repeticiones_reales : (rutina.repeticiones || ""),
                                                        completado: false,
                                                    }));
                                                } else if (sets.length < seriesPlanificadas) {
                                                    // Pad with empty sets up to planned series count
                                                    while (sets.length < seriesPlanificadas) {
                                                        sets.push({ set: sets.length + 1, carga: "", reps: rutina.repeticiones || "", completado: false });
                                                    }
                                                }

                                                const updateSet = (si, field, val) => {
                                                    const u = [...sets]; u[si] = { ...u[si], [field]: val };
                                                    updateForm(rutina.id, 'repeticiones_reales', JSON.stringify(u));
                                                    updateForm(rutina.id, 'series_completadas', String(u.filter(s => s.completado).length || u.length));
                                                    const mx = Math.max(...u.map(s => Number(s.carga) || 0));
                                                    if (mx > 0) updateForm(rutina.id, 'carga_real', String(mx));
                                                };

                                                const addSet = () => {
                                                    const u = [...sets, { set: sets.length + 1, carga: "", reps: "", completado: false }];
                                                    updateForm(rutina.id, 'repeticiones_reales', JSON.stringify(u));
                                                };
                                                const removeSet = () => {
                                                    if (sets.length <= 1) return;
                                                    updateForm(rutina.id, 'repeticiones_reales', JSON.stringify(sets.slice(0, -1)));
                                                };

                                                return (
                                                    <Paper key={rutina.id} elevation={0} sx={{ ...pagePaperSx, p: 2.5, borderLeft: "4px solid #f0b400", borderTop: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                                                        {/* Header */}
                                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                                            <Box>
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>{rutina.ejercicio_nombre}</Typography>
                                                                    <IconButton 
                                                                        size="small" 
                                                                        sx={{ color: "#3b82f6", bgcolor: "rgba(59,130,246,0.1)", "&:hover": { bgcolor: "rgba(59,130,246,0.2)" } }}
                                                                        onClick={() => {
                                                                            const prog = progresoPlan.filter(p => p.ejercicio_id === rutina.ejercicio_id);
                                                                            setChartData(prog);
                                                                            setSelectedEjercicioNombre(rutina.ejercicio_nombre);
                                                                            setChartOpen(true);
                                                                        }}
                                                                    >
                                                                        <TimelineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                                <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                                                                    Planificado: {rutina.series} series x {rutina.repeticiones || "-"} | Carga: {rutina.carga_objetivo || "-"} {rutina.unidad_objetivo || ""} | RPE: {rutina.rpe || "-"}
                                                                </Typography>
                                                            </Box>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label={estadoOptions.find(o => o.value === form.estado)?.label || form.estado} size="small" sx={semanticChipSx(estadoOptions.find(o => o.value === form.estado)?.tone || "neutral")} />
                                                                <Chip label={rutina.bloque} size="small" sx={semanticChipSx("neutral")} />
                                                            </Stack>
                                                        </Stack>

                                                        {/* Tabla SET x SET editable */}
                                                        <Box sx={{ mb: 2, border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                                                <thead style={{ backgroundColor: "#f8fafc" }}>
                                                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                                        <th style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 700, width: 60 }}>SET</th>
                                                                        <th style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>CARGA (KG)</th>
                                                                        <th style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>REPS</th>
                                                                        <th style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 700, width: 60 }}>✓</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sets.map((s, i) => (
                                                                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: s.completado ? "#f0fdf4" : "transparent" }}>
                                                                            <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>{s.set || i + 1}</td>
                                                                            <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                                                                <input type="number" value={s.carga || ""} onChange={(e) => updateSet(i, 'carga', e.target.value)}
                                                                                    style={{ width: 80, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center", fontSize: 13, outline: "none", background: "#f8fafc" }} />
                                                                            </td>
                                                                            <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                                                                <input type="number" value={s.reps || ""} onChange={(e) => updateSet(i, 'reps', e.target.value)}
                                                                                    style={{ width: 70, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center", fontSize: 13, outline: "none", background: "#f8fafc" }} />
                                                                            </td>
                                                                            <td style={{ padding: "6px 12px", textAlign: "center" }}>
                                                                                <Box onClick={() => updateSet(i, 'completado', !s.completado)}
                                                                                    sx={{ width: 32, height: 32, borderRadius: "8px", mx: "auto", display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s",
                                                                                        bgcolor: s.completado ? "#10b981" : "#f1f5f9", border: s.completado ? "2px solid #059669" : "2px solid #cbd5e1",
                                                                                        "&:hover": { transform: "scale(1.1)" } }}>
                                                                                    {s.completado && <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>✓</Typography>}
                                                                                </Box>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </Box>

                                                        {/* + / - Sets */}
                                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                            <Box onClick={addSet} sx={{ px: 1.5, py: 0.5, borderRadius: "6px", border: "1px dashed #cbd5e1", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#64748b", "&:hover": { bgcolor: "#f8fafc" } }}>+ Agregar Set</Box>
                                                            {sets.length > 1 && <Box onClick={removeSet} sx={{ px: 1.5, py: 0.5, borderRadius: "6px", border: "1px dashed #fca5a5", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>− Quitar último</Box>}
                                                        </Stack>

                                                        {/* RPE Selector visual (5-10) */}
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b", mb: 1, textTransform: "uppercase" }}>Esfuerzo Percibido (RPE)</Typography>
                                                            <Stack direction="row" spacing={1}>
                                                                {[5, 6, 7, 8, 9, 10].map(rpe => (
                                                                    <Box key={rpe} onClick={() => updateForm(rutina.id, 'rpe_real', String(rpe))}
                                                                        sx={{ width: 40, height: 40, borderRadius: "10px", display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 800, fontSize: 14, transition: "all 0.2s",
                                                                            bgcolor: String(form.rpe_real) === String(rpe) ? "#f0b400" : "#f1f5f9",
                                                                            color: String(form.rpe_real) === String(rpe) ? "#fff" : "#475569",
                                                                            border: String(form.rpe_real) === String(rpe) ? "2px solid #d4a200" : "2px solid #e2e8f0",
                                                                            "&:hover": { transform: "scale(1.1)" } }}>
                                                                        {rpe}
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>

                                                        {/* Nivel Dolor (0-10) selector visual */}
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b", mb: 1, textTransform: "uppercase" }}>Nivel Dolor (0-10)</Typography>
                                                            <Stack direction="row" spacing={0.8} flexWrap="wrap">
                                                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nivel => (
                                                                    <Box key={nivel} onClick={() => updateForm(rutina.id, 'dolor_nivel', String(nivel))}
                                                                        sx={{ width: 36, height: 36, borderRadius: "8px", display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 800, fontSize: 13, transition: "all 0.2s",
                                                                            bgcolor: String(form.dolor_nivel) === String(nivel) ? (nivel <= 3 ? "#10b981" : nivel <= 6 ? "#f0b400" : "#ef4444") : "#f1f5f9",
                                                                            color: String(form.dolor_nivel) === String(nivel) ? "#fff" : "#475569",
                                                                            border: String(form.dolor_nivel) === String(nivel) ? "2px solid " + (nivel <= 3 ? "#059669" : nivel <= 6 ? "#d4a200" : "#dc2626") : "2px solid #e2e8f0",
                                                                            "&:hover": { transform: "scale(1.1)" } }}>
                                                                        {nivel}
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>

                                                        {/* Observaciones */}
                                                        <TextField size="small" fullWidth label="Observaciones" value={form.observaciones} onChange={(e) => updateForm(rutina.id, 'observaciones', e.target.value)} sx={{ mb: 2 }} />

                                                        {/* Estado + Guardar */}
                                                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                                            <TextField select size="small" value={form.estado} onChange={(e) => updateForm(rutina.id, 'estado', e.target.value)} sx={{ minWidth: 200 }}>
                                                                {estadoOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                                            </TextField>
                                                            <PremiumButton onClick={() => handleSave(rutina)}>Guardar Ejercicio</PremiumButton>
                                                        </Stack>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                </Fade>
            </Box>

            {/* Modal para el gráfico de progresión PREMIUM usando globalUi */}
            <PremiumModal
                open={chartOpen}
                onClose={() => setChartOpen(false)}
                title={`Evolución: ${selectedEjercicioNombre}`}
                subtitle="Visualiza el progreso de cargas, volumen y RPE a lo largo de las semanas"
                icon={<TimelineIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="lg"
            >
                {chartData.length > 0 ? (
                        <Box sx={{ width: "100%", height: 450, mt: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData.map(d => {
                                    let volumen = 0;
                                    try {
                                        const sets = JSON.parse(d.repeticiones_reales || "[]");
                                        if (Array.isArray(sets)) {
                                            volumen = sets.reduce((acc, set) => acc + (Number(set.carga) || 0) * (Number(set.reps) || 0), 0);
                                        }
                                    } catch (e) {}
                                    return {
                                        ...d, 
                                        carga: Number(d.carga_real) || 0, 
                                        rpe: Number(d.rpe_real) || 0,
                                        dolor: Number(d.dolor_nivel) || 0,
                                        volumen: volumen
                                    };
                                })} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorVolumen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="fecha_ejecucion" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} dy={10} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={10} domain={[0, 10]} />
                                    
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    
                                    <Legend 
                                        wrapperStyle={{ paddingTop: "20px", fontWeight: 700, fontSize: 13 }} 
                                        iconType="circle"
                                        iconSize={10}
                                    />
                                    
                                    {/* Volumen de fondo como Área suave */}
                                    <Area yAxisId="left" type="monotone" name="Volumen (kg)" dataKey="volumen" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVolumen)" strokeWidth={2} activeDot={false} />
                                    
                                    {/* Carga Máxima como Área principal con borde fuerte */}
                                    <Area yAxisId="left" type="monotone" name="Carga Máxima" dataKey="carga" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCarga)" strokeWidth={4} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: '#3b82f6', style: { filter: 'drop-shadow(0px 4px 6px rgba(59,130,246,0.5))' } }} />
                                    
                                    {/* RPE y Dolor como líneas delgadas superiores */}
                                    <Line yAxisId="right" type="monotone" name="RPE" dataKey="rpe" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#f59e0b' }} />
                                    <Line yAxisId="right" type="monotone" name="Dolor" dataKey="dolor" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: '#ef4444', stroke: 'none' }} activeDot={{ r: 5 }} />
                                    
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : (
                        <Box sx={{ p: 8, textAlign: "center", bgcolor: "#f8fafc", borderRadius: "16px" }}>
                            <TimelineIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 2 }} />
                            <Typography sx={{ fontWeight: 800, color: "#64748b", fontSize: 16 }}>Aún no hay suficientes datos</Typography>
                            <Typography sx={{ fontSize: 14, color: "#94a3b8", mt: 1 }}>Registra más ejecuciones para ver la gráfica de evolución.</Typography>
                        </Box>
                    )}
            </PremiumModal>
        </Box>
    );
}
