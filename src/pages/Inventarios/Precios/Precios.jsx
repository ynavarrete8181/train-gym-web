import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PriceCheckOutlinedIcon from "@mui/icons-material/PriceCheckOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import Swal from "sweetalert2";

import { apiClient } from "../../../services/apiClient";
import { exportarExcel } from "../Productos/components/utils/exportaciones";
import ModalPreciosProducto from "../Productos/components/ModalPreciosProducto";
import PremiumButton from "../../../components/ui/PremiumButton";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import {
  inventoryHeaderPaperSx,
  inventoryIconBadgeSx,
  inventoryPagePaperSx,
  inventoryPageShellSx,
  inventoryResultChipSx,
  inventoryUi,
} from "../components/inventoryDbanuTheme";

const estados = [
  { value: "all", label: "Todos" },
  { value: "1", label: "Activos" },
  { value: "0", label: "Inactivos" },
];

const normalizeProducto = (item = {}) => ({
  ...item,
  id: item.id ?? item.pro_id,
  codigo: item.codigo ?? item.pro_codigo ?? item.sku ?? "",
  nombre: item.nombre ?? item.pro_descripcion ?? item.descripcion ?? "",
  categoria_id: item.categoria_id ?? item.pro_tipo ?? item.id_tipo ?? "",
  categoria_nombre:
    item.categoria_nombre ??
    item.tipo_insumo ??
    item.categoria ??
    item.descripcion_categoria ??
    "",
  marca: item.marca ?? "",
  unidad_medida: item.unidad_medida ?? item.pro_unidad_medida ?? "und",
  estado: String(item.estado ?? item.pro_estado ?? item.id_estado ?? 1) === "0" ? "0" : "1",
  precio_costo: Number(item.precio_costo ?? item.costo ?? 0),
  precio_venta: Number(item.precio_venta ?? item.precio ?? item.valor ?? 0),
});

const normalizeCategoria = (item = {}) => ({
  id: item.id ?? item.value ?? item.ca_id,
  nombre: item.nombre ?? item.label ?? item.ca_descripcion ?? "Sin categoría",
});

const toNumber = (value) => {
  const number = Number(value || 0);
  return Number.isNaN(number) ? 0 : number;
};

const formatMoney = (value) =>
  toNumber(value).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const todayIso = () => new Date().toISOString().slice(0, 10);

const isPriceActive = (price) => {
  if (Number(price?.estado) !== 1) return false;

  const today = todayIso();
  const start = String(price?.vigencia_inicio || today).slice(0, 10);
  const end = price?.vigencia_fin ? String(price.vigencia_fin).slice(0, 10) : null;

  if (start > today) return false;
  if (end && end < today) return false;

  return true;
};

const pickPreferredPrice = (prices = []) => {
  const active = prices.filter(isPriceActive);
  return (
    active.find((item) => item.tipo_precio === "PROMOCION") ||
    active.find((item) => item.tipo_precio === "VENTA") ||
    active.find((item) => item.tipo_precio === "SOCIO") ||
    active.find((item) => item.tipo_precio === "COSTO") ||
    null
  );
};

const buildPriceSummary = (prices = [], fallbackProduct) => {
  const active = prices.filter(isPriceActive);
  const preferred = pickPreferredPrice(prices);
  const promoCount = active.filter((item) => item.tipo_precio === "PROMOCION").length;

  return {
    total: prices.length,
    active: active.length,
    promos: promoCount,
    preferredType: preferred?.tipo_precio || (toNumber(fallbackProduct?.precio_venta) > 0 ? "VENTA" : null),
    preferredLabel: preferred?.tipo_precio_nombre || (toNumber(fallbackProduct?.precio_venta) > 0 ? "Venta base" : "Sin precio"),
    preferredAmount: preferred ? toNumber(preferred.monto) : toNumber(fallbackProduct?.precio_venta),
  };
};

export default function PreciosProductos() {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [priceCache, setPriceCache] = useState({});
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("0");
  const [filtroEstado, setFiltroEstado] = useState("1");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProductoId, setSelectedProductoId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [resProd, resCat, resSedes] = await Promise.all([
        apiClient.get("/inventario/productos"),
        apiClient.get("/inventario/categorias-producto"),
        apiClient.get("/inventario/sedes"),
      ]);

      setProductos((Array.isArray(resProd.data) ? resProd.data : []).map(normalizeProducto));
      setCategorias((Array.isArray(resCat.data) ? resCat.data : []).map(normalizeCategoria));
      setSedes(Array.isArray(resSedes.data) ? resSedes.data : []);
    } catch (error) {
      setProductos([]);
      setCategorias([]);
      setSedes([]);
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar el catálogo de precios.",
        icon: "error",
        confirmButtonColor: inventoryUi.black,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filtroCategoria, filtroEstado, rowsPerPage]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();

    return productos.filter((producto) => {
      const searchable = [
        producto.nombre,
        producto.codigo,
        producto.marca,
        producto.categoria_nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !lower || searchable.includes(lower);
      const matchesCat =
        filtroCategoria === "0" || String(producto.categoria_id) === String(filtroCategoria);
      const matchesEstado =
        filtroEstado === "all" || String(producto.estado) === String(filtroEstado);

      return matchesSearch && matchesCat && matchesEstado;
    });
  }, [productos, search, filtroCategoria, filtroEstado]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => {
    const missingIds = paginated
      .map((item) => item.id)
      .filter((id) => id && !Object.prototype.hasOwnProperty.call(priceCache, id));

    if (!missingIds.length) return;

    let cancelled = false;

    Promise.all(
      missingIds.map(async (id) => {
        try {
          const { data } = await apiClient.get(`/inventario/productos/${id}/precios`);
          return [id, Array.isArray(data) ? data : []];
        } catch {
          return [id, []];
        }
      })
    ).then((entries) => {
      if (cancelled) return;

      setPriceCache((prev) => {
        const next = { ...prev };
        entries.forEach(([id, prices]) => {
          next[id] = prices;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [paginated, priceCache]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const metricas = useMemo(() => {
    const allSummaries = filtered.map((producto) =>
      buildPriceSummary(priceCache[producto.id] || [], producto)
    );

    return {
      productosConPrecio: allSummaries.filter((item) => item.total > 0 || item.preferredAmount > 0).length,
      preciosActivos: allSummaries.reduce((acc, item) => acc + item.active, 0),
      promociones: allSummaries.reduce((acc, item) => acc + item.promos, 0),
    };
  }, [filtered, priceCache]);

  const exportRows = filtered.map((producto) => {
    const summary = buildPriceSummary(priceCache[producto.id] || [], producto);

    return {
      codigo: producto.codigo,
      producto: producto.nombre,
      categoria: producto.categoria_nombre || "Sin categoría",
      estado: producto.estado === "1" ? "Activo" : "Inactivo",
      precio_costo: producto.precio_costo,
      precio_venta_base: producto.precio_venta,
      precio_vigente: summary.preferredAmount,
      tipo_precio_vigente: summary.preferredLabel,
      registros_precio: summary.total,
      precios_activos: summary.active,
      promociones_activas: summary.promos,
    };
  });

  const openGestionPrecios = (productoId) => {
    setSelectedProductoId(productoId);
    setOpenModal(true);
  };

  const closeGestionPrecios = () => {
    setOpenModal(false);
    setSelectedProductoId(null);
  };

  const handleRefreshModalData = async () => {
    await fetchData();
    if (!selectedProductoId) return;

    try {
      const { data } = await apiClient.get(`/inventario/productos/${selectedProductoId}/precios`);
      setPriceCache((prev) => ({
        ...prev,
        [selectedProductoId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      // No bloquea la UX principal.
    }
  };

  const TableSkeleton = () => (
    <>
      {[...Array(6)].map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton variant="text" width={110} /></TableCell>
          <TableCell><Skeleton variant="text" width={200} /></TableCell>
          <TableCell><Skeleton variant="text" width={130} /></TableCell>
          <TableCell align="right"><Skeleton variant="text" width={90} sx={{ ml: "auto" }} /></TableCell>
          <TableCell align="right"><Skeleton variant="text" width={90} sx={{ ml: "auto" }} /></TableCell>
          <TableCell align="center"><Skeleton variant="rounded" width={100} height={22} sx={{ mx: "auto" }} /></TableCell>
          <TableCell align="center"><Skeleton variant="rounded" width={70} height={22} sx={{ mx: "auto" }} /></TableCell>
          <TableCell align="center"><Skeleton variant="rounded" width={82} height={22} sx={{ mx: "auto" }} /></TableCell>
          <TableCell align="center"><Skeleton variant="rounded" width={92} height={30} sx={{ mx: "auto" }} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Box sx={inventoryPageShellSx}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={inventoryHeaderPaperSx}>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={inventoryIconBadgeSx}>
                <PriceCheckOutlinedIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: "#1e293b", fontSize: "17px", lineHeight: 1 }}>
                  Gestión de precios
                </Typography>
                <Typography sx={{ fontSize: "12px", color: inventoryUi.muted, mt: 0.45 }}>
                  Vista comercial para administrar precios base, promociones y versiones por producto.
                </Typography>
              </Box>
            </Stack>

            <Box sx={inventoryResultChipSx}>{filtered.length} PRODUCTOS</Box>
          </Paper>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {[
              {
                label: "Productos con precio",
                value: metricas.productosConPrecio,
                icon: <MonetizationOnOutlinedIcon sx={{ fontSize: 20 }} />,
                color: inventoryUi.blue,
                bg: inventoryUi.blueSoft,
              },
              {
                label: "Precios activos",
                value: metricas.preciosActivos,
                icon: <SellOutlinedIcon sx={{ fontSize: 20 }} />,
                color: inventoryUi.success,
                bg: inventoryUi.successSoft,
              },
              {
                label: "Promociones activas",
                value: metricas.promociones,
                icon: <LocalOfferOutlinedIcon sx={{ fontSize: 20 }} />,
                color: inventoryUi.mustard,
                bg: inventoryUi.mustardSoft,
              },
            ].map((card) => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{
                  ...inventoryPagePaperSx,
                  flex: 1,
                  p: 2.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.6,
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    bgcolor: card.bg,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "11px", color: inventoryUi.muted, fontWeight: 800 }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: "22px", fontWeight: 900, color: inventoryUi.text, lineHeight: 1.1 }}>
                    {card.value}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>

          <Paper elevation={0} sx={{ ...inventoryPagePaperSx, overflow: "hidden" }}>
            <Box sx={{ px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  placeholder="Buscar producto o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ ...filterInputSx, width: 240 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ fontSize: 18, color: inventoryUi.muted }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl size="small" sx={{ ...filterInputSx, width: 160 }}>
                  <Select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    displayEmpty
                    sx={{ fontSize: "13px" }}
                  >
                    <MenuItem value="0">Categoría</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ ...filterInputSx, width: 120 }}>
                  <Select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    sx={{ fontSize: "13px" }}
                  >
                    {estados.map((estado) => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ ...filterInputSx, width: 80 }}>
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    sx={{ fontSize: "13px" }}
                  >
                    {[5, 10, 25, 50].map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <PremiumButton
                  variant="excel"
                  onClick={() => exportarExcel(exportRows, "precios-productos")}
                >
                  EXCEL
                </PremiumButton>
                <PremiumButton
                  variant="anadir"
                  onClick={() => openGestionPrecios(selectedProductoId || filtered[0]?.id)}
                  disabled={!selectedProductoId && !filtered[0]?.id}
                >
                  Gestionar
                </PremiumButton>
              </Stack>
            </Box>

            <Box sx={{ px: 4, pb: 4 }}>
              <TableContainer
                sx={{
                  overflowX: "auto",
                  minHeight: 320,
                  bgcolor: "#ffffff",
                  borderRadius: "8px",
                  border: `1px solid ${inventoryUi.border}`,
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    ...tableSx,
                    width: "100%",
                    minWidth: 1300,
                    tableLayout: "fixed",
                    "& .MuiTableCell-root": {
                      padding: "6px 18px",
                      fontSize: "13px",
                      borderColor: "#f1f5f9",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9 !important" }}>
                      <TableCell sx={{ width: "12%" }}>Código</TableCell>
                      <TableCell sx={{ width: "24%" }}>Producto</TableCell>
                      <TableCell sx={{ width: "16%" }}>Categoría</TableCell>
                      <TableCell align="right" sx={{ width: "11%" }}>Costo base</TableCell>
                      <TableCell align="right" sx={{ width: "12%" }}>Precio visible</TableCell>
                      <TableCell align="center" sx={{ width: "10%" }}>Tipo vigente</TableCell>
                      <TableCell align="center" sx={{ width: "7%" }}>Versiones</TableCell>
                      <TableCell align="center" sx={{ width: "8%" }}>Promos</TableCell>
                      <TableCell align="center" sx={{ width: "12%" }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading ? (
                      <TableSkeleton />
                    ) : paginated.length > 0 ? (
                      paginated.map((row) => {
                        const summary = buildPriceSummary(priceCache[row.id] || [], row);

                        return (
                          <TableRow key={row.id} hover>
                            <TableCell>
                              <Typography sx={{ fontWeight: 800, color: inventoryUi.text, fontSize: 12.5 }}>
                                {row.codigo || "S/C"}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography sx={{ fontWeight: 900, color: inventoryUi.text, fontSize: 13 }}>
                                {row.nombre || "Producto sin nombre"}
                              </Typography>
                              <Typography sx={{ color: inventoryUi.muted, fontSize: 11, fontWeight: 600, mt: 0.25 }}>
                                {row.marca || "Sin marca"} · {row.unidad_medida || "und"}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography sx={{ fontWeight: 800, color: inventoryUi.text, fontSize: 12 }}>
                                {row.categoria_nombre || "Sin categoría"}
                              </Typography>
                              <Typography sx={{ color: inventoryUi.muted, fontSize: 11 }}>
                                {row.estado === "1" ? "Producto activo" : "Producto inactivo"}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 800, color: inventoryUi.text, fontSize: 13 }}>
                                ${formatMoney(row.precio_costo)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 900, color: inventoryUi.black, fontSize: 13 }}>
                                ${formatMoney(summary.preferredAmount)}
                              </Typography>
                              <Typography sx={{ color: inventoryUi.muted, fontSize: 11, fontWeight: 600 }}>
                                Base venta: ${formatMoney(row.precio_venta)}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={summary.preferredLabel}
                                size="small"
                                sx={semanticChipSx(summary.promos > 0 ? "mustard" : "inventory")}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={summary.total}
                                size="small"
                                sx={semanticChipSx(summary.total > 0 ? "success" : "neutral")}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={summary.promos}
                                size="small"
                                sx={semanticChipSx(summary.promos > 0 ? "mustard" : "neutral")}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Stack direction="row" spacing={0.8} justifyContent="center">
                                <Tooltip title="Seleccionar producto">
                                  <IconButton
                                    size="small"
                                    onClick={() => setSelectedProductoId(row.id)}
                                    sx={semanticIconButtonSx("inventory")}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Gestionar precios">
                                  <IconButton
                                    size="small"
                                    onClick={() => openGestionPrecios(row.id)}
                                    sx={semanticIconButtonSx("mustard")}
                                  >
                                    <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Box sx={{ textAlign: "center", opacity: 0.78 }}>
                            <PriceCheckOutlinedIcon sx={{ fontSize: 58, color: inventoryUi.muted, mb: 1.5 }} />
                            <Typography sx={{ fontWeight: 900, color: inventoryUi.black, fontSize: 16, mb: 0.5 }}>
                              No hay productos para administrar precios
                            </Typography>
                            <Typography sx={{ color: inventoryUi.muted, fontSize: 12 }}>
                              Ajusta los filtros o crea productos primero desde el catálogo.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 1.8, bgcolor: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                <Pagination
                  count={totalPages}
                  page={Math.min(page, totalPages)}
                  onChange={(event, value) => setPage(value)}
                  showFirstButton
                  showLastButton
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: "8px",
                      minWidth: 30,
                      height: 30,
                    },
                    "& .Mui-selected": {
                      bgcolor: "rgba(15, 23, 42, 0.08) !important",
                      color: inventoryUi.black,
                    },
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Stack>
      </Box>

      <ModalPreciosProducto
        open={openModal}
        onClose={closeGestionPrecios}
        productoId={selectedProductoId}
        sedes={sedes}
        onSaved={handleRefreshModalData}
      />
    </Box>
  );
}
