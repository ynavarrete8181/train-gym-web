import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  MenuItem,
  Grid,
  CircularProgress,
  Paper,
  Box,
  InputLabel,
  TextField,
  Select,
  Typography,
  Chip,
  Alert,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import Swal from "sweetalert2";
import {
  consultarEstados,
  consultarSedes,
  consultarFacultades,
} from "../../../../axios/axios_client";
import axiosClient from "../../../../axios/axios_client";

const parseDetalle = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

const AtencionEgreso = ({ open, onClose, idEgreso }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [egresoData, setEgresoData] = useState(null);

  const [formAtencion, setFormAtencion] = useState({
    observacion: "",
    estado: "",
    select_sede: "",
    select_facultad: "",
    select_bodega: "",
  });

  const [dataEstado, setDataEstado] = useState([]);
  const [dataSede, setDataSede] = useState([]);
  const [dataFacultad, setDataFacultad] = useState([]);
  const [dataBodega, setDataBodega] = useState([]);

  const [loadingFacultades, setLoadingFacultades] = useState(false);
  const [loadingBodega, setLoadingBodega] = useState(false);

  const detalleItems = useMemo(() => parseDetalle(egresoData?.ee_detalle), [egresoData]);

  const totalProductos = useMemo(() => detalleItems.length, [detalleItems]);

  const totalUnidades = useMemo(
    () => detalleItems.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0),
    [detalleItems]
  );

  const bodegaBloqueada = useMemo(() => {
    return Boolean(
      egresoData?.ee_id_bodega ||
      egresoData?.bodega_id ||
      egresoData?.select_bodega ||
      (detalleItems[0]?.idBodega ?? detalleItems[0]?.bod_id)
    );
  }, [egresoData, detalleItems]);

  const estadoSeleccionado = Number(formAtencion.estado || 0);

  const textoAccion = useMemo(() => {
    if (estadoSeleccionado === 5) {
      return "Al guardar en No Asistió, se hará reverso del inventario a la bodega original y se repondrán los lotes usados.";
    }
    if (estadoSeleccionado === 2) {
      return "Al guardar en Atendido, se confirmará el egreso y se descontará inventario si aún no fue descontado.";
    }
    return "Seleccione el estado final de la atención.";
  }, [estadoSeleccionado]);

  const fireSwal = async (options = {}) => {
    const config = {
      target: document.body,
      allowOutsideClick: !saving,
      ...options,
      didOpen: (popup) => {
        const container = popup?.closest(".swal2-container");
        if (container) {
          container.style.zIndex = "20000";
        }

        if (typeof options.didOpen === "function") {
          options.didOpen(popup);
        }
      },
    };

    return Swal.fire(config);
  };

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const data = await consultarSedes();
        const mapData = (Array.isArray(data) ? data : []).map((item) => ({
          value: String(item.id),
          label: item.nombre_sede,
        }));
        setDataSede(mapData);
      } catch {
        setDataSede([]);
      }
    };

    fetchSedes();
  }, []);

  const buscarFacultadSede = async (id_sede) => {
    setLoadingFacultades(true);
    try {
      const data = await consultarFacultades(Number(id_sede));
      setDataFacultad(Array.isArray(data) ? data : []);
    } catch {
      setDataFacultad([]);
    } finally {
      setLoadingFacultades(false);
    }
  };

  const buscarBodega = async (id_sede, id_facultad) => {
    setLoadingBodega(true);
    try {
      const response = await axiosClient.get(`/inventario/bodegas/${Number(id_sede)}/${Number(id_facultad)}`);
      const resp = response?.data;
      const bodegas = Array.isArray(resp) ? resp : resp?.data ?? [];
      setDataBodega(Array.isArray(bodegas) ? bodegas : []);
    } catch {
      setDataBodega([]);
    } finally {
      setLoadingBodega(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const cargar = async () => {
      setLoading(true);
      setEgresoData(null);
      setDataFacultad([]);
      setDataBodega([]);

      try {
        const estados = await consultarEstados();
        const estadosFiltrados = (Array.isArray(estados) ? estados : [])
          .map((item) => ({
            value: Number(item.id),
            label: item.estado,
          }))
          .filter((item) => item.value === 2 || item.value === 5);

        setDataEstado(estadosFiltrados);

        if (!idEgreso) return;

        const response = await axiosClient.get(`/inventario/egresos/${idEgreso}`);
        const resp = response?.data;
        const row = Array.isArray(resp) && resp.length > 0 ? resp[0] : resp || null;

        if (!row) return;

        setEgresoData(row);

        const detalle = parseDetalle(row.ee_detalle);
        const bodegaDetalle = detalle?.[0]?.idBodega ?? detalle?.[0]?.bod_id ?? "";

        const sedeId = String(row.sede_id ?? row.bodega_id_sede ?? detalle?.[0]?.sede_id ?? "");
        const facId = String(
          row.facultad_id ?? row.bodega_id_facultad ?? detalle?.[0]?.facultad_id ?? ""
        );
        const bodId = String(row.ee_id_bodega ?? row.bodega_id ?? bodegaDetalle ?? "");

        setFormAtencion({
          observacion: row.ee_observacion || "",
          estado: "",
          select_sede: sedeId,
          select_facultad: facId,
          select_bodega: bodId,
        });

        if (sedeId) await buscarFacultadSede(sedeId);
        if (sedeId && facId) await buscarBodega(sedeId, facId);
      } catch {
        setFormAtencion({
          observacion: "",
          estado: "",
          select_sede: "",
          select_facultad: "",
          select_bodega: "",
        });
        setEgresoData(null);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [open, idEgreso]);

  const handleGuardarAtencionEgreso = async () => {
    if (!formAtencion.estado) {
      await fireSwal("Validación", "Debe seleccionar el estado de la atención.", "warning");
      return;
    }

    if (!formAtencion.select_bodega) {
      await fireSwal("Validación", "Debe existir una bodega asociada al egreso.", "warning");
      return;
    }

    const accion =
      Number(formAtencion.estado) === 5
        ? "marcar como No Asistió y revertir inventario"
        : "marcar como Atendido y confirmar egreso";

    const confirm = await fireSwal({
      icon: "question",
      title: "Confirmar acción",
      text: `Se va a ${accion}. ¿Desea continuar?`,
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#144985",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);

    try {
      const { data: response } = await axiosClient.post("/inventario/egresos/atencion", {
        idEgreso,
        observacion: formAtencion.observacion,
        estado: Number(formAtencion.estado),
        select_bodega: Number(formAtencion.select_bodega),
      });

      await fireSwal({
        icon: "success",
        title: "Atención guardada",
        text: response?.message || "El egreso fue procesado correctamente.",
        confirmButtonColor: "#144985",
      });

      onClose();
    } catch (error) {
      await fireSwal({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "No se pudo guardar la atención. Intenta nuevamente.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          backgroundColor: "#e6ebf2",
          fontWeight: "bold",
          color: "#1f3a5f",
          fontSize: "1rem",
        }}
      >
        Atención del Egreso # {idEgreso}
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: "#fafbfd", minHeight: "240px", pt: 2 }}>
        {loading ? (
          <Grid container justifyContent="center" alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Grid>
        ) : (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e9eef5" }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity={estadoSeleccionado === 5 ? "warning" : "info"} sx={{ borderRadius: 2 }}>
                  {textoAccion}
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e9eef5",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonOutlineOutlinedIcon color="primary" />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Paciente</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {safeStr(egresoData?.nombre_paciente || "No disponible")}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocalHospitalOutlinedIcon color="primary" />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Médico</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {safeStr(egresoData?.nombre_funcionario || "No disponible")}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WarehouseOutlinedIcon color="primary" />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Bodega</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {safeStr(egresoData?.sede_nombre || "")}
                            {egresoData?.sede_nombre ? " - " : ""}
                            {safeStr(
                              egresoData?.bodega_nombre ||
                              dataBodega.find(
                                (b) => String(b.bod_id) === String(formAtencion.select_bodega)
                              )?.bod_nombre ||
                              "No disponible"
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Inventory2OutlinedIcon color="primary" />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Detalle</Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                            <Chip
                              size="small"
                              label={`${totalProductos} producto(s)`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`${totalUnidades} unidad(es)`}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {!bodegaBloqueada && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ fontWeight: 700, color: "#1f3a5f", mb: 1 }}>
                    Ubicación de bodega
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="sede-label">Sede</InputLabel>
                        <Select
                          labelId="sede-label"
                          label="Sede"
                          value={formAtencion.select_sede}
                          onChange={async (e) => {
                            const id_sede = e.target.value;

                            setFormAtencion((prev) => ({
                              ...prev,
                              select_sede: id_sede,
                              select_facultad: "",
                              select_bodega: "",
                            }));

                            setDataFacultad([]);
                            setDataBodega([]);

                            if (id_sede) await buscarFacultadSede(id_sede);
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccione Sede</em>
                          </MenuItem>
                          {dataSede.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        size="small"
                        fullWidth
                        disabled={!formAtencion.select_sede || loadingFacultades}
                      >
                        <InputLabel id="fac-label">Facultad</InputLabel>
                        <Select
                          labelId="fac-label"
                          label="Facultad"
                          value={formAtencion.select_facultad}
                          onChange={async (e) => {
                            const id_fac = e.target.value;

                            setFormAtencion((prev) => ({
                              ...prev,
                              select_facultad: id_fac,
                              select_bodega: "",
                            }));

                            setDataBodega([]);

                            if (formAtencion.select_sede && id_fac) {
                              await buscarBodega(formAtencion.select_sede, id_fac);
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>{loadingFacultades ? "Cargando..." : "Seleccione Facultad"}</em>
                          </MenuItem>
                          {dataFacultad.map((f) => (
                            <MenuItem key={f.id} value={String(f.id)}>
                              {f.fac_nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        size="small"
                        fullWidth
                        disabled={!formAtencion.select_facultad || loadingBodega}
                      >
                        <InputLabel id="bod-label">Bodega</InputLabel>
                        <Select
                          labelId="bod-label"
                          label="Bodega"
                          value={formAtencion.select_bodega}
                          onChange={(e) =>
                            setFormAtencion((prev) => ({
                              ...prev,
                              select_bodega: e.target.value,
                            }))
                          }
                        >
                          {dataBodega.length === 0 ? (
                            <MenuItem value="">
                              <em>{loadingBodega ? "Cargando..." : "Sin bodegas disponibles"}</em>
                            </MenuItem>
                          ) : (
                            [
                              <MenuItem key="sel" value="">
                                <em>Seleccione Bodega</em>
                              </MenuItem>,
                              ...dataBodega.map((b) => (
                                <MenuItem key={b.bod_id} value={String(b.bod_id)}>
                                  {b.bod_nombre}
                                </MenuItem>
                              )),
                            ]
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    label="Estado"
                    value={formAtencion.estado}
                    onChange={(e) =>
                      setFormAtencion((prev) => ({
                        ...prev,
                        estado: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">
                      <em>Seleccione Estado</em>
                    </MenuItem>

                    {dataEstado.map((item) => (
                      <MenuItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  multiline
                  fullWidth
                  minRows={5}
                  value={formAtencion.observacion}
                  onChange={(e) =>
                    setFormAtencion((prev) => ({
                      ...prev,
                      observacion: e.target.value,
                    }))
                  }
                  placeholder="Escriba una observación de la atención..."
                />
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ backgroundColor: "#f5f5f5" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          startIcon={<CloseIcon />}
          sx={{ fontWeight: "bold" }}
          disabled={saving}
        >
          Cerrar
        </Button>

        <Button
          onClick={handleGuardarAtencionEgreso}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          variant="outlined"
          color="success"
          disabled={loading || saving}
          sx={{
            fontWeight: "bold",
            borderColor: "#2e7d32",
            color: "#2e7d32",
            backgroundColor: "#ffffff",
            "&:hover": {
              backgroundColor: "rgba(46, 125, 50, 0.1)",
              borderColor: "#2e7d32",
            },
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AtencionEgreso;
