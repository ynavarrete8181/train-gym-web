import { useEffect, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

export default function ModalAsignacionPlanEntrenamiento({
    open,
    onClose,
    onSave,
    dataEdit,
    plan,
    personas,
}) {
    const [form, setForm] = useState({
        persona_ids: [],
        persona_id: "",
        nombre_grupo: "",
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: "",
        estado: "ACTIVO",
        observaciones: "",
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            persona_ids: dataEdit?.isGrouped ? (dataEdit.persona_ids || []) : [],
            persona_id: dataEdit?.persona_id ?? "",
            nombre_grupo_original: dataEdit?.nombre_grupo ?? "",
            nombre_grupo: dataEdit?.nombre_grupo ?? "",
            fecha_inicio: dataEdit?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
            fecha_fin: dataEdit?.fecha_fin ?? "",
            estado: dataEdit?.estado ?? "ACTIVO",
            observaciones: dataEdit?.observaciones ?? "",
        });
    }, [open, dataEdit]);

    const isIndividual = plan?.alcance === "INDIVIDUAL";

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = { ...form };
        if (dataEdit?.isGrouped) {
            payload.persona_ids = form.persona_ids;
            payload.is_sync_group = true;
            delete payload.persona_id;
        } else if (!dataEdit?.id) {
            payload.persona_ids = form.persona_ids;
            delete payload.persona_id;
        } else {
            payload.persona_id = form.persona_id ? Number(form.persona_id) : null;
            delete payload.persona_ids;
        }
        onSave(payload);
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit?.id ? "Editar asignación del plan" : "Nueva asignación del plan"}
            subtitle={`Conecta el plan con ${isIndividual ? "un cliente" : "un grupo"} para su uso real.`}
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
                {isIndividual ? (
                    <Box>
                        <InputLabel sx={labelSx}>Cliente *</InputLabel>
                        {!dataEdit?.id ? (
                            <Select
                                fullWidth
                                multiple
                                size="small"
                                value={form.persona_ids}
                                onChange={(event) => setForm((prev) => ({ ...prev, persona_ids: event.target.value }))}
                                sx={modalFieldSx}
                            >
                                {personas.map((persona) => (
                                    <MenuItem key={persona.persona_id} value={persona.persona_id}>
                                        {persona.codigo_socio ? `${persona.codigo_socio} - ` : ""}{persona.nombre_completo}
                                    </MenuItem>
                                ))}
                            </Select>
                        ) : (
                            <Select
                                fullWidth
                                size="small"
                                value={form.persona_id}
                                onChange={(event) => setForm((prev) => ({ ...prev, persona_id: event.target.value }))}
                                sx={modalFieldSx}
                            >
                                {personas.map((persona) => (
                                    <MenuItem key={persona.persona_id} value={persona.persona_id}>
                                        {persona.codigo_socio ? `${persona.codigo_socio} - ` : ""}{persona.nombre_completo}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Box>
                            <InputLabel sx={labelSx}>Nombre del grupo *</InputLabel>
                            <TextField
                                fullWidth
                                size="small"
                                value={form.nombre_grupo}
                                onChange={(event) => setForm((prev) => ({ ...prev, nombre_grupo: event.target.value }))}
                                sx={modalFieldSx}
                                placeholder="Ej. Grupo 6AM / Funcional mañana"
                            />
                        </Box>
                        <Box>
                            <InputLabel sx={labelSx}>Clientes del grupo</InputLabel>
                            {(!dataEdit?.id || dataEdit?.isGrouped) ? (
                                <Select
                                    fullWidth
                                    multiple
                                    size="small"
                                    value={form.persona_ids}
                                    onChange={(event) => setForm((prev) => ({ ...prev, persona_ids: event.target.value }))}
                                    sx={modalFieldSx}
                                >
                                    {personas.map((persona) => (
                                        <MenuItem key={persona.persona_id} value={persona.persona_id}>
                                            {persona.codigo_socio ? `${persona.codigo_socio} - ` : ""}{persona.nombre_completo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            ) : (
                                <Select
                                    fullWidth
                                    size="small"
                                    value={form.persona_id}
                                    onChange={(event) => setForm((prev) => ({ ...prev, persona_id: event.target.value }))}
                                    sx={modalFieldSx}
                                >
                                    <MenuItem value="">(Ninguno)</MenuItem>
                                    {personas.map((persona) => (
                                        <MenuItem key={persona.persona_id} value={persona.persona_id}>
                                            {persona.codigo_socio ? `${persona.codigo_socio} - ` : ""}{persona.nombre_completo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </Box>
                    </Box>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Inicio</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.fecha_inicio}
                            onChange={(event) => setForm((prev) => ({ ...prev, fecha_inicio: event.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Fin</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={form.fecha_fin}
                            onChange={(event) => setForm((prev) => ({ ...prev, fecha_fin: event.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Estado *</InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            value={form.estado}
                            onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
                            sx={modalFieldSx}
                        >
                            <MenuItem value="ACTIVO">Activo</MenuItem>
                            <MenuItem value="PAUSADO">Pausado</MenuItem>
                            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                        </Select>
                    </Box>
                </Box>

                <Box>
                    <InputLabel sx={labelSx}>Observaciones</InputLabel>
                    <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={3}
                        value={form.observaciones}
                        onChange={(event) => setForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                        sx={modalFieldSx}
                    />
                </Box>
            </Box>
        </PremiumModal>
    );
}
