// src/screens/atencion/KardexMovimientos.jsx
import {
    Box,
    Chip,
    CircularProgress,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
    Paper,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Pagination,
    Tooltip,
    Divider,
    Stack,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { AxGetKardexMovimiento } from "../../../../axios/axios_client";
import { FaFileExcel, FaFilePdf, FaList } from "react-icons/fa";
import Swal from "sweetalert2";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ui = {
    bg: "#f4f7fb",
    paper: "#ffffff",
    border: "#dbe3f0",
    borderSoft: "#e8eef7",
    head: "#0b1f3a",
    primary: "#144985",
    muted: "#64748b",
    soft: "#f8fafc",
    headStrong: "#365f91",
    headStrongBorder: "#29486d",
    rowAlt: "#f1f4f8",
    rowHover: "#e8f1fb",
};

const baseFontSx = {
    fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
    letterSpacing: 0,
    fontStyle: "normal",
};

const safeText = (value) => (value == null ? "" : String(value).trim());

const formatDate = (value, withTime = true) => {
    if (!value) return "";

    const str = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split("-");
        return `${d}/${m}/${y}`;
    }

    const date = new Date(str);
    if (Number.isNaN(date.getTime())) return str;

    return new Intl.DateTimeFormat("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(date);
};

const formatNumber = (value) => {
    if (value == null || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num;
};

const buildOptions = (data, field) => {
    const map = new Map();

    (Array.isArray(data) ? data : []).forEach((item) => {
        const label = safeText(item?.[field]);
        if (!label) return;
        if (!map.has(label)) {
            map.set(label, { value: label, label });
        }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
};

const getTipoChip = (value) => {
    const tipo = safeText(value).toUpperCase();

    if (tipo === "INGRESO") {
        return <Chip label="INGRESO" size="small" color="success" variant="outlined" />;
    }

    if (tipo === "EGRESO") {
        return <Chip label="EGRESO" size="small" color="error" variant="outlined" />;
    }

    return <Chip label={safeText(value) || "N/A"} size="small" variant="outlined" />;
};

const getEstadoStockChip = (value) => {
    const estado = safeText(value).toUpperCase();

    if (estado === "OK") {
        return <Chip label="OK" size="small" color="success" variant="outlined" />;
    }

    if (estado === "BAJO MINIMO" || estado === "BAJO MÍNIMO") {
        return <Chip label="BAJO MÍNIMO" size="small" color="warning" variant="outlined" />;
    }

    if (estado === "SIN STOCK") {
        return <Chip label="SIN STOCK" size="small" color="error" variant="outlined" />;
    }

    return <Chip label={safeText(value) || "N/A"} size="small" variant="outlined" />;
};

const getEstadoLoteChip = (value) => {
    const estado = safeText(value).toUpperCase();

    if (estado === "VIGENTE") {
        return <Chip label="VIGENTE" size="small" color="success" variant="outlined" />;
    }

    if (estado === "POR VENCER") {
        return <Chip label="POR VENCER" size="small" color="warning" variant="outlined" />;
    }

    if (estado === "VENCIDO") {
        return <Chip label="VENCIDO" size="small" color="error" variant="outlined" />;
    }

    if (estado === "SIN VENCIMIENTO") {
        return <Chip label="SIN VENCIMIENTO" size="small" color="info" variant="outlined" />;
    }

    if (estado === "SIN LOTE") {
        return <Chip label="SIN LOTE" size="small" color="default" variant="outlined" />;
    }

    return <Chip label={safeText(value) || "N/A"} size="small" variant="outlined" />;
};

const detailLabelSx = {
    ...baseFontSx,
    fontSize: 11,
    color: ui.muted,
    fontWeight: 700,
};

const detailValueSx = {
    ...baseFontSx,
    fontSize: 12,
    color: ui.head,
};

const cellTitleSx = {
    ...baseFontSx,
    fontSize: 12,
    fontWeight: 800,
    color: ui.head,
};

const headCellSx = {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: "#ffffff",
    bgcolor: ui.headStrong,
    borderBottom: `1px solid ${ui.headStrongBorder}`,
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: 0.3,
};

const bodyCellSx = {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.borderSoft}`,
    verticalAlign: "top",
    py: 1.2,
    px: 1.2,
};

const KardexMovimientos = () => {
    const [dataKardex, setDataKardex] = useState([]);
    const [filteredKardex, setFilteredKardex] = useState([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(
        parseInt(localStorage.getItem("rowsPerPageKardexDetallado") || "10", 10)
    );

    const [searchText, setSearchText] = useState("");
    const [filterSede, setFilterSede] = useState("0");
    const [filterFacultad, setFilterFacultad] = useState("0");
    const [filterBodega, setFilterBodega] = useState("0");
    const [filterTipo, setFilterTipo] = useState("0");
    const [filterEstadoStock, setFilterEstadoStock] = useState("0");
    const [filterEstadoLote, setFilterEstadoLote] = useState("0");

    useEffect(() => {
        setLoading(true);

        AxGetKardexMovimiento()
            .then((response) => {
                const payload = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : Array.isArray(response?.data?.data)
                            ? response.data.data
                            : [];

                setDataKardex(payload);
                setFilteredKardex(payload);
            })
            .catch(() => {
                setDataKardex([]);
                setFilteredKardex([]);
                Swal.fire("Error", "No se pudo cargar el kardex de movimientos.", "error");
            })
            .finally(() => setLoading(false));
    }, []);

    const sedeOptions = useMemo(() => buildOptions(dataKardex, "nombre_sede"), [dataKardex]);
    const facultadOptions = useMemo(() => buildOptions(dataKardex, "nombre_facultad"), [dataKardex]);
    const bodegaOptions = useMemo(() => buildOptions(dataKardex, "nombre_bodega"), [dataKardex]);
    const tipoOptions = useMemo(() => buildOptions(dataKardex, "tipo_movimiento"), [dataKardex]);
    const estadoStockOptions = useMemo(() => buildOptions(dataKardex, "estado_stock"), [dataKardex]);
    const estadoLoteOptions = useMemo(() => buildOptions(dataKardex, "estado_lote"), [dataKardex]);

    useEffect(() => {
        let result = Array.isArray(dataKardex) ? [...dataKardex] : [];

        if (searchText.trim() !== "") {
            const value = searchText.toLowerCase();

            result = result.filter((item) =>
                [
                    item?.mi_id,
                    item?.fecha_movimiento,
                    item?.tipo_movimiento,
                    item?.estado_movimiento,
                    item?.referencia_documental,
                    item?.numero_movimiento,
                    item?.numero_comprobante,
                    item?.nombre_sede,
                    item?.nombre_facultad,
                    item?.nombre_bodega,
                    item?.codigo_insumo,
                    item?.nombre_insumo,
                    item?.unidad_medida,
                    item?.marca,
                    item?.modelo,
                    item?.serie,
                    item?.codigo_lote,
                    item?.fecha_vencimiento,
                    item?.estado_stock,
                    item?.estado_lote,
                    item?.mi_observacion,
                    item?.observacion_egreso,
                    item?.origen_documento,
                    item?.nombre_usuario_movimiento,
                    item?.email_usuario_movimiento,
                    item?.nombre_usuario_prescribe,
                    item?.email_usuario_prescribe,
                    item?.nombre_usuario_entrega,
                    item?.email_usuario_entrega,
                    item?.nombre_usuario_principal,
                    item?.email_usuario_principal,
                ]
                    .map((x) => safeText(x).toLowerCase())
                    .join(" ")
                    .includes(value)
            );
        }

        if (filterSede !== "0") {
            result = result.filter((item) => safeText(item?.nombre_sede) === safeText(filterSede));
        }

        if (filterFacultad !== "0") {
            result = result.filter((item) => safeText(item?.nombre_facultad) === safeText(filterFacultad));
        }

        if (filterBodega !== "0") {
            result = result.filter((item) => safeText(item?.nombre_bodega) === safeText(filterBodega));
        }

        if (filterTipo !== "0") {
            result = result.filter((item) => safeText(item?.tipo_movimiento) === safeText(filterTipo));
        }

        if (filterEstadoStock !== "0") {
            result = result.filter((item) => safeText(item?.estado_stock) === safeText(filterEstadoStock));
        }

        if (filterEstadoLote !== "0") {
            result = result.filter((item) => safeText(item?.estado_lote) === safeText(filterEstadoLote));
        }

        setFilteredKardex(result);
        setPage(1);
    }, [
        dataKardex,
        searchText,
        filterSede,
        filterFacultad,
        filterBodega,
        filterTipo,
        filterEstadoStock,
        filterEstadoLote,
    ]);

    const stats = useMemo(() => {
        const rows = Array.isArray(filteredKardex) ? filteredKardex : [];
        const ingresos = rows.filter((r) => safeText(r?.tipo_movimiento).toUpperCase() === "INGRESO").length;
        const egresos = rows.filter((r) => safeText(r?.tipo_movimiento).toUpperCase() === "EGRESO").length;

        return {
            total: rows.length,
            ingresos,
            egresos,
        };
    }, [filteredKardex]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return (Array.isArray(filteredKardex) ? filteredKardex : []).slice(start, end);
    }, [filteredKardex, page, rowsPerPage]);

    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        localStorage.setItem("rowsPerPageKardexDetallado", value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchText("");
        setFilterSede("0");
        setFilterFacultad("0");
        setFilterBodega("0");
        setFilterTipo("0");
        setFilterEstadoStock("0");
        setFilterEstadoLote("0");
        setPage(1);
    };

    const handleExportExcel = () => {
        if (!Array.isArray(filteredKardex) || filteredKardex.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const dataToExport = filteredKardex.map((item) => ({
            Fecha: formatDate(item?.fecha_movimiento ?? item?.mi_fecha ?? item?.mi_created_at),
            Tipo: item?.tipo_movimiento ?? "",
            "Estado Movimiento": item?.estado_movimiento ?? "",
            Referencia: item?.referencia_documental ?? "",
            "Nro Movimiento": item?.numero_movimiento ?? "",
            "Nro Comprobante": item?.numero_comprobante ?? "",
            Sede: item?.nombre_sede ?? "",
            Facultad: item?.nombre_facultad ?? "",
            Bodega: item?.nombre_bodega ?? "",
            "Código Insumo": item?.codigo_insumo ?? "",
            "Nombre Insumo": item?.nombre_insumo ?? "",
            Unidad: item?.unidad_medida ?? "",
            Marca: item?.marca ?? "",
            Modelo: item?.modelo ?? "",
            Serie: item?.serie ?? "",
            Lote: item?.codigo_lote ?? "",
            "Fecha Vencimiento": formatDate(item?.fecha_vencimiento, false),
            Cantidad: item?.mi_cantidad ?? "",
            "Stock Anterior": item?.mi_stock_anterior ?? "",
            "Stock Actual": item?.mi_stock_actual ?? "",
            "Stock Mínimo": item?.stock_minimo ?? "",
            "Estado Stock": item?.estado_stock ?? "",
            "Estado Lote": item?.estado_lote ?? "",
            "Usuario Movimiento": item?.nombre_usuario_movimiento ?? "",
            "Correo Movimiento": item?.email_usuario_movimiento ?? "",
            Prescribe: item?.nombre_usuario_prescribe ?? "",
            "Correo Prescribe": item?.email_usuario_prescribe ?? "",
            Entrega: item?.nombre_usuario_entrega ?? "",
            "Correo Entrega": item?.email_usuario_entrega ?? "",
            "Observación Movimiento": item?.mi_observacion ?? "",
            "Observación Egreso": item?.observacion_egreso ?? "",
            "Origen Documento": item?.origen_documento ?? "",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kardex");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });

        saveAs(blob, "kardex_movimientos_detallado.xlsx");
    };

    const handleExportPDF = () => {
        if (!Array.isArray(filteredKardex) || filteredKardex.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const doc = new jsPDF("l", "mm", "a3");
        doc.setFontSize(14);
        doc.text("Kardex de Movimientos de Inventario", 12, 12);

        const columns = [
            "Fecha",
            "Tipo",
            "Referencia",
            "Ubicación",
            "Producto",
            "Lote",
            "Cant.",
            "Stk Ant.",
            "Stk Act.",
            "Est. Stock",
            "Movimiento",
            "Prescribe",
            "Entrega",
        ];

        const rows = filteredKardex.map((item) => [
            formatDate(item?.fecha_movimiento ?? item?.mi_fecha ?? item?.mi_created_at),
            item?.tipo_movimiento ?? "",
            item?.referencia_documental ?? "",
            `${safeText(item?.nombre_sede)} / ${safeText(item?.nombre_bodega)}`,
            `${safeText(item?.codigo_insumo)} - ${safeText(item?.nombre_insumo)}`,
            safeText(item?.codigo_lote) || "N/A",
            safeText(item?.mi_cantidad),
            safeText(item?.mi_stock_anterior),
            safeText(item?.mi_stock_actual),
            safeText(item?.estado_stock),
            safeText(item?.nombre_usuario_movimiento) || "N/A",
            safeText(item?.nombre_usuario_prescribe) || "N/A",
            safeText(item?.nombre_usuario_entrega) || "N/A",
        ]);

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 18,
            styles: { fontSize: 6.5, cellPadding: 1.5 },
            headStyles: { fillColor: [20, 73, 133] },
            theme: "grid",
            margin: { left: 8, right: 8 },
        });

        doc.save("kardex_movimientos_detallado.pdf");
    };

    return (
        <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 2 }}>
            <Box sx={{ maxWidth: "100%", mx: "auto" }}>
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 1.5,
                                border: `1px solid ${ui.border}`,
                                bgcolor: "rgba(20,73,133,.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: ui.primary,
                            }}
                        >
                            <FaList size={16} />
                        </Box>

                        <Box>
                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 15 }}>
                                Movimientos
                            </Typography>
                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12 }}>
                                Trazabilidad detallada de ingresos, egresos, lotes, stock y responsables
                            </Typography>
                        </Box>

                        <Chip
                            label={`${stats.total} REGISTROS`}
                            size="small"
                            sx={{ ml: "auto", fontWeight: 800 }}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                        <Chip label={`Ingresos: ${stats.ingresos}`} size="small" color="success" variant="outlined" />
                        <Chip label={`Egresos: ${stats.egresos}`} size="small" color="error" variant="outlined" />
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, minmax(180px, 1fr))",
                                xl: "repeat(8, minmax(140px, 1fr))",
                            },
                            gap: 1.25,
                        }}
                    >
                        <FormControl size="small">
                            <InputLabel>Sede</InputLabel>
                            <Select value={filterSede} label="Sede" onChange={(e) => setFilterSede(e.target.value)} sx={{ fontSize: 12 }}>
                                <MenuItem value="0">Todas</MenuItem>
                                {sedeOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Facultad</InputLabel>
                            <Select
                                value={filterFacultad}
                                label="Facultad"
                                onChange={(e) => setFilterFacultad(e.target.value)}
                                sx={{ fontSize: 12 }}
                            >
                                <MenuItem value="0">Todas</MenuItem>
                                {facultadOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Bodega</InputLabel>
                            <Select value={filterBodega} label="Bodega" onChange={(e) => setFilterBodega(e.target.value)} sx={{ fontSize: 12 }}>
                                <MenuItem value="0">Todas</MenuItem>
                                {bodegaOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select value={filterTipo} label="Tipo" onChange={(e) => setFilterTipo(e.target.value)} sx={{ fontSize: 12 }}>
                                <MenuItem value="0">Todos</MenuItem>
                                {tipoOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Estado stock</InputLabel>
                            <Select
                                value={filterEstadoStock}
                                label="Estado stock"
                                onChange={(e) => setFilterEstadoStock(e.target.value)}
                                sx={{ fontSize: 12 }}
                            >
                                <MenuItem value="0">Todos</MenuItem>
                                {estadoStockOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Estado lote</InputLabel>
                            <Select
                                value={filterEstadoLote}
                                label="Estado lote"
                                onChange={(e) => setFilterEstadoLote(e.target.value)}
                                sx={{ fontSize: 12 }}
                            >
                                <MenuItem value="0">Todos</MenuItem>
                                {estadoLoteOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>


                    </Box>

                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #e0e0e0",
                            backgroundColor: "#fafafa",
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "stretch", md: "center" },
                            gap: 2,
                        }}
                    >
                        {/* Lado izquierdo */}
                        <Box
                            sx={{
                                display: "flex",
                                flex: 1,
                                minWidth: 260,
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Buscar"
                                size="small"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Producto, lote, usuario, documento..."
                                sx={{
                                    maxWidth: { xs: "100%", md: 420 },
                                    "& .MuiInputBase-root": {
                                        fontSize: 13,
                                        borderRadius: 2,
                                        backgroundColor: "#fff",
                                    },
                                    "& .MuiInputLabel-root": {
                                        fontSize: 12,
                                    },
                                }}
                            />
                        </Box>

                        {/* Lado derecho */}
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1.25,
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", md: "flex-end" },
                            }}
                        >
                            <FormControl size="small" sx={{ minWidth: 110 }}>
                                <InputLabel>Filas</InputLabel>
                                <Select
                                    value={rowsPerPage}
                                    label="Filas"
                                    onChange={handleChangeRowsPerPage}
                                    sx={{
                                        fontSize: 13,
                                        borderRadius: 2,
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    {[5, 10, 25, 50, 100].map((n) => (
                                        <MenuItem key={n} value={n}>
                                            {n}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                onClick={handleClearFilters}
                                sx={{
                                    ...baseFontSx,
                                    px: 2,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Limpiar filtros
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleExportExcel}
                                startIcon={<FaFileExcel size={16} />}
                                sx={{
                                    ...baseFontSx,
                                    px: 2,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    borderColor: "#2e7d32",
                                    color: "#2e7d32",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    "&:hover": {
                                        borderColor: "#1b5e20",
                                        backgroundColor: "rgba(46,125,50,0.08)",
                                    },
                                }}
                            >
                                Excel
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleExportPDF}
                                startIcon={<FaFilePdf size={16} />}
                                sx={{
                                    ...baseFontSx,
                                    px: 2,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    borderColor: "#c62828",
                                    color: "#c62828",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    "&:hover": {
                                        borderColor: "#8e0000",
                                        backgroundColor: "rgba(198,40,40,0.08)",
                                    },
                                }}
                            >
                                PDF
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <TableContainer sx={{ maxHeight: "72vh" }}>
                        <Table
                            stickyHeader
                            size="small"
                            sx={{
                                "& th": {
                                    // boxShadow: "inset 0 -1px 0 #3f5f8c",
                                    backgroundColor: "#d5deecff",
                                    color: "#1f3a5f",
                                    fontWeight: 800,
                                    borderBottom: "1px solid #d5deec",
                                    paddingTop: "8px",
                                    paddingBottom: "8px",
                                },
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...headCellSx, minWidth: 150 }}>Fecha</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 260 }}>Movimiento</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 220 }}>Ubicación</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 300 }}>Producto / Lote</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 190 }}>Stock</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 320 }}>Responsables</TableCell>
                                    <TableCell sx={{ ...headCellSx, minWidth: 360 }}>Detalle del movimiento</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <CircularProgress size={28} />
                                            <Typography sx={{ ...baseFontSx, mt: 1, color: ui.muted, fontSize: 12 }}>
                                                Cargando kardex...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <TableRow
                                            key={row?.mi_id ?? index}
                                            hover
                                            sx={{
                                                bgcolor: index % 2 === 0 ? "#ffffff" : ui.rowAlt,
                                                "&:hover": {
                                                    bgcolor: ui.rowHover,
                                                    transition: "all .2s ease",
                                                },
                                            }}
                                        >
                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={cellTitleSx}>
                                                    {formatDate(row?.fecha_movimiento ?? row?.mi_fecha ?? row?.mi_created_at)}
                                                </Typography>
                                                <Typography sx={{ ...detailLabelSx, mt: 0.4 }}>
                                                    ID Movimiento: {safeText(row?.mi_id) || "N/A"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Stack direction="row" spacing={1} sx={{ mb: 0.8, flexWrap: "wrap", gap: 0.8 }}>
                                                    {getTipoChip(row?.tipo_movimiento)}
                                                    <Chip
                                                        label={safeText(row?.estado_movimiento) || "N/A"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Stack>

                                                <Typography sx={cellTitleSx}>
                                                    {safeText(row?.referencia_documental) || "N/A"}
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.5 }}>
                                                    Nro. movimiento:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.numero_movimiento) || "N/A"}
                                                    </Box>
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                    Comprobante:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.numero_comprobante) || "N/A"}
                                                    </Box>
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                    Origen:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.origen_documento) || "N/A"}
                                                    </Box>
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={cellTitleSx}>{safeText(row?.nombre_sede) || "N/A"}</Typography>
                                                <Typography sx={{ ...detailLabelSx, mt: 0.4 }}>
                                                    Facultad:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.nombre_facultad) || "N/A"}
                                                    </Box>
                                                </Typography>
                                                <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                    Bodega:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.nombre_bodega) || "N/A"}
                                                    </Box>
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={cellTitleSx}>
                                                    {safeText(row?.codigo_insumo) || "S/C"} - {safeText(row?.nombre_insumo) || "N/A"}
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.4 }}>
                                                    Unidad:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {safeText(row?.unidad_medida) || "N/A"}
                                                    </Box>
                                                </Typography>

                                                {(safeText(row?.marca) || safeText(row?.modelo) || safeText(row?.serie)) && (
                                                    <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                        Marca / Modelo / Serie:{" "}
                                                        <Box component="span" sx={detailValueSx}>
                                                            {[safeText(row?.marca), safeText(row?.modelo), safeText(row?.serie)]
                                                                .filter(Boolean)
                                                                .join(" / ") || "N/A"}
                                                        </Box>
                                                    </Typography>
                                                )}

                                                <Divider sx={{ my: 0.8 }} />

                                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.8 }}>
                                                    <Chip
                                                        label={`Lote: ${safeText(row?.codigo_lote) || "N/A"}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    {getEstadoLoteChip(row?.estado_lote)}
                                                </Stack>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.6 }}>
                                                    Vence:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {formatDate(row?.fecha_vencimiento, false) || "N/A"}
                                                    </Box>
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={cellTitleSx}>
                                                    Cantidad: {formatNumber(row?.mi_cantidad) ?? "N/A"}
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.5 }}>
                                                    Stock anterior:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {formatNumber(row?.mi_stock_anterior)}
                                                    </Box>
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                    Stock actual:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {formatNumber(row?.mi_stock_actual)}
                                                    </Box>
                                                </Typography>

                                                <Typography sx={{ ...detailLabelSx, mt: 0.3 }}>
                                                    Stock mínimo:{" "}
                                                    <Box component="span" sx={detailValueSx}>
                                                        {formatNumber(row?.stock_minimo)}
                                                    </Box>
                                                </Typography>

                                                <Box sx={{ mt: 1 }}>{getEstadoStockChip(row?.estado_stock)}</Box>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={detailLabelSx}>Usuario movimiento:</Typography>
                                                <Typography sx={cellTitleSx}>
                                                    {safeText(row?.nombre_usuario_movimiento) || "N/A"}
                                                </Typography>
                                                <Typography sx={{ ...detailValueSx, fontSize: 11 }}>
                                                    {safeText(row?.email_usuario_movimiento) || "Sin correo"}
                                                </Typography>

                                                <Divider sx={{ my: 0.8 }} />

                                                <Typography sx={detailLabelSx}>Prescribe:</Typography>
                                                <Typography sx={{ ...detailValueSx, fontWeight: 700 }}>
                                                    {safeText(row?.nombre_usuario_prescribe) || "N/A"}
                                                </Typography>
                                                <Typography sx={{ ...detailValueSx, fontSize: 11 }}>
                                                    {safeText(row?.email_usuario_prescribe) || "Sin correo"}
                                                </Typography>

                                                <Divider sx={{ my: 0.8 }} />

                                                <Typography sx={detailLabelSx}>Entrega:</Typography>
                                                <Typography sx={{ ...detailValueSx, fontWeight: 700 }}>
                                                    {safeText(row?.nombre_usuario_entrega) || "N/A"}
                                                </Typography>
                                                <Typography sx={{ ...detailValueSx, fontSize: 11 }}>
                                                    {safeText(row?.email_usuario_entrega) || "Sin correo"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={bodyCellSx}>
                                                <Typography sx={detailLabelSx}>Observación movimiento:</Typography>
                                                <Tooltip title={safeText(row?.mi_observacion) || "Sin observación"}>
                                                    <Typography sx={{ ...detailValueSx, mt: 0.3 }}>
                                                        {safeText(row?.mi_observacion) || "Sin observación"}
                                                    </Typography>
                                                </Tooltip>

                                                <Divider sx={{ my: 0.8 }} />

                                                <Typography sx={detailLabelSx}>Observación egreso:</Typography>
                                                <Tooltip title={safeText(row?.observacion_egreso) || "Sin observación"}>
                                                    <Typography sx={{ ...detailValueSx, mt: 0.3 }}>
                                                        {safeText(row?.observacion_egreso) || "Sin observación"}
                                                    </Typography>
                                                </Tooltip>

                                                <Divider sx={{ my: 0.8 }} />

                                                <Typography sx={detailLabelSx}>
                                                    Encabezado:
                                                    <Box component="span" sx={{ ...detailValueSx, ml: 0.7 }}>
                                                        {safeText(row?.mi_id_encabezado) || "N/A"}
                                                    </Box>
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                                                SIN RESULTADOS
                                            </Typography>
                                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12, mt: 0.5 }}>
                                                No se encontraron movimientos con los filtros aplicados.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                        <Pagination
                            count={Math.max(1, Math.ceil(filteredKardex.length / rowsPerPage))}
                            page={page}
                            onChange={(event, value) => setPage(value)}
                            showFirstButton
                            showLastButton
                            sx={{
                                "& .MuiPaginationItem-root": {
                                    ...baseFontSx,
                                    fontSize: 12,
                                    borderRadius: 1.25,
                                },
                            }}
                        />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default KardexMovimientos;
