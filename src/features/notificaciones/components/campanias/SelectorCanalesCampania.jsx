import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import WebAssetOutlinedIcon from '@mui/icons-material/WebAssetOutlined'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

const opciones = [
  ['interno', 'Web', WebAssetOutlinedIcon],
  ['correo', 'Correo', EmailOutlinedIcon],
  ['push', 'App push', NotificationsActiveOutlinedIcon],
  ['app', 'Carrusel app', SmartphoneOutlinedIcon],
]

export function SelectorCanalesCampania({ value, onChange }) {
  const seleccionados = opciones.filter(([clave]) => value?.[clave]).map(([clave]) => clave)

  const cambiar = (_, nuevos) => {
    onChange({
      interno: nuevos.includes('interno'),
      correo: nuevos.includes('correo'),
      push: nuevos.includes('push'),
      app: nuevos.includes('app'),
    })
  }

  return <Box>
    <Typography sx={{ fontSize: 12, fontWeight: 850, mb: 1.5 }}>Canales de envío</Typography>
    <ToggleButtonGroup
      value={seleccionados}
      onChange={cambiar}
      sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.2 }}
    >
      {opciones.map(([clave, label, Icono]) => {
        const activo = seleccionados.includes(clave)
        const hayCanalOrdinario = seleccionados.some((canal) => canal !== 'app')
        const deshabilitado = clave === 'app' ? hayCanalOrdinario : seleccionados.includes('app')
        return <ToggleButton
          key={clave}
          value={clave}
          disabled={deshabilitado}
          aria-label={`${label}: ${activo ? 'activo' : 'inactivo'}`}
          sx={{
            position: 'relative', minHeight: 62, m: '0 !important', px: 1.5, py: 1.2,
            justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none',
            border: '1px solid !important', borderRadius: '12px !important', borderColor: '#d7e0ea !important',
            bgcolor: '#fff', color: 'text.primary',
            '&.Mui-selected': { borderColor: '#144985 !important', bgcolor: '#eaf2fb', color: '#144985', boxShadow: '0 0 0 2px rgba(20,73,133,.12)' },
            '&.Mui-selected:hover': { bgcolor: '#e2edf9' },
            '&.Mui-disabled': { color: '#98a2b3', bgcolor: '#f5f7fa', borderColor: '#e4e9ef !important', opacity: 1 },
          }}
        >
          <Box sx={{ width: 36, height: 36, mr: 1.2, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: activo ? '#144985' : '#eef2f6', color: activo ? '#fff' : '#667085' }}><Icono fontSize="small" /></Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{label}</Typography>
          </Box>
          {activo && <CheckCircleRoundedIcon sx={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: '#144985' }} />}
        </ToggleButton>
      })}
    </ToggleButtonGroup>
  </Box>
}
