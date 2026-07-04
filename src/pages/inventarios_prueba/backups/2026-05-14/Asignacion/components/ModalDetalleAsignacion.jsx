import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";

const ui = {
  border: "#dbe3f0",
  borderSoft: "#e8eef7",
  head: "#0b1f3a",
  muted: "#475569",
  primary: "#144985",
  primaryDark: "#0F3A6B",
  primarySoft: "#EEF4FB",
  success: "#177d3f",
  successSoft: "rgba(23,125,63,.06)",
  danger: "#d32f2f",
};

const baseFontSx = {
  fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
  letterSpacing: 0,
  fontStyle: "normal",
};

const tableSx = {
  "& th": {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: ui.head,
    bgcolor: "#f3f6fb",
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.9,
  },
  "& td": {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.8,
    verticalAlign: "top",
  },
};

const estadoChipSx = {
  ...baseFontSx,
  fontSize: 11,
  fontWeight: 800,
  color: ui.success,
  backgroundColor: "#fff",
  border: `1px solid ${ui.success}`,
  "&:hover": {
    backgroundColor: ui.successSoft,
  },
};

const dataLine = (label, value) => (
  <Box>
    <Typography sx={{ ...baseFontSx, fontSize: 10.5, fontWeight: 900, color: ui.primary, textTransform: "uppercase" }}>
      {label}
    </Typography>
    <Typography sx={{ ...baseFontSx, fontSize: 12, color: ui.head, mt: 0.2 }}>
      {value || "-"}
    </Typography>
  </Box>
);

const ModalDetalleAsignacion = ({ open, onClose, data, loading = false }) => {
  const header = data?.header || null;
  const detalles = Array.isArray(data?.detalles) ? data.detalles : [];
  const handleDialogClose = (_, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 0,
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(15,58,107,0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          ...baseFontSx,
          bgcolor: ui.primaryDark,
          color: "#fff",
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${ui.primaryDark}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.25,
              border: "1px solid rgba(255,255,255,.28)",
              bgcolor: "rgba(255,255,255,.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RemoveRedEyeOutlinedIcon sx={{ color: "#fff", fontSize: 16 }} />
          </Box>
          <Box>
            <Typography sx={{ ...baseFontSx, fontSize: 13.5, fontWeight: 900, color: "#fff" }}>
              Detalle de asignación
            </Typography>
            <Typography sx={{ ...baseFontSx, fontSize: 11, color: "rgba(255,255,255,.82)" }}>
              Consulta detallada del traslado registrado.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2, bgcolor: "#fff" }}>
        {loading ? (
          <Typography sx={{ ...baseFontSx, fontSize: 12, color: ui.muted }}>
            Cargando detalle...
          </Typography>
        ) : header ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${ui.border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1.2 }}>
                <Box>
                  <Typography sx={{ ...baseFontSx, fontSize: 13, fontWeight: 900, color: ui.head }}>
                    {header.numero_asignacion || `Asignación #${header.id}`}
                  </Typography>
                  <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                    {header.tipo_flujo === "medicamentos_insumos" ? "Medicamentos e insumos" : "Bienes y suministros"}
                  </Typography>
                </Box>

                <Chip label={header.estado || "REGISTRADO"} variant="outlined" sx={estadoChipSx} />
              </Box>

              <Grid container spacing={1.25}>
                <Grid item xs={12} md={3}>{dataLine("Fecha", header.created_at)}</Grid>
                <Grid item xs={12} md={3}>{dataLine("Cédula", header.cedula_destino)}</Grid>
                <Grid item xs={12} md={6}>{dataLine("Responsable", header.nombre_destino)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Sede origen", header.sede_origen)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Facultad origen", header.facultad_origen)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Bodega origen", header.bodega_origen)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Sede destino", header.sede_destino)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Facultad destino", header.facultad_destino)}</Grid>
                <Grid item xs={12} md={4}>{dataLine("Bodega destino", header.bodega_destino)}</Grid>
                <Grid item xs={12}>{dataLine("Observación", header.observacion || "Sin observación")}</Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${ui.border}` }}>
              <Typography sx={{ ...baseFontSx, fontSize: 12.5, fontWeight: 900, color: ui.head, mb: 1 }}>
                Productos trasladados
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Stock origen</TableCell>
                      <TableCell>Stock útil</TableCell>
                      <TableCell>Próx. venc.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalles.map((item) => (
                      <React.Fragment key={item.id}>
                        <TableRow>
                          <TableCell>{item.producto_codigo || "-"}</TableCell>
                          <TableCell>{item.producto_nombre || "-"}</TableCell>
                          <TableCell>{item.cantidad || "-"}</TableCell>
                          <TableCell>{item.stock_total_origen ?? "-"}</TableCell>
                          <TableCell>{item.stock_util_origen ?? "-"}</TableCell>
                          <TableCell>{item.proximo_vencimiento_vigente || "-"}</TableCell>
                        </TableRow>
                        {Array.isArray(item.detalle_lotes) && item.detalle_lotes.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ bgcolor: "#fbfcfe" }}>
                              <Typography sx={{ ...baseFontSx, fontSize: 11, fontWeight: 800, color: ui.primary, mb: 0.75 }}>
                                Desglose por lote
                              </Typography>
                              <Divider sx={{ mb: 1 }} />
                              <Box sx={{ display: "grid", gap: 0.6 }}>
                                {item.detalle_lotes.map((lote, idx) => (
                                  <Typography key={`${item.id}-${idx}`} sx={{ ...baseFontSx, fontSize: 11.2, color: ui.muted }}>
                                    {`Lote ${lote.codigo_lote || "SIN CÓDIGO"} · Cantidad ${lote.cantidad || 0} · Vence ${lote.fecha_vencimiento || "N/A"}`}
                                  </Typography>
                                ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        ) : (
          <Typography sx={{ ...baseFontSx, fontSize: 12, color: ui.muted }}>
            No hay detalle disponible para esta asignación.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.25, gap: 1, bgcolor: "#fff" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
          sx={{
            ...baseFontSx,
            height: 36,
            borderRadius: 1.5,
            fontSize: 12,
            px: 2,
            textTransform: "none",
            fontWeight: 700,
            borderColor: ui.danger,
            color: ui.danger,
            bgcolor: "#fff",
            "& .MuiButton-startIcon": {
              color: ui.danger,
            },
            "&:hover": {
              bgcolor: "rgba(211,47,47,0.08)",
              borderColor: "#b71c1c",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDetalleAsignacion;
