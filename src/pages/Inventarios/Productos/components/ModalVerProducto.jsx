import { Box, Typography, Grid, Chip } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PremiumModal from "../../../../components/ui/PremiumModal";
import PremiumButton from "../../../../components/ui/PremiumButton";
import { tgAccent } from "../../../../Styles/muiTheme";

const ui = {
    black: "#0f172a",
    mustard: tgAccent.mustard,
    border: "#e2e8f0",
    muted: "#64748b",
    bg: "#ffffff", // changed to white to match the flat clean look
};

const SectionHeader = ({ title }) => (
    <Typography 
        sx={{ 
            fontSize: "12px", 
            fontWeight: 800, 
            color: ui.black, 
            textTransform: "uppercase", 
            letterSpacing: "0.5px",
            mb: 2,
            mt: 3,
            "&:first-of-type": { mt: 0 }
        }}
    >
        {title}
    </Typography>
);

const DetailRow = ({ label, value, isBadge }) => (
    <Box sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
        <Typography sx={{ width: "110px", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: ui.muted, pt: "1px" }}>
            {label}
        </Typography>
        <Box sx={{ flexGrow: 1, ml: 1 }}>
            {isBadge ? (
                value
            ) : (
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: ui.black, wordBreak: "break-word" }}>
                    {value || "-"}
                </Typography>
            )}
        </Box>
    </Box>
);

export default function ModalVerProducto({
    open,
    onClose,
    producto,
    categorias = [],
    stock = 0,
}) {
    if (!producto) return null;

    const isActive = String(producto?.estado) === "1";
    
    const getCategoriaNombre = (id) => {
        const cat = categorias.find((c) => String(c.id) === String(id));
        return cat ? cat.nombre : "Sin categoría";
    };

    const formatMoney = (val) => {
        const n = Number(val);
        return isNaN(n) ? "0.00" : n.toFixed(2);
    };

    const formatQty = (val) => {
        const n = Number(val);
        return isNaN(n) ? "0" : Number.isInteger(n) ? n.toString() : n.toFixed(2);
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={producto?.nombre || "Detalle del Producto"}
            subtitle=""
            icon={<Inventory2Icon sx={{ color: ui.mustard }} />}
            maxWidth="md"
            actions={
                <PremiumButton variant="cancelar" onClick={onClose}>
                    Cancelar
                </PremiumButton>
            }
        >
            <Box sx={{ p: 4, bgcolor: ui.bg, borderRadius: 2 }}>
                <Grid container spacing={4}>
                    {/* Columna Izquierda: Imagen */}
                    {producto?.imagen_url && (
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: "flex", justifyContent: "center", position: "sticky", top: 20 }}>
                                <Box 
                                    component="img" 
                                    src={producto.imagen_url} 
                                    alt={producto.nombre} 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    sx={{ 
                                        width: "100%", 
                                        maxWidth: 240, 
                                        aspectRatio: "1/1", 
                                        objectFit: "cover", 
                                        borderRadius: 3, 
                                        border: `1px solid ${ui.border}`, 
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)" 
                                    }} 
                                />
                            </Box>
                        </Grid>
                    )}

                    {/* Columna Derecha: Detalles */}
                    <Grid item xs={12} md={producto?.imagen_url ? 8 : 12}>
                        <SectionHeader title="DATOS DEL PRODUCTO" />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <DetailRow label="Código" value={producto?.codigo || "S/C"} />
                                <DetailRow label="Categoría" value={getCategoriaNombre(producto?.categoria_id)} />
                                <DetailRow label="SKU" value={producto?.sku} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DetailRow label="Marca" value={producto?.marca} />
                                <DetailRow label="Modelo" value={producto?.modelo} />
                                <DetailRow label="Estado" isBadge value={
                                    <Chip 
                                        label={isActive ? "Activo" : "Inactivo"} 
                                        size="small"
                                        sx={{ 
                                            bgcolor: isActive ? "#d1fae5" : "#fee2e2", 
                                            color: isActive ? "#047857" : "#b91c1c",
                                            fontWeight: 700,
                                            fontSize: "11px",
                                            height: "20px"
                                        }} 
                                    />
                                }/>
                            </Grid>
                        </Grid>

                        {producto?.descripcion && (
                            <Box sx={{ mt: 1, mb: 3 }}>
                                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: ui.muted, mb: 1 }}>
                                    Descripción del producto
                                </Typography>
                                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 1, border: `1px solid ${ui.border}` }}>
                                    <Typography sx={{ fontSize: "13px", color: ui.black }}>
                                        {producto.descripcion}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <SectionHeader title="INVENTARIO Y LOGÍSTICA" />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <DetailRow label="Precio Venta" value={`$${formatMoney(producto?.precio_venta)}`} />
                                <DetailRow label="Stock Actual" value={`${formatQty(stock)} ${producto?.unidad_medida || "und"}`} />
                                <DetailRow label="Código Barras" value={producto?.codigo_barras || "-"} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DetailRow label="Controla Stock" value={producto?.controla_stock ? "Sí" : "No"} />
                                <DetailRow label="Maneja Lotes" value={producto?.maneja_lotes ? "Sí" : "No"} />
                                <DetailRow label="Vencimiento" value={producto?.maneja_vencimiento ? "Sí" : "No"} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </PremiumModal>
    );
}
