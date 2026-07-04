import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Pagination,
    CircularProgress,
    Tooltip,
    Chip,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
} from "@mui/material";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListAlt, faClipboardList, faClipboardCheck } from "@fortawesome/free-solid-svg-icons";

import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import CompListaEgresosDetalle from "./ListasEgresosDetalle";
import CompAtencioEgreso from "./AtencionesEgreso";

import axiosClient from "../../../../axios/axios_client";

const ui = {
    bg: "#f6f8fc",
    paper: "#ffffff",
    head: "#0b1f3a",
    muted: "#475569",
    border: "#dbe3f0",
    borderSoft: "#e8eef7",
    primary: "#144985",
};

const baseFontSx = {
    fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
    letterSpacing: 0,
    fontStyle: "normal",
};

const fieldSx = {
    "& .MuiInputBase-root": {
        ...baseFontSx,
        fontSize: 12,
        height: 34,
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
        py: 0.75,
        verticalAlign: "middle",
    },
};

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

const toYMD = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

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

const useDebounced = (value, delay = 350) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

const getEstadoChip = (estado) => {
    const raw = String(estado || "").trim().toLowerCase();

    if (raw === "por atender") {
        return <Chip label="POR ATENDER" size="small" color="warning" variant="outlined" />;
    }

    if (raw === "atendido") {
        return <Chip label="ATENDIDO" size="small" color="success" variant="outlined" />;
    }

    if (raw === "no asistio" || raw === "no asistió") {
        return <Chip label="NO ASISTIÓ" size="small" color="error" variant="outlined" />;
    }

    return <Chip label={estado || "N/A"} size="small" variant="outlined" />;
};

function Egresos() {
    const [dataEgresos, setDataEgresos] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    const [openModalListarEgresoDetalle, setOpenModalListarEgresoDetalle] = useState(false);
    const [openModalAtencionEgreso, setOpenModalAtencionEgreso] = useState(false);
    const [egresoSeleccionadoId, setEgresoSeleccionadoId] = useState(null);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        const saved = localStorage.getItem("rowsPerPageEgresos");
        return saved ? parseInt(saved, 10) : 5;
    });

    const [q, setQ] = useState("");
    const [fEstado, setFEstado] = useState("0");
    const [compact, setCompact] = useState(true);

    const debouncedQ = useDebounced(q, 350);
    const abortRef = useRef(null);
    const reqIdRef = useRef(0);

    useEffect(() => {
        localStorage.setItem("rowsPerPageEgresos", String(rowsPerPage));
    }, [rowsPerPage]);

    const fetchServer = async ({ exportAll = false } = {}) => {
        const start = Date.now();
        const myReqId = ++reqIdRef.current;
        setLoading(true);

        try {
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const params = {
                page: exportAll ? 1 : page,
                per_page: exportAll ? 999999 : rowsPerPage,
            };

            const qq = (debouncedQ || "").trim();
            if (qq) params.q = qq;
            if (fEstado && fEstado !== "0") params.estado = fEstado;

            const res = await axiosClient.get("/inventario/egresos", {
                params,
                signal: abortRef.current.signal,
            });

            const resp = res?.data;
            const rows = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
            const total = typeof resp?.total === "number" ? resp.total : rows.length;

            if (!exportAll) {
                setDataEgresos(rows);
                setTotalRows(total);
            }

            return { rows, total };
        } catch (error) {
            const isAbort =
                error?.name === "CanceledError" ||
                error?.name === "AbortError" ||
                error?.code === "ERR_CANCELED";

            if (isAbort) return { rows: [], total: 0 };

            setDataEgresos([]);
            setTotalRows(0);

            const status = error?.response?.status;
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Error desconocido";

            Swal.fire("Error", `Hubo un problema: ${msg}${status ? ` (HTTP ${status})` : ""}`, "error");
            return { rows: [], total: 0 };
        } finally {
            const elapsed = Date.now() - start;
            const minMs = 250;
            if (elapsed < minMs) await new Promise((r) => setTimeout(r, minMs - elapsed));
            if (myReqId !== reqIdRef.current) return;
            setHasFetched(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServer();
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [page, rowsPerPage, debouncedQ, fEstado]);

    useEffect(() => {
        setPage(1);
    }, [rowsPerPage, debouncedQ, fEstado]);

    const estadoOptions = useMemo(() => {
        const map = new Map();
        (Array.isArray(dataEgresos) ? dataEgresos : []).forEach((r) => {
            const label = (r?.nombre_estado || "").trim();
            if (!label) return;
            if (!map.has(label)) map.set(label, label);
        });
        return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    }, [dataEgresos]);

    const countPages = Math.max(1, Math.ceil((totalRows || 0) / rowsPerPage));

    const handleOpenModalListaEgresosIdDetalle = (id) => {
        setEgresoSeleccionadoId(id);
        setOpenModalListarEgresoDetalle(true);
    };

    const handleCloseModalListaEgresosIdDetalle = () => {
        setOpenModalListarEgresoDetalle(false);
        setEgresoSeleccionadoId(null);
    };

    const handleOpenModalAtencionEgreso = (id) => {
        setEgresoSeleccionadoId(id);
        setOpenModalAtencionEgreso(true);
    };

    const handleCloseModalAtencionEgreso = () => {
        setOpenModalAtencionEgreso(false);
        setEgresoSeleccionadoId(null);
        fetchServer();
    };

    const exportExcel = async () => {
        const { rows } = await fetchServer({ exportAll: true });
        if (!Array.isArray(rows) || rows.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const mapped = rows.map((r) => {
            const detalle = parseDetalle(r.ee_detalle);
            return {
                ID: r.ee_id,
                "Nro Egreso": r.ee_numero_egreso,
                Fecha: r.ee_created_at ?? "",
                Cédula: r.cedula_paciente ?? "",
                Paciente: r.nombre_paciente ?? "",
                Médico: r.nombre_funcionario ?? "",
                Entrega: r.nombre_usuario ?? "",
                Sede: r.sede_nombre ?? "",
                Facultad: r.facultad_nombre ?? "",
                Bodega: r.bodega_nombre ?? "",
                "Productos": detalle.length,
                Estado: r.nombre_estado ?? "",
                Observación: r.ee_observacion ?? "",
            };
        });

        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Egresos");
        XLSX.writeFile(wb, `egresos_${toYMD(new Date())}.xlsx`);
    };

    const exportPdf = async () => {
        const { rows } = await fetchServer({ exportAll: true });
        if (!Array.isArray(rows) || rows.length === 0) {
            Swal.fire("Sin datos", "No hay datos para exportar.", "info");
            return;
        }

        const doc = new jsPDF("l", "pt", "a4");
        doc.setFontSize(14);
        doc.text("Listado de Egresos", 40, 30);

        const head = [
            [
                "ID",
                "Nro Egreso",
                "Fecha",
                "Paciente",
                "Médico",
                "Bodega",
                "Productos",
                "Estado",
            ],
        ];

        const body = rows.map((r) => {
            const detalle = parseDetalle(r.ee_detalle);
            return [
                safeStr(r.ee_id),
                safeStr(r.ee_numero_egreso),
                safeStr(r.ee_created_at ?? ""),
                safeStr(r.nombre_paciente ?? ""),
                safeStr(r.nombre_funcionario ?? ""),
                safeStr(r.bodega_nombre ?? ""),
                safeStr(detalle.length),
                safeStr(r.nombre_estado ?? ""),
            ];
        });

        doc.autoTable({
            head,
            body,
            startY: 45,
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [20, 73, 133], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 247, 252] },
            margin: { left: 40, right: 40 },
        });

        doc.save(`egresos_${toYMD(new Date())}.pdf`);
    };

    const esc = (v) =>
        String(v ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const handleVerAtencionSwal = (row) => {
        const detalle = parseDetalle(row?.ee_detalle);
        const resumen = detalle
            .slice(0, 5)
            .map((x) => `${esc(x?.nombre || x?.insumo || x?.descripcion || "Producto")} (${esc(x?.cantidad || 0)})`)
            .join("<br/>");

        Swal.fire({
            title: `Detalle de la Atención - Egreso # ${esc(row.ee_numero_egreso)}`,
            width: 920,
            showCloseButton: true,
            confirmButtonText: "Cerrar",
            html: `
        <div style="text-align:left;">
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tbody>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; width:180px; background:#f6f8fc;">Fecha</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.ee_created_at)}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Paciente</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.nombre_paciente)} | Cédula: ${esc(row.cedula_paciente)}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Médico</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.nombre_funcionario)}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Entrega</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.nombre_usuario || "—")}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Bodega</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.sede_nombre || "—")} - ${esc(row.bodega_nombre || "—")}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Estado</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.nombre_estado || "—")}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e6ebf2; font-weight:700; background:#f6f8fc;">Observación</td>
                <td style="padding:8px; border:1px solid #e6ebf2;">${esc(row.ee_observacion || "—")}</td>
              </tr>
            </tbody>
          </table>

          <div style="border:1px solid #e6ebf2; border-radius:8px; padding:12px; background:#fafcff;">
            <div style="font-weight:700; margin-bottom:6px;">Productos solicitados: ${detalle.length}</div>
            <div style="font-size:12px; color:#334155;">
              ${resumen || "Sin detalle disponible"}
            </div>
          </div>
        </div>
      `,
        });
    };

    const showEmptyState = hasFetched && !loading && dataEgresos.length === 0;

    return (
        <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
            <Box sx={{ maxWidth: "100%", mx: "auto" }}>
                <Paper
                    elevation={0}
                    sx={{
                        ...baseFontSx,
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 2,
                        px: 2,
                        py: 1.25,
                        mb: 1.5,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                border: `1px solid ${ui.border}`,
                                bgcolor: "rgba(20,73,133,.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ReceiptLongIcon sx={{ color: ui.primary, fontSize: 18 }} />
                        </Box>

                        <Box sx={{ minWidth: 220 }}>
                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                                Egresos
                            </Typography>
                            <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
                                {totalRows} resultados
                            </Typography>
                        </Box>

                        <Chip
                            label={`${totalRows} LISTADOS`}
                            size="small"
                            sx={{ ml: "auto", fontWeight: 800 }}
                            color="primary"
                            variant="outlined"
                        />

                        <Button
                            variant="outlined"
                            startIcon={<PictureAsPdfIcon sx={{ color: "#d32f2f" }} />}
                            onClick={exportPdf}
                            sx={{
                                ...baseFontSx,
                                height: 34,
                                borderRadius: 1.5,
                                fontSize: 12,
                                px: 2,
                                textTransform: "none",
                                borderColor: "#d32f2f",
                                color: "#d32f2f",
                                fontWeight: 700,
                                "&:hover": {
                                    bgcolor: "rgba(211,47,47,0.08)",
                                    borderColor: "#b71c1c",
                                    color: "#b71c1c",
                                },
                            }}
                        >
                            PDF
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<GridOnIcon sx={{ color: "#2e7d32" }} />}
                            onClick={exportExcel}
                            sx={{
                                ...baseFontSx,
                                height: 34,
                                borderRadius: 1.5,
                                fontSize: 12,
                                px: 2,
                                textTransform: "none",
                                borderColor: "#2e7d32",
                                color: "#2e7d32",
                                fontWeight: 700,
                                "&:hover": {
                                    bgcolor: "rgba(46,125,50,0.08)",
                                    borderColor: "#1b5e20",
                                    color: "#1b5e20",
                                },
                            }}
                        >
                            Excel
                        </Button>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        ...baseFontSx,
                        bgcolor: ui.paper,
                        border: `1px solid ${ui.border}`,
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                size="small"
                                label="Buscar (egreso, cédula, paciente, médico, usuario, sede, bodega...)"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                fullWidth
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel id="estado-label">Estado</InputLabel>
                                <Select
                                    labelId="estado-label"
                                    label="Estado"
                                    value={fEstado}
                                    onChange={(e) => setFEstado(e.target.value)}
                                >
                                    <MenuItem value="0">Todos</MenuItem>
                                    {estadoOptions.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <FormControlLabel
                                control={<Switch checked={compact} onChange={(e) => setCompact(e.target.checked)} />}
                                label={
                                    <Typography sx={{ ...baseFontSx, fontSize: 12, color: ui.muted }}>
                                        Vista compacta
                                    </Typography>
                                }
                            />

                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel id="rpp-label">Filas</InputLabel>
                                <Select
                                    labelId="rpp-label"
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
                    </Grid>

                    <Box sx={{ mt: 1.5 }}>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ borderRadius: 1.5, overflowX: "auto" }}
                        >
                            <Table stickyHeader size="small" sx={tableSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 180 }}>Nro Egreso</TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>Paciente</TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>Médico</TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>Bodega</TableCell>
                                        <TableCell align="center" sx={{ width: 120 }}>
                                            Productos
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 140 }}>
                                            Fecha
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 130 }}>
                                            Estado
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 130 }}>
                                            Ver Atención
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 120 }}>
                                            Aprobar
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 110 }}>
                                            Detalle
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ height: 120 }}>
                                                <CircularProgress size={24} />
                                                <Typography sx={{ ...baseFontSx, mt: 1, fontSize: 12, color: ui.muted }}>
                                                    Cargando egresos...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : dataEgresos.length > 0 ? (
                                        dataEgresos.map((row, idx) => {
                                            const estadoRaw = String(row?.nombre_estado || "").trim().toLowerCase();
                                            const isAtendido = estadoRaw === "atendido";
                                            const isNoAsistio = estadoRaw === "no asistio" || estadoRaw === "no asistió";
                                            const isPorAtender = estadoRaw === "por atender";
                                            const canVerAtencion = isAtendido || isNoAsistio;
                                            const canAprobar = isPorAtender;

                                            const detalle = parseDetalle(row?.ee_detalle);

                                            return (
                                                <TableRow
                                                    key={row.ee_id}
                                                    hover
                                                    sx={{
                                                        bgcolor: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                                                        "&:hover": { bgcolor: "#f2f6ff" },
                                                        "& td": compact ? { py: 0.55 } : {},
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 900, color: ui.head }}>
                                                        {row.ee_numero_egreso}
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            ID: {row.ee_id}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.nombre_paciente ?? "—"}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            Cédula: {row.cedula_paciente ?? "—"}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.nombre_funcionario ?? "—"}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            {row.email_funcionario ?? ""}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.bodega_nombre ?? "—"}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            {row.sede_nombre ?? "—"} {row.facultad_nombre ? `• ${row.facultad_nombre}` : ""}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={<MedicationOutlinedIcon />}
                                                            label={`${detalle.length} item(s)`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>

                                                    <TableCell align="center">{row.ee_created_at ?? "—"}</TableCell>

                                                    <TableCell align="center">{getEstadoChip(row.nombre_estado)}</TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip
                                                            arrow
                                                            title={
                                                                canVerAtencion
                                                                    ? "Ver atención"
                                                                    : "Disponible solo cuando el estado es Atendido o No Asistió"
                                                            }
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    disabled={!canVerAtencion}
                                                                    onClick={() => handleVerAtencionSwal(row)}
                                                                    size="small"
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        p: 0,
                                                                        borderRadius: 1,
                                                                        color: canVerAtencion ? "#1d4ed8" : "#94a3b8",
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip arrow title={canAprobar ? "Aprobar / Atender egreso" : "No disponible"}>
                                                            <span>
                                                                <IconButton
                                                                    disabled={!canAprobar}
                                                                    onClick={() => handleOpenModalAtencionEgreso(row.ee_id)}
                                                                    size="small"
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        p: 0,
                                                                        borderRadius: 1,
                                                                        color: canAprobar ? "#166534" : "#94a3b8",
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faClipboardCheck} style={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip title="Ver detalle de insumos" arrow>
                                                            <IconButton
                                                                onClick={() => handleOpenModalListaEgresosIdDetalle(row.ee_id)}
                                                                size="small"
                                                                sx={{ width: 40, height: 40, p: 0, borderRadius: 1, color: "#b45309" }}
                                                            >
                                                                <FontAwesomeIcon icon={faListAlt} style={{ fontSize: 20 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : showEmptyState ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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
                                            <TableCell colSpan={10} sx={{ py: 4 }} />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {openModalListarEgresoDetalle && egresoSeleccionadoId && (
                                <CompListaEgresosDetalle
                                    open={openModalListarEgresoDetalle}
                                    onClose={handleCloseModalListaEgresosIdDetalle}
                                    idEgreso={egresoSeleccionadoId}
                                />
                            )}
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

            {openModalAtencionEgreso && egresoSeleccionadoId && (
                <CompAtencioEgreso
                    open={openModalAtencionEgreso}
                    onClose={handleCloseModalAtencionEgreso}
                    idEgreso={egresoSeleccionadoId}
                />
            )}
        </Box>
    );
}

export default Egresos;
