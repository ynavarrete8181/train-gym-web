import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Divider,
  TableContainer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import axiosClient from "../../../../axios/axios_client";

const ui = {
  headBar: "#0a2442",
  borderSoft: "#e8eef7",
  head: "#0b1f3a",
  muted: "#475569",
  bgSoft: "#f8fafc",
  primary: "#144985",
  danger: "#d32f2f",
};

const baseFontSx = {
  fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
  letterSpacing: 0,
  fontStyle: "normal",
};

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

const safeNum = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const formatQty = (value) =>
  safeNum(value).toLocaleString("es-EC", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const parseDetalle = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];

    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const getTipoLabel = (tipo) => {
  if (Number(tipo) === 2) return "Medicamento";
  if (Number(tipo) === 3) return "Insumo médico";
  return safeStr(tipo) || "Producto";
};

const getTipoColor = (tipo) => {
  if (Number(tipo) === 2) return "success";
  if (Number(tipo) === 3) return "info";
  return "default";
};

const normalizeDetalle = (rawItems) =>
  rawItems.map((x, idx) => ({
    key: `${x?.key ?? x?.idInsumo ?? x?.id ?? idx}-${idx}`,
    idInsumo: x?.idInsumo ?? x?.id ?? "",
    nombre: x?.nombre ?? x?.insumo ?? x?.descripcion ?? "",
    cantidad: Number(x?.cantidad ?? 0),
    tipoInsumo: x?.tipoInsumo ?? x?.id_tipo_insumo ?? "",
    tipoLabel:
      x?.tipoLabel ??
      getTipoLabel(x?.tipoInsumo ?? x?.id_tipo_insumo),
    bodega_nombre: x?.bodega_nombre ?? "",
    sede_nombre: x?.sede_nombre ?? "",
    desglose_lotes: Array.isArray(x?.desglose_lotes)
      ? x.desglose_lotes
      : Array.isArray(x?.lotes)
        ? x.lotes
        : [],
  }));

const tableSx = {
  "& th": {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: ui.head,
    bgcolor: "#f3f6fb",
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.9,
    whiteSpace: "nowrap",
  },
  "& td": {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.85,
    verticalAlign: "top",
  },
};

const SummaryCard = ({ icon, title, value, subtitle }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      borderRadius: 2,
      border: `1px solid ${ui.borderSoft}`,
      backgroundColor: "#fff",
      height: "100%",
    }}
  >
    <Box sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          backgroundColor: "rgba(20,73,133,0.08)",
          color: ui.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
          {title}
        </Typography>
        <Typography
          sx={{
            ...baseFontSx,
            fontSize: 14,
            fontWeight: 800,
            color: ui.head,
            lineHeight: 1.25,
          }}
        >
          {value || "—"}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              ...baseFontSx,
              fontSize: 11,
              color: ui.muted,
              mt: 0.3,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Box>
  </Paper>
);

export default function ListaIngresosDetalle({ open, onClose, idIngreso }) {
  const [loading, setLoading] = useState(false);
  const [ingreso, setIngreso] = useState(null);
  const [items, setItems] = useState([]);

  const abortRef = useRef(null);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!open || !idIngreso) return;

    const fetchDetalle = async () => {
      const myReq = ++reqRef.current;
      setLoading(true);

      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await axiosClient.get(`/inventario/ingresos/${idIngreso}`, {
          signal: abortRef.current.signal,
        });

        if (myReq !== reqRef.current) return;

        const data = res?.data;
        const row = Array.isArray(data)
          ? data[0]
          : data?.data?.[0] ?? data?.data ?? data;

        setIngreso(row || null);
        setItems(normalizeDetalle(parseDetalle(row?.ei_detalle_producto)));
      } catch (e) {
        const isAbort = e?.name === "AbortError" || e?.code === "ERR_CANCELED";

        if (isAbort) return;

        setIngreso(null);
        setItems([]);
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    };

    fetchDetalle();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [open, idIngreso]);

  const titulo = useMemo(() => {
    const numero = safeStr(ingreso?.ei_numero_ingreso);
    if (numero) return `Detalle del Ingreso # ${numero}`;
    const id = safeStr(ingreso?.ei_id ?? idIngreso);
    return `Detalle del Ingreso # ${id}`;
  }, [ingreso, idIngreso]);

  const totalUnidades = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [items]
  );

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ bgcolor: ui.headBar, px: 2.5, py: 1.5 }}>
        <Typography
          sx={{
            ...baseFontSx,
            color: "white",
            fontWeight: 800,
            fontSize: 13,
            lineHeight: 1.2,
          }}
        >
          {titulo}
        </Typography>

        <Typography
          sx={{
            ...baseFontSx,
            fontSize: 11,
            color: "rgba(255,255,255,0.72)",
            mt: 0.3,
          }}
        >
          Información general y detalle de productos registrados
        </Typography>
      </Box>

      <DialogContent sx={{ p: 2, bgcolor: "#fafbfd" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 7,
              gap: 1.5,
            }}
          >
            <CircularProgress size={26} />
            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 13 }}>
              Cargando detalle...
            </Typography>
          </Box>
        ) : ingreso ? (
          <Box>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={12} md={4}>
                <SummaryCard
                  icon={<StorefrontOutlinedIcon fontSize="small" />}
                  title="Proveedor"
                  value={safeStr(ingreso?.proveedor_nombre || "—")}
                  subtitle={safeStr(ingreso?.prov_ruc || "")}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <SummaryCard
                  icon={<LocalShippingOutlinedIcon fontSize="small" />}
                  title="Tipo de adquisición"
                  value={safeStr(ingreso?.tipo_adquisicion_nombre || "—")}
                  subtitle={safeStr(ingreso?.ei_numero_comprobante || "Sin comprobante")}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <SummaryCard
                  icon={<Inventory2OutlinedIcon fontSize="small" />}
                  title="Bodega"
                  value={`${safeStr(ingreso?.sede_nombre || "—")} - ${safeStr(
                    ingreso?.bodega_nombre || "—"
                  )}`}
                  subtitle={safeStr(ingreso?.nombre_usuario || "")}
                />
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${ui.borderSoft}`,
                borderRadius: 2,
                background: ui.bgSoft,
                p: 2,
                mb: 2,
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    Estado
                  </Typography>
                  <Box sx={{ mt: 0.6 }}>
                    <Chip
                      label={safeStr(ingreso?.estado_nombre || "—")}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    Fecha emisión
                  </Typography>
                  <Typography
                    sx={{
                      ...baseFontSx,
                      fontSize: 13,
                      fontWeight: 800,
                      color: ui.head,
                      mt: 0.4,
                    }}
                  >
                    {safeStr(ingreso?.ei_fecha_emision || ingreso?.ei_created_at || "—")}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    Productos
                  </Typography>
                  <Typography
                    sx={{
                      ...baseFontSx,
                      fontSize: 13,
                      fontWeight: 800,
                      color: ui.head,
                      mt: 0.4,
                    }}
                  >
                    {items.length}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    Total unidades
                  </Typography>
                  <Typography
                    sx={{
                      ...baseFontSx,
                      fontSize: 13,
                      fontWeight: 800,
                      color: ui.head,
                      mt: 0.4,
                    }}
                  >
                    {formatQty(totalUnidades)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 0.25 }} />
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    Comprobante
                  </Typography>
                  <Typography
                    sx={{
                      ...baseFontSx,
                      fontSize: 12.5,
                      color: ui.head,
                      mt: 0.3,
                    }}
                  >
                    {safeStr(
                      ingreso?.ei_numero_comprobante ||
                        (ingreso?.ei_ruta_comprobante ? "PDF adjunto" : "Sin comprobante")
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${ui.borderSoft}`,
                bgcolor: "#fff",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.2,
                  borderBottom: `1px solid ${ui.borderSoft}`,
                  bgcolor: "#f8fbff",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ReceiptLongOutlinedIcon sx={{ color: ui.primary, fontSize: 18 }} />
                <Typography
                  sx={{
                    ...baseFontSx,
                    fontSize: 12,
                    fontWeight: 900,
                    color: ui.head,
                  }}
                >
                  Productos registrados
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">ID</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell>Lotes</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {items.length > 0 ? (
                      items.map((it) => (
                        <TableRow key={it.key} hover>
                          <TableCell align="center">{safeStr(it.idInsumo)}</TableCell>

                          <TableCell>
                            <Chip
                              label={safeStr(it.tipoLabel || "Producto")}
                              size="small"
                              color={getTipoColor(it.tipoInsumo)}
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                ...baseFontSx,
                                fontSize: 12.5,
                                fontWeight: 800,
                                color: ui.head,
                              }}
                            >
                              {safeStr(it.nombre)}
                            </Typography>

                            {(it.sede_nombre || it.bodega_nombre) && (
                              <Typography
                                sx={{
                                  ...baseFontSx,
                                  fontSize: 11,
                                  color: ui.muted,
                                  mt: 0.25,
                                }}
                              >
                                {safeStr(it.sede_nombre)}
                                {it.sede_nombre && it.bodega_nombre ? " — " : ""}
                                {safeStr(it.bodega_nombre)}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              ...baseFontSx,
                              fontSize: 12.5,
                              color: ui.head,
                              fontWeight: 800,
                            }}
                          >
                            {formatQty(it.cantidad)}
                          </TableCell>

                          <TableCell>
                            {it.desglose_lotes?.length > 0 ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.75,
                                }}
                              >
                                {it.desglose_lotes.map((lote, idx) => (
                                  <Box
                                    key={`${it.key}-lote-${idx}`}
                                    sx={{
                                      border: `1px solid ${ui.borderSoft}`,
                                      borderRadius: 1.5,
                                      p: 0.8,
                                      bgcolor: "#fafcff",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...baseFontSx,
                                        fontSize: 11.5,
                                        fontWeight: 800,
                                        color: ui.head,
                                      }}
                                    >
                                      Lote: {safeStr(lote?.codigo_lote || lote?.id_lote || "—")}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        ...baseFontSx,
                                        fontSize: 11,
                                        color: ui.muted,
                                        mt: 0.2,
                                      }}
                                    >
                                      Cantidad: {safeStr(lote?.cantidad || lote?.cantidad_inicial || 0)}
                                      {lote?.fecha_vencimiento
                                        ? ` • Vence: ${safeStr(lote.fecha_vencimiento)}`
                                        : ""}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography
                                sx={{
                                  ...baseFontSx,
                                  fontSize: 11.5,
                                  color: ui.muted,
                                }}
                              >
                                Sin desglose de lotes
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            ...baseFontSx,
                            py: 4,
                            color: ui.muted,
                            fontSize: 12,
                          }}
                        >
                          No hay productos en este ingreso.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        ) : (
          <Typography sx={{ ...baseFontSx, color: ui.danger }}>
            No se pudo cargar el detalle del ingreso.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, bgcolor: "#f8fafc" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon />}
          sx={{
            ...baseFontSx,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 1.5,
            borderColor: ui.danger,
            color: ui.danger,
            "& .MuiButton-startIcon": {
              color: ui.danger,
            },
            "&:hover": {
              borderColor: "#b71c1c",
              backgroundColor: "rgba(211,47,47,0.08)",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
