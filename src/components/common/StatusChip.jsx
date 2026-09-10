import { Chip } from '@mui/material'

const colores = {
  activo: 'success',
  pendiente: 'info',
  riesgo: 'warning',
  bloqueado: 'error',
  cerrado: 'default',
}

export function StatusChip({ estado }) {
  return <Chip label={estado} color={colores[estado] || 'default'} size="small" variant="outlined" />
}
