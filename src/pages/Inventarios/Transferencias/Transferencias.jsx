import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Swal from "sweetalert2";
import dayjs from "dayjs";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../../modules/personas/personas.utils";

const emptyForm = {
  producto_id: "",
  sede_origen_id: "",
  sede_destino_id: "",
  lote_id: "",
  cantidad: "",
  motivo: "TRANSFERENCIA_INTERNA",
  observacion: "",
};

const transferMotivos = [
  { value: "TRANSFERENCIA_INTERNA", label: "Transferencia interna" },
  { value: "ABASTECIMIENTO", label: "Abastecimiento entre sedes" },
  { value: "REUBICACION", label: "Reubicación de stock" },
];

const formatQty = (value) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString("es-EC", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

function ModalTransferenciaInventario({
  open,
  onClose,
  productos,
  sedes,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        sede_origen_id: sedes[0]?.id ? String(sedes[0].id) : "",
        sede_destino_id: sedes[1]?.id ? String(sedes[1].id) : "",
      });
      setErrors({});
    }
  }, [open, sedes]);

  const producto = useMemo(
    () => productos.find((item) => String(item.id) === String(form.producto_id)) || null,
    [productos, form.producto_id]
  );

  const lotesDisponibles = useMemo(() => {
    if (!producto?.lotes?.length || !form.sede_origen_id) return [];
    return producto.lotes.filter((lote) => String(lote.sede_id) === String(form.sede_origen_id));
  }, [producto, form.sede_origen_id]);

  const stockOrigen = useMemo(() => {
    if (!producto?.stocks?.length || !form.sede_origen_id) return null;
    return producto.stocks.find((item) => String(item.sede_id) === String(form.sede_origen_id)) || null;
  }, [producto, form.sede_origen_id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "producto_id" || field === "sede_origen_id" ? { lote_id: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.producto_id) nextErrors.producto_id = "Seleccione un producto";
    if (!form.sede_origen_id) nextErrors.sede_origen_id = "Seleccione sede origen";
    if (!form.sede_destino_id) nextErrors.sede_destino_id = "Seleccione sede destino";
    if (form.sede_origen_id && form.sede_destino_id && form.sede_origen_id === form.sede_destino_id) {
      nextErrors.sede_destino_id = "La sede destino debe ser distinta";
    }
    if (!form.cantidad || Number(form.cantidad) <= 0) nextErrors.cantidad = "Cantidad inválida";
    if (producto?.maneja_lotes && !form.lote_id) nextErrors.lote_id = "Seleccione un lote";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      producto_id: Number(form.producto_id),
      sede_origen_id: Number(form.sede_origen_id),
      sede_destino_id: Number(form.sede_destino_id),
      lote_id: form.lote_id ? Number(form.lote_id) : null,
      cantidad: Number(form.cantidad),
      motivo: form.motivo,
      observacion: form.observacion || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>Nueva transferencia</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          <FormControl size="small" error={!!errors.producto_id}>
            <InputLabel>Producto</InputLabel>
            <Select label="Producto" value={form.producto_id} onChange={(e) => handleChange("producto_id", e.target.value)} sx={filterInputSx}>
              {productos.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.nombre} · {item.codigo || "S/C"}
                </MenuItem>
              ))}
            </Select>
            {errors.producto_id ? <FormHelperText>{errors.producto_id}</FormHelperText> : null}
          </FormControl>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl size="small" fullWidth error={!!errors.sede_origen_id}>
              <InputLabel>Sede origen</InputLabel>
              <Select label="Sede origen" value={form.sede_origen_id} onChange={(e) => handleChange("sede_origen_id", e.target.value)} sx={filterInputSx}>
                {sedes.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                ))}
              </Select>
              {errors.sede_origen_id ? <FormHelperText>{errors.sede_origen_id}</FormHelperText> : null}
            </FormControl>

            <FormControl size="small" fullWidth error={!!errors.sede_destino_id}>
              <InputLabel>Sede destino</InputLabel>
              <Select label="Sede destino" value={form.sede_destino_id} onChange={(e) => handleChange("sede_destino_id", e.target.value)} sx={filterInputSx}>
                {sedes.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                ))}
              </Select>
              {errors.sede_destino_id ? <FormHelperText>{errors.sede_destino_id}</FormHelperText> : null}
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              size="small"
              label="Cantidad"
              type="number"
              value={form.cantidad}
              onChange={(e) => handleChange("cantidad", e.target.value)}
              sx={{ ...filterInputSx, flex: 1 }}
              error={!!errors.cantidad}
              helperText={errors.cantidad}
            />

            <FormControl size="small" fullWidth sx={{ flex: 1 }}>
              <InputLabel>Motivo</InputLabel>
              <Select label="Motivo" value={form.motivo} onChange={(e) => handleChange("motivo", e.target.value)} sx={filterInputSx}>
                {transferMotivos.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {producto?.maneja_lotes ? (
            <FormControl size="small" error={!!errors.lote_id}>
              <InputLabel>Lote origen</InputLabel>
              <Select label="Lote origen" value={form.lote_id} onChange={(e) => handleChange("lote_id", e.target.value)} sx={filterInputSx}>
                {lotesDisponibles.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.codigo_lote} · stock {formatQty(item.cantidad ?? item.stock_actual)}
                  </MenuItem>
                ))}
              </Select>
              {errors.lote_id ? <FormHelperText>{errors.lote_id}</FormHelperText> : null}
            </FormControl>
          ) : null}

          <TextField
            size="small"
            label="Observación"
            value={form.observacion}
            onChange={(e) => handleChange("observacion", e.target.value)}
            sx={filterInputSx}
          />

          {producto ? (
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 2 }}>
              <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>{producto.nombre}</Typography>
              <Typography sx={{ mt: 0.4, fontSize: 12, color: "#64748b" }}>
                Stock origen: {formatQty(stockOrigen?.stock_actual || 0)} {producto.unidad_medida || "und"}
              </Typography>
            </Paper>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <PremiumButton variant="cancelar" onClick={onClose}>Cancelar</PremiumButton>
        <PremiumButton variant="guardar" onClick={handleSubmit} loading={loading}>Guardar</PremiumButton>
      </DialogActions>
    </Dialog>
  );
}

export default function TransferenciasInventario() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes, sedesRes] = await Promise.all([
        apiClient.get("/inventario/movimientos", { params: { limit: 300 } }),
        apiClient.get("/inventario/productos"),
        apiClient.get("/inventario/sedes"),
      ]);

      const movimientos = Array.isArray(movRes.data) ? movRes.data : [];
      const grouped = new Map();

      movimientos
        .filter((item) => ["TRANSFERENCIA_ENTRADA", "TRANSFERENCIA_SALIDA"].includes(item.tipo_movimiento))
        .forEach((item) => {
          const key = `${item.referencia_tipo || "TRANSFERENCIA"}-${item.referencia_id || item.id}`;
          if (!grouped.has(key)) {
            grouped.set(key, {
              key,
              referencia_id: item.referencia_id || item.id,
              producto_nombre: item.producto_nombre,
              producto_codigo: item.producto_codigo,
              motivo: item.motivo,
              created_at: item.created_at,
              origen: null,
              destino: null,
              cantidad: Number(item.cantidad || 0),
              observacion: item.observacion || "",
            });
          }

          const current = grouped.get(key);
          if (item.tipo_movimiento === "TRANSFERENCIA_SALIDA") {
            current.origen = item.sede_nombre;
            current.cantidad = Number(item.cantidad || current.cantidad || 0);
          }
          if (item.tipo_movimiento === "TRANSFERENCIA_ENTRADA") {
            current.destino = item.sede_nombre;
          }
        });

      setRows(
        Array.from(grouped.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSedes(Array.isArray(sedesRes.data) ? sedesRes.data : []);
    } catch (error) {
      Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar las transferencias."), "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (!lower) return true;
      return [
        item.producto_nombre,
        item.producto_codigo,
        item.origen,
        item.destino,
        item.motivo,
        item.observacion,
        item.referencia_id,
      ].filter(Boolean).join(" ").toLowerCase().includes(lower);
    });
  }, [rows, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      await apiClient.post("/inventario/movimientos/transferencia", payload);
      Swal.fire("Éxito", "Transferencia registrada correctamente.", "success");
      setOpenModal(false);
      await fetchData();
    } catch (error) {
      Swal.fire("Error", getApiErrorMessage(error, "No se pudo registrar la transferencia."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  bgcolor: "rgba(59,130,246,0.10)",
                  border: "1px solid rgba(59,130,246,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1d4ed8",
                }}
              >
                <SyncAltOutlinedIcon />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                  Transferencias entre Sedes
                </Typography>
                <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                  Controla traslados internos enlazando salida en origen y entrada en destino.
                </Typography>
              </Box>
            </Stack>

            <Chip label={`${filtered.length} TRANSFERENCIAS`} sx={semanticChipSx("inventory")} />
          </Paper>

          <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
              <TextField
                size="small"
                placeholder="Buscar producto, sedes o referencia..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                sx={{ ...filterInputSx, minWidth: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ ...filterInputSx, width: 80 }}>
                <Select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                  {[5, 10, 25, 50].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>

              <Box sx={{ flex: 1 }} />

              <PremiumButton variant="anadir" onClick={() => setOpenModal(true)}>
                Nueva Transferencia
              </PremiumButton>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Referencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                          Cargando transferencias...
                        </TableCell>
                      </TableRow>
                    ) : paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                          No hay transferencias registradas todavía.
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{dayjs(row.created_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>{row.producto_nombre}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>{row.producto_codigo || "S/C"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={row.origen || "Origen"} sx={semanticChipSx("danger")} />
                            <SwapHorizOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
                            <Chip label={row.destino || "Destino"} sx={semanticChipSx("success")} />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQty(row.cantidad)}</TableCell>
                        <TableCell>{row.motivo}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>TR-{row.referencia_id}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>{row.observacion || "Sin observación"}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={Math.min(page, totalPages)}
                  onChange={(event, value) => setPage(value)}
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Box>
          </Paper>
        </Stack>
      </Box>

      <ModalTransferenciaInventario
        open={openModal}
        onClose={() => setOpenModal(false)}
        productos={productos}
        sedes={sedes}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </Box>
  );
}
