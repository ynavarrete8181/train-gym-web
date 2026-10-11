import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'

const tiposAutenticacion = [
  ['OAUTH2_CLIENT_CREDENTIALS', 'OAuth 2.0 · Aplicación'],
  ['OAUTH2_AUTHORIZATION_CODE_PKCE', 'OAuth 2.0 · Usuario (PKCE)'],
  ['API_KEY', 'API Key'],
  ['BEARER_TOKEN', 'Token Bearer'],
  ['BASIC', 'Usuario y contraseña'],
  ['NINGUNA', 'Sin autenticación'],
]

function EstadoCredencial({ item }) {
  const configurada = item.configurada
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.6, mt: 0.45, color: configurada ? 'success.main' : 'warning.main' }}>
      {configurada ? <CheckCircleOutlineIcon sx={{ fontSize: 15 }} /> : <WarningAmberOutlinedIcon sx={{ fontSize: 15 }} />}
      <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>
        {configurada ? 'Configuración completa' : 'Configuración incompleta'}
        {item.ultima_prueba_estado ? ` · Última prueba: ${item.ultima_prueba_estado.toLowerCase()}` : ''}
      </Typography>
    </Stack>
  )
}

export function TarjetaIntegracion({ tipo, item, proveedor, credencial, cargando, onEditar, onProbar }) {
  const icono = tipo === 'proveedor' ? <HubOutlinedIcon /> : tipo === 'servicio' ? <ApiOutlinedIcon /> : <KeyOutlinedIcon />
  const detalle = tipo === 'proveedor'
    ? item.url_base
    : tipo === 'servicio'
      ? `${item.metodo}  ${item.endpoint}`
      : `${proveedor || 'Proveedor'} · ${tiposAutenticacion.find(([valor]) => valor === item.tipo_autenticacion)?.[1] || item.tipo_autenticacion}`

  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0, color: 'primary.main', bgcolor: 'rgba(0,83,156,.08)' }}>{icono}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}><Typography sx={{ fontSize: 13.5, fontWeight: 850 }}>{item.nombre}</Typography><Chip size="small" color={item.activo ? 'success' : 'default'} label={item.activo ? 'Activo' : 'Inactivo'} /></Stack>
            <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary', mt: 0.35 }}>{detalle}</Typography>
            {tipo === 'servicio' && <Typography sx={{ fontSize: 11.5, mt: 0.35 }}>{proveedor} · {credencial || 'Sin autenticación asignada'} · {item.timeout_segundos}s</Typography>}
            {tipo === 'credencial' && <EstadoCredencial item={item} />}
          </Box>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: { xs: 'flex-end', sm: 'initial' }, gap: 1 }}>
          {tipo === 'credencial' && item.tipo_autenticacion === 'OAUTH2_CLIENT_CREDENTIALS' && <Button size="small" variant="outlined" startIcon={<PowerOutlinedIcon />} disabled={cargando || !item.configurada} onClick={onProbar}>Probar</Button>}
          <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEditar}>Editar</Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
