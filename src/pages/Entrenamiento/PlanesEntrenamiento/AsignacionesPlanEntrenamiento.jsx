import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    IconButton,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { pagePaperSx } from "../../../modules/personas/personas.utils";
import { semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import ModalAsignacionPlanEntrenamiento from "./components/ModalAsignacionPlanEntrenamiento";

export default function AsignacionesPlanEntrenamiento() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [personas, setPersonas] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [asignacionEdit, setAsignacionEdit] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [planRes, personasRes, asignacionesRes] = await Promise.all([
                apiClient.get(`/gimnasio/planes-entrenamiento/${id}`),
                apiClient.get("/gimnasio/planes-entrenamiento/personas-disponibles"),
                apiClient.get(`/gimnasio/planes-entrenamiento/${id}/asignaciones`),
            ]);

            setPlan(planRes.data?.plan || null);
            setPersonas(personasRes.data || []);
            setAsignaciones(asignacionesRes.data || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar las asignaciones del plan."), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const resumen = useMemo(() => ({
        total: asignaciones.length,
        activas: asignaciones.filter((item) => item.estado === "ACTIVO").length,
    }), [asignaciones]);

    const goToExecution = () => {
        navigate(`/entrenamiento/ejecucion?plan_id=${id}`);
    };

    const handleSave = async (payload) => {
        try {
            if (payload.is_sync_group) {
                await apiClient.put(`/gimnasio/planes-entrenamiento/${id}/asignaciones/grupo`, payload);
            } else if (asignacionEdit?.id && !payload.is_sync_group) {
                await apiClient.put(`/gimnasio/planes-entrenamiento/${id}/asignaciones/${asignacionEdit.id}`, payload);
            } else {
                await apiClient.post(`/gimnasio/planes-entrenamiento/${id}/asignaciones`, payload);
            }

            setModalOpen(false);
            setAsignacionEdit(null);
            await fetchData();
            Swal.fire("Éxito", "Asignación del plan guardada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar la asignación del plan."), "error");
        }
    };

    const handleDelete = async (item) => {
        const result = await Swal.fire({
            title: `¿Eliminar ${item.isGrouped ? "grupo" : "asignación"}?`,
            text: item.isGrouped ? "Se eliminarán las asignaciones de todos los clientes de este grupo." : "Se quitará esta asignación del plan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            if (item.isGrouped) {
                await apiClient.delete(`/gimnasio/planes-entrenamiento/${id}/asignaciones/grupo`, {
                    data: { nombre_grupo: item.nombre_grupo }
                });
            } else {
                await apiClient.delete(`/gimnasio/planes-entrenamiento/${id}/asignaciones/${item.id}`);
            }
            await fetchData();
            Swal.fire("Eliminado", "Asignación eliminada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar la asignación."), "error");
        }
    };

    const groupedAsignaciones = useMemo(() => {
        const result = [];
        asignaciones.forEach(item => {
            if (item.alcance === "INDIVIDUAL") {
                result.push({ ...item, isGrouped: false });
            } else {
                const existing = result.find(r => r.isGrouped && r.nombre_grupo === item.nombre_grupo);
                if (existing) {
                    if (item.persona_id) {
                        existing.persona_ids.push(item.persona_id);
                        existing.personas_detalle.push(item);
                    }
                    existing.ids.push(item.id);
                } else {
                    result.push({
                        ...item,
                        isGrouped: true,
                        persona_ids: item.persona_id ? [item.persona_id] : [],
                        personas_detalle: item.persona_id ? [item] : [],
                        ids: [item.id]
                    });
                }
            }
        });
        return result;
    }, [asignaciones]);

    if (loading) {
        return (
            <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                Cargando...
            </Box>
        );
    }

    if (!plan) {
        return (
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 4 }}>
                <Typography>No se encontró el plan solicitado.</Typography>
            </Paper>
        );
    }

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <AssignmentTurnedInIcon sx={{ color: "primary.main", fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                            Asignaciones del plan
                        </Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                        {plan.nombre}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip label={plan.tipo || "SIN TIPO"} sx={semanticChipSx("mustard")} />
                        <Chip label={plan.alcance || "GRUPAL"} sx={semanticChipSx(plan.alcance === "INDIVIDUAL" ? "inventory" : "success")} />
                        <Chip label={`${resumen.total} asignaciones`} sx={semanticChipSx("neutral")} />
                        <Chip label={`${resumen.activas} activas`} sx={semanticChipSx("success")} />
                    </Stack>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <PremiumButton variant="outline" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/entrenamiento/planes")}>
                        Volver
                    </PremiumButton>
                    <PremiumButton variant="outline" startIcon={<PlayArrowRoundedIcon />} onClick={goToExecution}>
                        Ir a ejecución
                    </PremiumButton>
                    <PremiumButton variant="anadir" onClick={() => { setAsignacionEdit(null); setModalOpen(true); }}>
                        Añadir
                    </PremiumButton>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Destino</TableCell>
                                <TableCell>Inicio</TableCell>
                                <TableCell>Fin</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Observaciones</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {asignaciones.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        Aún no hay asignaciones registradas para este plan.
                                    </TableCell>
                                </TableRow>
                            ) : groupedAsignaciones.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>
                                            {item.alcance === "INDIVIDUAL" 
                                                ? item.nombre_completo 
                                                : item.nombre_grupo}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                            {item.alcance === "INDIVIDUAL"
                                                ? `${item.codigo_socio || "Cliente"}${item.cedula ? ` · ${item.cedula}` : ""}` 
                                                : (item.personas_detalle?.length > 0 
                                                    ? `${item.personas_detalle.length} clientes asignados` 
                                                    : "Grupo vacío")}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{item.fecha_inicio || "-"}</TableCell>
                                    <TableCell>{item.fecha_fin || "-"}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.estado}
                                            sx={semanticChipSx(
                                                item.estado === "ACTIVO" ? "success" : item.estado === "PAUSADO" ? "mustard" : "neutral"
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 12, color: "#475569" }}>
                                            {item.observaciones || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <IconButton
                                                sx={semanticIconButtonSx("success")}
                                                onClick={goToExecution}
                                                title="Ir a ejecución"
                                            >
                                                <PlayArrowRoundedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                sx={semanticIconButtonSx("mustard")}
                                                onClick={() => { setAsignacionEdit(item); setModalOpen(true); }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton sx={semanticIconButtonSx("danger")} onClick={() => handleDelete(item)}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalAsignacionPlanEntrenamiento
                open={modalOpen}
                onClose={() => { setModalOpen(false); setAsignacionEdit(null); }}
                onSave={handleSave}
                dataEdit={asignacionEdit}
                plan={plan}
                personas={personas}
            />
        </Stack>
    );
}
