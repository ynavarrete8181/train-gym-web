import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Autocomplete, Box, Button, Chip, IconButton, MenuItem, Paper, Stack, Step, StepLabel, Stepper, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { PaginacionTabla } from '../../../components/tables/PaginacionTabla.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { obtenerMensajeError } from '../../../services/mensajeError.js'
import { confirmarAccion } from '../../../utils/confirmacion.js'
import { ConfirmarEnvioCampaniaDialog } from '../components/campanias/ConfirmarEnvioCampaniaDialog.jsx'
import { SelectorCanalesCampania } from '../components/campanias/SelectorCanalesCampania.jsx'
import { SelectorDestinatariosCampania } from '../components/campanias/SelectorDestinatariosCampania.jsx'
import { PublicacionAppCampania } from '../components/campanias/PublicacionAppCampania.jsx'
import { actualizarCampania, calcularDestinatarios, crearCampania, eliminarCampania, enviarCampania, listarCampanias, obtenerCampania, obtenerCatalogosCampania, reenviarErroresCampania } from '../services/campaniaService.js'

const criteriosIniciales = { todos: false, usuarios: [], roles: [], sedes: [], unidades: [], carreras_areas: [], externos: [], vinculaciones: [] }
const canalesIniciales = { interno: false, correo: false, push: false, app: false }
const formInicial = () => ({ nombre: '', descripcion: '', plantilla_id: '', canales: { ...canalesIniciales }, publicacion_app: { visible: false, titulo: '', descripcion: '', imagen_url: '', imagen_archivo: '', imagen_nombre: '', imagen_preview: '', accion_url: '', accion_etiqueta: 'Ver más' }, correos_cc: [], correos_cco: [], criterios: { ...criteriosIniciales } })

const colorEstado = { COMPLETADA: 'success', COMPLETADA_CON_ERRORES: 'warning', ERROR: 'error', EN_COLA: 'info', PROCESANDO: 'info', BORRADOR: 'default' }
const etiquetaEstado = { COMPLETADA: 'ENVIADO', COMPLETADA_CON_ERRORES: 'ENVIADO CON ERRORES', EN_COLA: 'EN COLA' }

export function CampaniasNotificacionPage({ soloHistorial = false }) {
  const [lista, setLista] = useState({ data: [], total: 0, current_page: 1, per_page: 10 })
  const [catalogos, setCatalogos] = useState({ plantillas: [], usuarios: [], usuarios_app: [], roles: [], sedes: [], unidades: [], carreras_areas: [] })
  const [modo, setModo] = useState('lista')
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState(formInicial)
  const [preview, setPreview] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('COMPLETADAS')
  const [preparando, setPreparando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const plantillaSeleccionada = catalogos.plantillas.find((item) => String(item.id) === String(form.plantilla_id))
  const tieneCanal = Object.values(form.canales).some(Boolean)
  const requierePlantilla = form.canales.interno || form.canales.correo || form.canales.push
  const contenidoAppValido = !form.canales.app || (String(form.publicacion_app.titulo || '').trim() && String(form.publicacion_app.descripcion || '').trim())
  const nombreValido = form.canales.app ? String(form.publicacion_app.titulo || '').trim() : String(form.nombre || '').trim()

  const cargar = useCallback(async (pagina = 1, porPagina = lista.per_page, estado = estadoFiltro) => {
    setLista(await listarCampanias({ page: pagina, per_page: porPagina, estado: estado || undefined, historial: soloHistorial ? 1 : undefined }))
  }, [lista.per_page, estadoFiltro, soloHistorial])

  useEffect(() => {
    cargar()
    obtenerCatalogosCampania().then(setCatalogos)
  }, [cargar])

  const abrirDetalle = async (id) => {
    setDetalle(await obtenerCampania(id, soloHistorial))
    setModo('detalle')
  }

  const calcular = async () => {
    try {
      setPreview(await calcularDestinatarios(form.criterios, form.canales))
      setPaso(2)
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(e, 'No se pudieron calcular los destinatarios.') })
    }
  }

  const guardar = async () => {
    if (preparando || confirmar) return
    setPreparando(true)
    try {
      const campania = editandoId ? await actualizarCampania(editandoId, form) : await crearCampania(form)
      setConfirmar(campania)
      setAviso({ tipo: 'success', mensaje: editandoId ? 'Borrador actualizado correctamente.' : 'Campaña creada como borrador.' })
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(e, 'No se pudo crear la campaña.') })
    } finally { setPreparando(false) }
  }

  const editarBorrador = (item) => {
    const leerJson = (valor, respaldo) => { try { return typeof valor === 'string' ? JSON.parse(valor) : (valor ?? respaldo) } catch { return respaldo } }
    setEditandoId(item.id)
    setForm({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      plantilla_id: item.plantilla_id || '',
      canales: { interno: Boolean(item.canal_interno), correo: item.canal_correo !== false, push: Boolean(item.canal_push), app: Boolean(item.publicar_inicio_app) },
      publicacion_app: {
        visible: Boolean(item.publicar_inicio_app),
        titulo: item.titulo_app || item.asunto || '',
        descripcion: item.descripcion_app || item.cuerpo_texto || '',
        imagen_url: item.imagen_inicio_app || '',
        imagen_archivo: item.imagen_archivo_app || '',
        imagen_nombre: item.imagen_archivo_app?.split('/').pop() || '',
        imagen_preview: item.imagen_inicio_app || '',
        accion_url: item.accion_url_app || '',
        accion_etiqueta: item.accion_etiqueta_app || 'Ver más',
      },
      correos_cc: leerJson(item.correos_cc, []),
      correos_cco: leerJson(item.correos_cco, []),
      criterios: { ...criteriosIniciales, ...leerJson(item.criterios, {}) },
    })
    setPaso(0); setPreview(null); setModo('crear')
  }

  const enviar = async () => {
    try {
      await enviarCampania(confirmar.id)
      setConfirmar(null); setModo('lista'); setPaso(0); setForm(formInicial())
      await cargar()
      setAviso({ tipo: 'success', mensaje: 'Comunicado enviado a procesamiento.' })
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(e, 'No se pudo enviar el comunicado.') })
    }
  }

  const reenviarErrores = async () => {
    try {
      await reenviarErroresCampania(detalle.campania.id)
      setDetalle(await obtenerCampania(detalle.campania.id))
      setAviso({ tipo: 'success', mensaje: 'Errores enviados nuevamente a procesamiento.' })
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(e, 'No se pudieron reenviar los errores.') })
    }
  }

  const eliminarBorrador = async (campania) => {
    const confirmado = await confirmarAccion({ titulo: 'Eliminar borrador', texto: `Se eliminará definitivamente el borrador “${campania.nombre}”.`, textoConfirmar: 'Sí, eliminar', icono: 'warning' })
    if (!confirmado) return
    try {
      await eliminarCampania(campania.id)
      await cargar(1, lista.per_page)
      setAviso({ tipo: 'success', mensaje: 'Borrador eliminado correctamente.' })
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: obtenerMensajeError(error, 'No se pudo eliminar el borrador.') })
    }
  }

  if (modo === 'crear') return <Box className="page-wrapper">
    <PageHeader titulo={editandoId ? 'Editar borrador' : 'Nueva campaña'} descripcion="Configura contenido, canales y destinatarios." icono={<CampaignOutlinedIcon />} acciones={<BotonVolver onClick={() => { setEditandoId(null); setModo('lista') }} />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Paper variant="outlined" sx={{ maxWidth: 1050, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #dbe5f0' }}>
          <Stepper activeStep={paso}>{['Contenido', 'Destinatarios', 'Confirmación'].map((x) => <Step key={x}><StepLabel>{x}</StepLabel></Step>)}</Stepper>
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {paso === 0 && <Stack spacing={1.5}>
            <SelectorCanalesCampania value={form.canales} onChange={(canales) => setForm({ ...form, canales, plantilla_id: (canales.interno || canales.correo || canales.push) ? form.plantilla_id : '', publicacion_app: { ...form.publicacion_app, visible: canales.app, titulo: form.publicacion_app.titulo || plantillaSeleccionada?.asunto || form.nombre, descripcion: form.publicacion_app.descripcion || plantillaSeleccionada?.cuerpo_texto || form.descripcion }, correos_cc: canales.correo ? form.correos_cc : [], correos_cco: canales.correo ? form.correos_cco : [] })} />
            {tieneCanal && <>
              {!form.canales.app && <TextField label="Nombre de la campaña" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />}
              {requierePlantilla && <TextField select required label="Plantilla" value={form.plantilla_id} onChange={(e) => {
                const plantilla_id = e.target.value
                const plantilla = catalogos.plantillas.find((item) => String(item.id) === String(plantilla_id))
                setForm({ ...form, plantilla_id, publicacion_app: form.canales.app ? { ...form.publicacion_app, titulo: form.publicacion_app.titulo || plantilla?.asunto || '', descripcion: form.publicacion_app.descripcion || plantilla?.cuerpo_texto || '' } : form.publicacion_app })
              }}>
                {catalogos.plantillas.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </TextField>}
              {form.canales.app && <PublicacionAppCampania
                value={form.publicacion_app}
                titulo={plantillaSeleccionada?.asunto || form.nombre}
                descripcion={plantillaSeleccionada?.cuerpo_texto || form.descripcion}
                onChange={(publicacion_app) => setForm({ ...form, nombre: publicacion_app.titulo || '', publicacion_app: { ...publicacion_app, visible: true } })}
              />}
              <TextField multiline minRows={3} label="Descripción interna (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}><Button variant="contained" disabled={!nombreValido || (requierePlantilla && !form.plantilla_id) || !contenidoAppValido} onClick={() => setPaso(1)}>Siguiente</Button></Stack>
            </>}
          </Stack>}

          {paso === 1 && <Stack spacing={2}>
            <SelectorDestinatariosCampania catalogos={catalogos} criterios={form.criterios} soloUsuariosApp={form.canales.app} onChange={(criterios) => setForm({ ...form, criterios })} />
            {form.canales.correo && <Paper variant="outlined" sx={{ p: 1.7, bgcolor: '#f8fafc' }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 850, mb: 1 }}>Copias</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <Autocomplete multiple freeSolo fullWidth options={[]} value={form.correos_cc} onChange={(_, valores) => setForm({ ...form, correos_cc: valores })} renderInput={(params) => <TextField {...params} size="small" label="CC" />} />
                <Autocomplete multiple freeSolo fullWidth options={[]} value={form.correos_cco} onChange={(_, valores) => setForm({ ...form, correos_cco: valores })} renderInput={(params) => <TextField {...params} size="small" label="CCO" />} />
              </Stack>
            </Paper>}
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Button onClick={() => setPaso(0)}>Anterior</Button><Button variant="contained" onClick={calcular}>Revisar destinatarios</Button></Stack>
          </Stack>}

          {paso === 2 && <Stack spacing={2}>
            <Alert severity="info">{preview?.total || 0} destinatario(s)</Alert>
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.1, bgcolor: '#f8fafc', borderBottom: '1px solid #e1e8f0' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: 'text.secondary' }}>
                  Mostrando {Math.min(preview?.muestra?.length || 0, preview?.total || 0)} de {preview?.total || 0}
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                {(preview?.muestra || []).map((d, indice) => <Box key={d.usuario_id || d.correo_destino} sx={{ px: 2, py: 1.15, borderBottom: indice < preview.muestra.length - 1 ? '1px solid #edf1f5' : 'none' }}>
                  <Typography noWrap sx={{ fontSize: 12 }}>{d.nombre_destinatario || 'Sin nombre'}{d.correo_destino ? ` · ${d.correo_destino}` : ''}</Typography>
                </Box>)}
              </Box>
            </Paper>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Button onClick={() => setPaso(1)}>Anterior</Button><Button variant="contained" startIcon={<SendOutlinedIcon />} disabled={!preview?.total || preparando} onClick={guardar}>{preparando ? 'Preparando…' : 'Preparar envío'}</Button></Stack>
          </Stack>}
        </Box>
      </Paper>
    </Paper>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
    <ConfirmarEnvioCampaniaDialog campania={confirmar} onClose={() => setConfirmar(null)} onConfirmar={enviar} />
  </Box>

  if (modo === 'detalle') return <Box className="page-wrapper">
    <PageHeader titulo={detalle?.campania?.nombre || 'Detalle de campaña'} descripcion="Resultados del comunicado." icono={<VisibilityOutlinedIcon />} acciones={<BotonVolver onClick={() => setModo('lista')} />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, alignItems: { sm: 'center' } }}>
        <Chip label={etiquetaEstado[detalle?.campania?.estado] || detalle?.campania?.estado} color={colorEstado[detalle?.campania?.estado] || 'default'} />
        <Chip variant="outlined" label={`${detalle?.campania?.total_enviados || 0} enviados`} />
        <Chip variant="outlined" color="error" label={`${detalle?.campania?.total_errores || 0} errores`} />
        <Box sx={{ flex: 1 }} />
        {detalle?.campania?.total_errores > 0 && <Button variant="outlined" color="warning" startIcon={<SendOutlinedIcon />} onClick={reenviarErrores}>Reenviar errores</Button>}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {detalle?.campania?.canal_interno && <Chip size="small" label="Sistema" />}
        {detalle?.campania?.canal_correo && <Chip size="small" label="Correo" />}
        {detalle?.campania?.canal_push && <Chip size="small" label="App push" />}
        {detalle?.campania?.publicar_inicio_app && <Chip size="small" color="primary" label="Carrusel app" />}
      </Stack>
      <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #dbe5f0' }}><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Asunto</Typography><Typography sx={{ mt: .25, fontSize: 14, fontWeight: 850 }}>{detalle?.campania?.asunto || 'Sin asunto'}</Typography></Box>
        <Box sx={{ p: 2 }}><Box component="iframe" title="Contenido del comunicado" srcDoc={detalle?.campania?.cuerpo_html || '<p>Sin contenido</p>'} sx={{ width: '100%', minHeight: 300, border: '1px solid #e1e8f0', borderRadius: 2, bgcolor: '#fff' }} /></Box>
      </Paper>
      <Typography sx={{ mb: 1, fontSize: 12.5, fontWeight: 850 }}>Resultados por destinatario</Typography>
      <TablaGestion total={detalle?.destinatarios?.total || 0}>
        <TableHead><TableRow><TableCell>Destinatario</TableCell><TableCell>Correo</TableCell><TableCell>Sistema</TableCell><TableCell>Correo</TableCell><TableCell>Push</TableCell><TableCell>Publicación app</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
        <TableBody>{(detalle?.destinatarios?.data || []).map((d) => <TableRow key={d.id}><TableCell>{d.nombre_destinatario || '—'}</TableCell><TableCell>{d.correo_destino || '—'}</TableCell><TableCell><EstadoCanal valor={d.estado_interno} /></TableCell><TableCell><EstadoCanal valor={d.estado_correo} /></TableCell><TableCell><EstadoCanal valor={d.estado_push} /></TableCell><TableCell><EstadoCanal valor={d.estado_app} /></TableCell><TableCell><EstadoCanal valor={d.estado} /></TableCell></TableRow>)}</TableBody>
      </TablaGestion>
    </Paper>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
  </Box>

  const items = lista.data
  return <Box className="page-wrapper">
    <PageHeader titulo={soloHistorial ? 'Historial de notificaciones' : 'Comunicados'} descripcion={soloHistorial ? 'Resultados de campañas procesadas.' : 'Comunicaciones multicanal.'} icono={<CampaignOutlinedIcon />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
        <TextField select size="small" label="Bandeja" value={estadoFiltro} onChange={(e) => { const estado = e.target.value; setEstadoFiltro(estado); cargar(1, lista.per_page, estado) }} sx={{ width: { xs: '100%', sm: 230 } }}><MenuItem value="">Todos</MenuItem><MenuItem value="BORRADOR">Borradores</MenuItem><MenuItem value="EN_PROCESO">En proceso</MenuItem><MenuItem value="COMPLETADAS">Enviados</MenuItem><MenuItem value="CON_ERRORES">Con errores</MenuItem></TextField>
        {!soloHistorial ? <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => { setEditandoId(null); setForm(formInicial()); setModo('crear') }}>Nueva campaña</Button> : <Box />}
      </Stack>
      <TablaGestion total={items.length}>
        <TableHead><TableRow><TableCell>Campaña</TableCell><TableCell>Canales</TableCell><TableCell>Destinatarios</TableCell><TableCell>Resultados</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
        <TableBody>{items.map((item) => <TableRow key={item.id}>
          <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>{item.nombre}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.descripcion || 'Sin descripción'}</Typography></TableCell>
          <TableCell><Stack direction="row" spacing={.5} sx={{ flexWrap: 'wrap' }}>{item.canal_interno && <Chip size="small" label="Sistema" />}{item.canal_correo && <Chip size="small" label="Correo" />}{item.canal_push && <Chip size="small" label="Push" />}{item.publicar_inicio_app && <Chip size="small" color="primary" label="Carrusel" />}</Stack></TableCell>
          <TableCell>{item.total_destinatarios}</TableCell><TableCell>{item.total_enviados} enviados · {item.total_errores} errores</TableCell>
          <TableCell><Chip size="small" label={etiquetaEstado[item.estado] || item.estado} color={colorEstado[item.estado] || 'default'} /></TableCell>
          <TableCell align="right"><Tooltip title="Ver detalle"><IconButton onClick={() => abrirDetalle(item.id)}><VisibilityOutlinedIcon /></IconButton></Tooltip>{item.estado === 'BORRADOR' && <><Tooltip title="Editar"><IconButton color="info" onClick={() => editarBorrador(item)}><EditOutlinedIcon /></IconButton></Tooltip><Tooltip title="Enviar"><IconButton color="primary" onClick={() => setConfirmar(item)}><SendOutlinedIcon /></IconButton></Tooltip><Tooltip title="Eliminar"><IconButton color="error" onClick={() => eliminarBorrador(item)}><DeleteOutlineOutlinedIcon /></IconButton></Tooltip></>}</TableCell>
        </TableRow>)}</TableBody>
      </TablaGestion>
      <PaginacionTabla total={lista.total} page={lista.current_page} rowsPerPage={lista.per_page} onPageChange={(p) => cargar(p)} onRowsPerPageChange={(n) => cargar(1, n)} />
    </Paper>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
    <ConfirmarEnvioCampaniaDialog campania={confirmar} onClose={() => setConfirmar(null)} onConfirmar={enviar} />
  </Box>
}

function EstadoCanal({ valor }) {
  const estado = valor || 'OMITIDO'
  const color = estado === 'ENVIADA' ? 'success' : estado === 'ERROR' ? 'error' : ['EN_COLA', 'PROCESANDO'].includes(estado) ? 'info' : 'default'
  return <Chip size="small" label={estado} color={color} variant={estado === 'OMITIDO' ? 'outlined' : 'filled'} />
}
