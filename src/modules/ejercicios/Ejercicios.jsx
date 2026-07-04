import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    MenuItem,
    Pagination,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    Divider,
    Fade,
    Paper,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import PageHeader from "../../components/ui/PageHeader";
import { filterInputSx, semanticIconButtonSx, tableSx, semanticChipSx } from "../../Styles/muiTheme";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { globalUi, globalBorderRadius, globalShadows } from "../../components/ui/GlobalUiTheme";
import ModalEjercicio from "./components/ModalEjercicio";

const pagePaperSx = {
    borderRadius: "var(--tg-radius-sm)",
    backgroundColor: "#FFFFFF",
    border: "1px solid var(--tg-card-border)",
    boxShadow: "var(--tg-shadow)",
};

const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
        let videoId = "";
        if (url.includes("youtube.com/shorts/")) {
            videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0]?.split("/")[0];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("youtube.com/watch")) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get("v");
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
        console.error("Error al parsear URL de video:", e);
        return null;
    }
};

const getMuscleGroupColor = (group) => {
    switch (String(group).toUpperCase()) {
        case "PECHO": return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.2)" };
        case "ESPALDA": return { bg: "rgba(79, 70, 229, 0.1)", text: "#4f46e5", border: "rgba(79, 70, 229, 0.2)" };
        case "PIERNAS": return { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
        case "HOMBROS": return { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" };
        case "BRAZOS": return { bg: "rgba(168, 85, 247, 0.1)", text: "#a855f7", border: "rgba(168, 85, 247, 0.2)" };
        case "ABDOMEN": return { bg: "rgba(6, 182, 212, 0.1)", text: "#06b6d4", border: "rgba(6, 182, 212, 0.2)" };
        case "CARDIO": return { bg: "rgba(236, 72, 153, 0.1)", text: "#ec4899", border: "rgba(236, 72, 153, 0.2)" };
        default: return { bg: "rgba(100, 116, 139, 0.1)", text: "#64748b", border: "rgba(100, 116, 139, 0.2)" };
    }
};

export default function Ejercicios() {
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filtroGrupo, setFiltroGrupo] = useState("");
    const [filtroEquipamiento, setFiltroEquipamiento] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Modal Add/Edit
    const [openModal, setOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedEjercicio, setSelectedEjercicio] = useState(null);

    // Video Player Modal
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoTitle, setVideoTitle] = useState("");

    // Detail Modal
    const [detailEjercicio, setDetailEjercicio] = useState(null);

    const fetchEjercicios = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get("/gimnasio/ejercicios", {
                params: {
                    buscar: search,
                    grupo_muscular: filtroGrupo,
                    equipamiento: filtroEquipamiento,
                    tipo_entrenamiento: filtroTipo
                }
            });
            setEjercicios(data || []);
            setPage(1);
        } catch (error) {
            console.error("Error al obtener catálogo de ejercicios:", error);
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el catálogo de ejercicios."), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEjercicios();
    }, [search, filtroGrupo, filtroEquipamiento, filtroTipo]);

    const paginatedEjercicios = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return ejercicios.slice(start, start + rowsPerPage);
    }, [ejercicios, page, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(ejercicios.length / rowsPerPage));

    const handleOpenCreate = () => {
        setSelectedEjercicio(null);
        setIsEditMode(false);
        setOpenModal(true);
    };

    const handleOpenEdit = (ejercicio) => {
        setSelectedEjercicio(ejercicio);
        setIsEditMode(true);
        setOpenModal(true);
    };

    const handleSave = async (formPayload) => {
        const payload = {
            nombre: formPayload.nombre,
            grupo_muscular: formPayload.grupo_muscular,
            equipamiento: formPayload.equipamiento,
            tipo_entrenamiento: formPayload.tipo_entrenamiento,
            instrucciones: formPayload.instrucciones,
            url_recurso: formPayload.tipo_recurso === "link" ? formPayload.url_recurso : "",
        };

        try {
            if (isEditMode && selectedEjercicio) {
                await apiClient.put(`/gimnasio/ejercicios/${selectedEjercicio.id}`, payload);
                Swal.fire({
                    title: "¡Éxito!",
                    text: "Ejercicio actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await apiClient.post("/gimnasio/ejercicios", payload);
                Swal.fire({
                    title: "¡Éxito!",
                    text: "Ejercicio creado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            fetchEjercicios();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", getApiErrorMessage(error, "Ocurrió un error al guardar el ejercicio."), "error");
            throw error; // Let the modal handle loading state
        }
    };

    const handleDelete = async (ejercicio) => {
        const result = await Swal.fire({
            title: "¿Eliminar Ejercicio?",
            text: `¿Estás seguro de que deseas eliminar "${ejercicio.nombre}" del catálogo? Las rutinas existentes conservarán el registro de forma segura.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: globalUi.danger,
            cancelButtonColor: globalUi.muted,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/gimnasio/ejercicios/${ejercicio.id}`);
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "El ejercicio ha sido retirado del catálogo.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchEjercicios();
            } catch (error) {
                console.error(error);
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar el ejercicio."), "error");
            }
        }
    };

    const handlePlayVideo = (ejercicio) => {
        const embedUrl = getEmbedUrl(ejercicio.url_recurso);
        if (embedUrl) {
            setVideoUrl(embedUrl);
            setVideoTitle(ejercicio.nombre);
        } else {
            Swal.fire("Enlace no disponible", "El enlace provisto no es compatible con el reproductor integrado. Puede abrirlo directamente.", "info");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        {/* Page Header */}
                        <PageHeader
                            title="Catálogo de Ejercicios"
                            rightContent={
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: "6px",
                                        bgcolor: "rgba(15, 23, 42, 0.05)",
                                        color: "#0f172a",
                                        fontSize: "11px",
                                        fontWeight: 900,
                                    }}
                                >
                                    {ejercicios.length} REGISTROS
                                </Box>
                            }
                        />

                        {/* List / Directory */}
                        <Paper
                            elevation={0}
                            sx={{
                                ...pagePaperSx,
                                bgcolor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                overflow: "hidden",
                            }}
                        >
                            {/* Filter and Action header */}
                            <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por nombre..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        sx={{ ...filterInputSx, width: 280 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    
                                    <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <Select
                                            value={filtroGrupo}
                                            onChange={(e) => setFiltroGrupo(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="">Todos los grupos</MenuItem>
                                            <MenuItem value="PECHO">Pecho</MenuItem>
                                            <MenuItem value="ESPALDA">Espalda</MenuItem>
                                            <MenuItem value="PIERNAS">Piernas</MenuItem>
                                            <MenuItem value="HOMBROS">Hombros</MenuItem>
                                            <MenuItem value="BRAZOS">Brazos</MenuItem>
                                            <MenuItem value="ABDOMEN">Abdomen</MenuItem>
                                            <MenuItem value="CARDIO">Cardio</MenuItem>
                                            <MenuItem value="OTRO">Otro</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <Select
                                            value={filtroEquipamiento}
                                            onChange={(e) => setFiltroEquipamiento(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="">Cualquier equipamiento</MenuItem>
                                            <MenuItem value="MANCUERNAS">Mancuernas</MenuItem>
                                            <MenuItem value="BARRA">Barra</MenuItem>
                                            <MenuItem value="MAQUINA">Máquina</MenuItem>
                                            <MenuItem value="POLEA">Polea</MenuItem>
                                            <MenuItem value="PESO_CORPORAL">Peso Corporal</MenuItem>
                                            <MenuItem value="BANDA_RESISTENCIA">Banda de Resistencia</MenuItem>
                                            <MenuItem value="OTRO">Otro</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <Select
                                            value={filtroTipo}
                                            onChange={(e) => setFiltroTipo(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="">Cualquier tipo</MenuItem>
                                            <MenuItem value="GENERAL">General</MenuItem>
                                            <MenuItem value="HIBRIDO">Híbrido</MenuItem>
                                            <MenuItem value="DEPORTIVO">Deportivo</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <PremiumButton
                                    variant="anadir"
                                    onClick={handleOpenCreate}
                                >
                                    Añadir
                                </PremiumButton>
                            </Box>

                            <Box sx={{ px: 4, pb: 4 }}>
                                {/* Catalog Grid */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: globalUi.mustard }} />
                </Box>
            ) : ejercicios.length === 0 ? (
                <Box sx={{ 
                    py: 10, 
                    px: 4,
                    textAlign: "center",
                    bgcolor: "rgba(15, 23, 42, 0.03)",
                    borderRadius: globalBorderRadius.md,
                    border: "1px dashed rgba(15, 23, 42, 0.1)",
                    width: "100%",
                }}>
                    <FitnessCenterIcon sx={{ fontSize: 48, color: "rgba(0,0,0,0.15)", mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 800, color: globalUi.muted }}>
                        No se encontraron ejercicios
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.4)", mt: 0.5 }}>
                        Prueba ajustando los filtros de búsqueda o crea uno nuevo.
                    </Typography>
                </Box>
            ) : (
                <>
                    <TableContainer>
                        <Table sx={{ ...tableSx, minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ejercicio</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Grupo Muscular</TableCell>
                                    <TableCell>Equipamiento</TableCell>
                                    <TableCell>Video</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedEjercicios.map((ejer) => {
                                    const muscleColors = getMuscleGroupColor(ejer.grupo_muscular);
                                    const hasVideo = !!getEmbedUrl(ejer.url_recurso);

                                    // Determine chip style based on tipo_entrenamiento
                                    let typeColor = "gray";
                                    if (ejer.tipo_entrenamiento === "HIBRIDO") typeColor = "orange";
                                    else if (ejer.tipo_entrenamiento === "DEPORTIVO") typeColor = "blue";
                                    else if (ejer.tipo_entrenamiento === "GENERAL") typeColor = "green";

                                    return (
                                        <TableRow key={ejer.id} hover>
                                            <TableCell>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: "13px",
                                                        color: globalUi.black,
                                                        cursor: "pointer",
                                                        "&:hover": { color: globalUi.mustard }
                                                    }}
                                                    onClick={() => setDetailEjercicio(ejer)}
                                                >
                                                    {ejer.nombre}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: globalUi.muted, fontSize: "12px", mt: 0.5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>
                                                    {ejer.instrucciones || "Sin instrucciones."}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ejer.tipo_entrenamiento || "GENERAL"}
                                                    size="small"
                                                    sx={{ ...semanticChipSx(typeColor), fontWeight: 800 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ejer.grupo_muscular}
                                                    size="small"
                                                    sx={{ ...semanticChipSx("blue"), fontWeight: 800 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ejer.equipamiento?.replace("_", " ")}
                                                    size="small"
                                                    sx={{ ...semanticChipSx("gray"), fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {hasVideo ? (
                                                    <Tooltip title="Ver Guía de Video">
                                                        <IconButton
                                                            onClick={() => handlePlayVideo(ejer)}
                                                            sx={semanticIconButtonSx("inventory")}
                                                        >
                                                            <PlayCircleOutlineIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.3)", fontWeight: 500 }}>
                                                        N/A
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            onClick={() => handleOpenEdit(ejer)}
                                                            sx={semanticIconButtonSx("mustard")}
                                                        >
                                                            <EditIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            onClick={() => handleDelete(ejer)}
                                                            sx={semanticIconButtonSx("danger")}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {ejercicios.length > rowsPerPage && (
                        <Box sx={{ borderTop: "1px solid var(--tg-card-border)" }}>
                            <TablePagination
                                component="div"
                                count={ejercicios.length}
                                page={page - 1}
                                onPageChange={(e, v) => setPage(v + 1)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(1);
                                }}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                sx={{
                                    ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: globalUi.muted,
                                        fontFamily: "var(--tg-font-family)",
                                    },
                                    ".MuiTablePagination-select": {
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        fontFamily: "var(--tg-font-family)",
                                    },
                                }}
                            />
                        </Box>
                    )}
                </>
            )}
                            </Box>
                        </Paper>
                    </Stack>
                </Fade>
            </Box>

            {/* Add / Edit Modal */}
            <ModalEjercicio
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={handleSave}
                dataEdit={selectedEjercicio}
                isEditMode={isEditMode}
            />

            {/* Video Player Modal */}
            <Dialog
                open={!!videoUrl}
                onClose={() => setVideoUrl(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: globalBorderRadius.md,
                        boxShadow: globalShadows.modal,
                        overflow: "hidden"
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: globalUi.black,
                        color: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 2,
                        px: 3
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <PlayCircleOutlineIcon sx={{ color: globalUi.mustard, fontSize: 22 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: "14px" }}>
                            Demostración: {videoTitle}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setVideoUrl(null)} size="small" sx={{ color: "#fff" }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>
                <Divider sx={{ borderColor: globalUi.mustard, borderBottomWidth: 2 }} />
                <DialogContent sx={{ p: 0, bgcolor: "#000", aspectRatio: "9/16", maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {videoUrl && (
                        <iframe
                            width="100%"
                            height="100%"
                            src={videoUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ border: 0 }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Detailed Info Modal */}
            <Dialog
                open={!!detailEjercicio}
                onClose={() => setDetailEjercicio(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: globalBorderRadius.md,
                        boxShadow: globalShadows.modal,
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: globalUi.black,
                        color: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 2,
                        px: 3
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <FitnessCenterIcon sx={{ color: globalUi.mustard }} />
                        <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>
                            Detalle del Ejercicio
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setDetailEjercicio(null)} size="small" sx={{ color: "#fff" }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>
                <Divider sx={{ borderColor: globalUi.mustard, borderBottomWidth: 2 }} />
                <DialogContent sx={{ p: 3.5 }}>
                    {detailEjercicio && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={getEmbedUrl(detailEjercicio.url_recurso) ? 6 : 12}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: globalUi.black, mb: 1 }}>
                                    {detailEjercicio.nombre}
                                </Typography>

                                <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                                    <Chip
                                        label={`TIPO: ${detailEjercicio.tipo_entrenamiento || "GENERAL"}`}
                                        sx={{
                                            bgcolor: detailEjercicio.tipo_entrenamiento === "HIBRIDO" ? "rgba(249, 115, 22, 0.1)" : (detailEjercicio.tipo_entrenamiento === "DEPORTIVO" ? "rgba(59, 130, 246, 0.1)" : "rgba(34, 197, 94, 0.1)"),
                                            color: detailEjercicio.tipo_entrenamiento === "HIBRIDO" ? "#f97316" : (detailEjercicio.tipo_entrenamiento === "DEPORTIVO" ? "#3b82f6" : "#22c55e"),
                                            fontWeight: 900,
                                            fontSize: "11px",
                                            borderRadius: "4px"
                                        }}
                                    />
                                    <Chip
                                        label={`GRUPO: ${detailEjercicio.grupo_muscular}`}
                                        sx={{
                                            bgcolor: getMuscleGroupColor(detailEjercicio.grupo_muscular).bg,
                                            color: getMuscleGroupColor(detailEjercicio.grupo_muscular).text,
                                            fontWeight: 900,
                                            fontSize: "11px",
                                            borderRadius: "4px"
                                        }}
                                    />
                                    <Chip
                                        label={`EQUIPO: ${detailEjercicio.equipamiento?.replace("_", " ")}`}
                                        variant="outlined"
                                        sx={{
                                            color: globalUi.muted,
                                            borderColor: globalUi.border,
                                            fontWeight: 700,
                                            fontSize: "11px",
                                            borderRadius: "4px"
                                        }}
                                    />
                                </Stack>

                                <Typography sx={{ fontWeight: 800, fontSize: "12px", color: globalUi.muted, mb: 1, textTransform: "uppercase" }}>
                                    Instrucciones de Ejecución
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "13px",
                                        lineHeight: 1.6,
                                        color: globalUi.black,
                                        whiteSpace: "pre-line"
                                    }}
                                >
                                    {detailEjercicio.instrucciones || "No se especificaron instrucciones técnicas para este ejercicio."}
                                </Typography>
                            </Grid>

                            {getEmbedUrl(detailEjercicio.url_recurso) && (
                                <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontWeight: 800, fontSize: "12px", color: globalUi.muted, mb: 1.5, textTransform: "uppercase" }}>
                                        Guía de Ejecución en Video
                                    </Typography>
                                    <Box
                                        sx={{
                                            borderRadius: globalBorderRadius.md,
                                            overflow: "hidden",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                                            aspectRatio: "9/16",
                                            maxHeight: "60vh",
                                            mx: "auto",
                                            bgcolor: "#000",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={getEmbedUrl(detailEjercicio.url_recurso)}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            style={{ border: 0 }}
                                        />
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
