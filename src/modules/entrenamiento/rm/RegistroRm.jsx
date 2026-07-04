import { useEffect, useMemo, useState } from "react";
import { Box, Chip, FormControl, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../personas/personas.utils";
import ModalRm from "./components/ModalRm";

export default function RegistroRm() {
    const [buscar, setBuscar] = useState("");
    const [tipoRmFiltro, setTipoRmFiltro] = useState("");
    const [personas, setPersonas] = useState([]);
    const [ejercicios, setEjercicios] = useState([]);
    const [rmRegistros, setRmRegistros] = useState([]);
    const [rmEdit, setRmEdit] = useState(null);
    const [rmModalOpen, setRmModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [personasRes, ejerciciosRes, rmRes] = await Promise.all([
                apiClient.get("/gimnasio/personas"),
                apiClient.get("/gimnasio/ejercicios"),
                apiClient.get("/gimnasio/rm-registros", { params: { buscar } }),
            ]);
            setPersonas(personasRes.data || []);
            setEjercicios(ejerciciosRes.data || []);
            setRmRegistros(rmRes.data || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar los Registros RM."), "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, [buscar]);

    const resumen = useMemo(() => ({
        rm: rmRegistros.length,
        clientes: new Set(rmRegistros.map((r) => r.persona_id)).size,
    }), [rmRegistros]);

    const rmFiltrados = useMemo(() => {
        return rmRegistros.filter((item) => !tipoRmFiltro || item.tipo_registro === tipoRmFiltro);
    }, [rmRegistros, tipoRmFiltro]);

    const topRm = useMemo(() => {
        if (!rmRegistros.length) return null;
        return [...rmRegistros].sort((a, b) => Number(b.rm_estimado || 0) - Number(a.rm_estimado || 0))[0];
    }, [rmRegistros]);

    const handleSaveRm = async (payload) => {
        try {
            if (rmEdit?.id) {
                await apiClient.put(`/gimnasio/rm-registros/${rmEdit.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/rm-registros", payload);
            }
            setRmModalOpen(false);
            setRmEdit(null);
            await fetchData();
            Swal.fire("Éxito", "Registro RM guardado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el registro RM."), "error");
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
            await apiClient.delete(`/gimnasio/rm-registros/${id}`);
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
                        <FitnessCenterIcon sx={{ color: "primary.main", fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>RM</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Controla y monitorea la fuerza máxima levantada por cada cliente.
                    </Typography>
                </Box>
                <PremiumButton variant="anadir" onClick={() => { setRmEdit(null); setRmModalOpen(true); }}>
                    Añadir
                </PremiumButton>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { lg: "center" }, justifyContent: "space-between" }}>
                    <TextField
                        size="small"
                        placeholder="Buscar cliente, ejercicio o tipo..."
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
                        <Select value={tipoRmFiltro} onChange={(e) => setTipoRmFiltro(e.target.value)} displayEmpty>
                            <MenuItem value="">Todos los tipos</MenuItem>
                            <MenuItem value="1RM_DIRECTO">1 RM Directo</MenuItem>
                            <MenuItem value="RM_ESTIMADO">RM Estimado (Fórmula)</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Ejercicio</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <span>Marca / RM</span>
                                        <Tooltip 
                                            title="El RM estimado se calcula mediante la fórmula de Epley: Peso × (1 + Repeticiones / 30). Permite estimar tu fuerza máxima teórica de forma segura." 
                                            arrow 
                                            placement="top"
                                        >
                                            <HelpOutlineIcon sx={{ fontSize: 16, color: "#64748b", cursor: "help" }} />
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center" sx={{ width: 120 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rmFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay registros RM que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : rmFiltrados.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>{item.ejercicio_nombre}</Typography>
                                        <Chip label={item.tipo_registro} size="small" sx={{ ...semanticChipSx("neutral"), fontSize: "10px", mt: 0.5, height: "20px" }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.fecha_registro}</Typography>
                                        {item.fecha_proximo_control && (
                                            <Typography sx={{ fontSize: 11, color: "primary.main", fontWeight: 700, mt: 0.5 }}>
                                                Próx: {item.fecha_proximo_control}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 15, fontWeight: 900, color: "primary.main" }}>{item.rm_estimado} kg</Typography>
                                        {item.tipo_registro === "RM_ESTIMADO" && (
                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                                {item.peso_levantado}kg × {item.repeticiones} reps
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <IconButton sx={semanticIconButtonSx("mustard")} onClick={() => { setRmEdit(item); setRmModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton sx={semanticIconButtonSx("danger")} onClick={() => handleDelete(item.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalRm
                open={rmModalOpen}
                onClose={() => { setRmModalOpen(false); setRmEdit(null); }}
                onSave={handleSaveRm}
                personas={personas}
                ejercicios={ejercicios}
                dataEdit={rmEdit}
                isEditMode={!!rmEdit}
            />
        </Stack>
    );
}
