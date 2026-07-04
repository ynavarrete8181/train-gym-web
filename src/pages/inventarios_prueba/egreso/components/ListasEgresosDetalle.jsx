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
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import axiosClient from "../../../../../axios/axios_client";

const ui = {
    headBar: "#0a2442",
    border: "#dbe3f0",
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
    return safeStr(tipo) || "—";
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
        tipoInsumo: x?.tipoInsumo ?? "",
        tipoLabel: x?.tipoLabel ?? getTipoLabel(x?.tipoInsumo),
        bodega_nombre: x?.bodega_nombre ?? "",
        sede_nombre: x?.sede_nombre ?? "",
        desglose_lotes: Array.isArray(x?.desglose_lotes) ? x.desglose_lotes : [],
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

export default function CompListaEgresosDetalle({ open, onClose, idEgreso }) {
    const [loading, setLoading] = useState(false);
    const [egreso, setEgreso] = useState(null);
    const [items, setItems] = useState([]);

    const abortRef = useRef(null);
    const reqRef = useRef(0);

    useEffect(() => {
        if (!open || !idEgreso) return;

        const fetchDetalle = async () => {
            const myReq = ++reqRef.current;
            setLoading(true);

            try {
                if (abortRef.current) abortRef.current.abort();
                abortRef.current = new AbortController();

                const res = await axiosClient.get(`/inventario/egresos/${idEgreso}`, {
                    signal: abortRef.current.signal,
                });

                if (myReq !== reqRef.current) return;

                const data = res?.data;
                const row = Array.isArray(data)
                    ? data[0]
                    : data?.data?.[0] ?? data?.data ?? data;

                setEgreso(row || null);

                const det = parseDetalle(row?.ee_detalle);
                setItems(normalizeDetalle(det));
            } catch (e) {
                const isAbort =
                    e?.name === "AbortError" || e?.code === "ERR_CANCELED";

                if (isAbort) return;

                setEgreso(null);
                setItems([]);
            } finally {
                if (myReq === reqRef.current) setLoading(false);
            }
        };

        fetchDetalle();

        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [open, idEgreso]);

    const titulo = useMemo(() => {
        const numero = safeStr(egreso?.ee_numero_egreso);
        if (numero) return `Detalle del Egreso # ${numero}`;
        const id = safeStr(egreso?.ee_id ?? idEgreso);
        return `Detalle del Egreso # ${id}`;
    }, [egreso, idEgreso]);

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
                    Información general y detalle de productos entregados
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
                        <Typography
                            sx={{ ...baseFontSx, color: ui.muted, fontSize: 13 }}
                        >
                            Cargando detalle...
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<LocalHospitalOutlinedIcon fontSize="small" />}
                                    title="Paciente"
                                    value={safeStr(egreso?.nombre_paciente || "—")}
                                    subtitle={safeStr(egreso?.cedula_paciente || "")}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<MedicalServicesOutlinedIcon fontSize="small" />}
                                    title="Médico"
                                    value={safeStr(egreso?.nombre_funcionario || "—")}
                                    subtitle={safeStr(egreso?.nombre_estado || "—")}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<Inventory2OutlinedIcon fontSize="small" />}
                                    title="Bodega"
                                    value={`${safeStr(egreso?.sede_nombre || "—")} - ${safeStr(
                                        egreso?.bodega_nombre || "—"
                                    )}`}
                                    subtitle={safeStr(egreso?.nombre_usuario || "")}
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
                                            label={safeStr(egreso?.nombre_estado || "—")}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                        Fecha
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
                                        {safeStr(egreso?.ee_created_at || "—")}
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
                                        Observación
                                    </Typography>
                                    <Typography
                                        sx={{
                                            ...baseFontSx,
                                            fontSize: 12.5,
                                            color: ui.head,
                                            mt: 0.3,
                                        }}
                                    >
                                        {safeStr(egreso?.ee_observacion || "Sin observación")}
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
                                <ReceiptLongOutlinedIcon
                                    sx={{ color: ui.primary, fontSize: 18 }}
                                />
                                <Typography
                                    sx={{
                                        ...baseFontSx,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: ui.head,
                                    }}
                                >
                                    Productos entregados
                                </Typography>
                            </Box>

                            <TableContainer>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 90 }}>Id</TableCell>
                                            <TableCell sx={{ width: 150 }}>Tipo</TableCell>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell align="center" sx={{ width: 110 }}>
                                                Cantidad
                                            </TableCell>
                                            <TableCell sx={{ width: 300 }}>
                                                Lotes / detalle
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {items.length > 0 ? (
                                            items.map((it) => (
                                                <TableRow key={it.key} hover>
                                                    <TableCell
                                                        sx={{
                                                            ...baseFontSx,
                                                            fontSize: 12,
                                                            color: ui.head,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {safeStr(it.idInsumo)}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={safeStr(it.tipoLabel)}
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
                                                                            Cantidad: {safeStr(lote?.cantidad || 0)}
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
                                                    No hay insumos en este egreso.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
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
