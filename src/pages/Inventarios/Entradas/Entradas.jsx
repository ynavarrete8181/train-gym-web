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
    IconButton,
    Tooltip,
} from "@mui/material";

import InputIcon from "@mui/icons-material/Input";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import Swal from "sweetalert2";
import dayjs from "dayjs";

import ModalIngresoInventario from "./components/ModalIngresoInventario";
import ModalVerDetalleIngreso from "./components/ModalVerDetalleIngreso";
import { exportarExcel, exportarPDF } from "../Productos/components/utils/exportaciones";
import PremiumButton from "../../../components/ui/PremiumButton";
import PageHeader from "../../../components/ui/PageHeader";
import { apiClient } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, modalFieldSx, tableSx, semanticIconButtonSx } from "../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    success: "#16a34a",
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

export default function EntradasInventario() {
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [data, setData] = useState([]);
    const [productos, setProductos] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [search, setSearch] = useState("");
    const [filtroSede, setFiltroSede] = useState("0");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [openModal, setOpenModal] = useState(false);
    const [detalleGrupo, setDetalleGrupo] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resMov, resProd, resSedes, resProv] = await Promise.all([
                apiClient.get("/inventario/movimientos", { params: { tipo_movimiento: "ENTRADA", limit: 300 } }),
                apiClient.get("/inventario/productos"),
                apiClient.get("/inventario/sedes"),
                apiClient.get("/inventario/proveedores"),
            ]);

            setData(Array.isArray(resMov.data) ? resMov.data.filter((m) => m.tipo_movimiento === "ENTRADA") : []);
            setProductos(Array.isArray(resProd.data) ? resProd.data : []);
            setSedes(Array.isArray(resSedes.data) ? resSedes.data : []);
            setProveedores(Array.isArray(resProv.data) ? resProv.data : []);
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "No se pudo cargar el historial de ingresos.",
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

    const groupedData = useMemo(() => {
        const groups = {};
        (data || []).forEach(item => {
            const timeKey = dayjs(item.created_at).format("YYYY-MM-DD HH:mm");
            const key = `${item.sede_id}_${item.observacion || 'sin_obs'}_${timeKey}`;
            
            if (!groups[key]) {
                const obs = item.observacion || "";
                const provMatch = obs.match(/Prov\/Origen:\s([^|]+)/);
                const docMatch = obs.match(/Doc:\s([^|]+)/);
                const totalMatch = obs.match(/Total:\s\$([\d,.]+)/);
                
                let extraObs = "";
                const obsSplit = obs.split(" | ");
                if (obsSplit.length >= 3) {
                    const possibleObs = obsSplit[2];
                    if (!possibleObs.startsWith("Subtotal:")) {
                        extraObs = possibleObs;
                    }
                }
                
                groups[key] = {
                    id: key,
                    sede_nombre: item.sede_nombre,
                    sede_id: item.sede_id,
                    created_at: item.created_at,
                    proveedor: provMatch ? provMatch[1].trim() : "N/A",
                    documento: docMatch ? docMatch[1].trim() : "-",
                    total_estimado: totalMatch ? totalMatch[1].trim() : "0.00",
                    observacion_extra: extraObs,
                    items: [],
                    search_text: obs.toLowerCase(),
                };
            }
            groups[key].items.push(item);
        });
        
        return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [data]);

    const filtered = useMemo(() => {
        const lower = search.trim().toLowerCase();
        return groupedData.filter((group) => {
            const matchesSearch = !lower || 
                group.search_text.includes(lower) ||
                group.proveedor.toLowerCase().includes(lower) ||
                group.documento.toLowerCase().includes(lower) ||
                group.items.some(i => 
                    (i.producto_nombre || "").toLowerCase().includes(lower) || 
                    (i.producto_codigo || "").toLowerCase().includes(lower) ||
                    (i.codigo_lote || "").toLowerCase().includes(lower)
                );

            const matchesSede = filtroSede === "0" || String(group.sede_id) === filtroSede;
            const itemDate = dayjs(group.created_at).format("YYYY-MM-DD");
            const matchesDesde = !fechaDesde || itemDate >= fechaDesde;
            const matchesHasta = !fechaHasta || itemDate <= fechaHasta;

            return matchesSearch && matchesSede && matchesDesde && matchesHasta;
        });
    }, [groupedData, search, filtroSede, fechaDesde, fechaHasta]);

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

    const handleSubmit = async (payload) => {
        setLoadingSubmit(true);
        try {
            for (const item of payload.items || []) {
                await apiClient.post("/inventario/movimientos/entrada", item);
            }
            Swal.fire({
                title: "Exito",
                text: "Ingreso registrado correctamente.",
                icon: "success",
                confirmButtonColor: ui.black,
            });
            setOpenModal(false);
            fetchData();
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error?.response?.data?.message || "No se pudo registrar el ingreso.",
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

    const exportRows = filtered.map((group) => ({
        id: group.id,
        fecha: dayjs(group.created_at).format("DD/MM/YYYY HH:mm"),
        sede: group.sede_nombre || "",
        proveedor: group.proveedor || "",
        documento: group.documento || "",
        cantidad_insumos: group.items.length,
        total_estimado: group.total_estimado,
        observacion: group.observacion_extra || "",
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
                        <PageHeader
                            title="Ingresos de inventario"
                            icon={<InputIcon sx={{ color: "#fff", fontSize: 26 }} />}
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
                                    <Select
                                        value={filtroSede}
                                        onChange={(e) => setFiltroSede(e.target.value)}
                                        size="small"
                                        sx={{ ...filterInputSx, width: 180 }}
                                        startAdornment={<FilterListIcon sx={{ color: ui.muted, mr: 1, fontSize: 18 }} />}
                                    >
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
                                    <PremiumButton variant="excel" onClick={() => exportarExcel(exportRows, "entradas-inventario")}>
                                        EXCEL
                                    </PremiumButton>
                                    <PremiumButton variant="pdf" onClick={() => exportarPDF(exportRows, [], "Ingresos Inventario")}>
                                        PDF
                                    </PremiumButton>
                                    <PremiumButton variant="anadir" onClick={() => setOpenModal(true)}>
                                        Añadir
                                    </PremiumButton>
                                </Stack>
                            </Box>

                            <Box sx={{ px: 4, pb: 4 }}>
                                <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 380px)", minHeight: 320, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <Table sx={{ ...tableSx, minWidth: 900 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Fecha</TableCell>
                                                <TableCell>Sede</TableCell>
                                                <TableCell>Documento</TableCell>
                                                <TableCell>Proveedor / Origen</TableCell>
                                                <TableCell align="center">Insumos</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="center">Acción</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableSkeleton />
                                            ) : paginated.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                                        <Box sx={{ textAlign: "center", opacity: 0.78 }}>
                                                            <InputIcon sx={{ fontSize: 58, color: ui.muted, mb: 1.5 }} />
                                                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.black, fontSize: 16, mb: 0.5 }}>
                                                                No hay comprobantes de ingreso
                                                            </Typography>
                                                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12 }}>
                                                                Registra facturas, donaciones o ingresos iniciales para ver el historial.
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginated.map((row) => (
                                                    <TableRow key={row.id} hover sx={{ transition: "background-color 0.2s ease" }}>
                                                        <TableCell>
                                                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: ui.black }}>
                                                                {dayjs(row.created_at).format("DD/MM/YYYY")}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 11, color: ui.muted }}>
                                                                {dayjs(row.created_at).format("HH:mm")}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 13, fontWeight: 500, color: ui.text }}>{row.sede_nombre}</TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: ui.black }}>
                                                                {row.documento}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 13 }}>{row.proveedor}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip 
                                                                label={`${row.items.length} ítems`} 
                                                                size="small" 
                                                                sx={semanticChipSx("neutral")} 
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: ui.success }}>
                                                                ${row.total_estimado}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="Ver Detalle">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setDetalleGrupo(row)}
                                                                    sx={semanticIconButtonSx("neutral")}
                                                                >
                                                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
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

            {openModal && (
                <ModalIngresoInventario open={openModal} onClose={() => setOpenModal(false)} productos={productos} sedes={sedes} proveedores={proveedores} onSubmit={handleSubmit} loading={loadingSubmit} />
            )}

            {detalleGrupo && (
                <ModalVerDetalleIngreso open={Boolean(detalleGrupo)} onClose={() => setDetalleGrupo(null)} grupo={detalleGrupo} />
            )}
        </Box>
    );
}
