import { useEffect, useMemo, useState, forwardRef } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Slide,
    Stack,
    TextField,
    Typography,
    Chip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import InventoryIcon from "@mui/icons-material/Inventory";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DescriptionIcon from "@mui/icons-material/Description";
import PaidIcon from "@mui/icons-material/Paid";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import {
    modalPaperSx,
    modalTitleSx,
    modalContentSx,
    modalActionsSx,
    modalFieldSx,
    modalCancelButtonSx,
    modalPrimaryButtonSx,
} from "../../../../Styles/muiTheme";

const ui = {
    black: "#101010",
    mustard: "var(--tg-primary)",
    muted: "rgba(17, 17, 17, 0.66)",
    danger: "#dc2626",
};

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const motivosPorTipo = {
    entrada: [
        { value: "COMPRA", label: "Compra a proveedor" },
        { value: "INGRESO_INICIAL", label: "Ingreso de saldo inicial" },
        { value: "DEVOLUCION_CLIENTE", label: "Devolución de cliente" },
        { value: "PRODUCCION", label: "Producción propia" },
    ],
    salida: [
        { value: "VENTA", label: "Venta al público" },
        { value: "CONSUMO_INTERNO", label: "Consumo interno / uso" },
        { value: "MERMA", label: "Merma / desperdicio" },
        { value: "DONACION", label: "Donación / cortesía" },
    ],
    ajuste: [
        { value: "AJUSTE_POSITIVO", label: "Ajuste por inventario (+)" },
        { value: "AJUSTE_NEGATIVO", label: "Ajuste por inventario (-)" },
    ],
    baja: [
        { value: "BAJA", label: "Baja por daño / rotura" },
        { value: "VENCIMIENTO", label: "Baja por vencimiento" },
        { value: "PERDIDA", label: "Baja por pérdida / robo" },
    ],
};

const titulos = {
    entrada: "Registrar entrada de stock",
    salida: "Registrar salida de stock",
    ajuste: "Ajuste manual de inventario",
    baja: "Registrar baja de producto",
};

const defaultStateByType = (tipo, sedes = []) => ({
    producto_id: "",
    sede_id: sedes[0]?.id ? String(sedes[0].id) : "",
    lote_id: "",
    motivo: motivosPorTipo[tipo]?.[0]?.value ?? "",
    cantidad: "",
    costo_unitario: "",
    precio_unitario: "",
    referencia_tipo: "",
    referencia_id: "",
    observacion: "",
});

export default function ModalMovimientoInventario({
    open,
    onClose,
    type,
    productos = [],
    sedes = [],
    onSubmit,
    loading = false,
}) {
    const [form, setForm] = useState(defaultStateByType(type, sedes));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setForm(defaultStateByType(type, sedes));
            setErrors({});
        }
    }, [open, type, sedes]);

    const motivos = useMemo(() => motivosPorTipo[type] ?? [], [type]);
    const selectedProducto = useMemo(
        () => productos.find((item) => String(item.id) === String(form.producto_id)) || null,
        [productos, form.producto_id]
    );

    const lotesDisponibles = useMemo(() => {
        if (!selectedProducto?.lotes?.length) return [];
        return selectedProducto.lotes.filter((lote) => {
            if (!form.sede_id) return true;
            return String(lote.sede_id) === String(form.sede_id);
        });
    }, [selectedProducto, form.sede_id]);

    const stockSede = useMemo(() => {
        if (!selectedProducto?.stocks?.length || !form.sede_id) return null;
        return selectedProducto.stocks.find((item) => String(item.sede_id) === String(form.sede_id)) || null;
    }, [selectedProducto, form.sede_id]);

    const selectedLote = useMemo(() => {
        return lotesDisponibles.find((item) => String(item.id) === String(form.lote_id)) || null;
    }, [lotesDisponibles, form.lote_id]);

    const requiresLote = Boolean(selectedProducto?.maneja_lotes);
    const requiresVencimiento = Boolean(selectedProducto?.maneja_vencimiento);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "producto_id") next.lote_id = "";
            if (field === "sede_id") next.lote_id = "";
            return next;
        });
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = () => {
        const nextErrors = {};
        if (!form.producto_id) nextErrors.producto_id = "Seleccione un producto";
        if (!form.sede_id) nextErrors.sede_id = "Seleccione la sede";
        if (!form.motivo) nextErrors.motivo = "Seleccione el motivo";
        if (!form.cantidad || Number(form.cantidad) <= 0) nextErrors.cantidad = "Cantidad inválida";
        if (requiresLote && !form.lote_id) nextErrors.lote_id = "Seleccione un lote";
        if ((type === "ajuste" || type === "baja") && !String(form.observacion || "").trim()) {
            nextErrors.observacion = "La observación es obligatoria para este movimiento";
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form,
            producto_id: Number(form.producto_id),
            sede_id: Number(form.sede_id),
            lote_id: form.lote_id ? Number(form.lote_id) : null,
            cantidad: Number(form.cantidad),
            costo_unitario: form.costo_unitario !== "" ? Number(form.costo_unitario) : null,
            precio_unitario: form.precio_unitario !== "" ? Number(form.precio_unitario) : null,
            referencia_tipo: form.referencia_tipo || null,
            referencia_id: form.referencia_id ? Number(form.referencia_id) : null,
            observacion: String(form.observacion || "").trim(),
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" TransitionComponent={Transition} PaperProps={{ sx: modalPaperSx }}>
            <DialogTitle sx={modalTitleSx}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <SwapHorizIcon sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{titulos[type] || "Movimiento de inventario"}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.7)" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={modalContentSx}>
                <Stack spacing={3}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <InventoryIcon sx={{ fontSize: 18, color: ui.muted }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: ui.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Identificación y ubicación
                            </Typography>
                        </Stack>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={8}>
                                <FormControl fullWidth size="small" error={!!errors.producto_id}>
                                    <InputLabel>Producto</InputLabel>
                                    <Select label="Producto" value={form.producto_id} onChange={(e) => handleChange("producto_id", e.target.value)} sx={modalFieldSx}>
                                        {productos.map((item) => (
                                            <MenuItem key={item.id} value={String(item.id)}>
                                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{item.nombre}</Typography>
                                                <Typography variant="caption" sx={{ ml: 1, color: ui.muted }}>({item.codigo || "S/C"})</Typography>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.producto_id && <FormHelperText>{errors.producto_id}</FormHelperText>}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small" error={!!errors.sede_id}>
                                    <InputLabel>Sede / Almacén</InputLabel>
                                    <Select label="Sede / Almacén" value={form.sede_id} onChange={(e) => handleChange("sede_id", e.target.value)} sx={modalFieldSx}>
                                        {sedes.map((s) => (
                                            <MenuItem key={s.id} value={String(s.id)} sx={{ fontSize: 13 }}>{s.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.sede_id && <FormHelperText>{errors.sede_id}</FormHelperText>}
                                </FormControl>
                            </Grid>

                            {selectedProducto && (
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Chip label={`Stock actual: ${stockSede?.stock_actual ?? 0}`} size="small" />
                                        <Chip label={`Unidad: ${selectedProducto?.unidad_medida || "und"}`} size="small" />
                                        {requiresLote && <Chip label="Maneja lotes" size="small" color="warning" />}
                                        {requiresVencimiento && <Chip label="Controla vencimiento" size="small" color="warning" />}
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    <Divider />

                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <StorefrontIcon sx={{ fontSize: 18, color: ui.muted }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: ui.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Detalles del movimiento
                            </Typography>
                        </Stack>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small" error={!!errors.motivo}>
                                    <InputLabel>Motivo</InputLabel>
                                    <Select label="Motivo" value={form.motivo} onChange={(e) => handleChange("motivo", e.target.value)} sx={modalFieldSx}>
                                        {motivos.map((item) => (
                                            <MenuItem key={item.value} value={item.value} sx={{ fontSize: 13 }}>{item.label}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.motivo && <FormHelperText>{errors.motivo}</FormHelperText>}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Cantidad" size="small" fullWidth type="number" value={form.cantidad} onChange={(e) => handleChange("cantidad", e.target.value)} error={!!errors.cantidad} helperText={errors.cantidad} sx={modalFieldSx} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small" error={!!errors.lote_id} disabled={!requiresLote}>
                                    <InputLabel>Lote</InputLabel>
                                    <Select label="Lote" value={form.lote_id} onChange={(e) => handleChange("lote_id", e.target.value)} sx={modalFieldSx}>
                                        {!requiresLote && <MenuItem value="">No aplica</MenuItem>}
                                        {lotesDisponibles.map((item) => (
                                            <MenuItem key={item.id} value={String(item.id)}>
                                                {item.codigo_lote} - stock {item.stock_actual}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.lote_id && <FormHelperText>{errors.lote_id}</FormHelperText>}
                                </FormControl>
                            </Grid>

                            {requiresLote && !lotesDisponibles.length && (
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: ui.danger }}>
                                        <WarningAmberOutlinedIcon fontSize="small" />
                                        <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>
                                            Este producto maneja lotes y no tiene lotes disponibles en la sede seleccionada.
                                        </Typography>
                                    </Stack>
                                </Grid>
                            )}

                            {selectedLote?.fecha_vencimiento && (
                                <Grid item xs={12}>
                                    <Chip label={`Vence: ${String(selectedLote.fecha_vencimiento).slice(0, 10)}`} size="small" color="warning" />
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    <Divider />

                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <PaidIcon sx={{ fontSize: 18, color: ui.muted }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: ui.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Valores y referencias
                            </Typography>
                        </Stack>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={3}>
                                <TextField label="Costo unit." size="small" fullWidth type="number" value={form.costo_unitario} onChange={(e) => handleChange("costo_unitario", e.target.value)} sx={modalFieldSx} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Precio unit." size="small" fullWidth type="number" value={form.precio_unitario} onChange={(e) => handleChange("precio_unitario", e.target.value)} sx={modalFieldSx} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="Tipo ref." size="small" fullWidth value={form.referencia_tipo} onChange={(e) => handleChange("referencia_tipo", e.target.value)} placeholder="Ej: Factura" sx={modalFieldSx} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField label="ID ref." size="small" fullWidth value={form.referencia_id} onChange={(e) => handleChange("referencia_id", e.target.value)} sx={modalFieldSx} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <DescriptionIcon sx={{ fontSize: 18, color: ui.muted }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: ui.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Observaciones
                            </Typography>
                        </Stack>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            placeholder="Describa el motivo o detalles adicionales del movimiento..."
                            value={form.observacion}
                            onChange={(e) => handleChange("observacion", e.target.value)}
                            error={!!errors.observacion}
                            helperText={errors.observacion}
                            sx={modalFieldSx}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={modalActionsSx}>
                <Button onClick={onClose} sx={modalCancelButtonSx}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={loading} variant="contained" startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />} sx={modalPrimaryButtonSx}>
                    {loading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
