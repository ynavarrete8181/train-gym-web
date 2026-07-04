import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    TextField,
    Box,
    TableContainer,
    Table,
    Typography,
    Paper,
    Grid,
    TableRow,
    TableBody,
    List,
    ListItem,
    ListItemButton,
    CircularProgress,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    Divider,
    Card,
    Avatar,
    TableCell,
    Chip,
    FormControl,
    ClickAwayListener,
    IconButton,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogContent,
} from "@mui/material";
import Popper from "@mui/material/Popper";
import InventoryIcon from '@mui/icons-material/Inventory';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import SaveIcon from "@mui/icons-material/Save";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Add as AddIcon, Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import {
    buscarOConsultarPersonaBienestar,
    actualizarPersonaBienestar,
    obtenerTiposDiscapacidad,
    obtenerTiposSangre,
    consultarRoles,
    consultarRolesAreas,
    obtenerFuncionariosPorRol,
    obtenerAtencionesPorPaciente,
    actualizarEstadoAtencion,
    obtenerTallaPesoPaciente,
} from "../../../axios/axios_client";


/** Helpers UI */
function getInitials(nombre = "") {
    const parts = nombre.trim().split(/\s+/);
    if (!parts.length) return "U";
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

function escapeRegExp(s = "") {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text = "", query = "") {
    const q = (query ?? "").trim();
    if (!q) return <>{text}</>;
    try {
        const rx = new RegExp(`(${escapeRegExp(q)})`, "ig");
        const parts = String(text).split(rx);
        return (
            <>
                {parts.map((p, i) =>
                    rx.test(p) ? (
                        <Box
                            key={`${p}-${i}`}
                            component="span"
                            sx={{ fontWeight: 700, bgcolor: "rgba(255,235,59,0.35)" }}
                        >
                            {p}
                        </Box>
                    ) : (
                        <Box key={`${p}-${i}`} component="span">
                            {p}
                        </Box>
                    )
                )}
            </>
        );
    } catch {
        return <>{text}</>;
    }
}

const AtencionExterna = ({ onCancelar, usr_id, data }) => {
    const [cedula, setCedula] = useState("");
    const [sugerencias, setSugerencias] = useState([]);
    const [persona, setDataPersona] = useState(null);

    const [loadingBusqueda, setLoadingBusqueda] = useState(false);
    const [loadingPaciente, setLoadingPaciente] = useState(false);
    const [noEncontrada, setNoEncontrada] = useState(false);

    // const [openModal, setOpenModal] = useState(false);
    // const [tabIndex, setTabIndex] = useState(0);
    // const [tiposDiscapacidad, setTiposDiscapacidad] = useState([]);
    const [tiposSangre, setTiposSangre] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    // const [areas, setAreas] = useState([]);
    // const [areasMedicas, setAreasMedicas] = useState([]);
    // const [funcionarios, setFuncionarios] = useState([]);
    // const [infofuncionarios, setInfoFuncionarios] = useState([]);
    const [atenciones, setAtenciones] = useState([]);
    const [selectedSugerenciaId, setSelectedSugerenciaId] = useState(null);

    // --- Panel resultados + navegación ---
    const [openResults, setOpenResults] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const anchorRef = useRef(null);
    const hasQuery = cedula.trim().length >= 6;
    const limitedSugerencias = useMemo(() => (sugerencias || []).slice(0, 5), [sugerencias]);

    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const [formDataAtencionExterna, setFormDataAtencionExterna] = useState({
        id_funcionario: usr_id,
        cedula: cedula,
        tipo_servicio: "",
        archivo_comprobante: null,
    });

    const [loadingSave, setLoadingSave] = useState(false);
    const [TipoServicioSelected, setTipoServicioSelected] = useState(null);

    const [filePreview, setFilePreview] = useState(null);
    const [file, setFile] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);




    // const tipoUsuarioClasificacion = persona?.id_clasificacion_tipo_usuario || null;
    // const tipoUsuario = tipoUsuarioClasificacion;

    // const paginatedData = atenciones.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    // const [openModalAgregarUsuario, setOpenModalAgregarUsuario] = useState(false);

    // const calcularGestacion = (datos_medicos) => {
    //     if (datos_medicos && datos_medicos.embarazada) {
    //         const semanas = dayjs().diff(dayjs(datos_medicos.ultima_fecha_mestruacion), "week");
    //         const fechaParto = dayjs(datos_medicos.ultima_fecha_mestruacion)
    //             .add(40, "week")
    //             .format("YYYY-MM-DD");

    //         if (semanas >= 34 && semanas < 42) {
    //             Swal.fire("Alerta", "La persona está próxima a dar a luz.", "warning");
    //             setTabIndex(2);
    //         } else if (semanas >= 42) {
    //             Swal.fire("Alerta", "Es necesario actualizar los datos de embarazo.", "warning");
    //             setTabIndex(2);
    //         }

    //         return { semanas_embarazo: semanas, fecha_estimada_parto: fechaParto };
    //     }
    //     return {};
    // };

    // catálogos
    // useEffect(() => {
    //     obtenerTiposDiscapacidad().then(setTiposDiscapacidad);
    //     consultarRoles().then(setAreas);
    //     consultarRolesAreas().then(setAreasMedicas);
    // }, []);

    // useEffect(() => {
    //     const fetchTiposSangre = async () => {
    //         try {
    //             const data = await obtenerTiposSangre();
    //             if (Array.isArray(data)) setTiposSangre(data);
    //             else setTiposSangre([]);
    //         } catch {
    //             setTiposSangre([]);
    //         }
    //     };
    //     fetchTiposSangre();
    // }, []);

    //Buscar paciente por cédula
    // useEffect(() => {
    //     let timeoutId;
    //     if (cedula.length >= 6) {
    //         timeoutId = setTimeout(async () => {
    //             setLoadingBusqueda(true);
    //             setOpenResults(false);
    //             try {
    //                 let response = await buscarOConsultarPersonaBienestar(cedula);
    //                 const list = response ? (Array.isArray(response) ? response : [response]) : [];
    //                 setSugerencias(list);
    //                 setOpenResults(list.length > 0);
    //                 if (cedula.length === 10 && (!response || response.length === 0)) {
    //                     setNoEncontrada(true);
    //                 } else {
    //                     setNoEncontrada(false);
    //                 }
    //             } catch {
    //                 setSugerencias([]);
    //                 if (cedula.length === 10) setNoEncontrada(true);
    //             } finally {
    //                 setLoadingBusqueda(false);
    //                 setHighlightedIndex(-1);
    //             }
    //         }, 400);
    //     } else {
    //         setSugerencias([]);
    //         setNoEncontrada(false);
    //         setOpenResults(false);
    //         setHighlightedIndex(-1);
    //     }
    //     return () => clearTimeout(timeoutId);
    // }, [cedula]);

    // const handleInputChange = (e) => {
    //     const value = e.target.value.replace(/\D/g, "");
    //     if (/^\d*$/.test(value)) {
    //         setCedula(value);
    //         setDataPersona(null);
    //         setSugerencias([]);
    //         setNoEncontrada(false);
    //         if (value.length >= 6) setOpenResults(true);
    //     }
    // };

    const handleInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (/^\d*$/.test(value)) {
            setCedula(value);
            setDataPersona(null);
            setSugerencias([]);
            setNoEncontrada(false);
            if (value.length >= 6)
                setOpenResults(true);
            console.log("value", value);
            fetchDataPersona(value);
        }
    };

    const fetchDataPersona = async (cedula) => {
        setLoadingBusqueda(true);
        setOpenResults(false);
        try {
            let response = await buscarOConsultarPersonaBienestar(cedula);
            const list = response ? (Array.isArray(response) ? response : [response]) : [];
            setSugerencias(list);
            setOpenResults(list.length > 0);
            if (cedula.length === 10 && (!response || response.length === 0)) {
                setNoEncontrada(true);
            } else {
                setNoEncontrada(false);
            }
        } catch {
            setSugerencias([]);
            if (cedula.length === 10) setNoEncontrada(true);
        }
        finally {
            setLoadingBusqueda(false);
            setHighlightedIndex(-1);
        }
    };

    const handleSugerenciaClick = async (sugerencia) => {
        console.log("sugerencia", sugerencia);
        setLoadingPaciente(true);
        try {
            //const datos_medicos = sugerencia.datos_medicos || {};
            // const gestacionData = calcularGestacion(datos_medicos);
            //setDataPersona({ ...sugerencia, datos_medicos: { ...datos_medicos, ...gestacionData } });
            setSugerencias([]);
            setSelectedSugerenciaId(sugerencia.id);
            setOpenResults(false);

            let response = await buscarOConsultarPersonaBienestar(sugerencia.cedula);
            console.log("response paciente", response);
            setDataPersona(response);

            //const atencionesData = await obtenerAtencionesPorPaciente(sugerencia.id, usr_id, usr_tipo);
            //setAtenciones(atencionesData);

            // const data = await obtenerTallaPesoPaciente(sugerencia.id);
            // if (!data.mensaje) {
            //     setTalla(data.talla || "");
            //     setPeso(data.peso || "");
            //     setTemperatura(data.temperatura || "");
            //     setPresionSistolica(data.presion_sistolica || "");
            //     setPresionDiastolica(data.presion_diastolica || "");
            //     setSaturacion(data.saturacion || "");
            // }

            // const nuevosFuncionarios = await obtenerFuncionariosPorRol(usr_tipo);
            // setInfoFuncionarios(nuevosFuncionarios);
        } catch (error) {
            console.error("Error al cargar paciente:", error);
        } finally {
            setLoadingPaciente(false);
        }
    };

    // const handleSave = async () => {
    //     if (selectedSugerenciaId) {
    //         const atencionesData = await obtenerAtencionesPorPaciente(selectedSugerenciaId, usr_id, usr_tipo);
    //         setAtenciones(atencionesData);
    //     }
    // };

    // const handleEliminarAtencion = async (atencionId) => {
    //     const confirmResult = await Swal.fire({
    //         title: "¿Estás seguro?",
    //         text: "Esta acción no se puede deshacer",
    //         icon: "warning",
    //         showCancelButton: true,
    //         confirmButtonText: "Sí, eliminar",
    //     });
    //     if (confirmResult.isConfirmed) {
    //         await actualizarEstadoAtencion(atencionId, 2);
    //         setAtenciones(atenciones.filter((a) => a.id !== atencionId));
    //         Swal.fire("Éxito", "Atención eliminada correctamente", "success");
    //     }
    // };

    // const renderDatosUniversidad = () => {
    //     if (persona?.datos_empleados)
    //         return <DatosUniversidad persona={persona} setDataPersona={setDataPersona} />;
    //     else if (persona?.datos_estudiantes)
    //         return <DatosUniversidadEstudiantes persona={persona} setDataPersona={setDataPersona} />;
    //     return null;
    // };

    // navegación por teclado
    const onKeyDown = (e) => {
        if (!openResults || loadingBusqueda || !limitedSugerencias.length) return;
        const total = limitedSugerencias.length;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % total);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + total) % total);
        } else if (e.key === "Enter") {
            if (highlightedIndex >= 0 && limitedSugerencias[highlightedIndex]) {
                handleSugerenciaClick(limitedSugerencias[highlightedIndex]);
            }
        } else if (e.key === "Escape") {
            setOpenResults(false);
        }
    };

    const clearSearch = () => {
        setCedula("");
        setSugerencias([]);
        setOpenResults(false);
        setHighlightedIndex(-1);
        setNoEncontrada(false);
        setDataPersona(null);
    };

    // compacto cuando está vacío
    const isEmptyResults = !loadingBusqueda && (noEncontrada || (hasQuery && sugerencias.length === 0));

    // ClickAway para Popper (ignora clicks en el anchor)
    const handleClickAway = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) return;
        setOpenResults(false);
    };

    const shouldOpenResults = !loadingBusqueda && hasQuery && (sugerencias?.length > 0);


    const handleGuardarAtencionExterna = async () => {
      console.log("handleGuardarAtencionExterna", formDataAtencionExterna);  

    }


    const handleFileEvidenciaChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== "application/pdf") {
            Swal.fire({
                icon: "warning",
                title: "Archivo no válido",
                text: "Por favor, selecciona un archivo PDF.",
            });
            return;
        }

        setFile(selectedFile);
        setFormDataAtencionExterna((prev) => ({
            ...prev,
            archivo_comprobante: selectedFile,
        }));
        setFilePreview(URL.createObjectURL(selectedFile));
    };


    return (
        <Box sx={{ maxWidth: "100%", margin: "auto", p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <InventoryIcon sx={{ color: "rgba(0, 0, 0, 1)", fontSize: 25 }} />
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "rgba(0, 0, 0, 1)" }}
                >
                    {/* {dataEstado
                        ? "Modificar Comprobante de Ingreso"
                        : "Registrar Comprobante de Ingreso"} */}
                    Registrar Comprobante de Egreso
                </Typography>
            </Box>

            {/* Buscador + Resultados en Popper */}
            <Box sx={{ position: "relative", mb: 5 }}>
                <Card
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                        backdropFilter: "saturate(180%) blur(4px)",
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={12}>
                            <Box ref={anchorRef}>
                                <TextField
                                    type="text"
                                    placeholder="Ingrese cédula"
                                    value={cedula}
                                    onChange={handleInputChange}
                                    onFocus={() => { if (shouldOpenResults) setOpenResults(true); }}
                                    onKeyDown={onKeyDown}
                                    fullWidth
                                    inputProps={{ maxLength: 10 }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: "text.secondary" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: cedula ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={clearSearch} aria-label="Limpiar búsqueda">
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Box>

                            {/* Loader */}
                            {loadingBusqueda && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        Buscando…
                                    </Typography>
                                </Box>
                            )}
                            {/* Sin resultados (fuera del popper) */}
                            {!loadingBusqueda && noEncontrada && (
                                <Paper
                                    sx={{
                                        mt: 1,
                                        p: 2,
                                        borderRadius: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1.25,
                                        border: "1px dashed",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Persona no encontrada.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setOpenResults(false);
                                            setOpenModalAgregarUsuario(true);
                                        }}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Registrar nuevo usuario
                                    </Button>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>

                    {/* Loader de carga de paciente */}
                    {loadingPaciente && (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                            <CircularProgress size={40} />
                            <Typography sx={{ ml: 2 }}>Cargando datos del paciente...</Typography>
                        </Box>
                    )}

                    {!loadingPaciente && persona && (
                        <Grid item xs={12} md={12} sx={{ mt: 3 }}>
                            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                                <Grid container spacing={3} style={{ padding: '5px' }} alignItems="stretch">
                                    <Grid item xs={12} sm={12}>
                                        <Box
                                            sx={{
                                                position: "relative",
                                                mb: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    position: "absolute",
                                                    top: -12,
                                                    left: 24,
                                                    backgroundColor: "#f3f7fd",
                                                    px: 1,
                                                    fontWeight: "bold",
                                                    color: "rgba(20, 73, 133, 1)",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                Datos del paciente
                                            </Typography>
                                            <Paper
                                                elevation={3}
                                                sx={{
                                                    p: 2,
                                                    pt: 3,
                                                    border: "1px solid rgba(20, 73, 133, 0.5)",
                                                    borderRadius: 2,
                                                    backgroundColor: "#f3f7fd",
                                                }}
                                            >
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Cedula:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.cedula}</TableCell>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Nombres:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.nombres}</TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Nacionalidad:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.nacionalidad}</TableCell>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Provincia:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.provincia}</TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Ciudad:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.ciudad}</TableCell>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Parroquia:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }}>{persona.parroquia}</TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Dirección:</TableCell>
                                                                <TableCell sx={{ fontSize: "12px" }} colSpan={4} >{persona.direccion}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Paper>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={12}>
                                        <Box
                                            sx={{
                                                position: "relative",
                                                mb: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    position: "absolute",
                                                    top: -12,
                                                    left: 24,
                                                    backgroundColor: "#f3f7fd",
                                                    px: 1,
                                                    fontWeight: "bold",
                                                    color: "rgba(20, 73, 133, 1)",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                Datos de la Atención
                                            </Typography>

                                            <Paper
                                                elevation={3}
                                                sx={{
                                                    p: 2,
                                                    pt: 3,
                                                    border: "1px solid rgba(20, 73, 133, 0.5)",
                                                    borderRadius: 2,
                                                    backgroundColor: "#f3f7fd",
                                                }}
                                            >
                                                {/* Fila con dos columnas */}
                                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                                    {/* Columna izquierda: Tipo Servicio */}
                                                    <Grid item xs={12} sm={6}>
                                                        <FormControl
                                                            size="small"
                                                            fullWidth
                                                            error={Boolean(errors["tipo_servicio"])}
                                                        >
                                                            <InputLabel id="tipo-adq-lbl">Tipo de Servicio</InputLabel>
                                                            <Select
                                                                labelId="tipo-adq-lbl"
                                                                label="Tipo de Servicio"
                                                                value={formDataAtencionExterna.tipo_servicio || ""}
                                                                onChange={(e) => {
                                                                    setFormDataAtencionExterna((p) => ({
                                                                        ...p,
                                                                        tipo_servicio: e.target.value,
                                                                    }));
                                                                    setTipoServicioSelected(Number(e.target.value));
                                                                    console.log("TipoServicioSelected", e.target.value);

                                                                    if (errors["tipo_servicio"]) {
                                                                        setErrors((prev) => {
                                                                            const copy = { ...prev };
                                                                            delete copy["tipo_servicio"];
                                                                            return copy;
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="0">
                                                                    <em>Seleccione</em>
                                                                </MenuItem>
                                                                <MenuItem value="1">Servicio Enfermería</MenuItem>
                                                                <MenuItem value="2">Seguro Estudiantil</MenuItem>
                                                            </Select>
                                                            {errors["tipo_servicio"] && (
                                                                <Typography variant="caption" color="error">
                                                                    {errors["tipo_servicio"]}
                                                                </Typography>
                                                            )}
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item xs={12} sm={6}>
                                                        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>
                                                            Evidencia (PDF)
                                                        </Typography>
                                                        <Grid container spacing={1} alignItems="center">
                                                            <Grid item>
                                                                <input
                                                                    ref={fileInputRef}
                                                                    accept="application/pdf"
                                                                    style={{ display: "none" }}
                                                                    id="upload-evidencia"
                                                                    type="file"
                                                                    disabled={TipoServicioSelected !== 2}
                                                                    onChange={(e) => {
                                                                        handleFileEvidenciaChange(e);
                                                                        if (errors["archivo_comprobante"]) {
                                                                            setErrors((prev) => {
                                                                                const copy = { ...prev };
                                                                                delete copy["archivo_comprobante"];
                                                                                return copy;
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                                <label htmlFor="upload-evidencia">
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        component="span"
                                                                        startIcon={<CloudUploadIcon sx={{ fontSize: 18 }} />}
                                                                        sx={{
                                                                            textTransform: "none",
                                                                            backgroundColor: TipoServicioSelected === 2 ? "#144985" : "rgba(20,73,133,0.3)",
                                                                            cursor: TipoServicioSelected === 2 ? "pointer" : "not-allowed",
                                                                        }}
                                                                        disabled={TipoServicioSelected !== 2}
                                                                    >
                                                                        Subir
                                                                    </Button>
                                                                </label>
                                                            </Grid>

                                                            <Grid item>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="secondary"
                                                                    startIcon={<PictureAsPdfIcon sx={{ fontSize: 18 }} />}
                                                                    onClick={() => setModalOpen(true)}
                                                                    disabled={!filePreview || TipoServicioSelected !== 2}
                                                                    sx={{
                                                                        textTransform: "none",
                                                                        cursor: (!filePreview || TipoServicioSelected !== 2) ? "not-allowed" : "pointer",
                                                                    }}
                                                                >
                                                                    Ver
                                                                </Button>
                                                            </Grid>

                                                            <Grid item>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
                                                                    onClick={() => {
                                                                        setFile(null);
                                                                        setFilePreview(null);
                                                                        setFormDataAtencionExterna((p) => ({
                                                                            ...p,
                                                                            archivo_comprobante: null,
                                                                        }));
                                                                        if (fileInputRef.current) fileInputRef.current.value = null;

                                                                        if (errors["archivo_comprobante"]) {
                                                                            setErrors((prev) => {
                                                                                const copy = { ...prev };
                                                                                delete copy["archivo_comprobante"];
                                                                                return copy;
                                                                            });
                                                                        }
                                                                    }}
                                                                    disabled={!file || TipoServicioSelected !== 2}
                                                                    sx={{
                                                                        textTransform: "none",
                                                                        cursor: (!file || TipoServicioSelected !== 2) ? "not-allowed" : "pointer",
                                                                    }}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </Grid>
                                                        </Grid>

                                                        {file && (
                                                            <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                                                                Archivo seleccionado: <strong>{file.name}</strong>
                                                            </Typography>
                                                        )}

                                                        {errors["archivo_comprobante"] && (
                                                            <Typography
                                                                variant="caption"
                                                                color="error"
                                                                sx={{ mt: 0.5, display: "block" }}
                                                            >
                                                                {errors["archivo_comprobante"]}
                                                            </Typography>
                                                        )}
                                                    </Grid>


                                                </Grid>

                                                {/* Descripción */}
                                                <Grid item xs={12}>
                                                    <TextField
                                                        id="txt-descripcion-atencion"
                                                        size="small"
                                                        label="Motivo de la atención"
                                                        fullWidth
                                                        value={formDataAtencionExterna.descripcion_atencion}
                                                        onChange={(e) => {
                                                            setFormDataAtencionExterna((prev) => ({
                                                                ...prev,
                                                                descripcion_atencion: e.target.value,
                                                            }));

                                                            if (errors["descripcion_atencion"]) {
                                                                setErrors((prev) => {
                                                                    const copy = { ...prev };
                                                                    delete copy["descripcion_atencion"];
                                                                    return copy;
                                                                });
                                                            }
                                                        }}
                                                        error={Boolean(errors["descripcion_atencion"])}
                                                        helperText={errors["descripcion_atencion"]}
                                                    />
                                                </Grid>
                                            </Paper>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<CloseIcon />}
                                                onClick={onCancelar}
                                                sx={{
                                                    color: "#d32f2f",
                                                    borderColor: "#d32f2f",
                                                    mr: 1.25,
                                                    "&:hover": {
                                                        backgroundColor: "rgba(211, 47, 47, 0.1)",
                                                        borderColor: "#d32f2f",
                                                    },
                                                    fontSize: "12px",
                                                }}
                                            >
                                                Cancelar
                                            </Button>

                                            <Button
                                                disabled={loadingSave}
                                                onClick={handleGuardarAtencionExterna}
                                                startIcon={<SaveIcon />}
                                                variant="contained"
                                                color="success"
                                                sx={{
                                                    borderRadius: 2,
                                                    minWidth: 120,
                                                    backgroundColor: "#fff",
                                                    color: "#2e7d32",
                                                    border: "1px solid #2e7d32",
                                                    boxShadow: "none",
                                                    "&:hover": {
                                                        backgroundColor: "rgba(46, 125, 50, 0.08)",
                                                        boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                                                    },
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {loadingSave ? (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <CircularProgress size={16} color="inherit" />
                                                        Guardando...
                                                    </Box>
                                                ) : (
                                                    "Guardar"
                                                )}
                                                {/* {selectedIngresos ? "Modificar" : "Guardar"} */}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Dialog
                                    open={modalOpen}
                                    onClose={() => setModalOpen(false)}
                                    maxWidth="md"
                                    fullWidth
                                >
                                    <DialogContent sx={{ p: 0 }}>
                                        {filePreview ? (
                                            <iframe
                                                src={filePreview}
                                                title="Vista previa PDF"
                                                width="100%"
                                                height="600px"
                                                style={{ border: "none" }}
                                            />
                                        ) : (
                                            <Typography sx={{ p: 2 }}>No hay archivo para mostrar</Typography>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </Box>
                        </Grid>
                    )
                    }
                </Card >

                < Popper
                    open={openResults && shouldOpenResults}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    modifiers={
                        [
                            { name: "offset", options: { offset: [0, 8] } },
                            { name: "preventOverflow", options: { boundary: "window" } },
                            { name: "flip", enabled: true },
                        ]}
                    style={{ zIndex: 1300 }}
                >
                    <ClickAwayListener onClickAway={handleClickAway}>
                        <Paper
                            sx={{
                                width: anchorRef.current ? anchorRef.current.offsetWidth : undefined,
                                minHeight: isEmptyResults ? 88 : undefined,
                                maxHeight: 320,
                                overflowY: "auto",
                                overflowX: "hidden",
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                            }}
                            // Evita que el click interno lo cierre antes de seleccionar
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Box
                                sx={{
                                    px: 2,
                                    py: isEmptyResults ? 0.75 : 1.25,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                }}
                            >
                                <Chip
                                    size="small"
                                    label={
                                        sugerencias.length
                                            ? `${sugerencias.length} resultado(s)`
                                            : noEncontrada
                                                ? "Sin resultados"
                                                : "—"
                                    }
                                    variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Usa ↑ ↓ para navegar, Enter para seleccionar, Esc para cerrar
                                </Typography>
                            </Box>
                            <Divider />

                            {!loadingBusqueda && sugerencias.length > 0 ? (
                                <List disablePadding>
                                    {limitedSugerencias.map((s, idx) => (
                                        <ListItem
                                            key={s.id ?? `${s.identificacion}-${idx}`}
                                            disablePadding
                                            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                                        >
                                            <ListItemButton
                                                selected={idx === highlightedIndex}
                                                onMouseEnter={() => setHighlightedIndex(idx)}
                                                onClick={() => handleSugerenciaClick(s)}
                                                sx={{
                                                    py: 1,
                                                    px: 2,
                                                    "&.Mui-selected": { bgcolor: "action.hover" },
                                                }}
                                            >
                                                <Avatar sx={{ width: 32, height: 32, mr: 1.5 }}>
                                                    {getInitials(s.nombres || s.name || "Usuario")}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                        {highlightMatch(s.nombres || s.name || "—", cedula)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {highlightMatch(`Identificación: ${s.identificacion ?? "—"}`, cedula)}
                                                    </Typography>
                                                </Box>
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : !loadingBusqueda && noEncontrada ? (
                                <Box
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1.25,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Persona no encontrada.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setOpenResults(false);
                                            setOpenModalAgregarUsuario(true);
                                        }}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Registrar nuevo usuario
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Escribe al menos 6 dígitos para buscar.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </ClickAwayListener>
                </Popper >

            </Box >


        </Box >
    );
};

export default AtencionExterna;
