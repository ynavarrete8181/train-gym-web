import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { modalFieldSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import Swal from "sweetalert2";

const today = () => new Date().toISOString().slice(0, 10);

const createInitialForm = (plan) => ({
    sede_id: "",
    precio: plan?.precio_base ?? plan?.precio ?? "",
    vigencia_inicio: today(),
    vigencia_fin: "",
    activa: true,
});

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 700,
    color: "#0f172a",
};

export default function ModalPreciosMembresia({ open, onClose, membresia, sedes = [], onSaved }) {
    const [precios, setPrecios] = useState([]);
    const [form, setForm] = useState(createInitialForm(membresia));
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const membresiaId = membresia?.id;
    const precioBase = Number(membresia?.precio_base ?? membresia?.precio ?? 0);

    const sedeLabel = useMemo(() => {
        if (!form.sede_id) return "Selecciona una sede";
        return sedes.find((sede) => Number(sede.id) === Number(form.sede_id))?.nombre ?? "Sede seleccionada";
    }, [form.sede_id, sedes]);

    const fetchPrecios = async () => {
        if (!membresiaId) return;
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/gimnasio/membresias/${membresiaId}/precios`);
            setPrecios(Array.isArray(data) ? data : []);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el historial de precios."), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setEditId(null);
        setForm(createInitialForm(membresia));
        fetchPrecios();
    }, [open, membresiaId]);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.sede_id) {
            Swal.fire("Atención", "Selecciona la sede para este precio.", "warning");
            return;
        }
        if (form.precio === "" || Number(form.precio) < 0) {
            Swal.fire("Atención", "Ingresa un precio válido.", "warning");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                sede_id: Number(form.sede_id),
                precio: Number(form.precio),
                vigencia_inicio: form.vigencia_inicio || null,
                vigencia_fin: form.vigencia_fin || null,
                activa: form.activa,
            };

            if (editId) {
                await apiClient.put(`/gimnasio/membresia-precios/${editId}`, payload);
            } else {
                await apiClient.post(`/gimnasio/membresias/${membresiaId}/precios`, payload);
            }

            await fetchPrecios();
            await onSaved?.();
            setEditId(null);
            setForm(createInitialForm(membresia));
            Swal.fire("Éxito", editId ? "Precio actualizado." : "Precio registrado.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el precio."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setForm({
            sede_id: String(item.sede_id),
            precio: item.precio,
            vigencia_inicio: item.vigencia_inicio?.slice(0, 10) || today(),
            vigencia_fin: item.vigencia_fin?.slice(0, 10) || "",
            activa: item.activa,
        });
    };

    const handleDelete = async (id) => {
        const res = await Swal.fire({
            title: "¿Desactivar precio?",
            text: "Este precio dejará de aplicarse para la sede.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#ef4444",
        });

        if (!res.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/membresia-precios/${id}`);
            await fetchPrecios();
            await onSaved?.();
            Swal.fire("Éxito", "Precio desactivado.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo desactivar el precio."), "error");
        }
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title="Gestión de precios"
            subtitle={membresia?.nombre || "Membresía"}
            icon={<PaymentsOutlinedIcon sx={{ fontSize: 22, color: "#fbbf24" }} />}
            maxWidth="md"
            actions={
                <PremiumButton variant="cancelar" onClick={onClose}>
                    Cancelar
                </PremiumButton>
            }
        >
            <Box sx={{ display: "grid", gap: 2.5 }}>
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <Typography sx={{ mb: 1.5, color: "#0f172a", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        {editId ? "Modificar precio" : "Registrar nuevo precio"}
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" } }}>
                        <Box>
                            <InputLabel sx={labelSx}>Sede de aplicación</InputLabel>
                            <Select
                                fullWidth
                                size="small"
                                value={form.sede_id}
                                onChange={(e) => handleChange("sede_id", e.target.value)}
                                displayEmpty
                                sx={modalFieldSx}
                                renderValue={() => sedeLabel}
                            >
                                <MenuItem value="">Selecciona una sede</MenuItem>
                                {sedes.map((sede) => (
                                    <MenuItem key={sede.id} value={String(sede.id)}>
                                        {sede.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <Box>
                            <InputLabel sx={labelSx}>Precio</InputLabel>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ step: "0.01" }}
                                value={form.precio}
                                onChange={(e) => handleChange("precio", e.target.value)}
                                sx={modalFieldSx}
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                        <TextField
                            label="Desde"
                            type="date"
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={form.vigencia_inicio}
                            onChange={(e) => handleChange("vigencia_inicio", e.target.value)}
                            sx={modalFieldSx}
                        />
                        <TextField
                            label="Hasta"
                            type="date"
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={form.vigencia_fin}
                            onChange={(e) => handleChange("vigencia_fin", e.target.value)}
                            sx={modalFieldSx}
                        />
                    </Box>
                    <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`Base actual: $${precioBase.toFixed(2)}`} size="small" sx={{ bgcolor: "#fff", border: "1px solid #e2e8f0", fontWeight: 800 }} />
                            <Chip label={`${precios.filter((p) => p.activa).length} precio(s) activo(s)`} size="small" sx={semanticChipSx("neutral")} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            {editId && (
                                <PremiumButton variant="cancelar" onClick={() => { setEditId(null); setForm(createInitialForm(membresia)); }}>
                                    Cancelar edición
                                </PremiumButton>
                            )}
                            <PremiumButton variant="guardar" onClick={handleSave} loading={saving}>
                                Guardar
                            </PremiumButton>
                        </Stack>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #e2e8f0" }}>
                        <HistoryIcon sx={{ color: "#d97706", fontSize: 19 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "#0f172a" }}>Historial de precios</Typography>
                    </Box>
                    {loading ? (
                        <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
                            <CircularProgress size={28} sx={{ color: "#d97706" }} />
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ ...tableSx, minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sede</TableCell>
                                        <TableCell align="right">Precio</TableCell>
                                        <TableCell>Vigencia</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {precios.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#64748b" }}>
                                                No hay precios por sede configurados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        precios.map((precio) => (
                                            <TableRow key={precio.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 800 }}>{precio.sede_nombre}</Typography>
                                                </TableCell>
                                                <TableCell align="right">${Number(precio.precio || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {precio.vigencia_inicio?.slice(0, 10) || "Sin inicio"}
                                                    {precio.vigencia_fin ? ` - ${precio.vigencia_fin.slice(0, 10)}` : " - sin fin"}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={precio.activa ? "Activo" : "Inactivo"} size="small" sx={semanticChipSx(precio.activa ? "success" : "neutral")} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => handleEdit(precio)} sx={semanticIconButtonSx("mustard")}>
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(precio.id)} sx={{ ...semanticIconButtonSx("danger"), ml: 1 }}>
                                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Paper>
            </Box>
        </PremiumModal>
    );
}
