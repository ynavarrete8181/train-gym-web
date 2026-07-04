import { useEffect, useState } from "react";
import { Box, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

export default function ModalPlanEntrenamiento({ open, onClose, onSave, dataEdit }) {
    const [form, setForm] = useState({
        nombre: "",
        tipo: "HIBRIDO",
        alcance: "GRUPAL",
        estructura: "SEMANAL",
        objetivo: "",
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: "",
        estado: "BORRADOR",
        observaciones: "",
    });

    useEffect(() => {
        if (!open) return;
        setForm({
            nombre: dataEdit?.nombre ?? "",
            tipo: dataEdit?.tipo ?? "HIBRIDO",
            alcance: dataEdit?.alcance ?? "GRUPAL",
            estructura: dataEdit?.estructura ?? "SEMANAL",
            objetivo: dataEdit?.objetivo ?? "",
            fecha_inicio: dataEdit?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
            fecha_fin: dataEdit?.fecha_fin ?? "",
            estado: dataEdit?.estado ?? "BORRADOR",
            observaciones: dataEdit?.observaciones ?? "",
        });
    }, [open, dataEdit]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave(form);
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit?.id ? "Editar plan de entrenamiento" : "Nuevo plan de entrenamiento"}
            subtitle="Define la base del plan, su tipo metodológico y cómo se configurará."
            icon={<FitnessCenterIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={
                <>
                    <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
                    <PremiumButton variant="guardar" onClick={handleSubmit}>Guardar</PremiumButton>
                </>
            }
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
                <Box>
                    <InputLabel sx={labelSx}>Nombre del plan *</InputLabel>
                    <TextField
                        fullWidth
                        size="small"
                        value={form.nombre}
                        onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                        sx={modalFieldSx}
                    />
                </Box>

                <Box>
                    <InputLabel sx={labelSx}>Tipo *</InputLabel>
                    <Select
                        fullWidth
                        size="small"
                        value={form.tipo}
                        onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
                        sx={modalFieldSx}
                    >
                        <MenuItem value="HIBRIDO">Híbrido</MenuItem>
                        <MenuItem value="DEPORTIVO">Deportivo</MenuItem>
                        <MenuItem value="FUERZA">Fuerza</MenuItem>
                        <MenuItem value="POTENCIA">Potencia</MenuItem>
                        <MenuItem value="MOVILIDAD">Movilidad</MenuItem>
                        <MenuItem value="RECUPERACION">Recuperación</MenuItem>
                    </Select>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Alcance *</InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            value={form.alcance}
                            onChange={(event) => setForm((prev) => ({ ...prev, alcance: event.target.value }))}
                            sx={modalFieldSx}
                        >
                            <MenuItem value="GRUPAL">Grupal</MenuItem>
                            <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                        </Select>
                    </Box>

                    <Box>
                        <InputLabel sx={labelSx}>Estructura *</InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            value={form.estructura}
                            onChange={(event) => setForm((prev) => ({ ...prev, estructura: event.target.value }))}
                            sx={modalFieldSx}
                        >
                            <MenuItem value="SEMANAL">Semanal</MenuItem>
                            <MenuItem value="MENSUAL">Mensual</MenuItem>
                            <MenuItem value="PERSONALIZADO">Personalizado</MenuItem>
                        </Select>
                    </Box>

                    <Box>
                        <InputLabel sx={labelSx}>Objetivo</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            value={form.objetivo}
                            onChange={(event) => setForm((prev) => ({ ...prev, objetivo: event.target.value }))}
                            sx={modalFieldSx}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={labelSx}>Inicio *</InputLabel>
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
                            <MenuItem value="BORRADOR">Borrador</MenuItem>
                            <MenuItem value="ACTIVO">Activo</MenuItem>
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
