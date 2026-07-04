import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    Fade,
    InputAdornment,
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
    Typography,
} from "@mui/material";

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

import Swal from "sweetalert2";
import dayjs from "dayjs";

import ModalMovimientoInventario from "./components/ModalMovimientoInventario";
import { exportarExcel, exportarPDF } from "../Productos/components/utils/exportaciones";
import PremiumButton from "../../../components/ui/PremiumButton";
import PageHeader from "../../../components/ui/PageHeader";
import { apiClient } from "../../../services/apiClient";
import { filterInputSx, modalFieldSx, semanticChipSx, tableSx } from "../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    success: "#16a34a",
    successSoft: "rgba(22, 163, 74, 0.08)",
    successBorder: "rgba(22, 163, 74, 0.18)",
    danger: "#dc2626",
    dangerSoft: "rgba(220, 38, 38, 0.08)",
    dangerBorder: "rgba(220, 38, 38, 0.18)",
    mustard: "var(--tg-primary)",
    mustardDark: "var(--tg-primary-strong)",
    mustardSoft: "rgba(240, 180, 0, 0.10)",
    mustardBorder: "rgba(240, 180, 0, 0.22)",
    muted: "#64748b",
    border: "#e2e8f0",
    text: "#0f172a",
    primarySoft: "rgba(240, 180, 0, 0.12)",
};

const tipos = [
    { value: "0", label: "Todos los tipos" },
    { value: "ENTRADA", label: "Entradas" },
    { value: "SALIDA", label: "Salidas" },
    { value: "AJUSTE", label: "Ajustes" },
    { value: "BAJA", label: "Bajas" },
    { value: "TRANSFERENCIA_ENTRADA", label: "Transf. Entrada" },
    { value: "TRANSFERENCIA_SALIDA", label: "Transf. Salida" },
];

const baseFontSx = {
    fontFamily: '"Inter", "system-ui", sans-serif',
};

const pagePaperSx = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
};

export default function MovimientosInventario() {
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [data, setData] = useState([]);
    const [productos, setProductos] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [search, setSearch] = useState("");
    const [tipo, setTipo] = useState("0");
    const [filtroSede, setFiltroSede] = useState("0");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [modalType, setModalType] = useState(null);

    const fetchMovimientos = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/inventario/movimientos", { params: { limit: 300 } });
            setData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setData([]);
            Swal.fire({
                title: "Error",
                text: "No se pudieron consultar los movimientos de inventario.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogos = async () => {
        try {
            const [resProd, resSedes] = await Promise.all([
                apiClient.get("/inventario/productos"),
                apiClient.get("/inventario/sedes"),
            ]);
            setProductos(Array.isArray(resProd.data) ? resProd.data : []);
            setSedes(Array.isArray(resSedes.data) ? resSedes.data : []);
        } catch (error) {
            setProductos([]);
            setSedes([]);
        }
    };

    useEffect(() => {
        fetchMovimientos();
        fetchCatalogos();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, tipo, filtroSede, fechaDesde, fechaHasta, rowsPerPage]);

    const filtered = useMemo(() => {
        const lower = search.trim().toLowerCase();
        return (data || []).filter((item) => {
            const matchesTipo = tipo === "0" || item?.tipo_movimiento === tipo;
            const matchesSede = filtroSede === "0" || String(item?.sede_id) === filtroSede;
            const itemDate = item?.created_at ? dayjs(item.created_at).format("YYYY-MM-DD") : "";
            const matchesDesde = !fechaDesde || itemDate >= fechaDesde;
            const matchesHasta = !fechaHasta || itemDate <= fechaHasta;
            const text = `
                ${item?.producto_codigo ?? ""}
                ${item?.producto_nombre ?? ""}
                ${item?.tipo_movimiento ?? ""}
                ${item?.motivo ?? ""}
                ${item?.codigo_lote ?? ""}
                ${item?.referencia_tipo ?? ""}
                ${item?.observacion ?? ""}
                ${item?.sede_nombre ?? ""}
            `.toLowerCase();
            return matchesTipo && matchesSede && matchesDesde && matchesHasta && (!lower || text.includes(lower));
        });
    }, [data, search, tipo, filtroSede, fechaDesde, fechaHasta]);

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

    const getStatusColor = (tipoMovimiento) => {
        switch (tipoMovimiento) {
            case "ENTRADA":
            case "TRANSFERENCIA_ENTRADA":
                return { bg: ui.successSoft, color: ui.success, border: ui.successBorder };
            case "SALIDA":
            case "TRANSFERENCIA_SALIDA":
            case "BAJA":
                return { bg: ui.dangerSoft, color: ui.danger, border: ui.dangerBorder };
            default:
                return { bg: ui.mustardSoft, color: ui.mustardDark, border: ui.mustardBorder };
        }
    };

    const formatQty = (value) => {
        const number = Number(value || 0);
        if (Number.isNaN(number)) return "0";
        return number.toLocaleString("es-EC", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatMoney = (value) => {
        const number = Number(value || 0);
        if (Number.isNaN(number)) return "0.00";
        return number.toLocaleString("es-EC", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleSubmitMovimiento = async (payload) => {
        if (!modalType) return;

        const endpointMap = {
            entrada: "/inventario/movimientos/entrada",
            salida: "/inventario/movimientos/salida",
            ajuste: "/inventario/movimientos/ajuste",
            baja: "/inventario/movimientos/baja",
        };

        const endpoint = endpointMap[modalType];
        if (!endpoint) return;

        setLoadingSubmit(true);
        try {
            await apiClient.post(endpoint, payload);
            Swal.fire({
                title: "Exito",
                text: "Movimiento registrado correctamente.",
                icon: "success",
                confirmButtonColor: ui.black,
            });
            setModalType(null);
            fetchMovimientos();
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error?.response?.data?.message || "No se pudo registrar el movimiento.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const exportRows = filtered.map((row) => ({
        id: row.id,
        fecha: dayjs(row.created_at).format("DD/MM/YYYY HH:mm"),
        sede: row.sede_nombre || "",
        producto: row.producto_nombre || "",
        codigo: row.producto_codigo || "",
        tipo: row.tipo_movimiento || "",
        motivo: row.motivo || "",
        cantidad: row.cantidad,
        stock_anterior: row.stock_anterior,
        stock_nuevo: row.stock_nuevo,
        costo_unitario: row.costo_unitario,
        precio_unitario: row.precio_unitario,
        lote: row.codigo_lote || "",
        referencia_tipo: row.referencia_tipo || "",
        referencia_id: row.referencia_id || "",
        observacion: row.observacion || "",
    }));

    const TableSkeleton = () => (
        <>
            {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton variant="text" width={40} /></TableCell>
                    <TableCell><Skeleton variant="text" width={90} /></TableCell>
                    <TableCell><Skeleton variant="text" width={110} /></TableCell>
                    <TableCell><Skeleton variant="text" width={130} /></TableCell>
                    <TableCell><Skeleton variant="text" width={110} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={50} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={55} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={55} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={65} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={65} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell><Skeleton variant="text" width={70} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: ui.bg, minHeight: "100vh" }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Kardex / movimientos"
                            icon={<SwapHorizIcon sx={{ color: "#fff", fontSize: 26 }} />}
                            rightContent={
                                <Box sx={{ px: 2.5, py: 0.8, borderRadius: "6px", bgcolor: "#f0fdf4", border: "1px solid #dcfce7", color: "#166534", fontSize: "12px", fontWeight: 900, letterSpacing: "0.5px" }}>
                                    {filtered.length} REGISTROS
                                </Box>
                            }
                        />

                        <Paper elevation={0} sx={{ ...pagePaperSx, overflow: "hidden" }}>
                            <Box sx={{ px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }} useFlexGap>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        sx={{ ...filterInputSx, width: 220 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ fontSize: 18, color: ui.muted }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Select value={tipo} onChange={(e) => setTipo(e.target.value)} size="small" sx={{ ...filterInputSx, width: 180 }} startAdornment={<FilterListIcon sx={{ color: ui.muted, mr: 1, fontSize: 18 }} />}>
                                        {tipos.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                                    </Select>
                                    <Select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <MenuItem value="0">Todas las sedes</MenuItem>
                                        {sedes.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>)}
                                    </Select>
                                    <TextField label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} sx={{ ...filterInputSx, width: 150 }} />
                                    <TextField label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} sx={{ ...filterInputSx, width: 150 }} />
                                    <Select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} size="small" sx={{ ...filterInputSx, width: 80 }}>
                                        {[10, 15, 25, 50].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                    </Select>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <PremiumButton variant="excel" onClick={() => exportarExcel(exportRows, "kardex-inventario")}>
                                        EXCEL
                                    </PremiumButton>
                                    <PremiumButton variant="pdf" onClick={() => exportarPDF(exportRows, [], "Kardex Inventario")}>
                                        PDF
                                    </PremiumButton>
                                        {[
                                            { key: "entrada", label: "Entrada" },
                                            { key: "salida", label: "Salida" },
                                            { key: "ajuste", label: "Ajuste" },
                                            { key: "baja", label: "Baja" },
                                        ].map((action) => (
                                        <PremiumButton
                                            key={action.key}
                                            onClick={() => setModalType(action.key)}
                                            variant="outline"
                                            sx={{ px: 1.8 }}
                                        >
                                            {action.label}
                                        </PremiumButton>
                                    ))}
                                </Stack>
                            </Box>

                            <Box sx={{ px: 4, pb: 4 }}>
                                <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 380px)", minHeight: 320, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <Table stickyHeader size="small" sx={{ ...tableSx, width: "100%", minWidth: 1900, tableLayout: "fixed", "& .MuiTableCell-root": { padding: "6px 14px", fontSize: "13px", borderColor: "#f1f5f9" } }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f1f5f9 !important" }}>
                                                <TableCell sx={{ width: 60 }}>ID</TableCell>
                                                <TableCell sx={{ width: 120 }}>Fecha</TableCell>
                                                <TableCell sx={{ width: 130 }}>Sede</TableCell>
                                                <TableCell sx={{ width: 200 }}>Producto</TableCell>
                                                <TableCell align="center" sx={{ width: 120 }}>Tipo</TableCell>
                                                <TableCell sx={{ width: 170 }}>Motivo / Ref.</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>Cant.</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>S. Ant.</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>S. Nuevo</TableCell>
                                                <TableCell align="right" sx={{ width: 100 }}>Costo</TableCell>
                                                <TableCell align="right" sx={{ width: 100 }}>Precio</TableCell>
                                                <TableCell sx={{ width: 100 }}>Lote</TableCell>
                                                <TableCell sx={{ width: 210 }}>Observación</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {loading ? (
                                                <TableSkeleton />
                                            ) : paginated.length ? (
                                                paginated.map((row) => {
                                                    const status = getStatusColor(row.tipo_movimiento);
                                                    const isPositive = String(row.tipo_movimiento || "").includes("ENTRADA");
                                                    return (
                                                        <TableRow key={row.id} hover>
                                                            <TableCell sx={{ color: ui.muted, fontSize: 11, fontWeight: 700 }}>#{row.id}</TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, fontWeight: 800, fontSize: 12 }}>{dayjs(row.created_at).format("DD/MM/YYYY")}</Typography>
                                                                <Typography sx={{ ...baseFontSx, color: ui.muted, fontWeight: 600, fontSize: 11 }}>{dayjs(row.created_at).format("HH:mm")}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, fontWeight: 700, fontSize: 12, color: ui.text }}>{row.sede_nombre || "-"}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 13, color: ui.text, lineHeight: 1.2 }}>{row.producto_nombre}</Typography>
                                                                <Typography sx={{ ...baseFontSx, color: ui.muted, fontWeight: 600, fontSize: 11 }}>{row.producto_codigo || "S/C"}</Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip label={String(row.tipo_movimiento || "").replace(/_/g, " ")} size="small" sx={semanticChipSx(String(row.tipo_movimiento || "").includes("ENTRADA") ? "success" : String(row.tipo_movimiento || "") === "AJUSTE" ? "mustard" : "danger")} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 700, color: ui.text }}>{row.motivo}</Typography>
                                                                {row.referencia_tipo && <Typography sx={{ ...baseFontSx, color: ui.muted, display: "block", fontWeight: 600, fontSize: "10px" }}>Ref: {row.referencia_tipo} {row.referencia_id ? `#${row.referencia_id}` : ""}</Typography>}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 950, color: status.color, fontSize: "14px" }}>
                                                                {isPositive ? "+" : "-"}{formatQty(row.cantidad)}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: ui.muted, fontWeight: 700, fontSize: "12px" }}>{formatQty(row.stock_anterior)}</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 950, color: ui.black, fontSize: "14px" }}>{formatQty(row.stock_nuevo)}</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 800, fontSize: "12px" }}>${formatMoney(row.costo_unitario)}</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 800, fontSize: "12px" }}>${formatMoney(row.precio_unitario)}</TableCell>
                                                            <TableCell>{row.codigo_lote ? <Chip label={row.codigo_lote} size="small" sx={semanticChipSx("neutral")} /> : <Typography sx={{ color: ui.muted, fontSize: "12px" }}>-</Typography>}</TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11, lineHeight: 1.35 }}>
                                                                    {row.observacion || "-"}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={13} align="center" sx={{ py: 10 }}>
                                                        <Box sx={{ textAlign: "center", opacity: 0.78 }}>
                                                            <HistoryIcon sx={{ fontSize: 58, color: ui.muted, mb: 1.5 }} />
                                                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.black, fontSize: 16, mb: 0.5 }}>
                                                                No hay movimientos registrados
                                                            </Typography>
                                                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12 }}>
                                                                Ajusta los filtros o registra un nuevo movimiento.
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 1.8, bgcolor: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                                    <Pagination count={totalPages} page={Math.min(page, totalPages)} onChange={(e, value) => setPage(value)} showFirstButton showLastButton sx={{ "& .MuiPaginationItem-root": { ...baseFontSx, fontSize: 12, fontWeight: 800, borderRadius: "8px", minWidth: 30, height: 30 }, "& .Mui-selected": { bgcolor: "rgba(15, 23, 42, 0.08) !important", color: ui.black } }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Stack>
                </Fade>
            </Box>

            <ModalMovimientoInventario open={!!modalType} onClose={() => setModalType(null)} type={modalType || "entrada"} productos={productos} sedes={sedes} onSubmit={handleSubmitMovimiento} loading={loadingSubmit} />
        </Box>
    );
}
