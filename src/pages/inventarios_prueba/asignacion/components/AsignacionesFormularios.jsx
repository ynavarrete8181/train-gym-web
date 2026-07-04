import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveIcon from "@mui/icons-material/Save";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import Swal from "sweetalert2";

const ui = {
  bg: "#f6f8fc",
  head: "#0b1f3a",
  muted: "#64748B",
  border: "#dbe3f0",
  primary: "#144985",
  primarySoft: "#EEF4FB",
  primaryHeader: "#DCE8F7",
  primaryHeaderBorder: "#C7D8EE",
  success: "#2E7D32",
  successSoft: "#EAF7EE",
  successBorder: "#CFE7D4",
  danger: "#D92D20",
  dangerSoft: "#FEECEB",
  dangerBorder: "#F7C7C3",
};

const baseFontSx = {
  fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
  letterSpacing: 0,
  fontStyle: "normal",
};

const fieldSx = {
  "& .MuiInputBase-root": {
    ...baseFontSx,
    fontSize: 12,
    minHeight: 40,
    borderRadius: 1.5,
  },
  "& .MuiInputBase-input": { ...baseFontSx, fontSize: 12, py: 1.05 },
  "& .MuiInputLabel-root": { ...baseFontSx, fontSize: 12 },
};

const tableSx = {
  "& th": {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: ui.head,
    bgcolor: "#f3f6fb",
    borderBottom: `1px solid ${ui.border}`,
    py: 0.9,
    whiteSpace: "nowrap",
  },
  "& td": {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.border}`,
    py: 0.8,
    verticalAlign: "middle",
  },
};

const tableContainerSx = {
  borderRadius: 1.5,
  borderColor: ui.border,
  bgcolor: "#fff",
  boxShadow: "none",
  overflow: "hidden",
};

const AsignacionesFormularios = ({
  onVolver,
  onBuscarProductos,
  onBuscarReceptor,
  onGuardar,
  loadingProductos = false,
  productosBase = [],
  prefetch = {},
  initialTipoFlujo = "medicamentos_insumos",
}) => {
  const [form, setForm] = useState({
    tipo_flujo: initialTipoFlujo,
    tipo_destino: "bodega",
    sede_destino_id: "",
    facultad_destino_id: "",
    bodega_destino_id: "",
    sede_origen_id: "",
    facultad_origen_id: "",
    bodega_origen_id: "",
    observacion: "",
    q_producto: "",
  });
  const [cantidades, setCantidades] = useState({});
  const [seleccionIds, setSeleccionIds] = useState([]);
  const [errores, setErrores] = useState({});
  const [alertaBodega, setAlertaBodega] = useState("");
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [receptorLocal, setReceptorLocal] = useState(null);
  const [asignacionesReceptor, setAsignacionesReceptor] = useState([]);
  const [loadingReceptor, setLoadingReceptor] = useState(false);

  useEffect(() => {
    if (!form.bodega_origen_id) return;

    const timeout = setTimeout(() => {
      onBuscarProductos?.({
        tipo_flujo: form.tipo_flujo,
        bodega_id: form.bodega_origen_id,
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.bodega_origen_id, form.tipo_flujo, onBuscarProductos]);

  const bodegas = Array.isArray(prefetch?.bodegas) ? prefetch.bodegas : [];

  const sedes = useMemo(
    () =>
      Array.from(
        new Map(
          bodegas.map((item) => [String(item.sede_id), { value: String(item.sede_id), label: item.nombre_sede }])
        ).values()
      ),
    [bodegas]
  );

  const facultadesOrigen = useMemo(() => {
    if (!form.sede_origen_id) return [];
    return Array.from(
      new Map(
        bodegas
          .filter((item) => String(item.sede_id) === String(form.sede_origen_id))
          .map((item) => [String(item.facultad_id), { value: String(item.facultad_id), label: item.nombre_facultad }])
      ).values()
    );
  }, [bodegas, form.sede_origen_id]);

  const bodegasOrigen = useMemo(
    () =>
      bodegas.filter(
        (item) =>
          String(item.sede_id) === String(form.sede_origen_id) &&
          String(item.facultad_id) === String(form.facultad_origen_id)
      ),
    [bodegas, form.sede_origen_id, form.facultad_origen_id]
  );

  const facultadesDestino = useMemo(() => {
    if (!form.sede_destino_id) return [];
    return Array.from(
      new Map(
        bodegas
          .filter((item) => String(item.sede_id) === String(form.sede_destino_id))
          .map((item) => [String(item.facultad_id), { value: String(item.facultad_id), label: item.nombre_facultad }])
      ).values()
    );
  }, [bodegas, form.sede_destino_id]);

  const bodegasDestino = useMemo(
    () =>
      bodegas.filter(
        (item) =>
          String(item.sede_id) === String(form.sede_destino_id) &&
          String(item.facultad_id) === String(form.facultad_destino_id) &&
          String(item.id) !== String(form.bodega_origen_id)
      ),
    [bodegas, form.sede_destino_id, form.facultad_destino_id, form.bodega_origen_id]
  );

  const selectedBodega = useMemo(
    () => bodegas.find((item) => String(item.id) === String(form.bodega_origen_id)),
    [bodegas, form.bodega_origen_id]
  );

  const productos = useMemo(() => {
    const term = String(form.q_producto || "").trim().toLowerCase();
    if (!term || term.length < 5) return [];

    return (Array.isArray(productosBase) ? productosBase : []).filter((item) =>
      [
        item?.codigo,
        item?.ins_descripcion,
        item?.marca,
        item?.modelo,
        item?.serie,
        item?.categoria_nombre,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ")
        .includes(term)
    );
  }, [productosBase, form.q_producto]);

  const productosSeleccionados = useMemo(
    () => (Array.isArray(productosBase) ? productosBase : []).filter((item) => seleccionIds.includes(Number(item.id))),
    [productosBase, seleccionIds]
  );

  const productosResultado = useMemo(
    () => productos.filter((item) => !seleccionIds.includes(Number(item.id))),
    [productos, seleccionIds]
  );

  const receptorActivo = receptorLocal || null;

  const itemsSeleccionados = useMemo(
    () =>
      productosSeleccionados
        .map((item) => ({
          producto_id: item.id,
          producto: item.ins_descripcion,
          cantidad: Number(cantidades[item.id] || 0),
          stock_total: Number(item.stock_bodega || 0),
          stock_util: Number(item.stock_util ?? item.stock_bodega ?? 0),
          proximo_vencimiento_vigente: item.proximo_vencimiento_vigente ?? null,
        }))
        .filter((item) => item.cantidad > 0),
    [productosSeleccionados, cantidades]
  );

  const marcarError = (payload) => setErrores((prev) => ({ ...prev, ...payload }));

  const handleBuscarReceptorClick = async () => {
    setErrores({});
    setAlertaBodega("");

    if (!cedulaBusqueda.trim()) {
      marcarError({ cedula: true });
      Swal.fire({
        icon: "warning",
        title: "Cédula requerida",
        text: "Ingresa una cédula para consultar el funcionario.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    setLoadingReceptor(true);
    try {
      const response = await onBuscarReceptor(cedulaBusqueda.trim());
      setReceptorLocal(response?.persona || null);
      setAsignacionesReceptor(Array.isArray(response?.asignaciones) ? response.asignaciones : []);

      if (!response?.persona) {
        setSeleccionIds([]);
        setCantidades({});
        Swal.fire({
          icon: "info",
          title: "Sin coincidencias",
          text: "No se encontró ningún funcionario con esa cédula.",
          confirmButtonColor: ui.primary,
        });
      }
    } catch (error) {
      setReceptorLocal(null);
      setAsignacionesReceptor([]);
      setSeleccionIds([]);
      setCantidades({});
      Swal.fire({
        icon: "error",
        title: "Error al consultar",
        text: "No se pudo consultar la cédula del funcionario.",
        confirmButtonColor: ui.primary,
      });
    } finally {
      setLoadingReceptor(false);
    }
  };

  const handleAgregarProducto = (item) => {
    const id = Number(item.id);
    if (!seleccionIds.includes(id)) {
      setSeleccionIds((prev) => [...prev, id]);
      setCantidades((prev) => ({ ...prev, [id]: prev[id] || "1" }));
    }
  };

  const handleQuitarProducto = (productoId) => {
    const id = Number(productoId);
    setSeleccionIds((prev) => prev.filter((itemId) => itemId !== id));
    setCantidades((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleCantidadChange = (item, rawValue) => {
    const id = Number(item.id);
    const stockUtil = Number(item.stock_util ?? item.stock_bodega ?? 0);

    if (rawValue === "") {
      setCantidades((prev) => ({ ...prev, [id]: "" }));
      return;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return;

    const sanitizedValue = Math.max(1, Math.min(stockUtil, numericValue));
    setCantidades((prev) => ({ ...prev, [id]: String(sanitizedValue) }));
  };

  const handleGuardarClick = async () => {
    setErrores({});
    setAlertaBodega("");

    if (!receptorActivo?.id) {
      marcarError({ cedula: true });
      Swal.fire({
        icon: "warning",
        title: "Falta el receptor",
        text: "Primero busca y selecciona la cédula del funcionario para poder registrar la asignación.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    if (!form.bodega_origen_id || !form.sede_origen_id || !form.facultad_origen_id) {
      marcarError({
        sede_origen_id: !form.sede_origen_id,
        facultad_origen_id: !form.facultad_origen_id,
        bodega_origen_id: !form.bodega_origen_id,
      });
      Swal.fire({
        icon: "warning",
        title: "Origen incompleto",
        text: "Debes seleccionar sede, facultad y bodega de origen.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    if (!form.bodega_destino_id || !form.sede_destino_id || !form.facultad_destino_id) {
      marcarError({
        sede_destino_id: !form.sede_destino_id,
        facultad_destino_id: !form.facultad_destino_id,
        bodega_destino_id: !form.bodega_destino_id,
      });
      Swal.fire({
        icon: "warning",
        title: "Destino incompleto",
        text: "Debes seleccionar sede, facultad y bodega destino.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    if (String(form.bodega_origen_id) === String(form.bodega_destino_id)) {
      marcarError({ bodega_destino_id: true, bodega_origen_id: true });
      setAlertaBodega("No se puede escoger la misma bodega como origen y destino.");
      Swal.fire({
        icon: "warning",
        title: "Bodega repetida",
        text: "La bodega destino debe ser distinta a la bodega de origen.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    if (itemsSeleccionados.length === 0) {
      marcarError({ items: true });
      Swal.fire({
        icon: "warning",
        title: "Sin productos",
        text: "Debes ingresar al menos una cantidad a trasladar.",
        confirmButtonColor: ui.primary,
      });
      return;
    }

    const itemExcedido = itemsSeleccionados.find((item) => item.cantidad > item.stock_util);
    if (itemExcedido) {
      marcarError({ items: true });
      Swal.fire({
        icon: "warning",
        title: "Cantidad excedida",
        text: `La cantidad para ${itemExcedido.producto} no puede superar el stock útil disponible.`,
        confirmButtonColor: ui.primary,
      });
      return;
    }

    await onGuardar({
      receptor: receptorActivo,
      form,
      items: itemsSeleccionados,
    });
  };

  return (
    <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
      <Box sx={{ maxWidth: "100%", mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#fff",
            border: `1px solid ${ui.border}`,
            borderRadius: 3,
            px: 2,
            py: 1.5,
            mb: 1.5,
            boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                border: `1px solid rgba(20,73,133,.18)`,
                bgcolor: ui.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AddCircleOutlineIcon sx={{ color: ui.primary, fontSize: 18 }} />
            </Box>

            <Box sx={{ minWidth: 220 }}>
              <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                Añadir asignación interna
              </Typography>
              <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
                Primero identificamos al funcionario y luego armamos el traslado entre bodegas.
              </Typography>
            </Box>

            <Chip label="Paso 1 · Buscar cédula" color="primary" variant="outlined" sx={{ ...baseFontSx, fontWeight: 900 }} />
            <Chip
              label={`Paso 2 · ${receptorActivo ? "Configurar traslado" : "Esperando receptor"}`}
              color={receptorActivo ? "success" : "default"}
              variant="outlined"
              sx={{ ...baseFontSx, fontWeight: 900 }}
            />

            <span style={{ marginLeft: "auto" }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={onVolver}
                sx={{
                  ...baseFontSx,
                  height: 34,
                  borderRadius: 1.5,
                  fontSize: 12,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  borderColor: ui.border,
                  color: ui.head,
                  bgcolor: "#fff",
                }}
              >
                Volver al listado
              </Button>
            </span>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            bgcolor: "#fff",
            border: `1px solid ${ui.border}`,
            borderRadius: 3,
            p: 1.5,
            boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
          }}
        >
          {alertaBodega ? (
            <Alert severity="warning" sx={{ ...baseFontSx, fontSize: 12, mb: 2 }} onClose={() => setAlertaBodega("")}>
              {alertaBodega}
            </Alert>
          ) : null}

          <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: ui.border, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.1, bgcolor: ui.primaryHeader, borderBottom: `1px solid ${ui.primaryHeaderBorder}` }}>
                <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 12, color: ui.head }}>
                  Identificación del receptor
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 2,
                    borderColor: ui.border,
                    bgcolor: "#fff",
                  }}
                >
                  <Grid container spacing={1.5} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Número de cédula"
                        value={cedulaBusqueda}
                        onChange={(e) => setCedulaBusqueda(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleBuscarReceptorClick();
                          }
                        }}
                        error={Boolean(errores.cedula)}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: <SearchOutlinedIcon sx={{ mr: 1, fontSize: 16, color: ui.muted }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md="auto" sx={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        variant="contained"
                        onClick={handleBuscarReceptorClick}
                        disabled={loadingReceptor}
                        startIcon={<SearchOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          ...baseFontSx,
                          fontSize: 12,
                          height: 40,
                          borderRadius: 1.5,
                          px: 2.25,
                          textTransform: "none",
                          color: "#fff",
                          bgcolor: ui.primary,
                          fontWeight: 800,
                          boxShadow: "0 6px 14px rgba(20,73,133,0.16)",
                          "&:hover": {
                            bgcolor: "#0F3A6B",
                          },
                        }}
                      >
                        {loadingReceptor ? "Buscando..." : "Buscar cédula"}
                      </Button>
                    </Grid>
                  </Grid>

                  {!receptorActivo ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        px: 2,
                        py: { xs: 3, md: 4 },
                        borderRadius: 2,
                        border: `1px solid ${ui.border}`,
                        bgcolor: "#fafcff",
                      }}
                    >
                      <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 16, mb: 1 }}>
                        Consulta del receptor para traslado
                      </Typography>
                      <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 12.5, mb: 1 }}>
                        Ingrese el número de cédula y presione{" "}
                        <Box component="span" sx={{ fontWeight: 900, color: ui.head }}>
                          "Buscar cédula"
                        </Box>{" "}
                        para localizar al funcionario.
                      </Typography>
                      <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11.5, fontStyle: "italic" }}>
                        Asegúrese de escribir la cédula completa y sin espacios.
                      </Typography>
                    </Box>
                  ) : null}

                  <Box sx={{ mt: receptorActivo ? 0 : 1 }}>
                  {receptorActivo ? (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, borderColor: ui.border }}>
                      <Typography sx={{ ...baseFontSx, fontSize: 12.5, fontWeight: 900, color: ui.head }}>
                        {receptorActivo.nombres}
                      </Typography>
                      <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                        Cédula: {receptorActivo.cedula} {receptorActivo.celular ? `· ${receptorActivo.celular}` : ""}
                      </Typography>
                    </Paper>
                  ) : (
                    <Alert severity="info" sx={{ ...baseFontSx, fontSize: 12 }}>
                      Busca la cédula del funcionario para habilitar el resto del flujo.
                    </Alert>
                  )}
                  </Box>
                </Paper>

                {receptorActivo && asignacionesReceptor.length > 0 ? (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 11.5, color: ui.head, mb: 0.8 }}>
                      Asignaciones previas del funcionario
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                      <Table size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell>Origen</TableCell>
                            <TableCell>Destino</TableCell>
                            <TableCell align="center">Cantidad</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {asignacionesReceptor.map((row) => (
                            <TableRow key={`${row.id}-${row.producto}-${row.fecha}`}>
                              <TableCell>{row.fecha || "-"}</TableCell>
                              <TableCell>{row.producto || "-"}</TableCell>
                              <TableCell>{row.bodega_origen || "-"}</TableCell>
                              <TableCell>{row.bodega_destino || row.tipo_destino || "-"}</TableCell>
                              <TableCell align="center">{row.cantidad ?? "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : null}
              </Box>
            </Paper>
          </Grid>

          {receptorActivo ? (
            <>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: ui.border, overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.1, bgcolor: ui.primaryHeader, borderBottom: `1px solid ${ui.primaryHeaderBorder}` }}>
                    <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 12, color: ui.head }}>
                      Configuración del traslado
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl size="small" fullWidth>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Flujo</InputLabel>
                          <Select
                            label="Flujo"
                            value={form.tipo_flujo}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_flujo: e.target.value }))}
                            sx={fieldSx}
                          >
                            <MenuItem value="medicamentos_insumos">Medicamentos e insumos</MenuItem>
                            <MenuItem value="bienes_suministros">Bienes y suministros</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Observación"
                          value={form.observacion}
                          onChange={(e) => setForm((prev) => ({ ...prev, observacion: e.target.value }))}
                          multiline
                          rows={2}
                          sx={fieldSx}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: ui.border, overflow: "hidden", height: "100%" }}>
                  <Box sx={{ px: 2, py: 1.1, bgcolor: ui.primaryHeader, borderBottom: `1px solid ${ui.primaryHeaderBorder}` }}>
                    <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 12, color: ui.head }}>
                      Origen
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.sede_origen_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Sede origen</InputLabel>
                          <Select
                            label="Sede origen"
                            value={form.sede_origen_id}
                            onChange={(e) => {
                              setCantidades({});
                              setAlertaBodega("");
                              setForm((prev) => ({
                                ...prev,
                                sede_origen_id: e.target.value,
                                facultad_origen_id: "",
                                bodega_origen_id: "",
                                q_producto: "",
                              }));
                            }}
                            sx={fieldSx}
                          >
                            {sedes.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.facultad_origen_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Facultad origen</InputLabel>
                          <Select
                            label="Facultad origen"
                            value={form.facultad_origen_id}
                            onChange={(e) => {
                              setCantidades({});
                              setAlertaBodega("");
                              setForm((prev) => ({
                                ...prev,
                                facultad_origen_id: e.target.value,
                                bodega_origen_id: "",
                                q_producto: "",
                              }));
                            }}
                            sx={fieldSx}
                          >
                            {facultadesOrigen.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.bodega_origen_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Bodega origen</InputLabel>
                          <Select
                            label="Bodega origen"
                            value={form.bodega_origen_id}
                            onChange={(e) => {
                              setCantidades({});
                              setSeleccionIds([]);
                              setAlertaBodega("");
                              setForm((prev) => ({
                                ...prev,
                                bodega_origen_id: e.target.value,
                                q_producto: "",
                                sede_destino_id: "",
                                facultad_destino_id: "",
                                bodega_destino_id: "",
                              }));
                            }}
                            sx={fieldSx}
                          >
                            {bodegasOrigen.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: ui.border, overflow: "hidden", height: "100%" }}>
                  <Box sx={{ px: 2, py: 1.1, bgcolor: ui.primaryHeader, borderBottom: `1px solid ${ui.primaryHeaderBorder}` }}>
                    <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 12, color: ui.head }}>
                      Destino
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Tipo de destino</InputLabel>
                          <Select
                            label="Tipo de destino"
                            value={form.tipo_destino}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_destino: e.target.value }))}
                            sx={fieldSx}
                          >
                            <MenuItem value="bodega">Otra bodega</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.sede_destino_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Sede destino</InputLabel>
                          <Select
                            label="Sede destino"
                            value={form.sede_destino_id}
                            onChange={(e) => {
                              setAlertaBodega("");
                              setForm((prev) => ({
                                ...prev,
                                sede_destino_id: e.target.value,
                                facultad_destino_id: "",
                                bodega_destino_id: "",
                              }));
                            }}
                            sx={fieldSx}
                          >
                            {sedes.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.facultad_destino_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Facultad destino</InputLabel>
                          <Select
                            label="Facultad destino"
                            value={form.facultad_destino_id}
                            onChange={(e) => {
                              setAlertaBodega("");
                              setForm((prev) => ({
                                ...prev,
                                facultad_destino_id: e.target.value,
                                bodega_destino_id: "",
                              }));
                            }}
                            sx={fieldSx}
                          >
                            {facultadesDestino.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl size="small" fullWidth error={Boolean(errores.bodega_destino_id)}>
                          <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Bodega destino</InputLabel>
                          <Select
                            label="Bodega destino"
                            value={form.bodega_destino_id}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setForm((prev) => ({ ...prev, bodega_destino_id: newValue }));
                              setAlertaBodega(
                                String(newValue) === String(form.bodega_origen_id)
                                  ? "No se puede escoger la misma bodega como origen y destino."
                                  : ""
                              );
                            }}
                            sx={fieldSx}
                          >
                            {bodegasDestino.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: ui.border, overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.1, bgcolor: ui.primaryHeader, borderBottom: `1px solid ${ui.primaryHeaderBorder}` }}>
                    <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 12, color: ui.head }}>
                      Productos del origen
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mb: 1.5 }}>
                      Busca por código, nombre o referencia. Solo trabajamos con stock útil vigente del origen seleccionado.
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      label="Buscar producto"
                      value={form.q_producto}
                      onChange={(e) => setForm((prev) => ({ ...prev, q_producto: e.target.value }))}
                      sx={{ ...fieldSx, mb: 1.5 }}
                      disabled={!selectedBodega}
                    />

                    {!selectedBodega ? (
                      <Alert severity="info" sx={{ ...baseFontSx, fontSize: 12 }}>
                        Primero selecciona la bodega origen para consultar productos disponibles.
                      </Alert>
                    ) : null}

                    {loadingProductos ? (
                      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={22} />
                      </Box>
                    ) : null}

                    {selectedBodega && String(form.q_producto || "").trim().length >= 5 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ ...tableContainerSx, mb: 2 }}>
                        <Table size="small" sx={tableSx}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Código</TableCell>
                              <TableCell>Producto</TableCell>
                              <TableCell>Stock útil</TableCell>
                              <TableCell>Próx. venc.</TableCell>
                              <TableCell align="center">Agregar</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {productosResultado.length > 0 ? (
                              productosResultado.map((item) => (
                                <TableRow key={item.id} hover>
                                  <TableCell>{item.codigo || "-"}</TableCell>
                                  <TableCell>{item.ins_descripcion || "-"}</TableCell>
                                  <TableCell>{item.stock_util ?? item.stock_bodega ?? 0}</TableCell>
                                  <TableCell>{item.proximo_vencimiento_vigente || "-"}</TableCell>
                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<AddCircleOutlineIcon />}
                                      onClick={() => handleAgregarProducto(item)}
                                      sx={{ ...baseFontSx, fontSize: 11, textTransform: "none" }}
                                    >
                                      Agregar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} align="center">
                                  <Typography sx={{ ...baseFontSx, fontSize: 11.5, color: ui.muted }}>
                                    No hay coincidencias para esa búsqueda.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : null}

                    <Divider sx={{ mb: 1.5 }} />

                    <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 900, color: ui.head, mb: 1 }}>
                      Resumen del traslado
                    </Typography>

                    <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                      <Table size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell>Stock útil</TableCell>
                            <TableCell>Cantidad a trasladar</TableCell>
                            <TableCell align="center">Quitar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productosSeleccionados.length > 0 ? (
                            productosSeleccionados.map((item) => (
                              <TableRow key={item.id} hover>
                                <TableCell>{item.ins_descripcion || "-"}</TableCell>
                                <TableCell>{item.stock_util ?? item.stock_bodega ?? 0}</TableCell>
                                <TableCell sx={{ width: 180 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={cantidades[item.id] ?? ""}
                                    onChange={(e) => handleCantidadChange(item, e.target.value)}
                                    sx={fieldSx}
                                    inputProps={{
                                      min: 1,
                                      max: Number(item.stock_util ?? item.stock_bodega ?? 0),
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => handleQuitarProducto(item.id)}
                                    sx={{ ...baseFontSx, fontSize: 11, textTransform: "none" }}
                                  >
                                    Quitar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography sx={{ ...baseFontSx, fontSize: 11.5, color: ui.muted }}>
                                  Todavía no has agregado productos al traslado.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlinedIcon />}
                    onClick={onVolver}
                    sx={{
                      ...baseFontSx,
                      height: 36,
                      borderRadius: 1.5,
                      fontSize: 12,
                      px: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      borderColor: ui.dangerBorder,
                      color: ui.danger,
                      bgcolor: "#fff",
                      "&:hover": {
                        bgcolor: ui.dangerSoft,
                        borderColor: ui.danger,
                      },
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleGuardarClick}
                    sx={{
                      ...baseFontSx,
                      height: 36,
                      borderRadius: 1.5,
                      fontSize: 12,
                      px: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      borderColor: ui.successBorder,
                      color: ui.success,
                      bgcolor: "#fff",
                      "&:hover": {
                        bgcolor: ui.successSoft,
                        borderColor: ui.success,
                      },
                    }}
                  >
                    Guardar
                  </Button>
                </Box>
              </Grid>
            </>
          ) : null}
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default AsignacionesFormularios;
