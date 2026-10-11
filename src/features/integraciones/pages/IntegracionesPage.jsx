import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { obtenerMensajeError } from '../../../services/mensajeError.js'
import { NavegacionIntegraciones } from '../components/NavegacionIntegraciones.jsx'
import { FormularioIntegracion as FormularioIntegracionComponente } from '../components/FormularioIntegracion.jsx'
import { TarjetaIntegracion as TarjetaIntegracionComponente } from '../components/TarjetaIntegracion.jsx'
import { guardarCredencial, guardarProveedor, guardarServicio, obtenerCredencial, obtenerIntegraciones, probarCredencial } from '../services/integracionService.js'

const proveedorInicial = { codigo: '', nombre: '', descripcion: '', url_base: 'https://', tipo: 'REST', verificar_ssl: true, activo: true }
const servicioInicial = { proveedor_id: '', credencial_id: '', codigo: '', nombre: '', endpoint: '/', metodo: 'POST', tipo_autenticacion: 'OAUTH2_CLIENT_CREDENTIALS', timeout_segundos: 25, reintentos: 3, headers: '{}', configuracion: '{}', activo: true }
const credencialInicial = { proveedor_id: '', codigo: '', nombre: '', tipo_autenticacion: 'OAUTH2_CLIENT_CREDENTIALS', token_url: '', datos: {}, configuracion: {}, activo: true }

export function IntegracionesPage() {
  const [data, setData] = useState({ proveedores: [], servicios: [], credenciales: [], cola: null })
  const [tab, setTab] = useState(0)
  const [edicion, setEdicion] = useState(null)
  const [form, setForm] = useState({})
  const [aviso, setAviso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const proveedores = useMemo(() => Object.fromEntries(data.proveedores.map((item) => [item.id, item.nombre])), [data.proveedores])
  const credenciales = useMemo(() => Object.fromEntries(data.credenciales.map((item) => [item.id, item.nombre])), [data.credenciales])

  const cargar = async () => setData(await obtenerIntegraciones())
  useEffect(() => { cargar().catch(() => setAviso({ tipo: 'error', mensaje: 'No se pudieron cargar las integraciones.' })) }, [])

  const abrir = async (tipo, item = null) => {
    setForm({})
    setEdicion({ tipo, id: item?.id })
    if (item) {
      try {
        const detalle = tipo === 'credencial' ? await obtenerCredencial(item.id) : item
        const configuracion = detalle.configuracion || {}
        setForm({
          ...detalle,
          datos: { ...(detalle.datos || detalle.datos_publicos || {}) },
          headers: JSON.stringify(detalle.headers || {}, null, 2),
          configuracion: tipo === 'credencial' ? configuracion : JSON.stringify(configuracion, null, 2),
          correos_por_minuto: configuracion.correos_por_minuto ?? 10,
        })
      } catch (error) {
        setEdicion(null)
        setAviso({ tipo: 'error', mensaje: obtenerMensajeError(error, 'No pudimos abrir la configuración.') })
      }
      return
    }
    if (tipo === 'proveedor') setForm(proveedorInicial)
    if (tipo === 'servicio') setForm({ ...servicioInicial, proveedor_id: data.proveedores[0]?.id || '' })
    if (tipo === 'credencial') setForm({ ...credencialInicial, proveedor_id: data.proveedores[0]?.id || '' })
  }

  const guardar = async () => {
    setCargando(true)
    try {
      if (edicion.tipo === 'proveedor') await guardarProveedor(form, edicion.id)
      if (edicion.tipo === 'servicio') {
        const configuracion = JSON.parse(form.configuracion || '{}')
        if (form.codigo === 'CORREO_ENVIAR') configuracion.correos_por_minuto = Number(form.correos_por_minuto || 10)
        await guardarServicio({
          ...form,
          proveedor_id: Number(form.proveedor_id),
          credencial_id: form.credencial_id ? Number(form.credencial_id) : null,
          timeout_segundos: Number(form.timeout_segundos),
          reintentos: Number(form.reintentos),
          headers: JSON.parse(form.headers || '{}'),
          configuracion,
        }, edicion.id)
      }
      if (edicion.tipo === 'credencial') await guardarCredencial({ ...form, proveedor_id: Number(form.proveedor_id), configuracion: typeof form.configuracion === 'string' ? JSON.parse(form.configuracion || '{}') : form.configuracion }, edicion.id)
      setEdicion(null)
      setAviso({ tipo: 'success', mensaje: 'Configuración guardada correctamente.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(error, 'No pudimos guardar la configuración. Inténtalo nuevamente.') })
    } finally { setCargando(false) }
  }

  const probar = async (item) => {
    setCargando(true)
    try {
      const resultado = await probarCredencial(item.id)
      setAviso({ tipo: 'success', mensaje: `Autenticación verificada en ${resultado.duracion_ms} ms.` })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(error, 'No pudimos verificar la conexión. Revisa la configuración e inténtalo nuevamente.') })
      await cargar().catch(() => {})
    } finally { setCargando(false) }
  }

  if (edicion && Object.keys(form).length) return <FormularioIntegracionComponente tipo={edicion.tipo} esEdicion={Boolean(edicion.id)} form={form} setForm={setForm} data={data} cargando={cargando} onGuardar={guardar} onVolver={() => setEdicion(null)} aviso={aviso} setAviso={setAviso} />

  const secciones = [
    { titulo: 'Proveedores configurados', descripcion: 'Plataformas externas con las que puede comunicarse el sistema.', accion: 'Añadir proveedor', tipo: 'proveedor', items: data.proveedores },
    { titulo: 'Servicios disponibles', descripcion: 'Operaciones y endpoints que consumen los diferentes módulos.', accion: 'Añadir servicio', tipo: 'servicio', items: data.servicios },
    { titulo: 'Perfiles de autenticación', descripcion: 'Accesos protegidos y reutilizables por los servicios externos.', accion: 'Añadir perfil', tipo: 'credencial', items: data.credenciales },
  ]
  const seccion = secciones[tab]

  return <Box className="page-wrapper">
    <PageHeader titulo="Configuración de APIs" descripcion="Centraliza proveedores, servicios externos y sus formas de autenticación." icono={<HubOutlinedIcon />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: { xs: 1.5, md: 2.5 } }}>
      {data.cola && <Alert severity={data.cola.procesamiento_inmediato ? 'info' : (data.cola.trabajos_pendientes > 0 ? 'warning' : 'success')} sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{data.cola.procesamiento_inmediato ? 'Procesamiento inmediato activo' : 'Procesamiento en segundo plano activo'}</Typography>
        <Typography sx={{ fontSize: 11.8 }}>{data.cola.procesamiento_inmediato ? 'Las notificaciones se envían automáticamente durante la solicitud.' : `Pendientes: ${data.cola.trabajos_pendientes ?? '—'}`}</Typography>
      </Alert>}
      <NavegacionIntegraciones value={tab} onChange={(_, value) => setTab(value)} />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2 }}>
        <Box><Typography sx={{ fontSize: 15, fontWeight: 850 }}>{seccion.titulo}</Typography><Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{seccion.descripcion}</Typography></Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => abrir(seccion.tipo)}>{seccion.accion}</Button>
      </Stack>
      <Stack spacing={1.25}>
        {seccion.items.map((item) => <TarjetaIntegracionComponente key={item.id} tipo={seccion.tipo} item={item} proveedor={proveedores[item.proveedor_id]} credencial={credenciales[item.credencial_id]} cargando={cargando} onEditar={() => abrir(seccion.tipo, item)} onProbar={() => probar(item)} />)}
        {!seccion.items.length && <Paper variant="outlined" sx={{ py: 5, px: 2, textAlign: 'center', bgcolor: '#f8fafc' }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Todavía no hay registros en esta sección.</Typography></Paper>}
      </Stack>
    </Paper>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
  </Box>
}
