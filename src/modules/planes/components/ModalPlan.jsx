import { useEffect, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

export default function ModalPlan({ open, onClose, onSave, personas, dataEdit }) {
    const [form, setForm] = useState({
        id: null,
        persona_id: "",
        nombre: "",
        objetivo: "",
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: "",
        estado: "BORRADOR",
        observaciones: "",
    });

    useEffect(() => {
        if (!open) return;
        setForm({
            id: dataEdit?.id ?? null,
            persona_id: dataEdit?.persona_id ?? "",
            nombre: dataEdit?.nombre ?? "",
            objetivo: dataEdit?.objetivo ?? "",
            fecha_inicio: dataEdit?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
            fecha_fin: dataEdit?.fecha_fin ?? "",
            estado: dataEdit?.estado ?? "BORRADOR",
            observaciones: dataEdit?.observaciones ?? "",
        });
    }, [open, dataEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...form, persona_id: Number(form.persona_id) });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Editar Plan" : "Nuevo Plan"}
            subtitle="Crea un plan general para un cliente con fechas y objetivo"
            icon={<CalendarMonthIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={<>
                <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
                <PremiumButton variant="guardar" onClick={handleSubmit}>Guardar</PremiumButton>
            </>}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
                <Box>
                    <InputLabel sx={labelSx}>Cliente *</InputLabel>
                    <Select fullWidth size="small" value={form.persona_id} onChange={(e) => setForm((p) => ({ ...p, persona_id: e.target.value }))} sx={modalFieldSx}>
                        {personas.map((persona) => (
                            <MenuItem key={persona.id} value={persona.id}>{persona.nombres} · {persona.cedula}</MenuItem>
                        ))}
                    </Select>
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Nombre del plan *</InputLabel>
                    <TextField fullWidth size="small" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} sx={modalFieldSx} />
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Objetivo</InputLabel>
                    <TextField fullWidth size="small" value={form.objetivo} onChange={(e) => setForm((p) => ({ ...p, objetivo: e.target.value }))} sx={modalFieldSx} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Inicio *</InputLabel>
                        <TextField fullWidth size="small" type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Fin</InputLabel>
                        <TextField fullWidth size="small" type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Estado *</InputLabel>
                        <Select fullWidth size="small" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} sx={modalFieldSx}>
                            <MenuItem value="BORRADOR">Borrador</MenuItem>
                            <MenuItem value="ACTIVO">Activo</MenuItem>
                            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                        </Select>
                    </Box>
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Observaciones</InputLabel>
                    <TextField fullWidth size="small" multiline rows={3} value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} sx={modalFieldSx} />
                </Box>
            </Box>
        </PremiumModal>
    );
}
