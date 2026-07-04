import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    Fade,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import logo from "../../../assets/imagenes/logo.jpeg";

import ModalProductoInventario from "./components/ModalProductoInventario";
import ModalInventarioInicialProducto from "./components/ModalInventarioInicialProducto";
import ModalPreciosProducto from "./components/ModalPreciosProducto";
import ModalVerProducto from "./components/ModalVerProducto";
import PremiumButton from "../../../components/ui/PremiumButton";
import PageHeader from "../../../components/ui/PageHeader";

import { apiClient, normalizeAssetUrl } from "../../../services/apiClient";

import {
    modalPaperSx,
    tableSx,
    tgAccent,
    tgSemantic,
    semanticChipSx,
    semanticIconButtonSx,
    filterInputSx,
} from "../../../Styles/muiTheme";

const ui = {
    black: "#0f172a", // Slate 900
    mustard: tgAccent.mustard,
    mustardSoft: tgAccent.mustardSoft,
    mustardDark: tgAccent.mustardStrong,
    indigo: tgSemantic.inventory.color,
    indigoSoft: tgSemantic.inventory.soft,
    indigoDark: tgSemantic.inventory.strong,
    emerald: tgSemantic.success.color,
    emeraldSoft: tgSemantic.success.soft,
    emeraldDark: tgSemantic.success.strong,
    danger: "#ef4444", // Red 500
    dangerSoft: "rgba(239, 68, 68, 0.08)",
    dangerBorder: "rgba(239, 68, 68, 0.24)",
    success: "#2e7d32",
    successSoft: "rgba(46, 125, 50, 0.10)",
    successBorder: "rgba(46, 125, 50, 0.24)",
    muted: "#64748b", // Slate 500
    border: "#e2e8f0", // Slate 200
    paper: "#ffffff",
    bg: "#f8fafc", // Slate 50
    text: "#0f172a",
};

const baseFontSx = {
    fontFamily: '"Inter", "system-ui", sans-serif',
};

const pagePaperSx = {
    borderRadius: "var(--tg-radius-sm)",
    backgroundColor: "#FFFFFF",
    border: "1px solid var(--tg-card-border)",
    boxShadow: "var(--tg-shadow)",
};

const estados = [
    { value: "all", label: "Todos" },
    { value: "1", label: "Activos" },
    { value: "0", label: "Inactivos" },
];

const getInitialRowsPerPage = () => {
    try {
        return Number(localStorage.getItem("rowsPerPageProductos") || 10);
    } catch {
        return 10;
    }
};

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[m]));

const isTruthy = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    return ["1", "true", "t", "si", "sí", "on"].includes(
        String(value ?? "").trim().toLowerCase()
    );
};

const getEstadoValue = (value) => {
    const str = String(value ?? "").trim().toLowerCase();

    if (["1", "8", "activo", "activa", "active"].includes(str)) {
        return "1";
    }

    return "0";
};

const normalizeProducto = (item = {}) => ({
    ...item,
    id: item.id ?? item.pro_id,
    codigo: item.codigo ?? item.pro_codigo ?? item.sku ?? "",
    nombre: item.nombre ?? item.pro_descripcion ?? item.descripcion ?? "",
    descripcion: item.descripcion ?? item.pro_descripcion ?? "",
    categoria_id: item.categoria_id ?? item.pro_tipo ?? item.id_tipo ?? "",
    categoria_nombre:
        item.categoria_nombre ??
        item.tipo_insumo ??
        item.categoria ??
        item.descripcion_categoria ??
        item.descripcion ??
        "",
    sku: item.sku ?? "",
    marca: item.marca ?? "",
    modelo: item.modelo ?? "",
    unidad_medida: item.unidad_medida ?? item.pro_unidad_medida ?? "und",
    estado: getEstadoValue(item.estado ?? item.pro_estado ?? item.id_estado ?? 1),
    precio_costo: item.precio_costo ?? item.costo ?? 0,
    precio_venta: item.precio_venta ?? item.precio ?? item.valor ?? 0,
    stock_total:
        item.stock_total ??
        item.stock_actual ??
        item.stock_global ??
        item.stock ??
        0,
    stock_actual:
        item.stock_actual ??
        item.stock_total ??
        item.stock_global ??
        item.stock ??
        0,
    stock_minimo: item.stock_minimo ?? item.minimo ?? 0,
    maneja_lotes: isTruthy(item.maneja_lotes ?? item.requiere_lote),
    maneja_vencimiento: isTruthy(
        item.maneja_vencimiento ?? item.requiere_vencimiento
    ),
    imagen_url: normalizeAssetUrl(item.imagen_url ?? item.imagen ?? ""),
});

const normalizeCategoria = (item = {}) => ({
    ...item,
    id: item.id ?? item.value ?? item.ca_id,
    value: String(item.id ?? item.value ?? item.ca_id ?? ""),
    nombre: item.nombre ?? item.label ?? item.ca_descripcion ?? "Sin categoría",
    label: item.label ?? item.nombre ?? item.ca_descripcion ?? "Sin categoría",
});

const normalizeSede = (item = {}) => ({
    ...item,
    id: item.id ?? item.value ?? item.sede_id ?? item.id_sede,
    value: String(item.id ?? item.value ?? item.sede_id ?? item.id_sede ?? ""),
    nombre:
        item.nombre ??
        item.nombre_sede ??
        item.sede_nombre ??
        item.label ??
        "Sede",
    label:
        item.label ??
        item.nombre ??
        item.nombre_sede ??
        item.sede_nombre ??
        "Sede",
});

const formatMoney = (value) => {
    const number = Number(value || 0);

    if (Number.isNaN(number)) return "0.00";

    return number.toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatQty = (value) => {
    const number = Number(value || 0);

    if (Number.isNaN(number)) return "0";

    return number.toLocaleString("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

const getFechaArchivo = () => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");

    return `${yyyy}${mm}${dd}_${hh}${mi}`;
};

const getCategoriaNombre = (row, categorias = []) => {
    if (row?.categoria_nombre) return row.categoria_nombre;

    const found = categorias.find(
        (item) => String(item?.id ?? item?.value) === String(row?.categoria_id)
    );

    return found?.nombre || found?.label || "Sin categoría";
};

const getStockProducto = (row) =>
    Number(
        row?.stock_total ??
        row?.stock_actual ??
        row?.stock_global ??
        row?.stock ??
        0
    );

const normalizarProductosExport = (data = [], categorias = []) =>
    (Array.isArray(data) ? data : []).map((item) => ({
        ID: item?.id ?? "",
        Código: item?.codigo ?? "",
        SKU: item?.sku ?? "",
        Producto: item?.nombre ?? "",
        Categoría: getCategoriaNombre(item, categorias),
        Marca: item?.marca ?? "",
        Modelo: item?.modelo ?? "",
        "Unidad de medida": item?.unidad_medida ?? "und",
        "Precio costo": Number(item?.precio_costo || 0),
        "Precio venta": Number(item?.precio_venta || 0),
        "Stock global": getStockProducto(item),
        "Stock mínimo": Number(item?.stock_minimo || 0),
        "Control por lotes": item?.maneja_lotes ? "Sí" : "No",
        "Control vencimiento": item?.maneja_vencimiento ? "Sí" : "No",
        Estado: String(item?.estado) === "1" ? "Activo" : "Inactivo",
    }));

const exportarExcelProductos = (data = [], categorias = []) => {
    if (!Array.isArray(data) || data.length === 0) {
        return Swal.fire({
            title: "Sin datos",
            text: "No hay productos para exportar.",
            icon: "info",
            confirmButtonColor: ui.black,
        });
    }

    const rows = normalizarProductosExport(data, categorias);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
        { wch: 8 },
        { wch: 16 },
        { wch: 16 },
        { wch: 34 },
        { wch: 24 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 20 },
        { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(workbook, `Productos_Revive_${getFechaArchivo()}.xlsx`);
};

const exportarPDFProductos = (data = [], categorias = []) => {
    if (!Array.isArray(data) || data.length === 0) {
        return Swal.fire({
            title: "Sin datos",
            text: "No hay productos para exportar.",
            icon: "info",
            confirmButtonColor: ui.black,
        });
    }

    const doc = new jsPDF("l", "mm", "a4");

    const rows = (Array.isArray(data) ? data : []).map((item) => [
        item?.codigo ?? "",
        item?.nombre ?? "",
        getCategoriaNombre(item, categorias),
        item?.unidad_medida ?? "und",
        `$${formatMoney(item?.precio_costo)}`,
        `$${formatMoney(item?.precio_venta)}`,
        formatQty(getStockProducto(item)),
        item?.maneja_lotes ? "Sí" : "No",
        String(item?.estado) === "1" ? "Activo" : "Inactivo",
    ]);

    doc.setProperties({
        title: "Reporte de Productos - Revive Sports",
        subject: "Inventario",
        author: "Revive Sports",
    });

    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 297, 24, "F");

    doc.setTextColor(255, 194, 14);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REVIVE SPORTS", 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Productos e Inventario", 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Emitido: ${new Date().toLocaleString("es-EC")}`, 226, 18);

    autoTable(doc, {
        startY: 31,
        head: [[
            "Código",
            "Producto",
            "Categoría",
            "Unidad",
            "Costo",
            "Venta",
            "Stock",
            "Lotes",
            "Estado",
        ]],
        body: rows,
        theme: "grid",
        styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            textColor: [16, 24, 40],
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
            valign: "middle",
        },
        headStyles: {
            fillColor: [229, 231, 235],
            textColor: [17, 24, 39],
            fontStyle: "bold",
            halign: "center",
            lineColor: [209, 213, 219],
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250],
        },
        columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 58 },
            2: { cellWidth: 40 },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 24, halign: "right" },
            5: { cellWidth: 24, halign: "right" },
            6: { cellWidth: 22, halign: "right" },
            7: { cellWidth: 18, halign: "center" },
            8: { cellWidth: 22, halign: "center" },
        },
        didDrawPage: () => {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height || pageSize.getHeight();
            const pageWidth = pageSize.width || pageSize.getWidth();

            doc.setFontSize(7);
            doc.setTextColor(102, 112, 133);
            doc.text("Revive Sports · Inventario multi-sede", 14, pageHeight - 8);
            doc.text(
                `Página ${doc.internal.getNumberOfPages()}`,
                pageWidth - 25,
                pageHeight - 8
            );
        },
    });

    doc.save(`Productos_Revive_${getFechaArchivo()}.pdf`);
};

export default function Productos() {
    const [loading, setLoading] = useState(false);
    const [loadingActionId, setLoadingActionId] = useState(null);

    const [data, setData] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [sedes, setSedes] = useState([]);

    const [search, setSearch] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("0");
    const [filtroEstado, setFiltroEstado] = useState("1");

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(getInitialRowsPerPage);

    const [openModal, setOpenModal] = useState(false);
    const [openStock, setOpenStock] = useState(false);
    const [openPrecios, setOpenPrecios] = useState(false);

    const [selectedId, setSelectedId] = useState(null);
    const [dataEdit, setDataEdit] = useState(null);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [selectedProductoView, setSelectedProductoView] = useState(null);

    const fetchProductos = async () => {
        setLoading(true);

        try {
            const { data: resData } = await apiClient.get("/inventario/productos");
            setData((Array.isArray(resData) ? resData : []).map(normalizeProducto));
        } catch (error) {
            console.error("Error al cargar productos:", error);
            setData([]);
            Swal.fire({
                title: "Error",
                text: "Problema al consultar productos.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategorias = async () => {
        try {
            const { data: resData } = await apiClient.get("/inventario/categorias-producto");
            setCategorias(
                (Array.isArray(resData) ? resData : []).map(normalizeCategoria)
            );
        } catch (error) {
            console.error("Error al cargar categorías:", error);
            setCategorias([]);
        }
    };

    const fetchSedes = async () => {
        try {
            const { data: resData } = await apiClient.get("/inventario/sedes");
            setSedes((Array.isArray(resData) ? resData : []).map(normalizeSede));
        } catch (error) {
            console.error("Error al cargar sedes:", error);
            setSedes([]);
        }
    };

    const fetchData = async () => {
        await Promise.all([fetchProductos(), fetchCategorias(), fetchSedes()]);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, filtroCategoria, filtroEstado, rowsPerPage]);

    const filtered = useMemo(() => {
        const lower = search.trim().toLowerCase();

        return (data || []).filter((producto) => {
            const text = [
                producto?.nombre,
                producto?.codigo,
                producto?.sku,
                producto?.marca,
                producto?.modelo,
                getCategoriaNombre(producto, categorias),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = !lower || text.includes(lower);

            const matchesCat =
                filtroCategoria === "0" ||
                String(producto?.categoria_id) === String(filtroCategoria);

            const matchesEstado =
                filtroEstado === "all" ||
                String(producto?.estado) === String(filtroEstado);

            return matchesSearch && matchesCat && matchesEstado;
        });
    }, [data, categorias, search, filtroCategoria, filtroEstado]);

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

    const totalStockGlobal = useMemo(
        () => filtered.reduce((acc, item) => acc + getStockProducto(item), 0),
        [filtered]
    );

    const productosBajoStock = useMemo(
        () =>
            filtered.filter((item) => {
                const stock = getStockProducto(item);
                const minimo = Number(item?.stock_minimo || 0);
                return minimo > 0 && stock <= minimo;
            }).length,
        [filtered]
    );

    const handleRowsPerPage = (event) => {
        const value = Number(event.target.value);
        setRowsPerPage(value);

        try {
            localStorage.setItem("rowsPerPageProductos", String(value));
        } catch {
            // No bloquea el flujo.
        }

        setPage(1);
    };

    const handleAdd = () => {
        setDataEdit(null);
        setSelectedId(null);
        setOpenModal(true);
    };

    const handleEdit = async (id) => {
        setLoadingActionId(`edit-${id}`);

        try {
            const { data: producto } = await apiClient.get(`/inventario/productos/${id}`);
            setDataEdit(normalizeProducto(producto));
            setOpenModal(true);
        } catch (error) {
            console.error("Error al cargar producto:", error);
            Swal.fire({
                title: "Error",
                text: "No se pudo cargar la información del producto.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoadingActionId(null);
        }
    };

    const handleDelete = async (item) => {
        const result = await Swal.fire({
            title: "¿Desactivar producto?",
            text: `Se cambiará el estado de "${item?.nombre || "este producto"}" a Inactivo.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: ui.black,
            cancelButtonColor: ui.danger,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/inventario/productos/${item.id}`);

            Swal.fire({
                title: "Actualizado",
                text: "El producto ha sido desactivado.",
                icon: "success",
                confirmButtonColor: ui.black,
            });

            fetchProductos();
        } catch (error) {
            console.error("Error al desactivar producto:", error);
            Swal.fire({
                title: "Error",
                text: "No se pudo actualizar el estado del producto.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        }
    };

    const handlePreviewImage = (row) => {
        Swal.fire({
            title: row?.nombre || "Producto",
            imageUrl: row?.imagen_url || logo,
            imageAlt: row?.nombre || "Producto",
            confirmButtonText: "Cerrar",
            confirmButtonColor: ui.black,
            width: 520,
            heightAuto: false,
        });
    };

    const handleViewProducto = (row) => {
        setSelectedProductoView(row);
        setOpenViewModal(true);
    };

    const handleOpenStock = (id) => {
        setSelectedId(id);
        setOpenStock(true);
    };

    const handleOpenPrecios = (id) => {
        setSelectedId(id);
        setOpenPrecios(true);
    };

    const handleCloseProducto = () => {
        setOpenModal(false);
        setDataEdit(null);
    };

    const handleCloseStock = () => {
        setOpenStock(false);
        setSelectedId(null);
    };

    const handleClosePrecios = () => {
        setOpenPrecios(false);
        setSelectedId(null);
    };

    const TableSkeleton = () => (
        <>
            {[...Array(6)].map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="42%" />
                    </TableCell>
                    <TableCell>
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="48%" />
                    </TableCell>
                    <TableCell align="right">
                        <Skeleton variant="text" width="55%" sx={{ ml: "auto" }} />
                        <Skeleton variant="text" width="42%" sx={{ ml: "auto" }} />
                    </TableCell>
                    <TableCell align="right">
                        <Skeleton variant="text" width="50%" sx={{ ml: "auto" }} />
                    </TableCell>
                    <TableCell align="center">
                        <Skeleton variant="rounded" width={70} height={22} sx={{ mx: "auto" }} />
                    </TableCell>
                    <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Skeleton variant="rounded" width={32} height={32} />
                            <Skeleton variant="rounded" width={32} height={32} />
                        </Stack>
                    </TableCell>
                    <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Skeleton variant="rounded" width={32} height={32} />
                            <Skeleton variant="rounded" width={32} height={32} />
                            <Skeleton variant="rounded" width={32} height={32} />
                        </Stack>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Box sx={{ ...baseFontSx, minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        {/* PAPER 1: ENCABEZADO (Estilo Dbanu) */}
                        <PageHeader
                            title="Catalogo de productos"
                            rightContent={
                                <Box
                                    sx={{
                                        px: 2.5,
                                        py: 0.8,
                                        borderRadius: "6px",
                                        bgcolor: "#f0fdf4",
                                        border: "1px solid #dcfce7",
                                        color: "#166534",
                                        fontSize: "12px",
                                        fontWeight: 900,
                                        letterSpacing: "0.5px"
                                    }}
                                >
                                    {filtered.length} RESULTADOS
                                </Box>
                            }
                        />

                        {/* PAPER 2: ACCIONES Y TABLA (Estilo Dbanu) */}
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

                            {/* 2. Actions Row (Estilo Flexbox para alineación total) */}
                            <Box sx={{ px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                {/* Grupo de Filtros (Izquierda) */}
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        sx={{ ...filterInputSx, width: 220 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: ui.muted }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 140 }}>
                                        <Select
                                            value={filtroCategoria}
                                            onChange={(e) => setFiltroCategoria(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="0">Categoría</MenuItem>
                                            {categorias.map((cat) => (
                                                <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 120 }}>
                                        <Select
                                            value={filtroEstado}
                                            onChange={(e) => setFiltroEstado(e.target.value)}
                                            sx={{ fontSize: "13px" }}
                                        >
                                            {estados.map((est) => (
                                                <MenuItem key={est.value} value={est.value}>{est.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 80 }}>
                                        <Select
                                            value={rowsPerPage}
                                            onChange={handleRowsPerPage}
                                            sx={{ fontSize: "13px" }}
                                        >
                                            {[5, 10, 25, 50].map((n) => (
                                                <MenuItem key={n} value={n}>{n}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                {/* Grupo de Botones (Derecha - Forzado) */}
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PremiumButton variant="excel" onClick={() => exportarExcelProductos(filtered, categorias)}>
                                        EXCEL
                                    </PremiumButton>
                                    <PremiumButton variant="pdf" onClick={() => exportarPDFProductos(filtered, categorias)}>
                                        PDF
                                    </PremiumButton>
                                    <PremiumButton variant="anadir" onClick={handleAdd}>
                                        Añadir
                                    </PremiumButton>
                                </Stack>
                            </Box>

                            {/* 3. Table Area (Enmarcada para distinguir del Paper) */}
                            <Box sx={{ px: 4, pb: 4 }}>
                                <TableContainer
                                    sx={{
                                        overflowX: "auto",
                                        maxHeight: "calc(100vh - 380px)",
                                        minHeight: 320,
                                        bgcolor: "#ffffff",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <Table stickyHeader size="small" sx={{
                                        ...tableSx,
                                        width: "100%",
                                        minWidth: "100%",
                                        tableLayout: "fixed",
                                        "& .MuiTableCell-root": {
                                            padding: "6px 20px", // Ultra delgado estilo Dbanu
                                            fontSize: "13px",
                                            borderColor: "#f1f5f9"
                                        }
                                    }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f1f5f9 !important" }}>
                                                <TableCell sx={{ width: "8%" }} align="center">
                                                    Imagen
                                                </TableCell>
                                                <TableCell sx={{ width: "22%" }}>
                                                    Producto
                                                </TableCell>
                                                <TableCell sx={{ width: "16%" }}>
                                                    Categoría / Control
                                                </TableCell>
                                                <TableCell align="right" sx={{ width: "12%" }}>
                                                    Valores
                                                </TableCell>
                                                <TableCell align="right" sx={{ width: "10%" }}>
                                                    Stock actual
                                                </TableCell>
                                                <TableCell align="center" sx={{ width: "8%" }}>
                                                    Estado
                                                </TableCell>
                                                <TableCell align="center" sx={{ width: "11%" }}>
                                                    Configurar
                                                </TableCell>
                                                <TableCell align="center" sx={{ width: "13%" }}>
                                                    Acciones
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {loading ? (
                                                <TableSkeleton />
                                            ) : paginated.length > 0 ? (
                                                paginated.map((row) => {
                                                    const stock = getStockProducto(row);
                                                    const stockMinimo = Number(row?.stock_minimo || 0);
                                                    const isLowStock = stockMinimo > 0 && stock <= stockMinimo;
                                                    const categoriaNombre = getCategoriaNombre(row, categorias);

                                                    return (
                                                        <TableRow key={row.id} hover>
                                                            <TableCell align="center">
                                                                <Tooltip title="Ver imagen" arrow>
                                                                    <Box
                                                                        component="img"
                                                                        onClick={() => handlePreviewImage(row)}
                                                                        src={row?.imagen_url || logo}
                                                                        sx={{
                                                                            width: 42,
                                                                            height: 42,
                                                                            borderRadius: "8px",
                                                                            objectFit: "cover",
                                                                            border: `1px solid ${ui.border}`,
                                                                            bgcolor: ui.black,
                                                                            cursor: "zoom-in",
                                                                            transition: "all .18s ease",
                                                                            "&:hover": {
                                                                                transform: "scale(1.06)",
                                                                                boxShadow: "0 8px 16px rgba(0,0,0,0.12)",
                                                                            },
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </TableCell>

                                                            <TableCell>
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        fontWeight: 900,
                                                                        fontSize: 13,
                                                                        color: ui.text,
                                                                        lineHeight: 1.2,
                                                                    }}
                                                                >
                                                                    {row?.nombre || "Producto sin nombre"}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        color: ui.muted,
                                                                        fontWeight: 600,
                                                                        fontSize: 11,
                                                                        mt: 0.25,
                                                                    }}
                                                                >
                                                                    Cód: {row?.codigo || "S/C"}
                                                                    {row?.sku ? ` · SKU: ${row.sku}` : ""}
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell>
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        fontWeight: 800,
                                                                        fontSize: 12,
                                                                        color: ui.text,
                                                                    }}
                                                                >
                                                                    {categoriaNombre}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        color: ui.muted,
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {row?.maneja_lotes
                                                                        ? row?.maneja_vencimiento
                                                                            ? "Lotes + vencimiento"
                                                                            : "Control por lotes"
                                                                        : "Inventario general"}
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        fontWeight: 900,
                                                                        fontSize: 13,
                                                                        color: ui.black,
                                                                    }}
                                                                >
                                                                    ${formatMoney(row?.precio_venta)}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        ...baseFontSx,
                                                                        color: ui.muted,
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    Costo: ${formatMoney(row?.precio_costo)}
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center">
                                                                    {isLowStock && (
                                                                        <Tooltip title="Stock por debajo del mínimo">
                                                                            <Box
                                                                                sx={{
                                                                                    width: 8,
                                                                                    height: 8,
                                                                                    borderRadius: "50%",
                                                                                    bgcolor: ui.danger,
                                                                                    "@keyframes pulseStock": {
                                                                                        "0%": { transform: "scale(0.9)", opacity: 0.65 },
                                                                                        "50%": { transform: "scale(1.25)", opacity: 1 },
                                                                                        "100%": { transform: "scale(0.9)", opacity: 0.65 },
                                                                                    },
                                                                                    animation: "pulseStock 1.4s infinite",
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    )}

                                                                    <Typography
                                                                        sx={{
                                                                            ...baseFontSx,
                                                                            fontWeight: 950,
                                                                            fontSize: 15,
                                                                            color: isLowStock ? ui.danger : ui.black,
                                                                        }}
                                                                    >
                                                                        {formatQty(stock)}
                                                                    </Typography>

                                                                    <Typography
                                                                        sx={{
                                                                            ...baseFontSx,
                                                                            color: ui.muted,
                                                                            fontSize: 11,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        {row?.unidad_medida || "und"}
                                                                    </Typography>
                                                                </Stack>

                                                                {isLowStock && (
                                                                    <Typography
                                                                        sx={{
                                                                            ...baseFontSx,
                                                                            color: ui.danger,
                                                                            fontWeight: 900,
                                                                            fontSize: 9.5,
                                                                            display: "block",
                                                                            mt: 0.15,
                                                                        }}
                                                                    >
                                                                        BAJO STOCK
                                                                    </Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell align="center">
                                                                <Chip
                                                                    label={String(row?.estado) === "1" ? "Activo" : "Inactivo"}
                                                                    size="small"
                                                                    sx={semanticChipSx(String(row?.estado) === "1" ? "success" : "neutral")}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Stack direction="row" spacing={0.6} justifyContent="center">
                                                                    <Tooltip title="Inventario por Sede">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleOpenStock(row.id)}
                                                                            sx={semanticIconButtonSx("inventory")}
                                                                        >
                                                                            <LayersOutlinedIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Precios">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleOpenPrecios(row.id)}
                                                                            sx={semanticIconButtonSx("mustard")}
                                                                        >
                                                                            <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                            </TableCell>

                                                            <TableCell align="center">
                                                                <Stack direction="row" spacing={0.8} justifyContent="center">
                                                                    <Tooltip title="Ver Detalle">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleViewProducto(row)}
                                                                            sx={semanticIconButtonSx("neutral")}
                                                                        >
                                                                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Editar">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleEdit(row.id)}
                                                                            sx={semanticIconButtonSx("mustard")}
                                                                        >
                                                                            <EditIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Eliminar">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleDelete(row)}
                                                                            sx={semanticIconButtonSx("danger")}
                                                                        >
                                                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                        <Box sx={{ textAlign: "center", opacity: 0.78 }}>
                                                            <Inventory2Icon sx={{ fontSize: 58, color: ui.muted, mb: 1.5 }} />

                                                            <Typography
                                                                sx={{
                                                                    ...baseFontSx,
                                                                    fontWeight: 900,
                                                                    color: ui.black,
                                                                    fontSize: 16,
                                                                    mb: 0.5
                                                                }}
                                                            >
                                                                No hay productos registrados
                                                            </Typography>

                                                            <Typography
                                                                sx={{
                                                                    ...baseFontSx,
                                                                    color: ui.muted,
                                                                    fontSize: 12,
                                                                    mb: 2.5,
                                                                }}
                                                            >
                                                                Ajusta los filtros o crea un nuevo producto para comenzar.
                                                            </Typography>

                                                            <PremiumButton
                                                                variant="anadir"
                                                                onClick={handleAdd}
                                                            >
                                                                Crear primer producto
                                                            </PremiumButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 1.8, bgcolor: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                                    <Pagination
                                        count={totalPages}
                                        page={Math.min(page, totalPages)}
                                        onChange={(e, value) => setPage(value)}
                                        showFirstButton
                                        showLastButton
                                        sx={{
                                            "& .MuiPaginationItem-root": {
                                                ...baseFontSx,
                                                fontSize: 12,
                                                fontWeight: 800,
                                                borderRadius: "8px",
                                                minWidth: 30,
                                                height: 30,
                                            },
                                            "& .Mui-selected": {
                                                bgcolor: `rgba(15, 23, 42, 0.08) !important`,
                                                color: ui.black,
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Stack>
                </Fade>
            </Box>

            <ModalProductoInventario
                open={openModal}
                onClose={handleCloseProducto}
                dataEdit={dataEdit}
                categorias={categorias}
                sedes={sedes}
                onSaved={fetchData}
            />

            <ModalInventarioInicialProducto
                open={openStock}
                onClose={handleCloseStock}
                productoId={selectedId}
                sedes={sedes}
                onSaved={fetchData}
            />

            <ModalPreciosProducto
                open={openPrecios}
                onClose={handleClosePrecios}
                productoId={selectedId}
                sedes={sedes}
            />

            <ModalVerProducto
                open={openViewModal}
                onClose={() => {
                    setOpenViewModal(false);
                    setSelectedProductoView(null);
                }}
                producto={selectedProductoView}
                categorias={categorias}
                stock={selectedProductoView ? getStockProducto(selectedProductoView) : 0}
            />
        </Box>
    );
}
