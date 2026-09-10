import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx'
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { guardarPlantilla, listarEventosPlantilla, listarPlantillas, vistaPreviaPlantilla } from '../services/plantillaService.js'
import { EditorContenidoCorreo } from '../components/plantillas/EditorContenidoCorreo.jsx'
import { generarPlantillaBase } from '../components/plantillas/plantillasBase.js'
import { confirmarAccion } from '../../../utils/confirmacion.js'

const inicial = { codigo: '', nombre: '', tipo: 'COMUNICADO', evento_codigo: null, predeterminada: false, asunto: '', cuerpo_html: '', cuerpo_texto: '', variables: [], activo: true }
const ejemplo = { nombre_sistema: 'Revive', nombre_usuario: 'Usuario de ejemplo', nombre_destinatario: 'Usuario de ejemplo', email_usuario: 'usuario@revive.local', correo_destino: 'usuario@revive.local', cedula_usuario: '1300000000', roles_usuario: 'USUARIO', sede_usuario: 'Principal', facultad_direccion_usuario: 'Área principal', carrera_area_usuario: 'Línea principal', url_activacion: 'https://revive.local/activar-cuenta', codigo_activacion: 'AB12CD34EF', fecha_expiracion: '15/08/2026 12:00', fecha_creacion: '13/08/2026 10:30' }
const variablesPorTipo = {
  ACCESO: ['nombre_sistema', 'nombre_usuario', 'email_usuario', 'cedula_usuario', 'roles_usuario', 'sede_usuario', 'facultad_direccion_usuario', 'carrera_area_usuario', 'url_activacion', 'codigo_activacion', 'fecha_expiracion', 'fecha_creacion', 'url_sistema'],
  RESTABLECIMIENTO: ['nombre_sistema', 'nombre_usuario', 'email_usuario', 'url_activacion', 'codigo_activacion', 'fecha_expiracion'],
  COMUNICADO: ['nombre_sistema', 'nombre_destinatario', 'nombre_usuario', 'correo_destino'],
}
const generarCodigoPlantilla = (tipo, nombre) => {
  if (tipo === 'ACCESO') return 'INVITACION_USUARIO'
  if (tipo === 'RESTABLECIMIENTO') return 'RESTABLECIMIENTO_CLAVE'
  const normalizado = nombre.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
  return normalizado ? `${tipo}_${normalizado}`.slice(0, 100) : ''
}

export function PlantillasCorreoPage() {
  const [items, setItems] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(inicial)
  const [editando, setEditando] = useState(null)
  const [modoFormulario, setModoFormulario] = useState(false)
  const [preview, setPreview] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [eventos, setEventos] = useState([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const filtrados = useMemo(() => items.filter((item) => `${item.codigo} ${item.nombre} ${item.asunto}`.toLowerCase().includes(busqueda.toLowerCase())), [items, busqueda])
  const visibles = useMemo(() => filtrados.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtrados, page, rowsPerPage])

  const cargar = async () => setItems(await listarPlantillas())
  useEffect(() => { cargar(); listarEventosPlantilla().then(setEventos) }, [])

  const abrir = (item = null) => {
    setEditando(item)
    setForm(item ? { ...item, variables: Array.isArray(item.variables) ? item.variables : JSON.parse(item.variables || '[]') } : inicial)
    setModoFormulario(true)
  }

  const guardar = async () => {
    setCargando(true)
    try {
      await guardarPlantilla(form, editando?.id)
      setModoFormulario(false)
      setAviso({ tipo: 'success', mensaje: 'Plantilla guardada correctamente.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error.response?.data?.mensaje || 'No se pudo guardar la plantilla.' })
    } finally { setCargando(false) }
  }

  const ver = async (item) => setPreview(await vistaPreviaPlantilla({ asunto: item.asunto, cuerpo_html: item.cuerpo_html, variables: ejemplo }))
  const autogenerar = async () => {
    if ((form.cuerpo_html || form.cuerpo_texto) && !await confirmarAccion({ titulo: '¿Reemplazar el contenido?', texto: 'Se reemplazarán el asunto, el contenido visual y el texto plano actuales.', textoConfirmar: 'Sí, generar' })) return
    setForm((actual) => ({ ...actual, ...generarPlantillaBase(actual.tipo) }))
  }

  if (modoFormulario) {
    return <Box className="page-wrapper">
      <PageHeader titulo={editando ? 'Editar plantilla de correo' : 'Nueva plantilla de correo'} descripcion="Define el asunto, las variables y el contenido reutilizable de la notificación." icono={<DraftsOutlinedIcon />} acciones={<BotonVolver onClick={() => setModoFormulario(false)} />} />
      <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
        <Paper variant="outlined" sx={{ maxWidth: 1040, mx: 'auto', p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack spacing={1.7}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}><TextField fullWidth label="Nombre" value={form.nombre} onChange={(e) => { const nombre = e.target.value; setForm({ ...form, nombre, codigo: generarCodigoPlantilla(form.tipo, nombre) }) }} /><TextField fullWidth label="Código generado" value={generarCodigoPlantilla(form.tipo, form.nombre)} slotProps={{ input: { readOnly: true } }} /></Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}><TextField select fullWidth label="Tipo de plantilla" value={form.tipo || 'COMUNICADO'} onChange={(e) => { const tipo = e.target.value; const evento = tipo === 'ACCESO' ? 'USUARIO_CREADO' : tipo === 'RESTABLECIMIENTO' ? 'USUARIO_RESTABLECER_CLAVE' : null; setForm({ ...form, tipo, codigo: generarCodigoPlantilla(tipo, form.nombre), evento_codigo: evento, predeterminada: Boolean(evento) }) }}><MenuItem value="COMUNICADO">Comunicado</MenuItem><MenuItem value="ACCESO" disabled={!editando && items.some((p) => p.tipo === 'ACCESO')}>Invitación de acceso</MenuItem><MenuItem value="RESTABLECIMIENTO" disabled={!editando && items.some((p) => p.tipo === 'RESTABLECIMIENTO')}>Restablecimiento de contraseña</MenuItem></TextField>{['ACCESO', 'RESTABLECIMIENTO'].includes(form.tipo) && <TextField select fullWidth disabled label="Evento automático" value={form.evento_codigo || (form.tipo === 'ACCESO' ? 'USUARIO_CREADO' : 'USUARIO_RESTABLECER_CLAVE')}>{eventos.filter((e) => e.codigo === (form.tipo === 'ACCESO' ? 'USUARIO_CREADO' : 'USUARIO_RESTABLECER_CLAVE')).map((e) => <MenuItem key={e.codigo} value={e.codigo}>{e.nombre}</MenuItem>)}</TextField>}</Stack>
            {form.tipo === 'ACCESO' && <Alert severity="info">Solo puede existir una plantilla de acceso. Se utilizará automáticamente al crear y notificar usuarios.</Alert>}
            {form.tipo === 'RESTABLECIMIENTO' && <Alert severity="info">Esta plantilla única se utilizará cuando un administrador solicite restablecer una contraseña.</Alert>}
            <TextField label="Asunto" value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} helperText="Puedes utilizar variables con el formato {{nombre_variable}}." />
            <Paper variant="outlined" sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: .7 }}>Variables disponibles</Typography><Stack direction="row" useFlexGap sx={{ gap: .6, flexWrap: 'wrap' }}>{(variablesPorTipo[form.tipo] || variablesPorTipo.COMUNICADO).map((variable) => <Chip key={variable} size="small" label={`{{${variable}}}`} />)}</Stack></Paper>
            <EditorContenidoCorreo html={form.cuerpo_html || ''} texto={form.cuerpo_texto || ''} variablesDisponibles={variablesPorTipo[form.tipo] || variablesPorTipo.COMUNICADO} onAutogenerar={autogenerar} onHtmlChange={(cuerpo_html) => setForm((actual) => ({ ...actual, cuerpo_html }))} onTextoChange={(cuerpo_texto) => setForm((actual) => ({ ...actual, cuerpo_texto }))} />
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc' }}><Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}><Switch checked={Boolean(form.activo)} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /><Box><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Plantilla activa</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Puede ser seleccionada por los procesos de notificación.</Typography></Box></Stack></Paper>
            <AccionesFormulario onCancelar={() => setModoFormulario(false)} onGuardar={guardar} guardando={cargando} />
          </Stack>
        </Paper>
      </Paper><NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
    </Box>
  }

  return <Box className="page-wrapper"><PageHeader titulo="Plantillas de correo" descripcion="Centraliza el contenido reutilizable de las notificaciones del sistema." icono={<DraftsOutlinedIcon />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}><GestionToolbar total={filtrados.length} busqueda={busqueda} onBusqueda={(valor) => { setBusqueda(valor); setPage(1) }} acciones={<BotonAnadir onClick={() => abrir()} />} />
      <TablaGestion total={items.length} filtrados={filtrados.length} page={page} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={(valor) => { setRowsPerPage(valor); setPage(1) }}>
        <TableHead><TableRow><TableCell>Plantilla</TableCell><TableCell>Tipo</TableCell><TableCell>Asunto</TableCell><TableCell>Variables</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
        <TableBody>{visibles.map((item) => <TableRow key={item.id} hover><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>{item.nombre}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.codigo}</Typography></TableCell><TableCell><Chip size="small" color={item.tipo === 'ACCESO' ? 'warning' : 'info'} label={item.tipo === 'ACCESO' ? 'Acceso' : item.tipo === 'RESTABLECIMIENTO' ? 'Restablecimiento' : 'Comunicado'} /></TableCell><TableCell sx={{ fontSize: 12 }}>{item.asunto}</TableCell><TableCell><Stack direction="row" useFlexGap sx={{ gap: .5, flexWrap: 'wrap' }}>{(item.variables || []).slice(0, 3).map((variable) => <Chip key={variable} size="small" label={variable} />)}</Stack></TableCell><TableCell><Chip size="small" color={item.activo ? 'success' : 'default'} label={item.activo ? 'Activa' : 'Inactiva'} /></TableCell><TableCell align="right"><Stack direction="row" spacing={0.4} justifyContent="flex-end"><Tooltip title="Vista previa"><IconButton sx={dbanuStyles.actionView} onClick={() => ver(item)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => abrir(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></Stack></TableCell></TableRow>)}</TableBody>
      </TablaGestion>
    </Paper>
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="sm"><DialogTitle>{preview?.asunto}</DialogTitle><DialogContent><Box component="iframe" title="Vista previa del correo" sandbox="" srcDoc={preview?.cuerpo_html || ''} sx={{ width: '100%', minHeight: 320, border: '1px solid #dbe5f0', borderRadius: 1.5 }} /></DialogContent></Dialog>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
  </Box>
}
