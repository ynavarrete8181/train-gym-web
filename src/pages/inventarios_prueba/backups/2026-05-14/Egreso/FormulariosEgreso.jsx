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
} from "@mui/icons-material";
import {
  AxGetHistorialUsuarioBloqueadoGym,
  AxGuardarDesbloquearUsuario,
} from "../../../../axios/axios_client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faList, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  CancelOutlined,
  WarningAmber,
  Save as SaveIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const ActivacionUsuarioReservaGym = ({ onCancelar, usr_id, data }) => {
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

    const [dataEstado, setDataEstado] = useState(false);
    const [idNroIngreso, setIdNroIngreso] = useState("");

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
      console.log("cedula", cedulaParam);
      const data_ = await AxGetHistorialUsuarioBloqueadoGym(cedulaParam);

      const data = Array.isArray(data_) ? data_ : [];
      setDataHistialUsuarioBloqueado(data);
      setDataFilteredTurnosGym(data);
      setTotalRows(data.length);
      setHasSearched(true);

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

      const estadosHistorial = [
        ...new Set(data.map((d) => d.id_estado_historial).filter(Boolean)),
      ];
      setUniqueEstadosHistorial(estadosHistorial);

      const estadosUsuario = [
        ...new Set(data.map((d) => d.estado_usuario).filter(Boolean)),
      ];
      setUniqueEstadosUsuario(estadosUsuario);
    } catch (error) {
      console.error(error);
      setDataHistialUsuarioBloqueado([]);
      setDataFilteredTurnosGym([]);
      setTotalRows(0);
      setHasSearched(true);
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

      const matchesEstadoHistorial = filterEstadoHistorial
        ? String(d.id_estado_historial) === filterEstadoHistorial
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
            boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                mr: 1.5,
                border: "1px solid rgba(20,73,133,.25)",
                bgcolor: "rgba(20,73,133,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuBookIcon sx={{ color: "#144985" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "#1f3a5f" }}
              >
                {dataEstado
                  ? "Modificar Comprobante de Ingreso"
                  : "Registrar Comprobante de Ingreso"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7a90" }}>
                Nro:{" "}
                {dataEstado
                  ? N_comprobante_anterior || "—"
                  : idNroIngreso
                    ? `${idNroIngreso}`
                    : "—"}
              </Typography>
              {/* <Typography variant="body2" sx={{ color: "#6b7a90", mt: 0.2 }}>
                                    Administra el catálogo (CÓDIGO, NOMBRE, CRÉDITOS, HORAS).
                                </Typography> */}
            </Box>
            <Button
              variant="contained"
              sx={{
                ml: "auto",
                backgroundColor: "#144985",
                "&:hover": { backgroundColor: "#144985" },
                color: "white",
                px: 2,
                fontSize: 12,
              }}
              startIcon={<FontAwesomeIcon icon={faList} />}
              onClick={onCancelar}
            >
              Listar
            </Button>
            {/* <Chip
              label={`${dataFilteredInsumos.length} RESULTADOS`}
              size="small"
              sx={{ ml: "auto", fontWeight: 700 }}
              color="primary"
              variant="outlined"
            /> */}
          </Box>
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
                onClick={handleBuscarClick}
                disabled={loading}
                sx={{ textTransform: "none", fontWeight: 600 }}
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
  {!hasSearched ? (
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Ingrese el número de cédula y presione{" "}
        <b>&quot;Buscar historial&quot;</b> para ver los bloqueos del usuario.
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontStyle: "italic" }}
      >
        Asegúrese de escribir la cédula completa y sin espacios.
      </Typography>
    </Box>
  ) : totalRows === 0 && !loading ? (
    // 🔹 Estado: se buscó y NO hay registros para esa cédula
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Verifique que el número de cédula esté correctamente ingresado o que
        el funcionario cuente con registros de bloqueo en el sistema de
        gimnasio.
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontStyle: "italic" }}
      >
        Puede intentar con otra cédula o revisar los datos del usuario en el
        módulo de funcionarios.
      </Typography>
    </Box>
  ) : (
    // 🔹 Estado: sí hay registros → filtros + tabla
    <>
      {/* ... resto de filtros + tabla tal como ya lo tienes ... */}
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
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            borderTop: "5px solid #144985",
            p: 0,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "rgba(20,73,133,1)",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          <WarningAmber sx={{ fontSize: 28 }} />
          Desbloqueo de usuario
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3, px: 3 }}>
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

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            px: 3,
            pb: 3,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelOutlined />}
            onClick={handleCloseEstadoDialog}
            sx={{ px: 3, fontWeight: 600 }}
            disabled={loadingDesbloqueo}
          >
            Cancelar
          </Button>

          <Button
            variant="outlined"
            color="success"
            startIcon={!loadingDesbloqueo ? <SaveIcon /> : null}
            onClick={() => handleDesbloquearUsuario(33)}
            sx={{
              px: 3,
              fontWeight: 600,
              borderWidth: 2,
              borderColor: "success.main",
              bgcolor: "white",
              "&:hover": {
                borderWidth: 2,
                borderColor: "success.dark",
                bgcolor: "rgba(46, 125, 50, 0.06)",
              },
            }}
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
