import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../../modules/personas/personas.utils";

const formatMoney = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

const estadoPagoLabel = (venta) => {
    const estado = String(venta?.estado_pago || venta?.estado || "").toUpperCase();
    if (estado === "PENDIENTE") return "Por pagar";
    if (estado === "ABONADO") return "Abonada";
    return "Pagada";
};

const formatNumber = (value) =>
    new Intl.NumberFormat("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const listSedesVenta = async () => {
    const { data } = await apiClient.get("/inventario/sedes");
    return Array.isArray(data) ? data : [];
};

const getCierreCaja = async ({ sedeId, fecha, buscar, buscarTipo }) => {
    const { data } = await apiClient.get("/gimnasio/ventas/cierre-caja", {
        params: {
            ...(sedeId ? { sede_id: sedeId } : {}),
            ...(fecha ? { fecha } : {}),
            ...(buscar ? { buscar } : {}),
            ...(buscarTipo ? { buscar_tipo: buscarTipo } : {}),
        },
    });

    return data;
};

export default function CierreCaja() {
    const { user } = useAuth();
    const sedeId = user?.sede_id || 1;
    const isAdmin = useMemo(() => {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        return roles.some((rol) => {
            const codigo = String(rol?.codigo || "").toUpperCase();
            const nombre = String(rol?.nombre || "").toUpperCase();
            return codigo === "ADMINISTRADOR" || nombre === "ADMINISTRADOR";
        });
    }, [user]);
    const isCashier = useMemo(() => {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        return roles.some((rol) => {
            const codigo = String(rol?.codigo || "").toUpperCase();
            const nombre = String(rol?.nombre || "").toUpperCase();
            return codigo === "CAJERO" || nombre === "CAJERO";
        });
    }, [user]);
    const [fecha, setFecha] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("todos");
    const [sedes, setSedes] = useState([]);
    const [sedeFiltro, setSedeFiltro] = useState("TODAS");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let ignore = false;

        const loadSedes = async () => {
            try {
                const rows = await listSedesVenta();
                const allowed = Array.isArray(user?.sedes) && user.sedes.length
                    ? rows.filter((sede) => user.sedes.some((permitida) => String(permitida.id) === String(sede.id)))
                    : rows;
                if (!ignore) setSedes(Array.isArray(allowed) ? allowed : []);
            } catch {
                if (!ignore) setSedes([]);
            }
        };

        loadSedes();

        return () => {
            ignore = true;
        };
    }, [user?.sedes]);

    useEffect(() => {
        setSedeFiltro("TODAS");
    }, [isAdmin, isCashier, sedeId]);

    useEffect(() => {
        setPage(1);
    }, [fecha, searchTerm, searchType, sedeFiltro]);

    const sedeConsulta = useMemo(() => {
        if (sedeFiltro === "TODAS") return null;
        return Number(sedeFiltro || sedeId);
    }, [sedeFiltro, sedeId]);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await getCierreCaja({
                    sedeId: sedeConsulta,
                    fecha: fecha || null,
                    buscar: searchTerm.trim(),
                    buscarTipo: searchType,
                });
                if (!ignore) {
                    setData(response);
                    if (!fecha && response?.fecha) {
                        setFecha(response.fecha);
                    }
                }
            } catch {
                if (!ignore) {
                    Swal.fire("Error", "No se pudo cargar el cierre de caja.", "error");
                    setData(null);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        load();

        return () => {
            ignore = true;
        };
    }, [fecha, searchTerm, searchType, sedeConsulta]);

    const resumen = data?.resumen || {};
    const detalleCierre = Array.isArray(data?.detalle_cierre) ? data.detalle_cierre : [];
    const totalesCierre = data?.totales_cierre || {};
    const rowsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(detalleCierre.length / rowsPerPage));
    const rowsPaginadas = useMemo(() => {
        const start = (Math.min(page, totalPages) - 1) * rowsPerPage;
        return detalleCierre.slice(start, start + rowsPerPage);
    }, [detalleCierre, page, totalPages]);
    const sedeNombre = useMemo(() => {
        if (sedeFiltro === "TODAS") return isCashier && !isAdmin ? "Mi caja" : "Todas las sedes";
        return sedes.find((sede) => String(sede.id) === String(sedeFiltro))?.nombre || "Sede seleccionada";
    }, [isAdmin, isCashier, sedeFiltro, sedes]);

    const exportarPDF = () => {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const fechaLabel = data?.fecha || fecha || "";

        doc.setFontSize(14);
        doc.text("Cierre de Caja", 14, 14);
        doc.setFontSize(9);
        doc.text(`Fecha: ${fechaLabel}`, 14, 21);
        doc.text(`Sede: ${sedeNombre}`, 70, 21);
        doc.text(`Usuario: ${user?.nombre || user?.name || "Usuario"}`, 140, 21);

        autoTable(doc, {
            startY: 28,
            head: [["Factura", "Cliente", "Detalle", "Forma", "Estado", "Total", "Cobrado", "Saldo"]],
            body: [
                ...detalleCierre.map((venta) => [
                    venta.factura || `#${venta.venta_id}`,
                    venta.cliente || "Consumidor final",
                    venta.detalle || "Venta POS",
                    venta.forma_pago || "PENDIENTE",
                    venta.estado_label || estadoPagoLabel(venta),
                    formatMoney(venta.total),
                    formatMoney(venta.cobrado),
                    formatMoney(venta.saldo),
                ]),
                [
                    "TOTAL",
                    "",
                    "",
                    "",
                    `${totalesCierre.ventas || 0} ventas`,
                    formatMoney(totalesCierre.total),
                    formatMoney(totalesCierre.cobrado),
                    formatMoney(totalesCierre.saldo),
                ],
            ],
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
            footStyles: { fillColor: [245, 158, 11], textColor: 20, fontStyle: "bold" },
            columnStyles: {
                0: { cellWidth: 36 },
                1: { cellWidth: 42 },
                2: { cellWidth: 80 },
                3: { cellWidth: 24 },
                4: { cellWidth: 24 },
                5: { halign: "right" },
                6: { halign: "right" },
                7: { halign: "right" },
            },
            didParseCell: (hookData) => {
                const isTotal = hookData.row.raw?.[0] === "TOTAL";
                if (isTotal) {
                    hookData.cell.styles.fillColor = [255, 248, 230];
                    hookData.cell.styles.fontStyle = "bold";
                }
            },
        });

        doc.save(`cierre-caja-${fechaLabel || "dia"}.pdf`);
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                        Cierre de Caja
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Revisa los movimientos de caja, cobros y saldos pendientes.
                    </Typography>
                </Box>

                <Stack spacing={1} alignItems={{ xs: "stretch", md: "flex-end" }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                            type="date"
                            size="small"
                            value={fecha}
                            onChange={(event) => setFecha(event.target.value)}
                            sx={{ ...filterInputSx, minWidth: 220 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                    {isCashier && !isAdmin ? (
                        <Chip label={sedeFiltro === "TODAS" ? "Mi caja" : "Mi caja filtrada por sede"} sx={semanticChipSx("mustard")} size="small" />
                    ) : null}
                    {(isAdmin || isCashier) ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                            <Chip
                                label={isCashier && !isAdmin ? "Mi caja" : "Todas"}
                                clickable
                                color={sedeFiltro === "TODAS" ? "warning" : "default"}
                                onClick={() => setSedeFiltro("TODAS")}
                                size="small"
                            />
                            {sedes.map((sede) => (
                                <Chip
                                    key={sede.id}
                                    label={sede.nombre}
                                    clickable
                                    color={String(sedeFiltro) === String(sede.id) ? "warning" : "default"}
                                    onClick={() => setSedeFiltro(String(sede.id))}
                                    size="small"
                                />
                            ))}
                        </Stack>
                    ) : null}
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }} gap={2} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={`Ventas: ${totalesCierre.ventas || resumen.ventas_dia || 0}`} sx={semanticChipSx("mustard")} />
                        <Chip label={`Total vendido: ${formatMoney(totalesCierre.total ?? resumen.total_consumido_dia)}`} sx={semanticChipSx("neutral")} />
                        <Chip label={`Cobrado: ${formatMoney(totalesCierre.cobrado ?? resumen.cobrado_en_caja)}`} sx={semanticChipSx("success")} />
                        <Chip label={`Por cobrar: ${formatMoney(totalesCierre.saldo ?? resumen.por_cobrar_del_dia)}`} sx={semanticChipSx("danger")} />
                    </Stack>
                    <PremiumButton variant="pdf" onClick={exportarPDF} disabled={loading || !detalleCierre.length} sx={{ minHeight: 38, minWidth: 92 }}>
                        PDF
                    </PremiumButton>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5} sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                        {sedeNombre} · {data?.fecha || fecha || "Fecha de negocio"}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            select
                            size="small"
                            value={searchType}
                            onChange={(event) => setSearchType(event.target.value)}
                            sx={{ ...filterInputSx, minWidth: 150 }}
                        >
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="factura">Factura</MenuItem>
                            <MenuItem value="cliente">Cliente</MenuItem>
                            <MenuItem value="detalle">Detalle</MenuItem>
                        </TextField>
                        <TextField
                            size="small"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            sx={{ ...filterInputSx, minWidth: 260 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Factura</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Detalle</TableCell>
                                <TableCell>Forma</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Cobrado</TableCell>
                                <TableCell align="right">Saldo</TableCell>
                                <TableCell align="center">Estado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>Cargando cierre...</TableCell></TableRow>
                            ) : rowsPaginadas.length ? rowsPaginadas.map((venta) => (
                                <TableRow key={venta.venta_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 900, fontSize: 12 }}>{venta.factura || `#${venta.venta_id}`}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{venta.fecha_consumo}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{venta.cliente || "Consumidor final"}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{venta.cedula || "Sin cédula"}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 320 }}>
                                        <Stack spacing={0.4}>
                                            {(Array.isArray(venta.detalle_items) && venta.detalle_items.length ? venta.detalle_items : []).map((item, index) => (
                                                <Stack key={`${venta.venta_id}-${item.nombre}-${index}`} direction="row" spacing={1} justifyContent="space-between" sx={{ borderBottom: "1px dashed #e2e8f0", pb: 0.35 }}>
                                                    <Typography sx={{ fontSize: 11.5, color: "#0f172a", fontWeight: 700 }}>
                                                        {item.nombre}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                                                        {formatNumber(item.cantidad)} x {formatMoney(item.precio_unitario)} = {formatMoney(item.subtotal)}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                            {(!Array.isArray(venta.detalle_items) || !venta.detalle_items.length) ? (
                                                <Typography sx={{ fontSize: 12, color: "#0f172a" }}>{venta.detalle || "Venta POS"}</Typography>
                                            ) : null}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{venta.forma_pago || "PENDIENTE"}</TableCell>
                                    <TableCell align="right">{formatMoney(venta.total)}</TableCell>
                                    <TableCell align="right">{formatMoney(venta.cobrado)}</TableCell>
                                    <TableCell align="right">{formatMoney(venta.saldo)}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={venta.estado_label || estadoPagoLabel(venta)}
                                            sx={semanticChipSx(String(venta.estado_pago).toUpperCase() === "PAGADO" ? "success" : "mustard")}
                                        />
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No hay ventas registradas en esta fecha.</TableCell></TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} sx={{ fontWeight: 950, color: "#0f172a" }}>TOTAL</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 950, color: "#0f172a" }}>{formatMoney(totalesCierre.total)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 950, color: "#0f172a" }}>{formatMoney(totalesCierre.cobrado)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 950, color: "#0f172a" }}>{formatMoney(totalesCierre.saldo)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 950, color: "#0f172a" }}>{totalesCierre.ventas || 0}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>

                {detalleCierre.length > rowsPerPage ? (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={Math.min(page, totalPages)}
                            onChange={(event, value) => setPage(value)}
                            showFirstButton
                            showLastButton
                            sx={{
                                "& .MuiPaginationItem-root": {
                                    fontSize: 12,
                                    fontWeight: 800,
                                    borderRadius: "8px",
                                    minWidth: 30,
                                    height: 30,
                                },
                                "& .Mui-selected": {
                                    bgcolor: "rgba(224, 161, 0, 0.14) !important",
                                    color: "#0f172a",
                                },
                            }}
                        />
                    </Stack>
                ) : null}
            </Paper>
        </Stack>
    );
}
