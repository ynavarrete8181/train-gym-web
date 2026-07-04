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

import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

import Swal from "sweetalert2";
import dayjs from "dayjs";

import ModalMovimientoInventario from "../Movimientos/components/ModalMovimientoInventario";
import { exportarExcel, exportarPDF } from "../Productos/components/utils/exportaciones";
import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient } from "../../../services/apiClient";
import { filterInputSx, modalFieldSx, semanticChipSx, tableSx } from "../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    text: "#0f172a",
    primary: "var(--tg-primary)",
    primarySoft: "rgba(240, 180, 0, 0.12)",
};

const baseFontSx = {
    fontFamily: '"Inter", "system-ui", sans-serif',
};

const pagePaperSx = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
};

export default function SalidasInventario() {
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [data, setData] = useState([]);
    const [productos, setProductos] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [search, setSearch] = useState("");
    const [filtroSede, setFiltroSede] = useState("0");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [openModal, setOpenModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resMov, resProd, resSedes] = await Promise.all([
                apiClient.get("/inventario/movimientos", { params: { tipo_movimiento: "SALIDA", limit: 300 } }),
                apiClient.get("/inventario/productos"),
                apiClient.get("/inventario/sedes"),
            ]);

            setData(Array.isArray(resMov.data) ? resMov.data.filter((m) => m.tipo_movimiento === "SALIDA") : []);
            setProductos(Array.isArray(resProd.data) ? resProd.data : []);
            setSedes(Array.isArray(resSedes.data) ? resSedes.data : []);
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "No se pudo cargar el historial de egresos.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, filtroSede, fechaDesde, fechaHasta, rowsPerPage]);

    const filtered = useMemo(() => {
        const lower = search.trim().toLowerCase();
        return (data || []).filter((item) => {
            const matchesSearch = !lower || `
                ${item?.producto_codigo ?? ""}
                ${item?.producto_nombre ?? ""}
                ${item?.motivo ?? ""}
                ${item?.codigo_lote ?? ""}
                ${item?.referencia_tipo ?? ""}
                ${item?.observacion ?? ""}
                ${item?.sede_nombre ?? ""}
            `.toLowerCase().includes(lower);

            const matchesSede = filtroSede === "0" || String(item?.sede_id) === filtroSede;
            const itemDate = item?.created_at ? dayjs(item.created_at).format("YYYY-MM-DD") : "";
            const matchesDesde = !fechaDesde || itemDate >= fechaDesde;
            const matchesHasta = !fechaHasta || itemDate <= fechaHasta;

            return matchesSearch && matchesSede && matchesDesde && matchesHasta;
        });
    }, [data, search, filtroSede, fechaDesde, fechaHasta]);

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

    const handleSubmit = async (payload) => {
        setLoadingSubmit(true);
        try {
            await apiClient.post("/inventario/movimientos/salida", payload);
            Swal.fire({
                title: "Exito",
                text: "Egreso registrado correctamente.",
                icon: "success",
                confirmButtonColor: ui.black,
            });
            setOpenModal(false);
            fetchData();
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error?.response?.data?.message || "No se pudo registrar el egreso.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoadingSubmit(false);
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

    const exportRows = filtered.map((row) => ({
        id: row.id,
        fecha: dayjs(row.created_at).format("DD/MM/YYYY HH:mm"),
        sede: row.sede_nombre || "",
        producto: row.producto_nombre || "",
        codigo: row.producto_codigo || "",
        motivo: row.motivo || "",
        cantidad: row.cantidad,
        costo_unitario: row.costo_unitario,
        precio_unitario: row.precio_unitario,
        stock_anterior: row.stock_anterior,
        stock_nuevo: row.stock_nuevo,
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
                    <TableCell><Skeleton variant="text" width={140} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={50} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={70} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={70} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={55} sx={{ ml: "auto" }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={55} sx={{ ml: "auto" }} /></TableCell>
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
                        <Paper elevation={0} sx={{ ...pagePaperSx, px: 4, py: "12px !important", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Stack direction="row" alignItems="center" spacing={2.5}>
                                <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: ui.danger, border: "1px solid #fee2e2" }}>
                                    <LogoutIcon fontSize="medium" />
                                </Box>
                                <Typography variant="h6" sx={{ ...baseFontSx, fontWeight: 800, color: "#1e293b", fontSize: "17px", lineHeight: 1 }}>
                                    Egresos de inventario
                                </Typography>
                            </Stack>

                            <Box sx={{ px: 2.5, py: 0.8, borderRadius: "6px", bgcolor: "#fef2f2", border: "1px solid #fee2e2", color: "#991b1b", fontSize: "12px", fontWeight: 900, letterSpacing: "0.5px" }}>
                                {filtered.length} REGISTROS
                            </Box>
                        </Paper>

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
                                    <Select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} size="small" sx={{ ...filterInputSx, width: 180 }} startAdornment={<FilterListIcon sx={{ color: ui.muted, mr: 1, fontSize: 18 }} />}>
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
                                    <PremiumButton variant="excel" onClick={() => exportarExcel(exportRows, "salidas-inventario")}>
                                        EXCEL
                                    </PremiumButton>
                                    <PremiumButton variant="pdf" onClick={() => exportarPDF(exportRows, [], "Egresos Inventario")}>
                                        PDF
                                    </PremiumButton>
                                    <PremiumButton
                                        variant="anadir"
                                        onClick={() => setOpenModal(true)}
                                    >
                                        Añadir
                                    </PremiumButton>
                                </Stack>
                            </Box>

                            <Box sx={{ px: 4, pb: 4 }}>
                                <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 380px)", minHeight: 320, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <Table stickyHeader size="small" sx={{ ...tableSx, width: "100%", minWidth: 1700, tableLayout: "fixed", "& .MuiTableCell-root": { padding: "6px 14px", fontSize: "13px", borderColor: "#f1f5f9" } }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f1f5f9 !important" }}>
                                                <TableCell sx={{ width: 70 }}>ID</TableCell>
                                                <TableCell sx={{ width: 120 }}>Fecha</TableCell>
                                                <TableCell sx={{ width: 130 }}>Sede</TableCell>
                                                <TableCell sx={{ width: 220 }}>Producto</TableCell>
                                                <TableCell sx={{ width: 170 }}>Motivo / Ref.</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>Cant.</TableCell>
                                                <TableCell align="right" sx={{ width: 100 }}>Costo</TableCell>
                                                <TableCell align="right" sx={{ width: 100 }}>Precio</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>S. Ant.</TableCell>
                                                <TableCell align="right" sx={{ width: 90 }}>S. Nuevo</TableCell>
                                                <TableCell sx={{ width: 100 }}>Lote</TableCell>
                                                <TableCell sx={{ width: 200 }}>Observación</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {loading ? (
                                                <TableSkeleton />
                                            ) : paginated.length ? (
                                                paginated.map((row) => (
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
                                                        <TableCell>
                                                            <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 700, color: ui.text }}>{row.motivo}</Typography>
                                                            {row.referencia_tipo && <Typography sx={{ ...baseFontSx, color: ui.muted, display: "block", fontWeight: 600, fontSize: "10px" }}>Ref: {row.referencia_tipo} {row.referencia_id ? `#${row.referencia_id}` : ""}</Typography>}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 950, color: ui.danger, fontSize: "14px" }}>-{formatQty(row.cantidad)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: "12px" }}>${formatMoney(row.costo_unitario)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: "12px" }}>${formatMoney(row.precio_unitario)}</TableCell>
                                                        <TableCell align="right" sx={{ color: ui.muted, fontWeight: 700, fontSize: "12px" }}>{formatQty(row.stock_anterior)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 950, color: ui.black, fontSize: "14px" }}>{formatQty(row.stock_nuevo)}</TableCell>
                                                        <TableCell>{row.codigo_lote ? <Chip label={row.codigo_lote} size="small" sx={semanticChipSx("neutral")} /> : <Typography sx={{ color: ui.muted, fontSize: "12px" }}>-</Typography>}</TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11, lineHeight: 1.35 }}>
                                                                {row.observacion || "-"}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={12} align="center" sx={{ py: 10 }}>
                                                        <Box sx={{ textAlign: "center", opacity: 0.78 }}>
                                                            <LogoutIcon sx={{ fontSize: 58, color: ui.muted, mb: 1.5 }} />
                                                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.black, fontSize: 16, mb: 0.5 }}>
                                                                No hay egresos registrados
                                                            </Typography>
                                                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12 }}>
                                                                Registra consumos, cortesias o mermas para ver el historial.
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

            <ModalMovimientoInventario open={openModal} onClose={() => setOpenModal(false)} type="salida" productos={productos} sedes={sedes} onSubmit={handleSubmit} loading={loadingSubmit} />
        </Box>
    );
}
