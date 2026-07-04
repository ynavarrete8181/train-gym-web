import { useEffect, useState, useMemo } from "react";
import { Box, InputLabel, MenuItem, Select, TextField, Tabs, Tab, FormControlLabel, Switch, Divider } from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const tiposCarga = [
    { value: "LIBRE", label: "Libre" },
    { value: "PORCENTAJE_RM", label: "% RM" },
    { value: "PESO_FIJO", label: "Peso fijo" },
    { value: "RPE", label: "RPE" },
    { value: "TIEMPO", label: "Tiempo" },
    { value: "DISTANCIA", label: "Distancia" },
];

const getUnidadSugerida = (tipo) => {
    if (tipo === "PORCENTAJE_RM") return "%";
    if (tipo === "PESO_FIJO") return "kg";
    if (tipo === "TIEMPO") return "seg";
    if (tipo === "DISTANCIA") return "m";
    if (tipo === "RPE") return "escala";
    return "";
};

export default function ModalRutina({ open, onClose, onSave, ejercicios, dataEdit }) {
    const [tabIndex, setTabIndex] = useState(0);
    const [form, setForm] = useState({
        id: null,
        semana: 1,
        dia: "LUNES",
        bloque_orden: 1,
        orden: 1,
        bloque: "",
        ejercicio_id: "",
        series: 4,
        repeticiones: "",
        carga_objetivo: "",
        tipo_carga: "LIBRE",
        unidad_objetivo: "",
        tempo: "",
        rpe: "",
        descanso_segundos: "",
        notas: "",
        tiene_transferencia: false,
        ejercicio_transferencia_id: "",
        repeticiones_transferencia: "",
        series_detalles: [],
    });

    useEffect(() => {
        if (!open) return;
        setTabIndex(0);

        const seriesCount = dataEdit?.series ?? 4;
        let details = [];
        if (dataEdit?.series_detalles && Array.isArray(dataEdit.series_detalles)) {
            details = dataEdit.series_detalles;
        } else {
            // Inicializar detalles por defecto si no existen
            details = Array.from({ length: seriesCount }, (_, i) => ({
                numero: i + 1,
                repeticiones: dataEdit?.repeticiones ?? "",
                carga_objetivo: dataEdit?.carga_objetivo ?? "",
                tipo_carga: dataEdit?.tipo_carga ?? "LIBRE",
                rpe: dataEdit?.rpe ?? "",
            }));
        }

        setForm({
            id: dataEdit?.id ?? null,
            semana: dataEdit?.semana ?? 1,
            dia: dataEdit?.dia ?? "LUNES",
            bloque_orden: dataEdit?.bloque_orden ?? 1,
            orden: dataEdit?.orden ?? 1,
            bloque: dataEdit?.bloque ?? "",
            ejercicio_id: dataEdit?.ejercicio_id ?? "",
            series: seriesCount,
            repeticiones: dataEdit?.repeticiones ?? "",
            carga_objetivo: dataEdit?.carga_objetivo ?? "",
            tipo_carga: dataEdit?.tipo_carga ?? "LIBRE",
            unidad_objetivo: dataEdit?.unidad_objetivo ?? getUnidadSugerida(dataEdit?.tipo_carga ?? "LIBRE"),
            tempo: dataEdit?.tempo ?? "",
            rpe: dataEdit?.rpe ?? "",
            descanso_segundos: dataEdit?.descanso_segundos ?? "",
            notas: dataEdit?.notas ?? "",
            tiene_transferencia: !!dataEdit?.ejercicio_transferencia_id,
            ejercicio_transferencia_id: dataEdit?.ejercicio_transferencia_id ?? "",
            repeticiones_transferencia: dataEdit?.repeticiones_transferencia ?? "",
            series_detalles: details,
        });
    }, [open, dataEdit]);

    // Sincronizar el array de series cuando cambia el número de series prescrito
    const handleSeriesCountChange = (newCount) => {
        const count = Math.max(1, parseInt(newCount) || 1);
        setForm((prev) => {
            const currentDetails = [...prev.series_detalles];
            let nextDetails = [];
            for (let i = 0; i < count; i++) {
                if (currentDetails[i]) {
                    nextDetails.push(currentDetails[i]);
                } else {
                    nextDetails.push({
                        numero: i + 1,
                        repeticiones: prev.repeticiones || "",
                        carga_objetivo: prev.carga_objetivo || "",
                        tipo_carga: prev.tipo_carga || "LIBRE",
                        rpe: prev.rpe || "",
                    });
                }
            }
            return {
                ...prev,
                series: count,
                series_detalles: nextDetails,
            };
        });
    };

    const handleSeriesFieldChange = (index, field, value) => {
        setForm((prev) => {
            const updated = [...prev.series_detalles];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            return {
                ...prev,
                series_detalles: updated,
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            semana: Number(form.semana),
            bloque_orden: Number(form.bloque_orden || 1),
            orden: Number(form.orden || 1),
            ejercicio_id: Number(form.ejercicio_id),
            series: Number(form.series),
            carga_objetivo: form.carga_objetivo ? Number(form.carga_objetivo) : null,
            rpe: form.rpe ? Number(form.rpe) : null,
            descanso_segundos: form.descanso_segundos ? Number(form.descanso_segundos) : null,
            ejercicio_transferencia_id: form.tiene_transferencia && form.ejercicio_transferencia_id ? Number(form.ejercicio_transferencia_id) : null,
            repeticiones_transferencia: form.tiene_transferencia && form.repeticiones_transferencia ? Number(form.repeticiones_transferencia) : null,
            series_detalles: form.series_detalles.map((s) => ({
                ...s,
                carga_objetivo: s.carga_objetivo ? Number(s.carga_objetivo) : null,
                rpe: s.rpe ? Number(s.rpe) : null,
            })),
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={dataEdit ? "Editar Rutina" : "Nueva Rutina"}
            subtitle="Configura un ejercicio, su desglose de series e inmediatamente su transferencia."
            icon={<FormatListBulletedIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
            actions={<>
                <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
                <PremiumButton variant="guardar" onClick={handleSubmit}>Guardar</PremiumButton>
            </>}
        >
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, value) => {
                        e.stopPropagation();
                        setTabIndex(value);
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="1. Configuración Básica" sx={{ fontSize: "12px", fontWeight: 700 }} />
                    <Tab label="2. Series y Transferencia" sx={{ fontSize: "12px", fontWeight: 700 }} />
                </Tabs>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
                {tabIndex === 0 && (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "0.6fr 1fr 0.7fr 1fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={labelSx}>Semana *</InputLabel>
                                <TextField fullWidth size="small" type="number" value={form.semana} onChange={(e) => setForm((p) => ({ ...p, semana: e.target.value }))} sx={modalFieldSx} />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Día *</InputLabel>
                                <Select fullWidth size="small" value={form.dia} onChange={(e) => setForm((p) => ({ ...p, dia: e.target.value }))} sx={modalFieldSx}>
                                    {dias.map((dia) => <MenuItem key={dia} value={dia}>{dia}</MenuItem>)}
                                </Select>
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Orden *</InputLabel>
                                <TextField fullWidth size="small" type="number" value={form.orden} onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value }))} sx={modalFieldSx} />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Bloque</InputLabel>
                                <TextField fullWidth size="small" value={form.bloque} onChange={(e) => setForm((p) => ({ ...p, bloque: e.target.value }))} sx={modalFieldSx} placeholder="Ej. Fuerza tren inferior" />
                            </Box>
                        </Box>
                        <Box>
                            <InputLabel sx={labelSx}>Ejercicio *</InputLabel>
                            <Select fullWidth size="small" value={form.ejercicio_id} onChange={(e) => setForm((p) => ({ ...p, ejercicio_id: e.target.value }))} sx={modalFieldSx}>
                                {ejercicios.map((ejercicio) => <MenuItem key={ejercicio.id} value={ejercicio.id}>{ejercicio.nombre}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "0.7fr 1fr 1fr 1fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={labelSx}>Series Globales *</InputLabel>
                                <TextField fullWidth size="small" type="number" value={form.series} onChange={(e) => handleSeriesCountChange(e.target.value)} sx={modalFieldSx} />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Repeticiones General</InputLabel>
                                <TextField fullWidth size="small" value={form.repeticiones} onChange={(e) => setForm((p) => ({ ...p, repeticiones: e.target.value }))} sx={modalFieldSx} placeholder="8-10" />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Carga General</InputLabel>
                                <TextField fullWidth size="small" type="number" inputProps={{ step: "0.01" }} value={form.carga_objetivo} onChange={(e) => setForm((p) => ({ ...p, carga_objetivo: e.target.value }))} sx={modalFieldSx} />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Tipo carga</InputLabel>
                                <Select
                                    fullWidth
                                    size="small"
                                    value={form.tipo_carga}
                                    onChange={(e) => setForm((p) => ({
                                        ...p,
                                        tipo_carga: e.target.value,
                                        unidad_objetivo: p.unidad_objetivo || getUnidadSugerida(e.target.value),
                                    }))}
                                    sx={modalFieldSx}
                                >
                                    {tiposCarga.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
                                </Select>
                            </Box>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 0.8fr 0.8fr 0.8fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={labelSx}>Unidad / referencia</InputLabel>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={form.unidad_objetivo}
                                    onChange={(e) => setForm((p) => ({ ...p, unidad_objetivo: e.target.value }))}
                                    sx={modalFieldSx}
                                    placeholder={getUnidadSugerida(form.tipo_carga) || "kg, %, seg, m"}
                                />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Tempo</InputLabel>
                                <TextField fullWidth size="small" value={form.tempo} onChange={(e) => setForm((p) => ({ ...p, tempo: e.target.value }))} sx={modalFieldSx} placeholder="3-1-1-0" />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>RPE</InputLabel>
                                <TextField fullWidth size="small" type="number" inputProps={{ step: "0.5", min: "0", max: "10" }} value={form.rpe} onChange={(e) => setForm((p) => ({ ...p, rpe: e.target.value }))} sx={modalFieldSx} />
                            </Box>
                            <Box>
                                <InputLabel sx={labelSx}>Descanso (seg.)</InputLabel>
                                <TextField fullWidth size="small" type="number" value={form.descanso_segundos} onChange={(e) => setForm((p) => ({ ...p, descanso_segundos: e.target.value }))} sx={modalFieldSx} />
                            </Box>
                        </Box>
                        <Box>
                            <InputLabel sx={labelSx}>Notas Generales</InputLabel>
                            <TextField fullWidth size="small" value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} sx={modalFieldSx} />
                        </Box>
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ display: "grid", gap: 3.5 }}>
                        {/* Tabla de Desglose de Series */}
                        <Box>
                            <Typography sx={{ fontSize: "13px", fontWeight: 800, color: "#1e293b", mb: 1.5 }}>
                                Programación Avanzada por Serie
                            </Typography>
                            <Box sx={{ display: "grid", gap: 1.5 }}>
                                {form.series_detalles.map((serie, index) => (
                                    <Box key={serie.numero} sx={{ display: "grid", gridTemplateColumns: "60px 1.5fr 1fr 1fr 1fr", gap: 2, alignItems: "center" }}>
                                        <Typography sx={{ fontSize: "12px", fontWeight: 900, color: "#475569" }}>
                                            Serie {serie.numero}
                                        </Typography>
                                        <TextField
                                            size="small"
                                            placeholder="Repeticiones"
                                            value={serie.repeticiones}
                                            onChange={(e) => handleSeriesFieldChange(index, "repeticiones", e.target.value)}
                                            sx={modalFieldSx}
                                        />
                                        <TextField
                                            size="small"
                                            type="number"
                                            inputProps={{ step: "0.01" }}
                                            placeholder="Carga / %"
                                            value={serie.carga_objetivo}
                                            onChange={(e) => handleSeriesFieldChange(index, "carga_objetivo", e.target.value)}
                                            sx={modalFieldSx}
                                        />
                                        <Select
                                            size="small"
                                            value={serie.tipo_carga}
                                            onChange={(e) => handleSeriesFieldChange(index, "tipo_carga", e.target.value)}
                                            sx={modalFieldSx}
                                        >
                                            {tiposCarga.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
                                        </Select>
                                        <TextField
                                            size="small"
                                            type="number"
                                            inputProps={{ step: "0.5", min: 0, max: 10 }}
                                            placeholder="RPE"
                                            value={serie.rpe}
                                            onChange={(e) => handleSeriesFieldChange(index, "rpe", e.target.value)}
                                            sx={modalFieldSx}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Divider />

                        {/* Configuración de Ejercicio de Transferencia */}
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.tiene_transferencia}
                                        onChange={(e) => setForm((p) => ({ ...p, tiene_transferencia: e.target.checked }))}
                                        color="warning"
                                    />
                                }
                                label={
                                    <Typography sx={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                                        ¿Lleva Ejercicio de Transferencia? (Contraste / Agilidad)
                                    </Typography>
                                }
                            />
                            {form.tiene_transferencia && (
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2, mt: 1.5 }}>
                                    <Box>
                                        <InputLabel sx={labelSx}>Ejercicio de Transferencia</InputLabel>
                                        <Select
                                            fullWidth
                                            size="small"
                                            value={form.ejercicio_transferencia_id}
                                            onChange={(e) => setForm((p) => ({ ...p, ejercicio_transferencia_id: e.target.value }))}
                                            sx={modalFieldSx}
                                        >
                                            <MenuItem value="" disabled>Selecciona el ejercicio</MenuItem>
                                            {ejercicios.map((ejer) => <MenuItem key={ejer.id} value={ejer.id}>{ejer.nombre}</MenuItem>)}
                                        </Select>
                                    </Box>
                                    <Box>
                                        <InputLabel sx={labelSx}>Repeticiones del Transfer</InputLabel>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={form.repeticiones_transferencia}
                                            onChange={(e) => setForm((p) => ({ ...p, repeticiones_transferencia: e.target.value }))}
                                            sx={modalFieldSx}
                                            placeholder="Ej. 6"
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </PremiumModal>
    );
}
