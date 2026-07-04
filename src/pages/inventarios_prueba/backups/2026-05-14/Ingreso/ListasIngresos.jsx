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
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faListAlt } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import GridOnIcon from "@mui/icons-material/GridOn";
import CompListaIngresosDetalle from "./ListasIngresosDetalle";
import axiosClient, { getBackendUrl } from "../../../../axios/axios_client";

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

const buildQuery = (params) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        const s = String(v).trim();
        if (!s) return;
        sp.set(k, s);
    });
    return sp.toString();
};

const useDebounced = (value, delay = 350) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

const ListaIngresos = ({ usr_id, onAgregar }) => {
    const [dataIngresos, setDataIngresos] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(false);

    const [openModalListarIngresoDetalle, setOpenModalListarIngresoDetalle] = useState(false);
    const [ingresoSeleccionadoId, setIngresoSeleccionadoId] = useState(null);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(
        parseInt(localStorage.getItem("rowsPerPageIngresos") || "10", 10)
    );

    const [q, setQ] = useState("");
    const [fTipo, setFTipo] = useState("");
    const [fSede, setFSede] = useState("");
    const [fBodega, setFBodega] = useState("");
    const [fComprobante, setFComprobante] = useState("all");
    const [fFechaDesde, setFFechaDesde] = useState("");
    const [fFechaHasta, setFFechaHasta] = useState("");
    const [compact, setCompact] = useState(true);

    const debouncedQ = useDebounced(q, 350);
    const abortRef = useRef(null);
    const reqSeqRef = useRef(0);

    useEffect(() => {
        localStorage.setItem("rowsPerPageIngresos", String(rowsPerPage));
    }, [rowsPerPage]);

    const fetchServer = async ({ exportAll = false } = {}) => {
        const myReq = ++reqSeqRef.current;
        setLoading(true);

        try {
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const query = buildQuery({
                page: exportAll ? 1 : page,
                per_page: exportAll ? 999999 : rowsPerPage,
                export_all: exportAll ? 1 : 0,
                q: debouncedQ,
                tipo: fTipo,
                sede: fSede,
                bodega: fBodega,
                comprobante: fComprobante,
                fecha_desde: fFechaDesde,
                fecha_hasta: fFechaHasta,
            });

            const url = query ? `/inventario/ingresos?${query}` : "/inventario/ingresos";
            const resp = await axiosClient.get(url, { signal: abortRef.current.signal });

            if (myReq !== reqSeqRef.current) return { rows: [], total: 0 };

            const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
            const total = typeof resp?.data?.total === "number" ? resp.data.total : rows.length;

            if (!exportAll) {
                setDataIngresos(rows);
                setTotalRows(total);
            }

            return { rows, total };
        } catch (error) {
            const name = error?.name;
            const code = error?.code;

            if (name === "AbortError" || name === "CanceledError" || code === "ERR_CANCELED") {
                return { rows: [], total: 0 };
            }

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Error";

            setDataIngresos([]);
            setTotalRows(0);
            Swal.fire("Error", `Hubo un problema: ${msg}`, "error");
            return { rows: [], total: 0 };
        } finally {
            if (myReq === reqSeqRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        fetchServer();
    }, [page, rowsPerPage, debouncedQ, fTipo, fSede, fBodega, fComprobante, fFechaDesde, fFechaHasta]);

    const sedesOptions = useMemo(() => {
        const set = new Map();
        for (const r of dataIngresos) {
            const key = safeStr(r.nombre_sede);
            if (key) set.set(key, key);
        }
        return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }, [dataIngresos]);

    const bodegasOptions = useMemo(() => {
        const set = new Map();
        for (const r of dataIngresos) {
            const key = safeStr(r.bodega_nombre);
            if (key) set.set(key, key);
        }
        return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }, [dataIngresos]);

    const countPages = Math.max(1, Math.ceil((totalRows || 0) / rowsPerPage));

    const handleOpenModalListaIngresosIdDetalle = (id) => {
        setIngresoSeleccionadoId(id);
        setOpenModalListarIngresoDetalle(true);
    };

    const handleCloseModalListaIngresosIdDetalle = () => {
        setOpenModalListarIngresoDetalle(false);
        setIngresoSeleccionadoId(null);
    };

    const handleOpenComprobanteIdPDF = (ruta) => {
        const url = `${getBackendUrl()}/Files/comprobantes_ingresos/${ruta}`;
        window.open(url, "_blank");
    };

    const exportExcel = async () => {
        const { rows } = await fetchServer({ exportAll: true });

        const mapped = rows.map((r) => ({
            ID: r.ei_id,
            "Nro Ingreso": r.ei_numero_ingreso,
            "Nro Comprobante": r.ei_numero_comprobante ?? "",
            "Tipo Adquisición": r.tipo_adquisicion_nombre,
            "Fecha Emisión": r.ei_fecha_emision ?? "",
            "Fecha Vencimiento": r.ei_fecha_vencimiento ?? "",
            Usuario: r.usuario_nombre,
            Proveedor: r.proveedor_nombre,
            RUC: r.prov_ruc,
            Bodega: r.bodega_nombre,
            Sede: r.nombre_sede,
            "Facultad/Dirección": r.facultad_nombre,
            Estado: r.estado_nombre,
            "Comprobante Disponible": r.comprobante_disponible ? "Sí" : "No",
            "Total Insumos": r.total_insumos,
            "Total Cantidad": r.total_cantidad,
            "Creado": r.ei_created_at,
            "Actualizado": r.ei_updated_at,
        }));

        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
        XLSX.writeFile(wb, `ingresos_${toYMD(new Date())}.xlsx`);
    };

    const exportPdf = async () => {
        const { rows } = await fetchServer({ exportAll: true });

        const doc = new jsPDF("l", "pt", "a4");
        doc.setFontSize(14);
        doc.text("Listado de Ingresos", 40, 30);

        const head = [
            [
                "ID",
                "Nro Ingreso",
                "Nro Comprobante",
                "Tipo",
                "Proveedor",
                "Bodega",
                "Sede",
                "Emisión",
                "Venc.",
                "Comp.",
                "Insumos",
                "Cant.",
            ],
        ];

        const body = rows.map((r) => [
            safeStr(r.ei_id),
            safeStr(r.ei_numero_ingreso),
            safeStr(r.ei_numero_comprobante ?? ""),
            safeStr(r.tipo_adquisicion_nombre),
            safeStr(r.proveedor_nombre),
            safeStr(r.bodega_nombre),
            safeStr(r.nombre_sede),
            safeStr(r.ei_fecha_emision ?? ""),
            safeStr(r.ei_fecha_vencimiento ?? ""),
            r.comprobante_disponible ? "Sí" : "No",
            safeStr(r.total_insumos ?? 0),
            safeStr(r.total_cantidad ?? 0),
        ]);

        doc.autoTable({
            head,
            body,
            startY: 45,
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [20, 73, 133], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 247, 252] },
            margin: { left: 40, right: 40 },
        });

        doc.save(`ingresos_${toYMD(new Date())}.pdf`);
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
                            <MenuBookIcon sx={{ color: ui.primary, fontSize: 18 }} />
                        </Box>

                        <Box sx={{ minWidth: 220 }}>
                            <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                                Comprobantes de Ingresos
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

                        <Button
                            variant="contained"
                            sx={{
                                ...baseFontSx,
                                backgroundColor: ui.primary,
                                "&:hover": { backgroundColor: "#0f3e73" },
                                color: "white",
                                px: 2,
                                fontSize: 12,
                                borderRadius: 1.5,
                                height: 34,
                                textTransform: "none",
                                boxShadow: "none",
                            }}
                            startIcon={<FontAwesomeIcon icon={faPlusSquare} />}
                            onClick={onAgregar}
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
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                size="small"
                                label="Buscar (ingreso, comprobante, proveedor, ruc, usuario...)"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                                fullWidth
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel id="tipo-label">Tipo</InputLabel>
                                <Select
                                    labelId="tipo-label"
                                    label="Tipo"
                                    value={fTipo}
                                    onChange={(e) => {
                                        setFTipo(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="1">Factura</MenuItem>
                                    <MenuItem value="2">Donación</MenuItem>
                                    <MenuItem value="3">Donación Laboratorios</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel id="sede-label">Sede</InputLabel>
                                <Select
                                    labelId="sede-label"
                                    label="Sede"
                                    value={fSede}
                                    onChange={(e) => {
                                        setFSede(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {sedesOptions.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel id="bod-label">Bodega</InputLabel>
                                <Select
                                    labelId="bod-label"
                                    label="Bodega"
                                    value={fBodega}
                                    onChange={(e) => {
                                        setFBodega(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {bodegasOptions.map((b) => (
                                        <MenuItem key={b} value={b}>
                                            {b}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <FormControl size="small" fullWidth sx={fieldSx}>
                                <InputLabel id="comp-label">Comprobante</InputLabel>
                                <Select
                                    labelId="comp-label"
                                    label="Comprobante"
                                    value={fComprobante}
                                    onChange={(e) => {
                                        setFComprobante(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="si">Disponible</MenuItem>
                                    <MenuItem value="no">No disponible</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <TextField
                                size="small"
                                type="date"
                                label="Emisión desde"
                                value={fFechaDesde}
                                onChange={(e) => {
                                    setFFechaDesde(e.target.value);
                                    setPage(1);
                                }}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <TextField
                                size="small"
                                type="date"
                                label="Emisión hasta"
                                value={fFechaHasta}
                                onChange={(e) => {
                                    setFFechaHasta(e.target.value);
                                    setPage(1);
                                }}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={8} sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
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
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                            <Table stickyHeader size="small" sx={tableSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 170 }}>Nro Ingreso</TableCell>
                                        <TableCell sx={{ minWidth: 180 }}>Tipo</TableCell>
                                        <TableCell sx={{ minWidth: 240 }}>Proveedor</TableCell>
                                        <TableCell sx={{ minWidth: 200 }}>Bodega</TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>Sede</TableCell>
                                        <TableCell align="center" sx={{ width: 110 }}>
                                            Emisión
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 110 }}>
                                            Venc.
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 90 }}>
                                            PDF
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 110 }}>
                                            Acciones
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ height: 140 }}>
                                                <CircularProgress size={26} />
                                                <Typography sx={{ ...baseFontSx, mt: 1, fontSize: 12, color: ui.muted }}>
                                                    Cargando ingresos...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : dataIngresos.length > 0 ? (
                                        dataIngresos.map((row, idx) => {
                                            const canPdf = Boolean(row.comprobante_disponible);
                                            return (
                                                <TableRow
                                                    key={row.ei_id}
                                                    hover
                                                    sx={{
                                                        bgcolor: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                                                        "&:hover": { bgcolor: "#f2f6ff" },
                                                        "& td": compact ? { py: 0.55 } : {},
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 800, color: ui.head }}>
                                                        {row.ei_numero_ingreso}
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            {safeStr(row.ei_numero_comprobante)
                                                                ? `Comp: ${row.ei_numero_comprobante}`
                                                                : "Sin comprobante"}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={row.tipo_adquisicion_nombre}
                                                            variant="outlined"
                                                            color={
                                                                String(row.ei_tipo_adquisicion) === "1"
                                                                    ? "primary"
                                                                    : String(row.ei_tipo_adquisicion) === "2"
                                                                        ? "success"
                                                                        : "warning"
                                                            }
                                                            sx={{ fontWeight: 800, ...baseFontSx, fontSize: 11 }}
                                                        />
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.35 }}>
                                                            {row.estado_nombre}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.proveedor_nombre}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            RUC: {row.prov_ruc}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.bodega_nombre}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            {row.facultad_nombre}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 12, fontWeight: 800, color: ui.head }}>
                                                            {row.nombre_sede}
                                                        </Typography>
                                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                            Usuario: {row.usuario_nombre}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell align="center">{row.ei_fecha_emision ?? "—"}</TableCell>
                                                    <TableCell align="center">{row.ei_fecha_vencimiento ?? "—"}</TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip title={canPdf ? "Ver comprobante PDF" : "No existe comprobante"} arrow>
                                                            <span>
                                                                <IconButton
                                                                    onClick={() => canPdf && handleOpenComprobanteIdPDF(row.ei_ruta_comprobante)}
                                                                    disabled={!canPdf}
                                                                    sx={{
                                                                        color: canPdf ? "rgba(220,0,0,0.85)" : "#94a3b8",
                                                                        p: 0,
                                                                        "&:hover": canPdf
                                                                            ? { color: "rgba(255,0,0,1)", backgroundColor: "rgba(255,0,0,0.1)" }
                                                                            : {},
                                                                    }}
                                                                >
                                                                    <PictureAsPdfIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip title="Ver detalle" arrow>
                                                            <IconButton
                                                                onClick={() => handleOpenModalListaIngresosIdDetalle(row.ei_id)}
                                                                color="warning"
                                                                size="small"
                                                                sx={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    p: 0,
                                                                    borderRadius: 1,
                                                                    "& .MuiSvgIcon-root": { fontSize: 20 },
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faListAlt} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
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
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        ...baseFontSx,
                                        fontSize: 12,
                                        borderRadius: 1.25,
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
                {openModalListarIngresoDetalle && ingresoSeleccionadoId && (
                    <CompListaIngresosDetalle
                        open={openModalListarIngresoDetalle}
                        onClose={handleCloseModalListaIngresosIdDetalle}
                        idIngreso={ingresoSeleccionadoId}
                    />
                )}
            </Box>
        </Box>
    );
};

export default ListaIngresos;
