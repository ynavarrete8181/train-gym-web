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
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import axiosClient from "../../../../axios/axios_client";

const ui = {
    headBar: "#0a2442",
    border: "#dbe3f0",
    borderSoft: "#e8eef7",
    head: "#0b1f3a",
    muted: "#475569",
    bgSoft: "#f8fafc",
    primary: "#144985",
    danger: "#d32f2f",
    success: "#177d3f",
    warning: "#b7791f",
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

const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("es-EC");
};

const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("es-EC");
};

const getEstadoColor = (estado) => {
    const s = String(estado || "").trim().toUpperCase();

    if (s === "REGISTRADO") return "primary";
    if (s === "BAJA ANULADA") return "error";
    if (s === "DADO DE BAJA") return "warning";
    return "default";
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

const extraerDataBaja = (resp) => {
    // Caso 1: helper devuelve directamente { status, data: { encabezado, detalles } }
    if (resp?.data?.encabezado || Array.isArray(resp?.data?.detalles)) {
        return resp.data;
    }

    // Caso 2: helper devuelve axios response => { data: { status, data: { encabezado, detalles } } }
    if (resp?.data?.data?.encabezado || Array.isArray(resp?.data?.data?.detalles)) {
        return resp.data.data;
    }

    // Caso 3: por seguridad
    if (resp?.encabezado || Array.isArray(resp?.detalles)) {
        return resp;
    }

    return { encabezado: null, detalles: [] };
};

export default function ListaBajasDetalle({ open, onClose, idBaja }) {
    const [loading, setLoading] = useState(false);
    const [encabezado, setEncabezado] = useState(null);
    const [detalles, setDetalles] = useState([]);

    const reqRef = useRef(0);

    useEffect(() => {
        if (!open || !idBaja) return;

        const fetchDetalle = async () => {
            const myReq = ++reqRef.current;
            setLoading(true);

            try {
                const { data: resp } = await axiosClient.get(`/inventario/bajas/${idBaja}`);

                if (myReq !== reqRef.current) return;

                const data = extraerDataBaja(resp);

                setEncabezado(data?.encabezado ?? null);
                setDetalles(Array.isArray(data?.detalles) ? data.detalles : []);
            } catch (e) {
                if (myReq !== reqRef.current) return;
                setEncabezado(null);
                setDetalles([]);
            } finally {
                if (myReq === reqRef.current) setLoading(false);
            }
        };

        fetchDetalle();
    }, [open, idBaja]);

    const resumen = useMemo(() => {
        const totalProductos = detalles.length;
        const totalCantidad = detalles.reduce(
            (acc, item) => acc + safeNum(item?.cantidad),
            0
        );
        const totalLotes = detalles.reduce(
            (acc, item) => acc + (Array.isArray(item?.lotes) ? item.lotes.length : 0),
            0
        );

        return {
            totalProductos,
            totalCantidad,
            totalLotes,
        };
    }, [detalles]);

    const titulo = useMemo(() => {
        const numero = safeStr(encabezado?.numero_baja);
        if (numero) return `Detalle de baja # ${numero}`;
        return `Detalle de baja # ${safeStr(idBaja)}`;
    }, [encabezado, idBaja]);

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
                    Información general y detalle de productos dados de baja
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
                ) : encabezado ? (
                    <Box>
                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<DescriptionOutlinedIcon fontSize="small" />}
                                    title="Número de baja"
                                    value={safeStr(encabezado?.numero_baja || `#${idBaja}`)}
                                    subtitle={
                                        encabezado?.documento_referencia
                                            ? `Documento: ${encabezado.documento_referencia}`
                                            : "Sin documento de referencia"
                                    }
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<WarehouseOutlinedIcon fontSize="small" />}
                                    title="Bodega"
                                    value={safeStr(encabezado?.bodega_nombre || "—")}
                                    subtitle={safeStr(encabezado?.usuario_nombre || "")}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <SummaryCard
                                    icon={<AssignmentTurnedInOutlinedIcon fontSize="small" />}
                                    title="Motivo"
                                    value={safeStr(encabezado?.motivo || "—")}
                                    subtitle={formatDateTime(encabezado?.fecha || encabezado?.created_at)}
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
                                            label={safeStr(encabezado?.estado_nombre || "—")}
                                            size="small"
                                            color={getEstadoColor(encabezado?.estado_nombre)}
                                            variant="outlined"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                        Fecha de registro
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
                                        {formatDateTime(encabezado?.created_at)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={2}>
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
                                        {resumen.totalProductos}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                        Lotes
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
                                        {resumen.totalLotes}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                        Cantidad total
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
                                        {formatQty(encabezado?.total_cantidad ?? resumen.totalCantidad)}
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
                                        {safeStr(encabezado?.observacion || "Sin observación")}
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
                                <Inventory2OutlinedIcon sx={{ color: ui.primary, fontSize: 18 }} />
                                <Typography
                                    sx={{
                                        ...baseFontSx,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: ui.head,
                                    }}
                                >
                                    Productos dados de baja
                                </Typography>
                            </Box>

                            <TableContainer>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 90 }}>ID</TableCell>
                                            <TableCell sx={{ width: 150 }}>Código</TableCell>
                                            <TableCell>Producto</TableCell>
                                            <TableCell sx={{ width: 170 }}>Categoría</TableCell>
                                            <TableCell align="center" sx={{ width: 110 }}>
                                                Cantidad
                                            </TableCell>
                                            <TableCell sx={{ width: 340 }}>
                                                Lotes / detalle
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {detalles.length > 0 ? (
                                            detalles.map((item) => (
                                                <TableRow key={item.id} hover>
                                                    <TableCell
                                                        sx={{
                                                            ...baseFontSx,
                                                            fontSize: 12,
                                                            color: ui.head,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {safeStr(item?.insumo_id)}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            sx={{
                                                                ...baseFontSx,
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                color: ui.head,
                                                            }}
                                                        >
                                                            {safeStr(item?.codigo || "—")}
                                                        </Typography>
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
                                                            {safeStr(item?.insumo_descripcion)}
                                                        </Typography>

                                                        {item?.observacion ? (
                                                            <Typography
                                                                sx={{
                                                                    ...baseFontSx,
                                                                    fontSize: 11,
                                                                    color: ui.muted,
                                                                    mt: 0.25,
                                                                }}
                                                            >
                                                                Obs.: {safeStr(item.observacion)}
                                                            </Typography>
                                                        ) : null}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={safeStr(item?.categoria_nombre || "—")}
                                                            size="small"
                                                            variant="outlined"
                                                            color="info"
                                                            sx={{ fontWeight: 700 }}
                                                        />
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
                                                        {formatQty(item?.cantidad)}
                                                    </TableCell>

                                                    <TableCell>
                                                        {Array.isArray(item?.lotes) && item.lotes.length > 0 ? (
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                                                {item.lotes.map((lote) => (
                                                                    <Box
                                                                        key={lote.id}
                                                                        sx={{
                                                                            border: `1px solid ${ui.borderSoft}`,
                                                                            borderRadius: 1.5,
                                                                            p: 0.9,
                                                                            bgcolor: "#fafcff",
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 0.7,
                                                                                mb: 0.35,
                                                                            }}
                                                                        >
                                                                            <WarningAmberOutlinedIcon
                                                                                sx={{ fontSize: 15, color: ui.warning }}
                                                                            />
                                                                            <Typography
                                                                                sx={{
                                                                                    ...baseFontSx,
                                                                                    fontSize: 11.5,
                                                                                    fontWeight: 800,
                                                                                    color: ui.head,
                                                                                }}
                                                                            >
                                                                                Lote: {safeStr(lote?.codigo_lote || "—")}
                                                                            </Typography>
                                                                        </Box>

                                                                        <Typography
                                                                            sx={{
                                                                                ...baseFontSx,
                                                                                fontSize: 11,
                                                                                color: ui.muted,
                                                                            }}
                                                                        >
                                                                            Vencimiento: {formatDate(lote?.fecha_vencimiento)} | Cantidad: {formatQty(lote?.cantidad)}
                                                                        </Typography>

                                                                        <Typography
                                                                            sx={{
                                                                                ...baseFontSx,
                                                                                fontSize: 11,
                                                                                color: ui.muted,
                                                                                mt: 0.2,
                                                                            }}
                                                                        >
                                                                            Stock anterior: {formatQty(lote?.stock_anterior)} | Stock posterior: {formatQty(lote?.stock_posterior)}
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
                                                                Sin detalle por lote
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    align="center"
                                                    sx={{
                                                        ...baseFontSx,
                                                        py: 4,
                                                        color: ui.muted,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    No hay productos registrados en esta baja.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                ) : (
                    <Box sx={{ py: 5 }}>
                        <Typography sx={{ ...baseFontSx, fontSize: 12, color: ui.danger, fontWeight: 700 }}>
                            No se pudo cargar el detalle de la baja.
                        </Typography>
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
