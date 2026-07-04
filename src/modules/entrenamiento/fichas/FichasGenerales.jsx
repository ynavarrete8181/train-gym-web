import { useEffect, useState } from "react";
import { Box, Chip, IconButton, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../personas/personas.utils";
import ModalFichaTecnica from "../../personas/components/ModalFichaTecnica";

export default function FichasGenerales() {
    const [buscar, setBuscar] = useState("");
    const [fichas, setFichas] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [fichaEdit, setFichaEdit] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [fichasRes, personasRes] = await Promise.all([
                apiClient.get("/gimnasio/fichas-tecnicas", { params: { buscar } }),
                apiClient.get("/gimnasio/personas"),
            ]);
            setFichas(fichasRes.data || []);
            setPersonas(personasRes.data || []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar las Fichas Generales."), "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, [buscar]);

    const handleSave = async (payload) => {
        try {
            if (fichaEdit?.ficha_id) {
                await apiClient.put(`/gimnasio/fichas-tecnicas/${fichaEdit.ficha_id}`, payload);
            } else {
                await apiClient.post("/gimnasio/fichas-tecnicas", payload);
            }
            setModalOpen(false);
            setFichaEdit(null);
            await fetchData();
            Swal.fire("Éxito", "Ficha técnica guardada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar la Ficha Técnica."), "error");
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar Ficha?",
            text: "Se eliminarán también las mediciones asociadas. Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/fichas-tecnicas/${id}`);
            await fetchData();
            Swal.fire("Eliminado", "Ficha eliminada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar la ficha."), "error");
        }
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <AssessmentOutlinedIcon sx={{ color: "#eab308", fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Fichas</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Controla las evaluaciones corporales, medidas y antropometría de todos los clientes.
                    </Typography>
                </Box>
                <PremiumButton variant="anadir" onClick={() => { setFichaEdit(null); setModalOpen(true); }}>
                    Añadir
                </PremiumButton>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ mb: 3 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por cliente o cédula..."
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
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Fecha Medición</TableCell>
                                <TableCell>Peso / Talla</TableCell>
                                <TableCell>IMC / % Grasa</TableCell>
                                <TableCell sx={{ maxWidth: 250 }}>Objetivo</TableCell>
                                <TableCell align="center" sx={{ width: 120 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fichas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay fichas registradas que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : fichas.map((item) => (
                                <TableRow key={item.ficha_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>{item.fecha_ficha}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13 }}>{item.peso_kg ? `${item.peso_kg} kg` : "N/A"}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.talla_cm ? `${item.talla_cm} cm` : "N/A"}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`IMC: ${item.imc || "N/A"}`} size="small" sx={{ mb: 0.5, fontSize: "10px", height: "20px" }} />
                                        <br/>
                                        <Typography sx={{ fontSize: 12, color: "#64748b" }}>Grasa: {item.grasa_corporal_pct ? `${item.grasa_corporal_pct}%` : "N/A"}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.objetivo}>
                                        {item.objetivo || "N/A"}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <IconButton sx={semanticIconButtonSx("mustard")} onClick={() => { setFichaEdit(item); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton sx={semanticIconButtonSx("danger")} onClick={() => handleDelete(item.ficha_id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalFichaTecnica 
                open={modalOpen} 
                onClose={() => { setModalOpen(false); setFichaEdit(null); }} 
                onSave={handleSave} 
                personas={personas} 
                dataEdit={fichaEdit} 
                isEditMode={!!fichaEdit} 
            />
        </Stack>
    );
}
