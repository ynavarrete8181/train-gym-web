import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Swal from "sweetalert2";

import PageHeader from "../../components/ui/PageHeader";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumModal from "../../components/ui/PremiumModal";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const DIAS = [
    { id: 1, nombre: "Lunes" },
    { id: 2, nombre: "Martes" },
    { id: 3, nombre: "Miércoles" },
    { id: 4, nombre: "Jueves" },
    { id: 5, nombre: "Viernes" },
    { id: 6, nombre: "Sábado" },
    { id: 7, nombre: "Domingo" },
];

const STAFF_TYPES = [
    { id: "COACH", nombre: "Coach / Entrenador" },
    { id: "ADMINISTRADOR", nombre: "Administrador" },
    { id: "CAJERO", nombre: "Cajero" },
    { id: "RECEPCION", nombre: "Recepción" },
];

const emptyPerfil = {
    persona_id: "",
    usuario_id: "",
    tipo_staff: "COACH",
    especialidad: "",
    estado: "ACTIVO",
    fecha_inicio: "",
    fecha_fin: "",
    observaciones: "",
    sedes: [],
};

const emptyTurno = {
    coach_id: "",
    sede_id: "",
    dia_semana: "",
    hora_inicio: "",
    hora_fin: "",
    capacidad_atencion: 1,
    activo: true,
};

const emptyAsignacion = {
    coach_id: "",
    persona_id: "",
    sede_id: "",
    turno_recurrente_id: "",
    tipo_asignacion: "SEGUIMIENTO",
    fecha_inicio: "",
    fecha_fin: "",
    objetivo: "",
    observaciones: "",
};

const inputSx = {
    ...filterInputSx,
    width: "100%",
    "& .MuiInputBase-input, & .MuiSelect-select": {
        fontSize: 13,
    },
};

const estadoTone = {
    ACTIVO: "success",
    INACTIVO: "mustard",
    BAJA: "danger",
};

const seguimientoTone = {
    ACTIVO: "success",
    AUSENTE: "mustard",
    VENCIDO: "danger",
    SIN_PLAN: "neutral",
};

const seguimientoLabel = {
    ACTIVO: "Activo",
    AUSENTE: "Ausente",
    VENCIDO: "Vencido",
    SIN_PLAN: "Sin plan",
};

export default function Staff({ vista = "perfiles" }) {
    const [perfiles, setPerfiles] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [turnosCatalogo, setTurnosCatalogo] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [socios, setSocios] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [buscar, setBuscar] = useState("");
    const [tipoStaff, setTipoStaff] = useState("");
    const [estado, setEstado] = useState("");
    const [turnoCoachId, setTurnoCoachId] = useState("");
    const [turnoSedeId, setTurnoSedeId] = useState("");
    const [turnoDia, setTurnoDia] = useState("");
    const [asignacionBuscar, setAsignacionBuscar] = useState("");
    const [asignacionCoachId, setAsignacionCoachId] = useState("");
    const [asignacionSedeId, setAsignacionSedeId] = useState("");
    const [asignacionEstado, setAsignacionEstado] = useState("ACTIVO");
    const [pagePerfiles, setPagePerfiles] = useState(0);
    const [pageTurnos, setPageTurnos] = useState(0);
    const [pageAsignaciones, setPageAsignaciones] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
    const [modalTurnoOpen, setModalTurnoOpen] = useState(false);
    const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);
    const [loadingPerfil, setLoadingPerfil] = useState(false);
    const [loadingTurno, setLoadingTurno] = useState(false);
    const [loadingAsignacion, setLoadingAsignacion] = useState(false);
    const [perfilForm, setPerfilForm] = useState(emptyPerfil);
    const [turnoForm, setTurnoForm] = useState(emptyTurno);
    const [asignacionForm, setAsignacionForm] = useState(emptyAsignacion);

    const coaches = useMemo(
        () => perfiles.filter((perfil) => perfil.tipo_staff === "COACH" && perfil.estado === "ACTIVO"),
        [perfiles]
    );

    const paginatedPerfiles = useMemo(() => {
        const start = pagePerfiles * rowsPerPage;
        return perfiles.slice(start, start + rowsPerPage);
    }, [perfiles, pagePerfiles, rowsPerPage]);

    const paginatedTurnos = useMemo(() => {
        const start = pageTurnos * rowsPerPage;
        return turnos.slice(start, start + rowsPerPage);
    }, [turnos, pageTurnos, rowsPerPage]);

    const paginatedAsignaciones = useMemo(() => {
        const start = pageAsignaciones * rowsPerPage;
        return asignaciones.slice(start, start + rowsPerPage);
    }, [asignaciones, pageAsignaciones, rowsPerPage]);

    const selectedPersona = useMemo(
        () => personas.find((persona) => String(persona.id) === String(perfilForm.persona_id)) || null,
        [personas, perfilForm.persona_id]
    );

    const selectedUsuario = useMemo(
        () => usuarios.find((usuario) => String(usuario.id) === String(perfilForm.usuario_id)) || null,
        [usuarios, perfilForm.usuario_id]
    );

    const selectedCliente = useMemo(
        () => socios.find((socio) => String(socio.persona_id) === String(asignacionForm.persona_id)) || null,
        [asignacionForm.persona_id, socios]
    );

    const isSeguimiento = vista === "seguimiento";
    const puedeEscogerTurno = Boolean(asignacionForm.coach_id && asignacionForm.sede_id);

    const turnosAsignacion = useMemo(
        () => turnosCatalogo.filter((turno) => {
            if (asignacionForm.coach_id && String(turno.coach_id) !== String(asignacionForm.coach_id)) return false;
            if (asignacionForm.sede_id && String(turno.sede_id) !== String(asignacionForm.sede_id)) return false;
            return turno.activo;
        }),
        [asignacionForm.coach_id, asignacionForm.sede_id, turnosCatalogo]
    );

    const fetchCatalogos = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios/catalogos");
        setPersonas(data?.personas || []);
        setSedes(data?.sedes || []);

        const usuariosRes = await apiClient.get("/gimnasio/seguridad/usuarios", { params: { estado: "ACTIVO" } });
        setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : []);

        const sociosRes = await apiClient.get("/gimnasio/membresias/socios");
        setSocios(Array.isArray(sociosRes.data) ? sociosRes.data : []);
    }, []);

    const fetchPerfiles = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/staff/perfiles", {
            params: {
                buscar: buscar || undefined,
                tipo_staff: tipoStaff || undefined,
                estado: estado || undefined,
            },
        });
        setPerfiles(data || []);
        setPagePerfiles(0);
    }, [buscar, estado, tipoStaff]);

    const fetchTurnos = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/staff/turnos", {
            params: {
                coach_id: turnoCoachId || undefined,
                sede_id: turnoSedeId || undefined,
                dia_semana: turnoDia || undefined,
            },
        });
        setTurnos(data || []);
        setPageTurnos(0);
    }, [turnoCoachId, turnoDia, turnoSedeId]);

    const fetchTurnosCatalogo = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/staff/turnos");
        setTurnosCatalogo(data || []);
    }, []);

    const fetchAsignaciones = useCallback(async () => {
        const { data } = await apiClient.get(isSeguimiento ? "/gimnasio/staff/mis-clientes" : "/gimnasio/staff/clientes", {
            params: {
                buscar: asignacionBuscar || undefined,
                coach_id: isSeguimiento ? undefined : asignacionCoachId || undefined,
                sede_id: asignacionSedeId || undefined,
                estado: asignacionEstado || undefined,
            },
        });
        setAsignaciones(data || []);
        setPageAsignaciones(0);
    }, [asignacionBuscar, asignacionCoachId, asignacionEstado, asignacionSedeId, isSeguimiento]);

    useEffect(() => {
        fetchCatalogos().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los catálogos de equipo."), "error");
        });
    }, [fetchCatalogos]);

    useEffect(() => {
        fetchPerfiles().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los perfiles del equipo."), "error");
        });
    }, [fetchPerfiles]);

    useEffect(() => {
        fetchTurnos().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los turnos del equipo."), "error");
        });
    }, [fetchTurnos]);

    useEffect(() => {
        fetchTurnosCatalogo().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el catálogo de turnos."), "error");
        });
    }, [fetchTurnosCatalogo]);

    useEffect(() => {
        fetchAsignaciones().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los clientes por coach."), "error");
        });
    }, [fetchAsignaciones]);

    const openPerfil = () => {
        setPerfilForm({ ...emptyPerfil, fecha_inicio: new Date().toISOString().slice(0, 10) });
        setModalPerfilOpen(true);
    };

    const openTurno = () => {
        setTurnoForm(emptyTurno);
        setModalTurnoOpen(true);
    };

    const openAsignacion = () => {
        setAsignacionForm({ ...emptyAsignacion, fecha_inicio: new Date().toISOString().slice(0, 10) });
        setModalAsignacionOpen(true);
    };

    const submitPerfil = async () => {
        if (!perfilForm.persona_id) {
            Swal.fire("Persona requerida", "Seleccione la persona asociada al perfil.", "warning");
            return;
        }
        if (perfilForm.tipo_staff === "COACH" && perfilForm.sedes.length === 0) {
            Swal.fire("Sede requerida", "Asigne al menos una sede para el coach.", "warning");
            return;
        }

        setLoadingPerfil(true);
        try {
            await apiClient.post("/gimnasio/staff/perfiles", {
                ...perfilForm,
                usuario_id: perfilForm.usuario_id || null,
                fecha_inicio: perfilForm.fecha_inicio || undefined,
                fecha_fin: perfilForm.fecha_fin || null,
            });
            setModalPerfilOpen(false);
            await Promise.all([fetchPerfiles(), fetchTurnos()]);
            Swal.fire("Listo", "Perfil de equipo creado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo crear el perfil."), "error");
        } finally {
            setLoadingPerfil(false);
        }
    };

    const submitTurno = async () => {
        if (!turnoForm.coach_id || !turnoForm.sede_id || !turnoForm.dia_semana || !turnoForm.hora_inicio || !turnoForm.hora_fin) {
            Swal.fire("Datos incompletos", "Seleccione coach, sede, día y rango horario.", "warning");
            return;
        }

        setLoadingTurno(true);
        try {
            await apiClient.post("/gimnasio/staff/turnos", turnoForm);
            setModalTurnoOpen(false);
            await Promise.all([fetchTurnos(), fetchTurnosCatalogo()]);
            Swal.fire("Listo", "Turno creado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo crear el turno."), "error");
        } finally {
            setLoadingTurno(false);
        }
    };

    const submitAsignacion = async () => {
        if (!asignacionForm.coach_id || !asignacionForm.persona_id || !asignacionForm.sede_id) {
            Swal.fire("Datos incompletos", "Seleccione coach, cliente y sede.", "warning");
            return;
        }

        setLoadingAsignacion(true);
        try {
            await apiClient.post("/gimnasio/staff/clientes", {
                ...asignacionForm,
                turno_recurrente_id: asignacionForm.turno_recurrente_id || null,
                fecha_fin: asignacionForm.fecha_fin || null,
            });
            setModalAsignacionOpen(false);
            await fetchAsignaciones();
            Swal.fire("Listo", "Cliente asignado al coach correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo asignar el cliente al coach."), "error");
        } finally {
            setLoadingAsignacion(false);
        }
    };

    const finalizarAsignacion = async (id) => {
        const result = await Swal.fire({
            title: "¿Finalizar asignación?",
            text: "El cliente dejará de estar activo en la lista del coach.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, finalizar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.post(`/gimnasio/staff/clientes/${id}/finalizar`);
            await fetchAsignaciones();
            Swal.fire("Listo", "Asignación finalizada.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo finalizar la asignación."), "error");
        }
    };

    const editarSeguimiento = async (asignacion) => {
        const { value: formValues, isConfirmed } = await Swal.fire({
            title: "Seguimiento del coach",
            html: `
                <input id="coach-objetivo" class="swal2-input" placeholder="Objetivo" value="${String(asignacion.objetivo || "").replaceAll('"', "&quot;")}">
                <textarea id="coach-observaciones" class="swal2-textarea" placeholder="Observaciones">${String(asignacion.observaciones || "")}</textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Guardar",
            cancelButtonText: "Cancelar",
            preConfirm: () => ({
                objetivo: document.getElementById("coach-objetivo")?.value || "",
                observaciones: document.getElementById("coach-observaciones")?.value || "",
            }),
        });

        if (!isConfirmed) return;

        try {
            await apiClient.put(`/gimnasio/staff/clientes/${asignacion.id}/seguimiento`, formValues);
            await fetchAsignaciones();
            Swal.fire("Listo", "Seguimiento actualizado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo actualizar el seguimiento."), "error");
        }
    };

    const changeRows = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPagePerfiles(0);
        setPageTurnos(0);
        setPageAsignaciones(0);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Stack spacing={3}>
                    <PageHeader
                        title={vista === "turnos" ? "Turnos Recurrentes" : isSeguimiento ? "Mis Clientes" : vista === "clientes" ? "Clientes por Coach" : "Equipo"}
                        icon={vista === "turnos" ? <ScheduleIcon sx={{ fontSize: 24 }} /> : vista === "clientes" || isSeguimiento ? <AssignmentIndIcon sx={{ fontSize: 24 }} /> : <GroupsIcon sx={{ fontSize: 24 }} />}
                        rightContent={
                            <Box sx={{ px: 2, py: 0.8, borderRadius: "6px", bgcolor: "rgba(15, 23, 42, 0.05)", color: "#0f172a", fontSize: "11px", fontWeight: 900 }}>
                                {vista === "turnos" ? turnos.length : vista === "clientes" || isSeguimiento ? asignaciones.length : perfiles.length} REGISTROS
                            </Box>
                        }
                    />

                    {vista === "perfiles" && <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }}>
                                <TextField
                                    size="small"
                                    placeholder="Buscar por cédula, nombre o usuario..."
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    sx={{ ...filterInputSx, width: 300 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <FormControl size="small" sx={{ ...filterInputSx, width: 190 }}>
                                    <Select value={tipoStaff} onChange={(e) => setTipoStaff(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Cualquier tipo</MenuItem>
                                        {STAFF_TYPES.map((tipo) => (
                                            <MenuItem key={tipo.id} value={tipo.id}>{tipo.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 170 }}>
                                    <Select value={estado} onChange={(e) => setEstado(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Cualquier estado</MenuItem>
                                        <MenuItem value="ACTIVO">Activo</MenuItem>
                                        <MenuItem value="INACTIVO">Inactivo</MenuItem>
                                        <MenuItem value="BAJA">Baja</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <PremiumButton variant="anadir" onClick={openPerfil}>
                                Añadir
                            </PremiumButton>
                        </Box>

                        <Box sx={{ px: 4, pb: 3 }}>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Persona</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Especialidad</TableCell>
                                            <TableCell>Sedes</TableCell>
                                            <TableCell>Usuario</TableCell>
                                            <TableCell>Estado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {perfiles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                    No hay perfiles de equipo para esos filtros.
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedPerfiles.map((perfil) => (
                                            <TableRow key={perfil.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 900 }}>{perfil.nombre_completo}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{perfil.cedula || "Sin cédula"}</Typography>
                                                </TableCell>
                                                <TableCell>{STAFF_TYPES.find((tipo) => tipo.id === perfil.tipo_staff)?.nombre || perfil.tipo_staff}</TableCell>
                                                <TableCell>{perfil.especialidad || "General"}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                                                        {(perfil.sedes || []).map((sede) => (
                                                            <Chip key={sede.id} label={sede.nombre} sx={semanticChipSx("neutral")} />
                                                        ))}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>{perfil.usuario_email || "Sin usuario"}</TableCell>
                                                <TableCell>
                                                    <Chip label={perfil.estado} sx={semanticChipSx(estadoTone[perfil.estado] || "neutral")} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={perfiles.length}
                                page={pagePerfiles}
                                onPageChange={(_event, page) => setPagePerfiles(page)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={changeRows}
                                rowsPerPageOptions={[5, 10, 25]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />
                        </Box>
                    </Paper>}

                    {vista === "turnos" && <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }}>
                                <FormControl size="small" sx={{ ...filterInputSx, width: 240 }}>
                                    <Select value={turnoCoachId} onChange={(e) => setTurnoCoachId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todos los coaches</MenuItem>
                                        {coaches.map((coach) => (
                                            <MenuItem key={coach.id} value={coach.id}>{coach.nombre_completo}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 200 }}>
                                    <Select value={turnoSedeId} onChange={(e) => setTurnoSedeId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todas las sedes</MenuItem>
                                        {sedes.map((sede) => (
                                            <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                    <Select value={turnoDia} onChange={(e) => setTurnoDia(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todos los días</MenuItem>
                                        {DIAS.map((dia) => (
                                            <MenuItem key={dia.id} value={dia.id}>{dia.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>

                            <PremiumButton variant="anadir" onClick={openTurno} startIcon={<ScheduleIcon />}>
                                Turno
                            </PremiumButton>
                        </Box>

                        <Box sx={{ px: 4, pb: 3 }}>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Coach</TableCell>
                                            <TableCell>Sede</TableCell>
                                            <TableCell>Día</TableCell>
                                            <TableCell>Desde</TableCell>
                                            <TableCell>Hasta</TableCell>
                                            <TableCell>Capacidad</TableCell>
                                            <TableCell>Estado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {turnos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                    No hay turnos configurados para esos filtros.
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedTurnos.map((turno) => (
                                            <TableRow key={turno.id}>
                                                <TableCell>{turno.coach_nombre}</TableCell>
                                                <TableCell>{turno.sede_nombre}</TableCell>
                                                <TableCell>{DIAS.find((dia) => dia.id === turno.dia_semana)?.nombre || turno.dia_semana}</TableCell>
                                                <TableCell>{String(turno.hora_inicio || "").slice(0, 5)}</TableCell>
                                                <TableCell>{String(turno.hora_fin || "").slice(0, 5)}</TableCell>
                                                <TableCell>{turno.capacidad_atencion}</TableCell>
                                                <TableCell>
                                                    <Chip label={turno.activo ? "Activo" : "Inactivo"} sx={semanticChipSx(turno.activo ? "success" : "neutral")} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={turnos.length}
                                page={pageTurnos}
                                onPageChange={(_event, page) => setPageTurnos(page)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={changeRows}
                                rowsPerPageOptions={[5, 10, 25]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />
                        </Box>
                    </Paper>}

                    {(vista === "clientes" || isSeguimiento) && <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }}>
                                <TextField
                                    size="small"
                                    placeholder="Buscar por cliente, cédula, socio o coach..."
                                    value={asignacionBuscar}
                                    onChange={(e) => setAsignacionBuscar(e.target.value)}
                                    sx={{ ...filterInputSx, width: 320 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {!isSeguimiento && <FormControl size="small" sx={{ ...filterInputSx, width: 240 }}>
                                    <Select value={asignacionCoachId} onChange={(e) => setAsignacionCoachId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todos los coaches</MenuItem>
                                        {coaches.map((coach) => (
                                            <MenuItem key={coach.id} value={coach.id}>{coach.nombre_completo}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>}

                                <FormControl size="small" sx={{ ...filterInputSx, width: 200 }}>
                                    <Select value={asignacionSedeId} onChange={(e) => setAsignacionSedeId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todas las sedes</MenuItem>
                                        {sedes.map((sede) => (
                                            <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 160 }}>
                                    <Select value={asignacionEstado} onChange={(e) => setAsignacionEstado(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Cualquier estado</MenuItem>
                                        <MenuItem value="ACTIVO">Activo</MenuItem>
                                        <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            {!isSeguimiento && <PremiumButton variant="anadir" onClick={openAsignacion} startIcon={<AssignmentIndIcon />}>
                                Asignar
                            </PremiumButton>}
                        </Box>

                        <Box sx={{ px: 4, pb: 3 }}>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Coach</TableCell>
                                            <TableCell>Sede</TableCell>
                                            <TableCell>Turno</TableCell>
                                            {isSeguimiento ? (
                                                <>
                                                    <TableCell>Asistencia</TableCell>
                                                    <TableCell>Rutina</TableCell>
                                                    <TableCell>Próxima evaluación</TableCell>
                                                    <TableCell>Observaciones</TableCell>
                                                    <TableCell>Estado cliente</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>Vigencia</TableCell>
                                                    <TableCell>Estado</TableCell>
                                                </>
                                            )}
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {asignaciones.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={isSeguimiento ? 10 : 7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                    {isSeguimiento ? "No tienes clientes asignados para esos filtros." : "No hay clientes asignados para esos filtros."}
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedAsignaciones.map((asignacion) => (
                                            <TableRow key={asignacion.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 900 }}>{asignacion.cliente_nombre}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.codigo_socio || "Sin código"} · {asignacion.cliente_cedula || "Sin cédula"}</Typography>
                                                </TableCell>
                                                <TableCell>{asignacion.coach_nombre}</TableCell>
                                                <TableCell>{asignacion.sede_nombre}</TableCell>
                                                <TableCell>
                                                    {asignacion.turno_recurrente_id ? (
                                                        <>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{DIAS.find((dia) => dia.id === asignacion.dia_semana)?.nombre}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{String(asignacion.hora_inicio || "").slice(0, 5)} - {String(asignacion.hora_fin || "").slice(0, 5)}</Typography>
                                                        </>
                                                    ) : "Sin turno fijo"}
                                                </TableCell>
                                                {isSeguimiento ? (
                                                    <>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                                                                {asignacion.ultima_asistencia ? String(asignacion.ultima_asistencia).slice(0, 16).replace("T", " ") : "Sin asistencia"}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.asistencias_30_dias || 0} en 30 días</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{asignacion.plan_actual?.nombre || "Sin rutina"}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.plan_actual?.objetivo || "Sin objetivo de rutina"}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{asignacion.proxima_evaluacion?.fecha_proxima_evaluacion || "Pendiente"}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.proxima_evaluacion?.tipo_evaluacion || "Sin evaluación programada"}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ maxWidth: 220 }}>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{asignacion.objetivo || "Sin objetivo"}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.observaciones || "Sin observaciones"}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={seguimientoLabel[asignacion.estado_seguimiento] || asignacion.estado_seguimiento || "Activo"}
                                                                sx={semanticChipSx(seguimientoTone[asignacion.estado_seguimiento] || "neutral")}
                                                            />
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{asignacion.fecha_inicio}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>{asignacion.fecha_fin ? `hasta ${asignacion.fecha_fin}` : "sin fecha fin"}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={asignacion.estado} sx={semanticChipSx(asignacion.estado === "ACTIVO" ? "success" : "neutral")} />
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell align="center">
                                                    {isSeguimiento ? (
                                                        <IconButton onClick={() => editarSeguimiento(asignacion)} sx={{ color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "6px", width: 32, height: 32 }} title="Editar seguimiento">
                                                            <EditNoteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    ) : asignacion.estado === "ACTIVO" && (
                                                        <IconButton onClick={() => finalizarAsignacion(asignacion.id)} sx={{ color: "#2e7d32", border: "1px solid #2e7d32", borderRadius: "6px", width: 32, height: 32 }} title="Finalizar">
                                                            <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={asignaciones.length}
                                page={pageAsignaciones}
                                onPageChange={(_event, page) => setPageAsignaciones(page)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={changeRows}
                                rowsPerPageOptions={[5, 10, 25]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />
                        </Box>
                    </Paper>}
                </Stack>
            </Box>

            <PremiumModal
                open={modalPerfilOpen}
                onClose={() => setModalPerfilOpen(false)}
                title="Nuevo Perfil de Equipo"
                subtitle="Asocia una persona a un rol operativo del gimnasio"
                icon={<GroupsIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="md"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setModalPerfilOpen(false)} disabled={loadingPerfil}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={submitPerfil} loading={loadingPerfil}>
                            Guardar
                        </PremiumButton>
                    </>
                }
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Autocomplete
                        options={personas}
                        value={selectedPersona}
                        onChange={(_event, value) => setPerfilForm((prev) => ({ ...prev, persona_id: value?.id || "" }))}
                        getOptionLabel={(option) => `${option.nombre_completo || ""} · ${option.cedula || "Sin cédula"}`}
                        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        renderInput={(params) => <TextField {...params} label="Persona *" size="small" sx={inputSx} />}
                    />

                    <Autocomplete
                        options={usuarios}
                        value={selectedUsuario}
                        onChange={(_event, value) => setPerfilForm((prev) => ({ ...prev, usuario_id: value?.id || "" }))}
                        getOptionLabel={(option) => `${option.nombre_completo || option.email || ""} · ${option.email || ""}`}
                        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        renderInput={(params) => <TextField {...params} label="Usuario del sistema" size="small" sx={inputSx} />}
                    />

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Tipo *</InputLabel>
                        <Select label="Tipo *" value={perfilForm.tipo_staff} onChange={(e) => setPerfilForm((prev) => ({ ...prev, tipo_staff: e.target.value }))}>
                            {STAFF_TYPES.map((tipo) => (
                                <MenuItem key={tipo.id} value={tipo.id}>{tipo.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="Especialidad"
                        value={perfilForm.especialidad}
                        onChange={(e) => setPerfilForm((prev) => ({ ...prev, especialidad: e.target.value }))}
                        sx={inputSx}
                    />

                    <FormControl size="small" sx={{ ...inputSx, gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                        <InputLabel>Sedes</InputLabel>
                        <Select
                            multiple
                            label="Sedes"
                            value={perfilForm.sedes}
                            onChange={(e) => setPerfilForm((prev) => ({ ...prev, sedes: e.target.value }))}
                            input={<OutlinedInput label="Sedes" />}
                        >
                            {sedes.map((sede) => (
                                <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        type="date"
                        label="Fecha inicio"
                        value={perfilForm.fecha_inicio}
                        onChange={(e) => setPerfilForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                        sx={inputSx}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label="Fecha fin"
                        value={perfilForm.fecha_fin}
                        onChange={(e) => setPerfilForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                        sx={inputSx}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        size="small"
                        label="Observaciones"
                        multiline
                        minRows={2}
                        value={perfilForm.observaciones}
                        onChange={(e) => setPerfilForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                        sx={{ ...inputSx, gridColumn: { xs: "auto", md: "1 / span 2" } }}
                    />
                </Box>
            </PremiumModal>

            <PremiumModal
                open={modalTurnoOpen}
                onClose={() => setModalTurnoOpen(false)}
                title="Nuevo Turno de Coach"
                subtitle="Define disponibilidad recurrente por sede, día y hora"
                icon={<ScheduleIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="sm"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setModalTurnoOpen(false)} disabled={loadingTurno}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={submitTurno} loading={loadingTurno}>
                            Guardar
                        </PremiumButton>
                    </>
                }
            >
                <Stack spacing={2}>
                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Coach *</InputLabel>
                        <Select label="Coach *" value={turnoForm.coach_id} onChange={(e) => setTurnoForm((prev) => ({ ...prev, coach_id: e.target.value }))}>
                            {coaches.map((coach) => (
                                <MenuItem key={coach.id} value={coach.id}>{coach.nombre_completo}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Sede *</InputLabel>
                        <Select label="Sede *" value={turnoForm.sede_id} onChange={(e) => setTurnoForm((prev) => ({ ...prev, sede_id: e.target.value }))}>
                            {sedes.map((sede) => (
                                <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Día *</InputLabel>
                        <Select label="Día *" value={turnoForm.dia_semana} onChange={(e) => setTurnoForm((prev) => ({ ...prev, dia_semana: e.target.value }))}>
                            {DIAS.map((dia) => (
                                <MenuItem key={dia.id} value={dia.id}>{dia.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                        <TextField
                            size="small"
                            type="time"
                            label="Desde *"
                            value={turnoForm.hora_inicio}
                            onChange={(e) => setTurnoForm((prev) => ({ ...prev, hora_inicio: e.target.value }))}
                            sx={inputSx}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="time"
                            label="Hasta *"
                            value={turnoForm.hora_fin}
                            onChange={(e) => setTurnoForm((prev) => ({ ...prev, hora_fin: e.target.value }))}
                            sx={inputSx}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="number"
                            label="Capacidad"
                            value={turnoForm.capacidad_atencion}
                            onChange={(e) => setTurnoForm((prev) => ({ ...prev, capacidad_atencion: Number(e.target.value || 1) }))}
                            sx={inputSx}
                        />
                    </Box>
                </Stack>
            </PremiumModal>

            <PremiumModal
                open={modalAsignacionOpen}
                onClose={() => setModalAsignacionOpen(false)}
                title="Asignar Cliente a Coach"
                subtitle="Vincula un cliente con seguimiento a un coach, sede y turno"
                icon={<AssignmentIndIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="md"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setModalAsignacionOpen(false)} disabled={loadingAsignacion}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={submitAsignacion} loading={loadingAsignacion}>
                            Guardar
                        </PremiumButton>
                    </>
                }
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Coach *</InputLabel>
                        <Select
                            label="Coach *"
                            value={asignacionForm.coach_id}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, coach_id: e.target.value, turno_recurrente_id: "" }))}
                        >
                            {coaches.map((coach) => (
                                <MenuItem key={coach.id} value={coach.id}>{coach.nombre_completo}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Autocomplete
                        options={socios}
                        value={selectedCliente}
                        onChange={(_event, value) => setAsignacionForm((prev) => ({ ...prev, persona_id: value?.persona_id || "" }))}
                        getOptionLabel={(option) => `${option.nombre_completo || ""} · ${option.cedula || "Sin cédula"}`}
                        isOptionEqualToValue={(option, value) => String(option.persona_id) === String(value.persona_id)}
                        renderInput={(params) => <TextField {...params} label="Cliente *" size="small" sx={inputSx} />}
                    />

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Sede *</InputLabel>
                        <Select
                            label="Sede *"
                            value={asignacionForm.sede_id}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, sede_id: e.target.value, turno_recurrente_id: "" }))}
                        >
                            {sedes.map((sede) => (
                                <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Turno recurrente</InputLabel>
                        <Select
                            label="Turno recurrente"
                            value={asignacionForm.turno_recurrente_id}
                            disabled={!puedeEscogerTurno}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, turno_recurrente_id: e.target.value }))}
                        >
                            <MenuItem value="">
                                {!puedeEscogerTurno
                                    ? "Seleccione coach y sede primero"
                                    : turnosAsignacion.length === 0
                                        ? "Sin turnos disponibles"
                                        : "Sin turno fijo"}
                            </MenuItem>
                            {turnosAsignacion.map((turno) => (
                                <MenuItem key={turno.id} value={turno.id}>
                                    {DIAS.find((dia) => dia.id === turno.dia_semana)?.nombre} · {String(turno.hora_inicio || "").slice(0, 5)} - {String(turno.hora_fin || "").slice(0, 5)}
                                </MenuItem>
                            ))}
                        </Select>
                        <Typography sx={{ mt: 0.6, fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                            Los turnos se habilitan al escoger un coach y una sede compatible.
                        </Typography>
                    </FormControl>

                    <FormControl size="small" sx={inputSx}>
                        <InputLabel>Tipo *</InputLabel>
                        <Select
                            label="Tipo *"
                            value={asignacionForm.tipo_asignacion}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, tipo_asignacion: e.target.value }))}
                        >
                            <MenuItem value="SEGUIMIENTO">Seguimiento personalizado</MenuItem>
                            <MenuItem value="GRUPO">Grupo / cupo reducido</MenuItem>
                            <MenuItem value="GENERAL">General supervisado</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                        <TextField
                            size="small"
                            type="date"
                            label="Fecha inicio *"
                            value={asignacionForm.fecha_inicio}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                            sx={inputSx}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="Fecha fin"
                            value={asignacionForm.fecha_fin}
                            onChange={(e) => setAsignacionForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                            sx={inputSx}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    <TextField
                        size="small"
                        label="Objetivo"
                        value={asignacionForm.objetivo}
                        onChange={(e) => setAsignacionForm((prev) => ({ ...prev, objetivo: e.target.value }))}
                        sx={inputSx}
                    />

                    <TextField
                        size="small"
                        label="Observaciones"
                        multiline
                        minRows={2}
                        value={asignacionForm.observaciones}
                        onChange={(e) => setAsignacionForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                        sx={inputSx}
                    />
                </Box>
            </PremiumModal>
        </Box>
    );
}
