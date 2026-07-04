// src/screens/atencion/Proveedores.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
    Grid,
    Paper,
    Typography,
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
    Tooltip,
} from "@mui/material";

import axiosClient from "../../../../../axios/axios_client";

import Swal from "sweetalert2";
import SchoolIcon from "@mui/icons-material/School";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt, faPlusSquare } from "@fortawesome/free-solid-svg-icons";

// Excel / PDF (mismo patrón que Insumos)
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

const Proveedores = ({ usr_id }) => {
    const [dataProveedor, setDataProveedor] = useState([]);
    const [dataFilteredProveedores, setDataFilteredProveedores] = useState([]);
    const [openDialogProveedor, setOpenDialogProveedor] = useState(false);

    const [formDataProveedor, setFormDataProveedor] = useState([]);
    const [selectedProducto, setSelectedProducto] = useState(null);

    const [page, setPage] = useState(1);

    // antes era fijo (5). Ahora lo hacemos como Insumos, pero por defecto 5 para no romper tu flujo.
    const [rowsPerPage, setRowsPerPage] = useState(
        parseInt(localStorage.getItem("rowsPerPageKardex") || "5", 10)
    );

    const [dataEstado, setDataEstado] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtros como Insumos
    const [searchText, setSearchText] = useState("");
    const [filterEstado, setFilterEstado] = useState("0");

    // Cargar proveedores
    const fetchDataProveedores = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get("/inventario/proveedores");
            const payload = response?.data;
            const rows = Array.isArray(payload) ? payload : payload?.data || [];
            setDataProveedor(rows);
            setDataFilteredProveedores(rows);
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
            setDataProveedor([]);
            setDataFilteredProveedores([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataProveedores();
    }, []);

    // Consultar estados
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
            Swal.fire("¡Error!", "Error al cargar las Estados", error.message);
        }
    };

    useEffect(() => {
        fetchDataEstado();
    }, []);

    // Opciones de estado (para filtro) desde dataProveedor si viene texto en "estado"
    const estadoOptions = useMemo(() => {
        const map = new Map();
        (Array.isArray(dataProveedor) ? dataProveedor : []).forEach((r) => {
            const label = (r?.estado || r?.nombre_estado || "").trim();
            if (!label) return;
            if (!map.has(label)) map.set(label, { value: label, label });
        });
        return Array.from(map.values());
    }, [dataProveedor]);

    // Aplicar filtros (sin cambiar funcionalidad base: sigue buscando por nombre, pero ahora más completo)
    useEffect(() => {
        let result = Array.isArray(dataProveedor) ? [...dataProveedor] : [];

        if (searchText.trim() !== "") {
            const v = searchText.toLowerCase();
            result = result.filter((item) => {
                const blob = [
                    item?.prov_id,
                    item?.prov_ruc,
                    item?.prov_nombre,
                    item?.prov_direccion,
                    item?.prov_telefono,
                    item?.prov_correo,
                    item?.estado,
                ]
                    .map((x) => (x == null ? "" : String(x)).toLowerCase())
                    .join(" ");
                return blob.includes(v);
            });
        }

        if (filterEstado !== "0") {
            // OJO: tu tabla muestra data.estado (texto), tu formulario usa prov_estado (id).
            // Para el filtro usamos el texto (estado) tal como estás mostrando.
            result = result.filter(
                (item) => String(item?.estado || "") === String(filterEstado)
            );
        }

        setDataFilteredProveedores(result);
        setPage(1);
    }, [dataProveedor, searchText, filterEstado]);

    // Abrir modal (agregar)
    const handleAgregarNuevo = () => {
        setSelectedProducto(null);
        setOpenDialogProveedor(true);
        setFormDataProveedor((prev) => ({ ...prev, id_usuario: usr_id }));
    };

    // Cerrar modal
    const handleCloseDialog = () => {
        setFormDataProveedor(false);
        setOpenDialogProveedor(false);
        setSelectedProducto(null);
    };

    // Guardar
    const handleGuardarProveedor = async () => {
        try {
            const { data: response } = await axiosClient.post("/inventario/proveedores", formDataProveedor);
            if (response?.success) {
                Swal.fire("¡Éxito!", "Proveedor se agregó correctamente.", "success");
                fetchDataProveedores();
                setOpenDialogProveedor(false);
            } else {
                Swal.fire("Error", response?.message || "No se pudo guardar.", "error");
            }
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
        }
    };

    // Editar
    const handleEditarProducto = (data) => {
        setSelectedProducto(data);
        setFormDataProveedor((prev) => ({
            ...prev,
            id_usuario: usr_id,
            "txt-ruc": data.prov_ruc,
            "txt-nombre": data.prov_nombre,
            "txt-direccion": data.prov_direccion,
            "txt-telefono": data.prov_telefono,
            "txt-correo": data.prov_correo,
            "select-estado": data.prov_estado,
        }));
        setOpenDialogProveedor(true);
    };

    // Modificar
    const handleModificar = async () => {
        if (!selectedProducto) return;
        try {
            await axiosClient.put(`/inventario/proveedores/${selectedProducto.prov_id}`, formDataProveedor);
            Swal.fire("¡Éxito!", "El producto se actualizó correctamente.", "success");
            fetchDataProveedores();
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
        }
        setFormDataProveedor(false);
        setOpenDialogProveedor(false);
        setSelectedProducto(null);
    };

    // Eliminar (NO implementada en tu código original)
    const handleEliminarProducto = () => {
        Swal.fire("Info", "Función de eliminar proveedor aún no implementada.", "info");
    };

    // Mostrar/paginación como Insumos (guardado en localStorage)
    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        localStorage.setItem("rowsPerPageKardex", value);
        setPage(1);
    };

    const paginatedData = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return (Array.isArray(dataFilteredProveedores) ? dataFilteredProveedores : []).slice(
            start,
            end
        );
    }, [dataFilteredProveedores, page, rowsPerPage]);

    // Export Excel / PDF (mismo estilo/patrón que Insumos)
    const handleExportExcel = () => {
        if (!Array.isArray(dataFilteredProveedores) || dataFilteredProveedores.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const dataToExport = dataFilteredProveedores.map((p) => ({
            Id: p?.prov_id ?? "",
            RUC: p?.prov_ruc ?? "",
            Nombre: p?.prov_nombre ?? "",
            Dirección: p?.prov_direccion ?? "",
            Teléfono: p?.prov_telefono ?? "",
            Correo: p?.prov_correo ?? "",
            Estado: p?.estado ?? "",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Proveedores");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });

        saveAs(blob, "proveedores.xlsx");
    };

    const handleExportPDF = () => {
        if (!Array.isArray(dataFilteredProveedores) || dataFilteredProveedores.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const doc = new jsPDF("l", "mm", "a4");
        doc.setFontSize(14);
        doc.text("Listado de Proveedores", 14, 12);

        const columns = ["Id", "RUC", "Nombre", "Dirección", "Teléfono", "Correo", "Estado"];

        const rows = dataFilteredProveedores.map((p) => [
            p?.prov_id ?? "",
            p?.prov_ruc ?? "",
            p?.prov_nombre ?? "",
            p?.prov_direccion ?? "",
            p?.prov_telefono ?? "",
            p?.prov_correo ?? "",
            p?.estado ?? "",
        ]);

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 18,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [20, 73, 133] },
        });

        doc.save("proveedores.pdf");
    };

    return (
        <Box sx={{ maxWidth: "100%", margin: "auto", p: 2 }}>
            {/* Header (igual que Insumos) */}
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
                        <SchoolIcon />
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1f3a5f" }}>
                            Proveedores
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#475569", mt: 0.25 }}>
                            Permite agregar, modificar y eliminar proveedores
                        </Typography>
                    </Box>

                    <Chip
                        label={`${dataFilteredProveedores.length} RESULTADOS`}
                        size="small"
                        sx={{ ml: "auto", fontWeight: 700 }}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Paper>

            {/* Filtros + acciones (igual que Insumos) */}
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
                    {/* IZQUIERDA */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <TextField
                            label="Buscar"
                            variant="outlined"
                            size="small"
                            sx={{ width: "220px", "& input": { fontSize: "12px" } }}
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setPage(1);
                            }}
                        />

                        <FormControl sx={{ minWidth: 160 }} size="small">
                            <InputLabel id="filter-estado-label">Estado</InputLabel>
                            <Select
                                labelId="filter-estado-label"
                                value={filterEstado}
                                label="Estado"
                                onChange={(e) => {
                                    setFilterEstado(e.target.value);
                                    setPage(1);
                                }}
                                sx={{ fontSize: "12px" }}
                            >
                                <MenuItem value="0" sx={{ fontSize: "12px" }}>
                                    Todos
                                </MenuItem>
                                {estadoOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

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

                    {/* DERECHA */}
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

                {/* Tabla */}
                <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 2, border: "1px solid #e9eef5", background: "#fff" }}
                >
                    <Table stickyHeader size="small" sx={{ "& th, & td": { fontSize: "12px", padding: "4px 6px" } }}>
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
                                <TableCell align="center">RUC</TableCell>
                                <TableCell align="center">Nombre</TableCell>
                                <TableCell align="center">Dirección</TableCell>
                                <TableCell align="center">Teléfono</TableCell>
                                <TableCell align="center">Correo</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ height: 50 }}>
                                        <CircularProgress size={30} color="primary" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((data) => (
                                    <TableRow key={data.prov_id} hover sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                                        <TableCell align="center">{data.prov_id}</TableCell>
                                        <TableCell align="center">{data.prov_ruc}</TableCell>
                                        <TableCell>{data.prov_nombre}</TableCell>
                                        <TableCell>{data.prov_direccion}</TableCell>
                                        <TableCell align="center">{data.prov_telefono}</TableCell>
                                        <TableCell>{data.prov_correo}</TableCell>
                                        <TableCell align="center">{data.estado}</TableCell>

                                        <TableCell align="center">
                                            <Tooltip title="Editar" arrow>
                                                <IconButton
                                                    onClick={() => handleEditarProducto(data)}
                                                    size="small"
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "6px",
                                                        border: "1px solid",
                                                        borderColor: "warning.light",
                                                        backgroundColor: "#fff",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(237,108,2,0.08)",
                                                            borderColor: "warning.main",
                                                        },
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: "12px" }} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Eliminar" arrow>
                                                <IconButton
                                                    onClick={() => handleEliminarProducto(data.prov_id)}
                                                    size="small"
                                                    sx={{
                                                        ml: 0.5,
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "6px",
                                                        border: "1px solid #f4b4b4",
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
                                    <TableCell colSpan={8} align="center" sx={{ fontSize: "12px", border: "1px solid #ccc" }}>
                                        No se encontraron proveedores.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginación */}
                <Pagination
                    count={Math.ceil(dataFilteredProveedores.length / rowsPerPage) || 1}
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
            </Paper>

            {/* Modal Agregar/Editar (mismo layout, solo style) */}
            <Dialog
                open={openDialogProveedor}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, boxShadow: 6 } }}
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
                    {selectedProducto ? "Editar Proveedor" : "Agregar Proveedor"}
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                id="txt-ruc"
                                label="RUC"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formDataProveedor["txt-ruc"] ?? ""}
                                onChange={(e) =>
                                    setFormDataProveedor((prev) => ({ ...prev, "txt-ruc": e.target.value }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                id="txt-nombre"
                                label="Nombre"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formDataProveedor["txt-nombre"] ?? ""}
                                onChange={(e) =>
                                    setFormDataProveedor((prev) => ({ ...prev, "txt-nombre": e.target.value }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                id="txt-direccion"
                                label="Dirección"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formDataProveedor["txt-direccion"] ?? ""}
                                onChange={(e) =>
                                    setFormDataProveedor((prev) => ({
                                        ...prev,
                                        "txt-direccion": e.target.value,
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                id="txt-telefono"
                                label="Teléfono"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formDataProveedor["txt-telefono"] ?? ""}
                                onChange={(e) =>
                                    setFormDataProveedor((prev) => ({
                                        ...prev,
                                        "txt-telefono": e.target.value,
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                id="txt-correo"
                                label="Correo"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formDataProveedor["txt-correo"] ?? ""}
                                onChange={(e) =>
                                    setFormDataProveedor((prev) => ({
                                        ...prev,
                                        "txt-correo": e.target.value,
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    id="select-estado"
                                    label="Estado"
                                    value={formDataProveedor["select-estado"] ?? "0"}
                                    onChange={(e) =>
                                        setFormDataProveedor((prev) => ({
                                            ...prev,
                                            "select-estado": e.target.value,
                                        }))
                                    }
                                >
                                    <MenuItem value="0">Seleccione Estado</MenuItem>
                                    {dataEstado.length === 0 ? (
                                        <MenuItem disabled value="">
                                            Cargando estados...
                                        </MenuItem>
                                    ) : (
                                        dataEstado.map((item) => (
                                            <MenuItem key={item.value} value={item.value}>
                                                {item.label}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions
                    sx={{ p: 2, borderTop: "1px solid #e9eef5", background: "#fff" }}
                >
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

                    {selectedProducto ? (
                        <Button
                            onClick={handleModificar}
                            startIcon={<SaveIcon />}
                            variant="contained"
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
                            Modificar
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGuardarProveedor}
                            startIcon={<SaveIcon />}
                            variant="contained"
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
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Proveedores;
