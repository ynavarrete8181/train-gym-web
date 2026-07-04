import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Box,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    InputAdornment,
    MenuItem,
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
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import { useAuth } from "../../context/AuthContext";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../../modules/personas/personas.utils";

const formatMoney = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

const formatQty = (value) =>
    new Intl.NumberFormat("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const emptyForm = {
    tipo: "DEVOLUCION",
    motivo: "",
    observacion: "",
    reintegra_stock: true,
};

const buscarVentasParaDevolucion = async ({ termino, sedeId } = {}) => {
    const { data } = await apiClient.get("/gimnasio/ventas/devoluciones/buscar", {
        params: {
            ...(termino ? { termino } : {}),
            ...(sedeId ? { sede_id: sedeId } : {}),
        },
    });

    return Array.isArray(data?.data) ? data.data : [];
};

const listHistorialDevoluciones = async ({ termino, sedeId } = {}) => {
    const { data } = await apiClient.get("/gimnasio/ventas/devoluciones", {
        params: {
            ...(termino ? { termino } : {}),
            ...(sedeId ? { sede_id: sedeId } : {}),
        },
    });

    return Array.isArray(data?.data) ? data.data : [];
};

const registrarDevolucionVenta = async (payload) => {
    const { data } = await apiClient.post("/gimnasio/ventas/devoluciones", payload);
    return data?.data ?? data;
};

export default function DevolucionesVentas() {
    const { user } = useAuth();
    const sedeId = user?.sede_id || 1;
    const [searchTerm, setSearchTerm] = useState("");
    const [ventas, setVentas] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [cantidades, setCantidades] = useState({});
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadHistorial = async () => {
        try {
            const rows = await listHistorialDevoluciones({ sedeId });
            setHistorial(rows);
        } catch {
            setHistorial([]);
        }
    };

    useEffect(() => {
        loadHistorial();
    }, [sedeId]);

    const buscarVentas = async () => {
        try {
            setLoading(true);
            const rows = await buscarVentasParaDevolucion({ termino: searchTerm.trim(), sedeId });
            setVentas(rows);
            if (rows.length === 1) {
                seleccionarVenta(rows[0]);
            }
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo buscar la venta origen."), "error");
            setVentas([]);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarVenta = (venta) => {
        setVentaSeleccionada(venta);
        setForm(emptyForm);
        setCantidades({});
    };

    const detallesDisponibles = useMemo(() => {
        return Array.isArray(ventaSeleccionada?.detalles)
            ? ventaSeleccionada.detalles.filter((detalle) => Number(detalle.cantidad_disponible || 0) > 0)
            : [];
    }, [ventaSeleccionada]);

    const resumenSeleccion = useMemo(() => {
        return detallesDisponibles.reduce((acc, detalle) => {
            const cantidad = Number(cantidades[detalle.id] || 0);
            const subtotal = cantidad * Number(detalle.precio_unitario || 0);
            if (cantidad > 0) {
                acc.items += 1;
                acc.cantidad += cantidad;
                acc.total += subtotal;
            }
            return acc;
        }, { items: 0, cantidad: 0, total: 0 });
    }, [cantidades, detallesDisponibles]);

    const setCantidadDetalle = (detalle, value) => {
        const max = Number(detalle.cantidad_disponible || 0);
        const parsed = Math.max(0, Math.min(Number(value || 0), max));

        setCantidades((prev) => ({
            ...prev,
            [detalle.id]: parsed,
        }));
    };

    const devolverTodo = () => {
        const next = {};
        detallesDisponibles.forEach((detalle) => {
            next[detalle.id] = Number(detalle.cantidad_disponible || 0);
        });
        setCantidades(next);
    };

    const limpiar = () => {
        setCantidades({});
        setForm(emptyForm);
    };

    const registrar = async () => {
        if (!ventaSeleccionada) {
            Swal.fire("Venta requerida", "Busca y selecciona una venta origen.", "warning");
            return;
        }

        if (!form.motivo.trim()) {
            Swal.fire("Motivo requerido", "Indica el motivo operativo de la devolución o anulación.", "warning");
            return;
        }

        const detalles = detallesDisponibles
            .map((detalle) => ({
                venta_detalle_id: detalle.id,
                cantidad: Number(cantidades[detalle.id] || 0),
            }))
            .filter((detalle) => detalle.cantidad > 0);

        if (form.tipo === "DEVOLUCION" && detalles.length === 0) {
            Swal.fire("Sin detalles", "Selecciona al menos una cantidad a devolver.", "warning");
            return;
        }

        const confirm = await Swal.fire({
            title: form.tipo === "ANULACION" ? "Anular venta" : "Registrar devolución",
            text: form.tipo === "ANULACION"
                ? "Se devolverá todo el saldo disponible de la venta seleccionada."
                : "Se registrará el reverso parcial con la trazabilidad correspondiente.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        try {
            setSaving(true);
            const response = await registrarDevolucionVenta({
                venta_id: ventaSeleccionada.id,
                tipo: form.tipo,
                motivo: form.motivo.trim(),
                observacion: form.observacion.trim(),
                reintegra_stock: form.reintegra_stock,
                detalles,
            });

            Swal.fire("Listo", form.tipo === "ANULACION" ? "Venta anulada correctamente." : "Devolución registrada correctamente.", "success");
            setVentaSeleccionada(response?.venta || null);
            setCantidades({});
            setForm(emptyForm);
            await Promise.all([buscarVentas(), loadHistorial()]);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo registrar el reverso."), "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                            Devoluciones y Anulaciones
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                            Busca la venta origen, selecciona cantidades y registra reversos con stock y auditoría.
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <TextField
                            size="small"
                            placeholder="Factura, cédula o cliente"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") buscarVentas();
                            }}
                            sx={{ ...filterInputSx, minWidth: { xs: "100%", sm: 320 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ManageSearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <PremiumButton variant="outline" loading={loading} onClick={buscarVentas}>
                            Buscar
                        </PremiumButton>
                    </Stack>
                </Stack>
            </Paper>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} alignItems="stretch">
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1.05 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Ventas encontradas</Typography>
                            <Typography sx={{ mt: 0.3, fontSize: 12, color: "#64748b" }}>
                                Selecciona la operación que será reversada.
                            </Typography>
                        </Box>
                        <Chip label={`${ventas.length} ventas`} sx={semanticChipSx("mustard")} />
                    </Stack>

                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", maxHeight: 360 }}>
                        <Table size="small" stickyHeader sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Venta</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell align="right">Disponible</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 5, color: "#64748b" }}>
                                            Busca una venta para iniciar.
                                        </TableCell>
                                    </TableRow>
                                ) : ventas.map((venta) => (
                                    <TableRow
                                        key={venta.id}
                                        hover
                                        selected={String(ventaSeleccionada?.id) === String(venta.id)}
                                        onClick={() => seleccionarVenta(venta)}
                                        sx={{ cursor: "pointer" }}
                                    >
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 900 }}>#{String(venta.id).padStart(5, "0")}</Typography>
                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{venta.referencia || "Sin referencia"}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 800 }}>{venta.cliente_nombre?.trim() || "Consumidor final"}</Typography>
                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{venta.cliente_cedula || venta.sede_nombre || "Sin identificación"}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatMoney(venta.monto_disponible)}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={venta.estado_devolucion || "SIN_DEVOLUCION"}
                                                sx={semanticChipSx(venta.estado_devolucion === "PARCIAL" ? "mustard" : "success")}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 0.95 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <ReceiptLongOutlinedIcon sx={{ color: "#0f172a" }} />
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Reverso</Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                {ventaSeleccionada ? `Venta #${String(ventaSeleccionada.id).padStart(5, "0")}` : "Sin venta seleccionada"}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack spacing={1.5}>
                        <TextField
                            select
                            size="small"
                            label="Tipo"
                            value={form.tipo}
                            onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
                            sx={filterInputSx}
                        >
                            <MenuItem value="DEVOLUCION">Devolución parcial</MenuItem>
                            <MenuItem value="ANULACION">Anulación total disponible</MenuItem>
                        </TextField>
                        <TextField
                            size="small"
                            label="Motivo"
                            value={form.motivo}
                            onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
                            sx={filterInputSx}
                        />
                        <TextField
                            size="small"
                            label="Observación"
                            value={form.observacion}
                            onChange={(event) => setForm((prev) => ({ ...prev, observacion: event.target.value }))}
                            sx={filterInputSx}
                            multiline
                            minRows={2}
                        />
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={form.reintegra_stock}
                                    onChange={(event) => setForm((prev) => ({ ...prev, reintegra_stock: event.target.checked }))}
                                />
                            )}
                            label="Reintegrar stock cuando el detalle sea producto"
                            sx={{ color: "#334155", "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 700 } }}
                        />

                        <Divider />

                        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>Total reverso</Typography>
                                <Typography sx={{ fontSize: 24, fontWeight: 950, color: "#0f172a" }}>{formatMoney(form.tipo === "ANULACION" ? ventaSeleccionada?.monto_disponible : resumenSeleccion.total)}</Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <PremiumButton variant="outline" onClick={devolverTodo} disabled={!ventaSeleccionada}>
                                    Todo
                                </PremiumButton>
                                <PremiumButton variant="outline" onClick={limpiar} disabled={!ventaSeleccionada}>
                                    Limpiar
                                </PremiumButton>
                            </Stack>
                        </Stack>

                        <PremiumButton
                            variant="guardar"
                            loading={saving}
                            disabled={!ventaSeleccionada || detallesDisponibles.length === 0}
                            onClick={registrar}
                            startIcon={form.tipo === "ANULACION" ? <BlockOutlinedIcon /> : <AssignmentReturnOutlinedIcon />}
                        >
                            {form.tipo === "ANULACION" ? "Anular venta" : "Registrar devolución"}
                        </PremiumButton>
                    </Stack>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Detalles disponibles</Typography>
                        <Typography sx={{ mt: 0.3, fontSize: 12, color: "#64748b" }}>
                            Las cantidades consideran devoluciones anteriores de la misma venta.
                        </Typography>
                    </Box>
                    <Chip
                        icon={<Inventory2OutlinedIcon sx={{ fontSize: 16 }} />}
                        label={`${detallesDisponibles.length} líneas`}
                        sx={semanticChipSx("inventory")}
                    />
                </Stack>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Detalle</TableCell>
                                <TableCell align="right">Vendido</TableCell>
                                <TableCell align="right">Devuelto</TableCell>
                                <TableCell align="right">Disponible</TableCell>
                                <TableCell align="right">Precio</TableCell>
                                <TableCell align="center">A devolver</TableCell>
                                <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!ventaSeleccionada ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        Selecciona una venta para ver sus detalles.
                                    </TableCell>
                                </TableRow>
                            ) : detallesDisponibles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        La venta no tiene saldo disponible para devolución.
                                    </TableCell>
                                </TableRow>
                            ) : detallesDisponibles.map((detalle) => {
                                const cantidad = Number(cantidades[detalle.id] || 0);
                                const subtotal = cantidad * Number(detalle.precio_unitario || 0);

                                return (
                                    <TableRow key={detalle.id}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 850 }}>{detalle.nombre}</Typography>
                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                                {detalle.tipo_detalle} {detalle.controla_stock ? "con stock" : "sin stock"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatQty(detalle.cantidad)}</TableCell>
                                        <TableCell align="right">{formatQty(detalle.cantidad_devuelta)}</TableCell>
                                        <TableCell align="right">{formatQty(detalle.cantidad_disponible)}</TableCell>
                                        <TableCell align="right">{formatMoney(detalle.precio_unitario)}</TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={cantidades[detalle.id] ?? ""}
                                                disabled={form.tipo === "ANULACION"}
                                                onChange={(event) => setCantidadDetalle(detalle, event.target.value)}
                                                inputProps={{ min: 0, max: Number(detalle.cantidad_disponible || 0), step: "0.01" }}
                                                sx={{ ...filterInputSx, width: 110 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{formatMoney(form.tipo === "ANULACION" ? detalle.monto_disponible : subtotal)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Historial reciente</Typography>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Venta</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Tipo / Motivo</TableCell>
                                <TableCell align="right">Monto</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historial.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#64748b" }}>
                                        Aún no hay devoluciones registradas.
                                    </TableCell>
                                </TableRow>
                            ) : historial.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.created_at ? dayjs(row.created_at).format("DD MMM YYYY HH:mm") : "Sin fecha"}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 850 }}>#{String(row.venta_id).padStart(5, "0")}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{row.venta_referencia || "Sin referencia"}</Typography>
                                    </TableCell>
                                    <TableCell>{row.cliente_nombre?.trim() || "Consumidor final"}</TableCell>
                                    <TableCell>
                                        <Chip label={row.tipo} sx={semanticChipSx(row.tipo === "ANULACION" ? "danger" : "inventory")} />
                                        <Typography sx={{ mt: 0.5, fontSize: 12, color: "#64748b" }}>{row.motivo}</Typography>
                                    </TableCell>
                                    <TableCell align="right">{formatMoney(row.monto_total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
}
