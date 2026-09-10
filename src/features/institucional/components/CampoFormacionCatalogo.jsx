import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Chip, FormControlLabel, IconButton, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
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
import { cambiarEstadoCampoAmplio, guardarCampoAmplio, listarCamposFormacion } from '../services/estructuraInstitucionalService.js'

const filtrosIniciales = { nombre: [], codigo: [], estado: [] }
const valorFiltro = (valor) => String(valor ?? '—')
const opcionesUnicas = (filas, obtener) => Array.from(new Set(filas.map((fila) => valorFiltro(obtener(fila)))))
  .sort((a, b) => a.localeCompare(b, 'es'))
  .map((valor) => ({ value: valor, label: valor }))
const coincide = (seleccionados, valor) => !seleccionados?.length || seleccionados.includes(valorFiltro(valor))

export function CampoFormacionCatalogo() {
  const [datos, setDatos] = useState({ campos_amplios: [] })
  const [buscar, setBuscar] = useState('')
  const [filtrosColumna, setFiltrosColumna] = useState(filtrosIniciales)
  const [modoForm, setModoForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', activo: true })
  const [page, setPage] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    try { setDatos(await listarCamposFormacion()) } finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const filas = useMemo(() => datos.campos_amplios || [], [datos.campos_amplios])
  const filtradas = useMemo(() => filas.filter((fila) => {
    const estado = fila.activo ? 'Activo' : 'Inactivo'
    const texto = [fila.codigo, fila.nombre, estado].join(' ').toLowerCase()
    return texto.includes(buscar.toLowerCase())
      && coincide(filtrosColumna.nombre, fila.nombre)
      && coincide(filtrosColumna.codigo, fila.codigo)
      && coincide(filtrosColumna.estado, estado)
  }), [filas, buscar, filtrosColumna])
  const visibles = filtradas.slice((page - 1) * porPagina, page * porPagina)

  const opcionesFiltro = useMemo(() => ({
    nombre: opcionesUnicas(filas, (f) => f.nombre),
    codigo: opcionesUnicas(filas, (f) => f.codigo),
    estado: [{ value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }],
  }), [filas])

  const cambiarFiltro = (campo, valor) => {
    setFiltrosColumna((actual) => ({ ...actual, [campo]: valor }))
    setPage(1)
  }

  const nuevo = () => {
    setEditando(null)
    setForm({ nombre: '', activo: true })
    setModoForm(true)
  }

  const editar = (fila) => {
    setEditando(fila)
    setForm({ nombre: fila.nombre, activo: Boolean(fila.activo) })
    setModoForm(true)
  }

  const guardar = async () => {
    if (guardando || !form.nombre.trim()) return
    setGuardando(true)
    try {
      await guardarCampoAmplio(form, editando?.id_campo_amplio)
      setMensaje('Registro guardado correctamente.')
      setModoForm(false)
      await cargar()
    } catch (e) {
      setError(e.response?.data?.mensaje || Object.values(e.response?.data?.errores || {}).flat().find(Boolean) || 'No se pudo guardar.')
    } finally { setGuardando(false) }
  }

  const alternar = async (fila) => {
    await cambiarEstadoCampoAmplio(fila.id_campo_amplio, !fila.activo)
    await cargar()
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        icono={<CategoryOutlinedIcon />}
        titulo={modoForm ? `${editando ? 'Editar' : 'Nuevo'} campo amplio` : 'Campos amplios'}
        descripcion={modoForm ? 'Completa la información del campo amplio.' : 'Administra la clasificación institucional de campos amplios.'}
        acciones={modoForm ? <BotonVolver onClick={() => setModoForm(false)} /> : null}
      />
      <Paper className="page-content-container" elevation={0}>
        {modoForm ? (
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dbe5f0', borderRadius: 2 }}>
            <Stack spacing={2}>
              <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              <Box sx={{ minHeight: 56, px: 1.5, display: 'flex', alignItems: 'center', border: '1px solid #dbe5f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                <FormControlLabel control={<Switch checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />} label="Activo" />
              </Box>
              <AccionesFormulario onCancelar={() => setModoForm(false)} onGuardar={guardar} guardando={guardando} />
            </Stack>
          </Paper>
        ) : <>
          <GestionToolbar total={filtradas.length} busqueda={buscar} onBusqueda={(valor) => { setBuscar(valor); setPage(1) }} acciones={<BotonAnadir onClick={nuevo} />} />
          <TablaGestion total={filas.length} filtrados={filtradas.length} page={page} onPageChange={setPage} rowsPerPage={porPagina} cargando={cargando} onRowsPerPageChange={(valor) => { setPorPagina(valor); setPage(1) }}>
            <TableHead><TableRow>
              <FilterHeaderCell value={filtrosColumna.nombre} onChange={(v) => cambiarFiltro('nombre', v)} options={opcionesFiltro.nombre}>Campo amplio</FilterHeaderCell>
              <FilterHeaderCell value={filtrosColumna.codigo} onChange={(v) => cambiarFiltro('codigo', v)} options={opcionesFiltro.codigo}>Código</FilterHeaderCell>
              <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => cambiarFiltro('estado', v)} options={opcionesFiltro.estado}>Estado</FilterHeaderCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {visibles.length ? visibles.map((fila) => <TableRow key={fila.id_campo_amplio} hover>
                <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{fila.nombre}</Typography></TableCell>
                <TableCell><Chip size="small" variant="outlined" label={fila.codigo} /></TableCell>
                <TableCell><EstadoToggleCell activo={Boolean(fila.activo)} onToggle={() => alternar(fila)} /></TableCell>
                <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => editar(fila)}><EditOutlinedIcon /></IconButton></Tooltip></TableCell>
              </TableRow>) : <TablaEstadoFila colSpan={4} cargando={cargando} texto="No existen registros por ahora." />}
            </TableBody>
          </TablaGestion>
        </>}
      </Paper>
      <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje('')} />
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError('')} />
    </Box>
  )
}
