// src/screens/atencion/CategoriaActivos.jsx
import {
    Box,
    Chip,
    CircularProgress,
    FormHelperText,
    FormControlLabel,
    Checkbox,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Pagination,
    Typography,
    Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import axiosClient from "../../../../../axios/axios_client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt, faPlusSquare } from "@fortawesome/free-solid-svg-icons";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

// Excel / PDF (igual a Insumos)
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

const CategoriaActivos = ({ usr_id }) => {
    const [dataCategoriaActivo, setDataCategoriaActivo] = useState([]);
    const [filteredCategoriaActivos, setFilteredCategoriaActivos] = useState([]);

    const [openDialogCategoriaActivo, setOpenDialogCategoriaActivo] = useState(false);
    const [selectedCategoriaActivo, setSelectedCategoriaActivos] = useState(null);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(
        parseInt(localStorage.getItem("rowsPerPageKardex") || "10", 10)
    );

    const [formDataCategoriaActivos, setFormDataCategoriaActivos] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Estados
    const [dataEstado, setDataEstado] = useState([]);

    // Filtros (igual a Insumos)
    const [searchText, setSearchText] = useState("");
    const [filterEstado, setFilterEstado] = useState("0");

    // Checkbox de estado (8 = Activo, 9 = Inactivo)
    const [isActivo, setIsActivo] = useState(true);

    // =========================
    // FETCH DATA
    // =========================
    const fetchDataCategoriaActivo = async () => {
        setLoading(true);
        try {
            const resp = await axiosClient.get("/inventario/categorias");
            const payload = resp?.data;
            const rows = Array.isArray(payload) ? payload : payload?.data || [];
            setDataCategoriaActivo(rows);
            setFilteredCategoriaActivos(rows);
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
            setDataCategoriaActivo([]);
            setFilteredCategoriaActivos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataCategoriaActivo();
    }, []);

    const fetchDataEstado = async () => {
        try {
            const response = await axiosClient.get("/consultar-estados");
            const data = response.data;
            const mapData = (Array.isArray(data) ? data : []).map((item) => ({
                value: item.id,
                label: item.estado,
            }));
            setDataEstado(mapData);
        } catch (error) {
            Swal.fire("¡Error!", "Error al cargar los Estados", error.message);
        }
    };

    useEffect(() => {
        fetchDataEstado();
    }, []);

    // =========================
    // FILTROS (igual a Insumos)
    // =========================
    useEffect(() => {
        let result = Array.isArray(dataCategoriaActivo) ? [...dataCategoriaActivo] : [];

        if (searchText.trim() !== "") {
            const value = searchText.toLowerCase();
            result = result.filter(
                (item) =>
                    String(item.ca_id || "").toLowerCase().includes(value) ||
                    (item.ca_descripcion || "").toLowerCase().includes(value) ||
                    (item.estado || "").toLowerCase().includes(value)
            );
        }

        if (filterEstado !== "0") {
            result = result.filter(
                (item) => String(item.ca_id_estado) === String(filterEstado)
            );
        }

        setFilteredCategoriaActivos(result);
        setPage(1);
    }, [dataCategoriaActivo, searchText, filterEstado]);

    const handleSearch = (e) => setSearchText(e.target.value);

    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        localStorage.setItem("rowsPerPageKardex", value);
        setPage(1);
    };

    // =========================
    // CRUD
    // =========================
    const handleAgregarNuevo = () => {
        setOpenDialogCategoriaActivo(true);
        setSelectedCategoriaActivos(null);
        setErrors({});
        setIsActivo(true);

        setFormDataCategoriaActivos({
            id_usuario: usr_id,
            "txt-descripcion": "",
            "select-estado": 8, // activo por defecto
        });
    };

    const handleCloseDialog = () => {
        setFormDataCategoriaActivos({});
        setSelectedCategoriaActivos(null);
        setOpenDialogCategoriaActivo(false);
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};
        const desc = formDataCategoriaActivos["txt-descripcion"];
        const est = formDataCategoriaActivos["select-estado"];

        if (!desc || desc.trim() === "") newErrors["txt-descripcion"] = "Debe ingresar la descripción";
        if (!est || est === "0") newErrors["select-estado"] = "Debe seleccionar un estado";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGuardarCategoriaActivos = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data: response } = await axiosClient.post("/inventario/categorias", formDataCategoriaActivos);
            if (response?.success) {
                Swal.fire("¡Éxito!", "Categoria Activo se agregó correctamente.", "success");
                fetchDataCategoriaActivo();
                setOpenDialogCategoriaActivo(false);
                setFormDataCategoriaActivos({});
            }
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditarCategoriaActivos = (data) => {
        setSelectedCategoriaActivos(data);
        setErrors({});
        setIsActivo(Number(data.ca_id_estado) === 8);

        setFormDataCategoriaActivos({
            id_usuario: usr_id,
            "txt-descripcion": data.ca_descripcion,
            "select-estado": data.ca_id_estado,
        });

        setOpenDialogCategoriaActivo(true);
    };

    const handleModificar = async () => {
        if (!selectedCategoriaActivo) return;
        if (!validateForm()) return;

        setLoading(true);
        try {
            await axiosClient.put(`/inventario/categorias/${selectedCategoriaActivo.ca_id}`, formDataCategoriaActivos);
            Swal.fire("¡Éxito!", "La categoria de activo se actualizó correctamente.", "success");
            fetchDataCategoriaActivo();
            setOpenDialogCategoriaActivo(false);
            setFormDataCategoriaActivos({});
            setSelectedCategoriaActivos(null);
        } catch (error) {
            Swal.fire("¡Error!", "Error al actualizar la categoria de activos.", "error");
        } finally {
            setLoading(false);
        }
    };

    // No cambies funcionalidad (igual a Insumos: placeholder)
    const handleEliminarCategoriaActivos = (id) => {
        Swal.fire("Info", "Función de eliminar categoría aún no implementada.", "info");
    };

    // =========================
    // EXPORT EXCEL / PDF (igual a Insumos)
    // =========================
    const handleExportExcel = () => {
        if (!Array.isArray(filteredCategoriaActivos) || filteredCategoriaActivos.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const dataToExport = filteredCategoriaActivos.map((item) => ({
            Id: item.ca_id,
            Descripción: item.ca_descripcion,
            Estado: item.estado,
            Creado: item.ca_created_at,
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CategoriasActivos");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });

        saveAs(blob, "categorias_activos.xlsx");
    };

    const handleExportPDF = () => {
        if (!Array.isArray(filteredCategoriaActivos) || filteredCategoriaActivos.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const doc = new jsPDF("l", "mm", "a4");
        doc.setFontSize(14);
        doc.text("Listado de Categorías de Activos", 14, 12);

        const columns = ["Id", "Descripción", "Estado", "Creado"];
        const rows = filteredCategoriaActivos.map((item) => [
            item.ca_id,
            item.ca_descripcion,
            item.estado,
            item.ca_created_at,
        ]);

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 18,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [20, 73, 133] },
        });

        doc.save("categorias_activos.pdf");
    };

    // =========================
    // PAGINACIÓN
    // =========================
    const paginatedData = Array.isArray(filteredCategoriaActivos)
        ? filteredCategoriaActivos.slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : [];

    const renderEstadoChip = (row) => {
        const idEstado = Number(row.ca_id_estado);

        const isAct = idEstado === 8;
        const label = row.estado || (isAct ? "Activo" : "Inactivo");

        const base = {
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "8px",
            height: 22,
        };

        if (idEstado === 8) {
            return (
                <Chip
                    size="small"
                    label={label}
                    variant="outlined"
                    sx={{ ...base, borderColor: "#2e7d32", color: "#2e7d32" }}
                />
            );
        }
        if (idEstado === 9) {
            return (
                <Chip
                    size="small"
                    label={label}
                    variant="outlined"
                    sx={{ ...base, borderColor: "#c62828", color: "#c62828" }}
                />
            );
        }
        return (
            <Chip
                size="small"
                label={label}
                variant="outlined"
                sx={{ ...base }}
            />
        );
    };

    const estadoOptions = Array.from(
        new Map(
            (dataCategoriaActivo || [])
                .filter((x) => x?.ca_id_estado != null)
                .map((x) => [
                    String(x.ca_id_estado),
                    { value: String(x.ca_id_estado), label: x.estado || `Estado ${x.ca_id_estado}` },
                ])
        ).values()
    );

    return (
        <Box sx={{ maxWidth: "100%", margin: "auto", p: 2 }}>
            {/* HEADER igual a Insumos */}
            <Paper
                elevation={8}
                sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: "white",
                    borderRadius: "10px",
                    borderTop: "3px solid #dedede",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                    },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "12px",
                            mr: 1.5,
                            border: "1px solid rgba(20,73,133,.25)",
                            bgcolor: "rgba(20,73,133,.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ReceiptLongIcon sx={{ mr: 1 }} />
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1f3a5f" }}>
                            Categorías de Activos
                        </Typography>
                    </Box>

                    <Chip
                        label={`${filteredCategoriaActivos.length} RESULTADOS`}
                        size="small"
                        sx={{ ml: "auto", fontWeight: 700 }}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Paper>

            {/* CARD filtros + acciones igual a Insumos */}
            <Paper
                elevation={8}
                sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: "white",
                    borderRadius: "10px",
                    borderTop: "3px solid #dedede",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                        "& .MuiTextField-root": {
                            "& label": { fontSize: "12px" },
                            "& input": { fontSize: "12px" },
                        },
                        "& .MuiButton-root": {
                            fontSize: "12px",
                            minHeight: "28px",
                            padding: "4px 12px",
                        },
                    }}
                >
                    {/* IZQUIERDA: filtros */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <TextField
                            label="Buscar"
                            variant="outlined"
                            size="small"
                            sx={{ width: "220px", "& input": { fontSize: "12px" } }}
                            value={searchText}
                            onChange={handleSearch}
                        />

                        {/* Filtro por estado */}
                        <FormControl sx={{ minWidth: 160 }} size="small">
                            <InputLabel id="filter-estado-label">Estado</InputLabel>
                            <Select
                                labelId="filter-estado-label"
                                value={filterEstado}
                                label="Estado"
                                onChange={(e) => setFilterEstado(e.target.value)}
                                sx={{ fontSize: "12px" }}
                            >
                                <MenuItem value="0" sx={{ fontSize: "12px" }}>
                                    Todos
                                </MenuItem>
                                {estadoOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value} sx={{ fontSize: "12px" }}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Mostrar */}
                        <FormControl sx={{ minWidth: 90 }} size="small">
                            <InputLabel id="rows-per-page-label">Mostrar</InputLabel>
                            <Select
                                labelId="rows-per-page-label"
                                id="rows-per-page"
                                value={rowsPerPage}
                                label="Mostrar"
                                onChange={handleChangeRowsPerPage}
                                sx={{ fontSize: "12px" }}
                            >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* DERECHA: exportar + añadir */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={handleExportExcel}
                            startIcon={<FaFileExcel size={18} />}
                            sx={{
                                textTransform: "uppercase",
                                borderRadius: "8px",
                                borderColor: "#2e7d32",
                                color: "#2e7d32",
                                fontWeight: 600,
                                "&:hover": {
                                    borderColor: "#1b5e20",
                                    backgroundColor: "rgba(46,125,50,0.08)",
                                },
                            }}
                        >
                            EXCEL
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={handleExportPDF}
                            startIcon={<FaFilePdf size={18} />}
                            sx={{
                                textTransform: "uppercase",
                                borderRadius: "8px",
                                borderColor: "#c62828",
                                color: "#c62828",
                                fontWeight: 600,
                                "&:hover": {
                                    borderColor: "#8e0000",
                                    backgroundColor: "rgba(198,40,40,0.08)",
                                },
                            }}
                        >
                            PDF
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleAgregarNuevo}
                            sx={{
                                backgroundColor: "rgba(20,73,133,1)",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "bold",
                                "&:hover": { backgroundColor: "rgba(15,60,110,1)" },
                            }}
                            startIcon={
                                <FontAwesomeIcon icon={faPlusSquare} style={{ color: "white", fontSize: "12px" }} />
                            }
                        >
                            Añadir
                        </Button>
                    </Box>
                </Box>

                {/* TABLA igual a Insumos */}
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 2,
                        border: "1px solid #e9eef5",
                        background: "#fff",
                    }}
                >
                    <Table
                        stickyHeader
                        size="small"
                        sx={{
                            "& th, & td": {
                                fontSize: "12px",
                                padding: "4px 6px",
                            },
                        }}
                    >
                        <TableHead>
                            <TableRow
                                sx={{
                                    "& th": {
                                        bgcolor: "#d5deecff",
                                        color: "#1f3a5f",
                                        fontWeight: 800,
                                        borderBottom: "1px solid #e6ebf2",
                                        py: 1,
                                    },
                                }}
                            >
                                <TableCell align="center">Id</TableCell>
                                <TableCell align="center">Descripción</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell align="center">Creado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ height: 50 }}>
                                        <CircularProgress size={30} color="primary" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData && paginatedData.length > 0 ? (
                                paginatedData.map((data) => (
                                    <TableRow key={data.ca_id} hover>
                                        <TableCell align="center">{data.ca_id}</TableCell>
                                        <TableCell>{data.ca_descripcion}</TableCell>
                                        <TableCell align="center">{renderEstadoChip(data)}</TableCell>
                                        <TableCell align="center">{data.ca_created_at}</TableCell>

                                        <TableCell align="center">
                                            {/* EDITAR (warning pro) */}
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    onClick={() => handleEditarCategoriaActivos(data)}
                                                    size="small"
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "6px",
                                                        border: "1px solid #f3d3a3",
                                                        backgroundColor: "#fff",
                                                        color: "#b45309",
                                                        mr: 0.75,
                                                        "&:hover": {
                                                            backgroundColor: "rgba(180,83,9,0.08)",
                                                            borderColor: "#b45309",
                                                        },
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: "12px" }} />
                                                </IconButton>
                                            </Tooltip>

                                            {/* ELIMINAR (error pro) */}
                                            <Tooltip title="Eliminar">
                                                <IconButton
                                                    onClick={() => handleEliminarCategoriaActivos(data.ca_id)}
                                                    size="small"
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "6px",
                                                        border: "1px solid #f5c2c2",
                                                        backgroundColor: "#fff",
                                                        color: "#b91c1c",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(185,28,28,0.08)",
                                                            borderColor: "#b91c1c",
                                                        },
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} style={{ fontSize: "12px" }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ fontSize: "12px", border: "1px solid #ccc" }}>
                                        No se encontraron categorías de activos.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINACIÓN igual a Insumos */}
                <Pagination
                    count={Math.ceil(filteredCategoriaActivos.length / rowsPerPage) || 1}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    showFirstButton
                    showLastButton
                    sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "center",
                        "& .MuiPaginationItem-root": {
                            color: "#000",
                            borderRadius: "6px",
                            backgroundColor: "#dedede",
                            fontSize: "12px",
                            minWidth: "24px",
                            height: "24px",
                            padding: "0 4px",
                        },
                        "& .Mui-selected": {
                            backgroundColor: "#bdbdbd !important",
                            color: "#000",
                            fontWeight: "bold",
                            fontSize: "12px",
                        },
                        "& .MuiPaginationItem-root:hover": {
                            backgroundColor: "#cfcfcf",
                        },
                    }}
                />

                {/* MODAL igual a Insumos */}
                <Dialog
                    open={openDialogCategoriaActivo}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3, boxShadow: 6 },
                    }}
                >
                    <DialogTitle
                        sx={{
                            backgroundColor: "rgba(20, 73, 133, 1)",
                            color: "white",
                            py: 2,
                            px: 3,
                            fontSize: "12px",
                            fontWeight: "bold",
                        }}
                    >
                        {selectedCategoriaActivo ? "Editar Categoría Activo" : "Agregar Categoría Activo"}
                    </DialogTitle>
                    <Divider />

                    <DialogContent
                        sx={{
                            p: 2.25,
                            "& .MuiInputBase-root": { fontSize: "12px" },
                            "& .MuiInputLabel-root": { fontSize: "12px" },
                            "& .MuiMenuItem-root": { fontSize: "12px" },
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    label="Descripción"
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={formDataCategoriaActivos["txt-descripcion"] ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormDataCategoriaActivos((prev) => ({ ...prev, "txt-descripcion": value }));
                                        if (errors["txt-descripcion"] && value.trim() !== "") {
                                            setErrors((prev) => {
                                                const ne = { ...prev };
                                                delete ne["txt-descripcion"];
                                                return ne;
                                            });
                                        }
                                    }}
                                    error={!!errors["txt-descripcion"]}
                                    helperText={errors["txt-descripcion"] || ""}
                                />
                            </Grid>

                            {/* Estado con checkbox (igual a Insumos) */}
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small" error={!!errors["select-estado"]}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isActivo}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setIsActivo(checked);
                                                    const value = checked ? 8 : 9;
                                                    setFormDataCategoriaActivos((prev) => ({ ...prev, "select-estado": value }));
                                                    if (errors["select-estado"]) {
                                                        setErrors((prev) => {
                                                            const ne = { ...prev };
                                                            delete ne["select-estado"];
                                                            return ne;
                                                        });
                                                    }
                                                }}
                                                sx={{ "&.Mui-checked": { color: "#2e7d32" } }}
                                            />
                                        }
                                        label={isActivo ? "Activo" : "Inactivo"}
                                        sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                                    />
                                    {errors["select-estado"] && <FormHelperText>{errors["select-estado"]}</FormHelperText>}
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ p: 2, borderTop: "1px solid #e9eef5", background: "#fff" }}>
                        <Button
                            onClick={handleCloseDialog}
                            startIcon={<CloseIcon />}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                minWidth: 120,
                                backgroundColor: "#fff",
                                color: "#b91c1c",
                                border: "1px solid #b91c1c",
                                boxShadow: "none",
                                "&:hover": {
                                    backgroundColor: "rgba(185, 28, 28, 0.08)",
                                    boxShadow: "0 2px 6px rgba(185, 28, 28, 0.2)",
                                },
                                fontSize: "12px",
                            }}
                        >
                            Cancelar
                        </Button>

                        {selectedCategoriaActivo ? (
                            <Button
                                onClick={handleModificar}
                                startIcon={!loading && <SaveIcon />}
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    minWidth: 120,
                                    backgroundColor: "#fff",
                                    color: "#2e7d32",
                                    border: "1px solid #2e7d32",
                                    boxShadow: "none",
                                    "&:hover": {
                                        backgroundColor: "rgba(46, 125, 50, 0.08)",
                                        boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                                    },
                                    fontSize: "12px",
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircularProgress size={16} color="inherit" />
                                        Modificando...
                                    </Box>
                                ) : (
                                    "Modificar"
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGuardarCategoriaActivos}
                                variant="contained"
                                disabled={loading}
                                startIcon={!loading && <SaveIcon />}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    minWidth: 140,
                                    backgroundColor: "#fff",
                                    color: "#2e7d32",
                                    border: "1px solid #2e7d32",
                                    boxShadow: "none",
                                    "&:hover": {
                                        backgroundColor: "rgba(46, 125, 50, 0.08)",
                                        boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                                    },
                                    fontSize: "12px",
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircularProgress size={16} color="inherit" />
                                        Guardando...
                                    </Box>
                                ) : (
                                    "Guardar"
                                )}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default CategoriaActivos;
