import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import InventoryIcon from "@mui/icons-material/Inventory";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AddModeratorOutlinedIcon from "@mui/icons-material/AddModeratorOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { apiClient, getApiErrorMessage, openModalSwal } from "../../../../services/apiClient";
import {
    modalPaperSx,
    modalTitleSx,
    modalContentSx,
    modalFieldSx,
    sectionPaperSx,
    metricCardSx,
    tableSx,
    tgAccent,
} from "../../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    mustard: tgAccent.mustard,
    mustardDark: tgAccent.mustardStrong,
    blueText: "#1d4d8f",
    danger: "#ef4444",
    success: "#2e7d32",
    border: "#e2e8f0",
    muted: "#64748b",
};

const framedSectionSx = {
    ...sectionPaperSx,
    p: 2.25,
    pt: 3,
    border: `1px solid ${ui.border}`,
    borderRadius: "10px",
    bgcolor: "#fff",
    position: "relative",
    overflow: "visible",
    width: "100%",
};

const framedLabelSx = {
    position: "absolute",
    top: -9,
    left: 16,
    px: 1,
    bgcolor: "#f8fafc",
    fontSize: "11px",
    fontWeight: 900,
    color: ui.blueText,
    lineHeight: 1.2,
};

const metricsGridSx = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, minmax(0, 1fr))",
        xl: "repeat(4, minmax(0, 1fr))",
    },
};

const ingresoGridSx = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
        xs: "1fr",
        md: "repeat(3, minmax(0, 1fr))",
    },
};

const inventarioGridSx = (manejaLotes) => ({
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
        xs: "1fr",
        md: manejaLotes ? "repeat(2, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
    },
});

const loteDesktopColumns = (manejaVencimiento) =>
    manejaVencimiento ? "1.35fr 1fr 1fr 0.9fr 56px" : "1.6fr 1fr 0.9fr 56px";

const createEmptyLote = () => ({
    codigo_lote: "",
    fecha_elaboracion: "",
    fecha_vencimiento: "",
    cantidad_inicial: "",
});

const initialForm = {
    sede_id: "",
    cantidad: "",
    stock_minimo: "0",
    ubicacion: "ALMACEN PRINCIPAL",
    costo_unitario: "",
    precio_unitario: "",
    observacion: "Registro inicial de inventario",
    lotes: [],
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

export default function ModalInventarioInicialProducto({
    open,
    onClose,
    productoId,
    sedes = [],
    onSaved,
}) {
    const [producto, setProducto] = useState(null);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editingStockId, setEditingStockId] = useState(null);

    const fetchData = async () => {
        if (!productoId) return;
        setLoading(true);
        try {
            const [prodRes, stockRes] = await Promise.all([
                apiClient.get(`/inventario/productos/${productoId}`),
                apiClient.get(`/inventario/productos/${productoId}/stock`),
            ]);

            const productoData = prodRes.data;
            setProducto(productoData);
            setStock(Array.isArray(stockRes.data) ? stockRes.data : []);
            setForm({
                ...initialForm,
                sede_id: productoData?.sede_principal_id ? String(productoData.sede_principal_id) : (sedes[0]?.id ? String(sedes[0].id) : ""),
                stock_minimo: String(productoData?.stock_minimo_sede ?? productoData?.stock_minimo ?? "0"),
                ubicacion: productoData?.ubicacion_principal || "ALMACEN PRINCIPAL",
                costo_unitario: productoData?.precio_costo ? String(productoData.precio_costo) : "",
                precio_unitario: productoData?.precio_venta ? String(productoData.precio_venta) : "",
                lotes: productoData?.maneja_lotes ? [createEmptyLote()] : [],
            });
            setEditingStockId(null);
        } catch (error) {
            console.error("Error al cargar stock:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchData();
    }, [open, productoId]);

    const totalLotes = useMemo(
        () => (form.lotes || []).reduce((acc, row) => acc + Number(row?.cantidad_inicial || 0), 0),
        [form.lotes]
    );

    const totalStockActual = useMemo(
        () => (stock || []).reduce((acc, row) => acc + Number(row?.cantidad || row?.stock_actual || 0), 0),
        [stock]
    );

    const bodegasConStock = useMemo(
        () => (stock || []).filter((row) => Number(row?.cantidad || row?.stock_actual || 0) > 0).length,
        [stock]
    );

    const proximoVencimiento = useMemo(() => {
        const fechas = (stock || [])
            .flatMap((row) => (Array.isArray(row?.lotes) ? row.lotes : []))
            .map((lote) => lote?.fecha_vencimiento)
            .filter(Boolean)
            .sort();

        return fechas[0] || null;
    }, [stock]);

    const tipoControl = useMemo(() => {
        if (producto?.maneja_lotes && producto?.maneja_vencimiento) {
            return "Por bodega y por lote con vencimiento";
        }
        if (producto?.maneja_lotes) {
            return "Por bodega y por lote";
        }
        return "Por bodega";
    }, [producto]);

    const totalLotesRegistrados = useMemo(() => {
        if (producto?.maneja_lotes) {
            return (stock || []).flatMap((row) => (Array.isArray(row?.lotes) ? row.lotes : [])).length;
        }
        return 0;
    }, [producto, stock]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleLoteChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            lotes: prev.lotes.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
        }));
    };

    const addLote = () => {
        setForm((prev) => ({ ...prev, lotes: [...(prev.lotes || []), createEmptyLote()] }));
    };

    const removeLote = (index) => {
        setForm((prev) => ({ ...prev, lotes: prev.lotes.filter((_, idx) => idx !== index) }));
    };

    const resetFormState = () => {
        setForm({
            ...initialForm,
            sede_id: producto?.sede_principal_id ? String(producto.sede_principal_id) : (sedes[0]?.id ? String(sedes[0].id) : ""),
            stock_minimo: String(producto?.stock_minimo_sede ?? producto?.stock_minimo ?? "0"),
            ubicacion: producto?.ubicacion_principal || "ALMACEN PRINCIPAL",
            costo_unitario: producto?.precio_costo ? String(producto.precio_costo) : "",
            precio_unitario: producto?.precio_venta ? String(producto.precio_venta) : "",
            lotes: producto?.maneja_lotes ? [createEmptyLote()] : [],
        });
        setEditingStockId(null);
    };

    const handleEditarStock = (row) => {
        if (!row?.inventario_inicial_editable) {
            openModalSwal({
                title: "No disponible",
                text: "Esta bodega ya tiene movimientos posteriores y no se puede editar desde aquí.",
                icon: "info",
                confirmButtonColor: ui.black,
            });
            return;
        }

        setForm({
            ...initialForm,
            sede_id: String(row.sede_id),
            cantidad: producto?.maneja_lotes ? "" : String(row.stock_inicial ?? row.cantidad ?? ""),
            stock_minimo: String(row.stock_minimo ?? 0),
            ubicacion: row.ubicacion || "ALMACEN PRINCIPAL",
            costo_unitario: producto?.precio_costo ? String(producto.precio_costo) : "",
            precio_unitario: producto?.precio_venta ? String(producto.precio_venta) : "",
            observacion: "Actualización de inventario inicial",
            lotes: producto?.maneja_lotes
                ? ((row.lotes || []).length > 0
                    ? row.lotes.map((lote) => ({
                        codigo_lote: lote.codigo_lote || "",
                        fecha_elaboracion: lote.fecha_elaboracion || "",
                        fecha_vencimiento: lote.fecha_vencimiento || "",
                        cantidad_inicial: String(lote.cantidad ?? ""),
                    }))
                    : [createEmptyLote()])
                : [],
        });
        setEditingStockId(row.id);
    };

    const handleVerLotes = async (row) => {
        if (!Array.isArray(row?.lotes) || row.lotes.length === 0) {
            openModalSwal({
                title: "Sin lotes",
                text: "Esta bodega no tiene lotes registrados para este producto.",
                icon: "info",
                confirmButtonColor: ui.black,
            });
            return;
        }

        const html = `
            <div style="display:grid;gap:10px;text-align:left;">
                ${row.lotes
                    .map(
                        (lote) => `
                            <div style="border:1px solid ${ui.border};border-radius:10px;padding:12px 14px;background:#fff;">
                                <div style="font-weight:800;color:${ui.black};margin-bottom:6px;">${escapeHtml(lote.codigo_lote)}</div>
                                <div style="font-size:12px;color:${ui.muted};display:grid;gap:4px;">
                                    <div>Elaboración: ${escapeHtml(lote.fecha_elaboracion || "-")}</div>
                                    <div>Vencimiento: ${escapeHtml(lote.fecha_vencimiento || "-")}</div>
                                    <div>Cantidad: ${escapeHtml(lote.cantidad)} ${escapeHtml(producto?.unidad_medida || "und")}</div>
                                </div>
                            </div>
                        `
                    )
                    .join("")}
            </div>
        `;

        await openModalSwal({
            title: `Lotes de ${row.sede_nombre}`,
            html,
            width: 680,
            confirmButtonText: "Cerrar",
            confirmButtonColor: ui.black,
        });
    };

    const handleEliminarStock = async (row) => {
        if (!row?.inventario_inicial_eliminable) {
            openModalSwal({
                title: "No disponible",
                text: "No se puede eliminar este registro. Tiene que hacer una baja manual.",
                icon: "info",
                confirmButtonColor: ui.black,
            });
            return;
        }

        const result = await openModalSwal({
            title: "Eliminar inventario inicial",
            text: `Se eliminará el inventario inicial registrado en ${row.sede_nombre}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: ui.danger,
            cancelButtonColor: ui.black,
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await apiClient.delete(`/inventario/productos/${productoId}/stock/${row.id}`);

            await openModalSwal({
                title: "Éxito",
                text: "El inventario inicial se eliminó correctamente.",
                icon: "success",
                confirmButtonColor: ui.black,
            });

            if (editingStockId === row.id) {
                resetFormState();
            }

            onSaved?.();
            fetchData();
        } catch (error) {
            openModalSwal({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo eliminar el inventario inicial."),
                icon: "error",
                confirmButtonColor: ui.danger,
            });
        }
    };

    const handleGuardar = async () => {
        if (!form.sede_id) {
            openModalSwal({
                title: "Atención",
                text: "Seleccione la sede.",
                icon: "warning",
                confirmButtonColor: ui.black,
            });
            return;
        }

        if (!producto?.maneja_lotes && (form.cantidad === "" || Number(form.cantidad) <= 0)) {
            openModalSwal({
                title: "Atención",
                text: "Ingrese un stock inicial mayor a 0.",
                icon: "warning",
                confirmButtonColor: ui.black,
            });
            return;
        }

        if (producto?.maneja_lotes) {
            const hasValid = (form.lotes || []).some((row) => row.codigo_lote && Number(row.cantidad_inicial) > 0);
            if (!hasValid) {
                openModalSwal({
                    title: "Atención",
                    text: "Agregue al menos un lote válido.",
                    icon: "warning",
                    confirmButtonColor: ui.black,
                });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                sede_id: Number(form.sede_id),
                cantidad: form.cantidad === "" ? null : Number(form.cantidad),
                stock_minimo: Number(form.stock_minimo || 0),
                costo_unitario: form.costo_unitario === "" ? null : Number(form.costo_unitario),
                precio_unitario: form.precio_unitario === "" ? null : Number(form.precio_unitario),
                lotes: (form.lotes || []).filter((row) => row.codigo_lote || row.cantidad_inicial),
            };

            await apiClient.post(`/inventario/productos/${productoId}/inventario-inicial`, payload);

            await openModalSwal({
                title: "Éxito",
                text: editingStockId ? "Inventario inicial actualizado correctamente." : "Inventario inicial registrado correctamente.",
                icon: "success",
                confirmButtonColor: ui.black,
            });

            setEditingStockId(null);
            onSaved?.();
            fetchData();
        } catch (error) {
            openModalSwal({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo registrar el stock."),
                icon: "error",
                confirmButtonColor: ui.danger,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth={false}
            PaperProps={{
                sx: {
                    ...modalPaperSx,
                    width: "min(1180px, calc(100vw - 32px))",
                    maxWidth: "none",
                    m: 2,
                },
            }}
        >
            <DialogTitle
                sx={{
                    ...modalTitleSx,
                    bgcolor: ui.black,
                    color: "#fff",
                    py: 2,
                    px: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `4px solid ${ui.mustard}`,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "8px",
                            bgcolor: "rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <InventoryIcon sx={{ color: ui.mustard }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: "16px", letterSpacing: "0.5px" }}>
                            CONTROL DE EXISTENCIAS POR SEDE
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                            {producto?.nombre || "Cargando..."}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "#fff", "&:hover": { bgcolor: ui.danger } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ ...modalContentSx, bgcolor: "#f8fafc", p: { xs: 2, md: 3 }, width: "100%" }}>
                {loading && stock.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: ui.mustard }} />
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: ui.black }}>
                            Consultando almacenes...
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3} sx={{ width: "100%" }}>
                                <Paper elevation={0} sx={{ ...framedSectionSx, pt: 2.5 }}>
                                    <Typography sx={{ fontSize: "12px", color: ui.black, fontWeight: 800 }}>
                                        Tipo de control:
                                <Box component="span" sx={{ color: ui.muted, fontWeight: 600, ml: 1 }}>
                                    {tipoControl}
                                </Box>
                            </Typography>

                            <Box sx={{ ...metricsGridSx, mt: 0.8 }}>
                                <Paper elevation={0} sx={{ ...metricCardSx, border: `1px solid ${ui.border}`, py: 1.25 }}>
                                    <Typography sx={{ fontSize: "10px", color: ui.muted, fontWeight: 700, mb: 0.7 }}>
                                        Stock total general
                                    </Typography>
                                    <Typography sx={{ fontSize: "22px", fontWeight: 900, color: ui.black }}>
                                        {totalStockActual}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ ...metricCardSx, border: `1px solid ${ui.border}`, py: 1.25 }}>
                                    <Typography sx={{ fontSize: "10px", color: ui.muted, fontWeight: 700, mb: 0.7 }}>
                                        Total lotes
                                    </Typography>
                                    <Typography sx={{ fontSize: "22px", fontWeight: 900, color: ui.black }}>
                                        {totalLotesRegistrados}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ ...metricCardSx, border: `1px solid ${ui.border}`, py: 1.25 }}>
                                    <Typography sx={{ fontSize: "10px", color: ui.muted, fontWeight: 700, mb: 0.7 }}>
                                        Bodegas con stock
                                    </Typography>
                                    <Typography sx={{ fontSize: "22px", fontWeight: 900, color: ui.black }}>
                                        {bodegasConStock}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ ...metricCardSx, border: `1px solid ${ui.border}`, py: 1.25 }}>
                                    <Typography sx={{ fontSize: "10px", color: ui.muted, fontWeight: 700, mb: 0.7 }}>
                                        Próximo vencimiento
                                    </Typography>
                                    <Typography sx={{ fontSize: "18px", fontWeight: 900, color: ui.black }}>
                                        {proximoVencimiento || "-"}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={framedSectionSx}>
                            <Typography sx={framedLabelSx}>Ubicación del ingreso</Typography>
                            <Box sx={ingresoGridSx}>
                                <TextField select disabled={Boolean(editingStockId)} label="Sede destino" fullWidth size="small" value={form.sede_id} onChange={(e) => handleChange("sede_id", e.target.value)} sx={modalFieldSx}>
                                    {sedes.map((s) => (
                                        <MenuItem key={s.id} value={String(s.id)}>
                                            {s.nombre}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField label="Ubicación en sede" fullWidth size="small" value={form.ubicacion} onChange={(e) => handleChange("ubicacion", e.target.value)} sx={modalFieldSx} placeholder="Pasillo A, Estante 3..." />
                                <TextField label="Observación" fullWidth size="small" value={form.observacion} onChange={(e) => handleChange("observacion", e.target.value)} sx={modalFieldSx} />
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={framedSectionSx}>
                            <Typography sx={framedLabelSx}>Stock en inventario</Typography>
                            <Box sx={inventarioGridSx(Boolean(producto?.maneja_lotes))}>
                                {!producto?.maneja_lotes && (
                                    <TextField label="Stock inicial" type="number" fullWidth size="small" value={form.cantidad} onChange={(e) => handleChange("cantidad", e.target.value)} sx={modalFieldSx} placeholder="Ej: 50" />
                                )}
                                {producto?.maneja_lotes && (
                                    <TextField label="Total por lotes" type="number" fullWidth size="small" value={totalLotes} InputProps={{ readOnly: true }} sx={modalFieldSx} />
                                )}
                                <TextField label="Stock mínimo" type="number" fullWidth size="small" value={form.stock_minimo} onChange={(e) => handleChange("stock_minimo", e.target.value)} sx={modalFieldSx} />
                            </Box>
                        </Paper>

                        {producto?.maneja_lotes && (
                            <Paper elevation={0} sx={framedSectionSx}>
                                <Typography sx={framedLabelSx}>Detalle de lotes</Typography>
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                                    <Button
                                        onClick={addLote}
                                        startIcon={<AddIcon />}
                                        sx={{
                                            border: `1px solid ${ui.mustard}`,
                                            color: ui.blueText,
                                            fontWeight: 800,
                                            fontSize: "11px",
                                            borderRadius: "6px",
                                            textTransform: "none",
                                            px: 1.5,
                                        }}
                                    >
                                        Agregar lote
                                    </Button>
                                </Box>

                                <Box sx={{ border: `1px solid ${ui.border}`, borderRadius: "8px", overflow: "hidden", bgcolor: "#fff" }}>
                                    <Box
                                        sx={{
                                            display: { xs: "none", md: "grid" },
                                            gridTemplateColumns: loteDesktopColumns(Boolean(producto?.maneja_vencimiento)),
                                            gap: 1,
                                            bgcolor: "#eef3fb",
                                            borderBottom: `1px solid ${ui.border}`,
                                        }}
                                    >
                                        <Box sx={{ px: 1.5, py: 1 }}>
                                            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: ui.black }}>Código lote</Typography>
                                        </Box>
                                        <Box sx={{ px: 1.5, py: 1 }}>
                                            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: ui.black }}>Elaboración</Typography>
                                        </Box>
                                        {producto?.maneja_vencimiento && (
                                            <Box sx={{ px: 1.5, py: 1 }}>
                                                <Typography sx={{ fontSize: "11px", fontWeight: 900, color: ui.black }}>Vencimiento</Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ px: 1.5, py: 1 }}>
                                            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: ui.black }}>Cantidad</Typography>
                                        </Box>
                                        <Box sx={{ px: 1.5, py: 1, textAlign: "center" }}>
                                            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: ui.black }}>Acción</Typography>
                                        </Box>
                                    </Box>

                                    <Stack spacing={0}>
                                        {(form.lotes || []).map((lote, index) => (
                                            <Paper
                                                key={index}
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 0,
                                                    bgcolor: "#fff",
                                                    borderBottom: index === form.lotes.length - 1 ? "none" : `1px solid ${ui.border}`,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gap: 2,
                                                        gridTemplateColumns: {
                                                            xs: "1fr",
                                                            md: loteDesktopColumns(Boolean(producto?.maneja_vencimiento)),
                                                        },
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <TextField label="Código lote" fullWidth size="small" value={lote.codigo_lote} onChange={(e) => handleLoteChange(index, "codigo_lote", e.target.value)} sx={modalFieldSx} placeholder="Ej: LOTE-001" />
                                                    <TextField label="Fecha elaboración" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={lote.fecha_elaboracion} onChange={(e) => handleLoteChange(index, "fecha_elaboracion", e.target.value)} sx={modalFieldSx} />
                                                    {producto?.maneja_vencimiento && (
                                                        <TextField label="Fecha vencimiento" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={lote.fecha_vencimiento} onChange={(e) => handleLoteChange(index, "fecha_vencimiento", e.target.value)} sx={modalFieldSx} />
                                                    )}
                                                    <TextField label="Cantidad" type="number" fullWidth size="small" value={lote.cantidad_inicial} onChange={(e) => handleLoteChange(index, "cantidad_inicial", e.target.value)} sx={modalFieldSx} />
                                                    <Box sx={{ display: "flex", justifyContent: { xs: "flex-end", md: "center" } }}>
                                                        <Button onClick={() => removeLote(index)} sx={{ minWidth: 0, color: ui.danger }}>
                                                            <DeleteOutlineIcon />
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>

                                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                                    <Chip label={`Cantidad total: ${totalLotes} ${producto?.unidad_medida || "und"}`} sx={{ fontWeight: 900, bgcolor: "#f8fafc" }} />
                                </Box>
                            </Paper>
                        )}

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end" alignItems={{ xs: "stretch", sm: "center" }}>
                            {editingStockId && (
                                <Button
                                    onClick={resetFormState}
                                    variant="outlined"
                                    sx={{
                                        borderColor: ui.mustardDark,
                                        color: ui.mustardDark,
                                        fontWeight: 900,
                                        fontSize: "12px",
                                        textTransform: "none",
                                        px: 2.5,
                                    }}
                                >
                                    Cancelar edición
                                </Button>
                            )}
                            <Button
                                onClick={handleGuardar}
                                disabled={saving}
                                variant="outlined"
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    borderColor: ui.success,
                                    color: ui.success,
                                    fontWeight: 900,
                                    fontSize: "12px",
                                    textTransform: "none",
                                    px: 3,
                                    "&:hover": { bgcolor: "rgba(46,125,50,0.06)", borderColor: ui.success },
                                }}
                            >
                                {saving ? "Guardando..." : editingStockId ? "Actualizar" : "Guardar"}
                            </Button>
                        </Stack>

                        <Paper elevation={0} sx={{ ...framedSectionSx, p: 1.25, pt: 2.2 }}>
                            <Typography sx={framedLabelSx}>Detalle de stock por bodega</Typography>
                            <Table size="small" sx={tableSx}>
                                <TableHead sx={{ bgcolor: "#d8e3f3" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900 }}>SEDE / ALMACÉN</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 900 }}>UBICACIÓN</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 900 }}>STOCK MÍNIMO</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>CANTIDAD ACTUAL</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 900 }}>ACCIONES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stock.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                <Typography sx={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", fontStyle: "italic" }}>
                                                    Sin existencias registradas para este producto.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stock.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell sx={{ fontWeight: 800, color: ui.black }}>{s.sede_nombre}</TableCell>
                                                <TableCell align="center">
                                                    <Typography sx={{ fontSize: "11px", color: "rgba(0,0,0,0.5)" }}>
                                                        {s.ubicacion || "N/A"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={s.stock_minimo || 0} size="small" sx={{ height: 20, fontSize: "10px", fontWeight: 800 }} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 950,
                                                            fontSize: "14px",
                                                            color: Number(s.cantidad) <= Number(s.stock_minimo) ? ui.danger : ui.black,
                                                        }}
                                                    >
                                                        {s.cantidad} <span style={{ fontSize: "10px", fontWeight: 500 }}>{producto?.unidad_medida}</span>
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        <IconButton
                                                            size="small"
                                                            title="Editar"
                                                            onClick={() => handleEditarStock(s)}
                                                            sx={{ color: s.inventario_inicial_editable ? "#f97316" : ui.muted }}
                                                        >
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            title="Ver lotes"
                                                            onClick={() => handleVerLotes(s)}
                                                            sx={{ color: Array.isArray(s.lotes) && s.lotes.length > 0 ? "#2563eb" : ui.muted }}
                                                        >
                                                            <VisibilityOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            title="Eliminar"
                                                            onClick={() => handleEliminarStock(s)}
                                                            sx={{ color: s.inventario_inicial_eliminable ? ui.danger : ui.muted }}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Stack>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.25, bgcolor: "#fff", justifyContent: "flex-end" }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    sx={{
                        borderColor: ui.danger,
                        color: ui.danger,
                        fontWeight: 900,
                        fontSize: "12px",
                        textTransform: "none",
                        px: 3,
                        "&:hover": { bgcolor: "rgba(239,68,68,0.05)", borderColor: ui.danger },
                    }}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
