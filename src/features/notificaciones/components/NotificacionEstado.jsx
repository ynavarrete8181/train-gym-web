import { Chip } from '@mui/material'

const colores = { ENVIADA: 'success', ERROR: 'error', EN_COLA: 'info', PROCESANDO: 'warning', PENDIENTE: 'default' }
const etiquetas = { ENVIADA: 'Notificado', ERROR: 'Error', EN_COLA: 'En cola', PROCESANDO: 'Procesando', PENDIENTE: 'Pendiente' }

export function NotificacionEstado({ estado }) {
  return <Chip size="small" variant={estado === 'PENDIENTE' ? 'outlined' : 'filled'} color={colores[estado] || 'default'} label={etiquetas[estado] || estado} sx={{ fontWeight: 750, fontSize: 11 }} />
}
