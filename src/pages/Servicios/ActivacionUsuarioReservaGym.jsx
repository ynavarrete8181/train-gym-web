import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Collapse,
} from "@mui/material";
import {
  LockOpen as LockOpenIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  AxGetHistorialUsuarioBloqueadoGym,
  AxGuardarDesbloquearUsuario,
} from "../../../axios/axios_client";
import {
  CancelOutlined,
  WarningAmber,
  Save as SaveIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  modalActionsSx,
  modalCancelButtonSx,
  modalContentSx,
  modalPaperSx,
  modalPrimaryButtonSx,
  modalTitleSx,
} from "../../Styles/muiTheme";

const ActivacionUsuarioReservaGym = ({ usr_id }) => {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(
    parseInt(localStorage.getItem("rowsPerPageKardex") || "10", 10)
  );
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);

  const [DataHistorialUsuarioBloqueado, setDataHistialUsuarioBloqueado] =
    useState([]);
  const [DataFilteredTurnosGym, setDataFilteredTurnosGym] = useState([]);

  const [openEstadoDialog, setOpenEstadoDialog] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);

  const [filterHour, setFilterHour] = useState("");
  const [filterEstadoHistorial, setFilterEstadoHistorial] = useState("");
  const [filterEstadoUsuario, setFilterEstadoUsuario] = useState("");

  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");

  const [uniqueHours, setUniqueHours] = useState([]);
  const [uniqueEstadosHistorial, setUniqueEstadosHistorial] = useState([]);
  const [uniqueEstadosUsuario, setUniqueEstadosUsuario] = useState([]);

  const [expandedId, setExpandedId] = useState(null);
  const [motivoDesbloqueo, setMotivoDesbloqueo] = useState("");
  const MOTIVO_DESBLOQUEO_DEFAULT =
    "Usuario habilitado nuevamente para realizar reservaciones en el Gimnasio tras revisión de su historial y confirmación de compromiso de cumplimiento de las politicas de asistencia.";
  const [loadingDesbloqueo, setLoadingDesbloqueo] = useState(false);

  // Cédula + flag para saber si ya se hizo una búsqueda
  const [cedula, setCedula] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // indica si la API devolvió datos (para diferenciar de filtros)
  const [hasDataFromApi, setHasDataFromApi] = useState(false);

  // Colores de cabecera como tu ejemplo (azul claro + texto azul oscuro)
  const TABLE_HEAD_BG = "#d9e3ef";
  const TABLE_HEAD_TXT = "#0b2d4d";

  const handleRowsPerPageChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value);
    localStorage.setItem("rowsPerPageKardex", value.toString());
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterHour("");
    setFilterEstadoHistorial("");
    setFilterEstadoUsuario("");
    setFilterFechaDesde("");
    setFilterFechaHasta("");
    setPage(1);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return value;
    }
  };

  const parseDateValue = (value) => {
    if (!value) return 0;
    const d = new Date(value);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const fetchDataHistorialUsuariosBloqueadosGym = async (cedulaParam) => {
    if (!cedulaParam || !cedulaParam.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Cédula requerida",
        text: "Por favor ingrese el número de cédula para consultar.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setLoading(true);
    try {
      const data_ = await AxGetHistorialUsuarioBloqueadoGym(cedulaParam);

      // soporta array directo o axios {data: [...] } o {data:{data:[...]}}
      const raw = Array.isArray(data_)
        ? data_
        : Array.isArray(data_?.data)
          ? data_.data
          : Array.isArray(data_?.data?.data)
            ? data_.data.data
            : [];

      // ordenar: bloqueados (34) arriba + más reciente arriba
      const data = [...raw].sort((a, b) => {
        const aBloq = a.id_estado_historial === 34 ? 1 : 0;
        const bBloq = b.id_estado_historial === 34 ? 1 : 0;
        if (aBloq !== bBloq) return bBloq - aBloq;

        const ta = parseDateValue(a.fecha_bloqueo || a.created_at);
        const tb = parseDateValue(b.fecha_bloqueo || b.created_at);
        return tb - ta;
      });

      setDataHistialUsuarioBloqueado(data);
      setDataFilteredTurnosGym(data);
      setTotalRows(data.length);
      setHasSearched(true);
      setHasDataFromApi(data.length > 0);

      const horas = [
        ...new Set(
          data
            .map((d) => {
              if (!d.fecha_bloqueo) return null;
              try {
                return new Date(d.fecha_bloqueo).toLocaleTimeString("es-EC", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        ),
      ];
      setUniqueHours(horas.sort());

      // Mostrar NOMBRE del estado historial (no ID)
      // (opcional: mostrar también id en el texto -> "Bloqueado (34)")
      const estadosHistorial = [
        ...new Set(
          data
            .map((d) => {
              if (!d.estado_historial) return null;
              return `${d.estado_historial}${d.id_estado_historial ? ` (${d.id_estado_historial})` : ""
                }`;
            })
            .filter(Boolean)
        ),
      ];
      setUniqueEstadosHistorial(estadosHistorial.sort());

      const estadosUsuario = [
        ...new Set(data.map((d) => d.estado_usuario).filter(Boolean)),
      ];
      setUniqueEstadosUsuario(estadosUsuario.sort());

      setExpandedId(null);
    } catch (error) {
      console.error(error);
      setDataHistialUsuarioBloqueado([]);
      setDataFilteredTurnosGym([]);
      setTotalRows(0);
      setHasSearched(true);
      setHasDataFromApi(false);
      setUniqueHours([]);
      setUniqueEstadosHistorial([]);
      setUniqueEstadosUsuario([]);
      setExpandedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = DataHistorialUsuarioBloqueado.filter((d) => {
      const term = search.toLowerCase();

      const matchesSearch =
        !term ||
        (d.usuario_nombre?.toLowerCase() || "").includes(term) ||
        (d.usuario_email?.toLowerCase() || "").includes(term) ||
        (d.motivo_bloqueo?.toLowerCase() || "").includes(term) ||
        (d.motivo_desbloqueo?.toLowerCase() || "").includes(term);

      let matchesHour = true;
      if (filterHour) {
        try {
          const horaBloqueo = new Date(d.fecha_bloqueo).toLocaleTimeString(
            "es-EC",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }
          );
          matchesHour = horaBloqueo === filterHour;
        } catch {
          matchesHour = false;
        }
      }

      // filtrar por nombre del estado historial (con id opcional en el texto)
      const estadoHistorialLabel = d.estado_historial
        ? `${d.estado_historial}${d.id_estado_historial ? ` (${d.id_estado_historial})` : ""
        }`
        : "";

      const matchesEstadoHistorial = filterEstadoHistorial
        ? String(estadoHistorialLabel) === String(filterEstadoHistorial)
        : true;

      const matchesEstadoUsuario = filterEstadoUsuario
        ? d.estado_usuario === filterEstadoUsuario
        : true;

      let matchesFecha = true;
      if (filterFechaDesde || filterFechaHasta) {
        if (!d.fecha_bloqueo) {
          matchesFecha = false;
        } else {
          try {
            const fb = new Date(d.fecha_bloqueo);

            if (filterFechaDesde) {
              const desde = new Date(filterFechaDesde + "T00:00:00");
              if (fb < desde) matchesFecha = false;
            }

            if (filterFechaHasta) {
              const hasta = new Date(filterFechaHasta + "T23:59:59");
              if (fb > hasta) matchesFecha = false;
            }
          } catch {
            matchesFecha = false;
          }
        }
      }

      return (
        matchesSearch &&
        matchesHour &&
        matchesEstadoHistorial &&
        matchesEstadoUsuario &&
        matchesFecha
      );
    });

    setDataFilteredTurnosGym(filtered);
    setTotalRows(filtered.length);
    setPage(1);
  }, [
    search,
    filterHour,
    filterEstadoHistorial,
    filterEstadoUsuario,
    filterFechaDesde,
    filterFechaHasta,
    DataHistorialUsuarioBloqueado,
  ]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return DataFilteredTurnosGym.slice(start, start + rowsPerPage);
  }, [DataFilteredTurnosGym, page, rowsPerPage]);

  const resumenEstados = useMemo(() => {
    const bloqueados = DataFilteredTurnosGym.filter(
      (d) => d.id_estado_historial === 34
    ).length;
    const reactivados = DataFilteredTurnosGym.filter(
      (d) => d.id_estado_historial === 33
    ).length;
    return { bloqueados, reactivados };
  }, [DataFilteredTurnosGym]);

  const handleOpenEstadoDialog = (turno) => {
    setSelectedTurno(turno);
    const motivoInicial =
      turno.motivo_desbloqueo && turno.motivo_desbloqueo.trim().length > 0
        ? turno.motivo_desbloqueo
        : MOTIVO_DESBLOQUEO_DEFAULT;

    setMotivoDesbloqueo(motivoInicial);
    setOpenEstadoDialog(true);
  };

  const handleCloseEstadoDialog = () => {
    setOpenEstadoDialog(false);
    setSelectedTurno(null);
    setMotivoDesbloqueo("");
  };

  const handleDesbloquearUsuario = async (nuevoEstado) => {
    if (!selectedTurno) return;

    setLoadingDesbloqueo(true);

    try {
      const form = {
        id_turno: selectedTurno.tg_id,
        id_tipo_servicio: selectedTurno.tg_id_servicio,
        id_estado: nuevoEstado,
        motivo_desbloqueo: motivoDesbloqueo,
        id_usuario_desbloqueo: usr_id,
        id_usuario: selectedTurno.id_usuario,
        id_historial_bloqueo: selectedTurno.id,
      };

      const response = await AxGuardarDesbloquearUsuario(form);

      if (response.success) {
        setOpenEstadoDialog(false);
        setSelectedTurno(null);
        setMotivoDesbloqueo("");

        await fetchDataHistorialUsuariosBloqueadosGym(cedula);

        await Swal.fire({
          icon: "success",
          title: "Usuario desbloqueado",
          text: response.message || "Usuario desbloqueado correctamente.",
          confirmButtonText: "Aceptar",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "No se pudo desbloquear",
          text:
            response.message ||
            "No se pudo desbloquear el usuario. Intente más tarde.",
          confirmButtonText: "Aceptar",
        });
      }
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al desbloquear el usuario. Intente más tarde.",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoadingDesbloqueo(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleBuscarClick = () => {
    fetchDataHistorialUsuariosBloqueadosGym(cedula);
  };

  const handleCedulaKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBuscarClick();
    }
  };

  return (
    <Box sx={{ maxWidth: "100%", margin: "auto", p: 2 }}>
      <Paper
        elevation={8}
        sx={{
          mb: 4,
          p: 3,
          bgcolor: "white",
          borderRadius: "10px",
          borderTop: "3px solid #dedede",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1f3a5f" }}>
          Activación de Usuarios para Reservaciones de Servicios para asistir al
          Gimnasio
        </Typography>
      </Paper>

      <Paper
        elevation={8}
        sx={{
          mb: 4,
          p: 3,
          Align: "center",
          bgcolor: "white",
          borderRadius: "10px",
          borderTop: "3px solid #dedede",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <TextField
                label="Número de cédula"
                size="small"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onKeyDown={handleCedulaKeyDown}
                sx={{ minWidth: 220 }}
                placeholder="Ingrese la cédula del funcionario"
              />

              <Button
                variant="contained"
                startIcon={!loading ? <SearchIcon /> : null}
                onClick={handleBuscarClick}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#1976d2",
                  "&:hover": { backgroundColor: "#1565c0" },
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <span>Consultando...</span>
                  </Box>
                ) : (
                  "Buscar historial"
                )}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            {/* Mientras carga: NO renderiza tabla ni filtros */}
            {loading ? null : !hasSearched ? (
              <Box
                sx={{
                  mt: 4,
                  mb: 2,
                  maxWidth: "100%",
                  mx: "auto",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "#f7f9fc",
                  border: "1px solid #d0d7e2",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                >
                  Consulta de historial de bloqueos
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Ingrese el número de cédula y presione{" "}
                  <b>&quot;Buscar historial&quot;</b> para ver los bloqueos del
                  usuario.
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Asegúrese de escribir la cédula completa y sin espacios.
                </Typography>
              </Box>
            ) : !hasDataFromApi ? (
              <Box
                sx={{
                  mt: 4,
                  mb: 2,
                  maxWidth: "100%",
                  mx: "auto",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "#f7f9fc",
                  border: "1px solid #d0d7e2",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                }}
              >
                <WarningAmber sx={{ fontSize: 48, mb: 1 }} color="warning" />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                >
                  No se encontró historial para esta cédula
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Verifique que el número de cédula esté correctamente ingresado
                  o que el funcionario cuente con registros de bloqueo en el
                  sistema de gimnasio.
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Puede intentar con otra cédula o revisar los datos del usuario
                  en el módulo de funcionarios.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Resumen */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 2,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Chip
                      label={`Bloqueados: ${resumenEstados.bloqueados}`}
                      color="warning"
                      variant="outlined"
                    />
                    <Chip
                      label={`Reactivados: ${resumenEstados.reactivados}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`Total: ${DataFilteredTurnosGym.length}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <InputLabel>Filas</InputLabel>
                      <Select
                        value={rowsPerPage}
                        label="Filas"
                        onChange={handleRowsPerPageChange}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Limpiar filtros
                    </Button>
                  </Box>
                </Box>

                {/* Filtros */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Buscar"
                      size="small"
                      fullWidth
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nombre, correo, motivo..."
                    />
                  </Grid>

                  <Grid item xs={12} md={2.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Hora</InputLabel>
                      <Select
                        value={filterHour}
                        label="Hora"
                        onChange={(e) => setFilterHour(e.target.value)}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {uniqueHours.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={2.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Estado historial</InputLabel>
                      <Select
                        value={filterEstadoHistorial}
                        label="Estado historial"
                        onChange={(e) =>
                          setFilterEstadoHistorial(e.target.value)
                        }
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {uniqueEstadosHistorial.map((e_) => (
                          <MenuItem key={String(e_)} value={String(e_)}>
                            {String(e_)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Estado usuario</InputLabel>
                      <Select
                        value={filterEstadoUsuario}
                        label="Estado usuario"
                        onChange={(e) => setFilterEstadoUsuario(e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {uniqueEstadosUsuario.map((e_) => (
                          <MenuItem key={String(e_)} value={String(e_)}>
                            {String(e_)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Desde"
                      size="small"
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={filterFechaDesde}
                      onChange={(e) => setFilterFechaDesde(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Hasta"
                      size="small"
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={filterFechaHasta}
                      onChange={(e) => setFilterFechaHasta(e.target.value)}
                    />
                  </Grid>
                </Grid>

                {/* Tabla */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: TABLE_HEAD_BG }}>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Usuario
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Correo
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Estado Historial
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Estado Usuario
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Fecha bloqueo
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Fecha desbloqueo
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: TABLE_HEAD_TXT }}
                        >
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2 }}
                            >
                              No hay datos para los filtros seleccionados.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((row) => {
                          const isExpanded = expandedId === row.id;
                          const isBloqueado = row.id_estado_historial === 34;

                          return (
                            <React.Fragment key={row.id}>
                              <TableRow
                                hover
                                sx={{
                                  ...(isBloqueado && {
                                    backgroundColor: "rgba(211, 47, 47, 0.08)",
                                  }),
                                }}
                              >
                                <TableCell>
                                  {row.usuario_nombre || "-"}
                                </TableCell>
                                <TableCell>
                                  {row.usuario_email || "-"}
                                </TableCell>

                                <TableCell>
                                  <Chip
                                    label={
                                      row.estado_historial ||
                                      row.id_estado_historial ||
                                      "-"
                                    }
                                    size="small"
                                    variant="outlined"
                                    color={
                                      row.id_estado_historial === 34
                                        ? "warning"
                                        : row.id_estado_historial === 33
                                          ? "success"
                                          : "default"
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  <Chip
                                    label={row.estado_usuario || "-"}
                                    size="small"
                                    variant="outlined"
                                    color={
                                      row.estado_usuario === "Activo"
                                        ? "success"
                                        : "default"
                                    }
                                  />
                                </TableCell>

                                <TableCell>
                                  {formatDateTime(row.fecha_bloqueo)}
                                </TableCell>
                                <TableCell>
                                  {formatDateTime(row.fecha_desbloqueo)}
                                </TableCell>

                                <TableCell>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Tooltip title="Ver detalle">
                                      <IconButton
                                        size="small"
                                        onClick={() => toggleExpand(row.id)}
                                      >
                                        {isExpanded ? (
                                          <KeyboardArrowUp />
                                        ) : (
                                          <KeyboardArrowDown />
                                        )}
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Desbloquear usuario">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() =>
                                            handleOpenEstadoDialog(row)
                                          }
                                        >
                                          <LockOpenIcon />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>

                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  sx={{
                                    p: 0,
                                    borderBottom: "1px solid #eef2f7",
                                  }}
                                >
                                  <Collapse
                                    in={isExpanded}
                                    timeout="auto"
                                    unmountOnExit
                                  >
                                    <Box sx={{ p: 2, bgcolor: "#fcfcfd" }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 700, mb: 0.5 }}
                                          >
                                            Motivo de bloqueo
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {row.motivo_bloqueo || "-"}
                                          </Typography>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 700, mb: 0.5 }}
                                          >
                                            Motivo de desbloqueo
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {row.motivo_desbloqueo || "-"}
                                          </Typography>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 700, mb: 0.5 }}
                                          >
                                            Desbloqueado por
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {row.usuario_desbloqueo_nombre ||
                                              "-"}{" "}
                                            {row.usuario_desbloqueo_email
                                              ? `(${row.usuario_desbloqueo_email})`
                                              : ""}
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginación */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={Math.max(1, Math.ceil(totalRows / rowsPerPage))}
                    page={page}
                    onChange={(e, v) => setPage(v)}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={openEstadoDialog}
        onClose={handleCloseEstadoDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: modalPaperSx,
        }}
      >
        <DialogTitle
          sx={{
            ...modalTitleSx,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmber sx={{ fontSize: 28 }} />
          Desbloqueo de usuario
        </DialogTitle>

        <DialogContent dividers sx={{ ...modalContentSx, px: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {selectedTurno
              ? `Desbloquear a "${selectedTurno.usuario_nombre || selectedTurno.name || ""
              }"`
              : ""}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta acción reactivará al usuario para realizar reservaciones en el
            GYM. Por favor ingresa el motivo del desbloqueo y confirma la
            operación.
          </Typography>

          <TextField
            label="Motivo de desbloqueo"
            placeholder="Escribe el motivo por el cual se realiza el desbloqueo..."
            multiline
            minRows={3}
            fullWidth
            value={motivoDesbloqueo}
            onChange={(e) => setMotivoDesbloqueo(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ ...modalActionsSx, justifyContent: "flex-end", px: 3 }}>
          <Button
            variant="outlined"
            startIcon={<CancelOutlined />}
            onClick={handleCloseEstadoDialog}
            sx={modalCancelButtonSx}
            disabled={loadingDesbloqueo}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={!loadingDesbloqueo ? <SaveIcon /> : null}
            onClick={() => handleDesbloquearUsuario(33)}
            sx={modalPrimaryButtonSx}
            disabled={!motivoDesbloqueo.trim() || loadingDesbloqueo}
          >
            {loadingDesbloqueo ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <span>Desbloqueando...</span>
              </Box>
            ) : (
              "Desbloquear"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivacionUsuarioReservaGym;
