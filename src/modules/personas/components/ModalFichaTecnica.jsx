import { useEffect, useMemo, useState } from "react";
import { InputLabel, MenuItem, Select, TextField, Box, Divider, Typography, Autocomplete, Stack } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";
import { normalizeAssetUrl } from "../../../services/apiClient";

const ui = {
    text: "#0f172a",
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const roundMetric = (value, digits = 2) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return "";
    return Number(value.toFixed(digits));
};

function MetricChip({ label, value, unit, tone = "mustard" }) {
    const colors = {
        mustard: { bg: "rgba(224, 161, 0, 0.10)", border: "rgba(224, 161, 0, 0.45)", color: "#9a6b00" },
        dark: { bg: "rgba(15, 23, 42, 0.06)", border: "rgba(15, 23, 42, 0.18)", color: "#0f172a" },
        green: { bg: "rgba(46, 125, 50, 0.10)", border: "rgba(46, 125, 50, 0.35)", color: "#1b5e20" },
        danger: { bg: "rgba(239, 68, 68, 0.10)", border: "rgba(239, 68, 68, 0.35)", color: "#b91c1c" },
    };
    const c = colors[tone] || colors.mustard;

    return (
        <Box sx={{
            px: 1,
            py: 0.65,
            border: `1px solid ${c.border}`,
            bgcolor: c.bg,
            borderRadius: "7px",
            minWidth: 118,
        }}>
            <Typography sx={{ fontSize: 8.5, fontWeight: 950, color: "#64748b", textTransform: "uppercase", lineHeight: 1.1 }}>{label}</Typography>
            <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 950, color: c.color, lineHeight: 1.05 }}>
                {value || "N/A"} <Box component="span" sx={{ fontSize: 9, color: "#64748b", fontWeight: 800 }}>{unit}</Box>
            </Typography>
        </Box>
    );
}

const getEstadoNutricional = (imc) => {
    const value = toNumber(imc);
    if (!value) return { label: "Sin datos", tone: "dark", title: "Completa peso y talla", message: "Con esos datos se calcula el IMC y se activa el seguimiento.", icon: "?" };
    if (value < 18.5) return { label: "Bajo peso", tone: "mustard", title: "Peso por debajo del rango", message: "Conviene revisar alimentación, energía diaria y evolución de masa magra.", icon: "!" };
    if (value < 25) return { label: "Normal", tone: "green", title: "Rango saludable", message: "Buen punto de partida. La meta es sostener hábitos y comparar la próxima ficha.", icon: "OK" };
    if (value < 30) return { label: "Sobrepeso", tone: "mustard", title: "Sobrepeso por IMC", message: "Miremos cintura, grasa corporal y tendencia antes de sacar conclusiones rápidas.", icon: "!" };
    if (value < 35) return { label: "Obesidad I", tone: "danger", title: "Requiere seguimiento", message: "Es importante acompañar el proceso con control de medidas y hábitos.", icon: "!" };
    if (value < 40) return { label: "Obesidad II", tone: "danger", title: "Requiere seguimiento", message: "Conviene trabajar con metas progresivas y apoyo profesional.", icon: "!" };
    return { label: "Obesidad III", tone: "danger", title: "Requiere seguimiento", message: "Se recomienda control profesional y seguimiento frecuente de avances.", icon: "!" };
};

const toneStyles = {
    mustard: { bg: "rgba(224, 161, 0, 0.10)", border: "rgba(224, 161, 0, 0.45)", color: "#9a6b00", soft: "rgba(224, 161, 0, 0.16)" },
    dark: { bg: "rgba(15, 23, 42, 0.06)", border: "rgba(15, 23, 42, 0.18)", color: "#0f172a", soft: "rgba(15, 23, 42, 0.10)" },
    green: { bg: "rgba(46, 125, 50, 0.10)", border: "rgba(46, 125, 50, 0.35)", color: "#1b5e20", soft: "rgba(46, 125, 50, 0.16)" },
    danger: { bg: "rgba(239, 68, 68, 0.10)", border: "rgba(239, 68, 68, 0.35)", color: "#b91c1c", soft: "rgba(239, 68, 68, 0.14)" },
};

const demoBodyPhotoUrl = "https://thumbs.wbm.im/pw/medium/9058727efd2f9f8b4e59512c715bb1e1.png";

function BodyMeasurementMap({ form, imc, cinturaAltura, masaMagraCalculada, estadoNutricional, photoUrl }) {
    const [isRotating, setIsRotating] = useState(true);
    const tone = toneStyles[estadoNutricional.tone] || toneStyles.mustard;

    return (
        <Box sx={{
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            p: 1.5,
            height: "100%",
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#0f172a" }}>Foto corporal</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", mb: 1 }}>
                        Imagen de la ficha para comparar avances.
                    </Typography>
                </Box>
                <Box
                    component="button"
                    type="button"
                    onClick={() => setIsRotating((value) => !value)}
                    sx={{
                        border: "1px solid rgba(224, 161, 0, 0.55)",
                        bgcolor: "rgba(224, 161, 0, 0.08)",
                        color: "#9a6b00",
                        fontSize: 9,
                        fontWeight: 950,
                        px: 1,
                        py: 0.45,
                        borderRadius: "7px",
                        cursor: "pointer",
                        lineHeight: 1,
                    }}
                >
                    {isRotating ? "Pausar" : "Rotar"}
                </Box>
            </Stack>
            <Box sx={{
                position: "relative",
                height: 460,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                borderRadius: "10px",
                background: "radial-gradient(circle at 50% 36%, rgba(224, 161, 0, 0.10), rgba(241, 245, 249, 0.78) 58%, rgba(255, 255, 255, 0.96))",
                perspective: "950px",
                boxShadow: `inset 0 0 0 2px ${tone.soft}`,
                "@keyframes bodyPhotoTurn": {
                    "0%": { transform: "rotateY(0deg) rotateZ(-0.4deg) scale(1)" },
                    "22%": { transform: "rotateY(82deg) rotateZ(0deg) scale(0.96)" },
                    "28%": { transform: "rotateY(98deg) rotateZ(0deg) scale(0.92)" },
                    "50%": { transform: "rotateY(180deg) rotateZ(0.4deg) scale(1)" },
                    "72%": { transform: "rotateY(262deg) rotateZ(0deg) scale(0.96)" },
                    "78%": { transform: "rotateY(278deg) rotateZ(0deg) scale(0.92)" },
                    "100%": { transform: "rotateY(360deg) rotateZ(-0.4deg) scale(1)" },
                },
            }}>
                <Box sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 4,
                    px: 1,
                    py: 0.55,
                    borderRadius: "999px",
                    bgcolor: tone.bg,
                    border: `1px solid ${tone.border}`,
                    color: tone.color,
                    fontSize: 10,
                    fontWeight: 950,
                    textTransform: "uppercase",
                }}>
                    {estadoNutricional.label}
                </Box>
                {[
                    { label: "Talla", value: form.talla_cm ? `${form.talla_cm} cm` : "cm", top: 36, left: 244 },
                    { label: "Grasa", value: form.grasa_corporal_pct ? `${form.grasa_corporal_pct}%` : "%", top: 136, left: 12 },
                    { label: "Cintura", value: form.cintura_cm ? `${form.cintura_cm} cm` : "cm", top: 214, left: 8 },
                    { label: "Peso", value: form.peso_kg ? `${form.peso_kg} kg` : "kg", top: 374, left: 20 },
                    { label: "Masa magra", value: masaMagraCalculada || form.masa_magra_kg || "kg", top: 374, left: 224 },
                ].map((tag) => (
                    <Box key={tag.label} sx={{ position: "absolute", top: tag.top, left: tag.left, zIndex: 3 }}>
                        <Typography sx={{ fontSize: 9.5, fontWeight: 950, color: "#9a6b00", textTransform: "uppercase" }}>{tag.label}</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#0f172a" }}>{tag.value}</Typography>
                    </Box>
                ))}
                <svg width="340" height="450" viewBox="0 0 340 450" style={{ position: "absolute", inset: "6px auto auto 0", pointerEvents: "none", zIndex: 2 }} aria-hidden="true">
                    <path d="M63 152 C96 162 118 168 145 174" fill="none" stroke="#e0a100" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M63 229 C101 232 128 234 163 231" fill="none" stroke="#e0a100" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M63 388 C100 389 131 389 156 387" fill="none" stroke="#e0a100" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M253 58 C267 49 282 43 300 40" fill="none" stroke="#e0a100" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M203 386 C232 387 256 388 286 389" fill="none" stroke="#e0a100" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M140 217 C166 221 194 221 222 217" fill="none" stroke="#e0a100" strokeWidth="3" />
                </svg>
                <Box
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        width: 188,
                        height: 426,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transformStyle: "preserve-3d",
                        transformOrigin: "50% 50%",
                        animation: isRotating ? "bodyPhotoTurn 5.8s linear infinite" : "none",
                        transition: "transform 260ms ease",
                    }}
                >
                    <Box
                        component="img"
                        src={photoUrl || demoBodyPhotoUrl}
                        alt="Referencia corporal de cuerpo completo"
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            filter: "drop-shadow(0 20px 18px rgba(15, 23, 42, 0.22))",
                            backfaceVisibility: "visible",
                            transform: "translateZ(1px)",
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default function ModalFichaTecnica({ open, onClose, onSave, personaId, isEditMode, dataEdit, personas = [] }) {
    const [showFormula, setShowFormula] = useState(false);
    const [form, setForm] = useState({
        id: "",
        persona_id: "",
        actividad_fisica: "Moderado",
        objetivo: "",
        observaciones: "",
        peso_kg: "",
        talla_cm: "",
        cintura_cm: "",
        grasa_corporal_pct: "",
        masa_magra_kg: "",
        foto_url: "",
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && dataEdit) {
                // Mapear "Alto" a "Intenso" si viene de la BD antigua
                let act = dataEdit.actividad_fisica || "Moderado";
                if (act === "Alto") act = "Intenso";
                if (act === "Leve") act = "Sedentario";

                setForm({
                    id: dataEdit.ficha_id || "",
                    persona_id: dataEdit.persona_id || personaId || "",
                    actividad_fisica: act,
                    objetivo: dataEdit.objetivo || "",
                    observaciones: dataEdit.observaciones || "",
                    peso_kg: dataEdit.peso_kg !== null ? String(dataEdit.peso_kg) : "",
                    talla_cm: dataEdit.talla_cm !== null ? String(dataEdit.talla_cm) : "",
                    cintura_cm: dataEdit.cintura_cm !== null ? String(dataEdit.cintura_cm) : "",
                    grasa_corporal_pct: dataEdit.grasa_corporal_pct !== null ? String(dataEdit.grasa_corporal_pct) : "",
                    masa_magra_kg: dataEdit.masa_magra_kg !== null ? String(dataEdit.masa_magra_kg) : "",
                    foto_url: dataEdit.foto_url || "",
                });
            } else {
                setForm({
                    id: "",
                    persona_id: personaId || "",
                    actividad_fisica: "Moderado",
                    objetivo: "",
                    observaciones: "",
                    peso_kg: "",
                    talla_cm: "",
                    cintura_cm: "",
                    grasa_corporal_pct: "",
                    masa_magra_kg: "",
                    foto_url: "",
                });
            }
        }
    }, [open, personaId, isEditMode, dataEdit]);

    const peso = toNumber(form.peso_kg);
    const talla = toNumber(form.talla_cm);
    const cintura = toNumber(form.cintura_cm);
    const grasa = toNumber(form.grasa_corporal_pct);
    const imc = useMemo(() => {
        if (!peso || !talla) return "";
        const tallaMetros = talla / 100;
        return roundMetric(peso / (tallaMetros * tallaMetros), 2);
    }, [peso, talla]);
    const cinturaAltura = useMemo(() => {
        if (!cintura || !talla) return "";
        return roundMetric(cintura / talla, 2);
    }, [cintura, talla]);
    const masaMagraCalculada = useMemo(() => {
        if (!peso || grasa === null || grasa < 0 || grasa > 100) return "";
        return roundMetric(peso * (1 - grasa / 100), 2);
    }, [peso, grasa]);
    const estadoNutricional = useMemo(() => getEstadoNutricional(imc), [imc]);
    const estadoTone = toneStyles[estadoNutricional.tone] || toneStyles.mustard;
    const selectedPersona = useMemo(
        () => personas.find((persona) => Number(persona.id) === Number(form.persona_id)) || null,
        [personas, form.persona_id]
    );
    const personaPhotoUrl = normalizeAssetUrl(form.foto_url || selectedPersona?.foto_url || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            masa_magra_kg: masaMagraCalculada !== "" ? String(masaMagraCalculada) : form.masa_magra_kg,
        });
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title="Registrar Ficha de Evaluación Física"
            subtitle="Ingresa las mediciones antropométricas y objetivos de entrenamiento"
            icon={<FitnessCenterIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="lg"
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
            <Box sx={{ width: "100%", mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                {personas && personas.length > 0 && !personaId && (
                    <Box sx={{ mb: 1 }}>
                        <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                            Seleccionar Cliente *
                        </InputLabel>
                        <Autocomplete
                            options={personas}
                            getOptionLabel={(p) => `${p.nombres} ${p.apellidos || ""} - ${p.numero_identificacion || p.cedula_ruc || p.cedula || ""}`.trim()}
                            value={personas.find(p => p.id === form.persona_id) || null}
                            onChange={(event, newValue) => {
                                setForm({
                                    ...form,
                                    persona_id: newValue ? newValue.id : "",
                                    foto_url: newValue?.foto_url || "",
                                });
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
                )}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.25fr) 360px" }, gap: 2 }}>
                    <Stack spacing={2}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Nivel de Actividad *
                                </InputLabel>
                                <Select
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={form.actividad_fisica}
                                    onChange={(e) => setForm({ ...form, actividad_fisica: e.target.value })}
                                    required
                                    sx={modalFieldSx}
                                >
                                    <MenuItem value="Sedentario">Sedentario (Poca actividad)</MenuItem>
                                    <MenuItem value="Moderado">Moderado (2-3 veces por semana)</MenuItem>
                                    <MenuItem value="Intenso">Intenso (Entrenamiento diario)</MenuItem>
                                </Select>
                            </Box>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Objetivo de Entrenamiento
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={form.objetivo}
                                    onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                                    placeholder="Ej. Aumentar masa magra, bajar grasa"
                                    sx={modalFieldSx}
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Divider sx={{ borderColor: "rgba(0,0,0,0.08)", mb: 1 }} />
                            <Typography sx={{ color: "var(--tg-primary-strong, #bb8600)", fontWeight: 900, fontSize: "13px" }}>
                                Mediciones Antropométricas
                            </Typography>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Peso Corporal (kg) *
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    value={form.peso_kg}
                                    onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                                    placeholder="Ej. 72.5"
                                    required
                                    sx={modalFieldSx}
                                />
                            </Box>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Estatura / Talla (cm) *
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.1" }}
                                    value={form.talla_cm}
                                    onChange={(e) => setForm({ ...form, talla_cm: e.target.value })}
                                    placeholder="Ej. 175"
                                    required
                                    sx={modalFieldSx}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Cintura (cm)
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.1" }}
                                    value={form.cintura_cm}
                                    onChange={(e) => setForm({ ...form, cintura_cm: e.target.value })}
                                    placeholder="Ej. 82"
                                    sx={modalFieldSx}
                                />
                            </Box>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Grasa Corporal (%)
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.1", min: 0, max: 100 }}
                                    value={form.grasa_corporal_pct}
                                    onChange={(e) => setForm({ ...form, grasa_corporal_pct: e.target.value })}
                                    placeholder="Balanza o plicómetro"
                                    sx={modalFieldSx}
                                />
                            </Box>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Masa Magra (kg)
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.1" }}
                                    value={masaMagraCalculada !== "" ? masaMagraCalculada : form.masa_magra_kg}
                                    onChange={(e) => setForm({ ...form, masa_magra_kg: e.target.value })}
                                    placeholder="Se calcula con grasa %"
                                    sx={modalFieldSx}
                                    helperText={masaMagraCalculada !== "" ? "Calculado automaticamente" : "Manual si no hay % de grasa"}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                    Observaciones Médicas / Contraindicaciones
                                </InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={3}
                                    value={form.observaciones}
                                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                    placeholder="Alergias, lesiones, patologías o notas adicionales..."
                                    sx={modalFieldSx}
                                />
                            </Box>
                        </Box>

                        <Box sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
                            gap: 1,
                        }}>
                            <MetricChip label="IMC" value={imc} unit="kg/m2" tone="mustard" />
                            <MetricChip label="Estado" value={estadoNutricional.label} unit="por IMC" tone={estadoNutricional.tone} />
                            <MetricChip label="Cintura/Altura" value={cinturaAltura} unit="ratio" tone="dark" />
                            <MetricChip label="Grasa" value={form.grasa_corporal_pct ? `${form.grasa_corporal_pct}%` : ""} unit="medida" tone="mustard" />
                            <MetricChip label="Masa magra" value={masaMagraCalculada || form.masa_magra_kg} unit="kg" tone="green" />
                        </Box>

                        <Box sx={{
                            border: `1px solid ${estadoTone.border}`,
                            bgcolor: estadoTone.bg,
                            borderRadius: "8px",
                            p: 1.25,
                            display: "grid",
                            gridTemplateColumns: "38px minmax(0, 1fr) auto",
                            gap: 1.25,
                            alignItems: "center",
                        }}>
                            <Box sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "10px",
                                bgcolor: "#fff",
                                color: estadoTone.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 950,
                                fontSize: 12,
                            }}>
                                {estadoNutricional.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 950, color: estadoTone.color }}>{estadoNutricional.title}</Typography>
                                <Typography sx={{ mt: 0.25, fontSize: 11.5, color: "#475569", fontWeight: 700 }}>{estadoNutricional.message}</Typography>
                            </Box>
                            <Box
                                component="button"
                                type="button"
                                onClick={() => setShowFormula((value) => !value)}
                                sx={{
                                    border: `1px solid ${estadoTone.border}`,
                                    bgcolor: "#fff",
                                    color: estadoTone.color,
                                    borderRadius: "7px",
                                    px: 1,
                                    py: 0.75,
                                    cursor: "pointer",
                                    fontSize: 10,
                                    fontWeight: 950,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Calculo
                            </Box>
                        </Box>

                        {showFormula && (
                            <Box sx={{ border: "1px dashed #cbd5e1", borderRadius: "8px", p: 1.25, bgcolor: "#fff" }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#0f172a" }}>Como se calculo</Typography>
                                <Typography sx={{ mt: 0.5, fontSize: 11.5, color: "#475569", fontWeight: 700 }}>
                                    IMC = peso kg / (talla m x talla m). Masa magra = peso kg x (1 - grasa corporal / 100). Cintura/altura = cintura cm / talla cm.
                                </Typography>
                            </Box>
                        )}
                    </Stack>

                    <BodyMeasurementMap
                        form={form}
                        imc={imc}
                        cinturaAltura={cinturaAltura}
                        masaMagraCalculada={masaMagraCalculada}
                        estadoNutricional={estadoNutricional}
                        photoUrl={personaPhotoUrl}
                    />
                </Box>
            </Box>
        </PremiumModal>
    );
}
