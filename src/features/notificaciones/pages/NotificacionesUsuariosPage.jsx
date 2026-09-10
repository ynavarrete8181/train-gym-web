import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutlineOutlined'
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { Alert, Box, Button, Checkbox, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { EVENTO_TIEMPO_REAL } from '../../../services/tiempoRealService.js'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { confirmarAccion } from '../../../utils/confirmacion.js'
import { HistorialNotificacionDrawer } from '../components/HistorialNotificacionDrawer.jsx'
import { LoteInvitacionesProgresoDialog } from '../components/LoteInvitacionesProgresoDialog.jsx'
import { NotificacionEstado } from '../components/NotificacionEstado.jsx'
import { enviarNotificacionUsuario, enviarNotificacionesUsuarios, listarLotesInvitacionesRecientes, listarNotificacionesUsuarios, obtenerHistorialNotificacion, obtenerLoteInvitaciones, seleccionarNotificacionesUsuarios } from '../services/notificacionService.js'

const estadosFinales = ['COMPLETADO', 'COMPLETADO_CON_ERRORES', 'ERROR']
const opcionesEstado = [
  ['PENDIENTE', 'Pendiente'],
  ['EN_COLA', 'En cola'],
  ['PROCESANDO', 'Procesando'],
  ['ENVIADA', 'Notificado'],
  ['ERROR', 'Error'],
]

export function NotificacionesUsuariosPage({ integrada = false, referenciaProceso = null }) {
  const [datos, setDatos] = useState([])
  const [meta, setMeta] = useState({ pagina_actual: 1, por_pagina: 10, total: 0 })
  const [filtros, setFiltros] = useState({ busqueda: '', estado: '' })
  const [seleccion, setSeleccion] = useState([])
  const [cargando, setCargando] = useState(false)
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [detalle, setDetalle] = useState({ abierto: false, usuario: null, historial: [] })
  const [lote, setLote] = useState(null)
  const [modalLote, setModalLote] = useState(false)

  const cargar = useCallback(async (pagina = meta.pagina_actual, porPagina = meta.por_pagina) => {
    setCargando(true)
    try {
      const r = await listarNotificacionesUsuarios({ ...filtros, page: pagina, per_page: porPagina })
      setDatos(r.datos); setMeta(r.meta)
    } catch { setAviso({ tipo: 'error', mensaje: 'No se pudieron cargar las notificaciones.' }) } finally { setCargando(false) }
  }, [filtros, meta.pagina_actual, meta.por_pagina])

  useEffect(() => {
    setSeleccion([])
    const t = setTimeout(() => cargar(1, meta.por_pagina), 250)
    return () => clearTimeout(t)
  }, [filtros]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let activo = true
    const recuperar = async () => {
      try {
        if (referenciaProceso?.tipo === 'LOTE_INVITACIONES_ACCESO' && referenciaProceso.id) {
          const actual = await obtenerLoteInvitaciones(referenciaProceso.id)
          if (activo) { setLote(actual); setModalLote(true) }
          return
        }
        const recientes = await listarLotesInvitacionesRecientes()
        const pendiente = recientes.find((item) => !estadosFinales.includes(item.estado))
        if (pendiente) {
          const actual = await obtenerLoteInvitaciones(pendiente.id)
          if (activo) setLote(actual)
        }
      } catch { /* auxiliar */ }
    }
    recuperar()
    return () => { activo = false }
  }, [referenciaProceso?.id, referenciaProceso?.nonce, referenciaProceso?.tipo])

  useEffect(() => {
    const recibir = async (evento) => {
      if (evento.detail?.tipo !== 'LOTE_INVITACIONES_ACCESO') return
      const actual = evento.detail?.datos
      if (!actual?.id || (lote?.id && Number(actual.id) !== Number(lote.id))) return

      setLote(actual)
      if (estadosFinales.includes(actual.estado)) {
        setModalLote(true)
        await cargar()
      }
    }

    window.addEventListener(EVENTO_TIEMPO_REAL, recibir)
    return () => window.removeEventListener(EVENTO_TIEMPO_REAL, recibir)
  }, [lote?.id, cargar])

  const maxSeleccion = Math.min(meta.total || 0, 500)
  const todosFiltrados = maxSeleccion > 0 && seleccion.length === maxSeleccion

  const alternarTodosFiltrados = async () => {
    if (todosFiltrados) {
      setSeleccion([])
      return
    }
    setCargando(true)
    try {
      const resultado = await seleccionarNotificacionesUsuarios(filtros)
      setSeleccion(resultado.usuarios || [])
      if (resultado.limitado) {
        setAviso({ tipo: 'warning', mensaje: `Se seleccionaron los primeros ${resultado.limite} de ${resultado.total} resultados filtrados.` })
      }
    } catch {
      setAviso({ tipo: 'error', mensaje: 'No se pudieron seleccionar los usuarios filtrados.' })
    } finally {
      setCargando(false)
    }
  }

  const enviar = async (usuarios, forzar = false) => {
    const ok = await confirmarAccion({ titulo: forzar ? 'Reenviar invitación' : 'Enviar invitación', texto: `Se generará un enlace nuevo para ${usuarios.length} usuario(s).`, textoConfirmar: 'Sí, enviar', icono: 'question' })
    if (!ok) return
    setCargando(true)
    try {
      if (usuarios.length === 1) {
        const respuesta = await enviarNotificacionUsuario(usuarios[0], forzar)
        setAviso({ tipo: 'success', mensaje: respuesta.mensaje || 'Solicitud procesada correctamente.' })
      } else {
        const respuesta = await enviarNotificacionesUsuarios(usuarios, forzar)
        setLote(respuesta.datos)
        setModalLote(true)
      }
      setSeleccion([])
      await cargar()
    } catch (e) { setAviso({ tipo: 'error', mensaje: e.response?.data?.mensaje || 'No se pudo solicitar el envío.' }) } finally { setCargando(false) }
  }

  const historial = async (usuario) => {
    const h = await obtenerHistorialNotificacion(usuario.id)
    setDetalle({ abierto: true, usuario, historial: h })
  }

  return <Box className={integrada ? undefined : 'page-wrapper'}>
    {!integrada && <PageHeader titulo="Notificaciones de usuarios" descripcion="Consulta, envía y reenvía invitaciones de acceso sin compartir contraseñas." icono={<MarkEmailUnreadOutlinedIcon />} />}
    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mb: 1.25 }}>
        <TextField size="small" label="Buscar usuario" value={filtros.busqueda} onChange={(e) => setFiltros((f) => ({ ...f, busqueda: e.target.value }))} sx={{ flex: 1, minWidth: 0 }} />
        <TextField select size="small" label="Estado" value={filtros.estado} onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))} sx={{ width: { xs: '100%', md: 165 }, flexShrink: 0 }}>
          <MenuItem value="">Todos</MenuItem>{opcionesEstado.map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
        </TextField>
        <Button size="small" variant={modoSeleccion ? 'outlined' : 'contained'} color={modoSeleccion ? 'inherit' : 'primary'} startIcon={modoSeleccion ? <CloseOutlinedIcon /> : <ChecklistOutlinedIcon />} onClick={() => { setModoSeleccion((activo) => !activo); setSeleccion([]) }} sx={modoSeleccion ? dbanuStyles.backButton : dbanuStyles.addButton}>{modoSeleccion ? 'Cancelar selección' : 'Seleccionar usuarios'}</Button>
      </Stack>

      {modoSeleccion && <Paper variant="outlined" sx={{ px: 1.5, py: 1, mb: 1.5, bgcolor: seleccion.length ? 'rgba(0,83,156,.035)' : '#f8fafc' }}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1 }}><Typography sx={{ fontSize: 12, color: seleccion.length ? 'primary.main' : 'text.secondary', fontWeight: 750 }}>{seleccion.length ? `${seleccion.length} usuario(s) seleccionado(s)` : 'Selecciona uno o varios usuarios para realizar un envío masivo.'}</Typography><Button size="small" variant="contained" startIcon={<MailOutlineIcon />} disabled={!seleccion.length || cargando} onClick={() => enviar(seleccion)} sx={dbanuStyles.addButton}>Notificar seleccionados</Button></Stack></Paper>}

      {lote && !estadosFinales.includes(lote.estado) && !modalLote ? <Alert severity="info" sx={{ mb: 1 }} action={<Button size="small" onClick={() => setModalLote(true)}>Ver progreso</Button>}>Hay un lote de invitaciones en procesamiento.</Alert> : null}

      <TablaGestion total={meta.total} filtrados={meta.total} page={meta.pagina_actual} rowsPerPage={meta.por_pagina} cargando={cargando} onPageChange={(p) => cargar(p, meta.por_pagina)} onRowsPerPageChange={(n) => cargar(1, n)}>
        <TableHead><TableRow>{modoSeleccion && <TableCell padding="checkbox"><Tooltip title="Seleccionar todos los resultados filtrados"><Checkbox checked={Boolean(todosFiltrados)} indeterminate={seleccion.length > 0 && !todosFiltrados} onChange={alternarTodosFiltrados} /></Tooltip></TableCell>}<TableCell>Usuario</TableCell><TableCell>Correo</TableCell><TableCell>Rol</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
        <TableBody>{datos.map((u) => <TableRow key={u.id} hover>{modoSeleccion && <TableCell padding="checkbox"><Checkbox checked={Boolean(seleccion.includes(u.id))} onChange={() => setSeleccion((s) => s.includes(u.id) ? s.filter((id) => id !== u.id) : [...s, u.id])} /></TableCell>}<TableCell sx={{ fontWeight: 750 }}>{u.name}<Box component="span" sx={{ display: 'block', fontSize: 11, color: 'text.secondary' }}>{u.cedula}</Box></TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role}</TableCell><TableCell><NotificacionEstado estado={u.estado_notificacion} /></TableCell><TableCell align="right"><Stack direction="row" spacing={.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><Tooltip title="Ver historial"><IconButton sx={dbanuStyles.actionView} onClick={() => historial(u)}><HistoryOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip><Tooltip title={u.estado_notificacion === 'ENVIADA' ? 'Reenviar notificación' : 'Enviar notificación'}><IconButton sx={dbanuStyles.actionView} onClick={() => enviar([u.id], u.estado_notificacion === 'ENVIADA')}><SendOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></Stack></TableCell></TableRow>)}{!datos.length ? <TablaEstadoFila colSpan={modoSeleccion ? 6 : 5} cargando={cargando} texto="No existen usuarios para los filtros seleccionados." /> : null}</TableBody>
      </TablaGestion>
    </Paper>

    <HistorialNotificacionDrawer abierto={detalle.abierto} usuario={detalle.usuario} historial={detalle.historial} onCerrar={() => setDetalle((d) => ({ ...d, abierto: false }))} />
    <LoteInvitacionesProgresoDialog abierto={modalLote} lote={lote} onCerrar={() => setModalLote(false)} />
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
  </Box>
}
