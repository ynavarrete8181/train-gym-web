import { Switch, Tooltip } from '@mui/material'
import { confirmarAccion } from '../../utils/confirmacion.js'

export function EstadoToggleCell({
  activo,
  onToggle,
  tituloActivo = 'Inactivar',
  tituloInactivo = 'Activar',
  confirmacion,
}) {
  const ejecutarToggle = async (evento) => {
    evento.stopPropagation()

    const confirmado = await confirmarAccion({
      titulo: confirmacion?.titulo || (activo ? 'Confirmar inactivación' : 'Confirmar activación'),
      texto: confirmacion?.texto || (activo ? 'El registro quedará inactivo.' : 'El registro quedará activo.'),
      textoConfirmar: confirmacion?.textoConfirmar || (activo ? 'Sí, inactivar' : 'Sí, activar'),
      icono: confirmacion?.icono || 'question',
    })

    if (confirmado) onToggle()
  }

  return (
    <Tooltip title={activo ? tituloActivo : tituloInactivo}>
      <Switch
        checked={Boolean(activo)}
        onClick={(evento) => evento.stopPropagation()}
        onChange={ejecutarToggle}
        inputProps={{ 'aria-label': activo ? tituloActivo : tituloInactivo }}
        sx={{
          width: 32,
          height: 18,
          p: 0,
          display: 'inline-flex',
          '& .MuiSwitch-switchBase': {
            p: '2px',
            color: '#ffffff',
            '&.Mui-checked': {
              transform: 'translateX(14px)',
              color: '#ffffff',
              '& + .MuiSwitch-track': {
                bgcolor: '#15803d',
                opacity: 1,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            width: 14,
            height: 14,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.24)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 9,
            bgcolor: '#dc2626',
            opacity: 1,
          },
          '&:hover .MuiSwitch-track': {
            opacity: 0.9,
          },
        }}
      />
    </Tooltip>
  )
}
