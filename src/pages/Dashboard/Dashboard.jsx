import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import PremiumButton from "../../components/ui/PremiumButton";
import { buildClientRecommendations, getClientRisk } from "../../modules/reportes/recomendaciones";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { pagePaperSx } from "../../modules/personas/personas.utils";
import { semanticChipSx, tableSx, tgSemantic } from "../../Styles/muiTheme";

const getMembershipStatus = (fechaFin) => {
    if (!fechaFin) return { code: "SIN_FECHA", label: "Sin fecha", tone: "neutral", daysLeft: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finish = new Date(`${fechaFin}T00:00:00`);
    const diffDays = Math.ceil((finish.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) return { code: "VENCIDA", label: "Vencida", tone: "danger", daysLeft: diffDays };
    if (diffDays <= 5) return { code: "POR_VENCER", label: "Por vencer", tone: "mustard", daysLeft: diffDays };
    return { code: "VIGENTE", label: "Vigente", tone: "success", daysLeft: diffDays };
};

const getActivityDate = (item) => item.fecha || item.fecha_registro || item.fecha_evaluacion || "";

const StatCard = ({ title, value, helper, icon, tone = "neutral" }) => {
    const palette = tgSemantic[tone] ?? tgSemantic.neutral;

    return (
        <Paper
            elevation={0}
            sx={{
                ...pagePaperSx,
                p: 2.5,
                flex: "1 1 220px",
                minWidth: 220,
                background: `linear-gradient(180deg, #ffffff 0%, ${palette.soft} 100%)`,
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                        {title}
                    </Typography>
                    <Typography sx={{ mt: 0.8, fontSize: 30, lineHeight: 1, fontWeight: 950, color: "#0f172a" }}>
                        {value}
                    </Typography>
                    <Typography sx={{ mt: 0.9, fontSize: 12, color: "#64748b" }}>
                        {helper}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "10px",
                        display: "grid",
                        placeItems: "center",
                        color: palette.color,
                        bgcolor: "#ffffff",
                        border: `1px solid ${palette.color}`,
                        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.05)",
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [personas, setPersonas] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [reportes, setReportes] = useState({
        resumen: { clientes: 0, sesiones: 0, adherencia_promedio: 0, rm_registros: 0, evaluaciones: 0 },
        clientes: [],
        ultimos_rm: [],
        ultimas_evaluaciones: [],
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);

            try {
                const [personasRes, membresiasRes, reportesRes] = await Promise.all([
                    apiClient.get("/gimnasio/personas"),
                    apiClient.get("/gimnasio/membresias/asignaciones"),
                    apiClient.get("/gimnasio/reportes/evolucion"),
                ]);

                setPersonas(personasRes.data || []);
                setAsignaciones(membresiasRes.data || []);
                setReportes(reportesRes.data || {
                    resumen: { clientes: 0, sesiones: 0, adherencia_promedio: 0, rm_registros: 0, evaluaciones: 0 },
                    clientes: [],
                    ultimos_rm: [],
                    ultimas_evaluaciones: [],
                });
            } catch (error) {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el dashboard entrenador."), "error");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const sociosActivos = useMemo(
        () => personas.filter((persona) => persona.es_socio && persona.estado_codigo !== "INACTIVO").length,
        [personas]
    );

    const membershipsSummary = useMemo(() => {
        const base = { vigentes: 0, porVencer: 0, vencidas: 0 };

        asignaciones.forEach((item) => {
            const code = getMembershipStatus(item.fecha_fin).code;
            if (code === "VIGENTE") base.vigentes += 1;
            if (code === "POR_VENCER") base.porVencer += 1;
            if (code === "VENCIDA") base.vencidas += 1;
        });

        return base;
    }, [asignaciones]);

    const clientesRiesgo = useMemo(
        () => reportes.clientes.filter((cliente) => getClientRisk(cliente).tone === "danger"),
        [reportes.clientes]
    );

    const clientesSeguimiento = useMemo(
        () => reportes.clientes.filter((cliente) => getClientRisk(cliente).tone === "mustard"),
        [reportes.clientes]
    );

    const proximasMembresias = useMemo(() => {
        return asignaciones
            .map((item) => ({
                ...item,
                status: getMembershipStatus(item.fecha_fin),
            }))
            .filter((item) => item.status.code === "POR_VENCER" || item.status.code === "VENCIDA")
            .sort((a, b) => {
                const aDays = a.status.daysLeft ?? 9999;
                const bDays = b.status.daysLeft ?? 9999;
                return aDays - bDays;
            })
            .slice(0, 6);
    }, [asignaciones]);

    const topAdherencia = useMemo(
        () => [...reportes.clientes].sort((a, b) => Number(b.adherencia_promedio || 0) - Number(a.adherencia_promedio || 0)).slice(0, 5),
        [reportes.clientes]
    );

    const recomendacionesCriticas = useMemo(() => {
        return reportes.clientes
            .map((cliente) => {
                const recommendation = buildClientRecommendations(cliente)[0];
                return {
                    ...cliente,
                    recommendation,
                    risk: getClientRisk(cliente),
                };
            })
            .filter((cliente) => cliente.recommendation)
            .sort((a, b) => {
                const weight = (item) => item.risk.tone === "danger" ? 3 : item.risk.tone === "mustard" ? 2 : 1;
                return weight(b) - weight(a);
            })
            .slice(0, 4);
    }, [reportes.clientes]);

    const recentActivity = useMemo(() => {
        const rmActivity = (reportes.ultimos_rm || []).map((item) => ({
            id: `rm-${item.id}`,
            tipo: "RM",
            fecha: item.fecha_registro,
            titulo: `${item.nombre_completo} registró RM`,
            detalle: `${item.ejercicio_nombre} · ${item.rm_estimado}`,
            tone: "success",
        }));

        const evaluacionActivity = (reportes.ultimas_evaluaciones || []).map((item) => ({
            id: `ev-${item.id}`,
            tipo: "Evaluación",
            fecha: item.fecha_evaluacion,
            titulo: `${item.nombre_completo} actualizó evaluación`,
            detalle: item.tipo_evaluacion,
            tone: "mustard",
        }));

        return [...rmActivity, ...evaluacionActivity]
            .sort((a, b) => String(getActivityDate(b)).localeCompare(String(getActivityDate(a))))
            .slice(0, 8);
    }, [reportes.ultimos_rm, reportes.ultimas_evaluaciones]);

    const dashboardCards = [
        {
            title: "Clientes",
            value: reportes.resumen.clientes || personas.length,
            helper: `${sociosActivos} socios activos en seguimiento`,
            icon: <PeopleAltOutlinedIcon />,
            tone: "neutral",
        },
        {
            title: "Adherencia",
            value: `${reportes.resumen.adherencia_promedio || 0}%`,
            helper: `${reportes.resumen.sesiones || 0} sesiones registradas`,
            icon: <AssignmentTurnedInOutlinedIcon />,
            tone: "success",
        },
        {
            title: "Alertas",
            value: clientesRiesgo.length,
            helper: `${clientesSeguimiento.length} clientes en seguimiento`,
            icon: <WarningAmberOutlinedIcon />,
            tone: clientesRiesgo.length ? "danger" : "mustard",
        },
        {
            title: "Membresías",
            value: membershipsSummary.porVencer + membershipsSummary.vencidas,
            helper: `${membershipsSummary.porVencer} por vencer · ${membershipsSummary.vencidas} vencidas`,
            icon: <CalendarMonthOutlinedIcon />,
            tone: membershipsSummary.vencidas ? "danger" : "mustard",
        },
    ];

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    p: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    background: "linear-gradient(135deg, rgba(224,161,0,0.10) 0%, rgba(255,255,255,1) 42%, rgba(15,23,42,0.02) 100%)",
                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#0f172a" }}>
                        Dashboard Entrenador
                    </Typography>
                    <Typography sx={{ mt: 0.8, maxWidth: 760, color: "#64748b", fontSize: 13 }}>
                        Supervisa adherencia, riesgo, membresías y actividad reciente desde una sola vista para tomar decisiones rápidas durante el día.
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <PremiumButton variant="outline" onClick={() => navigate("/gimnasio/clientes/directorio")}>
                        Ver Clientes
                    </PremiumButton>
                    <PremiumButton variant="outline" onClick={() => navigate("/entrenamiento/planes")}>
                        Ver Planes
                    </PremiumButton>
                    <PremiumButton variant="anadir" onClick={() => navigate("/entrenamiento/ejecucion")}>
                        Ir a Ejecución
                    </PremiumButton>
                </Stack>
            </Paper>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {dashboardCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </Box>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 1.15 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                Panel de Riesgo y Seguimiento
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                                Clientes que requieren atención del entrenador por adherencia o dolor.
                            </Typography>
                        </Box>
                        <PremiumButton variant="outline" onClick={() => navigate("/reportes/alertas")}>
                            Abrir Alertas
                        </PremiumButton>
                    </Stack>

                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Adherencia</TableCell>
                                    <TableCell>Dolor / RPE</TableCell>
                                    <TableCell>Última sesión</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportes.clientes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b" }}>
                                            {loading ? "Cargando dashboard..." : "Aún no hay clientes con datos de entrenamiento."}
                                        </TableCell>
                                    </TableRow>
                                ) : reportes.clientes.slice(0, 6).map((cliente) => {
                                    const risk = getClientRisk(cliente);

                                    return (
                                        <TableRow key={cliente.persona_id}>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 800 }}>{cliente.nombre_completo}</Typography>
                                                <Typography sx={{ fontSize: 11, color: "#64748b" }}>{cliente.cedula}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={risk.label} sx={semanticChipSx(risk.tone)} />
                                            </TableCell>
                                            <TableCell>{cliente.adherencia_promedio || 0}%</TableCell>
                                            <TableCell>{cliente.dolor_promedio || 0} / {cliente.rpe_promedio || 0}</TableCell>
                                            <TableCell>{cliente.ultima_sesion || "Sin sesiones"}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 0.85 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                Membresías por Gestionar
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                                Vencimientos cercanos o membresías ya vencidas.
                            </Typography>
                        </Box>
                        <PremiumButton variant="outline" onClick={() => navigate("/gimnasio/clientes/membresias")}>
                            Ver Membresías
                        </PremiumButton>
                    </Stack>

                    <Stack spacing={1.3}>
                        {proximasMembresias.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: "10px",
                                    border: "1px dashed #cbd5e1",
                                    px: 2,
                                    py: 3,
                                    textAlign: "center",
                                    color: "#64748b",
                                }}
                            >
                                No hay membresías urgentes por atender.
                            </Paper>
                        ) : proximasMembresias.map((item) => (
                            <Paper
                                key={item.id}
                                elevation={0}
                                sx={{
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    px: 2,
                                    py: 1.8,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                            {item.nombre_completo}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                            {item.membresia_nombre} · vence {item.fecha_fin}
                                        </Typography>
                                    </Box>
                                    <Chip label={item.status.label} sx={semanticChipSx(item.status.tone)} />
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>
            </Stack>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                Actividad Reciente
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                                Últimos movimientos de RM y evaluaciones físicas.
                            </Typography>
                        </Box>
                        <PremiumButton variant="outline" onClick={() => navigate("/reportes/evolucion")}>
                            Abrir Evolución
                        </PremiumButton>
                    </Stack>

                    <Stack spacing={1.3}>
                        {recentActivity.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: "10px",
                                    border: "1px dashed #cbd5e1",
                                    px: 2,
                                    py: 3,
                                    textAlign: "center",
                                    color: "#64748b",
                                }}
                            >
                                No hay actividad reciente registrada todavía.
                            </Paper>
                        ) : recentActivity.map((item, index) => (
                            <Box key={item.id}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Stack direction="row" spacing={1.4} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "10px",
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: tgSemantic[item.tone]?.soft || tgSemantic.neutral.soft,
                                                color: tgSemantic[item.tone]?.color || tgSemantic.neutral.color,
                                            }}
                                        >
                                            {item.tipo === "RM" ? <FitnessCenterOutlinedIcon sx={{ fontSize: 18 }} /> : <MonitorHeartOutlinedIcon sx={{ fontSize: 18 }} />}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                                {item.titulo}
                                            </Typography>
                                            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                                {item.detalle}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack alignItems="flex-end">
                                        <Chip label={item.tipo} sx={semanticChipSx(item.tone)} />
                                        <Typography sx={{ mt: 0.6, fontSize: 11, color: "#64748b" }}>
                                            {item.fecha || "Sin fecha"}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                {index !== recentActivity.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
                            </Box>
                        ))}
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                                Clientes Más Estables
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                                Ranking rápido de adherencia para seguimiento positivo.
                            </Typography>
                        </Box>
                        <PremiumButton variant="outline" onClick={() => navigate("/reportes/adherencia")}>
                            Abrir Adherencia
                        </PremiumButton>
                    </Stack>

                    <Stack spacing={1.3}>
                        {topAdherencia.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: "10px",
                                    border: "1px dashed #cbd5e1",
                                    px: 2,
                                    py: 3,
                                    textAlign: "center",
                                    color: "#64748b",
                                }}
                            >
                                No hay ranking de adherencia disponible todavía.
                            </Paper>
                        ) : topAdherencia.map((cliente, index) => {
                            const risk = getClientRisk(cliente);

                            return (
                                <Paper
                                    key={cliente.persona_id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                        px: 2,
                                        py: 1.8,
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: "10px",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: "#0f172a",
                                                    bgcolor: "rgba(224,161,0,0.16)",
                                                    fontWeight: 950,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                                    {cliente.nombre_completo}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                                    {cliente.sesiones} sesiones · dolor {cliente.dolor_promedio || 0}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack alignItems="flex-end">
                                            <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                                                {cliente.adherencia_promedio || 0}%
                                            </Typography>
                                            <Chip label={risk.label} sx={semanticChipSx(risk.tone)} />
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                            Recomendaciones Automáticas
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                            Sugerencias rápidas para no perder de vista clientes, ejecución y seguimiento.
                        </Typography>
                    </Box>
                    <PremiumButton variant="outline" onClick={() => navigate("/reportes/alertas")}>
                        Ver Más
                    </PremiumButton>
                </Stack>

                <Stack spacing={1.3}>
                    {recomendacionesCriticas.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: "10px",
                                border: "1px dashed #cbd5e1",
                                px: 2,
                                py: 3,
                                textAlign: "center",
                                color: "#64748b",
                            }}
                        >
                            Todavía no hay suficiente información para sugerir acciones.
                        </Paper>
                    ) : recomendacionesCriticas.map((cliente) => (
                        <Paper
                            key={cliente.persona_id}
                            elevation={0}
                            sx={{
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                px: 2,
                                py: 1.8,
                            }}
                        >
                            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                            {cliente.nombre_completo}
                                        </Typography>
                                        <Chip label={cliente.recommendation.label} sx={semanticChipSx(cliente.recommendation.tone)} />
                                    </Stack>
                                    <Typography sx={{ mt: 0.5, fontSize: 12, color: "#64748b" }}>
                                        {cliente.recommendation.action}
                                    </Typography>
                                </Box>
                                <Box sx={{ minWidth: 120 }}>
                                    <Typography sx={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 900 }}>
                                        Contexto
                                    </Typography>
                                    <Typography sx={{ fontSize: 12.5, color: "#0f172a", fontWeight: 800 }}>
                                        {cliente.adherencia_promedio || 0}% adh. · dolor {cliente.dolor_promedio || 0}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                            Acciones Rápidas del Día
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
                            Atajos para continuar el flujo sin salir del tablero.
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                        <PremiumButton variant="outline" onClick={() => navigate("/entrenamiento/evaluaciones")}>
                            Registrar RM / Evaluación
                        </PremiumButton>
                        <PremiumButton variant="outline" onClick={() => navigate("/gimnasio/clientes/membresias")}>
                            Renovar Membresía
                        </PremiumButton>
                        <PremiumButton variant="outline" onClick={() => navigate("/entrenamiento/planes")}>
                            Ajustar Plan
                        </PremiumButton>
                        <PremiumButton variant="anadir" onClick={() => navigate("/reportes/alertas")}>
                            Revisar Riesgos
                        </PremiumButton>
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
}
