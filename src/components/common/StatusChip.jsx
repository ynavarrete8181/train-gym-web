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

const textoEstado = (estado) => {
  const texto = String(estado ?? '').replaceAll('_', ' ').toLocaleLowerCase('es');
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);
};

export function StatusChip({ estado, label, sx }) {
  return <Chip label={label || textoEstado(estado)} color={colores[estado] || 'default'} size="small" variant="outlined" sx={sx} />
}
