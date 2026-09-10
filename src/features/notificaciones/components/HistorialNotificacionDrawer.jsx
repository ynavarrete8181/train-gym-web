import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { Box, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { NotificacionEstado } from './NotificacionEstado.jsx'

export function HistorialNotificacionDrawer({ abierto, usuario, historial = [], onCerrar }) {
  return <Drawer anchor="right" open={abierto} onClose={onCerrar} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 }, p: 2 } } }}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Box><Typography fontWeight={900}>Historial de notificaciones</Typography><Typography variant="body2" color="text.secondary">{usuario?.name} · {usuario?.email}</Typography></Box>
      <IconButton onClick={onCerrar}><CloseOutlinedIcon /></IconButton>
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack spacing={1.2}>{historial.length ? historial.map((item, i) => <Box key={`${item.id}-${item.numero_intento}-${i}`} sx={{ p: 1.5, border: '1px solid #dbe5f0', borderRadius: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Intento {item.numero_intento || 'pendiente'}</Typography><NotificacionEstado estado={item.estado_intento || item.estado} /></Stack>
      <Typography sx={{ mt: .8, fontSize: 12, color: 'text.secondary' }}>{item.finalizado_at || item.encolado_at || 'Sin fecha'}</Typography>
      {item.mensaje_error ? <Typography sx={{ mt: .7, fontSize: 12, color: 'error.main' }}>{item.mensaje_error}</Typography> : null}
    </Box>) : <Typography color="text.secondary" sx={{ fontSize: 13 }}>Este usuario todavía no tiene intentos de envío.</Typography>}</Stack>
  </Drawer>
}
