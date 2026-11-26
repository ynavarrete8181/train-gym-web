import { Box, Typography } from '@mui/material';

/**
 * Tarjeta de indicador de los reportes: título, valor grande y detalle. Si recibe onClick filtra la
 * tabla al tocarla (y queda resaltada con `activo`). Común a los reportes de todos los módulos.
 */
export function TarjetaReporte({ titulo, valor, detalle, color, activo = false, onClick }) {
  return (
    <Box onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      sx={{ p: 1.5, border: '1px solid', borderColor: activo ? color : 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}`,
        bgcolor: activo ? 'action.selected' : 'background.paper', cursor: onClick ? 'pointer' : 'default', minWidth: 0,
        '&:hover': onClick ? { borderColor: color } : undefined }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color, fontSize: { xs: 16, md: 19 } }} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{detalle}</Typography>
    </Box>
  );
}
