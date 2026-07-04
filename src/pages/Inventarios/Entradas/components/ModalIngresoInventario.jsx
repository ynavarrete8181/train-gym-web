import { useEffect, useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";

import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PremiumButton from "../../../../components/ui/PremiumButton";

const ui = {
    bg: "#f6f8fc",
    paper: "#ffffff",
    ink: "#0f172a",
    muted: "#475569",
    border: "#dbe3f0",
    borderSoft: "#e8eef7",
    primary: "#144985",
    success: "#177d3f",
    danger: "#b42318",
    head: "#0b1f3a",
    warning: "#b7791f",
    softBlue: "#f5f8ff",
    softYellow: "#fffaf0",
};

const baseFontSx = {
    fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
    letterSpacing: 0,
    fontStyle: "normal",
};

const textFieldSx = {
    "& .MuiInputBase-root": {
        ...baseFontSx,
        fontSize: 12,
        minHeight: 34,
        borderRadius: 'var(--tg-radius-xs)',
    },
    "& .MuiInputBase-input": {
        ...baseFontSx,
        fontSize: 12,
        py: 0.75,
    },
    "& .MuiInputLabel-root": {
        ...baseFontSx,
        fontSize: 12,
    },
    "& .MuiFormHelperText-root": {
        ...baseFontSx,
        fontSize: 11,
        mt: 0.4,
    },
};

const selectSx = {
    ...baseFontSx,
    "& .MuiOutlinedInput-root": {
        ...baseFontSx,
        fontSize: 12,
        borderRadius: 'var(--tg-radius-xs)',
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: ui.border,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: ui.primary,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: ui.primary,
    },
    "& .MuiSelect-select": {
        ...baseFontSx,
        fontSize: 12,
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "12px",
        paddingRight: "32px",
        display: "flex",
        alignItems: "center",
        minHeight: "unset",
    },
    "& .MuiSvgIcon-root": {
        fontSize: 20,
    },
    "& em": {
        fontStyle: "normal",
    },
    "& .MuiFormHelperText-root": {
        ...baseFontSx,
        fontSize: 11,
        mt: 0.4,
    },
};

const tableSx = {
    "& th": {
        ...baseFontSx,
        fontSize: 11,
        fontWeight: 800,
        color: ui.head,
        bgcolor: "#f3f6fb",
        borderBottom: `1px solid ${ui.borderSoft}`,
        py: 0.9,
        whiteSpace: "nowrap",
    },
    "& td": {
        ...baseFontSx,
        fontSize: 12,
        borderBottom: `1px solid ${ui.borderSoft}`,
        py: 0.75,
        verticalAlign: "top",
    },
};

const sectionTitleSx = {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: ui.primary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
};

const EmptyState = ({ label = "SIN REGISTROS" }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            textAlign: "center",
            borderRadius: 'var(--tg-radius-xs)',
            border: `1px dashed ${ui.border}`,
            bgcolor: "#fbfcfe",
        }}
    >
        <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 12 }}>
            {label}
        </Typography>
        <Typography sx={{ ...baseFontSx, color: ui.muted, mt: 0.4, fontSize: 11 }}>
            Cuando existan registros, aparecerán aquí.
        </Typography>
    </Paper>
);

const tiposAdquisicion = [
    { value: "FACTURA", label: "Factura" },
    { value: "DONACION", label: "Donación" },
];

const tiposDocumento = [
    { value: "FACTURA", label: "Factura" },
    { value: "NOTA_INGRESO", label: "Nota de ingreso" },
    { value: "GUIA", label: "Guía / remisión" },
    { value: "ACTA", label: "Acta / soporte" },
];

const createEmptyItem = () => ({
    producto_id: "",
    cantidad: "",
    costo_unitario: "",
    precio_unitario: "",
    codigo_lote: "",
    fecha_elaboracion: "",
    fecha_vencimiento: "",
});

const initialHeader = (sedes = []) => ({
    proveedor: "",
    tipo_adquisicion: "COMPRA",
    tipo_documento: "FACTURA",
    numero_comprobante: "",
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_vencimiento: "",
    sede_id: sedes[0]?.id ? String(sedes[0].id) : "",
    iva_pct: "15",
    observacion: "",
    items: [],
});

const money = (value) =>
    Number(value || 0).toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function ModalIngresoInventario({
    open,
    onClose,
    productos = [],
    sedes = [],
    proveedores = [],
    onSubmit,
    loading = false,
}) {
    const [form, setForm] = useState(initialHeader(sedes));
    const [errors, setErrors] = useState({});
    const [productoBusqueda, setProductoBusqueda] = useState("");
    const [showProvTable, setShowProvTable] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (open) {
            setForm(initialHeader(sedes));
            setErrors({});
            setProductoBusqueda("");
            setShowProvTable(false);
            setFile(null);
        }
    }, [open, sedes]);

    const handleHeaderChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleItemChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item, idx) => {
                if (idx !== index) return item;

                const next = { ...item, [field]: value };
                if (field === "producto_id") {
                    const selected = productos.find((row) => String(row.id) === String(value));
                    next.precio_unitario = selected?.precio_venta != null ? String(selected.precio_venta) : "";
                    next.codigo_lote = "";
                    next.fecha_elaboracion = "";
                    next.fecha_vencimiento = "";
                }
                return next;
            }),
        }));
        setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: undefined }));
    };

    const addItem = (producto) => {
        if (!producto) return;

        setForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    ...createEmptyItem(),
                    producto_id: String(producto.id),
                    precio_unitario: producto?.precio_venta != null ? String(producto.precio_venta) : "",
                    costo_unitario: producto?.precio_costo != null ? String(producto.precio_costo) : "",
                },
            ],
        }));
        setProductoBusqueda("");
    };

    const removeItem = (index) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.length > 1 ? prev.items.filter((_, idx) => idx !== index) : prev.items,
        }));
    };

    const rows = useMemo(
        () =>
            form.items.map((item, index) => {
                const producto = productos.find((row) => String(row.id) === String(item.producto_id));
                const subtotal = Number(item.cantidad || 0) * Number(item.costo_unitario || 0);
                return { ...item, index, producto, subtotal };
            }),
        [form.items, productos]
    );

    const subtotal = useMemo(() => rows.reduce((acc, row) => acc + Number(row.subtotal || 0), 0), [rows]);
    const iva = useMemo(() => subtotal * (Number(form.iva_pct || 0) / 100), [subtotal, form.iva_pct]);
    const total = subtotal + iva;
    const unidades = useMemo(() => rows.reduce((acc, row) => acc + Number(row.cantidad || 0), 0), [rows]);

    const validate = () => {
        const next = {};
        if (!form.sede_id) next.sede_id = "Seleccione la sede";
        if (!form.tipo_adquisicion) next.tipo_adquisicion = "Seleccione el tipo";
        if (!form.proveedor.trim()) next.proveedor = "Ingrese proveedor u origen";
        if (!form.numero_comprobante.trim() && form.tipo_adquisicion === "FACTURA") {
            next.numero_comprobante = "Ingrese el numero de factura";
        }
        if (form.items.length === 0) {
            next.detalleProductos = "Debe agregar al menos un insumo al comprobante";
        }

        rows.forEach((row) => {
            if (!row.producto_id) next[`item_${row.index}_producto_id`] = "Seleccione producto";
            if (!row.cantidad || Number(row.cantidad) <= 0) next[`item_${row.index}_cantidad`] = "Cantidad invalida";
            if (Number(row.costo_unitario || 0) < 0) next[`item_${row.index}_costo_unitario`] = "Costo invalido";
            if (Number(row.precio_unitario || 0) < 0) next[`item_${row.index}_precio_unitario`] = "Precio invalido";

            if (row.producto?.maneja_lotes) {
                if (!String(row.codigo_lote || "").trim()) next[`item_${row.index}_codigo_lote`] = "Lote obligatorio";
                if (row.producto?.maneja_vencimiento && !row.fecha_vencimiento) {
                    next[`item_${row.index}_fecha_vencimiento`] = "Fecha requerida";
                }
            }
        });

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const buildPayload = () => {
        const referenciaTipo = `${form.tipo_documento}_${form.tipo_adquisicion}`;
        const referenciaTexto = [
            `Prov/Origen: ${form.proveedor.trim()}`,
            form.numero_comprobante.trim() ? `Doc: ${form.numero_comprobante.trim()}` : null,
            form.observacion.trim() ? form.observacion.trim() : null,
            `Subtotal: $${money(subtotal)} | IVA: $${money(iva)} | Total: $${money(total)}`,
        ]
            .filter(Boolean)
            .join(" | ");

        return {
            proveedor: form.proveedor.trim(),
            tipo_adquisicion: form.tipo_adquisicion,
            tipo_documento: form.tipo_documento,
            numero_comprobante: form.numero_comprobante.trim(),
            fecha_emision: form.fecha_emision,
            fecha_vencimiento: form.fecha_vencimiento,
            sede_id: Number(form.sede_id),
            iva_pct: Number(form.iva_pct || 0),
            subtotal,
            iva,
            total,
            items: rows.map((row) => ({
                producto_id: Number(row.producto_id),
                sede_id: Number(form.sede_id),
                motivo: form.tipo_adquisicion,
                cantidad: Number(row.cantidad),
                costo_unitario: row.costo_unitario === "" ? null : Number(row.costo_unitario),
                precio_unitario: row.precio_unitario === "" ? null : Number(row.precio_unitario),
                codigo_lote: row.producto?.maneja_lotes ? String(row.codigo_lote || "").trim() || null : null,
                fecha_elaboracion: row.producto?.maneja_lotes ? row.fecha_elaboracion || null : null,
                fecha_vencimiento: row.producto?.maneja_lotes ? row.fecha_vencimiento || null : null,
                referencia_tipo: referenciaTipo,
                referencia_id: null,
                observacion: referenciaTexto,
            })),
        };
    };

    const handleSave = () => {
        if (!validate()) return;
        onSubmit(buildPayload());
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: ui.bg,
                    minHeight: "85vh",
                    m: 2,
                    borderRadius: 'var(--tg-radius-xs)',
                }
            }}
        >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
                    <Box sx={{ maxWidth: 1180, mx: "auto" }}>
                        
                        {/* HEADER - Exactamente como dbanu */}
                        <Paper
                            elevation={0}
                            sx={{
                                ...baseFontSx,
                                bgcolor: ui.paper,
                                border: `1px solid ${ui.border}`,
                                borderRadius: 'var(--tg-radius-xs)',
                                px: 2,
                                py: 1.25,
                                mb: 1.5,
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 'var(--tg-radius-xs)',
                                        border: `1px solid ${ui.border}`,
                                        bgcolor: "#f1f5ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <MenuBookIcon sx={{ color: ui.primary, fontSize: 18 }} />
                                </Box>

                                <Box sx={{ minWidth: 220 }}>
                                    <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                                        Registrar Comprobante de Ingreso
                                    </Typography>
                                    <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
                                        Nro: —
                                    </Typography>
                                </Box>

                                <Chip
                                    label={`${form.items.length} PRODUCTOS`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 800 }}
                                />
                                <Chip
                                    label={`${unidades} UNIDADES TOTALES`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 800 }}
                                />
                            </Box>
                        </Paper>

                        {/* BODY - Exactamente como dbanu */}
                        <Paper
                            elevation={0}
                            sx={{
                                ...baseFontSx,
                                bgcolor: ui.paper,
                                border: `1px solid ${ui.border}`,
                                borderRadius: 'var(--tg-radius-xs)',
                                p: 2,
                            }}
                        >
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                                {/* PROVEEDOR */}
                                <Box>
                                    <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 'var(--tg-radius-xs)', p: 1.5, bgcolor: "#fff", height: "100%" }}>
                                        <Typography sx={sectionTitleSx}>Proveedor</Typography>

                                        <FormControl fullWidth sx={{ mt: 1 }}>
                                            <Autocomplete
                                                freeSolo
                                                options={proveedores}
                                                getOptionLabel={(option) => typeof option === 'string' ? option : option.nombre}
                                                value={form.proveedor}
                                                onInputChange={(_, newInputValue) => {
                                                    handleHeaderChange("proveedor", newInputValue);
                                                    setShowProvTable(newInputValue.trim().length > 0);
                                                }}
                                                onChange={(_, newValue) => {
                                                    const val = typeof newValue === 'string' ? newValue : (newValue?.nombre || "");
                                                    handleHeaderChange("proveedor", val);
                                                    setShowProvTable(val.trim().length > 0);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        id="txt-buscar-proveedor"
                                                        size="small"
                                                        fullWidth
                                                        placeholder="Buscar proveedor"
                                                        error={Boolean(errors.proveedor)}
                                                        helperText={errors.proveedor || (!showProvTable ? "Seleccione un proveedor" : "")}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <SearchIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={textFieldSx}
                                                    />
                                                )}
                                            />
                                        </FormControl>

                                        <Box sx={{ mt: 1.25 }}>
                                            {showProvTable ? (() => {
                                                const provReal = proveedores.find(p => p.nombre.toLowerCase() === form.proveedor.trim().toLowerCase());
                                                return (
                                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 'var(--tg-radius-xs)' }}>
                                                        <Table size="small" sx={tableSx}>
                                                            <TableBody>
                                                                {[
                                                                    ["RUC", provReal?.ruc || "—"],
                                                                    ["NOMBRE", provReal?.nombre || form.proveedor],
                                                                    ["DIRECCIÓN", provReal?.direccion || "—"],
                                                                    ["TELÉFONO", provReal?.telefono || "—"],
                                                                    ["EMAIL", provReal?.correo || "—"],
                                                                ].map(([k, v]) => (
                                                                    <TableRow key={k}>
                                                                        <TableCell sx={{ width: 110, fontWeight: 800 }}>{k}</TableCell>
                                                                        <TableCell
                                                                            title={String(v || "—")}
                                                                            sx={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                                                        >
                                                                            {v || "—"}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                )
                                            })() : (
                                                <EmptyState label="SELECCIONE UN PROVEEDOR" />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* DATOS COMPROBANTE */}
                                <Box>
                                    <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 'var(--tg-radius-xs)', p: 1.5, bgcolor: "#fff", height: "100%" }}>
                                        <Typography sx={sectionTitleSx}>Datos del comprobante</Typography>

                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                                            <Box>
                                                <FormControl size="small" fullWidth variant="outlined" error={Boolean(errors.tipo_adquisicion)}>
                                                    <InputLabel id="tipo-adq-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                                                        Tipo adquisición
                                                    </InputLabel>
                                                    <Select
                                                        labelId="tipo-adq-label"
                                                        label="Tipo adquisición"
                                                        value={form.tipo_adquisicion}
                                                        displayEmpty
                                                        sx={selectSx}
                                                        onChange={(e) => handleHeaderChange("tipo_adquisicion", e.target.value)}
                                                    >
                                                        <MenuItem value=""><Box component="span" sx={baseFontSx}>SELECCIONE</Box></MenuItem>
                                                        {tiposAdquisicion.map((tipo) => (
                                                            <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.tipo_adquisicion && <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.tipo_adquisicion}</FormHelperText>}
                                                </FormControl>
                                            </Box>

                                            <Box>
                                                <TextField
                                                    size="small"
                                                    label="N° comprobante"
                                                    fullWidth
                                                    value={form.numero_comprobante}
                                                    onChange={(e) => handleHeaderChange("numero_comprobante", e.target.value)}
                                                    error={Boolean(errors.numero_comprobante)}
                                                    helperText={errors.numero_comprobante || ""}
                                                    sx={textFieldSx}
                                                />
                                            </Box>

                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                                            <Box>
                                                <DatePicker
                                                    label="Fecha emisión"
                                                    value={form.fecha_emision ? dayjs(form.fecha_emision) : null}
                                                    onChange={(v) => handleHeaderChange("fecha_emision", v ? dayjs(v).format("YYYY-MM-DD") : "")}
                                                    disabled={form.tipo_adquisicion === "DONACION"}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            fullWidth: true,
                                                            error: Boolean(errors.fecha_emision),
                                                            helperText: errors.fecha_emision || "",
                                                            sx: textFieldSx,
                                                        },
                                                    }}
                                                />
                                            </Box>

                                            <Box>
                                                <DatePicker
                                                    label="Fecha vencimiento"
                                                    value={form.fecha_vencimiento ? dayjs(form.fecha_vencimiento) : null}
                                                    onChange={(v) => handleHeaderChange("fecha_vencimiento", v ? dayjs(v).format("YYYY-MM-DD") : "")}
                                                    disabled={form.tipo_adquisicion === "DONACION"}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            fullWidth: true,
                                                            error: Boolean(errors.fecha_vencimiento),
                                                            helperText: errors.fecha_vencimiento || "",
                                                            sx: textFieldSx,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                            </Box>

                                            <Box>
                                                <Typography sx={{ ...baseFontSx, fontSize: 11, fontWeight: 900, color: ui.head, opacity: form.tipo_adquisicion === "DONACION" ? 0.5 : 1 }}>
                                                    Evidencia (PDF)
                                                </Typography>
                                                <Grid container spacing={1} sx={{ mt: 0.75 }}>
                                                    <Grid item>
                                                        <input accept="application/pdf" style={{ display: "none" }} id="upload-evidencia" type="file" disabled={form.tipo_adquisicion === "DONACION"} onChange={(e) => setFile(e.target.files?.[0])} />
                                                        <label htmlFor="upload-evidencia">
                                                            <Button
                                                                size="small" variant="outlined" component="span" startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                                                                disabled={form.tipo_adquisicion === "DONACION"}
                                                                sx={{ ...baseFontSx, textTransform: "none", color: ui.primary, borderColor: ui.primary, "&:hover": { backgroundColor: "#f3f6ff", borderColor: ui.primary }, borderRadius: 'var(--tg-radius-xs)', height: 34, boxShadow: "none", fontSize: 12, px: 1.75 }}
                                                            >Subir</Button>
                                                        </label>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />} disabled={!file || form.tipo_adquisicion === "DONACION"} sx={{ ...baseFontSx, textTransform: "none", borderRadius: 'var(--tg-radius-xs)', height: 34, fontSize: 12, px: 1.75, borderColor: ui.border, color: ui.head, "&:hover": { borderColor: ui.primary, bgcolor: "#f3f6ff" } }}>Ver</Button>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button size="small" variant="outlined" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />} onClick={() => setFile(null)} disabled={!file || form.tipo_adquisicion === "DONACION"} sx={{ ...baseFontSx, textTransform: "none", borderRadius: 'var(--tg-radius-xs)', height: 34, fontSize: 12, px: 1.75, borderColor: "#f2c6c2", color: ui.danger, "&:hover": { bgcolor: "#fff5f5", borderColor: ui.danger } }}>Eliminar</Button>
                                                    </Grid>
                                                </Grid>
                                                {file && <Typography sx={{ ...baseFontSx, mt: 0.6, fontSize: 11, color: ui.muted }}>Archivo: <Box component="span" sx={{ fontWeight: 800 }}>{file.name}</Box></Typography>}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                </Box>

                                {/* UBICACION */}
                                <Box>
                                    <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 'var(--tg-radius-xs)', p: 1.5, bgcolor: "#fff" }}>
                                        <Typography sx={sectionTitleSx}>Ubicación del ingreso</Typography>

                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1, mt: 1 }}>
                                            <Box>
                                                <FormControl size="small" fullWidth variant="outlined" error={Boolean(errors.sede_id)}>
                                                    <InputLabel id="ub-sede-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                                                        Sede
                                                    </InputLabel>
                                                    <Select
                                                        labelId="ub-sede-label"
                                                        label="Sede"
                                                        value={form.sede_id}
                                                        displayEmpty
                                                        sx={selectSx}
                                                        onChange={(e) => handleHeaderChange("sede_id", e.target.value)}
                                                    >
                                                        <MenuItem value=""><Box component="span" sx={baseFontSx}>SELECCIONE</Box></MenuItem>
                                                        {sedes.map((s) => (
                                                            <MenuItem key={s.id} value={String(s.id)}>
                                                                {s.nombre}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.sede_id && <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.sede_id}</FormHelperText>}
                                                </FormControl>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* INSUMOS */}
                                <Box>
                                    <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 'var(--tg-radius-xs)', p: 1.5, bgcolor: "#fff" }}>
                                        <Typography sx={sectionTitleSx}>Insumos</Typography>

                                        <Box sx={{ mt: 1 }}>
                                            <Autocomplete
                                                options={productos}
                                                value={productos.find(p => p.id === productoBusqueda) || null}
                                                onChange={(_, value) => {
                                                    if (value) addItem(value);
                                                }}
                                                inputValue={productoBusqueda}
                                                onInputChange={(_, newInputValue) => {
                                                    setProductoBusqueda(newInputValue);
                                                }}
                                                getOptionLabel={(option) => `${option?.nombre || ""}${option?.codigo ? ` (${option.codigo})` : ""}`}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Buscar insumo"
                                                        size="small"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <SearchIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={textFieldSx}
                                                    />
                                                )}
                                            />
                                            {!form.sede_id && (
                                                <Typography sx={{ ...baseFontSx, mt: 0.5, fontSize: 11, color: ui.danger }}>
                                                    Seleccione una sede primero
                                                </Typography>
                                            )}
                                        </Box>

                                        <Divider sx={{ my: 1.25 }} />

                                        {form.items.length === 0 ? (
                                            <EmptyState label="AÚN NO HAY INSUMOS AGREGADOS" />
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 'var(--tg-radius-xs)' }}>
                                                <Table stickyHeader size="small" sx={tableSx}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ width: 100, textAlign: "center" }}>Cantidad</TableCell>
                                                            <TableCell>Insumo</TableCell>
                                                            <TableCell sx={{ width: 130 }}>Costo Un.</TableCell>
                                                            <TableCell sx={{ width: 130 }}>PVP Un.</TableCell>
                                                            <TableCell sx={{ width: 130 }}>Subtotal</TableCell>
                                                            <TableCell sx={{ width: 80, textAlign: "center" }}>Acción</TableCell>
                                                        </TableRow>
                                                    </TableHead>

                                                    <TableBody>
                                                        {rows.map((row, rowIdx) => {
                                                            const isDuplicate = rowIdx > 0 && rows[rowIdx - 1].producto_id === row.producto_id;
                                                            return (
                                                                <TableRow key={row.index} hover sx={{ "& td": { verticalAlign: "bottom", pb: 2 } }}>
                                                                    <TableCell>
                                                                        <TextField
                                                                            type="number"
                                                                            size="small"
                                                                            fullWidth
                                                                            value={row.cantidad}
                                                                            onChange={(e) => handleItemChange(row.index, "cantidad", e.target.value)}
                                                                            error={Boolean(errors[`item_${row.index}_cantidad`])}
                                                                            helperText={errors[`item_${row.index}_cantidad`] || ""}
                                                                            sx={textFieldSx}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {!isDuplicate ? (
                                                                            <>
                                                                                <Typography sx={{ ...baseFontSx, fontWeight: 800, fontSize: 12, color: ui.head }}>
                                                                                    {row.producto?.codigo ? `${row.producto.codigo} - ` : ""}
                                                                                    {row.producto?.nombre}
                                                                                </Typography>
                                                                                <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.3 }}>
                                                                                    {row.producto?.categoria?.nombre || "Sin categoría"}
                                                                                </Typography>
                                                                            </>
                                                                        ) : (
                                                                            <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.primary, fontStyle: "italic", fontWeight: 700 }}>
                                                                                {row.producto?.maneja_lotes ? "↳ Mismo insumo (Otro lote)" : "↳ Mismo insumo"}
                                                                            </Typography>
                                                                        )}
                                                                    {row.producto?.maneja_lotes && (
                                                                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                                                            <TextField
                                                                                size="small"
                                                                                placeholder="Lote"
                                                                                value={row.codigo_lote}
                                                                                onChange={(e) => handleItemChange(row.index, "codigo_lote", e.target.value)}
                                                                                error={Boolean(errors[`item_${row.index}_codigo_lote`])}
                                                                                sx={{ ...textFieldSx, width: 110 }}
                                                                            />
                                                                            <TextField
                                                                                type="date"
                                                                                size="small"
                                                                                label="F. Elab"
                                                                                InputLabelProps={{ shrink: true }}
                                                                                value={row.fecha_elaboracion || ""}
                                                                                onChange={(e) => handleItemChange(row.index, "fecha_elaboracion", e.target.value)}
                                                                                error={Boolean(errors[`item_${row.index}_fecha_elaboracion`])}
                                                                                sx={{ ...textFieldSx, width: 120 }}
                                                                            />
                                                                            {row.producto?.maneja_vencimiento && (
                                                                                <TextField
                                                                                    type="date"
                                                                                    size="small"
                                                                                    label="F. Venc"
                                                                                    InputLabelProps={{ shrink: true }}
                                                                                    value={row.fecha_vencimiento || ""}
                                                                                    onChange={(e) => handleItemChange(row.index, "fecha_vencimiento", e.target.value)}
                                                                                    error={Boolean(errors[`item_${row.index}_fecha_vencimiento`])}
                                                                                    sx={{ ...textFieldSx, width: 120 }}
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TextField
                                                                        type="number"
                                                                        size="small"
                                                                        fullWidth
                                                                        value={row.costo_unitario}
                                                                        onChange={(e) => handleItemChange(row.index, "costo_unitario", e.target.value)}
                                                                        error={Boolean(errors[`item_${row.index}_costo_unitario`])}
                                                                        helperText={errors[`item_${row.index}_costo_unitario`] || ""}
                                                                        sx={textFieldSx}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TextField
                                                                        type="number"
                                                                        size="small"
                                                                        fullWidth
                                                                        value={row.precio_unitario}
                                                                        onChange={(e) => handleItemChange(row.index, "precio_unitario", e.target.value)}
                                                                        error={Boolean(errors[`item_${row.index}_precio_unitario`])}
                                                                        helperText={errors[`item_${row.index}_precio_unitario`] || ""}
                                                                        sx={textFieldSx}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ pb: 3.5 }}>
                                                                    <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 700, color: ui.success }}>
                                                                        ${money(row.subtotal)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, pb: 0.5 }}>
                                                                        {row.producto?.maneja_lotes && (
                                                                            <IconButton onClick={() => addItem(row.producto)} sx={{ color: ui.primary }} title="Añadir otro lote" size="small">
                                                                                <AddCircleOutlineIcon fontSize="small" />
                                                                            </IconButton>
                                                                        )}
                                                                        <IconButton onClick={() => removeItem(row.index)} sx={{ color: ui.danger }} title="Eliminar" size="small">
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        )})}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Box>

                                {/* TOTALES Y ACCIONES */}
                                <Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", mt: 2 }}>
                                        
                                        {/* TOTALES ESTILO FACTURA */}
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 280, bgcolor: "#f8fafc", p: 2, borderRadius: 'var(--tg-radius-xs)', border: `1px solid ${ui.borderSoft}` }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography sx={{ ...baseFontSx, fontSize: 13, color: ui.muted, fontWeight: 700 }}>
                                                    Subtotal:
                                                </Typography>
                                                <Typography sx={{ ...baseFontSx, fontSize: 13, color: ui.head, fontWeight: 800 }}>
                                                    ${money(subtotal)}
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography sx={{ ...baseFontSx, fontSize: 13, color: ui.muted, fontWeight: 700 }}>
                                                    IVA ({form.iva_pct}%):
                                                </Typography>
                                                <Typography sx={{ ...baseFontSx, fontSize: 13, color: ui.head, fontWeight: 800 }}>
                                                    ${money(iva)}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ my: 0.5, borderColor: ui.border }} />

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography sx={{ ...baseFontSx, fontSize: 14, color: ui.head, fontWeight: 900 }}>
                                                    TOTAL:
                                                </Typography>
                                                <Typography sx={{ ...baseFontSx, fontSize: 18, color: ui.success, fontWeight: 900 }}>
                                                    ${money(total)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        {/* FOOTER DE ACCIONES */}
                                        <Box sx={{ display: "flex", gap: 1.5, mt: 3, width: "100%", justifyContent: "flex-end", pt: 2, borderTop: `1px solid ${ui.borderSoft}` }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<CloseIcon />}
                                                onClick={onClose}
                                                sx={{
                                                    ...baseFontSx,
                                                    height: 38,
                                                    borderRadius: 'var(--tg-radius-xs)',
                                                    fontSize: 13,
                                                    px: 2.5,
                                                    textTransform: "none",
                                                    borderColor: "#f2c6c2",
                                                    color: ui.danger,
                                                    "&:hover": { bgcolor: "#fff5f5", borderColor: ui.danger },
                                                }}
                                            >
                                                Cancelar
                                            </Button>

                                            <PremiumButton
                                                variant="guardar"
                                                onClick={handleSave}
                                                disabled={loading}
                                                loading={loading}
                                            >
                                                Guardar
                                            </PremiumButton>
                                        </Box>

                                    </Box>

                                    {errors.detalleProductos && (
                                        <Typography sx={{ ...baseFontSx, mt: 0.8, fontSize: 11, color: ui.danger, textAlign: "right" }}>
                                            {errors.detalleProductos}
                                        </Typography>
                                    )}
                                </Box>

                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </LocalizationProvider>
        </Dialog>
    );
}
