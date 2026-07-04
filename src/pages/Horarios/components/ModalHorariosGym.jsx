import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Grid,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Typography,
    Checkbox,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import {
    createHorario,
    updateHorario,
} from "../../../modules/horarios/api";
import {
    listCategoriasServicio,
    listServiciosByCategoria,
} from "../../../modules/servicios/api";
import {
    modalActionsSx,
    modalCancelButtonSx,
    modalContentSx,
    modalPaperSx,
    modalPrimaryButtonSx,
    modalTitleSx,
} from "../../../Styles/muiTheme";

const diasList = [
    { id: 1, label: "Lun" },
    { id: 2, label: "Mar" },
    { id: 3, label: "Mié" },
    { id: 4, label: "Jue" },
    { id: 5, label: "Vie" },
    { id: 6, label: "Sáb" },
    { id: 7, label: "Dom" },
];

const parseDias = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter(Number.isFinite);
    if (typeof raw === "string") {
        const s = raw.trim();
        try {
            const j = JSON.parse(s);
            if (Array.isArray(j)) return j.map(Number).filter(Number.isFinite);
        } catch {
            return s
                .replace(/[\[\]\s]/g, "")
                .split(",")
                .map((x) => Number(x))
                .filter(Number.isFinite);
        }
    }
    return [];
};

export default function ModalHorariosGym({ open, onClose, usr_id, dataEdit }) {
    const initialForm = {
        id: null,
        sede_id: 1,
        categoria_id: "",
        tipo_servicio_id: "",
        hora_apertura: null,
        hora_cierre: null,
        capacidad_maxima: "",
        tiempo_turno_min: "",
        tipo_usuario: "",
        dias: [],
        activo: true,
    };

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loadingServicios, setLoadingServicios] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [servicios, setServicios] = useState([]);

    const isEdit = Boolean(form.id);

    const clearError = (k) => {
        setErrors((p) => {
            if (!p[k]) return p;
            const n = { ...p };
            delete n[k];
            return n;
        });
    };

    const fetchCategorias = async () => {
        try {
            const arr = await listCategoriasServicio();
            setCategorias(arr);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudieron cargar las categorías.", "error");
        }
    };

    const fetchServiciosByCategoria = async (categoria_id, servicioToSelect = null) => {
        if (!categoria_id) {
            setServicios([]);
            return;
        }
        setLoadingServicios(true);
        try {
            const arr = await listServiciosByCategoria(categoria_id);
            setServicios(arr);

            if (servicioToSelect) {
                setForm((p) => ({ ...p, tipo_servicio_id: String(servicioToSelect) }));
            } else if (arr.length === 1) {
                const only = arr[0]?.id ?? arr[0]?.ts_id;
                setForm((p) => ({ ...p, tipo_servicio_id: String(only ?? "") }));
            }
        } catch (e) {
            console.error(e);
            setServicios([]);
            Swal.fire("Error", "No se pudieron cargar los servicios.", "error");
        } finally {
            setLoadingServicios(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        fetchCategorias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (!dataEdit) {
            setForm(initialForm);
            setServicios([]);
            setErrors({});
            return;
        }

        const d = dataEdit?.data || dataEdit;
        const id = d?.horario_id ?? d?.id ?? null;

        const categoria_id = d?.categoria_id ?? "";
        const tipo_servicio_id = d?.tipo_servicio_id ?? "";

        setForm({
            id,
            sede_id: d?.sede_id ?? 1,
            categoria_id: String(categoria_id ?? ""),
            tipo_servicio_id: String(tipo_servicio_id ?? ""),
            hora_apertura: d?.hora_apertura ? dayjs(d.hora_apertura, "HH:mm:ss") : null,
            hora_cierre: d?.hora_cierre ? dayjs(d.hora_cierre, "HH:mm:ss") : null,
            capacidad_maxima: d?.capacidad_maxima ?? "",
            tiempo_turno_min: d?.tiempo_turno_min ?? "",
            tipo_usuario: String(d?.tipo_usuario ?? ""),
            dias: parseDias(d?.dias ?? d?.dias_laborables ?? []),
            activo: Boolean(d?.activo),
        });

        setErrors({});

        if (categoria_id) {
            fetchServiciosByCategoria(categoria_id, tipo_servicio_id || null);
        } else {
            setServicios([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, dataEdit]);

    const toggleDia = (idDia) => {
        setForm((prev) => {
            const setDias = new Set(prev.dias || []);
            if (setDias.has(idDia)) setDias.delete(idDia);
            else setDias.add(idDia);
            const dias = Array.from(setDias).sort((a, b) => a - b);
            return { ...prev, dias };
        });
        clearError("dias");
    };

    const validate = () => {
        const e = {};

        if (!form.hora_apertura) e.hora_apertura = "Ingrese la hora de apertura";
        if (!form.hora_cierre) e.hora_cierre = "Ingrese la hora de cierre";
        if (form.hora_apertura && form.hora_cierre) {
            const a = dayjs(form.hora_apertura);
            const c = dayjs(form.hora_cierre);
            if (a.isValid() && c.isValid() && !a.isBefore(c)) {
                e.hora_cierre = "La hora de cierre debe ser mayor a la de apertura";
            }
        }

        if (!form.capacidad_maxima) e.capacidad_maxima = "Ingrese la capacidad máxima";
        if (!form.tiempo_turno_min) e.tiempo_turno_min = "Ingrese el tiempo por turno";
        if (!form.categoria_id) e.categoria_id = "Seleccione una categoría";
        if (!form.tipo_servicio_id) e.tipo_servicio_id = "Seleccione un servicio";
        if (!form.tipo_usuario) e.tipo_usuario = "Seleccione el tipo de usuario";
        if (!form.dias || form.dias.length === 0) e.dias = "Seleccione al menos un día";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChangeCategoria = async (categoria_id) => {
        setForm((p) => ({ ...p, categoria_id: String(categoria_id), tipo_servicio_id: "" }));
        clearError("categoria_id");
        clearError("tipo_servicio_id");
        await fetchServiciosByCategoria(categoria_id);
    };

    const handleSave = async () => {
        if (!validate()) {
            Swal.fire("Atención", "Por favor corrija los errores del formulario.", "warning");
            return;
        }

        setLoadingSave(true);
        try {
            const payload = {
                sede_id: Number(form.sede_id),
                tipo_servicio_id: Number(form.tipo_servicio_id),
                hora_apertura: dayjs(form.hora_apertura).format("HH:mm"),
                hora_cierre: dayjs(form.hora_cierre).format("HH:mm"),
                capacidad_maxima: Number(form.capacidad_maxima),
                tiempo_turno_min: Number(form.tiempo_turno_min),
                tipo_usuario: Number(form.tipo_usuario),
                dias_laborables: form.dias,
                activo: Boolean(form.activo),
                usr_id: usr_id ?? null,
            };

            const res = form.id
                ? await updateHorario(Number(form.id), payload)
                : await createHorario(payload);

            Swal.fire("Éxito", res?.message || "Horario guardado correctamente", "success");
            onClose?.();
        } catch (e) {
            console.error(e);
            Swal.fire("Error", e?.response?.data?.message || "Error al guardar", "error");
        } finally {
            setLoadingSave(false);
        }
    };

    const modalTitle = useMemo(() => (isEdit ? "Editar Horario" : "Registrar Horario"), [isEdit]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: modalPaperSx }}>
            <DialogTitle sx={modalTitleSx}>
                {modalTitle}
            </DialogTitle>

            <DialogContent sx={modalContentSx}>
                <Grid container spacing={1.5} mb={2}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--tg-text-dark)" }}>
                            Horarios
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Hora de Apertura"
                                value={form.hora_apertura}
                                onChange={(v) => {
                                    setForm((p) => ({ ...p, hora_apertura: v }));
                                    clearError("hora_apertura");
                                }}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        error: !!errors.hora_apertura,
                                        helperText: errors.hora_apertura,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Hora de Cierre"
                                value={form.hora_cierre}
                                onChange={(v) => {
                                    setForm((p) => ({ ...p, hora_cierre: v }));
                                    clearError("hora_cierre");
                                }}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        error: !!errors.hora_cierre,
                                        helperText: errors.hora_cierre,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--tg-text-dark)", mt: 1 }}>
                            Disponibilidad
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Tiempo por turno (min)"
                            size="small"
                            type="number"
                            fullWidth
                            value={form.tiempo_turno_min}
                            onChange={(e) => {
                                setForm((p) => ({ ...p, tiempo_turno_min: e.target.value }));
                                clearError("tiempo_turno_min");
                            }}
                            error={!!errors.tiempo_turno_min}
                            helperText={errors.tiempo_turno_min}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Capacidad máxima"
                            size="small"
                            type="number"
                            fullWidth
                            value={form.capacidad_maxima}
                            onChange={(e) => {
                                setForm((p) => ({ ...p, capacidad_maxima: e.target.value }));
                                clearError("capacidad_maxima");
                            }}
                            error={!!errors.capacidad_maxima}
                            helperText={errors.capacidad_maxima}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--tg-text-dark)", mt: 1 }}>
                            Servicio
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" error={!!errors.categoria_id}>
                            <InputLabel>Categoría</InputLabel>
                            <Select label="Categoría" value={form.categoria_id} onChange={(e) => handleChangeCategoria(e.target.value)}>
                                <MenuItem value="">
                                    <em>Seleccione</em>
                                </MenuItem>
                                {categorias.map((c) => {
                                    const id = c?.id ?? c?.cat_id;
                                    const nombre = c?.nombre ?? c?.cat_nombre;
                                    return (
                                        <MenuItem key={id} value={id}>
                                            {nombre}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            {errors.categoria_id ? <FormHelperText>{errors.categoria_id}</FormHelperText> : null}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" error={!!errors.tipo_servicio_id} disabled={loadingServicios}>
                            <InputLabel>Servicio</InputLabel>
                            <Select
                                label="Servicio"
                                value={form.tipo_servicio_id}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, tipo_servicio_id: e.target.value }));
                                    clearError("tipo_servicio_id");
                                }}
                            >
                                <MenuItem value="">
                                    <em>Seleccione</em>
                                </MenuItem>
                                {loadingServicios ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={16} />
                                        &nbsp; Cargando...
                                    </MenuItem>
                                ) : null}
                                {servicios.map((s) => {
                                    const id = s?.id ?? s?.ts_id;
                                    const nombre = s?.nombre ?? s?.ts_nombre;
                                    return (
                                        <MenuItem key={id} value={id}>
                                            {nombre}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            {errors.tipo_servicio_id ? <FormHelperText>{errors.tipo_servicio_id}</FormHelperText> : null}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl
                            component="fieldset"
                            error={!!errors.tipo_usuario}
                            sx={{
                                width: "100%",
                                bgcolor: "rgba(248,249,250,0.7)",
                                borderRadius: 1,
                                p: 2,
                                border: "1px solid var(--tg-card-border)",
                            }}
                        >
                            <FormLabel sx={{ color: "var(--tg-text-dark)", fontWeight: 900 }}>Tipo de Usuario</FormLabel>

                            <RadioGroup
                                row
                                value={form.tipo_usuario}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, tipo_usuario: e.target.value }));
                                    clearError("tipo_usuario");
                                }}
                            >
                                <FormControlLabel value="4" control={<Radio />} label="Cliente" />
                                <FormControlLabel value="5" control={<Radio />} label="Deportista" />
                            </RadioGroup>

                            {errors.tipo_usuario ? <FormHelperText>{errors.tipo_usuario}</FormHelperText> : null}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.dias}>
                            <Typography sx={{ fontWeight: 900, color: "var(--tg-text-dark)", mb: 1 }}>Días de la semana</Typography>

                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {diasList.map((d) => {
                                    const selected = (form.dias || []).includes(d.id);
                                    return (
                                        <Chip
                                            key={d.id}
                                            label={d.label}
                                            clickable
                                            onClick={() => toggleDia(d.id)}
                                            sx={{
                                                fontWeight: 900,
                                                border: "2px solid var(--tg-text-dark)",
                                                color: selected ? "#fff" : "var(--tg-text-dark)",
                                                bgcolor: selected ? "var(--tg-text-dark)" : "transparent",
                                                "&:hover": { bgcolor: selected ? "var(--tg-text-dark)" : "rgba(0,0,0,0.05)" },
                                            }}
                                        />
                                    );
                                })}
                            </Box>

                            {errors.dias ? <FormHelperText>{errors.dias}</FormHelperText> : null}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Checkbox checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} color="success" />}
                            label="Activo"
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={modalActionsSx}>
                <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />} sx={modalCancelButtonSx}>
                    Cancelar
                </Button>

                <Button
                    onClick={handleSave}
                    variant="outlined"
                    startIcon={loadingSave ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    disabled={loadingSave}
                    sx={modalPrimaryButtonSx}
                >
                    {loadingSave ? (form.id ? "Actualizando..." : "Guardando...") : (form.id ? "Actualizar" : "Guardar")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
