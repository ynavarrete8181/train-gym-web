import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Button,
} from "@mui/material";

import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare } from "@fortawesome/free-solid-svg-icons";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

import Swal from "sweetalert2";
import axiosClient from "../../../../axios/axios_client";

import ModalNuevaBajaInventario from "./ModalNuevaBajaInventario";
import ListaBajasDetalle from "./DetalleBajaInventarioDialog";

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
    success: "#2E7D32",
    successSoft: "#EAF7EE",
    successBorder: "#CFE7D4",
    successText: "#1F3B2D",
};

const baseFontSx = {
    fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
};

const fieldSx = {
    "& .MuiInputBase-root": {
        ...baseFontSx,
        fontSize: 12,
        minHeight: 34,
        borderRadius: 1.5,
    },
    "& .MuiInputBase-input": {
        ...baseFontSx,
        fontSize: 12,
        py: 0.75,
    },
    "& .MuiInputLabel-root": {
        ...baseFontSx,
        fontSize: 12,
    },
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
        py: 0.75,
        verticalAlign: "middle",
    },
};

const motivoOptions = [
    "VENCIDO",
    "DAÑADO",
    "MERMA",
    "AJUSTE",
    "CONTAMINACIÓN",
    "PÉRDIDA",
    "CADUCADO",
    "OTRO",
];

const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const formatDateTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(
        d.getHours()
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const useDebounced = (value, delay = 350) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
};

const getEstadoChipColor = (estado) => {
    const v = String(estado || "").trim().toUpperCase();
    if (v === "REGISTRADO") return "primary";
    if (v === "APROBADO") return "success";
    if (v === "OBSERVADO") return "warning";
    if (v === "ANULADO" || v === "RECHAZADO") return "error";
    return "default";
};

const BajasInventario = () => {
    const [dataBajas, setDataBajas] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        const saved = localStorage.getItem("rowsPerPageBajasInventario");
        return saved ? parseInt(saved, 10) : 5;
    });

    const [q, setQ] = useState("");
    const [fMotivo, setFMotivo] = useState("0");

    const [openNuevaBaja, setOpenNuevaBaja] = useState(false);

    const debouncedQ = useDebounced(q, 350);
    const abortRef = useRef(null);
    const reqIdRef = useRef(0);

    useEffect(() => {
        localStorage.setItem("rowsPerPageBajasInventario", String(rowsPerPage));
    }, [rowsPerPage]);

    const fetchServer = async () => {
        const myReqId = ++reqIdRef.current;
        setLoading(true);

        try {
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const params = {
                page,
                per_page: rowsPerPage,
            };

            if ((debouncedQ || "").trim()) params.q = debouncedQ.trim();
            if (fMotivo && fMotivo !== "0") params.motivo = fMotivo;

            const { data: resp } = await axiosClient.get("/inventario/bajas", {
                params,
                signal: abortRef.current.signal,
            });

            const rows = Array.isArray(resp?.data) ? resp.data : [];
            const total = typeof resp?.total === "number" ? resp.total : rows.length;

            setDataBajas(rows);
            setTotalRows(total);
        } catch (error) {
            const isAbort =
                error?.name === "CanceledError" ||
                error?.name === "AbortError" ||
                error?.code === "ERR_CANCELED";

            if (!isAbort) {
                setDataBajas([]);
                setTotalRows(0);

                Swal.fire(
                    "Error",
                    error?.response?.data?.message ||
                    error?.message ||
                    "No se pudo cargar el historial de bajas.",
                    "error"
                );
            }
        } finally {
            if (myReqId === reqIdRef.current) {
                setHasFetched(true);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchServer();
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [page, rowsPerPage, debouncedQ, fMotivo]);

    useEffect(() => {
        setPage(1);
    }, [rowsPerPage, debouncedQ, fMotivo]);

    const countPages = Math.max(1, Math.ceil((totalRows || 0) / rowsPerPage));
    const showEmptyState = hasFetched && !loading && dataBajas.length === 0;

    const [openModalDetalleBaja, setOpenModalDetalleBaja] = useState(false);
    const [bajaSeleccionadaId, setBajaSeleccionadaId] = useState(null);

    const handleVerDetalle = (id) => {
        setBajaSeleccionadaId(id);
        setOpenModalDetalleBaja(true);
    };

    const handleCloseModalDetalleBaja = () => {
        setOpenModalDetalleBaja(false);
        setBajaSeleccionadaId(null);
    };

    const handleVerDetalles = async (id) => {
        try {
            const { data: resp } = await axiosClient.get(`/inventario/bajas/${id}`);
            const encabezado = resp?.data?.encabezado ?? {};
            const detalles = Array.isArray(resp?.data?.detalles) ? resp.data.detalles : [];

            const itemsHtml =
                detalles.length > 0
                    ? detalles
                        .map((d) => {
                            const lotes = Array.isArray(d.lotes) ? d.lotes : [];
                            const lotesHtml =
                                lotes.length > 0
                                    ? `
                      <div style="margin-top:6px;padding:8px 10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">
                        ${lotes
                                        .map(
                                            (l) => `
                              <div style="font-size:12px;color:#334155;margin-bottom:4px;">
                                <b>Lote:</b> ${l.codigo_lote || "-"} |
                                <b>Vence:</b> ${l.fecha_vencimiento || "-"} |
                                <b>Cant.:</b> ${l.cantidad || 0}
                              </div>
                            `
                                        )
                                        .join("")}
                      </div>
                    `
                                    : "";

                            return `
                  <div style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:13px;font-weight:700;color:#0f172a;">
                      ${d.insumo_descripcion || "-"}
                    </div>
                    <div style="font-size:12px;color:#475569;">
                      Código: ${d.codigo || "-"} | Categoría: ${d.categoria_nombre || "-"} | Cantidad: ${d.cantidad || 0}
                    </div>
                    ${lotesHtml}
                  </div>
                `;
                        })
                        .join("")
                    : `<div style="font-size:12px;color:#64748b;">Sin detalle.</div>`;

            Swal.fire({
                title: `Detalle de baja ${encabezado.numero_baja || ""}`,
                width: 950,
                confirmButtonText: "Cerrar",
                html: `
          <div style="text-align:left;">
            <div style="display:grid;grid-template-columns:repeat(2,minmax(200px,1fr));gap:12px;margin-bottom:14px;">
              <div><b>Fecha:</b> ${encabezado.fecha || "-"}</div>
              <div><b>Bodega:</b> ${encabezado.bodega_nombre || "-"}</div>
              <div><b>Motivo:</b> ${encabezado.motivo || "-"}</div>
              <div><b>Usuario:</b> ${encabezado.usuario_nombre || "-"}</div>
              <div><b>Estado:</b> ${encabezado.estado_nombre || "-"}</div>
              <div><b>Documento:</b> ${encabezado.documento_referencia || "-"}</div>
            </div>
            <div style="margin-bottom:10px;"><b>Observación:</b> ${encabezado.observacion || "-"}</div>
            <div>${itemsHtml}</div>
          </div>
        `,
            });
        } catch (error) {
            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                error?.message ||
                "No se pudo cargar el detalle.",
                "error"
            );
        }
    };

    const handleAnularBaja = async (row) => {
        const estado = String(row?.estado_nombre || "").trim().toUpperCase();

        if (
            estado === "ANULADO" ||
            estado === "CANCELADO POR EL USUARIO" ||
            estado === "ELIMINADO"
        ) {
            Swal.fire("Atención", "Esta baja ya se encuentra anulada.", "info");
            return;
        }

        const result = await Swal.fire({
            title: "¿Anular baja?",
            text: `Se reversará el stock de la baja ${row.numero_baja}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, anular",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#b42318",
        });

        if (!result.isConfirmed) return;

        try {
            const { data: resp } = await axiosClient.post(`/inventario/bajas/${row.id}/anular`);
            Swal.fire("Éxito", resp?.message || "Baja anulada correctamente.", "success");
            fetchServer();
        } catch (error) {
            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "No se pudo anular la baja.",
                "error"
            );
        }
    };

    return (
        <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
            <Box sx={{ maxWidth: "100%", mx: "auto" }}>
                <Paper
                    elevation={0}
                    sx={{
                        ...baseFontSx,
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
                            <RemoveCircleOutlineIcon sx={{ color: ui.primary, fontSize: 18 }} />
                        </Box>

                        <Box sx={{ minWidth: 220 }}>
                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                                Bajas de inventario
                            </Typography>
                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
                                Control y seguimiento de bajas registradas.
                            </Typography>
                        </Box>

                        <Chip
                            label={`${totalRows} REGISTROS`}
                            size="small"
                            sx={{
                                ml: "auto",
                                fontWeight: 800,
                                color: ui.successText,
                                bgcolor: ui.successSoft,
                                border: `1px solid ${ui.successBorder}`,
                            }}
                            color="default"
                            variant="outlined"
                        />

                        <Button
                            variant="contained"
                            startIcon={<FontAwesomeIcon icon={faPlusSquare} />}
                            onClick={() => setOpenNuevaBaja(true)}
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
                                "&:hover": { bgcolor: ui.primaryDark },
                            }}
                        >
                            Añadir
                        </Button>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        ...baseFontSx,
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 3,
                        p: 2,
                        boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
                    }}
                >
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                size="small"
                                label="Buscar (número, motivo, bodega, usuario...)"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                fullWidth
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

                        <Grid item xs={12} md={3}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel>Motivo</InputLabel>
                                <Select
                                    value={fMotivo}
                                    label="Motivo"
                                    onChange={(e) => setFMotivo(e.target.value)}
                                >
                                    <MenuItem value="0">Todos</MenuItem>
                                    {motivoOptions.map((m) => (
                                        <MenuItem key={m} value={m}>
                                            {m}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Filas</InputLabel>
                                <Select
                                    label="Filas"
                                    value={rowsPerPage}
                                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                    sx={{ ...baseFontSx, fontSize: 12, height: 34, borderRadius: 1.5 }}
                                >
                                    {[5, 10, 20, 50].map((n) => (
                                        <MenuItem key={n} value={n}>
                                            {n} / página
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Tooltip title="Recargar" arrow>
                                <IconButton
                                    onClick={fetchServer}
                                    sx={{
                                        border: `1px solid ${ui.border}`,
                                        borderRadius: 1.5,
                                        width: 34,
                                        height: 34,
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 1.5 }}>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflowX: "auto" }}>
                            <Table stickyHeader size="small" sx={tableSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 150 }}>Nro Baja</TableCell>
                                        <TableCell sx={{ minWidth: 150 }}>Fecha</TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>Bodega</TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>Motivo</TableCell>
                                        <TableCell align="center">Ítems</TableCell>
                                        <TableCell align="right">Cantidad</TableCell>
                                        <TableCell sx={{ minWidth: 170 }}>Usuario</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                        <TableCell align="center" sx={{ minWidth: 220 }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ height: 120 }}>
                                                <CircularProgress size={24} />
                                                <Typography sx={{ ...baseFontSx, mt: 1, fontSize: 12, color: ui.muted }}>
                                                    Cargando bajas...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : dataBajas.length > 0 ? (
                                        dataBajas.map((row, idx) => (
                                            <TableRow
                                                key={row.id}
                                                hover
                                                sx={{
                                                    bgcolor: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                                                    "&:hover": { bgcolor: "#f2f6ff" },
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 900, color: ui.head }}>
                                                    {row.numero_baja ?? "—"}
                                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                        Doc: {row.documento_referencia ?? "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>{formatDateTime(row.fecha ?? row.created_at)}</TableCell>
                                                <TableCell>{row.bodega_nombre ?? "—"}</TableCell>
                                                <TableCell>{row.motivo ?? "—"}</TableCell>
                                                <TableCell align="center">{row.total_items ?? 0}</TableCell>
                                                <TableCell align="right">{safeNum(row.total_cantidad).toFixed(2)}</TableCell>
                                                <TableCell>{row.usuario_nombre ?? "—"}</TableCell>

                                                <TableCell align="center">
                                                    <Chip
                                                        label={row.estado_nombre ?? "—"}
                                                        size="small"
                                                        color={getEstadoChipColor(row.estado_nombre)}
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => handleVerDetalle(row.id)}
                                                            sx={{
                                                                ...baseFontSx,
                                                                minWidth: 92,
                                                                height: 30,
                                                                borderRadius: 1.5,
                                                                textTransform: "none",
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                px: 1.2,
                                                                borderColor: "#BCD3FB",
                                                                color: ui.primary,
                                                                bgcolor: "#fff",
                                                                "& .MuiButton-startIcon": {
                                                                    color: ui.primary,
                                                                },
                                                                "&:hover": {
                                                                    borderColor: ui.primary,
                                                                    backgroundColor: ui.primarySoft,
                                                                },
                                                            }}
                                                        >
                                                            Detalle
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<BlockOutlinedIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => handleAnularBaja(row)}
                                                            disabled={String(row.estado_nombre || "").trim().toUpperCase() === "BAJA ANULADA"}
                                                            sx={{
                                                                ...baseFontSx,
                                                                minWidth: 92,
                                                                height: 30,
                                                                borderRadius: 1.5,
                                                                textTransform: "none",
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                px: 1.2,
                                                                borderColor: "#efb7b1",
                                                                color: "#c95f54",
                                                                bgcolor: "#fff",
                                                                "& .MuiButton-startIcon": {
                                                                    color: "#c95f54",
                                                                },
                                                                "&:hover": {
                                                                    borderColor: "#e28c82",
                                                                    backgroundColor: "rgba(212,106,95,0.08)",
                                                                },
                                                                "&.Mui-disabled": {
                                                                    borderColor: "#e5e7eb",
                                                                    color: "#9ca3af",
                                                                },
                                                            }}
                                                        >
                                                            Anular
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : showEmptyState ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                                <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 900, color: ui.head }}>
                                                    SIN RESULTADOS
                                                </Typography>
                                                <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.4 }}>
                                                    Ajusta filtros o búsqueda.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ py: 4 }} />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Pagination
                                count={countPages}
                                page={Math.min(page, countPages)}
                                onChange={(e, v) => setPage(v)}
                                showFirstButton
                                showLastButton
                                sx={{ "& .MuiPaginationItem-root": { ...baseFontSx, fontSize: 12, borderRadius: 1.25 } }}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <ModalNuevaBajaInventario
                open={openNuevaBaja}
                onClose={() => setOpenNuevaBaja(false)}
                onSaved={() => fetchServer()}
            />

            {openModalDetalleBaja && bajaSeleccionadaId && (
                <ListaBajasDetalle
                    open={openModalDetalleBaja}
                    onClose={handleCloseModalDetalleBaja}
                    idBaja={bajaSeleccionadaId}
                />
            )}
        </Box>
    );
};

export default BajasInventario;
