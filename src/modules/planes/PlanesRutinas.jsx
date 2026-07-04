import { useEffect, useMemo, useState } from "react";
import { Box, Chip, FormControl, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Tooltip, Autocomplete, Collapse, Switch, FormControlLabel } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import PremiumButton from "../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";
import ModalPlan from "./components/ModalPlan";
import ModalRutina from "./components/ModalRutina";

const labelSx = {
    mb: 0.5,
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
};

const diasSemana = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

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

export default function PlanesRutinas() {
    const navigate = useNavigate();
    const [buscar, setBuscar] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [personas, setPersonas] = useState([]);
    const [ejercicios, setEjercicios] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [plantillas, setPlantillas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [rutinas, setRutinas] = useState([]);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [planEdit, setPlanEdit] = useState(null);
    const [rutinaModalOpen, setRutinaModalOpen] = useState(false);
    const [rutinaEdit, setRutinaEdit] = useState(null);

    // Estados para edición inline
    const [editingDay, setEditingDay] = useState(null); // { semana, dia }
    const [editingItems, setEditingItems] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});

    const fetchBase = async () => {
        const [personasRes, ejerciciosRes, planesRes] = await Promise.all([
            apiClient.get("/gimnasio/personas"),
            apiClient.get("/gimnasio/ejercicios"),
            apiClient.get("/gimnasio/planes", { params: { buscar, estado: estadoFiltro } }),
        ]);

        const nextPlanes = planesRes.data || [];
        setPersonas(personasRes.data || []);
        setEjercicios(ejerciciosRes.data || []);
        setPlanes(nextPlanes);

        if (selectedPersona) {
            const personaPlanes = nextPlanes.filter((p) => p.persona_id === selectedPersona.id);
            setSelectedPlan((prev) => {
                if (!personaPlanes.length) return null;
                if (!prev?.id) return personaPlanes[0];
                return personaPlanes.find((item) => item.id === prev.id) || personaPlanes[0];
            });
        } else {
            setSelectedPlan((prev) => {
                if (!nextPlanes.length) return null;
                if (!prev?.id) return nextPlanes[0];
                return nextPlanes.find((item) => item.id === prev.id) || nextPlanes[0];
            });
        }
    };

    const fetchPlantillas = async () => {
        const { data } = await apiClient.get("/gimnasio/rutina-plantillas");
        setPlantillas(data || []);
    };

    const fetchRutinas = async (planId) => {
        const { data } = await apiClient.get(`/gimnasio/planes/${planId}/rutinas`);
        setRutinas(data || []);
    };

    useEffect(() => {
        fetchBase().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar Planes / Rutinas."), "error");
        });
    }, [buscar, estadoFiltro]);

    useEffect(() => {
        fetchPlantillas().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar las plantillas de rutina."), "error");
        });
    }, []);

    useEffect(() => {
        if (!selectedPlan?.id) {
            setRutinas([]);
            return;
        }

        fetchRutinas(selectedPlan.id).catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar la rutina del plan."), "error");
        });
    }, [selectedPlan?.id]);

    const semanasDisponibles = useMemo(() => {
        return [...new Set(rutinas.map((item) => Number(item.semana)).filter(Boolean))].sort((a, b) => a - b);
    }, [rutinas]);

    const rutinasAgrupadas = useMemo(() => {
        const semanas = new Map();

        // Asegurar que al menos existan semanas encontradas
        rutinas.forEach((item) => {
            const semanaKey = `Semana ${item.semana}`;
            if (!semanas.has(semanaKey)) semanas.set(semanaKey, new Map());

            const dias = semanas.get(semanaKey);
            if (!dias.has(item.dia)) dias.set(item.dia, new Map());

            const bloques = dias.get(item.dia);
            const bloqueKey = item.bloque || "Bloque general";
            if (!bloques.has(bloqueKey)) bloques.set(bloqueKey, []);

            bloques.get(bloqueKey).push(item);
        });

        return Array.from(semanas.entries()).map(([semana, dias]) => {
            const semanaNum = Number(semana.replace("Semana ", ""));
            // Mapear los 7 días de la semana de manera ordenada
            const diasMapeados = diasSemana.map((nombreDia) => {
                const bloquesMap = dias.get(nombreDia);
                if (!bloquesMap) {
                    return { dia: nombreDia, bloques: [], isEmpty: true };
                }
                return {
                    dia: nombreDia,
                    isEmpty: false,
                    bloques: Array.from(bloquesMap.entries()).map(([bloque, items]) => ({
                        bloque,
                        bloqueOrden: Math.min(...items.map((entry) => Number(entry.bloque_orden || 1))),
                        items: [...items].sort((a, b) => Number(a.orden || 1) - Number(b.orden || 1)),
                    })).sort((a, b) => a.bloqueOrden - b.bloqueOrden),
                };
            });

            return {
                semana,
                semanaNum,
                dias: diasMapeados,
            };
        });
    }, [rutinas]);

    const buildRutinaPayload = (item, overrides = {}) => ({
        semana: Number(item.semana),
        dia: item.dia,
        bloque: item.bloque || "",
        ejercicio_id: Number(item.ejercicio_id),
        series: Number(item.series),
        repeticiones: item.repeticiones || "",
        carga_objetivo: item.carga_objetivo ?? null,
        tipo_carga: item.tipo_carga || "LIBRE",
        unidad_objetivo: item.unidad_objetivo || "",
        tempo: item.tempo || "",
        rpe: item.rpe ?? null,
        descanso_segundos: item.descanso_segundos ?? null,
        bloque_orden: Number(item.bloque_orden || 1),
        orden: Number(item.orden || 1),
        notas: item.notas || "",
        ejercicio_transferencia_id: item.ejercicio_transferencia_id ?? null,
        repeticiones_transferencia: item.repeticiones_transferencia ?? null,
        series_detalles: item.series_detalles ?? [],
        ...overrides,
    });

    const handleSavePlan = async (payload) => {
        try {
            if (planEdit?.id) {
                await apiClient.put(`/gimnasio/planes/${planEdit.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/planes", payload);
            }
            setPlanModalOpen(false);
            setPlanEdit(null);
            await fetchBase();
            Swal.fire("Éxito", "Plan guardado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el plan."), "error");
        }
    };

    const handleDeletePlan = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar plan?",
            text: "También se eliminarán sus rutinas asociadas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/planes/${id}`);
            if (selectedPlan?.id === id) {
                setSelectedPlan(null);
                setRutinas([]);
            }
            await fetchBase();
            Swal.fire("Eliminado", "Plan eliminado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar el plan."), "error");
        }
    };

    const handleSaveRutina = async (payload) => {
        if (!selectedPlan?.id) return;

        try {
            if (rutinaEdit?.id) {
                await apiClient.put(`/gimnasio/planes/${selectedPlan.id}/rutinas/${rutinaEdit.id}`, payload);
            } else {
                await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/rutinas`, payload);
            }
            setRutinaModalOpen(false);
            setRutinaEdit(null);
            await fetchRutinas(selectedPlan.id);
            Swal.fire("Éxito", "Rutina guardada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar la rutina."), "error");
        }
    };

    const handleDeleteRutina = async (id) => {
        if (!selectedPlan?.id) return;

        const result = await Swal.fire({
            title: "¿Eliminar rutina?",
            text: "Se quitará este ejercicio del plan seleccionado.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/planes/${selectedPlan.id}/rutinas/${id}`);
            await fetchRutinas(selectedPlan.id);
            Swal.fire("Eliminado", "Rutina eliminada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar la rutina."), "error");
        }
    };

    const handleDuplicatePlan = async () => {
        if (!selectedPlan?.id) return;

        const { value: nombre } = await Swal.fire({
            title: "Duplicar plan",
            text: "Ingresa el nombre del nuevo plan duplicado.",
            input: "text",
            inputValue: `${selectedPlan.nombre} Copia`,
            showCancelButton: true,
            confirmButtonText: "Duplicar",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => (!value?.trim() ? "El nombre es obligatorio." : undefined),
        });

        if (!nombre) return;

        try {
            await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/duplicar`, {
                nombre: nombre.trim(),
                estado: "BORRADOR",
            });
            await fetchBase();
            Swal.fire("Éxito", "Plan duplicado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo duplicar el plan."), "error");
        }
    };

    const handleDuplicateWeek = async () => {
        if (!selectedPlan?.id || !semanasDisponibles.length) return;

        const semanaOptions = semanasDisponibles.reduce((acc, semana) => {
            acc[semana] = `Semana ${semana}`;
            return acc;
        }, {});

        const { value: semanaOrigen } = await Swal.fire({
            title: "Semana origen",
            text: "Selecciona la semana que quieres copiar.",
            input: "select",
            inputOptions: semanaOptions,
            inputValue: String(semanasDisponibles[0]),
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: "Cancelar",
        });

        if (!semanaOrigen) return;

        const defaultDestino = Math.max(...semanasDisponibles) + 1;
        const { value: semanaDestino } = await Swal.fire({
            title: "Semana destino",
            text: "Ingresa el número de la nueva semana.",
            input: "number",
            inputValue: defaultDestino,
            showCancelButton: true,
            confirmButtonText: "Duplicar",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
                const parsed = Number(value);
                if (!parsed || parsed < 1) return "La semana destino debe ser mayor a 0.";
                if (parsed === Number(semanaOrigen)) return "La semana destino debe ser distinta a la origen.";
                return undefined;
            },
        });

        if (!semanaDestino) return;

        try {
            await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/rutinas/duplicar-semana`, {
                semana_origen: Number(semanaOrigen),
                semana_destino: Number(semanaDestino),
            });
            await fetchRutinas(selectedPlan.id);
            Swal.fire("Éxito", `Semana ${semanaOrigen} duplicada hacia semana ${semanaDestino}.`, "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo duplicar la semana."), "error");
        }
    };

    const handleSaveTemplateFromWeek = async () => {
        if (!selectedPlan?.id || !semanasDisponibles.length) return;

        const semanaOptions = semanasDisponibles.reduce((acc, semana) => {
            acc[semana] = `Semana ${semana}`;
            return acc;
        }, {});

        const { value: semanaOrigen } = await Swal.fire({
            title: "Guardar como plantilla",
            text: "Selecciona la semana base para convertirla en plantilla.",
            input: "select",
            inputOptions: semanaOptions,
            inputValue: String(semanasDisponibles[0]),
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: "Cancelar",
        });

        if (!semanaOrigen) return;

        const { value: nombre } = await Swal.fire({
            title: "Nombre de plantilla",
            input: "text",
            inputValue: `${selectedPlan.nombre} · Semana ${semanaOrigen}`,
            showCancelButton: true,
            confirmButtonText: "Guardar",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => (!value?.trim() ? "El nombre es obligatorio." : undefined),
        });

        if (!nombre) return;

        try {
            await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/rutina-plantillas`, {
                semana_origen: Number(semanaOrigen),
                nombre: nombre.trim(),
                objetivo: selectedPlan.objetivo || null,
            });
            await fetchPlantillas();
            Swal.fire("Éxito", "Plantilla guardada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar la plantilla."), "error");
        }
    };

    const handleApplyTemplate = async () => {
        if (!selectedPlan?.id || !plantillas.length) return;

        const plantillaOptions = plantillas.reduce((acc, item) => {
            acc[item.id] = `${item.nombre} · ${item.total_items} ejercicios`;
            return acc;
        }, {});

        const { value: plantillaId } = await Swal.fire({
            title: "Aplicar plantilla",
            text: "Selecciona la plantilla que quieres cargar en este plan.",
            input: "select",
            inputOptions: plantillaOptions,
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: "Cancelar",
        });

        if (!plantillaId) return;

        const defaultDestino = semanasDisponibles.length ? Math.max(...semanasDisponibles) + 1 : 1;
        const { value: semanaDestino } = await Swal.fire({
            title: "Semana destino",
            text: "Ingresa la semana donde quieres aplicar la plantilla.",
            input: "number",
            inputValue: defaultDestino,
            showCancelButton: true,
            confirmButtonText: "Aplicar",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
                const parsed = Number(value);
                if (!parsed || parsed < 1) return "La semana debe ser mayor a 0.";
                return undefined;
            },
        });

        if (!semanaDestino) return;

        try {
            await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/rutina-plantillas/aplicar`, {
                plantilla_id: Number(plantillaId),
                semana_destino: Number(semanaDestino),
            });
            await fetchRutinas(selectedPlan.id);
            Swal.fire("Éxito", "Plantilla aplicada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo aplicar la plantilla."), "error");
        }
    };

    const handleDeleteTemplate = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar plantilla?",
            text: "La plantilla dejará de estar disponible para futuros planes.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/rutina-plantillas/${id}`);
            await fetchPlantillas();
            Swal.fire("Eliminado", "Plantilla eliminada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar la plantilla."), "error");
        }
    };

    const handleMoveExercise = async (items, currentIndex, direction) => {
        if (!selectedPlan?.id) return;

        const targetIndex = currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const currentItem = items[currentIndex];
        const targetItem = items[targetIndex];

        try {
            await Promise.all([
                apiClient.put(`/gimnasio/planes/${selectedPlan.id}/rutinas/${currentItem.id}`, buildRutinaPayload(currentItem, { orden: Number(targetItem.orden || 1) })),
                apiClient.put(`/gimnasio/planes/${selectedPlan.id}/rutinas/${targetItem.id}`, buildRutinaPayload(targetItem, { orden: Number(currentItem.orden || 1) })),
            ]);
            await fetchRutinas(selectedPlan.id);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo reordenar el ejercicio."), "error");
        }
    };

    const handleMoveBlock = async (diaBlocks, blockIndex, direction) => {
        if (!selectedPlan?.id) return;

        const targetIndex = blockIndex + direction;
        if (targetIndex < 0 || targetIndex >= diaBlocks.length) return;

        const currentBlock = diaBlocks[blockIndex];
        const targetBlock = diaBlocks[targetIndex];

        try {
            await Promise.all([
                ...currentBlock.items.map((item) =>
                    apiClient.put(`/gimnasio/planes/${selectedPlan.id}/rutinas/${item.id}`, buildRutinaPayload(item, { bloque_orden: Number(targetBlock.bloqueOrden || 1) }))
                ),
                ...targetBlock.items.map((item) =>
                    apiClient.put(`/gimnasio/planes/${selectedPlan.id}/rutinas/${item.id}`, buildRutinaPayload(item, { bloque_orden: Number(currentBlock.bloqueOrden || 1) }))
                ),
            ]);
            await fetchRutinas(selectedPlan.id);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo reordenar el bloque."), "error");
        }
    };

    // Funciones para Edición Inline Diario
    const handleStartEditDay = (semanaNum, diaName, items) => {
        setEditingDay({ semana: semanaNum, dia: diaName });
        setExpandedRows({});
        setEditingItems(
            items.map((item) => ({
                id: item.id,
                orden: item.orden || 1,
                bloque: item.bloque || "",
                ejercicio_id: item.ejercicio_id || "",
                series: item.series || 4,
                repeticiones: item.repeticiones || "",
                carga_objetivo: item.carga_objetivo ?? "",
                tipo_carga: item.tipo_carga || "LIBRE",
                unidad_objetivo: item.unidad_objetivo || getUnidadSugerida(item.tipo_carga || "LIBRE"),
                tempo: item.tempo || "",
                rpe: item.rpe ?? "",
                descanso_segundos: item.descanso_segundos ?? "",
                notas: item.notas || "",
                tiene_transferencia: !!item.ejercicio_transferencia_id,
                ejercicio_transferencia_id: item.ejercicio_transferencia_id || "",
                repeticiones_transferencia: item.repeticiones_transferencia || "",
                series_detalles: Array.isArray(item.series_detalles) && item.series_detalles.length > 0
                    ? [...item.series_detalles]
                    : Array.from({ length: item.series || 4 }, (_, i) => ({
                          numero: i + 1,
                          repeticiones: item.repeticiones || "",
                          carga_objetivo: item.carga_objetivo ?? "",
                          tipo_carga: item.tipo_carga || "LIBRE",
                          rpe: item.rpe ?? "",
                      })),
            }))
        );
    };

    const handleAddRowInline = () => {
        setEditingItems((prev) => {
            const nextOrden = prev.length ? Math.max(...prev.map((i) => Number(i.orden || 1))) + 1 : 1;
            return [
                ...prev,
                {
                    id: null,
                    orden: nextOrden,
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
                    series_detalles: Array.from({ length: 4 }, (_, i) => ({
                        numero: i + 1,
                        repeticiones: "",
                        carga_objetivo: "",
                        tipo_carga: "LIBRE",
                        rpe: "",
                    })),
                },
            ];
        });
    };

    const handleUpdateRowField = (index, field, value) => {
        setEditingItems((prev) => {
            const next = [...prev];
            const updatedItem = { ...next[index], [field]: value };

            if (field === "tipo_carga") {
                updatedItem.unidad_objetivo = getUnidadSugerida(value);
            }

            if (field === "series") {
                const count = Math.max(1, parseInt(value) || 1);
                const currentDetails = updatedItem.series_detalles || [];
                const nextDetails = [];
                for (let i = 0; i < count; i++) {
                    if (currentDetails[i]) {
                        nextDetails.push(currentDetails[i]);
                    } else {
                        nextDetails.push({
                            numero: i + 1,
                            repeticiones: updatedItem.repeticiones || "",
                            carga_objetivo: updatedItem.carga_objetivo ?? "",
                            tipo_carga: updatedItem.tipo_carga || "LIBRE",
                            rpe: updatedItem.rpe ?? "",
                        });
                    }
                }
                updatedItem.series = count;
                updatedItem.series_detalles = nextDetails;
            }

            next[index] = updatedItem;
            return next;
        });
    };

    const handleUpdateSeriesDetail = (rowIndex, seriesIndex, field, value) => {
        setEditingItems((prev) => {
            const next = [...prev];
            const item = { ...next[rowIndex] };
            const details = [...(item.series_detalles || [])];
            details[seriesIndex] = { ...details[seriesIndex], [field]: value };
            item.series_detalles = details;
            next[rowIndex] = item;
            return next;
        });
    };

    const handleRemoveRowInline = (index) => {
        setEditingItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveInlineDay = async () => {
        if (!selectedPlan?.id || !editingDay) return;

        // Validar que se haya elegido ejercicio
        for (const item of editingItems) {
            if (!item.ejercicio_id) {
                Swal.fire("Falta información", "Asegúrate de seleccionar un ejercicio en todas las filas.", "warning");
                return;
            }
        }

        try {
            const payload = {
                semana: editingDay.semana,
                dia: editingDay.dia,
                rutinas: editingItems.map((item) => ({
                    id: item.id,
                    bloque: item.bloque || "",
                    ejercicio_id: Number(item.ejercicio_id),
                    series: Number(item.series),
                    repeticiones: item.repeticiones || "",
                    carga_objetivo: item.carga_objetivo !== "" ? Number(item.carga_objetivo) : null,
                    tipo_carga: item.tipo_carga,
                    unidad_objetivo: item.unidad_objetivo || "",
                    tempo: item.tempo || "",
                    rpe: item.rpe !== "" ? Number(item.rpe) : null,
                    descanso_segundos: item.descanso_segundos !== "" ? Number(item.descanso_segundos) : null,
                    bloque_orden: 1,
                    orden: Number(item.orden || 1),
                    notas: item.notas || "",
                    ejercicio_transferencia_id: item.tiene_transferencia && item.ejercicio_transferencia_id ? Number(item.ejercicio_transferencia_id) : null,
                    repeticiones_transferencia: item.tiene_transferencia && item.repeticiones_transferencia ? Number(item.repeticiones_transferencia) : null,
                    series_detalles: item.series_detalles.map((s) => ({
                        ...s,
                        carga_objetivo: s.carga_objetivo !== "" ? Number(s.carga_objetivo) : null,
                        rpe: s.rpe !== "" ? Number(s.rpe) : null,
                    })),
                })),
            };

            await apiClient.post(`/gimnasio/planes/${selectedPlan.id}/rutinas/batch`, payload);
            setEditingDay(null);
            setEditingItems([]);
            await fetchRutinas(selectedPlan.id);
            Swal.fire("Guardado", "El día se actualizó correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron guardar los ejercicios."), "error");
        }
    };

    const handleCreatePlanForPersona = () => {
        if (!selectedPersona) return;
        setPlanEdit(null);
        setPlanModalOpen(true);
    };

    return (
        <Stack spacing={3}>
            {/* Cabecera / Acciones */}
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Planes / Rutinas</Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Diseña planes por cliente y organiza rutinas por semana, día, bloque y ejercicio.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.2}>
                    <PremiumButton variant="anadir" onClick={() => { setPlanEdit(null); setPlanModalOpen(true); }}>
                        Añadir Plan
                    </PremiumButton>
                    <PremiumButton
                        variant="outline"
                        onClick={() => selectedPlan?.id && navigate(`/entrenamiento/ejecucion?plan_id=${selectedPlan.id}`)}
                        disabled={!selectedPlan}
                    >
                        Ejecutar Plan
                    </PremiumButton>
                    <PremiumButton variant="anadir" onClick={() => { setRutinaEdit(null); setRutinaModalOpen(true); }} disabled={!selectedPlan}>
                        Añadir Rutina
                    </PremiumButton>
                    <PremiumButton variant="outline" onClick={handleSaveTemplateFromWeek} disabled={!selectedPlan || !semanasDisponibles.length}>
                        Guardar Semana como Plantilla
                    </PremiumButton>
                    <PremiumButton variant="outline" onClick={handleApplyTemplate} disabled={!selectedPlan || !plantillas.length}>
                        Aplicar Plantilla
                    </PremiumButton>
                    <PremiumButton variant="outline" startIcon={<ContentCopyIcon fontSize="small" />} onClick={handleDuplicatePlan} disabled={!selectedPlan}>
                        Duplicar Plan
                    </PremiumButton>
                    <PremiumButton variant="outline" startIcon={<ContentCopyIcon fontSize="small" />} onClick={handleDuplicateWeek} disabled={!selectedPlan || !semanasDisponibles.length}>
                        Duplicar Semana
                    </PremiumButton>
                </Stack>
            </Paper>

            {/* Búsqueda Avanzada de Cliente */}
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 2 }}>Selección de Cliente y Filtros</Typography>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center">
                    <Autocomplete
                        options={personas}
                        getOptionLabel={(option) => `${option.nombres} · C.I: ${option.cedula}`}
                        value={selectedPersona}
                        onChange={(event, newValue) => {
                            setSelectedPersona(newValue);
                            if (newValue) {
                                const personaPlanes = planes.filter((p) => p.persona_id === newValue.id);
                                if (personaPlanes.length > 0) {
                                    // Seleccionar activo o el primero
                                    const activePlan = personaPlanes.find((p) => p.estado === "ACTIVO") || personaPlanes[0];
                                    setSelectedPlan(activePlan);
                                } else {
                                    setSelectedPlan(null);
                                }
                            } else {
                                setSelectedPlan(null);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Buscar Cliente por Nombre o Cédula"
                                size="small"
                                placeholder="Escribe nombre o cédula..."
                            />
                        )}
                        sx={{ ...filterInputSx, width: { xs: "100%", lg: 400 } }}
                    />

                    <TextField
                        size="small"
                        placeholder="Buscar Plan por Nombre..."
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        sx={{ ...filterInputSx, width: { xs: "100%", lg: 250 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ ...filterInputSx, width: 200 }}>
                        <Select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} displayEmpty>
                            <MenuItem value="">Todos los estados de Plan</MenuItem>
                            <MenuItem value="BORRADOR">Borrador</MenuItem>
                            <MenuItem value="ACTIVO">Activo</MenuItem>
                            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                        </Select>
                    </FormControl>

                    {selectedPersona && (
                        <IconButton
                            onClick={() => {
                                setSelectedPersona(null);
                                setSelectedPlan(null);
                            }}
                            title="Limpiar filtros de cliente"
                            sx={{ border: "1px solid #cbd5e1", borderRadius: "8px" }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Stack>

                {selectedPersona && !selectedPlan && (
                    <Box sx={{ mt: 3, p: 3, textAlign: "center", bgcolor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px" }}>
                        <Typography sx={{ fontWeight: 800, color: "#475569" }}>
                            El cliente {selectedPersona.nombres} no tiene ningún plan de entrenamiento asignado.
                        </Typography>
                        <PremiumButton variant="anadir" sx={{ mt: 2 }} onClick={handleCreatePlanForPersona}>
                            Crear Nuevo Plan para este Cliente
                        </PremiumButton>
                    </Box>
                )}

                {selectedPlan && (
                    <Paper elevation={0} sx={{ mt: 3, p: 2.5, bgcolor: "rgba(245, 158, 11, 0.04)", position: "relative" }}>
                        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                            <Tooltip title="Editar detalles del Plan">
                                <IconButton
                                    onClick={() => {
                                        setPlanEdit(selectedPlan);
                                        setPlanModalOpen(true);
                                    }}
                                    sx={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #cbd5e1",
                                        color: "#f59e0b",
                                        "&:hover": {
                                            backgroundColor: "#fef3c7",
                                            borderColor: "#f59e0b",
                                        },
                                    }}
                                >
                                    <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                            Plan seleccionado
                        </Typography>
                        <Typography sx={{ mt: 0.7, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                            {selectedPlan.nombre}
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontSize: 12, color: "#475569" }}>
                            {selectedPlan.nombre_completo} · C.I: {selectedPlan.cedula}
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontSize: 12, color: "#64748b" }}>
                            Objetivo: {selectedPlan.objetivo || "Sin objetivo definido"}
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: 12, color: "#64748b" }}>
                            Vigencia: {selectedPlan.fecha_inicio} {selectedPlan.fecha_fin ? ` · ${selectedPlan.fecha_fin}` : " · Sin fecha fin"}
                        </Typography>
                    </Paper>
                )}
            </Paper>

            {/* Rutinas agrupadas */}
            {selectedPlan && (
                <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 2, fontSize: 16 }}>Bloques por día</Typography>
                    {rutinasAgrupadas.length === 0 ? (
                        <Paper elevation={0} sx={{ ...pagePaperSx, p: 4, textAlign: "center", color: "#64748b" }}>
                            <Typography sx={{ mb: 2 }}>Este plan todavía no tiene rutinas registradas.</Typography>
                            <PremiumButton variant="anadir" onClick={() => handleStartEditDay(1, "LUNES", [])}>
                                Crear Rutinas para Semana 1
                            </PremiumButton>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            {rutinasAgrupadas.map((semana) => (
                                <Paper key={semana.semana} elevation={0} sx={{ ...pagePaperSx, p: 2.5 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                                            {semana.semana}
                                        </Typography>
                                        <Chip
                                            label={`${semana.dias.reduce((acc, d) => acc + (d.bloques?.reduce((sub, b) => sub + b.items.length, 0) || 0), 0)} ejercicios`}
                                            sx={semanticChipSx("mustard")}
                                        />
                                    </Stack>

                                    <Stack spacing={2}>
                                        {semana.dias.map((dia) => {
                                            const isEditingThisDay = editingDay && editingDay.semana === semana.semanaNum && editingDay.dia === dia.dia;

                                            return (
                                                <Box
                                                    key={`${semana.semana}-${dia.dia}`}
                                                    sx={{
                                                        border: isEditingThisDay ? "2px solid #f59e0b" : "1px solid rgba(148, 163, 184, 0.18)",
                                                        borderRadius: "10px",
                                                        overflow: "hidden",
                                                        backgroundColor: isEditingThisDay ? "#fffbeb" : "#fcfcfb",
                                                    }}
                                                >
                                                    {/* Encabezado del Día */}
                                                    <Box
                                                        sx={{
                                                            px: 2,
                                                            py: 1.2,
                                                            backgroundColor: isEditingThisDay ? "rgba(245, 158, 11, 0.12)" : "rgba(15, 23, 42, 0.04)",
                                                            borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#0f172a", letterSpacing: 0.3 }}>
                                                            {dia.dia}
                                                        </Typography>

                                                        {!isEditingThisDay ? (
                                                            <PremiumButton
                                                                variant="outline"
                                                                onClick={() => handleStartEditDay(semana.semanaNum, dia.dia, dia.bloques.flatMap((b) => b.items))}
                                                                sx={{ py: 0.5, px: 1.5, fontSize: "11.5px", height: "30px" }}
                                                            >
                                                                {dia.isEmpty ? "Asignar Rutina" : "Editar Tabla"}
                                                            </PremiumButton>
                                                        ) : (
                                                            <Stack direction="row" spacing={1}>
                                                                <PremiumButton
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingDay(null);
                                                                        setEditingItems([]);
                                                                    }}
                                                                    sx={{ py: 0.5, px: 1.5, fontSize: "11.5px", height: "30px", borderColor: "#ef4444", color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                                                                >
                                                                    Cancelar
                                                                </PremiumButton>
                                                                <PremiumButton
                                                                    variant="guardar"
                                                                    onClick={handleSaveInlineDay}
                                                                    sx={{ py: 0.5, px: 1.5, fontSize: "11.5px", height: "30px" }}
                                                                >
                                                                    Guardar Día
                                                                </PremiumButton>
                                                            </Stack>
                                                        )}
                                                    </Box>

                                                    {/* Vista de Edición Inline */}
                                                    {isEditingThisDay ? (
                                                        <Box sx={{ p: 2 }}>
                                                            <TableContainer component={Paper} sx={{ border: "1px solid #cbd5e1", boxShadow: "none", bgcolor: "#fff" }}>
                                                                <Table size="small">
                                                                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                                                        <TableRow>
                                                                            <TableCell sx={{ fontWeight: 800, width: "50px" }}></TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "60px" }}>Ord</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "130px" }}>Bloque</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800 }}>Ejercicio *</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "70px" }}>Srs</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "100px" }}>Reps</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "110px" }}>Carga Gral</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "120px" }}>Tipo</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "80px" }}>RPE</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "140px" }}>Notas</TableCell>
                                                                            <TableCell sx={{ fontWeight: 800, width: "50px" }} align="center"></TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {editingItems.length === 0 ? (
                                                                            <TableRow>
                                                                                <TableCell colSpan={11} align="center" sx={{ py: 3, color: "#64748b" }}>
                                                                                    No hay ejercicios para este día. Añade uno con el botón inferior.
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ) : (
                                                                            editingItems.map((rowItem, index) => {
                                                                                const isExpanded = !!expandedRows[index];

                                                                                return (
                                                                                    <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                                                        <td colSpan={11} style={{ padding: 0 }}>
                                                                                            {/* Fila principal */}
                                                                                            <Box sx={{ display: "grid", gridTemplateColumns: "50px 60px 130px 1fr 70px 100px 110px 120px 80px 140px 50px", alignItems: "center", p: 1, gap: 1 }}>
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    onClick={() => setExpandedRows(p => ({ ...p, [index]: !isExpanded }))}
                                                                                                    title="Configuración avanzada por serie y transferencia"
                                                                                                >
                                                                                                    {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                                                </IconButton>
                                                                                                <TextField size="small" type="number" value={rowItem.orden} onChange={(e) => handleUpdateRowField(index, "orden", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <TextField size="small" placeholder="Ej. Fuerza" value={rowItem.bloque} onChange={(e) => handleUpdateRowField(index, "bloque", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <Select size="small" value={rowItem.ejercicio_id} onChange={(e) => handleUpdateRowField(index, "ejercicio_id", e.target.value)} sx={{ fontSize: "12px", ".MuiSelect-select": { p: "6px" } }} fullWidth>
                                                                                                    <MenuItem value="" disabled>Seleccionar</MenuItem>
                                                                                                    {ejercicios.map((e) => <MenuItem key={e.id} value={e.id} sx={{ fontSize: "12.5px" }}>{e.nombre}</MenuItem>)}
                                                                                                </Select>
                                                                                                <TextField size="small" type="number" value={rowItem.series} onChange={(e) => handleUpdateRowField(index, "series", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <TextField size="small" placeholder="8-10" value={rowItem.repeticiones} onChange={(e) => handleUpdateRowField(index, "repeticiones", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <TextField size="small" type="number" value={rowItem.carga_objetivo} onChange={(e) => handleUpdateRowField(index, "carga_objetivo", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <Select size="small" value={rowItem.tipo_carga} onChange={(e) => handleUpdateRowField(index, "tipo_carga", e.target.value)} sx={{ fontSize: "12px", ".MuiSelect-select": { p: "6px" } }} fullWidth>
                                                                                                    {tiposCarga.map((t) => <MenuItem key={t.value} value={t.value} sx={{ fontSize: "12.5px" }}>{t.label}</MenuItem>)}
                                                                                                </Select>
                                                                                                <TextField size="small" type="number" placeholder="RPE" value={rowItem.rpe} onChange={(e) => handleUpdateRowField(index, "rpe", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <TextField size="small" placeholder="Notas" value={rowItem.notas} onChange={(e) => handleUpdateRowField(index, "notas", e.target.value)} sx={{ input: { fontSize: "12px", p: "6px" } }} />
                                                                                                <IconButton size="small" onClick={() => handleRemoveRowInline(index)} sx={{ color: "#ef4444" }}>
                                                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                            </Box>

                                                                                            {/* Fila desplegada (Series Avanzadas y Transferencia) */}
                                                                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                                                                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderTop: "1px dashed #cbd5e1" }}>
                                                                                                    <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#475569", mb: 1 }}>
                                                                                                        Breakdown de Series (Programación Avanzada)
                                                                                                    </Typography>
                                                                                                    <Stack spacing={1} sx={{ maxWidth: "600px" }}>
                                                                                                        {rowItem.series_detalles.map((serie, sIdx) => (
                                                                                                            <Box key={serie.numero} sx={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", gap: 1.5, alignItems: "center" }}>
                                                                                                                <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                                                                                                                    Serie {serie.numero}:
                                                                                                                </Typography>
                                                                                                                <TextField size="small" placeholder="Reps" value={serie.repeticiones} onChange={(e) => handleUpdateSeriesDetail(index, sIdx, "repeticiones", e.target.value)} sx={{ input: { fontSize: "11.5px", p: "4px 6px" } }} />
                                                                                                                <TextField size="small" type="number" placeholder="Carga" value={serie.carga_objetivo} onChange={(e) => handleUpdateSeriesDetail(index, sIdx, "carga_objetivo", e.target.value)} sx={{ input: { fontSize: "11.5px", p: "4px 6px" } }} />
                                                                                                                <Select size="small" value={serie.tipo_carga} onChange={(e) => handleUpdateSeriesDetail(index, sIdx, "tipo_carga", e.target.value)} sx={{ fontSize: "11.5px", ".MuiSelect-select": { p: "4px 6px" } }}>
                                                                                                                    {tiposCarga.map((t) => <MenuItem key={t.value} value={t.value} sx={{ fontSize: "11.5px" }}>{t.label}</MenuItem>)}
                                                                                                                </Select>
                                                                                                                <TextField size="small" type="number" placeholder="RPE" value={serie.rpe} onChange={(e) => handleUpdateSeriesDetail(index, sIdx, "rpe", e.target.value)} sx={{ input: { fontSize: "11.5px", p: "4px 6px" } }} />
                                                                                                            </Box>
                                                                                                        ))}
                                                                                                    </Stack>

                                                                                                    <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #e2e8f0" }}>
                                                                                                        <FormControlLabel
                                                                                                            control={
                                                                                                                <Switch
                                                                                                                    checked={rowItem.tiene_transferencia}
                                                                                                                    onChange={(e) => handleUpdateRowField(index, "tiene_transferencia", e.target.checked)}
                                                                                                                    color="warning"
                                                                                                                    size="small"
                                                                                                                />
                                                                                                            }
                                                                                                            label={
                                                                                                                <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#475569" }}>
                                                                                                                    ¿Lleva Ejercicio de Transferencia / Contraste?
                                                                                                                </Typography>
                                                                                                            }
                                                                                                        />

                                                                                                        {rowItem.tiene_transferencia && (
                                                                                                            <Box sx={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 2, mt: 1, maxWidth: "500px" }}>
                                                                                                                <Box>
                                                                                                                    <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: "#64748b", mb: 0.5 }}>Ejercicio de Transferencia</Typography>
                                                                                                                    <Select size="small" value={rowItem.ejercicio_transferencia_id} onChange={(e) => handleUpdateRowField(index, "ejercicio_transferencia_id", e.target.value)} sx={{ fontSize: "11.5px", ".MuiSelect-select": { p: "4px 6px" } }} fullWidth>
                                                                                                                        <MenuItem value="" disabled>Selecciona el ejercicio</MenuItem>
                                                                                                                        {ejercicios.map((e) => <MenuItem key={e.id} value={e.id} sx={{ fontSize: "11.5px" }}>{e.nombre}</MenuItem>)}
                                                                                                                    </Select>
                                                                                                                </Box>
                                                                                                                <Box>
                                                                                                                    <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: "#64748b", mb: 0.5 }}>Repeticiones del Transfer</Typography>
                                                                                                                    <TextField size="small" type="number" placeholder="Ej. 6" value={rowItem.repeticiones_transferencia} onChange={(e) => handleUpdateRowField(index, "repeticiones_transferencia", e.target.value)} sx={{ input: { fontSize: "11.5px", p: "4px 6px" } }} fullWidth />
                                                                                                                </Box>
                                                                                                            </Box>
                                                                                                        )}
                                                                                                    </Box>
                                                                                                </Box>
                                                                                            </Collapse>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>

                                                            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                                                                <PremiumButton
                                                                    variant="anadir"
                                                                    startIcon={<AddIcon />}
                                                                    onClick={handleAddRowInline}
                                                                >
                                                                    Añadir Ejercicio
                                                                </PremiumButton>
                                                            </Stack>
                                                        </Box>
                                                    ) : (
                                                        /* Vista Normal de Rutinas */
                                                        <Stack spacing={1.25} sx={{ p: 1.5 }}>
                                                            {dia.isEmpty ? (
                                                                <Typography sx={{ fontSize: "12.5px", color: "#64748b", py: 1, textAlign: "center" }}>
                                                                    Día libre o sin entrenamientos registrados.
                                                                </Typography>
                                                            ) : (
                                                                dia.bloques.map((bloque) => (
                                                                    <Box
                                                                        key={`${semana.semana}-${dia.dia}-${bloque.bloque}`}
                                                                        sx={{
                                                                            border: "1px solid rgba(240, 180, 0, 0.22)",
                                                                            borderRadius: "8px",
                                                                            backgroundColor: "rgba(240, 180, 0, 0.04)",
                                                                            p: 1.4,
                                                                        }}
                                                                    >
                                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#9a6700", textTransform: "uppercase" }}>
                                                                                {bloque.bloque}
                                                                            </Typography>
                                                                            <Stack direction="row" spacing={0.4}>
                                                                                <IconButton size="small" onClick={() => handleMoveBlock(dia.bloques, dia.bloques.findIndex((item) => item.bloque === bloque.bloque), -1)}>
                                                                                    <ArrowUpwardIcon fontSize="inherit" />
                                                                                </IconButton>
                                                                                <IconButton size="small" onClick={() => handleMoveBlock(dia.bloques, dia.bloques.findIndex((item) => item.bloque === bloque.bloque), 1)}>
                                                                                    <ArrowDownwardIcon fontSize="inherit" />
                                                                                </IconButton>
                                                                            </Stack>
                                                                        </Stack>

                                                                        <Stack spacing={1}>
                                                                            {bloque.items.map((item, itemIndex) => (
                                                                                <Box
                                                                                    key={item.id}
                                                                                    sx={{
                                                                                        display: "grid",
                                                                                        gridTemplateColumns: { xs: "1fr", lg: "minmax(200px, 1.2fr) repeat(5, minmax(90px, 0.8fr)) auto" },
                                                                                        gap: 1,
                                                                                        alignItems: "center",
                                                                                        borderRadius: "8px",
                                                                                        backgroundColor: "#ffffff",
                                                                                        border: "1px solid rgba(148, 163, 184, 0.18)",
                                                                                        px: 1.25,
                                                                                        py: 1,
                                                                                    }}
                                                                                >
                                                                                    <Box>
                                                                                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>
                                                                                            {item.orden || 1}. {item.ejercicio_nombre}
                                                                                        </Typography>
                                                                                        {item.ejercicio_transferencia_nombre && (
                                                                                            <Typography sx={{ fontSize: 11, color: "#e11d48", fontWeight: 700, mt: 0.2 }}>
                                                                                                ↳ Transfer: {item.ejercicio_transferencia_nombre} ({item.repeticiones_transferencia} reps)
                                                                                            </Typography>
                                                                                        )}
                                                                                        <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.2 }}>
                                                                                            {item.notas || "Sin notas específicas"}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Box>
                                                                                        <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                                                                                            Series/Reps
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                                                                            {item.series} x {item.repeticiones || "-"}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Box>
                                                                                        <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                                                                                            Carga
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                                                                            {item.carga_objetivo ?? "-"} {item.unidad_objetivo || ""}
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                                                                            {item.tipo_carga}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Box>
                                                                                        <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                                                                                            Tempo
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                                                                            {item.tempo || "-"}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Box>
                                                                                        <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                                                                                            RPE
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                                                                            {item.rpe ?? "-"}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Box>
                                                                                        <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
                                                                                            Descanso
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                                                                            {item.descanso_segundos ?? "-"} seg
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                                        <IconButton onClick={() => handleMoveExercise(bloque.items, itemIndex, -1)}>
                                                                                            <ArrowUpwardIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                        <IconButton onClick={() => handleMoveExercise(bloque.items, itemIndex, 1)}>
                                                                                            <ArrowDownwardIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                        <IconButton onClick={() => { setRutinaEdit(item); setRutinaModalOpen(true); }}>
                                                                                            <EditIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                        <IconButton onClick={() => handleDeleteRutina(item.id)}>
                                                                                            <DeleteOutlineIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                    </Stack>
                                                                                </Box>
                                                                            ))}
                                                                        </Stack>
                                                                    </Box>
                                                                ))
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* Plantillas de rutina */}
            <Box>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Plantillas rápidas</Typography>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Plantilla</TableCell>
                                <TableCell>Objetivo</TableCell>
                                <TableCell>Ejercicios</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {plantillas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#64748b" }}>
                                        Aún no hay plantillas guardadas. Puedes crear una desde una semana existente.
                                    </TableCell>
                                </TableRow>
                            ) : plantillas.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.descripcion || "Sin descripción"}</Typography>
                                    </TableCell>
                                    <TableCell>{item.objetivo || "Sin objetivo"}</TableCell>
                                    <TableCell>{item.total_items}</TableCell>
                                    <TableCell>
                                        <Chip label={item.activa ? "Activa" : "Inactiva"} sx={semanticChipSx(item.activa ? "success" : "neutral")} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={() => handleDeleteTemplate(item.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Listado General de Todos los Planes */}
            <Box>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Todos los Planes</Typography>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Plan</TableCell>
                                <TableCell>Fechas</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {planes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay planes registrados con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : planes.map((item) => (
                                <TableRow
                                    key={item.id}
                                    hover
                                    onClick={() => {
                                        const cli = personas.find(p => p.id === item.persona_id);
                                        setSelectedPersona(cli || null);
                                        setSelectedPlan(item);
                                    }}
                                    sx={{ cursor: "pointer", backgroundColor: selectedPlan?.id === item.id ? "rgba(245, 158, 11, 0.08)" : undefined }}
                                >
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.objetivo || "Sin objetivo"}</Typography>
                                    </TableCell>
                                    <TableCell>{item.fecha_inicio} {item.fecha_fin ? `· ${item.fecha_fin}` : ""}</TableCell>
                                    <TableCell><Chip label={item.estado} sx={semanticChipSx(item.estado === "ACTIVO" ? "success" : item.estado === "BORRADOR" ? "mustard" : "neutral")} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => { e.stopPropagation(); setPlanEdit(item); setPlanModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={(e) => { e.stopPropagation(); handleDeletePlan(item.id); }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <ModalPlan open={planModalOpen} onClose={() => { setPlanModalOpen(false); setPlanEdit(null); }} onSave={handleSavePlan} personas={personas} dataEdit={planEdit || (selectedPersona ? { persona_id: selectedPersona.id } : null)} />
            <ModalRutina open={rutinaModalOpen} onClose={() => { setRutinaModalOpen(false); setRutinaEdit(null); }} onSave={handleSaveRutina} ejercicios={ejercicios} dataEdit={rutinaEdit} />
        </Stack>
    );
}
