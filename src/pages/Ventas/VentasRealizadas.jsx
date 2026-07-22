import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    Box,
    Chip,
    InputAdornment,
    Paper,
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
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Swal from "sweetalert2";

import { useAuth } from "../../context/AuthContext";
import PremiumButton from "../../components/ui/PremiumButton";
import { apiClient } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../../modules/personas/personas.utils";
import ModalComprobante from "./components/ModalComprobante";

dayjs.locale("es");

const formatMoney = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

const listVentasRealizadas = async (sedeId, buscar = "") => {
    const { data } = await apiClient.get("/gimnasio/ventas", {
        headers: { "X-Sede-Id": sedeId },
        params: { buscar: buscar.trim() || undefined },
    });
    return data;
};

export default function VentasRealizadas() {
    const { user } = useAuth();
    const sedeId = user?.sede_id || 1;
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [comprobanteOpen, setComprobanteOpen] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

    const handleOpenComprobante = (venta) => {
        setVentaSeleccionada(venta);
        setComprobanteOpen(true);
    };

    const handleCloseComprobante = () => {
        setComprobanteOpen(false);
        setVentaSeleccionada(null);
    };

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                setLoading(true);
                const data = await listVentasRealizadas(sedeId, searchTerm);
                setVentas(Array.isArray(data) ? data : []);
            } catch {
                Swal.fire("Error", "No se pudieron cargar las ventas realizadas.", "error");
                setVentas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVentas();
    }, [sedeId, searchTerm]);

    const filteredVentas = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return ventas.filter((venta) => {
            if (!term) return true;

            return [
                venta.id,
                venta.cliente_id,
                venta.vendedor_id,
                venta.referencia,
                venta.forma_pago,
                venta.cliente_cedula,
                venta.cliente_nombre,
                venta.vendedor_cedula,
                venta.vendedor_nombre,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term);
        });
    }, [ventas, searchTerm]);

    const resumen = useMemo(() => {
        return filteredVentas.reduce((acc, venta) => {
            acc.total += Number(venta.total || 0);
            acc.registros += 1;
            if (String(venta.estado_pago || "").toUpperCase() === "PAGADO") acc.pagadas += 1;
            else acc.porCobrar += 1;
            return acc;
        }, { total: 0, registros: 0, pagadas: 0, porCobrar: 0 });
    }, [filteredVentas]);

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                        Ventas Realizadas
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Consulta el historial comercial del punto de venta y da seguimiento a cada operación registrada.
                    </Typography>
                </Box>

                <TextField
                    size="small"
                    placeholder="Buscar por cédula, cliente, venta, pago..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ ...filterInputSx, minWidth: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Ventas</Typography>
                            <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.registros}</Typography>
                        </Box>
                        <ShoppingBagOutlinedIcon sx={{ color: "#e0a100" }} />
                    </Stack>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Pagadas</Typography>
                            <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.pagadas}</Typography>
                        </Box>
                        <PointOfSaleOutlinedIcon sx={{ color: "#2e7d32" }} />
                    </Stack>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Por cobrar</Typography>
                            <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.porCobrar}</Typography>
                        </Box>
                        <ReceiptLongOutlinedIcon sx={{ color: "#dc2626" }} />
                    </Stack>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Total vendido</Typography>
                            <Typography sx={{ fontSize: 24, fontWeight: 950, color: "#0f172a" }}>{formatMoney(resumen.total)}</Typography>
                        </Box>
                        <LocalAtmOutlinedIcon sx={{ color: "#0f172a" }} />
                    </Stack>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Historial de ventas</Typography>
                        <Typography sx={{ mt: 0.3, fontSize: 12, color: "#64748b" }}>
                            Operaciones registradas para la sede activa del usuario.
                        </Typography>
                    </Box>
                    <Chip label={`${filteredVentas.length} registros`} sx={semanticChipSx("mustard")} />
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID Venta</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Cliente / Vendedor</TableCell>
                                <TableCell>Pago</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        Cargando historial de ventas...
                                    </TableCell>
                                </TableRow>
                            ) : filteredVentas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No se encontraron ventas registradas.
                                    </TableCell>
                                </TableRow>
                            ) : filteredVentas.map((venta) => (
                                <TableRow key={venta.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>#{String(venta.id).padStart(5, "0")}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                            {venta.referencia || "Sin referencia"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{venta.fecha ? dayjs(venta.fecha).format("DD MMM YYYY, HH:mm") : "Sin fecha"}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                            {venta.cliente_nombre?.trim() || "Consumidor final"}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                            {venta.cliente_cedula || "Sin cédula"} · Vendedor: {venta.vendedor_nombre?.trim() || "Desconocido"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{String(venta.estado_pago || "").toUpperCase() === "PENDIENTE" ? "Por pagar" : (venta.forma_pago || "No definido")}</TableCell>
                                    <TableCell align="right">{formatMoney(venta.total)}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={String(venta.estado_pago || "").toUpperCase() === "PENDIENTE" ? "Por pagar" : "Pagada"}
                                            sx={semanticChipSx(String(venta.estado_pago || "").toUpperCase() === "PENDIENTE" ? "mustard" : "success")}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <PremiumButton
                                            variant="outline"
                                            onClick={() => handleOpenComprobante(venta)}
                                            sx={{ height: 30, px: 1.5 }}
                                        >
                                            <PrintOutlinedIcon sx={{ fontSize: 16, mr: 0.6 }} />
                                            Imprimir
                                        </PremiumButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalComprobante
                open={comprobanteOpen}
                onClose={handleCloseComprobante}
                venta={ventaSeleccionada}
            />
        </Stack>
    );
}
