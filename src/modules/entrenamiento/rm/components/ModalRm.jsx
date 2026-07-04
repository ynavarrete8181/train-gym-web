import { useEffect, useMemo, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField, Typography, Tooltip, Stack, Autocomplete } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

const calcEstimatedRm = (peso, reps) => {
    const p = Number(peso || 0);
    const r = Number(reps || 0);
    if (!p) return 0;
    if (!r || r <= 1) return p;
    return Number((p * (1 + r / 30)).toFixed(2));
};

export default function ModalRm({ open, onClose, onSave, personas, ejercicios, dataEdit }) {
    const [form, setForm] = useState({
        id: null,
        persona_id: "",
        ejercicio_id: "",
        tipo_registro: "ESTIMADO",
        peso: "",
        repeticiones: "",
        rm_estimado: "",
        fecha_registro: new Date().toISOString().slice(0, 10),
        fecha_proximo_control: "",
        observaciones: "",
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            id: dataEdit?.id ?? null,
            persona_id: dataEdit?.persona_id ?? "",
            ejercicio_id: dataEdit?.ejercicio_id ?? "",
            tipo_registro: dataEdit?.tipo_registro ?? "ESTIMADO",
            peso: dataEdit?.peso ?? "",
            repeticiones: dataEdit?.repeticiones ?? "",
            rm_estimado: dataEdit?.rm_estimado ?? "",
            fecha_registro: dataEdit?.fecha_registro ?? new Date().toISOString().slice(0, 10),
            fecha_proximo_control: dataEdit?.fecha_proximo_control ?? "",
            observaciones: dataEdit?.observaciones ?? "",
        });
    }, [open, dataEdit]);

    const estimated = useMemo(() => calcEstimatedRm(form.peso, form.repeticiones), [form.peso, form.repeticiones]);

    useEffect(() => {
        if (form.tipo_registro === "ESTIMADO") {
            setForm((prev) => ({ ...prev, rm_estimado: estimated }));
        }
    }, [estimated, form.tipo_registro]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            persona_id: Number(form.persona_id),
            ejercicio_id: Number(form.ejercicio_id),
            peso: Number(form.peso),
            repeticiones: form.repeticiones ? Number(form.repeticiones) : null,
            rm_estimado: Number(form.rm_estimado || estimated || 0),
            fecha_proximo_control: form.fecha_proximo_control || null,
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Editar Registro RM" : "Nuevo Registro RM"}
            subtitle="Guarda RM directa o estimada por ejercicio"
            icon={<FitnessCenterIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={<>
                <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
                <PremiumButton variant="guardar" onClick={handleSubmit}>Guardar</PremiumButton>
            </>}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Cliente *</InputLabel>
                        <Autocomplete
                            options={personas}
                            getOptionLabel={(p) => `${p.nombres} ${p.apellidos || ""} - ${p.numero_identificacion || p.cedula_ruc || p.cedula || ""}`.trim()}
                            value={personas.find(p => p.id === form.persona_id) || null}
                            onChange={(event, newValue) => {
                                setForm((p) => ({ ...p, persona_id: newValue ? newValue.id : "" }));
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    variant="outlined" 
                                    size="small" 
                                    required 
                                    placeholder="Buscar cliente..."
                                    sx={modalFieldSx}
                                />
                            )}
                            noOptionsText="No se encontraron clientes"
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Ejercicio *</InputLabel>
                        <Autocomplete
                            options={ejercicios}
                            getOptionLabel={(e) => e.nombre || ""}
                            value={ejercicios.find(e => e.id === form.ejercicio_id) || null}
                            onChange={(event, newValue) => {
                                setForm((p) => ({ ...p, ejercicio_id: newValue ? newValue.id : "" }));
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    variant="outlined" 
                                    size="small" 
                                    required 
                                    placeholder="Buscar ejercicio..."
                                    sx={modalFieldSx}
                                />
                            )}
                            noOptionsText="No se encontraron ejercicios"
                        />
                    </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Tipo *</InputLabel>
                        <Select fullWidth size="small" value={form.tipo_registro} onChange={(e) => setForm((p) => ({ ...p, tipo_registro: e.target.value }))} sx={modalFieldSx}>
                            <MenuItem value="ESTIMADO">Estimado</MenuItem>
                            <MenuItem value="DIRECTO">Directo</MenuItem>
                        </Select>
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Peso *</InputLabel>
                        <TextField fullWidth size="small" type="number" inputProps={{ step: "0.01" }} value={form.peso} onChange={(e) => setForm((p) => ({ ...p, peso: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Repeticiones</InputLabel>
                        <TextField fullWidth size="small" type="number" value={form.repeticiones} onChange={(e) => setForm((p) => ({ ...p, repeticiones: e.target.value }))} sx={modalFieldSx} />
                        {form.tipo_registro === "ESTIMADO" ? (
                            <Typography sx={{ mt: 0.6, fontSize: 11, color: "#64748b" }}>
                                Se usa una estimación automática basada en peso y repeticiones.
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <InputLabel sx={labelSx}>RM calculado *</InputLabel>
                            <Tooltip 
                                title="Fórmula de Epley: Peso × (1 + Repeticiones / 30). Se calcula automáticamente, pero puedes ajustarlo manualmente si es directo." 
                                arrow 
                                placement="top"
                            >
                                <HelpOutlineIcon sx={{ fontSize: 14, color: "#64748b", cursor: "help", mb: 0.5 }} />
                            </Tooltip>
                        </Stack>
                        <TextField fullWidth size="small" type="number" inputProps={{ step: "0.01" }} value={form.rm_estimado} onChange={(e) => setForm((p) => ({ ...p, rm_estimado: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <Box>
                            <InputLabel sx={labelSx}>Fecha *</InputLabel>
                            <TextField fullWidth size="small" type="date" value={form.fecha_registro} onChange={(e) => setForm((p) => ({ ...p, fecha_registro: e.target.value }))} sx={modalFieldSx} />
                        </Box>
                        <Box>
                            <InputLabel sx={labelSx}>Próximo Control</InputLabel>
                            <TextField fullWidth size="small" type="date" value={form.fecha_proximo_control} onChange={(e) => setForm((p) => ({ ...p, fecha_proximo_control: e.target.value }))} sx={modalFieldSx} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ p: 1.6, borderRadius: "8px", bgcolor: "rgba(15, 23, 42, 0.03)", border: "1px solid rgba(148, 163, 184, 0.22)" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#475569", textTransform: "uppercase" }}>
                        Vista rápida
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        RM actual: {form.rm_estimado || estimated || 0}
                    </Typography>
                    <Typography sx={{ mt: 0.3, fontSize: 11, color: "#64748b" }}>
                        Tipo: {form.tipo_registro} · Peso: {form.peso || 0} · Reps: {form.repeticiones || 0}
                    </Typography>
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Observaciones</InputLabel>
                    <TextField fullWidth size="small" multiline rows={3} value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} sx={modalFieldSx} />
                </Box>
            </Box>
        </PremiumModal>
    );
}
