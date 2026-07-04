import { useEffect, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

export default function ModalMembresiaPlan({ open, onClose, onSave, isEditMode, dataEdit }) {
    const [form, setForm] = useState({
        id: null,
        nombre: "",
        descripcion: "",
        duracion_dias: 30,
        precio: "",
        activa: true,
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            id: dataEdit?.id ?? null,
            nombre: dataEdit?.nombre ?? "",
            descripcion: dataEdit?.descripcion ?? "",
            duracion_dias: dataEdit?.duracion_dias ?? 30,
            precio: dataEdit?.precio ?? "",
            activa: dataEdit?.activa ?? true,
        });
    }, [open, dataEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            duracion_dias: Number(form.duracion_dias),
            precio: Number(form.precio || 0),
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={isEditMode ? "Editar Plan de Membresía" : "Nuevo Plan de Membresía"}
            subtitle="Configura nombre, duración, precio y estado del plan"
            icon={<WorkspacePremiumIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={
                <>
                    <PremiumButton variant="cancelar" onClick={onClose}>
                        Cancelar
                    </PremiumButton>
                    <PremiumButton variant="guardar" onClick={handleSubmit}>
                        Guardar
                    </PremiumButton>
                </>
            }
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.4fr 0.8fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Nombre del plan *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            value={form.nombre}
                            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                            sx={modalFieldSx}
                            placeholder="Ej. Revive Gold"
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Estado *</InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            value={form.activa ? "ACTIVA" : "INACTIVA"}
                            onChange={(e) => setForm((prev) => ({ ...prev, activa: e.target.value === "ACTIVA" }))}
                            sx={modalFieldSx}
                        >
                            <MenuItem value="ACTIVA">Activa</MenuItem>
                            <MenuItem value="INACTIVA">Inactiva</MenuItem>
                        </Select>
                    </Box>
                </Box>

                <Box>
                    <InputLabel sx={labelSx}>Descripción</InputLabel>
                    <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                        sx={modalFieldSx}
                        placeholder="Resumen comercial y operativo de la membresía"
                    />
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Duración (días) *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={form.duracion_dias}
                            onChange={(e) => setForm((prev) => ({ ...prev, duracion_dias: e.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Precio base *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            inputProps={{ step: "0.01" }}
                            value={form.precio}
                            onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
                            sx={modalFieldSx}
                            placeholder="60.00"
                        />
                    </Box>
                </Box>
            </Box>
        </PremiumModal>
    );
}
