import { useEffect, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField, Autocomplete } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

const tipos = [
    { value: "CORPORAL", label: "Corporal" },
    { value: "FUNCIONAL", label: "Funcional" },
    { value: "MOVILIDAD", label: "Movilidad" },
    { value: "DEPORTIVA", label: "Deportiva" },
    { value: "REHABILITACION", label: "Rehabilitación" },
];

export default function ModalEvaluacion({ open, onClose, onSave, personas, dataEdit }) {
    const [form, setForm] = useState({
        id: null,
        persona_id: "",
        tipo_evaluacion: "CORPORAL",
        fecha_evaluacion: new Date().toISOString().slice(0, 10),
        resultado_resumen: "",
        nivel_resultado: "MEDIO",
        fecha_proxima_evaluacion: "",
        observaciones: "",
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            id: dataEdit?.id ?? null,
            persona_id: dataEdit?.persona_id ?? "",
            tipo_evaluacion: dataEdit?.tipo_evaluacion ?? "CORPORAL",
            fecha_evaluacion: dataEdit?.fecha_evaluacion ?? new Date().toISOString().slice(0, 10),
            resultado_resumen: dataEdit?.resultado_resumen ?? "",
            nivel_resultado: dataEdit?.nivel_resultado ?? "MEDIO",
            fecha_proxima_evaluacion: dataEdit?.fecha_proxima_evaluacion ?? "",
            observaciones: dataEdit?.observaciones ?? "",
        });
    }, [open, dataEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            ...form, 
            persona_id: Number(form.persona_id),
            fecha_proxima_evaluacion: form.fecha_proxima_evaluacion || null 
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Editar Evaluación" : "Nueva Evaluación"}
            subtitle="Registra valoraciones físicas y deportivas del cliente"
            icon={<AssessmentIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={<>
                <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
                <PremiumButton variant="guardar" onClick={handleSubmit}>Guardar</PremiumButton>
            </>}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
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
                                placeholder="Buscar por nombre o cédula..."
                                sx={modalFieldSx}
                            />
                        )}
                        noOptionsText="No se encontraron clientes"
                    />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Tipo *</InputLabel>
                        <Select fullWidth size="small" value={form.tipo_evaluacion} onChange={(e) => setForm((p) => ({ ...p, tipo_evaluacion: e.target.value }))} sx={modalFieldSx}>
                            {tipos.map((item) => (
                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Nivel / Estado *</InputLabel>
                        <Select fullWidth size="small" value={form.nivel_resultado} onChange={(e) => setForm((p) => ({ ...p, nivel_resultado: e.target.value }))} sx={modalFieldSx}>
                            <MenuItem value="BAJO">🔴 Bajo</MenuItem>
                            <MenuItem value="MEDIO">🟡 Medio</MenuItem>
                            <MenuItem value="ALTO">🟢 Alto</MenuItem>
                            <MenuItem value="EXCELENTE">🏆 Excelente</MenuItem>
                            <MenuItem value="MEJORO_TECNICA">💪 Mejoró Técnica</MenuItem>
                        </Select>
                    </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Fecha Evaluación *</InputLabel>
                        <TextField fullWidth size="small" type="date" value={form.fecha_evaluacion} onChange={(e) => setForm((p) => ({ ...p, fecha_evaluacion: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                    <Box>
                        <InputLabel sx={labelSx}>Fecha Próxima Evaluación</InputLabel>
                        <TextField fullWidth size="small" type="date" value={form.fecha_proxima_evaluacion} onChange={(e) => setForm((p) => ({ ...p, fecha_proxima_evaluacion: e.target.value }))} sx={modalFieldSx} />
                    </Box>
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Resultado resumen</InputLabel>
                    <TextField fullWidth size="small" value={form.resultado_resumen} onChange={(e) => setForm((p) => ({ ...p, resultado_resumen: e.target.value }))} sx={modalFieldSx} />
                </Box>
                <Box>
                    <InputLabel sx={labelSx}>Observaciones</InputLabel>
                    <TextField fullWidth size="small" multiline rows={3} value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} sx={modalFieldSx} />
                </Box>
            </Box>
        </PremiumModal>
    );
}
