import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import logo from "../../../../assets/imagenes/logo.jpeg";
import { apiClient, getApiErrorMessage, openModalSwal } from "../../../../services/apiClient";
import { tgAccent } from "../../../../Styles/muiTheme";
import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";

const ui = {
    black: "#0f172a",
    mustard: tgAccent.mustard,
    success: "#2e7d32",
    danger: "#ef4444",
    border: "#e2e8f0",
    muted: "#64748b",
    bg: "#f8fafc",
};

const BORDER_RADIUS = "6px";

const premiumInputSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
        borderRadius: BORDER_RADIUS,
        backgroundColor: "#fff",
        "& fieldset": { borderColor: "#cbd5e1" },
        "&:hover fieldset": { borderColor: ui.mustard },
        "&.Mui-focused fieldset": { borderColor: ui.mustard, borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": {
        fontSize: "12px",
        fontWeight: 600,
        color: ui.muted,
        "&.Mui-focused": { color: ui.mustard },
    },
};

const menuProps = {
    PaperProps: {
        sx: {
            borderRadius: BORDER_RADIUS,
            mt: 0.5,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            "& .MuiMenuItem-root": { fontSize: "12px", py: 1 },
        },
    },
};

const defaultForm = {
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria_id: "",
    marca: "",
    modelo: "",
    sku: "",
    codigo_barras: "",
    unidad_medida: "unidad",
    controla_stock: true,
    permite_decimales: false,
    maneja_lotes: false,
    maneja_vencimiento: false,
    estado: true,
    imagen_url: "",
    remove_imagen: false,
};

const unidades = [
    { value: "unidad", label: "Unidad" },
    { value: "caja", label: "Caja" },
    { value: "botella", label: "Botella" },
    { value: "lata", label: "Lata" },
    { value: "sobre", label: "Sobre" },
    { value: "kg", label: "Kilogramo" },
    { value: "g", label: "Gramo" },
    { value: "lt", label: "Litro" },
    { value: "ml", label: "Mililitro" },
];

const createDefaultForm = () => ({
    ...defaultForm,
});

export default function ModalProductoInventario({
    open,
    onClose,
    dataEdit,
    categorias = [],
    onSaved,
}) {
    const [form, setForm] = useState(createDefaultForm);
    const [loadingSave, setLoadingSave] = useState(false);
    const [imagenFile, setImagenFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (!open) return;

        if (dataEdit) {
            setForm({
                codigo: dataEdit.codigo || "",
                nombre: dataEdit.nombre || "",
                descripcion: dataEdit.descripcion || "",
                categoria_id: dataEdit.categoria_id || "",
                marca: dataEdit.marca || "",
                modelo: dataEdit.modelo || "",
                sku: dataEdit.sku || "",
                codigo_barras: dataEdit.codigo_barras || "",
                unidad_medida: dataEdit.unidad_medida || "unidad",
                controla_stock: !!dataEdit.controla_stock,
                permite_decimales: !!dataEdit.permite_decimales,
                maneja_lotes: !!dataEdit.maneja_lotes,
                maneja_vencimiento: !!dataEdit.maneja_vencimiento,
                estado: String(dataEdit.estado) === "1",
                imagen_url: dataEdit.imagen_url || "",
                remove_imagen: false,
            });
            setPreviewUrl(dataEdit.imagen_url || "");
        } else {
            setForm(createDefaultForm());
            setPreviewUrl("");
        }

        setImagenFile(null);
    }, [dataEdit, open]);

    useEffect(() => {
        if (!imagenFile) return undefined;
        const objectUrl = URL.createObjectURL(imagenFile);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imagenFile]);

    const handleChange = (key, value) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };

            if (key === "maneja_vencimiento" && value) {
                next.maneja_lotes = true;
            }

            return next;
        });

    };

    const handleImageFile = (file) => {
        setImagenFile(file);
        if (file) {
            setForm((prev) => ({ ...prev, remove_imagen: false }));
        }
    };

    const handleRemoveImage = () => {
        setImagenFile(null);
        setPreviewUrl("");
        setForm((prev) => ({ ...prev, imagen_url: "", remove_imagen: true }));
    };

    const handleSubmit = async () => {
        if (!form.categoria_id) {
            openModalSwal({
                title: "Atención",
                text: "Seleccione una categoría.",
                icon: "warning",
                confirmButtonColor: ui.black,
            });
            return;
        }

        if (!String(form.nombre || "").trim()) {
            openModalSwal({
                title: "Atención",
                text: "Ingrese el nombre del producto.",
                icon: "warning",
                confirmButtonColor: ui.black,
            });
            return;
        }

        setLoadingSave(true);
        const payload = new FormData();

        Object.entries(form).forEach(([key, rawValue]) => {
            let value = rawValue;

            if (typeof value === "boolean") value = value ? "1" : "0";
            if (["stock_maximo"].includes(key) && value === "") return;
            if (["imagen", "imagen_url"].includes(key)) return;

            payload.append(key, String(value ?? "").trim());
        });

        // Asegurar que se envíen los campos de precio para evitar errores de validación del backend
        if (!payload.has("precio_costo")) payload.append("precio_costo", "0");
        if (!payload.has("precio_venta")) payload.append("precio_venta", "0");

        if (imagenFile) {
            payload.append("imagen", imagenFile);
        }

        try {
            const url = dataEdit?.id
                ? `/inventario/productos/${dataEdit.id}?_method=PUT`
                : "/inventario/productos";

            await apiClient.post(url, payload, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            openModalSwal({
                title: "Listo",
                text: dataEdit ? "Producto actualizado con éxito." : "Producto registrado con éxito.",
                icon: "success",
                confirmButtonColor: ui.black,
            });

            setForm(createDefaultForm());
            setImagenFile(null);
            setPreviewUrl("");
            onSaved?.();
            onClose();
        } catch (error) {
            openModalSwal({
                title: "Error",
                text: getApiErrorMessage(error, "Ocurrió un error al guardar el producto."),
                icon: "error",
                confirmButtonColor: ui.danger,
            });
        } finally {
            setLoadingSave(false);
        }
    };

    const sectionTitle = (icon, text) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography sx={{ color: ui.mustard, display: "flex", alignItems: "center" }}>{icon}</Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: 800, color: ui.black, letterSpacing: "0.2px" }}>
                {text}
            </Typography>
        </Stack>
    );

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Modificar producto" : "Registrar producto"}
            subtitle="Configura la información y el control de inventario de este producto."
            icon={<Inventory2Icon sx={{ fontSize: 22, color: "#fff" }} />}
            actions={
                <>
                    <PremiumButton variant="cancelar" onClick={onClose}>
                        Cancelar
                    </PremiumButton>
                    <PremiumButton variant="guardar" onClick={handleSubmit} loading={loadingSave}>
                        Guardar
                    </PremiumButton>
                </>
            }
        >
                <Stack spacing={1.6}>
                    <Paper elevation={0} sx={{ p: 1.6, border: `1px solid ${ui.border}`, borderRadius: "10px", bgcolor: ui.bg }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                            <Box sx={{ width: { xs: "100%", sm: "92px" }, height: { xs: "150px", sm: "92px" }, borderRadius: "8px", bgcolor: ui.black, overflow: "hidden", border: `2px solid ${ui.mustard}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Box component="img" src={previewUrl || logo} sx={{ width: "100%", height: "100%", objectFit: "contain", opacity: previewUrl ? 1 : 0.45 }} />
                            </Box>
                            <Stack spacing={0.9} sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: ui.black }}>
                                    Imagen del producto
                                </Typography>
                                <Typography sx={{ fontSize: "11px", color: ui.muted }}>
                                    Mantén una foto cuadrada para que se vea mejor en productos y ventas.
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<UploadFileOutlinedIcon sx={{ color: ui.mustard }} />}
                                        sx={{ border: `1px solid ${ui.mustard} !important`, color: ui.black, fontWeight: 800, textTransform: "none", fontSize: "12px", borderRadius: "8px", px: 1.8, py: 0.55 }}
                                    >
                                        Cargar foto
                                        <input hidden type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
                                    </Button>
                                    {previewUrl && (
                                        <Button onClick={handleRemoveImage} variant="text" sx={{ color: ui.danger, fontWeight: 700, textTransform: "none", fontSize: "12px", px: 0.8 }}>
                                            Quitar foto
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Stack>
                    </Paper>

                    <FormControl fullWidth size="small" sx={premiumInputSx}>
                        <InputLabel>Categoría *</InputLabel>
                        <Select
                            label="Categoría *"
                            value={form.categoria_id}
                            onChange={(e) => handleChange("categoria_id", e.target.value)}
                            IconComponent={KeyboardArrowDownIcon}
                            MenuProps={menuProps}
                            sx={{ height: "38px", minWidth: 0 }}
                        >
                            <MenuItem value=""><em>Seleccione...</em></MenuItem>
                            {categorias.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Descripción"
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        value={form.descripcion}
                        onChange={(e) => handleChange("descripcion", e.target.value)}
                        sx={premiumInputSx}
                    />

                    <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <TextField label="Código" fullWidth size="small" value={form.codigo} onChange={(e) => handleChange("codigo", e.target.value)} sx={premiumInputSx} InputProps={{ sx: { height: "38px" } }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small" sx={premiumInputSx}>
                                <InputLabel>U. Medida</InputLabel>
                                <Select label="U. Medida" value={form.unidad_medida} onChange={(e) => handleChange("unidad_medida", e.target.value)} IconComponent={KeyboardArrowDownIcon} MenuProps={menuProps} sx={{ height: "38px", minWidth: 0 }}>
                                    {unidades.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControlLabel
                                control={<Checkbox checked={form.estado} onChange={(e) => handleChange("estado", e.target.checked)} sx={{ color: ui.mustard, "&.Mui-checked": { color: ui.mustard }, py: 0.5 }} />}
                                label={<Typography sx={{ fontSize: "12px", fontWeight: 700 }}>Activo</Typography>}
                                sx={{ ml: 0.25 }}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="Nombre del producto *"
                        fullWidth
                        size="small"
                        value={form.nombre}
                        onChange={(e) => handleChange("nombre", e.target.value)}
                        sx={premiumInputSx}
                        InputProps={{ sx: { height: "38px" } }}
                    />

                    <Box sx={{ pt: 0.5 }}>
                        {sectionTitle(<SettingsSuggestOutlinedIcon fontSize="small" />, "Configuración para el control de inventario")}
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Checkbox checked={form.controla_stock} onChange={(e) => handleChange("controla_stock", e.target.checked)} sx={{ color: "#64748b", "&.Mui-checked": { color: ui.mustard }, py: 0.5 }} />} label={<Typography sx={{ fontSize: "12px", fontWeight: 500 }}>Controla stock</Typography>} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Checkbox checked={form.permite_decimales} onChange={(e) => handleChange("permite_decimales", e.target.checked)} sx={{ color: "#64748b", "&.Mui-checked": { color: ui.mustard }, py: 0.5 }} />} label={<Typography sx={{ fontSize: "12px", fontWeight: 500 }}>Permite decimales</Typography>} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Checkbox checked={form.maneja_lotes} onChange={(e) => handleChange("maneja_lotes", e.target.checked)} sx={{ color: "#64748b", "&.Mui-checked": { color: ui.mustard }, py: 0.5 }} />} label={<Typography sx={{ fontSize: "12px", fontWeight: 500 }}>Requiere lote</Typography>} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Checkbox checked={form.maneja_vencimiento} onChange={(e) => handleChange("maneja_vencimiento", e.target.checked)} sx={{ color: "#64748b", "&.Mui-checked": { color: ui.mustard }, py: 0.5 }} />} label={<Typography sx={{ fontSize: "12px", fontWeight: 500 }}>Requiere vencimiento</Typography>} />
                            </Grid>
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ px: 1.5, py: 1.15, borderRadius: "8px", bgcolor: "#fffaf0", border: `1px solid ${ui.border}` }}>
                                    <Typography sx={{ fontSize: "11px", color: ui.muted }}>
                                        {form.maneja_lotes
                                            ? form.maneja_vencimiento
                                                ? "Este producto se controlará por bodega, lote y fecha de vencimiento."
                                                : "Este producto se controlará por bodega y lote."
                                            : "Este producto se controlará únicamente por bodega."}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Stack>
        </PremiumModal>
    );
}
