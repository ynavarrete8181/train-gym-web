import { useEffect, useMemo, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

const addDays = (dateString, days) => {
    if (!dateString || !days) return "";
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().slice(0, 10);
};

export default function ModalAsignacionMembresia({
    open,
    onClose,
    onSave,
    isEditMode,
    dataEdit,
    socios,
    membresias,
}) {
    const [form, setForm] = useState({
        id: null,
        socio_id: "",
        membresia_id: "",
        fecha_inicio: "",
        fecha_fin: "",
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            id: dataEdit?.id ?? null,
            socio_id: dataEdit?.socio_id ?? "",
            membresia_id: dataEdit?.membresia_id ?? "",
            fecha_inicio: dataEdit?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
            fecha_fin: dataEdit?.fecha_fin ?? "",
        });
    }, [open, dataEdit]);

    const selectedPlan = useMemo(
        () => membresias.find((item) => Number(item.id) === Number(form.membresia_id)),
        [membresias, form.membresia_id]
    );

    useEffect(() => {
        if (!form.fecha_inicio || !selectedPlan || isEditMode) return;

        setForm((prev) => ({
            ...prev,
            fecha_fin: addDays(prev.fecha_inicio, selectedPlan.duracion_dias),
        }));
    }, [form.fecha_inicio, selectedPlan, isEditMode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            socio_id: Number(form.socio_id),
            membresia_id: Number(form.membresia_id),
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={isEditMode ? "Editar Asignación de Membresía" : "Asignar Membresía a Socio"}
            subtitle="Relaciona un socio con un plan y su vigencia"
            icon={<AssignmentTurnedInIcon sx={{ fontSize: 22, color: "#fff" }} />}
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
                <Box>
                    <InputLabel sx={labelSx}>Socio *</InputLabel>
                    <Select
                        fullWidth
                        size="small"
                        value={form.socio_id}
                        onChange={(e) => setForm((prev) => ({ ...prev, socio_id: e.target.value }))}
                        sx={modalFieldSx}
                    >
                        {socios.map((socio) => (
                            <MenuItem key={socio.socio_id} value={socio.socio_id}>
                                {socio.codigo_socio} - {socio.nombre_completo}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <Box>
                    <InputLabel sx={labelSx}>Plan de membresía *</InputLabel>
                    <Select
                        fullWidth
                        size="small"
                        value={form.membresia_id}
                        onChange={(e) => setForm((prev) => ({ ...prev, membresia_id: e.target.value }))}
                        sx={modalFieldSx}
                    >
                        {membresias.map((membresia) => (
                            <MenuItem key={membresia.id} value={membresia.id}>
                                {membresia.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Fecha inicio *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.fecha_inicio}
                            onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Fecha fin *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.fecha_fin}
                            onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                </Box>
            </Box>
        </PremiumModal>
    );
}
