import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import BrightnessAutoOutlinedIcon from '@mui/icons-material/BrightnessAutoOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import { AppBar, Avatar, Badge, Box, Divider, IconButton, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { uiTokens } from '../../styles/uiTokens.js'
import { CambiarClavePropiaDialog } from '../../features/auth/components/CambiarClavePropiaDialog.jsx'
import { listarAvisos, marcarAvisoLeido } from '../../services/avisoService.js'
import { EVENTO_TIEMPO_REAL } from '../../services/tiempoRealService.js'
import { useTema } from '../../hooks/useTema.js'

const titulosVistas = {
  DASHBOARD: 'Dashboard',
  'SEGURIDAD-USUARIOS': 'Administración de usuarios',
  'SEGURIDAD-MENUS': 'Menús',
  'SEGURIDAD-SUBMENUS': 'Submenús',
  'SEGURIDAD-ROLES': 'Roles y permisos',
  'INSTITUCIONAL-SEDES': 'Sedes',
  'INSTITUCIONAL-UNIDADES': 'Facultades / Direcciones',
  'INSTITUCIONAL-CARRERAS-AREAS': 'Carreras / Áreas',
  'INSTITUCIONAL-CAMPOS-AMPLIOS': 'Campos amplios',
}

const obtenerIniciales = (nombre = '') => nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'U'

const obtenerNombreCorto = (usuario) => {
  const primerNombre = String(usuario?.nombres || usuario?.name || '').trim().split(/\s+/)[0]
  const partesNombre = String(usuario?.name || '').trim().split(/\s+/).filter(Boolean)
  const primerApellido = String(usuario?.apellidos || '').trim().split(/\s+/)[0]
    || partesNombre[1]
    || ''
  return [primerNombre, primerApellido].filter(Boolean).join(' ') || 'Usuario'
}

export function Topbar({ sidebarWidth, vistaActual, tituloVista: tituloMenu, usuario, onLogout, onAvisoNavigate }) {
  const [cambiarClaveAbierto, setCambiarClaveAbierto] = useState(false)
  const [anclaAvisos, setAnclaAvisos] = useState(null)
  const [anclaTema, setAnclaTema] = useState(null)
  const [anclaUsuario, setAnclaUsuario] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [noLeidos, setNoLeidos] = useState(0)
  const tituloVista = tituloMenu || titulosVistas[vistaActual] || 'Revive'
  const tema = useTema()
  const opcionesTema = [
    { valor: 'automatico', etiqueta: 'Automático', Icono: BrightnessAutoOutlinedIcon },
    { valor: 'light', etiqueta: 'Claro', Icono: LightModeOutlinedIcon },
    { valor: 'dark', etiqueta: 'Oscuro', Icono: DarkModeOutlinedIcon },
  ]
  const IconoTemaActual = tema.preferencia === 'automatico'
    ? BrightnessAutoOutlinedIcon
    : tema.modoResuelto === 'dark' ? DarkModeOutlinedIcon : LightModeOutlinedIcon

  const cargarAvisos = useCallback(async () => {
    try {
      const datos = await listarAvisos()
      setAvisos(datos.avisos || [])
      setNoLeidos(datos.no_leidos || 0)
    } catch {
      // La campana no debe interferir con el resto de la aplicación.
    }
  }, [])

  useEffect(() => {
    cargarAvisos()
  }, [cargarAvisos])

  useEffect(() => {
    if (!usuario?.id) return undefined

    const recibir = (evento) => {
      if (evento.detail?.tipo !== 'AVISO_CREADO') return
      const aviso = evento.detail?.datos
      if (!aviso?.id) return

      setAvisos((actuales) => [aviso, ...actuales.filter((item) => item.id !== aviso.id)].slice(0, 20))
      setNoLeidos((actual) => actual + 1)
    }

    window.addEventListener(EVENTO_TIEMPO_REAL, recibir)
    return () => {
      window.removeEventListener(EVENTO_TIEMPO_REAL, recibir)
    }
  }, [usuario?.id])

  const cerrarSesion = async () => {
    const { confirmarAccion } = await import('../../utils/confirmacion.js')
    const confirmado = await confirmarAccion({ titulo: 'Cerrar sesión', texto: '¿Deseas finalizar tu sesión actual?', textoConfirmar: 'Sí, cerrar sesión' })
    if (confirmado) onLogout()
  }

  const abrirAviso = async (aviso) => {
    try {
      if (!aviso.leido) await marcarAvisoLeido(aviso.id)
    } finally {
      setAnclaAvisos(null)
      await cargarAvisos()
      onAvisoNavigate?.(aviso)
    }
  }

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: '#202020', width: { md: `calc(100% - ${sidebarWidth}px)` }, ml: { md: `${sidebarWidth}px` }, bgcolor: '#343431', color: '#fff', transition: (themeMui) => themeMui.transitions.create(['width', 'margin'], { easing: themeMui.transitions.easing.sharp, duration: themeMui.transitions.duration.standard }) }}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, gap: 1.5 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 0.7 }}>Revive</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 900, color: '#fff' }} noWrap>{tituloVista}</Typography>
        </Box>
        <Tooltip title="Cambiar tema">
          <IconButton aria-label="Cambiar tema" onClick={(evento) => setAnclaTema(evento.currentTarget)} sx={{ width: 36, height: 36, border: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 1, color: '#fff' }}>
            <IconoTemaActual sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anclaTema} open={Boolean(anclaTema)} onClose={() => setAnclaTema(null)} PaperProps={{ sx: { mt: 1, minWidth: 170, borderRadius: 2 } }}>
          {opcionesTema.map(({ valor, etiqueta, Icono }) => (
            <MenuItem
              key={valor}
              selected={tema.preferencia === valor}
              onClick={() => { tema.cambiarPreferencia(valor); setAnclaTema(null) }}
              sx={{ gap: 1.2, fontSize: 12.5 }}
            >
              <Icono sx={{ fontSize: 19, color: tema.preferencia === valor ? 'primary.main' : 'text.secondary' }} />
              <Box sx={{ flexGrow: 1 }}>{etiqueta}</Box>
              {tema.preferencia === valor ? <CheckOutlinedIcon sx={{ fontSize: 17, color: 'primary.main' }} /> : null}
            </MenuItem>
          ))}
        </Menu>
        <Tooltip title="Notificaciones">
          <IconButton aria-label="Notificaciones" onClick={(e) => setAnclaAvisos(e.currentTarget)} sx={{ width: 36, height: 36, border: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 1, color: '#fff' }}>
            <Badge badgeContent={noLeidos} color="error" max={99}><NotificationsOutlinedIcon sx={{ fontSize: 20 }} /></Badge>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anclaAvisos} open={Boolean(anclaAvisos)} onClose={() => setAnclaAvisos(null)} PaperProps={{ sx: { mt: 1, width: 360, maxHeight: 420, borderRadius: 2 } }}>
          <Box sx={{ px: 2, py: 1.2 }}><Typography sx={{ fontSize: 13, fontWeight: 900 }}>Notificaciones</Typography></Box>
          <Divider />
          {avisos.length ? avisos.map((aviso) => (
            <MenuItem key={aviso.id} onClick={() => abrirAviso(aviso)} sx={{ alignItems: 'flex-start', gap: 1, py: 1.2, bgcolor: aviso.leido ? 'background.paper' : 'action.selected' }}>
              <Box sx={{ width: 8, height: 8, mt: .7, borderRadius: '50%', bgcolor: aviso.leido ? 'transparent' : uiTokens.colores.primario, flex: '0 0 auto' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: aviso.leido ? 700 : 900, color: 'text.primary' }}>{aviso.titulo}</Typography>
                {aviso.mensaje ? <Typography sx={{ mt: .25, fontSize: 11.5, whiteSpace: 'normal', color: 'text.secondary' }}>{aviso.mensaje}</Typography> : null}
              </Box>
            </MenuItem>
          )) : <MenuItem disabled><Typography sx={{ fontSize: 12 }}>No tienes notificaciones.</Typography></MenuItem>}
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.16)', display: { xs: 'none', sm: 'block' } }} />
        <Tooltip title="Opciones de usuario">
          <Stack
            component="button"
            type="button"
            direction="row"
            spacing={1.2}
            aria-label="Abrir opciones de usuario"
            aria-haspopup="menu"
            aria-expanded={Boolean(anclaUsuario)}
            onClick={(evento) => setAnclaUsuario(evento.currentTarget)}
            sx={{ alignItems: 'center', minWidth: 0, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Avatar sx={{ width: 38, height: 38, bgcolor: uiTokens.colores.acentoTexto, color: uiTokens.colores.acento, fontSize: 13, fontWeight: 900 }}>{obtenerIniciales(usuario?.name)}</Avatar>
            <Box sx={{ minWidth: 130, maxWidth: 220, display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: '#fff' }} noWrap>{obtenerNombreCorto(usuario)}</Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.68)' }} noWrap>{usuario?.rol_nombre || usuario?.role || 'Administrativo'}</Typography>
            </Box>
            <KeyboardArrowDownOutlinedIcon
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'rgba(255,255,255,0.72)',
                fontSize: 20,
                transform: anclaUsuario ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 160ms ease',
              }}
            />
          </Stack>
        </Tooltip>
        <Menu anchorEl={anclaUsuario} open={Boolean(anclaUsuario)} onClose={() => setAnclaUsuario(null)} PaperProps={{ sx: { mt: 1, minWidth: 220, borderRadius: 2 } }}>
          <MenuItem onClick={() => { setAnclaUsuario(null); setCambiarClaveAbierto(true) }} sx={{ gap: 1.2, fontSize: 12.5 }}>
            <LockResetOutlinedIcon sx={{ fontSize: 19, color: uiTokens.colores.primario }} /> Cambiar contraseña
          </MenuItem>
          <MenuItem onClick={() => { setAnclaUsuario(null); cerrarSesion() }} sx={{ gap: 1.2, fontSize: 12.5, color: uiTokens.colores.peligro }}>
            <LogoutOutlinedIcon sx={{ fontSize: 19 }} /> Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
      <CambiarClavePropiaDialog open={cambiarClaveAbierto} onClose={() => setCambiarClaveAbierto(false)} onSuccess={onLogout} />
    </AppBar>
  )
}
