import { Chip } from '@mui/material'

const colores = {
  activo: 'success',
  pendiente: 'info',
  riesgo: 'warning',
  bloqueado: 'error',
  cancelada: 'error',
  cancelado: 'error',
  congelada: 'warning',
  cerrado: 'default',
}

export function StatusChip({ estado, label }) {
  return <Chip label={label || estado} color={colores[estado] || 'default'} size="small" variant="outlined" />
}
