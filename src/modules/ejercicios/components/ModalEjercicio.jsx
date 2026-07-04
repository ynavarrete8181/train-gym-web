import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    FormHelperText,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    Button,
    Chip,
} from "@mui/material";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LinkIcon from "@mui/icons-material/Link";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import {
    globalUi,
    globalInputSx,
    globalMenuProps,
} from "../../../components/ui/GlobalUiTheme";

const GRUPOS_MUSCULARES = [
    { value: "PECHO", label: "Pecho" },
    { value: "ESPALDA", label: "Espalda" },
    { value: "PIERNAS", label: "Piernas" },
    { value: "HOMBROS", label: "Hombros" },
    { value: "BRAZOS", label: "Brazos" },
    { value: "ABDOMEN", label: "Abdomen" },
    { value: "CARDIO", label: "Cardio" },
    { value: "OTRO", label: "Otro" },
];

const EQUIPAMIENTOS = [
    { value: "MANCUERNAS", label: "Mancuernas" },
    { value: "BARRA", label: "Barra" },
    { value: "MAQUINA", label: "Máquina" },
    { value: "POLEA", label: "Polea" },
    { value: "PESO_CORPORAL", label: "Peso Corporal" },
    { value: "BANDA_RESISTENCIA", label: "Banda de Resistencia" },
    { value: "OTRO", label: "Otro" },
];

const TIPO_ENTRENAMIENTO = [
    { value: "GENERAL", label: "General" },
    { value: "HIBRIDO", label: "Híbrido" },
    { value: "DEPORTIVO", label: "Deportivo" },
];

const getEmbedUrl = (url) => {
    if (!url) return null;

    const cleanUrl = url.trim();

    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;

    const match = cleanUrl.match(regExp);

    if (match && match[2]?.length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    return null;
};

export default function ModalEjercicio({
    open,
    onClose,
    onSave,
    dataEdit,
    isEditMode = false,
}) {
    const [form, setForm] = useState({
        nombre: "",
        grupo_muscular: "",
        equipamiento: "",
        tipo_entrenamiento: "GENERAL",
        instrucciones: "",
        url_recurso: "",
        tipo_recurso: "link",
        video_file: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

    const embedUrl = useMemo(() => {
        return getEmbedUrl(form.url_recurso);
    }, [form.url_recurso]);

    useEffect(() => {
        if (!open) return;

        if (isEditMode && dataEdit) {
            setForm({
                nombre: dataEdit.nombre || "",
                grupo_muscular: dataEdit.grupo_muscular || "",
                equipamiento: dataEdit.equipamiento || "",
                tipo_entrenamiento: dataEdit.tipo_entrenamiento || "GENERAL",
                instrucciones: dataEdit.instrucciones || "",
                url_recurso: dataEdit.url_recurso || "",
                tipo_recurso: dataEdit.url_recurso ? "link" : "archivo",
                video_file: null,
            });
        } else {
            setForm({
                nombre: "",
                grupo_muscular: "",
                equipamiento: "",
                tipo_entrenamiento: "GENERAL",
                instrucciones: "",
                url_recurso: "",
                tipo_recurso: "link",
                video_file: null,
            });
        }

        setErrors({});
        setLoading(false);
    }, [open, isEditMode, dataEdit]);

    useEffect(() => {
        if (!form.video_file) {
            setVideoPreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(form.video_file);
        setVideoPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [form.video_file]);

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: "",
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!form.nombre.trim()) {
            newErrors.nombre = "El nombre del ejercicio es requerido";
        }

        if (!form.grupo_muscular) {
            newErrors.grupo_muscular = "El grupo muscular es requerido";
        }

        if (!form.equipamiento) {
            newErrors.equipamiento = "El equipamiento es requerido";
        }

        if (!form.tipo_entrenamiento) {
            newErrors.tipo_entrenamiento = "El tipo de entrenamiento es requerido";
        }

        if (form.tipo_recurso === "link" && form.url_recurso.trim()) {
            if (!getEmbedUrl(form.url_recurso)) {
                newErrors.url_recurso = "Ingrese un enlace válido de YouTube o Shorts";
            }
        }

        if (form.tipo_recurso === "archivo" && form.video_file) {
            const validTypes = ["video/mp4", "video/webm", "video/quicktime"];

            if (!validTypes.includes(form.video_file.type)) {
                newErrors.video_file = "Solo se permiten videos MP4, WEBM o MOV";
            }

            if (form.video_file.size > 80 * 1024 * 1024) {
                newErrors.video_file = "El video no debe superar los 80 MB";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            await onSave(form);
            onClose();
        } catch (err) {
            console.error(err);

            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const inputLabelSx = {
        mb: 0.65,
        fontSize: "12px",
        fontWeight: 900,
        color: globalUi.black,
        lineHeight: 1.1,
    };

    const helperSx = {
        minHeight: 18,
        mt: 0.35,
        ml: 0,
        fontSize: "11px",
        lineHeight: "16px",
    };

    const inputSx = {
        ...globalInputSx,
        "& .MuiInputBase-root": {
            height: 38,
            minHeight: 38,
            fontSize: "12px",
            backgroundColor: "#fff",
            borderRadius: "10px",
        },
        "& .MuiInputBase-input": {
            height: 38,
            boxSizing: "border-box",
            fontSize: "12px",
        },
    };

    const selectSx = {
        ...globalInputSx,
        height: 38,
        minHeight: 38,
        backgroundColor: "#fff",
        borderRadius: "10px",
        "& .MuiSelect-select": {
            height: 38,
            minHeight: 38,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pr: "32px !important",
        },
    };

    const textareaSx = {
        ...globalInputSx,
        "& .MuiInputBase-root": {
            minHeight: 184,
            alignItems: "flex-start",
            fontSize: "12px",
            backgroundColor: "#fff",
            borderRadius: "10px",
        },
        "& textarea": {
            fontSize: "12px",
            lineHeight: 1.45,
        },
    };

    const panelSx = {
        minWidth: 0,
        border: `1px solid ${globalUi.borderSoft}`,
        borderRadius: "18px",
        background: "#FFFFFF",
        p: 2.25,
    };

    const visualBoxSx = {
        mt: 1.2,
        width: "100%",
        height: 340,
        minHeight: 340,
        maxHeight: 340,
        borderRadius: "18px",
        overflow: "hidden",
        background: "linear-gradient(145deg, #0B1220 0%, #111827 100%)",
        border: `1px solid ${globalUi.borderSoft}`,
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    };

    const uploadDropSx = {
        ...visualBoxSx,
        border: `1.5px dashed ${
            errors.video_file ? globalUi.danger : globalUi.mustardBorder
        }`,
        background: globalUi.mustardSoft,
        cursor: "pointer",
        flexDirection: "column",
        textAlign: "center",
        px: 2,
        py: 3,
        boxShadow: "none",
        transition: "0.2s ease",
        "&:hover": {
            background: "rgba(255, 194, 14, 0.18)",
            transform: "translateY(-1px)",
        },
    };

    const sectionHeader = (number, title, subtitle) => (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, mb: 2 }}>
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: 900,
                    color: globalUi.black,
                    background: globalUi.mustardSoft,
                    border: `1px solid ${globalUi.mustardBorder}`,
                }}
            >
                {number}
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        fontSize: "14px",
                        fontWeight: 950,
                        color: globalUi.black,
                        lineHeight: 1.15,
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    sx={{
                        mt: 0.35,
                        fontSize: "12px",
                        color: globalUi.muted,
                        lineHeight: 1.35,
                    }}
                >
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={isEditMode ? "Editar Ejercicio" : "Añadir Ejercicio al Catálogo"}
            subtitle="Configura la información técnica y el recurso visual del ejercicio"
            icon={<FitnessCenterIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="lg"
            actions={
                <>
                    <PremiumButton
                        variant="cancelar"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </PremiumButton>

                    <PremiumButton
                        variant="guardar"
                        onClick={handleSubmit}
                        loading={loading}
                    >
                        Guardar
                    </PremiumButton>
                </>
            }
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    width: "100%",
                    maxWidth: 1080,
                    mx: "auto",
                    minWidth: 0,
                    py: 0.5,
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(0, 1fr) 390px",
                        },
                        gap: 2.5,
                        alignItems: "stretch",
                        minWidth: 0,
                    }}
                >
                    {/* COLUMNA IZQUIERDA */}
                    <Box sx={panelSx}>
                        {sectionHeader(
                            "1",
                            "Información del ejercicio",
                            "Datos principales para organizar el catálogo."
                        )}

                        <Box sx={{ minWidth: 0 }}>
                            <InputLabel sx={inputLabelSx}>
                                Nombre del Ejercicio *
                            </InputLabel>

                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.nombre}
                                onChange={(e) => handleChange("nombre", e.target.value)}
                                placeholder="Ej. Press de banca plano"
                                error={!!errors.nombre}
                                sx={inputSx}
                            />

                            <FormHelperText error={!!errors.nombre} sx={helperSx}>
                                {errors.nombre || " "}
                            </FormHelperText>
                        </Box>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "1fr 1fr",
                                },
                                gap: 1.6,
                                minWidth: 0,
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <InputLabel sx={inputLabelSx}>
                                    Grupo Muscular *
                                </InputLabel>

                                <Select
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={form.grupo_muscular}
                                    onChange={(e) =>
                                        handleChange("grupo_muscular", e.target.value)
                                    }
                                    error={!!errors.grupo_muscular}
                                    displayEmpty
                                    MenuProps={globalMenuProps}
                                    sx={selectSx}
                                    renderValue={(selected) => {
                                        if (!selected) return "Seleccione grupo";
                                        const item = GRUPOS_MUSCULARES.find(
                                            (grupo) => grupo.value === selected
                                        );
                                        return item?.label || selected;
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Seleccione grupo
                                    </MenuItem>

                                    {GRUPOS_MUSCULARES.map((grupo) => (
                                        <MenuItem key={grupo.value} value={grupo.value}>
                                            {grupo.label}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <FormHelperText
                                    error={!!errors.grupo_muscular}
                                    sx={helperSx}
                                >
                                    {errors.grupo_muscular || " "}
                                </FormHelperText>
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                                <InputLabel sx={inputLabelSx}>
                                    Equipamiento *
                                </InputLabel>

                                <Select
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={form.equipamiento}
                                    onChange={(e) =>
                                        handleChange("equipamiento", e.target.value)
                                    }
                                    error={!!errors.equipamiento}
                                    displayEmpty
                                    MenuProps={globalMenuProps}
                                    sx={selectSx}
                                    renderValue={(selected) => {
                                        if (!selected) return "Seleccione equipo";
                                        const item = EQUIPAMIENTOS.find(
                                            (equipo) => equipo.value === selected
                                        );
                                        return item?.label || selected;
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Seleccione equipo
                                    </MenuItem>

                                    {EQUIPAMIENTOS.map((equipo) => (
                                        <MenuItem key={equipo.value} value={equipo.value}>
                                            {equipo.label}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <FormHelperText
                                    error={!!errors.equipamiento}
                                    sx={helperSx}
                                >
                                    {errors.equipamiento || " "}
                                </FormHelperText>
                            </Box>
                        </Box>

                        <Box sx={{ minWidth: 0, mt: 0.2 }}>
                            <InputLabel sx={inputLabelSx}>
                                Tipo de Entrenamiento *
                            </InputLabel>

                            <Select
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={form.tipo_entrenamiento}
                                onChange={(e) =>
                                    handleChange("tipo_entrenamiento", e.target.value)
                                }
                                error={!!errors.tipo_entrenamiento}
                                MenuProps={globalMenuProps}
                                sx={selectSx}
                            >
                                {TIPO_ENTRENAMIENTO.map((tipo) => (
                                    <MenuItem key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </MenuItem>
                                ))}
                            </Select>

                            <FormHelperText
                                error={!!errors.tipo_entrenamiento}
                                sx={helperSx}
                            >
                                {errors.tipo_entrenamiento || " "}
                            </FormHelperText>
                        </Box>

                        <Box sx={{ mt: 0.4, minWidth: 0 }}>
                            <InputLabel sx={inputLabelSx}>
                                Instrucciones de Ejecución / Notas técnicas
                            </InputLabel>

                            <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                multiline
                                rows={7}
                                value={form.instrucciones}
                                onChange={(e) =>
                                    handleChange("instrucciones", e.target.value)
                                }
                                placeholder="Describe postura, movimiento, respiración, errores comunes y advertencias..."
                                sx={textareaSx}
                            />

                            <FormHelperText sx={helperSx}>
                                {" "}
                            </FormHelperText>
                        </Box>
                    </Box>

                    {/* COLUMNA DERECHA */}
                    <Box
                        sx={{
                            ...panelSx,
                            background:
                                "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                        }}
                    >
                        {sectionHeader(
                            "2",
                            "Recurso visual",
                            "Agrega un video por enlace o archivo."
                        )}

                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            size="small"
                            value={form.tipo_recurso}
                            onChange={(_, value) => {
                                if (!value) return;

                                setForm((prev) => ({
                                    ...prev,
                                    tipo_recurso: value,
                                    url_recurso:
                                        value === "archivo" ? "" : prev.url_recurso,
                                    video_file:
                                        value === "link" ? null : prev.video_file,
                                }));

                                setErrors({});
                            }}
                            sx={{
                                mb: 1.6,
                                height: 38,
                                background: "#fff",
                                borderRadius: "12px",
                                "& .MuiToggleButton-root": {
                                    height: 38,
                                    textTransform: "none",
                                    fontSize: "12px",
                                    fontWeight: 900,
                                    color: globalUi.black,
                                    borderColor: globalUi.border,
                                    py: 0,
                                },
                                "& .Mui-selected": {
                                    backgroundColor: `${globalUi.mustardSoft} !important`,
                                    borderColor: `${globalUi.mustardBorder} !important`,
                                    color: `${globalUi.black} !important`,
                                },
                            }}
                        >
                            <ToggleButton value="link">
                                <LinkIcon sx={{ fontSize: 17, mr: 0.7 }} />
                                Link
                            </ToggleButton>

                            <ToggleButton value="archivo">
                                <CloudUploadIcon sx={{ fontSize: 17, mr: 0.7 }} />
                                Subir
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {form.tipo_recurso === "link" && (
                            <Box sx={{ minWidth: 0 }}>
                                <InputLabel sx={inputLabelSx}>
                                    Enlace de YouTube o Shorts
                                </InputLabel>

                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={form.url_recurso}
                                    onChange={(e) =>
                                        handleChange("url_recurso", e.target.value)
                                    }
                                    placeholder="https://youtube.com/shorts/..."
                                    error={!!errors.url_recurso}
                                    sx={inputSx}
                                />

                                <FormHelperText
                                    error={!!errors.url_recurso}
                                    sx={helperSx}
                                >
                                    {errors.url_recurso ||
                                        "Se genera una vista previa automática."}
                                </FormHelperText>

                                <Box sx={visualBoxSx}>
                                    {embedUrl ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={embedUrl}
                                            title="Video instructivo"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <Box sx={{ textAlign: "center", px: 3 }}>
                                            <Box
                                                sx={{
                                                    width: 58,
                                                    height: 58,
                                                    mx: "auto",
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid rgba(255,255,255,0.22)",
                                                    background: "rgba(255,255,255,0.06)",
                                                }}
                                            >
                                                <PlayCircleOutlineIcon
                                                    sx={{
                                                        fontSize: 36,
                                                        color: "rgba(255,255,255,0.78)",
                                                    }}
                                                />
                                            </Box>

                                            <Typography
                                                sx={{
                                                    mt: 1.4,
                                                    fontSize: "13px",
                                                    fontWeight: 950,
                                                    color: "#fff",
                                                }}
                                            >
                                                Vista previa
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.5,
                                                    fontSize: "12px",
                                                    color: "rgba(255,255,255,0.58)",
                                                    lineHeight: 1.35,
                                                }}
                                            >
                                                Pega un enlace válido de YouTube o Shorts.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {form.tipo_recurso === "archivo" && (
                            <Box sx={{ minWidth: 0 }}>
                                <InputLabel sx={inputLabelSx}>
                                    Archivo de video
                                </InputLabel>

                                <Button
                                    fullWidth
                                    component="label"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        height: 38,
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontSize: "12px",
                                        fontWeight: 900,
                                        color: globalUi.black,
                                        background: "#fff",
                                        border: `1px solid ${globalUi.border}`,
                                        justifyContent: "center",
                                        "&:hover": {
                                            background: globalUi.mustardSoft,
                                            borderColor: globalUi.mustardBorder,
                                        },
                                    }}
                                >
                                    Seleccionar video
                                    <input
                                        hidden
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            handleChange("video_file", file);
                                        }}
                                    />
                                </Button>

                                <FormHelperText
                                    error={!!errors.video_file}
                                    sx={helperSx}
                                >
                                    {errors.video_file ||
                                        "MP4, WEBM o MOV. Máximo 80 MB."}
                                </FormHelperText>

                                {!form.video_file && (
                                    <Box component="label" sx={uploadDropSx}>
                                        <CloudUploadIcon
                                            sx={{
                                                fontSize: 46,
                                                color: globalUi.mustardDark,
                                                mb: 1.2,
                                            }}
                                        />

                                        <Typography
                                            sx={{
                                                fontSize: "13px",
                                                fontWeight: 950,
                                                color: globalUi.black,
                                            }}
                                        >
                                            Arrastra o selecciona un video
                                        </Typography>

                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                fontSize: "12px",
                                                color: globalUi.muted,
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            El video se mostrará aquí con el mismo tamaño.
                                        </Typography>

                                        <input
                                            hidden
                                            type="file"
                                            accept="video/mp4,video/webm,video/quicktime"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                handleChange("video_file", file);
                                            }}
                                        />
                                    </Box>
                                )}

                                {form.video_file && (
                                    <Box sx={visualBoxSx}>
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 10,
                                                left: 10,
                                                right: 10,
                                                zIndex: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 1,
                                            }}
                                        >
                                            <Chip
                                                size="small"
                                                label={form.video_file.name}
                                                sx={{
                                                    maxWidth: "70%",
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    color: "#fff",
                                                    background: "rgba(15, 23, 42, 0.75)",
                                                    backdropFilter: "blur(8px)",
                                                    border: "1px solid rgba(255,255,255,0.16)",
                                                    "& .MuiChip-label": {
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    },
                                                }}
                                            />

                                            <Button
                                                size="small"
                                                startIcon={<DeleteOutlineIcon />}
                                                onClick={() =>
                                                    handleChange("video_file", null)
                                                }
                                                sx={{
                                                    minWidth: "auto",
                                                    height: 28,
                                                    px: 1.2,
                                                    borderRadius: "9px",
                                                    textTransform: "none",
                                                    fontSize: "11px",
                                                    fontWeight: 900,
                                                    color: "#fff",
                                                    background: "rgba(185, 28, 28, 0.82)",
                                                    backdropFilter: "blur(8px)",
                                                    "&:hover": {
                                                        background: "rgba(185, 28, 28, 0.95)",
                                                    },
                                                }}
                                            >
                                                Quitar
                                            </Button>
                                        </Box>

                                        <video
                                            src={videoPreviewUrl}
                                            controls
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </PremiumModal>
    );
}
