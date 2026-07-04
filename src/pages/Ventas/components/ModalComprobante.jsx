import React from "react";
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Stack,
    Divider,
    IconButton
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import dayjs from "dayjs";
import PremiumButton from "../../../components/ui/PremiumButton";
import { semanticIconButtonSx } from "../../../Styles/muiTheme";

const formatMoney = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

export default function ModalComprobante({ open, onClose, venta }) {
    if (!venta) return null;
    const estadoPago = String(venta.estado_pago || "").toUpperCase();
    const formaPago = estadoPago === "PENDIENTE" ? "Por pagar" : (venta.forma_pago || "Efectivo");

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: "12px", p: 1 }
            }}
        >
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                            visibility: visible;
                        }
                        #printable-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 20px;
                        }
                        /* Hide the close and print buttons in print view */
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>
            
            <DialogActions sx={{ px: 2, pt: 1, pb: 0 }} className="no-print">
                <Box sx={{ flexGrow: 1 }} />
                <PremiumButton 
                    variant="outline" 
                    onClick={handlePrint}
                    sx={{ height: 32, px: 2 }}
                >
                    <PrintOutlinedIcon sx={{ fontSize: 18, mr: 1 }} />
                    Imprimir
                </PremiumButton>
                <IconButton onClick={onClose} sx={semanticIconButtonSx("danger")}>
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogActions>

            <DialogContent>
                <Box id="printable-receipt" sx={{ maxWidth: 500, mx: "auto", p: { xs: 2, md: 4 }, fontFamily: "sans-serif" }}>
                    
                    {/* Header: Logo and Info */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        {/* Fake logo placeholder or actual logo if available */}
                        <Box sx={{
                            width: 60,
                            height: 60,
                            bgcolor: "#000",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 24,
                        }}>
                            {/* Assuming the logo looks like the image */}
                            <Box sx={{ 
                                position: 'relative', 
                                width: 30, 
                                height: 30, 
                            }}>
                                <Box sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    border: '3px solid #fff', 
                                    borderRadius: '50%', 
                                    position: 'absolute',
                                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 50%)'
                                }}/>
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    bgcolor: "#e0a100",
                                    borderRadius: "50%",
                                    position: 'absolute',
                                    top: -4,
                                    right: -4
                                }} />
                                <Box sx={{
                                    width: 12,
                                    height: 3,
                                    bgcolor: "#e0a100",
                                    position: 'absolute',
                                    bottom: 4,
                                    left: 4,
                                    transform: 'rotate(-45deg)'
                                }} />
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a", letterSpacing: "0.5px" }}>
                                REVIVE SORTS
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: "#0f172a" }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>XPadel</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>098573894</Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>

                    <Divider sx={{ mb: 3 }} />

                    {/* Content Table */}
                    <Stack spacing={2} sx={{ color: "#0f172a", fontSize: 14 }}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Contacto</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {venta.cliente_nombre?.trim() || "Consumidor final"}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Fecha</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {venta.fecha ? dayjs(venta.fecha).format("DD MMMM YYYY - HH:mm") : "Sin fecha"}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Vendedor</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {venta.vendedor_nombre?.trim() || "Karol Moreira"}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Método de pago</Typography>
                            <Typography sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                                {formaPago}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Estado</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {estadoPago === "PENDIENTE" ? "Pendiente de pago" : (estadoPago === "ABONADO" ? "Abonada" : "Pagada")}
                            </Typography>
                        </Stack>

                        {Number(venta.saldo_pendiente || 0) > 0 ? (
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Saldo pendiente</Typography>
                                <Typography sx={{ fontWeight: 700, color: "#b91c1c" }}>
                                    {formatMoney(venta.saldo_pendiente)}
                                </Typography>
                            </Stack>
                        ) : null}

                        <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Número de transacción</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {venta.id}
                            </Typography>
                        </Stack>

                        {(!venta.detalles || venta.detalles.length === 0) && (
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography sx={{ color: "#64748b", fontWeight: 500, minWidth: 100 }}>Concepto</Typography>
                                <Typography sx={{ fontWeight: 600, textAlign: "right", maxWidth: 280 }}>
                                    {venta.observacion || venta.referencia || "Pago de consumo en sede"}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>

                    {venta.detalles && venta.detalles.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ 
                                display: "grid", 
                                gridTemplateColumns: "2fr 1fr 1fr", 
                                gap: 1, 
                                borderBottom: "1px solid #e2e8f0", 
                                pb: 1, 
                                mb: 1,
                                color: "#64748b",
                                fontSize: 13,
                                fontWeight: 600
                            }}>
                                <Typography sx={{ fontSize: "inherit", fontWeight: "inherit" }}>Detalle</Typography>
                                <Typography sx={{ fontSize: "inherit", fontWeight: "inherit", textAlign: "right" }}>Cant.</Typography>
                                <Typography sx={{ fontSize: "inherit", fontWeight: "inherit", textAlign: "right" }}>Subtotal</Typography>
                            </Box>
                            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                {venta.detalles.map((det) => (
                                    <Box key={det.id} sx={{ 
                                        display: "grid", 
                                        gridTemplateColumns: "2fr 1fr 1fr", 
                                        gap: 1,
                                        fontSize: 14,
                                        color: "#0f172a"
                                    }}>
                                        <Stack spacing={0.2}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: det.tipo_detalle === "MEMBRESIA" ? "#b45309" : "#64748b", textTransform: "uppercase" }}>
                                                {det.tipo_detalle === "MEMBRESIA" || det.membresia_id ? "Membresía" : "Producto"}
                                            </Typography>
                                            <Typography sx={{ fontSize: "inherit", fontWeight: 600, lineHeight: 1.2 }}>
                                                {det.nombre}
                                            </Typography>
                                        </Stack>
                                        <Typography sx={{ fontSize: "inherit", textAlign: "right" }}>{det.cantidad}</Typography>
                                        <Typography sx={{ fontSize: "inherit", textAlign: "right" }}>{formatMoney(det.subtotal)}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Total */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: 800, fontSize: 24, color: "#0f172a" }}>
                            Total:
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: 24, color: "#0f172a" }}>
                            {formatMoney(venta.total)}
                        </Typography>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
