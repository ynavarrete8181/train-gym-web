import { useEffect, useState } from "react";
import {
    Box,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import PremiumButton from "../../../../components/ui/PremiumButton";

const tiposCarga = [
    { value: "LIBRE", label: "Libre" },
    { value: "PORCENTAJE_RM", label: "% RM" },
    { value: "PESO_FIJO", label: "Peso fijo" },
    { value: "RPE", label: "RPE" },
    { value: "TIEMPO", label: "Tiempo" },
    { value: "DISTANCIA", label: "Distancia" },
];

const modosAplicacion = [
    { value: "POR_CADA_SERIE", label: "Por cada serie" },
    { value: "AL_FINAL", label: "Al final" },
    { value: "ENTRE_SERIES", label: "Entre series" },
];

const tiposBloque = ["DEPORTIVO", "HIBRIDO", "FUERZA", "POTENCIA", "ACCESORIOS", "MOVILIDAD"];

const cardSx = {
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: "12px",
    backgroundColor: "#fff",
};

const fieldGridSx = {
    display: "grid",
    gap: 1.25,
    gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
};

const compactFieldSx = {
    minWidth: 0,
};

const seriesFieldGridSx = {
    display: "grid",
    gap: 1,
    gridTemplateColumns: {
        xs: "repeat(2, minmax(0, 1fr))",
        md: "1fr 1.6fr 1fr 1fr 1fr 1.2fr 0.9fr 1fr",
    },
};

const transferSeriesFieldGridSx = {
    display: "grid",
    gap: 1,
    gridTemplateColumns: {
        xs: "repeat(2, minmax(0, 1fr))",
        md: "1fr 1.6fr 1fr 1fr 1fr 1.4fr 0.9fr",
    },
};

const createSeries = (numero = 1) => ({
    numero_serie: numero,
    tipo_carga: "LIBRE",
    porcentaje_rm: "",
    carga_fija: "",
    unidad_carga: "",
    repeticiones: "",
    tiempo_segundos: "",
    distancia_metros: "",
    rpe: "",
    descanso_segundos: "",
    tempo: "",
    observaciones: "",
});

const createTransferSeries = (numero = 1) => ({
    numero_serie: numero,
    tipo_carga: "LIBRE",
    porcentaje_rm: "",
    carga_fija: "",
    unidad_carga: "",
    repeticiones: "",
    tiempo_segundos: "",
    distancia_metros: "",
    rpe: "",
    observaciones: "",
});

const createTransfer = () => ({
    ejercicio_id: "",
    orden: 1,
    modo_aplicacion: "POR_CADA_SERIE",
    observaciones: "",
    series: [createTransferSeries(1)],
});

const createExercise = () => ({
    ejercicio_id: "",
    orden: 1,
    lado: "",
    observaciones: "",
    usa_rm: false,
    rm_referencia: "",
    rm_registro_id: "",
    modo_prescripcion: "POR_SERIE",
    descanso_segundos: "",
    tempo: "",
    rpe_objetivo: "",
    series: [createSeries(1)],
    transferencias: [],
});

const createBlock = () => ({
    nombre: "",
    tipo_bloque: "DEPORTIVO",
    orden: 1,
    observaciones: "",
    ejercicios: [createExercise()],
});

const normalizeNumber = (value) => {
    if (value === null || value === undefined) return null;

    if (typeof value === "string") {
        const cleaned = value.trim();
        if (cleaned === "") return null;

        const parsed = Number(cleaned);
        return Number.isNaN(parsed) ? null : parsed;
    }

    if (value === "") return null;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

export default function DayPlanEditor({ dayName, initialDay, ejercicios, saving, onSave, onCancel }) {
    const [state, setState] = useState({
        nombre_sesion: "",
        observaciones: "",
        bloques: [createBlock()],
    });

    useEffect(() => {
        if (initialDay) {
            setState({
                nombre_sesion: initialDay.nombre_sesion || "",
                observaciones: initialDay.observaciones || "",
                bloques: initialDay.bloques?.length
                    ? initialDay.bloques.map((bloque, blockIndex) => ({
                          nombre: bloque.nombre || "",
                          tipo_bloque: bloque.tipo_bloque || "DEPORTIVO",
                          orden: bloque.orden || blockIndex + 1,
                          observaciones: bloque.observaciones || "",
                          ejercicios: bloque.ejercicios?.length
                              ? bloque.ejercicios.map((ejercicio, exerciseIndex) => ({
                                    ejercicio_id: ejercicio.ejercicio_id || "",
                                    orden: ejercicio.orden || exerciseIndex + 1,
                                    lado: ejercicio.lado || "",
                                    observaciones: ejercicio.observaciones || "",
                                    usa_rm: !!ejercicio.usa_rm,
                                    rm_referencia: ejercicio.rm_referencia ?? "",
                                    rm_registro_id: ejercicio.rm_registro_id ?? "",
                                    modo_prescripcion: ejercicio.modo_prescripcion || "POR_SERIE",
                                    descanso_segundos: ejercicio.descanso_segundos ?? "",
                                    tempo: ejercicio.tempo || "",
                                    rpe_objetivo: ejercicio.rpe_objetivo ?? "",
                                    series: ejercicio.series?.length
                                        ? ejercicio.series.map((serie, seriesIndex) => ({
                                              numero_serie: serie.numero_serie || seriesIndex + 1,
                                              tipo_carga: serie.tipo_carga || "PORCENTAJE_RM",
                                              porcentaje_rm: serie.porcentaje_rm ?? "",
                                              carga_fija: serie.carga_fija ?? "",
                                              unidad_carga: serie.unidad_carga || "",
                                              repeticiones: serie.repeticiones || "",
                                              tiempo_segundos: serie.tiempo_segundos ?? "",
                                              distancia_metros: serie.distancia_metros ?? "",
                                              rpe: serie.rpe ?? "",
                                              descanso_segundos: serie.descanso_segundos ?? "",
                                              tempo: serie.tempo || "",
                                              observaciones: serie.observaciones || "",
                                          }))
                                        : [createSeries(1)],
                                    transferencias: ejercicio.transferencias?.length
                                        ? ejercicio.transferencias.map((transferencia, transferIndex) => ({
                                              ejercicio_id: transferencia.ejercicio_id || "",
                                              orden: transferencia.orden || transferIndex + 1,
                                              modo_aplicacion: transferencia.modo_aplicacion || "POR_CADA_SERIE",
                                              observaciones: transferencia.observaciones || "",
                                              series: transferencia.series?.length
                                                  ? transferencia.series.map((serie, transferSeriesIndex) => ({
                                                        numero_serie: serie.numero_serie || transferSeriesIndex + 1,
                                                        tipo_carga: serie.tipo_carga || "LIBRE",
                                                        porcentaje_rm: serie.porcentaje_rm ?? "",
                                                        carga_fija: serie.carga_fija ?? "",
                                                        unidad_carga: serie.unidad_carga || "",
                                                        repeticiones: serie.repeticiones || "",
                                                        tiempo_segundos: serie.tiempo_segundos ?? "",
                                                        distancia_metros: serie.distancia_metros ?? "",
                                                        rpe: serie.rpe ?? "",
                                                        observaciones: serie.observaciones || "",
                                                    }))
                                                  : [createTransferSeries(1)],
                                          }))
                                        : [],
                                }))
                              : [createExercise()],
                      }))
                    : [createBlock()],
            });
            return;
        }

        setState({
            nombre_sesion: "",
            observaciones: "",
            bloques: [createBlock()],
        });
    }, [initialDay, dayName]);

    const updateBlock = (index, field, value) => {
        setState((prev) => {
            const next = [...prev.bloques];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, bloques: next };
        });
    };

    const updateExercise = (blockIndex, exerciseIndex, field, value) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], [field]: value };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const updateSeries = (blockIndex, exerciseIndex, seriesIndex, field, value) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const series = [...exercises[exerciseIndex].series];
            series[seriesIndex] = { ...series[seriesIndex], [field]: value };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], series };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const updateTransfer = (blockIndex, exerciseIndex, transferIndex, field, value) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const transfers = [...exercises[exerciseIndex].transferencias];
            transfers[transferIndex] = { ...transfers[transferIndex], [field]: value };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], transferencias: transfers };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const updateTransferSeries = (blockIndex, exerciseIndex, transferIndex, seriesIndex, field, value) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const transfers = [...exercises[exerciseIndex].transferencias];
            const series = [...transfers[transferIndex].series];
            series[seriesIndex] = { ...series[seriesIndex], [field]: value };
            transfers[transferIndex] = { ...transfers[transferIndex], series };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], transferencias: transfers };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const addBlock = () => {
        setState((prev) => ({
            ...prev,
            bloques: [...prev.bloques, { ...createBlock(), orden: prev.bloques.length + 1 }],
        }));
    };

    const removeBlock = (index) => {
        setState((prev) => ({
            ...prev,
            bloques: prev.bloques.filter((_, currentIndex) => currentIndex !== index),
        }));
    };

    const addExercise = (blockIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            next[blockIndex] = {
                ...next[blockIndex],
                ejercicios: [
                    ...next[blockIndex].ejercicios,
                    { ...createExercise(), orden: next[blockIndex].ejercicios.length + 1 },
                ],
            };
            return { ...prev, bloques: next };
        });
    };

    const removeExercise = (blockIndex, exerciseIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            next[blockIndex] = {
                ...next[blockIndex],
                ejercicios: next[blockIndex].ejercicios.filter((_, currentIndex) => currentIndex !== exerciseIndex),
            };
            return { ...prev, bloques: next };
        });
    };

    const addSeries = (blockIndex, exerciseIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const currentSeries = exercises[exerciseIndex].series;
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                series: [...currentSeries, createSeries(currentSeries.length + 1)],
            };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const removeSeries = (blockIndex, exerciseIndex, seriesIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                series: exercises[exerciseIndex].series.filter((_, currentIndex) => currentIndex !== seriesIndex),
            };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const addTransfer = (blockIndex, exerciseIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const current = exercises[exerciseIndex].transferencias;
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                transferencias: [...current, { ...createTransfer(), orden: current.length + 1 }],
            };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const removeTransfer = (blockIndex, exerciseIndex, transferIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                transferencias: exercises[exerciseIndex].transferencias.filter((_, currentIndex) => currentIndex !== transferIndex),
            };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const addTransferSeries = (blockIndex, exerciseIndex, transferIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const transfers = [...exercises[exerciseIndex].transferencias];
            const current = transfers[transferIndex].series;
            transfers[transferIndex] = {
                ...transfers[transferIndex],
                series: [...current, createTransferSeries(current.length + 1)],
            };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], transferencias: transfers };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const removeTransferSeries = (blockIndex, exerciseIndex, transferIndex, seriesIndex) => {
        setState((prev) => {
            const next = [...prev.bloques];
            const exercises = [...next[blockIndex].ejercicios];
            const transfers = [...exercises[exerciseIndex].transferencias];
            transfers[transferIndex] = {
                ...transfers[transferIndex],
                series: transfers[transferIndex].series.filter((_, currentIndex) => currentIndex !== seriesIndex),
            };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], transferencias: transfers };
            next[blockIndex] = { ...next[blockIndex], ejercicios: exercises };
            return { ...prev, bloques: next };
        });
    };

    const handleSubmit = () => {
        onSave({
            nombre_sesion: state.nombre_sesion || null,
            observaciones: state.observaciones || null,
            bloques: state.bloques.map((bloque, blockIndex) => ({
                nombre: bloque.nombre || `Bloque ${blockIndex + 1}`,
                tipo_bloque: bloque.tipo_bloque || null,
                orden: Number(bloque.orden || blockIndex + 1),
                observaciones: bloque.observaciones || null,
                ejercicios: bloque.ejercicios
                    .filter((ejercicio) => ejercicio.ejercicio_id)
                    .map((ejercicio, exerciseIndex) => ({
                        ejercicio_id: Number(ejercicio.ejercicio_id),
                        orden: Number(ejercicio.orden || exerciseIndex + 1),
                        lado: ejercicio.lado || null,
                        observaciones: ejercicio.observaciones || null,
                        usa_rm: !!ejercicio.usa_rm,
                        rm_referencia: normalizeNumber(ejercicio.rm_referencia),
                        rm_registro_id: normalizeNumber(ejercicio.rm_registro_id),
                        modo_prescripcion: ejercicio.modo_prescripcion || "POR_SERIE",
                        descanso_segundos: normalizeNumber(ejercicio.descanso_segundos),
                        tempo: ejercicio.tempo || null,
                        rpe_objetivo: normalizeNumber(ejercicio.rpe_objetivo),
                        series: ejercicio.series.map((serie, seriesIndex) => ({
                            numero_serie: Number(serie.numero_serie || seriesIndex + 1),
                            tipo_carga: serie.tipo_carga || "LIBRE",
                            porcentaje_rm: normalizeNumber(serie.porcentaje_rm),
                            carga_fija: normalizeNumber(serie.carga_fija),
                            unidad_carga: serie.unidad_carga || null,
                            repeticiones: serie.repeticiones || null,
                            tiempo_segundos: normalizeNumber(serie.tiempo_segundos),
                            distancia_metros: normalizeNumber(serie.distancia_metros),
                            rpe: normalizeNumber(serie.rpe),
                            descanso_segundos: normalizeNumber(serie.descanso_segundos),
                            tempo: serie.tempo || null,
                            observaciones: serie.observaciones || null,
                        })),
                        transferencias: ejercicio.transferencias
                            .filter((transferencia) => transferencia.ejercicio_id)
                            .map((transferencia, transferIndex) => ({
                                ejercicio_id: Number(transferencia.ejercicio_id),
                                orden: Number(transferencia.orden || transferIndex + 1),
                                modo_aplicacion: transferencia.modo_aplicacion || "POR_CADA_SERIE",
                                observaciones: transferencia.observaciones || null,
                                series: transferencia.series.map((serie, seriesIndex) => ({
                                    numero_serie: Number(serie.numero_serie || seriesIndex + 1),
                                    tipo_carga: serie.tipo_carga || "LIBRE",
                                    porcentaje_rm: normalizeNumber(serie.porcentaje_rm),
                                    carga_fija: normalizeNumber(serie.carga_fija),
                                    unidad_carga: serie.unidad_carga || null,
                                    repeticiones: serie.repeticiones || null,
                                    tiempo_segundos: normalizeNumber(serie.tiempo_segundos),
                                    distancia_metros: normalizeNumber(serie.distancia_metros),
                                    rpe: normalizeNumber(serie.rpe),
                                    observaciones: serie.observaciones || null,
                                })),
                            })),
                    })),
            })),
        });
    };

    return (
        <Stack spacing={2}>
            <Box sx={{ ...cardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>
                    Editor detallado de {dayName}
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                    <TextField
                        label="Nombre de la sesión"
                        size="small"
                        value={state.nombre_sesion}
                        onChange={(event) => setState((prev) => ({ ...prev, nombre_sesion: event.target.value }))}
                    />
                    <TextField
                        label="Observaciones del día"
                        size="small"
                        value={state.observaciones}
                        onChange={(event) => setState((prev) => ({ ...prev, observaciones: event.target.value }))}
                    />
                </Box>
            </Box>

            {state.bloques.map((bloque, blockIndex) => (
                <Box key={`block-${blockIndex}`} sx={{ ...cardSx, p: 2, backgroundColor: "#fcfcfb" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 900, color: "#92400e" }}>
                            Bloque {blockIndex + 1}
                        </Typography>
                        <IconButton onClick={() => removeBlock(blockIndex)} sx={{ color: "#ef4444" }}>
                            <DeleteOutlineIcon />
                        </IconButton>
                    </Stack>

                    <Box sx={fieldGridSx}>
                        <TextField
                            label="Nombre del bloque"
                            size="small"
                            value={bloque.nombre}
                            onChange={(event) => updateBlock(blockIndex, "nombre", event.target.value)}
                            sx={{ gridColumn: { md: "span 4" } }}
                        />
                        <Select
                            size="small"
                            value={bloque.tipo_bloque}
                            onChange={(event) => updateBlock(blockIndex, "tipo_bloque", event.target.value)}
                            sx={{ gridColumn: { md: "span 3" } }}
                        >
                            {tiposBloque.map((tipo) => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
                        </Select>
                        <TextField
                            label="Orden"
                            size="small"
                            type="number"
                            value={bloque.orden}
                            onChange={(event) => updateBlock(blockIndex, "orden", event.target.value)}
                            sx={{ gridColumn: { md: "span 2" } }}
                        />
                        <TextField
                            label="Observaciones bloque"
                            size="small"
                            value={bloque.observaciones}
                            onChange={(event) => updateBlock(blockIndex, "observaciones", event.target.value)}
                            sx={{ gridColumn: { md: "span 3" } }}
                        />
                    </Box>

                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {bloque.ejercicios.map((ejercicio, exerciseIndex) => (
                            <Box key={`exercise-${blockIndex}-${exerciseIndex}`} sx={{ ...cardSx, p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                        Ejercicio {exerciseIndex + 1}
                                    </Typography>
                                    <IconButton onClick={() => removeExercise(blockIndex, exerciseIndex)} sx={{ color: "#ef4444" }}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                </Stack>

                                <Box sx={fieldGridSx}>
                                    <Select
                                        size="small"
                                        value={ejercicio.ejercicio_id}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "ejercicio_id", event.target.value)}
                                        displayEmpty
                                        sx={{ gridColumn: { md: "span 5" }, ...compactFieldSx }}
                                    >
                                        <MenuItem value="" disabled>Selecciona ejercicio</MenuItem>
                                        {ejercicios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
                                    </Select>
                                    <TextField
                                        label="Orden"
                                        size="small"
                                        type="number"
                                        value={ejercicio.orden}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "orden", event.target.value)}
                                        sx={{ gridColumn: { md: "span 1.5" }, ...compactFieldSx }}
                                    />
                                    <TextField
                                        label="Lado"
                                        size="small"
                                        value={ejercicio.lado}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "lado", event.target.value)}
                                        sx={{ gridColumn: { md: "span 1.5" }, ...compactFieldSx }}
                                    />
                                    <TextField
                                        label="Tempo"
                                        size="small"
                                        value={ejercicio.tempo}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "tempo", event.target.value)}
                                        sx={{ gridColumn: { md: "span 2" }, ...compactFieldSx }}
                                    />
                                    <TextField
                                        label="Descanso"
                                        size="small"
                                        type="number"
                                        value={ejercicio.descanso_segundos}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "descanso_segundos", event.target.value)}
                                        sx={{ gridColumn: { md: "span 1" }, ...compactFieldSx }}
                                    />
                                    <TextField
                                        label="RPE objetivo"
                                        size="small"
                                        type="number"
                                        value={ejercicio.rpe_objetivo}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "rpe_objetivo", event.target.value)}
                                        sx={{ gridColumn: { md: "span 1" }, ...compactFieldSx }}
                                    />
                                </Box>

                                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 1.5 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={ejercicio.usa_rm}
                                                onChange={(event) => updateExercise(blockIndex, exerciseIndex, "usa_rm", event.target.checked)}
                                                color="warning"
                                            />
                                        }
                                        label="Usa RM"
                                    />
                                    <TextField
                                        label="RM referencia"
                                        size="small"
                                        type="number"
                                        value={ejercicio.rm_referencia}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "rm_referencia", event.target.value)}
                                    />
                                    <Select
                                        size="small"
                                        value={ejercicio.modo_prescripcion}
                                        onChange={(event) => updateExercise(blockIndex, exerciseIndex, "modo_prescripcion", event.target.value)}
                                    >
                                        <MenuItem value="POR_SERIE">Por serie</MenuItem>
                                        <MenuItem value="GLOBAL">Global</MenuItem>
                                        <MenuItem value="SOLO_REPS">Solo reps</MenuItem>
                                        <MenuItem value="SOLO_TIEMPO">Solo tiempo</MenuItem>
                                    </Select>
                                </Stack>

                                <TextField
                                    label="Observaciones ejercicio"
                                    size="small"
                                    value={ejercicio.observaciones}
                                    onChange={(event) => updateExercise(blockIndex, exerciseIndex, "observaciones", event.target.value)}
                                    sx={{ mt: 1.5, width: "100%" }}
                                />

                                <Box sx={{ mt: 2 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#475569", mb: 1 }}>
                                        Series del ejercicio
                                    </Typography>
                                    <Stack spacing={1.25}>
                                        {ejercicio.series.map((serie, seriesIndex) => (
                                            <Box key={`series-${seriesIndex}`} sx={{ ...cardSx, p: 1.25, backgroundColor: "#f8fafc" }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                                                        Serie {seriesIndex + 1}
                                                    </Typography>
                                                    <IconButton onClick={() => removeSeries(blockIndex, exerciseIndex, seriesIndex)} sx={{ color: "#ef4444" }}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                <Box sx={seriesFieldGridSx}>
                                                    <TextField
                                                        label="N°"
                                                        size="small"
                                                        type="number"
                                                        value={serie.numero_serie}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "numero_serie", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <Select
                                                        size="small"
                                                        value={serie.tipo_carga}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "tipo_carga", event.target.value)}
                                                        sx={compactFieldSx}
                                                    >
                                                        {tiposCarga.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
                                                    </Select>
                                                    <TextField
                                                        label="% RM"
                                                        size="small"
                                                        type="number"
                                                        value={serie.porcentaje_rm}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "porcentaje_rm", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <TextField
                                                        label="Carga fija"
                                                        size="small"
                                                        type="number"
                                                        value={serie.carga_fija}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "carga_fija", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <TextField
                                                        label="Unidad"
                                                        size="small"
                                                        value={serie.unidad_carga}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "unidad_carga", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <TextField
                                                        label="Repeticiones"
                                                        size="small"
                                                        value={serie.repeticiones}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "repeticiones", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <TextField
                                                        label="RPE"
                                                        size="small"
                                                        type="number"
                                                        value={serie.rpe}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "rpe", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                    <TextField
                                                        label="Descanso"
                                                        size="small"
                                                        type="number"
                                                        value={serie.descanso_segundos}
                                                        onChange={(event) => updateSeries(blockIndex, exerciseIndex, seriesIndex, "descanso_segundos", event.target.value)}
                                                        sx={compactFieldSx}
                                                    />
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <PremiumButton variant="outline" startIcon={<AddIcon />} sx={{ mt: 1.25 }} onClick={() => addSeries(blockIndex, exerciseIndex)}>
                                        Agregar serie
                                    </PremiumButton>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#475569" }}>
                                            Transferencias
                                        </Typography>
                                        <PremiumButton variant="outline" startIcon={<AddIcon />} onClick={() => addTransfer(blockIndex, exerciseIndex)}>
                                            Agregar transferencia
                                        </PremiumButton>
                                    </Stack>

                                    <Stack spacing={1.25}>
                                        {ejercicio.transferencias.map((transferencia, transferIndex) => (
                                            <Box key={`transfer-${transferIndex}`} sx={{ ...cardSx, p: 1.5, backgroundColor: "#fff7ed" }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                                                        Transferencia {transferIndex + 1}
                                                    </Typography>
                                                    <IconButton onClick={() => removeTransfer(blockIndex, exerciseIndex, transferIndex)} sx={{ color: "#ef4444" }}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                <Box sx={fieldGridSx}>
                                                    <Select
                                                        size="small"
                                                        value={transferencia.ejercicio_id}
                                                        onChange={(event) => updateTransfer(blockIndex, exerciseIndex, transferIndex, "ejercicio_id", event.target.value)}
                                                        displayEmpty
                                                        sx={{ gridColumn: { md: "span 6" }, ...compactFieldSx }}
                                                    >
                                                        <MenuItem value="" disabled>Selecciona transferencia</MenuItem>
                                                        {ejercicios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
                                                    </Select>
                                                    <TextField
                                                        label="Orden"
                                                        size="small"
                                                        type="number"
                                                        value={transferencia.orden}
                                                        onChange={(event) => updateTransfer(blockIndex, exerciseIndex, transferIndex, "orden", event.target.value)}
                                                        sx={{ gridColumn: { md: "span 1.5" }, ...compactFieldSx }}
                                                    />
                                                    <Select
                                                        size="small"
                                                        value={transferencia.modo_aplicacion}
                                                        onChange={(event) => updateTransfer(blockIndex, exerciseIndex, transferIndex, "modo_aplicacion", event.target.value)}
                                                        sx={{ gridColumn: { md: "span 4.5" }, ...compactFieldSx }}
                                                    >
                                                        {modosAplicacion.map((modo) => <MenuItem key={modo.value} value={modo.value}>{modo.label}</MenuItem>)}
                                                    </Select>
                                                </Box>

                                                <TextField
                                                    label="Observaciones transferencia"
                                                    size="small"
                                                    value={transferencia.observaciones}
                                                    onChange={(event) => updateTransfer(blockIndex, exerciseIndex, transferIndex, "observaciones", event.target.value)}
                                                    sx={{ mt: 1.25, width: "100%" }}
                                                />

                                                <Stack spacing={1} sx={{ mt: 1.5 }}>
                                                    {transferencia.series.map((serie, seriesIndex) => (
                                                        <Box key={`transfer-series-${seriesIndex}`} sx={{ ...cardSx, p: 1.25, backgroundColor: "#ffffff" }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                                                                    Serie transferencia {seriesIndex + 1}
                                                                </Typography>
                                                                <IconButton onClick={() => removeTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex)} sx={{ color: "#ef4444" }}>
                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Stack>

                                                            <Box sx={transferSeriesFieldGridSx}>
                                                                <TextField
                                                                    label="N°"
                                                                    size="small"
                                                                    type="number"
                                                                    value={serie.numero_serie}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "numero_serie", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                                <Select
                                                                    size="small"
                                                                    value={serie.tipo_carga}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "tipo_carga", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                >
                                                                    {tiposCarga.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
                                                                </Select>
                                                                <TextField
                                                                    label="% RM"
                                                                    size="small"
                                                                    type="number"
                                                                    value={serie.porcentaje_rm}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "porcentaje_rm", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                                <TextField
                                                                    label="Carga"
                                                                    size="small"
                                                                    type="number"
                                                                    value={serie.carga_fija}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "carga_fija", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                                <TextField
                                                                    label="Unidad"
                                                                    size="small"
                                                                    value={serie.unidad_carga}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "unidad_carga", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                                <TextField
                                                                    label="Repeticiones"
                                                                    size="small"
                                                                    value={serie.repeticiones}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "repeticiones", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                                <TextField
                                                                    label="RPE"
                                                                    size="small"
                                                                    type="number"
                                                                    value={serie.rpe}
                                                                    onChange={(event) => updateTransferSeries(blockIndex, exerciseIndex, transferIndex, seriesIndex, "rpe", event.target.value)}
                                                                    sx={compactFieldSx}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Stack>

                                                <PremiumButton variant="outline" startIcon={<AddIcon />} sx={{ mt: 1.25 }} onClick={() => addTransferSeries(blockIndex, exerciseIndex, transferIndex)}>
                                                    Agregar serie transferencia
                                                </PremiumButton>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <PremiumButton variant="outline" startIcon={<AddIcon />} sx={{ mt: 1.5 }} onClick={() => addExercise(blockIndex)}>
                        Agregar ejercicio
                    </PremiumButton>
                </Box>
            ))}

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between">
                <PremiumButton variant="outline" startIcon={<AddIcon />} onClick={addBlock}>
                    Agregar bloque
                </PremiumButton>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <PremiumButton variant="cancelar" onClick={onCancel}>Cancelar</PremiumButton>
                    <PremiumButton variant="guardar" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar día"}
                    </PremiumButton>
                </Stack>
            </Stack>
        </Stack>
    );
}
