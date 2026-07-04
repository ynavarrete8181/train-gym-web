import {
    Box,
    Button,
    Dialog,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Stack,
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    success: "#16a34a",
    muted: "#64748b",
    border: "#e2e8f0",
    text: "#0f172a",
    primary: "var(--tg-primary)",
};

const baseFontSx = {
    fontFamily: '"Inter", "system-ui", sans-serif',
};

const tableSx = {
    "& .MuiTableCell-head": {
        color: ui.muted,
        fontWeight: 700,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: `2px solid ${ui.border}`,
        py: 1.5,
        bgcolor: "#f8fafc",
    },
    "& .MuiTableCell-body": {
        fontSize: "13px",
        color: ui.text,
        borderBottom: `1px solid ${ui.border}`,
        py: 1.5,
    },
};

const formatMoney = (value) => {
    const number = Number(value || 0);
    if (Number.isNaN(number)) return "0.00";
    return number.toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatQty = (value) => {
    const number = Number(value || 0);
    if (Number.isNaN(number)) return "0";
    return number.toLocaleString("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

export default function ModalVerDetalleIngreso({ open, onClose, grupo }) {
    if (!grupo) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: ui.bg,
                    borderRadius: "8px",
                },
            }}
        >
            <Box sx={{ ...baseFontSx, p: { xs: 2, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                        <Typography variant="h5" sx={{ ...baseFontSx, fontWeight: 800, color: ui.black, fontSize: "20px" }}>
                            Detalle del Ingreso
                        </Typography>
                        <Typography sx={{ ...baseFontSx, fontSize: 13, color: ui.muted, mt: 0.5 }}>
                            Información detallada de la transacción y sus productos
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: ui.muted, bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "8px", border: `1px solid ${ui.border}`, bgcolor: "#ffffff" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={4} sx={{ mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                Fecha
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: ui.black }}>
                                {dayjs(grupo.created_at).format("DD/MM/YYYY HH:mm")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                Sede
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: ui.black }}>
                                {grupo.sede_nombre}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                Documento
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: ui.black }}>
                                {grupo.documento}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                Proveedor / Origen
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: ui.black }}>
                                {grupo.proveedor}
                            </Typography>
                        </Box>
                        <Box sx={{ ml: "auto !important", textAlign: "right" }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                Total Estimado
                            </Typography>
                            <Typography sx={{ fontSize: 18, fontWeight: 800, color: ui.success }}>
                                ${grupo.total_estimado}
                            </Typography>
                        </Box>
                    </Stack>
                    
                    {grupo.observacion_extra && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: ui.muted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
                                    Observación
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: ui.black }}>
                                    {grupo.observacion_extra}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Paper>

                <Typography sx={{ fontSize: 14, fontWeight: 700, color: ui.black, mb: 1.5, px: 0.5 }}>
                    Insumos ingresados ({grupo.items.length})
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "8px", border: `1px solid ${ui.border}`, mb: 3 }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Insumo</TableCell>
                                <TableCell>Lote</TableCell>
                                <TableCell>F. Elaboración</TableCell>
                                <TableCell>F. Vencimiento</TableCell>
                                <TableCell align="right">Cant.</TableCell>
                                <TableCell align="right">Costo Un.</TableCell>
                                <TableCell align="right">PVP Un.</TableCell>
                                <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grupo.items.map((item, idx) => {
                                const subtotal = Number(item.cantidad || 0) * Number(item.costo_unitario || 0);
                                return (
                                    <TableRow key={idx} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, fontSize: 12, color: ui.black }}>
                                                {item.producto_codigo ? `${item.producto_codigo} - ` : ""}{item.producto_nombre}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {item.codigo_lote ? (
                                                <Typography sx={{ fontWeight: 600, fontSize: 12, color: ui.primary }}>
                                                    {item.codigo_lote}
                                                </Typography>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.fecha_elaboracion ? dayjs(item.fecha_elaboracion).format("DD/MM/YYYY") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.fecha_vencimiento ? dayjs(item.fecha_vencimiento).format("DD/MM/YYYY") : "-"}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {formatQty(item.cantidad)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ${formatMoney(item.costo_unitario)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ${formatMoney(item.precio_unitario)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: ui.success }}>
                                            ${formatMoney(subtotal)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Stack direction="row" justifyContent="flex-end">
                    <Button className="btn-close" startIcon={<CloseIcon />} onClick={onClose} disableElevation>
                        Cerrar
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
}
