import { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Stack,
    InputAdornment,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AddCardOutlinedIcon from "@mui/icons-material/AddCardOutlined";

import { apiClient, getApiErrorMessage, openModalSwal } from "../../../../services/apiClient";
import {
    modalPaperSx,
    modalTitleSx,
    modalContentSx,
    modalFieldSx,
    tableSx,
    tgAccent,
    semanticChipSx,
    semanticIconButtonSx,
    semanticOutlineButtonSx,
} from "../../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    mustard: tgAccent.mustard,
    mustardDark: tgAccent.mustardStrong,
    mustardSoft: tgAccent.mustardSoft,
    danger: "#ef4444",
    dangerSoft: "rgba(239, 68, 68, 0.08)",
    success: "#2e7d32",
    successSoft: "rgba(46, 125, 50, 0.10)",
    border: "#e2e8f0",
    muted: "#64748b",
};

const framedSectionSx = {
    p: 2.4,
    pt: 3.8,
    border: `1px solid ${ui.border}`,
    borderRadius: "12px",
    bgcolor: "#fff",
    position: "relative",
    overflow: "visible",
    width: "100%",
    boxSizing: "border-box",
};

const framedLabelSx = {
    position: "absolute",
    top: -3,
    left: 16,
    px: 1,
    bgcolor: "#f8fafc",
    fontSize: "11px",
    fontWeight: 900,
    color: ui.black,
    letterSpacing: "0.2px",
    lineHeight: 1.2,
};

const helperCardSx = {
    mt: 1.8,
    p: 1.6,
    borderRadius: "10px",
    bgcolor: "#ffffff",
    border: `1px solid ${ui.border}`,
};

const tiposPrecio = [
    { value: "COSTO", label: "Costo", help: "Costo referencial del producto para compras y márgenes." },
    { value: "VENTA", label: "Venta público", help: "Precio base para la venta normal." },
    { value: "SOCIO", label: "Precio socio", help: "Precio preferencial para clientes socios o afiliados." },
    { value: "PROMOCION", label: "Promoción", help: "Precio temporal que debe tener fecha de fin." },
];

const createInitialForm = (prod) => ({
    tipo_precio: "VENTA",
    sede_id: prod?.sede_principal_id ? String(prod.sede_principal_id) : "",
    monto: "",
    vigencia_inicio: new Date().toISOString().slice(0, 10),
    vigencia_fin: "",
    estado: 1,
});

const getSedeLabel = (sedeId, sedes = []) => {
    if (!sedeId) {
        return "General (todas las sedes)";
    }

    const found = sedes.find((item) => String(item.id) === String(sedeId));
    return found?.nombre || "General (todas las sedes)";
};

export default function ModalPreciosProducto({
    open,
    onClose,
    productoId,
    sedes = [],
    onSaved,
}) {
    const [producto, setProducto] = useState(null);
    const [precios, setPrecios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(createInitialForm(null));

    const fetchData = async () => {
        if (!productoId) return;
        setLoading(true);
        try {
            const [prodRes, preRes] = await Promise.all([
                apiClient.get(`/inventario/productos/${productoId}`),
                apiClient.get(`/inventario/productos/${productoId}/precios`),
            ]);
            setProducto(prodRes.data);
            setPrecios(Array.isArray(preRes.data) ? preRes.data : []);
            if (!editId) setForm(createInitialForm(prodRes.data));
        } catch (error) {
            console.error("Error al cargar precios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
            setEditId(null);
        }
    }, [open, productoId]);

    const selectedTipo =
        tiposPrecio.find((item) => item.value === form.tipo_precio) || tiposPrecio[1];

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.tipo_precio) {
            openModalSwal({ title: "Atención", text: "Seleccione el tipo de precio.", icon: "warning", confirmButtonColor: ui.black });
            return;
        }
        if (!form.monto || Number(form.monto) <= 0) {
            openModalSwal({ title: "Atención", text: "Ingrese un monto válido.", icon: "warning", confirmButtonColor: ui.black });
            return;
        }
        if (!form.vigencia_inicio) {
            openModalSwal({ title: "Atención", text: "Seleccione la fecha de inicio.", icon: "warning", confirmButtonColor: ui.black });
            return;
        }
        if (form.tipo_precio === "PROMOCION" && !form.vigencia_fin) {
            openModalSwal({ title: "Atención", text: "La promoción requiere fecha de fin.", icon: "warning", confirmButtonColor: ui.black });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                sede_id: form.sede_id ? Number(form.sede_id) : null,
                monto: Number(form.monto),
                estado: Number(form.estado || 1),
            };

            if (editId) {
                await apiClient.put(`/inventario/producto-precios/${editId}`, payload);
            } else {
                await apiClient.post(`/inventario/productos/${productoId}/precios`, payload);
            }

            openModalSwal({
                title: "Exito",
                text: editId ? "Precio actualizado." : "Nuevo precio registrado.",
                icon: "success",
                confirmButtonColor: ui.black,
            });

            setEditId(null);
            setForm(createInitialForm(producto));
            await fetchData();
            await onSaved?.();
        } catch (error) {
            openModalSwal({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo procesar la solicitud."),
                icon: "error",
                confirmButtonColor: ui.danger,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setForm({
            tipo_precio: item.tipo_precio,
            sede_id: item.sede_id ? String(item.sede_id) : "",
            monto: item.monto,
            vigencia_inicio: item.vigencia_inicio?.slice(0, 10) || "",
            vigencia_fin: item.vigencia_fin?.slice(0, 10) || "",
            estado: item.estado,
        });
    };

    const handleDelete = async (id) => {
        const res = await openModalSwal({
            title: "¿Desactivar precio?",
            text: "Este precio dejará de aplicarse en las ventas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: ui.danger,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
        });

        if (!res.isConfirmed) return;

        try {
            await apiClient.delete(`/inventario/producto-precios/${id}`);
            await fetchData();
            await onSaved?.();
            openModalSwal({ title: "Exito", text: "Precio desactivado.", icon: "success", confirmButtonColor: ui.black });
        } catch (error) {
            openModalSwal({ title: "Error", text: getApiErrorMessage(error, "Error al desactivar."), icon: "error", confirmButtonColor: ui.danger });
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
                    width: "min(900px, calc(100vw - 32px))",
                    maxWidth: "none",
                    m: 2,
                },
            }}
        >
            <DialogTitle sx={{ ...modalTitleSx, bgcolor: ui.black, color: "#fff", py: 2, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `4px solid ${ui.mustard}` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <PaymentsOutlinedIcon sx={{ color: ui.mustard }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: "16px", letterSpacing: "0.5px" }}>
                            GESTIÓN DE PRECIOS
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

            <DialogContent
                sx={{
                    ...modalContentSx,
                    bgcolor: "#f8fafc",
                    p: { xs: 2, md: 3 },
                    pt: { xs: 3.5, md: 4.5 },
                }}
            >
                {loading && precios.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                        <CircularProgress sx={{ color: ui.mustard }} />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            display: "grid",
                            gap: 2.5,
                        }}
                    >
                        <Box sx={{ width: "100%", mt: 1.5 }}>
                            <Paper elevation={0} sx={framedSectionSx}>
                                <Typography sx={framedLabelSx}>
                                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                                        <AddCardOutlinedIcon sx={{ fontSize: 14 }} /> {editId ? "MODIFICAR PRECIO" : "REGISTRAR NUEVO PRECIO"}
                                    </Box>
                                </Typography>

                                <Box
                                    sx={{
                                        width: "100%",
                                        display: "grid",
                                        gap: 1.8,
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "repeat(2, minmax(0, 1fr))",
                                        },
                                    }}
                                >
                                    <Box>
                                        <TextField select label="Tipo de precio" fullWidth size="small" value={form.tipo_precio} onChange={(e) => handleChange("tipo_precio", e.target.value)} sx={modalFieldSx}>
                                            {tiposPrecio.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                                        </TextField>
                                    </Box>
                                    <Box>
                                        <TextField
                                            select
                                            label="Sede de aplicación"
                                            fullWidth
                                            size="small"
                                            value={form.sede_id}
                                            onChange={(e) => handleChange("sede_id", e.target.value)}
                                            sx={modalFieldSx}
                                            InputLabelProps={{ shrink: true }}
                                            SelectProps={{
                                                displayEmpty: true,
                                                renderValue: (selected) => getSedeLabel(selected, sedes),
                                            }}
                                        >
                                            <MenuItem value=""><em>General (todas las sedes)</em></MenuItem>
                                            {sedes.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>)}
                                        </TextField>
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        width: "100%",
                                        mt: 1.8,
                                        display: "grid",
                                        gap: 1.8,
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(2, minmax(0, 1fr))",
                                            md: "1.3fr 1fr 1fr",
                                        },
                                    }}
                                >
                                    <Box>
                                        <TextField
                                            label="Monto ($)"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={form.monto}
                                            onChange={(e) => handleChange("monto", e.target.value)}
                                            sx={modalFieldSx}
                                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                        />
                                    </Box>
                                    <Box>
                                        <TextField label="Desde" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.vigencia_inicio} onChange={(e) => handleChange("vigencia_inicio", e.target.value)} sx={modalFieldSx} />
                                    </Box>
                                    <Box>
                                        <TextField label="Hasta" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.vigencia_fin} onChange={(e) => handleChange("vigencia_fin", e.target.value)} sx={modalFieldSx} />
                                    </Box>
                                </Box>

                                <Box sx={helperCardSx}>
                                    <Typography sx={{ fontSize: "12px", fontWeight: 800, color: ui.black, mb: 0.45 }}>
                                        {selectedTipo.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: "12px", color: ui.muted }}>
                                        {selectedTipo.help}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 2.2, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Chip label={`Costo actual: $${Number(producto?.precio_costo || 0).toFixed(2)}`} size="small" sx={{ borderRadius: "6px", bgcolor: "#fff", border: `1px solid ${ui.border}`, fontWeight: 800 }} />
                                        <Chip label={`Venta actual: $${Number(producto?.precio_venta || 0).toFixed(2)}`} size="small" sx={{ borderRadius: "6px", bgcolor: "#fff", border: `1px solid ${ui.border}`, fontWeight: 800 }} />
                                    </Stack>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        {editId && (
                                            <Button
                                                onClick={() => { setEditId(null); setForm(createInitialForm(producto)); }}
                                                variant="outlined"
                                                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                                                sx={semanticOutlineButtonSx("danger")}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                        <Button
                                            variant="outlined"
                                            onClick={handleSave}
                                            disabled={saving}
                                            sx={semanticOutlineButtonSx("mustard", { withIconBox: true, height: 40, px: 3.5, borderWidth: 2 })}
                                        >
                                            <Box className="icon-box">
                                                {saving ? <CircularProgress size={11} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 12 }} />}
                                            </Box>
                                            {saving ? "Guardando..." : "Guardar"}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Paper>
                        </Box>

                        <Box sx={{ width: "100%" }}>
                            <Paper elevation={0} sx={{ ...framedSectionSx, p: 0, overflow: "hidden", minHeight: 255, width: "100%" }}>
                                <Box sx={{ p: 2, bgcolor: "#fff", borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                                    <HistoryOutlinedIcon fontSize="small" sx={{ color: ui.mustardDark }} />
                                    <Typography sx={{ fontWeight: 800, fontSize: "13px", color: ui.black }}>HISTORIAL DE PRECIOS</Typography>
                                </Box>
                                <Box sx={{ width: "100%", overflowX: "auto" }}>
                                <Table size="small" sx={{ ...tableSx, width: "100%", minWidth: 640 }}>
                                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 900 }}>TIPO</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900 }}>MONTO</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900 }}>VIGENCIA</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900 }}>ESTADO</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900 }}>ACCIONES</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {precios.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 5, color: "rgba(0,0,0,0.4)", fontStyle: "italic" }}>
                                                    No hay precios configurados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            precios.map((p) => (
                                                <TableRow key={p.id} hover>
                                                    <TableCell sx={{ fontWeight: 800, color: ui.black }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: "12px" }}>
                                                            {p.tipo_precio_nombre || p.tipo_precio}
                                                        </Typography>
                                                        <Typography sx={{ color: "rgba(0,0,0,0.5)", fontSize: "10px" }}>
                                                            {p.sede_nombre || "Toda la red"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography sx={{ fontWeight: 950, fontSize: "14px", color: ui.black }}>
                                                            ${Number(p.monto).toFixed(2)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Stack alignItems="center">
                                                            <Typography sx={{ fontSize: "10px", fontWeight: 700 }}>{p.vigencia_inicio?.slice(0, 10)}</Typography>
                                                            <Typography sx={{ fontSize: "9px", color: "rgba(0,0,0,0.4)" }}>{p.vigencia_fin ? `hasta ${p.vigencia_fin.slice(0, 10)}` : "Sin fin definido"}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            label={p.vigente ? "VIGENTE" : (Number(p.estado) === 1 ? "ACTIVO" : "INACTIVO")}
                                                            sx={{
                                                                ...semanticChipSx(p.vigente ? "success" : { color: "#64748b" }),
                                                                height: 22,
                                                                fontSize: "10px",
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                                                            <IconButton size="small" onClick={() => handleEdit(p)} sx={semanticIconButtonSx("mustard")}>
                                                                <EditIcon fontSize="inherit" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDelete(p.id)} sx={semanticIconButtonSx("danger")}>
                                                                <DeleteIcon fontSize="inherit" />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, bgcolor: "#fff", justifyContent: "flex-end" }}>
                <Button
                    onClick={onClose}
                    startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                    variant="outlined"
                    sx={semanticOutlineButtonSx("danger")}
                >
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
