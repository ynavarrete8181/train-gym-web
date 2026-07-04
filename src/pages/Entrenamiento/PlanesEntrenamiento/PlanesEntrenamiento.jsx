import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../../modules/personas/personas.utils";
import ModalPlanEntrenamiento from "./components/ModalPlanEntrenamiento";

const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const calculateExpectedWeeks = (plan) => {
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

export default function PlanesEntrenamiento() {
    const navigate = useNavigate();
    const [buscar, setBuscar] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [planes, setPlanes] = useState([]);
    const [planEdit, setPlanEdit] = useState(null);
    const [planModalOpen, setPlanModalOpen] = useState(false);

    const fetchPlanes = async () => {
        try {
            const { data } = await apiClient.get("/gimnasio/planes-entrenamiento", {
                params: {
                    buscar: buscar || undefined,
                    estado: estadoFiltro || undefined,
                },
            });
            setPlanes(data || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar los planes de entrenamiento."), "error");
        }
    };

    useEffect(() => {
        fetchPlanes();
    }, [buscar, estadoFiltro]);

    const resumen = useMemo(() => ({
        total: planes.length,
        activos: planes.filter((item) => item.estado === "ACTIVO").length,
    }), [planes]);

    const handleSavePlan = async (payload) => {
        try {
            if (planEdit?.id) {
                await apiClient.put(`/gimnasio/planes-entrenamiento/${planEdit.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/planes-entrenamiento", payload);
            }

            setPlanModalOpen(false);
            setPlanEdit(null);
            await fetchPlanes();
            Swal.fire("Éxito", "Plan guardado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el plan."), "error");
        }
    };

    const handleDeletePlan = async (plan) => {
        const result = await Swal.fire({
            title: "¿Eliminar plan?",
            text: `Se eliminará "${plan.nombre}" y su detalle asociado.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/planes-entrenamiento/${plan.id}`);
            await fetchPlanes();
            Swal.fire("Eliminado", "Plan eliminado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar el plan."), "error");
        }
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <FitnessCenterIcon sx={{ color: "primary.main", fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                            Planes
                        </Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Administra los planes base de entrenamiento antes de configurar sus días, bloques y ejercicios.
                    </Typography>
                </Box>

                <PremiumButton variant="anadir" onClick={() => { setPlanEdit(null); setPlanModalOpen(true); }}>
                    Añadir
                </PremiumButton>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { lg: "center" }, justifyContent: "space-between" }}>
                    <TextField
                        size="small"
                        placeholder="Buscar nombre, tipo, objetivo o estado..."
                        value={buscar}
                        onChange={(event) => setBuscar(event.target.value)}
                        sx={{ ...filterInputSx, width: { xs: "100%", lg: 320 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ ...filterInputSx, width: 220 }}>
                        <Select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} displayEmpty>
                            <MenuItem value="">Todos los estados</MenuItem>
                            <MenuItem value="BORRADOR">Borrador</MenuItem>
                            <MenuItem value="ACTIVO">Activo</MenuItem>
                            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Plan</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Alcance</TableCell>
                                <TableCell>Estructura</TableCell>
                                <TableCell>Objetivo</TableCell>
                                <TableCell>Fechas</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Días</TableCell>
                                <TableCell align="center" sx={{ width: 180 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {planes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay planes registrados con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : planes.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography>
                                        {item.observaciones && (
                                            <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.5 }}>
                                                {item.observaciones}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.tipo || "SIN TIPO"}
                                            size="small"
                                            sx={{
                                                ...semanticChipSx("neutral"),
                                                fontSize: "10px",
                                                height: "20px",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.alcance || "GRUPAL"}
                                            size="small"
                                            sx={{
                                                ...semanticChipSx(item.alcance === "INDIVIDUAL" ? "inventory" : "success"),
                                                fontSize: "10px",
                                                height: "20px",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.estructura || "SEMANAL"}
                                            size="small"
                                            sx={{
                                                ...semanticChipSx("inventory"),
                                                fontSize: "10px",
                                                height: "20px",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {item.objetivo || "Sin objetivo definido"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.fecha_inicio}</Typography>
                                        {item.fecha_fin && (
                                            <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.5 }}>
                                                Fin: {item.fecha_fin}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.estado}
                                            size="small"
                                            sx={{
                                                ...semanticChipSx(
                                                    item.estado === "ACTIVO" ? "success" : item.estado === "BORRADOR" ? "mustard" : "neutral"
                                                ),
                                                fontSize: "10px",
                                                height: "20px",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const semanasEsperadas = calculateExpectedWeeks(item);
                                            return (
                                                <>
                                        <Typography sx={{ fontSize: 15, fontWeight: 900, color: "primary.main" }}>
                                            {item.total_dias}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                            semanas: {item.total_semanas} de {semanasEsperadas}
                                        </Typography>
                                                </>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <IconButton
                                                sx={semanticIconButtonSx("success")}
                                                onClick={() => navigate(`/entrenamiento/planes/${item.id}/asignaciones`)}
                                            >
                                                <AssignmentTurnedInIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                sx={semanticIconButtonSx("inventory")}
                                                onClick={() => navigate(`/entrenamiento/planes/${item.id}/configuracion`)}
                                            >
                                                <SettingsOutlinedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton sx={semanticIconButtonSx("mustard")} onClick={() => { setPlanEdit(item); setPlanModalOpen(true); }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton sx={semanticIconButtonSx("danger")} onClick={() => handleDeletePlan(item)}>
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

            <ModalPlanEntrenamiento
                open={planModalOpen}
                onClose={() => { setPlanModalOpen(false); setPlanEdit(null); }}
                onSave={handleSavePlan}
                dataEdit={planEdit}
            />
        </Stack>
    );
}
