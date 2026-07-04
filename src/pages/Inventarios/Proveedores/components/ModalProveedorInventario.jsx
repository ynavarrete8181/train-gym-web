import { useState, useEffect } from "react";
import { Grid, InputLabel, Switch, Typography, Box, TextField } from "@mui/material";
import Swal from "sweetalert2";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { apiClient } from "../../../../services/apiClient";
import { modalFieldSx, tgAccent, tgSemantic } from "../../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
    danger: tgSemantic.danger.color,
    success: tgSemantic.success.color,
    mustard: tgAccent.mustard,
};
const globalInputSx = modalFieldSx;

export default function ModalProveedorInventario({
    open,
    onClose,
    dataEdit = null,
    onSubmit,
}) {
    const [loadingSave, setLoadingSave] = useState(false);
    const [form, setForm] = useState({
        ruc: "",
        nombre: "",
        direccion: "",
        telefono: "",
        correo: "",
        estado: true,
    });

    useEffect(() => {
        if (open) {
            if (dataEdit) {
                setForm({
                    ruc: dataEdit.ruc || "",
                    nombre: dataEdit.nombre || "",
                    direccion: dataEdit.direccion || "",
                    telefono: dataEdit.telefono || "",
                    correo: dataEdit.correo || "",
                    estado: dataEdit.estado === 1,
                });
            } else {
                setForm({
                    ruc: "",
                    nombre: "",
                    direccion: "",
                    telefono: "",
                    correo: "",
                    estado: true,
                });
            }
        }
    }, [open, dataEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        if (!form.nombre.trim()) {
            Swal.fire({
                title: "Campo requerido",
                text: "El nombre del proveedor es obligatorio.",
                icon: "warning",
                confirmButtonColor: ui.mustard,
            });
            return;
        }

        setLoadingSave(true);
        try {
            const payload = {
                ruc: form.ruc.trim(),
                nombre: form.nombre.trim(),
                direccion: form.direccion.trim(),
                telefono: form.telefono.trim(),
                correo: form.correo.trim(),
                estado: form.estado ? 1 : 0,
            };

            const url = dataEdit?.id
                ? `/inventario/proveedores/${dataEdit.id}`
                : "/inventario/proveedores";

            const method = dataEdit?.id ? "put" : "post";

            await apiClient[method](url, payload);

            Swal.fire({
                title: "Éxito",
                text: `Proveedor ${dataEdit?.id ? "actualizado" : "creado"} correctamente.`,
                icon: "success",
                confirmButtonColor: ui.success,
            });

            onSubmit(); // Refresca la tabla
            onClose(); // Cierra el modal
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.response?.data?.message || "No se pudo guardar el proveedor.",
                icon: "error",
                confirmButtonColor: ui.danger,
            });
        } finally {
            setLoadingSave(false);
        }
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Modificar proveedor" : "Registrar proveedor"}
            subtitle="Ingresa o edita los datos comerciales del proveedor"
            icon={<Inventory2Icon sx={{ fontSize: 22, color: "#fff" }} />}
            actions={
                <>
                    <PremiumButton variant="cancelar" onClick={onClose} disabled={loadingSave}>
                        Cancelar
                    </PremiumButton>
                    <PremiumButton
                        variant="guardar"
                        onClick={handleSubmit}
                        loading={loadingSave}
                        disabled={loadingSave}
                    >
                        Guardar
                    </PremiumButton>
                </>
            }
        >
            <Box sx={{ width: "100%", mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Fila 1 */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" }, gap: 2 }}>
                <Box>
                    <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                        RUC / Identificación
                    </InputLabel>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        name="ruc"
                        value={form.ruc}
                        onChange={handleChange}
                        placeholder="Ej. 0992334411001"
                        sx={globalInputSx}
                    />
                </Box>
                <Box>
                    <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                        Nombre Comercial *
                    </InputLabel>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Ej. Distribuidora Global S.A."
                        sx={globalInputSx}
                    />
                </Box>
                </Box>

                {/* Fila 2 */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                <Box>
                    <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                        Dirección
                    </InputLabel>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                        placeholder="Ubicación física"
                        sx={globalInputSx}
                    />
                </Box>
                </Box>

                {/* Fila 3 */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                    <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                        Teléfono
                    </InputLabel>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="Número de contacto"
                        sx={globalInputSx}
                    />
                </Box>
                <Box>
                    <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                        Correo
                    </InputLabel>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        name="correo"
                        value={form.correo}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        sx={globalInputSx}
                    />
                </Box>
                </Box>

                {/* Fila 4 */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1.5,
                            mt: 1,
                            bgcolor: ui.bg,
                            border: `1px solid ${ui.border}`,
                            borderRadius: "8px",
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: ui.text }}>
                                Proveedor Activo
                            </Typography>
                            <Typography sx={{ fontSize: "11px", color: ui.muted }}>
                                Desactívalo si ya no trabajas con este proveedor.
                            </Typography>
                        </Box>
                        <Switch
                            name="estado"
                            checked={form.estado}
                            onChange={handleChange}
                            color="success"
                        />
                    </Box>
                </Box>
                </Box>
            </Box>
        </PremiumModal>
    );
}
