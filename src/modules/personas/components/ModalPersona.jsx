import { useEffect, useState } from "react";
import { InputLabel, MenuItem, Select, TextField, Box, Stack, Typography } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { modalFieldSx } from "../../../Styles/muiTheme";
import { apiClient, getApiErrorMessage, normalizeAssetUrl } from "../../../services/apiClient";

const ui = {
    text: "#0f172a",
};

const VALID_PERSONA_TYPES = ["CLIENTE", "SOCIO", "FUNCIONARIO", "ENTRENADOR"];

const normalizePersonaType = (value) => {
    const normalized = String(value || "").trim().toUpperCase();
    return VALID_PERSONA_TYPES.includes(normalized) ? normalized : "CLIENTE";
};

export default function ModalPersona({ open, onClose, onSave, isEditMode, dataEdit }) {
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState("");
    const [removeFoto, setRemoveFoto] = useState(false);
    const [processingPhoto, setProcessingPhoto] = useState(false);
    const [photoMessage, setPhotoMessage] = useState("");
    const [form, setForm] = useState({
        id: null,
        cedula: "",
        nombres: "",
        apellidos: "",
        fecha_nacimiento: "",
        sexo: "M",
        telefono: "",
        email: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        tipo_persona: "CLIENTE",
        sede_id: "1",
        foto_url: "",
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && dataEdit) {
                setForm({
                    id: dataEdit.id,
                    cedula: dataEdit.cedula || "",
                    nombres: dataEdit.nombres_base || dataEdit.nombres || "",
                    apellidos: dataEdit.apellidos || "",
                    fecha_nacimiento: dataEdit.fecha_nacimiento || "",
                    sexo: dataEdit.sexo || "M",
                    telefono: dataEdit.telefono || "",
                    email: dataEdit.email || "",
                    direccion: dataEdit.direccion || "",
                    ciudad: dataEdit.ciudad || "",
                    provincia: dataEdit.provincia || "",
                    tipo_persona: normalizePersonaType(dataEdit.tipos?.[0]?.codigo || dataEdit.tipo_persona),
                    sede_id: dataEdit.sede_id?.toString() || "1",
                    foto_url: dataEdit.foto_url || "",
                });
                setFotoFile(null);
                setFotoPreview(normalizeAssetUrl(dataEdit.foto_url || ""));
                setRemoveFoto(false);
                setProcessingPhoto(false);
                setPhotoMessage("");
            } else {
                setForm({
                    id: null,
                    cedula: "",
                    nombres: "",
                    apellidos: "",
                    fecha_nacimiento: "",
                    sexo: "M",
                    telefono: "",
                    email: "",
                    direccion: "",
                    ciudad: "",
                    provincia: "",
                    tipo_persona: "CLIENTE",
                    sede_id: "1",
                    foto_url: "",
                });
                setFotoFile(null);
                setFotoPreview("");
                setRemoveFoto(false);
                setProcessingPhoto(false);
                setPhotoMessage("");
            }
        }
    }, [open, isEditMode, dataEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            tipo_persona: normalizePersonaType(form.tipo_persona),
            foto_file: fotoFile,
            remove_foto: removeFoto,
        });
    };

    const getPhotoProcessingErrorMessage = async (error, fallback) => {
        const data = error?.response?.data;

        if (data instanceof Blob) {
            const text = await data.text();
            try {
                const parsed = JSON.parse(text);
                if (parsed?.message) return parsed.message;
            } catch {
                if (text.trim()) return text.trim();
            }
        }

        if (!error?.response) {
            if (error?.code === "ECONNABORTED") {
                return "La IA tardó demasiado en quitar el fondo.";
            }

            return "No se pudo conectar con el servicio de IA para quitar el fondo.";
        }

        return getApiErrorMessage(error, error?.message || fallback);
    };

    const removeBackgroundWithBackend = async (file) => {
        const formData = new FormData();
        formData.append("foto", file);

        const response = await apiClient.post("/gimnasio/personas/foto/quitar-fondo", formData, {
            responseType: "blob",
            headers: {
                Accept: "image/png, application/json",
                "Content-Type": "multipart/form-data",
            },
            timeout: 90000,
        });

        return response.data;
    };

    const handlePhotoFile = async (file) => {
        if (!file) return;
        setProcessingPhoto(true);
        setPhotoMessage("Quitando fondo...");
        setRemoveFoto(false);
        const originalPreview = URL.createObjectURL(file);
        setFotoPreview(originalPreview);

        try {
            const transparentBlob = await removeBackgroundWithBackend(file);
            const cleanName = file.name.replace(/\.[^.]+$/, "") || "foto-cliente";
            const transparentFile = new File([transparentBlob], `${cleanName}-sin-fondo.png`, { type: "image/png" });
            setFotoFile(transparentFile);
            setFotoPreview(URL.createObjectURL(transparentBlob));
            setPhotoMessage("");
        } catch (error) {
            console.error("No se pudo quitar el fondo de la foto del cliente.", error);
            setFotoFile(file);
            setFotoPreview(originalPreview);
            const reason = await getPhotoProcessingErrorMessage(error, "No se pudo quitar el fondo.");
            setPhotoMessage(`${reason} Se usara la foto original.`);
        } finally {
            setProcessingPhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        setFotoFile(null);
        setFotoPreview("");
        setForm((prev) => ({ ...prev, foto_url: "" }));
        setRemoveFoto(true);
        setPhotoMessage("");
    };

    const currentPhotoUrl = removeFoto ? "" : (fotoPreview || normalizeAssetUrl(form.foto_url));

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={isEditMode ? "Modificar Persona / Socio" : "Registrar Persona / Socio"}
            subtitle="Ingresa o edita los datos generales de la persona o socio"
            icon={<PersonAddIcon sx={{ fontSize: 22, color: "#fff" }} />}
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
            <Box sx={{ width: "100%", mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 220px" }, gap: 3 }}>
                {/* LEFT COLUMN - Form fields */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Fila 1 */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Cédula / RUC *
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.cedula}
                                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                                placeholder="Ej. 0992334411001"
                                required
                                sx={modalFieldSx}
                            />
                        </Box>
                    </Box>

                    {/* Fila 2 */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Nombres *
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.nombres}
                                onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                                placeholder="Nombres completos"
                                required
                                sx={modalFieldSx}
                            />
                        </Box>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Apellidos
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.apellidos}
                                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                                placeholder="Apellidos completos"
                                sx={modalFieldSx}
                            />
                        </Box>
                    </Box>

                    {/* Fila 3 */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Correo Electrónico
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="correo@ejemplo.com"
                                sx={modalFieldSx}
                            />
                        </Box>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Teléfono
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.telefono}
                                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                placeholder="Número de contacto"
                                sx={modalFieldSx}
                            />
                        </Box>
                    </Box>

                    {/* Fila 4 */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Género / Sexo
                            </InputLabel>
                            <Select
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.sexo}
                                onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                                sx={modalFieldSx}
                            >
                                <MenuItem value="M">Masculino</MenuItem>
                                <MenuItem value="F">Femenino</MenuItem>
                                <MenuItem value="OTRO">Otro / No especifica</MenuItem>
                            </Select>
                        </Box>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Fecha de Nacimiento
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                type="date"
                                value={form.fecha_nacimiento}
                                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                                sx={modalFieldSx}
                            />
                        </Box>
                    </Box>

                    {/* Fila 5 */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Ciudad
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.ciudad}
                                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                                placeholder="Ciudad de residencia"
                                sx={modalFieldSx}
                            />
                        </Box>
                        <Box>
                            <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                                Provincia
                            </InputLabel>
                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.provincia}
                                onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                                placeholder="Provincia"
                                sx={modalFieldSx}
                            />
                        </Box>
                    </Box>

                    {/* Fila 6 */}
                    <Box>
                        <InputLabel sx={{ mb: 0.5, fontSize: "12px", fontWeight: 600, color: ui.text }}>
                            Dirección Domiciliaria
                        </InputLabel>
                        <TextField
                            variant="outlined"
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            placeholder="Ubicación de domicilio"
                            sx={modalFieldSx}
                        />
                    </Box>
                </Box>

                {/* RIGHT COLUMN - Photo full size */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: ui.text, alignSelf: "flex-start" }}>
                        Foto del cliente
                    </Typography>
                    <Box sx={{
                        width: "100%",
                        aspectRatio: "3/4",
                        border: "2px dashed #dbe3ef",
                        borderRadius: "12px",
                        overflow: "hidden",
                        bgcolor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        {currentPhotoUrl ? (
                            <Box
                                component="img"
                                src={currentPhotoUrl}
                                alt="Foto del cliente"
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    filter: processingPhoto ? "grayscale(0.25) opacity(0.72)" : "none",
                                    transition: "filter 160ms ease",
                                }}
                            />
                        ) : (
                            <Box sx={{ textAlign: "center", p: 2 }}>
                                <PersonAddIcon sx={{ color: "#94a3b8", fontSize: 48, mb: 1 }} />
                                <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>Sin foto</Typography>
                            </Box>
                        )}
                    </Box>
                    {photoMessage && (
                        <Typography
                            sx={{
                                fontSize: 10,
                                fontWeight: 900,
                                color: processingPhoto || photoMessage.includes("foto original")
                                    ? "#b77900"
                                    : (photoMessage.startsWith("No se") || photoMessage.includes("Error") ? "#b91c1c" : "#15803d"),
                            }}
                        >
                            {photoMessage}
                        </Typography>
                    )}
                    <Typography sx={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
                        Se intenta limpiar el fondo automáticamente
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                        <Box
                            component="label"
                            sx={{
                                flex: 1,
                                border: "1px solid rgba(224, 161, 0, 0.55)",
                                bgcolor: "#fff",
                                color: "#9a6b00",
                                borderRadius: "7px",
                                px: 1.2,
                                py: 0.75,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 950,
                                whiteSpace: "nowrap",
                                textAlign: "center",
                            }}
                        >
                            {processingPhoto ? "Procesando..." : "Cargar foto"}
                            <input hidden disabled={processingPhoto} type="file" accept="image/*" onChange={(e) => handlePhotoFile(e.target.files?.[0])} />
                        </Box>
                        {currentPhotoUrl && (
                            <Box
                                component="button"
                                type="button"
                                onClick={handleRemovePhoto}
                                sx={{
                                    flex: 1,
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    bgcolor: "#fff",
                                    color: "#b91c1c",
                                    borderRadius: "7px",
                                    px: 1.2,
                                    py: 0.75,
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 950,
                                    whiteSpace: "nowrap",
                                    textAlign: "center",
                                }}
                            >
                                Quitar
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Box>
        </PremiumModal>
    );
}
