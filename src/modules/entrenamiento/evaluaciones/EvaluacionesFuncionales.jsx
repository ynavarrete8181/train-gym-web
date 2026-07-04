import { useEffect, useMemo, useState } from "react";
import { Box, Chip, FormControl, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AccessibilityNewOutlinedIcon from "@mui/icons-material/AccessibilityNewOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../personas/personas.utils";
import ModalEvaluacion from "./components/ModalEvaluacion";

export default function EvaluacionesFuncionales() {
    const [buscar, setBuscar] = useState("");
    const [tipoEvaluacionFiltro, setTipoEvaluacionFiltro] = useState("");
    const [personas, setPersonas] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [evaluacionEdit, setEvaluacionEdit] = useState(null);
    const [evaluacionModalOpen, setEvaluacionModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [personasRes, evaluacionesRes] = await Promise.all([
                apiClient.get("/gimnasio/personas"),
                apiClient.get("/gimnasio/evaluaciones", { params: { buscar } }),
            ]);
            setPersonas(personasRes.data || []);
            setEvaluaciones(evaluacionesRes.data || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar las Evaluaciones."), "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, [buscar]);

    const resumen = useMemo(() => ({
        evaluaciones: evaluaciones.length,
        clientes: new Set(evaluaciones.map((e) => e.persona_id)).size,
    }), [evaluaciones]);

    const evaluacionesFiltradas = useMemo(() => {
        return evaluaciones.filter((item) => !tipoEvaluacionFiltro || item.tipo_evaluacion === tipoEvaluacionFiltro);
    }, [evaluaciones, tipoEvaluacionFiltro]);

    const ultimaEvaluacion = useMemo(() => evaluaciones[0] || null, [evaluaciones]);

    const handleSaveEvaluacion = async (payload) => {
        try {
            if (evaluacionEdit?.id) {
                await apiClient.put(`/gimnasio/evaluaciones/${evaluacionEdit.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/evaluaciones", payload);
            }
            setEvaluacionModalOpen(false);
            setEvaluacionEdit(null);
            await fetchData();
            Swal.fire("Éxito", "Evaluación guardada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar la evaluación."), "error");
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar registro?",
            text: "Esta acción quitará el registro seleccionado del historial.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/evaluaciones/${id}`);
            await fetchData();
            Swal.fire("Eliminado", "Registro eliminado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar el registro."), "error");
        }
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <AccessibilityNewOutlinedIcon sx={{ color: "primary.main", fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Evaluaciones Físicas</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Controla las evaluaciones de rendimiento, movilidad y funcionales de los clientes.
                    </Typography>
                </Box>
                <PremiumButton variant="anadir" onClick={() => { setEvaluacionEdit(null); setEvaluacionModalOpen(true); }}>
                    Añadir
                </PremiumButton>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { lg: "center" }, justifyContent: "space-between" }}>
                    <TextField
                        size="small"
                        placeholder="Buscar cliente..."
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
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
                        <Select value={tipoEvaluacionFiltro} onChange={(e) => setTipoEvaluacionFiltro(e.target.value)} displayEmpty>
                            <MenuItem value="">Todos los tipos</MenuItem>
                            <MenuItem value="CORPORAL">Corporal</MenuItem>
                            <MenuItem value="FUNCIONAL">Funcional</MenuItem>
                            <MenuItem value="MOVILIDAD">Movilidad</MenuItem>
                            <MenuItem value="DEPORTIVA">Deportiva</MenuItem>
                            <MenuItem value="REHABILITACION">Rehabilitación</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Nivel / Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell sx={{ maxWidth: 250 }}>Resumen</TableCell>
                                <TableCell align="center" sx={{ width: 120 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {evaluacionesFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay evaluaciones que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : evaluacionesFiltradas.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell><Chip label={item.tipo_evaluacion} size="small" sx={{ ...semanticChipSx("mustard"), fontSize: "10px", height: "20px" }} /></TableCell>
                                    <TableCell>
                                        {item.nivel_resultado === "BAJO" && <Chip label="🔴 Bajo" size="small" sx={{ ...semanticChipSx("danger"), fontSize: "10px", height: "20px" }} />}
                                        {item.nivel_resultado === "MEDIO" && <Chip label="🟡 Medio" size="small" sx={{ ...semanticChipSx("neutral"), fontSize: "10px", height: "20px" }} />}
                                        {item.nivel_resultado === "ALTO" && <Chip label="🟢 Alto" size="small" sx={{ ...semanticChipSx("success"), fontSize: "10px", height: "20px" }} />}
                                        {item.nivel_resultado === "EXCELENTE" && <Chip label="🏆 Excelente" size="small" sx={{ ...semanticChipSx("mustard"), fontSize: "10px", height: "20px" }} />}
                                        {item.nivel_resultado === "MEJORO_TECNICA" && <Chip label="💪 Mejoró Técnica" size="small" sx={{ ...semanticChipSx("inventory"), fontSize: "10px", height: "20px" }} />}
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.fecha_evaluacion}</Typography>
                                        {item.fecha_proxima_evaluacion && (
                                            <Typography sx={{ fontSize: 11, color: "primary.main", fontWeight: 700, mt: 0.5 }}>
                                                Próx: {item.fecha_proxima_evaluacion}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.resultado_resumen}>
                                        {item.resultado_resumen || "Sin resumen"}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <IconButton sx={semanticIconButtonSx("mustard")} onClick={() => { setEvaluacionEdit(item); setEvaluacionModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton sx={semanticIconButtonSx("danger")} onClick={() => handleDelete(item.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalEvaluacion
                open={evaluacionModalOpen}
                onClose={() => { setEvaluacionModalOpen(false); setEvaluacionEdit(null); }}
                onSave={handleSaveEvaluacion}
                personas={personas}
                dataEdit={evaluacionEdit}
                isEditMode={!!evaluacionEdit}
            />
        </Stack>
    );
}
