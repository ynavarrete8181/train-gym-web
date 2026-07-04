import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare } from "@fortawesome/free-solid-svg-icons";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const ui = {
  bg: "#f6f8fc",
  paper: "#ffffff",
  head: "#0b1f3a",
  muted: "#475569",
  border: "#dbe3f0",
  borderSoft: "#e8eef7",
  primary: "#144985",
  primarySoft: "#EEF4FB",
  primaryDark: "#0F3A6B",
  primaryHeader: "#DCE8F7",
  primaryHeaderBorder: "#C7D8EE",
  successSoft: "#EAF7EE",
  successBorder: "#CFE7D4",
  successText: "#1F3B2D",
  warningText: "#9a6700",
  warningBorder: "#f2d28f",
  warningSoft: "rgba(183,121,31,.06)",
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
    minHeight: 34,
    borderRadius: 1.5,
  },
  "& .MuiInputBase-input": { ...baseFontSx, fontSize: 12, py: 0.75 },
  "& .MuiInputLabel-root": { ...baseFontSx, fontSize: 12 },
};

const tableSx = {
  "& th": {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 900,
    color: ui.primaryDark,
    bgcolor: ui.primaryHeader,
    borderBottom: `1px solid ${ui.primaryHeaderBorder}`,
    py: 0.9,
    whiteSpace: "nowrap",
  },
  "& td": {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.85,
    verticalAlign: "middle",
  },
};

const getEstadoBadgeSx = (estado = "") => {
  const text = String(estado || "").trim().toUpperCase();

  if (text === "REGISTRADO") {
    return {
      color: "#177d3f",
      border: "1px solid #177d3f",
      backgroundColor: "#fff",
      "&:hover": { backgroundColor: ui.successSoft },
    };
  }

  return {
    color: ui.warningText,
    border: `1px solid ${ui.warningBorder}`,
    backgroundColor: "#fff",
    "&:hover": { backgroundColor: ui.warningSoft },
  };
};

const AsignacionesListas = ({
  chipsResumen,
  loading,
  textoFiltro,
  onTextoFiltroChange,
  flujoFiltro,
  onFlujoFiltroChange,
  onRecargar,
  onNuevaAsignacion,
  rowsFiltradas,
  rowsPaginadas,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  onVerDetalle,
}) => (
  <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
    <Box sx={{ maxWidth: "100%", mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: ui.paper,
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
            <Inventory2OutlinedIcon sx={{ color: ui.primary, fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 220 }}>
            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
              Asignaciones y traslados internos
            </Typography>
            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
              Seguimiento del historial y acceso directo a nuevos traslados entre bodegas.
            </Typography>
          </Box>

          {chipsResumen.map((chip) => (
            <Chip
              key={chip.label}
              label={chip.label}
              size="small"
              color={chip.tone}
              variant="outlined"
              sx={{
                fontWeight: 800,
                ml: chip === chipsResumen[0] ? "auto" : 0,
                ...(chip.tone === "default"
                  ? {
                      color: ui.successText,
                      bgcolor: ui.successSoft,
                      border: `1px solid ${ui.successBorder}`,
                    }
                  : {}),
              }}
            />
          ))}

          <span>
            <Button
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faPlusSquare} />}
              onClick={onNuevaAsignacion}
              sx={{
                ...baseFontSx,
                height: 34,
                borderRadius: 1.5,
                fontSize: 12,
                px: 2,
                textTransform: "none",
                fontWeight: 800,
                bgcolor: ui.primary,
                boxShadow: "0 10px 20px rgba(20,73,133,0.18)",
                "&:hover": {
                  bgcolor: ui.primaryDark,
                },
              }}
            >
              Añadir
            </Button>
          </span>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          bgcolor: ui.paper,
          border: `1px solid ${ui.border}`,
          borderRadius: 3,
          p: 2,
          mb: 1.5,
          boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
          <Typography sx={{ ...baseFontSx, fontSize: 12.5, fontWeight: 900, color: ui.head }}>
            Historial general del módulo
          </Typography>
          <Tooltip title="Recargar" arrow>
            <IconButton
              onClick={onRecargar}
              sx={{ border: `1px solid ${ui.border}`, borderRadius: 1.5, width: 34, height: 34 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={8}>
            <TextField
              size="small"
              fullWidth
              label="Buscar (número, cédula, origen, destino...)"
              value={textoFiltro}
              onChange={onTextoFiltroChange}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ fontSize: 16, color: ui.muted }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ ...baseFontSx, fontSize: 12 }}>Tipo</InputLabel>
              <Select label="Flujo" value={flujoFiltro} onChange={onFlujoFiltroChange} sx={fieldSx}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="medicamentos_insumos">Medicamentos e insumos</MenuItem>
                <MenuItem value="bienes_suministros">Bienes y suministros</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
          <Table stickyHeader size="small" sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Nro.</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Detalle</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ height: 120 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rowsFiltradas.length > 0 ? (
                rowsPaginadas.map((row, index) => (
                  <TableRow key={row.id || index} hover>
                    <TableCell>{row.fecha || "-"}</TableCell>
                    <TableCell>{row.numero_asignacion || `ASG-${row.id}`}</TableCell>
                    <TableCell>{row.tipo || "-"}</TableCell>
                    <TableCell>{row.responsable || row.cedula || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.estado || "REGISTRADO"}
                        variant="outlined"
                        size="small"
                        sx={{
                          ...baseFontSx,
                          fontSize: 11,
                          fontWeight: 800,
                          ...getEstadoBadgeSx(row.estado),
                        }}
                      />
                    </TableCell>
                    <TableCell>{row.origen || "-"}</TableCell>
                    <TableCell>{row.destino || "-"}</TableCell>
                    <TableCell>{row.detalle || "-"}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onVerDetalle(row.id)}
                          sx={{
                            border: `1px solid ${ui.border}`,
                            borderRadius: 1.5,
                            color: ui.primary,
                            backgroundColor: "#fff",
                            "&:hover": { backgroundColor: "rgba(20,73,133,.06)" },
                          }}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 900, color: ui.head }}>
                      SIN ASIGNACIONES REGISTRADAS AUN
                    </Typography>
                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.4 }}>
                      El historial aparecerá aquí conforme vayamos registrando traslados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={rowsFiltradas.length}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Filas por página"
          sx={{
            mt: 0.5,
            "& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              ...baseFontSx,
              fontSize: 12,
            },
          }}
        />
      </Paper>
    </Box>
  </Box>
);

export default AsignacionesListas;
