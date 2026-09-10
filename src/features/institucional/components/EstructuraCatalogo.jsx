import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { Autocomplete, Box, Chip, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx'
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { EstadoToggleCell } from '../../../components/tables/EstadoToggleCell.jsx'
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx'
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { formStyles } from '../../../styles/formStyles.js'
import { cambiarEstadoInstitucional, guardarCarreraArea, guardarSede, guardarUnidad, listarEstructura } from '../services/estructuraInstitucionalService.js'

const configuracion = {
  sedes: {
    titulo: 'Sedes', singular: 'sede',
    descripcion: 'Administra las sedes, sucursales y ubicaciones de operación.',
    ayuda: 'Las sedes identifican dónde funciona cada área o servicio de Revive.',
    clave: 'sedes', pk: 'id_sede', icono: LocationOnOutlinedIcon, color: '#0b6bcb',
  },
  unidades: {
    titulo: 'Facultades / Direcciones', singular: 'facultad o dirección',
    descripcion: 'Registra facultades o direcciones asociadas a una sede.',
    ayuda: 'Una misma facultad o dirección puede existir en varias sedes, pero cada relación se registra individualmente y genera un código propio.',
    clave: 'unidades', pk: 'id_sede_unidad', icono: AccountBalanceOutlinedIcon, color: '#7c3aed',
  },
  'carreras-areas': {
    titulo: 'Carreras / Áreas', singular: 'carrera o área',
    descripcion: 'Administra carreras o áreas por sede y facultad/dirección.',
    ayuda: 'Selecciona primero la sede. Luego podrás elegir únicamente las facultades o direcciones activas disponibles en esa sede.',
    clave: 'carreras_areas', pk: 'id_carrera_area', icono: CategoryOutlinedIcon, color: '#047857',
  },
}

const vacio = {
  sedes: { nombre: '', codigo: '', aliases: [], activo: true },
  unidades: { nombre: '', tipo: 'FACULTAD', id_sede: '', codigo: '', aliases: [], activo: true },
  'carreras-areas': { nombre: '', tipo: 'CARRERA', id_sede: '', id_sede_unidad: '', codigo: '', codigo_ces: '', id_campo_amplio: '', aliases: [], activo: true },
}

const filtrosIniciales = {
  codigo: [], nombre: [], tipo: [], sede: [], estructura: [], codigo_ces: [], campo_amplio: [], estado: [],
}

const normalizar = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

const valorFiltro = (valor) => String(valor ?? '—')
const opcionesUnicas = (filas, obtener) => Array.from(new Set(filas.map((fila) => valorFiltro(obtener(fila)))))
  .sort((a, b) => a.localeCompare(b, 'es'))
  .map((valor) => ({ value: valor, label: valor }))
const coincide = (seleccionados, valor) => !seleccionados?.length || seleccionados.includes(valorFiltro(valor))

function codigoVista(seccion, form, datos) {
  if (!form.nombre) return ''
  if (seccion === 'sedes') return `SEDE_${normalizar(form.nombre)}`

  if (seccion === 'unidades') {
    const sede = datos.sedes.find((item) => String(item.id_sede) === String(form.id_sede))
    if (!sede) return ''
    return `${form.tipo}_${normalizar(sede.codigo).replace(/^SEDE_/, '')}_${normalizar(form.nombre)}`
  }

  const sede = datos.sedes.find((item) => String(item.id_sede) === String(form.id_sede))
  if (!sede) return ''
  return `${form.tipo}_${normalizar(sede.codigo).replace(/^SEDE_/, '')}_${normalizar(form.nombre)}`
}

export function EstructuraCatalogo({ seccion }) {
  const config = configuracion[seccion]
  const IconoCatalogo = config.icono
  const [datos, setDatos] = useState({ sedes: [], unidades: [], carreras_areas: [], campos_amplios: [] })
  const [form, setForm] = useState({ ...vacio[seccion] })
  const [editando, setEditando] = useState(null)
  const [modoForm, setModoForm] = useState(false)
  const [buscar, setBuscar] = useState('')
  const [filtrosColumna, setFiltrosColumna] = useState(filtrosIniciales)
  const [page, setPage] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    try { setDatos(await listarEstructura()) } finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { setFiltrosColumna(filtrosIniciales); setPage(1) }, [seccion])

  const filas = useMemo(() => datos[config.clave] || [], [datos, config.clave])
  const filtradas = useMemo(() => filas.filter((fila) => {
    const texto = [fila.codigo, fila.codigo_ces, fila.nombre, fila.tipo, fila.sede_nombre, fila.unidad_nombre, fila.campo_amplio_nombre, ...(fila.aliases || []), fila.activo ? 'activo' : 'inactivo'].join(' ').toLowerCase()
    const estado = (seccion === 'unidades' ? fila.relacion_activa : fila.activo) ? 'Activo' : 'Inactivo'
    return texto.includes(buscar.toLowerCase())
      && coincide(filtrosColumna.codigo, fila.codigo)
      && coincide(filtrosColumna.nombre, fila.nombre)
      && coincide(filtrosColumna.tipo, fila.tipo === 'DIRECCION' ? 'Dirección' : fila.tipo ? fila.tipo.charAt(0) + fila.tipo.slice(1).toLowerCase() : '—')
      && coincide(filtrosColumna.sede, fila.sede_nombre)
      && coincide(filtrosColumna.estructura, fila.unidad_nombre)
      && coincide(filtrosColumna.codigo_ces, fila.codigo_ces)
      && coincide(filtrosColumna.campo_amplio, fila.campo_amplio_nombre)
      && coincide(filtrosColumna.estado, estado)
  }), [filas, buscar, filtrosColumna, seccion])
  const visibles = filtradas.slice((page - 1) * porPagina, page * porPagina)

  const opcionesFiltro = useMemo(() => ({
    codigo: opcionesUnicas(filas, (f) => f.codigo),
    nombre: opcionesUnicas(filas, (f) => f.nombre),
    tipo: opcionesUnicas(filas, (f) => f.tipo === 'DIRECCION' ? 'Dirección' : f.tipo ? f.tipo.charAt(0) + f.tipo.slice(1).toLowerCase() : '—'),
    sede: opcionesUnicas(filas, (f) => f.sede_nombre),
    estructura: opcionesUnicas(filas, (f) => f.unidad_nombre),
    codigo_ces: opcionesUnicas(filas, (f) => f.codigo_ces),
    campo_amplio: opcionesUnicas(filas, (f) => f.campo_amplio_nombre),
    estado: [{ value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }],
  }), [filas])

  const cambiarFiltro = (campo, valor) => {
    setFiltrosColumna((actual) => ({ ...actual, [campo]: valor }))
    setPage(1)
  }

  const sedesActivas = useMemo(() => datos.sedes.filter((sede) => sede.activo || String(sede.id_sede) === String(form.id_sede)), [datos.sedes, form.id_sede])

  const unidadesValidas = useMemo(() => datos.unidades.filter((unidad) => {
    const tipoValido = form.tipo === 'CARRERA' ? unidad.tipo === 'FACULTAD' : unidad.tipo === 'DIRECCION'
    const sedeValida = String(unidad.id_sede) === String(form.id_sede)
    const seleccionActual = String(unidad.id_sede_unidad) === String(form.id_sede_unidad)
    return tipoValido && sedeValida && ((unidad.activo && unidad.relacion_activa) || seleccionActual)
  }), [datos.unidades, form.tipo, form.id_sede, form.id_sede_unidad])

  const camposAmpliosActivos = useMemo(() => datos.campos_amplios.filter((item) => item.activo || String(item.id_campo_amplio) === String(form.id_campo_amplio)), [datos.campos_amplios, form.id_campo_amplio])

  const nuevo = () => { setEditando(null); setForm({ ...vacio[seccion] }); setModoForm(true) }

  const editar = (fila) => {
    setEditando(fila)
    if (seccion === 'sedes') setForm({ nombre: fila.nombre, codigo: fila.codigo, aliases: fila.aliases || [], activo: Boolean(fila.activo) })
    else if (seccion === 'unidades') setForm({ nombre: fila.nombre, tipo: fila.tipo, id_sede: fila.id_sede, codigo: fila.codigo, aliases: fila.aliases || [], activo: Boolean(fila.relacion_activa) })
    else setForm({ nombre: fila.nombre, tipo: fila.tipo, id_sede: fila.id_sede || '', id_sede_unidad: fila.id_sede_unidad || '', codigo: fila.codigo, codigo_ces: fila.codigo_ces || '', id_campo_amplio: fila.id_campo_amplio || '', aliases: fila.aliases || [], activo: Boolean(fila.activo) })
    setModoForm(true)
  }

  const actualizar = (cambios) => setForm((actual) => {
    const siguiente = { ...actual, ...cambios }
    siguiente.codigo = codigoVista(seccion, siguiente, datos)
    return siguiente
  })

  const guardar = async () => {
    if (guardando || !form.nombre.trim()) return
    if (seccion === 'unidades' && !form.id_sede) return setError('Selecciona una sede.')
    if (seccion === 'carreras-areas' && !form.id_sede) return setError('Selecciona una sede.')
    if (seccion === 'carreras-areas' && !form.id_sede_unidad) return setError('Selecciona una estructura.')
    if (seccion === 'carreras-areas' && form.tipo === 'CARRERA' && (!form.codigo_ces.trim() || !form.id_campo_amplio)) return setError('Código interno y campo amplio son obligatorios para una carrera.')

    setGuardando(true)
    try {
      if (seccion === 'sedes') await guardarSede(form, editando?.id_sede)
      else if (seccion === 'unidades') await guardarUnidad(form, editando?.id_sede_unidad)
      else {
        const payload = { ...form }
        delete payload.id_sede
        await guardarCarreraArea(payload, editando?.id_carrera_area)
      }
      setMensaje('Registro guardado correctamente.')
      setModoForm(false)
      await cargar()
    } catch (e) {
      setError(e.response?.data?.mensaje || Object.values(e.response?.data?.errores || {}).flat().find(Boolean) || 'No se pudo guardar.')
    } finally { setGuardando(false) }
  }

  const alternar = async (fila) => {
    const id = fila[config.pk]
    const actual = seccion === 'unidades' ? Boolean(fila.relacion_activa) : Boolean(fila.activo)
    await cambiarEstadoInstitucional(seccion, id, !actual)
    await cargar()
  }

  return (
    <Box className="page-wrapper">
      <PageHeader icono={<IconoCatalogo />} titulo={modoForm ? `${editando ? 'Editar' : 'Nueva'} ${config.singular}` : config.titulo} descripcion={modoForm ? `Completa la información de la ${config.singular}.` : config.descripcion} acciones={modoForm ? <BotonVolver onClick={() => setModoForm(false)} /> : null} />

      <Paper className="page-content-container" elevation={0}>
        {modoForm ? (
          <Paper elevation={0} sx={{ ...formStyles.seccion, width: '100%', maxWidth: 'none', m: 0, overflow: 'hidden', p: 0 }}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" spacing={1.2} sx={{ mb: 2.5, alignItems: 'center', color: config.color }}><InfoOutlinedIcon fontSize="small" /><Typography sx={{ fontSize: 13, fontWeight: 750, color: '#52677d' }}>{config.ayuda}</Typography></Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                <TextField label="Nombre" value={form.nombre} onChange={(e) => actualizar({ nombre: e.target.value })} required />
                {seccion !== 'sedes' ? <TextField select label="Tipo" value={form.tipo} onChange={(e) => actualizar({ tipo: e.target.value, id_sede_unidad: '' })}>{(seccion === 'unidades' ? ['FACULTAD', 'DIRECCION'] : ['CARRERA', 'AREA']).map((valor) => <MenuItem key={valor} value={valor}>{valor === 'DIRECCION' ? 'Dirección' : valor.charAt(0) + valor.slice(1).toLowerCase()}</MenuItem>)}</TextField> : null}
                {seccion === 'unidades' ? <TextField select label="Sede" value={form.id_sede} onChange={(e) => actualizar({ id_sede: e.target.value })} required>{sedesActivas.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}</TextField> : null}
                {seccion === 'carreras-areas' ? <>
                  <TextField select label="Sede" value={form.id_sede} onChange={(e) => actualizar({ id_sede: e.target.value, id_sede_unidad: '' })} required>{sedesActivas.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}</TextField>
                  <TextField select label="Facultad / Dirección" value={form.id_sede_unidad} onChange={(e) => actualizar({ id_sede_unidad: e.target.value })} disabled={!form.id_sede} helperText={!form.id_sede ? 'Selecciona primero una sede.' : ''} required>{unidadesValidas.map((unidad) => <MenuItem key={unidad.id_sede_unidad} value={unidad.id_sede_unidad}>{unidad.nombre}</MenuItem>)}</TextField>
                  <TextField label="Código interno" value={form.codigo_ces} onChange={(e) => actualizar({ codigo_ces: e.target.value })} required={form.tipo === 'CARRERA'} />
                  <TextField select label="Campo amplio" value={form.id_campo_amplio} onChange={(e) => actualizar({ id_campo_amplio: e.target.value })} required={form.tipo === 'CARRERA'}><MenuItem value="">Sin especificar</MenuItem>{camposAmpliosActivos.map((item) => <MenuItem key={item.id_campo_amplio} value={item.id_campo_amplio}>{item.nombre}</MenuItem>)}</TextField>
                </> : null}
                <TextField label="Código generado" value={codigoVista(seccion, form, datos)} slotProps={{ input: { readOnly: true } }} helperText="Se genera automáticamente según el tipo, la sede y el nombre." />
                <Box sx={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, gap: 2, alignItems: 'center' }}>
                  <Autocomplete multiple freeSolo options={[]} value={form.aliases || []} onChange={(_, aliases) => actualizar({ aliases })} renderInput={(params) => <TextField {...params} label="Alias alternativos (opcional)" placeholder={(form.aliases || []).length ? '' : 'Escribe un alias y presiona Enter'} />} />
                  <Box sx={{ minHeight: 56, px: 1.5, display: 'flex', alignItems: 'center', border: '1px solid #dbe5f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}><FormControlLabel control={<Switch checked={form.activo} onChange={(e) => actualizar({ activo: e.target.checked })} />} label="Activo" /></Box>
                </Box>
              </Box>
              <AccionesFormulario onCancelar={() => setModoForm(false)} onGuardar={guardar} guardando={guardando} />
            </Box>
          </Paper>
        ) : <>
          <GestionToolbar total={filtradas.length} busqueda={buscar} onBusqueda={(valor) => { setBuscar(valor); setPage(1) }} acciones={<BotonAnadir onClick={nuevo} />} />
          <TablaGestion total={filas.length} filtrados={filtradas.length} page={page} onPageChange={setPage} rowsPerPage={porPagina} cargando={cargando} onRowsPerPageChange={(valor) => { setPorPagina(valor); setPage(1) }}>
            <TableHead><TableRow>
              <FilterHeaderCell value={filtrosColumna.codigo} onChange={(v) => cambiarFiltro('codigo', v)} options={opcionesFiltro.codigo}>Código</FilterHeaderCell>
              <FilterHeaderCell value={filtrosColumna.nombre} onChange={(v) => cambiarFiltro('nombre', v)} options={opcionesFiltro.nombre}>Nombre</FilterHeaderCell>
              {seccion !== 'sedes' ? <FilterHeaderCell value={filtrosColumna.tipo} onChange={(v) => cambiarFiltro('tipo', v)} options={opcionesFiltro.tipo}>Tipo</FilterHeaderCell> : null}
              {seccion === 'unidades' ? <FilterHeaderCell value={filtrosColumna.sede} onChange={(v) => cambiarFiltro('sede', v)} options={opcionesFiltro.sede}>Sede</FilterHeaderCell> : null}
              {seccion === 'carreras-areas' ? <>
                <FilterHeaderCell value={filtrosColumna.sede} onChange={(v) => cambiarFiltro('sede', v)} options={opcionesFiltro.sede}>Sede</FilterHeaderCell>
                <FilterHeaderCell value={filtrosColumna.estructura} onChange={(v) => cambiarFiltro('estructura', v)} options={opcionesFiltro.estructura}>Facultad / Dirección</FilterHeaderCell>
                <FilterHeaderCell value={filtrosColumna.codigo_ces} onChange={(v) => cambiarFiltro('codigo_ces', v)} options={opcionesFiltro.codigo_ces}>Código interno</FilterHeaderCell>
                <FilterHeaderCell value={filtrosColumna.campo_amplio} onChange={(v) => cambiarFiltro('campo_amplio', v)} options={opcionesFiltro.campo_amplio}>Campo amplio</FilterHeaderCell>
              </> : null}
              <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => cambiarFiltro('estado', v)} options={opcionesFiltro.estado}>Estado</FilterHeaderCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {visibles.length ? visibles.map((fila) => <TableRow key={fila[config.pk]} hover>
                <TableCell><Chip size="small" variant="outlined" label={fila.codigo} /></TableCell>
                <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{fila.nombre}</Typography></TableCell>
                {seccion !== 'sedes' ? <TableCell><Chip size="small" label={fila.tipo === 'DIRECCION' ? 'Dirección' : fila.tipo.charAt(0) + fila.tipo.slice(1).toLowerCase()} /></TableCell> : null}
                {seccion === 'unidades' ? <TableCell>{fila.sede_nombre}</TableCell> : null}
                {seccion === 'carreras-areas' ? <><TableCell>{fila.sede_nombre || '—'}</TableCell><TableCell>{fila.unidad_nombre || '—'}</TableCell><TableCell>{fila.codigo_ces || '—'}</TableCell><TableCell>{fila.campo_amplio_nombre || '—'}</TableCell></> : null}
                <TableCell><EstadoToggleCell activo={seccion === 'unidades' ? Boolean(fila.relacion_activa) : Boolean(fila.activo)} onToggle={() => alternar(fila)} /></TableCell>
                <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => editar(fila)}><EditOutlinedIcon /></IconButton></Tooltip></TableCell>
              </TableRow>) : <TablaEstadoFila colSpan={seccion === 'carreras-areas' ? 9 : seccion === 'unidades' ? 6 : 4} cargando={cargando} texto="No existen registros por ahora." />}
            </TableBody>
          </TablaGestion>
        </>}
      </Paper>
      <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje('')} />
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError('')} />
    </Box>
  )
}
