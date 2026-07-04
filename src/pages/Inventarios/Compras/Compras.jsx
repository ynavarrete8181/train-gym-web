import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  InputAdornment,
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
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import ModalIngresoInventario from "../Entradas/components/ModalIngresoInventario";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../../../modules/personas/personas.utils";

const money = (value) =>
  Number(value || 0).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseObservacion = (observacion = "") => {
  const provMatch = observacion.match(/Prov\/Origen:\s([^|]+)/);
  const docMatch = observacion.match(/Doc:\s([^|]+)/);
  const totalMatch = observacion.match(/Total:\s\$([\d,.]+)/);

  return {
    proveedor: provMatch ? provMatch[1].trim() : "N/A",
    documento: docMatch ? docMatch[1].trim() : "-",
    total: totalMatch ? totalMatch[1].trim() : "0.00",
  };
};

export default function ComprasInventario() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState("");
  const [filtroSede, setFiltroSede] = useState("0");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes, sedesRes, provRes] = await Promise.all([
        apiClient.get("/inventario/movimientos", { params: { tipo_movimiento: "ENTRADA", limit: 300 } }),
        apiClient.get("/inventario/productos"),
        apiClient.get("/inventario/sedes"),
        apiClient.get("/inventario/proveedores"),
      ]);

      const movimientos = Array.isArray(movRes.data) ? movRes.data.filter((item) => item.tipo_movimiento === "ENTRADA") : [];
      const groups = {};

      movimientos.forEach((item) => {
        const timeKey = dayjs(item.created_at).format("YYYY-MM-DD HH:mm");
        const key = `${item.sede_id}_${item.observacion || "sin_obs"}_${timeKey}`;

        if (!groups[key]) {
          const info = parseObservacion(item.observacion || "");
          groups[key] = {
            id: key,
            created_at: item.created_at,
            sede_id: item.sede_id,
            sede_nombre: item.sede_nombre,
            proveedor: info.proveedor,
            documento: info.documento,
            total_estimado: info.total,
            observacion: item.observacion || "",
            items: [],
          };
        }

        groups[key].items.push(item);
      });

      setRows(Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSedes(Array.isArray(sedesRes.data) ? sedesRes.data : []);
      setProveedores(Array.isArray(provRes.data) ? provRes.data : []);
    } catch (error) {
      Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar las compras."), "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filtroSede, rowsPerPage]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = !lower || [
        row.proveedor,
        row.documento,
        row.sede_nombre,
        row.observacion,
        ...row.items.map((item) => `${item.producto_nombre || ""} ${item.producto_codigo || ""}`),
      ].join(" ").toLowerCase().includes(lower);

      const matchesSede = filtroSede === "0" || String(row.sede_id) === filtroSede;
      return matchesSearch && matchesSede;
    });
  }, [rows, search, filtroSede]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const resumen = useMemo(() => {
    return filtered.reduce((acc, row) => {
      acc.comprobantes += 1;
      acc.items += row.items.length;
      acc.total += Number(String(row.total_estimado || "0").replace(/,/g, ""));
      return acc;
    }, { comprobantes: 0, items: 0, total: 0 });
  }, [filtered]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      for (const item of payload.items || []) {
        await apiClient.post("/inventario/movimientos/entrada", item);
      }

      Swal.fire("Éxito", "Compra registrada correctamente.", "success");
      setOpenModal(false);
      await fetchData();
    } catch (error) {
      Swal.fire("Error", getApiErrorMessage(error, "No se pudo registrar la compra."), "error");
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
                  bgcolor: "rgba(245,158,11,0.10)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#b45309",
                }}
              >
                <ReceiptLongOutlinedIcon />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                  Compras e Ingresos
                </Typography>
                <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                  Control documental de comprobantes de compra y su impacto directo en el stock.
                </Typography>
              </Box>
            </Stack>

            <Chip label={`${filtered.length} COMPROBANTES`} sx={semanticChipSx("mustard")} />
          </Paper>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Comprobantes</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.comprobantes}</Typography>
                </Box>
                <ReceiptLongOutlinedIcon sx={{ color: "#b45309" }} />
              </Stack>
            </Paper>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Ítems ingresados</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.items}</Typography>
                </Box>
                <Inventory2OutlinedIcon sx={{ color: "#0f172a" }} />
              </Stack>
            </Paper>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Total estimado</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 950, color: "#0f172a" }}>${money(resumen.total)}</Typography>
                </Box>
                <RequestQuoteOutlinedIcon sx={{ color: "#2e7d32" }} />
              </Stack>
            </Paper>
          </Stack>

          <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
              <TextField
                size="small"
                placeholder="Buscar proveedor, documento o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ ...filterInputSx, minWidth: 320 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                size="small"
                sx={{ ...filterInputSx, width: 180 }}
              >
                <MenuItem value="0">Todas las sedes</MenuItem>
                {sedes.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>
                ))}
              </Select>

              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                size="small"
                sx={{ ...filterInputSx, width: 80 }}
              >
                {[5, 10, 25, 50].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>

              <Box sx={{ flex: 1 }} />

              <PremiumButton variant="anadir" onClick={() => setOpenModal(true)}>
                Nuevo Comprobante
              </PremiumButton>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Sede</TableCell>
                      <TableCell align="center">Ítems</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                          Cargando compras...
                        </TableCell>
                      </TableRow>
                    ) : paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                          No hay compras registradas todavía.
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>{dayjs(row.created_at).format("DD/MM/YYYY")}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>{dayjs(row.created_at).format("HH:mm")}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>{row.proveedor}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>{row.observacion || "Sin observación"}</Typography>
                        </TableCell>
                        <TableCell>{row.documento}</TableCell>
                        <TableCell>
                          <Chip label={row.sede_nombre || "Sin sede"} sx={semanticChipSx("inventory")} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${row.items.length} ítems`} sx={semanticChipSx("neutral")} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>${row.total_estimado}</Typography>
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

      {openModal ? (
        <ModalIngresoInventario
          open={openModal}
          onClose={() => setOpenModal(false)}
          productos={productos}
          sedes={sedes}
          proveedores={proveedores}
          onSubmit={handleSubmit}
          loading={saving}
        />
      ) : null}
    </Box>
  );
}
