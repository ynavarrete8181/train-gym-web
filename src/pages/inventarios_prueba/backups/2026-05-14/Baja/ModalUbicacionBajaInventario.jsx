import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Paper,
  Box,
  FormControl,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";

import Swal from "sweetalert2";
import axiosClient from "../../../../axios/axios_client";

const createInitialForm = () => ({
  select_sede: "",
  select_facultad: "",
  select_bodega: "",
});

const inputSx = {
  fontSize: "12px",
  "& .MuiSelect-select": {
    fontSize: "12px",
  },
};

const ModalUbicacionInventario = ({
  open,
  onClose,
  onConfirm,
  initialValues = null,
  title = "Seleccionar ubicación",
  subtitle = "Seleccione sede, facultad y bodega",
  confirmText = "Continuar",
  cancelText = "Cerrar",
  maxWidth = "lg",
}) => {
  const [formData, setFormData] = useState(createInitialForm());

  const [dataSede, setDataSede] = useState([]);
  const [dataFacultad, setDataFacultad] = useState([]);
  const [dataBodega, setDataBodega] = useState([]);

  const [loadingSedes, setLoadingSedes] = useState(false);
  const [loadingFacultades, setLoadingFacultades] = useState(false);
  const [loadingBodegas, setLoadingBodegas] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const openSwalOverDialog = (options = {}) =>
    Swal.fire({
      ...options,
      heightAuto: false,
      didOpen: (popup) => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "2500";
        }
        if (typeof options.didOpen === "function") {
          options.didOpen(popup);
        }
      },
    });

  const sedeLabel = useMemo(() => {
    return (
      dataSede.find((s) => String(s.value) === String(formData.select_sede))?.label ||
      ""
    );
  }, [dataSede, formData.select_sede]);

  const facultadLabel = useMemo(() => {
    return (
      dataFacultad.find((f) => String(f.id) === String(formData.select_facultad))
        ?.fac_nombre || ""
    );
  }, [dataFacultad, formData.select_facultad]);

  const bodegaLabel = useMemo(() => {
    return (
      dataBodega.find((b) => String(b.bod_id) === String(formData.select_bodega))
        ?.bod_nombre || ""
    );
  }, [dataBodega, formData.select_bodega]);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setDataFacultad([]);
    setDataBodega([]);
    setFormData({
      select_sede: initialValues?.select_sede
        ? String(initialValues.select_sede)
        : "",
      select_facultad: initialValues?.select_facultad
        ? String(initialValues.select_facultad)
        : "",
      select_bodega: initialValues?.select_bodega
        ? String(initialValues.select_bodega)
        : "",
    });

    fetchDataSede();
  }, [open, initialValues]);

  useEffect(() => {
    if (!open) return;
    if (!formData.select_sede) {
      setDataFacultad([]);
      setDataBodega([]);
      return;
    }
    buscarFacultadSede(formData.select_sede);
  }, [open, formData.select_sede]);

  useEffect(() => {
    if (!open) return;
    if (!formData.select_sede || !formData.select_facultad) {
      setDataBodega([]);
      return;
    }
    buscarBodega(formData.select_sede, formData.select_facultad);
  }, [open, formData.select_sede, formData.select_facultad]);

  const fetchDataSede = async () => {
    setLoadingSedes(true);
    try {
      const response = await axiosClient.get("/consultar-sedes");
      const payload = response?.data?.data ?? response?.data ?? [];
      const mapData = (Array.isArray(payload) ? payload : []).map((item) => ({
        value: Number(item.id),
        label: item.nombre_sede,
      }));
      setDataSede(mapData);
    } catch {
      setDataSede([]);
      openSwalOverDialog({
        title: "¡Error!",
        text: "Error al cargar las sedes.",
        icon: "error",
      });
    } finally {
      setLoadingSedes(false);
    }
  };

  const buscarFacultadSede = async (idSede) => {
    if (!idSede) return;
    setLoadingFacultades(true);
    try {
      const response = await axiosClient.get(`/consultar-facultades-sede/${idSede}`);
      const payload = response?.data?.data ?? response?.data ?? [];
      setDataFacultad(Array.isArray(payload) ? payload : []);
    } catch {
      setDataFacultad([]);
      openSwalOverDialog({
        title: "¡Error!",
        text: "Error al cargar las facultades.",
        icon: "error",
      });
    } finally {
      setLoadingFacultades(false);
    }
  };

  const buscarBodega = async (idSede, idFacultad) => {
    if (!idSede || !idFacultad) return;
    setLoadingBodegas(true);
    try {
      const response = await axiosClient.get(`/consultar-bodega/${idSede}/${idFacultad}`);
      const payload = response?.data?.data ?? response?.data ?? [];
      setDataBodega(Array.isArray(payload) ? payload : []);
    } catch {
      setDataBodega([]);
      openSwalOverDialog({
        title: "¡Error!",
        text: "Error al cargar las bodegas.",
        icon: "error",
      });
    } finally {
      setLoadingBodegas(false);
    }
  };

  const clearError = (key) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleChangeField = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[key]) clearError(key);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.select_sede) newErrors.select_sede = "Debe seleccionar una sede.";
    if (!formData.select_facultad) newErrors.select_facultad = "Debe seleccionar una facultad / dirección.";
    if (!formData.select_bodega) newErrors.select_bodega = "Debe seleccionar una bodega.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        select_sede: formData.select_sede,
        select_facultad: formData.select_facultad,
        select_bodega: formData.select_bodega,
        sede_label: sedeLabel,
        facultad_label: facultadLabel,
        bodega_label: bodegaLabel,
      };

      if (typeof onConfirm === "function") {
        await onConfirm(payload);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          overflow: "visible",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#0a2442",
          color: "white",
          fontWeight: "bold",
          fontSize: 12,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: "#fafbfd", minHeight: "200px" }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#1f3a5f", fontWeight: 700 }}>
              {subtitle}
            </Typography>
          </Box>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ApartmentOutlinedIcon sx={{ color: "#144985", fontSize: 18 }} />
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#667085" }}>
                      Sede seleccionada
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#1f3a5f" }}>
                      {sedeLabel || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BusinessOutlinedIcon sx={{ color: "#144985", fontSize: 18 }} />
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#667085" }}>
                      Facultad seleccionada
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#1f3a5f" }}>
                      {facultadLabel || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarehouseOutlinedIcon sx={{ color: "#144985", fontSize: 18 }} />
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#667085" }}>
                      Bodega seleccionada
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#1f3a5f" }}>
                      {bodegaLabel || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e6ebf2",
              borderRadius: 2,
              backgroundColor: "#fff",
              position: "relative",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                position: "absolute",
                top: -12,
                left: 20,
                bgcolor: "#fff",
                px: 1.5,
                fontWeight: "bold",
                color: "#144985",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              Ubicación
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl
                  size="small"
                  fullWidth
                  error={Boolean(errors.select_sede)}
                  disabled={loadingSedes}
                >
                  <Select
                    value={formData.select_sede}
                    onChange={(e) => {
                      const idSede = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        select_sede: idSede,
                        select_facultad: "",
                        select_bodega: "",
                      }));
                      setDataFacultad([]);
                      setDataBodega([]);
                      clearError("select_sede");
                    }}
                    displayEmpty
                    renderValue={(v) =>
                      !v ? (
                        <em>{loadingSedes ? "Cargando sedes..." : "Seleccione Sede"}</em>
                      ) : (
                        dataSede.find((s) => String(s.value) === String(v))?.label ?? v
                      )
                    }
                    sx={inputSx}
                  >
                    <MenuItem value="">
                      <em>Seleccione Sede</em>
                    </MenuItem>
                    {dataSede.map((s) => (
                      <MenuItem key={s.value} value={String(s.value)}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.select_sede && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.select_sede}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  size="small"
                  fullWidth
                  disabled={!formData.select_sede || loadingFacultades}
                  error={Boolean(errors.select_facultad)}
                >
                  <Select
                    value={formData.select_facultad}
                    onChange={(e) => {
                      const idFac = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        select_facultad: idFac,
                        select_bodega: "",
                      }));
                      setDataBodega([]);
                      clearError("select_facultad");
                    }}
                    displayEmpty
                    renderValue={(v) =>
                      !v ? (
                        <em>
                          {loadingFacultades ? "Cargando facultades..." : "Seleccione Facultad"}
                        </em>
                      ) : (
                        dataFacultad.find((f) => String(f.id) === String(v))?.fac_nombre ?? v
                      )
                    }
                    sx={inputSx}
                  >
                    <MenuItem value="">
                      <em>Seleccione Facultad</em>
                    </MenuItem>
                    {dataFacultad.map((f) => (
                      <MenuItem key={f.id} value={String(f.id)}>
                        {f.fac_nombre}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.select_facultad && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.select_facultad}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  size="small"
                  fullWidth
                  disabled={!formData.select_facultad || loadingBodegas}
                  error={Boolean(errors.select_bodega)}
                >
                  <Select
                    value={formData.select_bodega}
                    onChange={(e) => handleChangeField("select_bodega", e.target.value)}
                    displayEmpty
                    renderValue={(v) => {
                      if (!v) {
                        if (loadingBodegas) return <em>Cargando bodegas...</em>;
                        if ((dataBodega?.length ?? 0) === 0) return <em>Sin bodegas disponibles</em>;
                        return <em>Seleccione Bodega</em>;
                      }

                      return dataBodega.find((b) => String(b.bod_id) === String(v))?.bod_nombre ?? v;
                    }}
                    sx={inputSx}
                  >
                    {dataBodega.length === 0 ? (
                      <MenuItem value="">
                        <em>Sin bodegas disponibles</em>
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

                  {errors.select_bodega && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.select_bodega}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                flexDirection: { xs: "column", md: "row" },
                gap: 1,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1f3a5f" }}>
                  Resumen actual
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#667085" }}>
                  Sede: {sedeLabel || "-"} | Facultad: {facultadLabel || "-"} | Bodega: {bodegaLabel || "-"}
                </Typography>
              </Box>

              {(loadingSedes || loadingFacultades || loadingBodegas) && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: 11, color: "#667085" }}>
                    Cargando información...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: "#f5f5f5", px: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          sx={{ fontSize: "12px" }}
          startIcon={<CloseIcon />}
        >
          {cancelText}
        </Button>

        <Button
          disabled={saving}
          onClick={handleConfirm}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          variant="contained"
          sx={{
            borderRadius: 2,
            minWidth: 140,
            backgroundColor: "#fff",
            color: "#144985",
            border: "1px solid #144985",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "rgba(20, 73, 133, 0.08)",
              boxShadow: "0 2px 6px rgba(20, 73, 133, 0.2)",
            },
            fontSize: "12px",
          }}
        >
          {saving ? "Procesando..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalUbicacionInventario;