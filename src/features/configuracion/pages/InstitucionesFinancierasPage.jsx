import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx'
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { CampoActivo } from '../../../components/common/CampoActivo.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { EstadoToggleCell } from '../../../components/tables/EstadoToggleCell.jsx'
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx'
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { configuracionServicio } from '../services/configuracionServicio.js'

export const TIPOS_INSTITUCION = [
  { value: 'BANCO', label: 'Banco' },
  { value: 'COOPERATIVA', label: 'Cooperativa' },
  { value: 'MUTUALISTA', label: 'Mutualista' },
  { value: 'OTRA', label: 'Otra' },
]
const nombreTipo = (tipo) => TIPOS_INSTITUCION.find((t) => t.value === tipo)?.label || tipo
const filtrosIniciales = { nombre: [], tipo: [], estado: [] }
const opcionesUnicas = (filas, obtener) => Array.from(new Set(filas.map((fila) => String(obtener(fila) ?? '—'))))
  .sort((a, b) => a.localeCompare(b, 'es'))
  .map((valor) => ({ value: valor, label: valor }))
const coincide = (seleccionados, valor) => !seleccionados?.length || seleccionados.includes(String(valor ?? '—'))
const vacio = { nombre: '', tipo: 'BANCO', orden: 100, activo: true }
const mensajeError = (e) => Object.values(e.response?.data?.errors || e.response?.data?.errores || {}).flat().find(Boolean)
  || e.response?.data?.mensaje || 'No se pudo guardar.'

/** Bancos y cooperativas que se eligen al registrar una transferencia o un depósito. */
export function InstitucionesFinancierasPage() {
  const [filas, setFilas] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtrosColumna, setFiltrosColumna] = useState(filtrosIniciales)
  const [modoForm, setModoForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(vacio)
  const [page, setPage] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    try { setFilas(await configuracionServicio.listarInstitucionesFinancieras()) }
    catch (e) { setError(mensajeError(e)) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const filtradas = useMemo(() => filas.filter((fila) => {
    const estado = fila.activo ? 'Activo' : 'Inactivo'
    const texto = [fila.nombre, nombreTipo(fila.tipo), estado].join(' ').toLocaleLowerCase('es')
    return texto.includes(buscar.toLocaleLowerCase('es'))
      && coincide(filtrosColumna.nombre, fila.nombre)
      && coincide(filtrosColumna.tipo, nombreTipo(fila.tipo))
      && coincide(filtrosColumna.estado, estado)
  }), [filas, buscar, filtrosColumna])
  const visibles = filtradas.slice((page - 1) * porPagina, page * porPagina)

  const opcionesFiltro = useMemo(() => ({
    nombre: opcionesUnicas(filas, (f) => f.nombre),
    tipo: opcionesUnicas(filas, (f) => nombreTipo(f.tipo)),
    estado: [{ value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }],
  }), [filas])

  const cambiarFiltro = (campo, valor) => {
    setFiltrosColumna((actual) => ({ ...actual, [campo]: valor }))
    setPage(1)
  }

  const abrir = (fila = null) => {
    setEditando(fila)
    setForm(fila ? { nombre: fila.nombre, tipo: fila.tipo, orden: fila.orden, activo: Boolean(fila.activo) } : vacio)
    setModoForm(true)
  }

  const guardar = async () => {
    if (guardando) return
    if (!form.nombre.trim()) { setError('Escribe el nombre del banco o cooperativa.'); return }
    setGuardando(true)
    try {
      await configuracionServicio.guardarInstitucionFinanciera({ ...form, nombre: form.nombre.trim(), orden: Number(form.orden || 0) }, editando?.id)
      setMensaje(editando ? 'Institución actualizada.' : 'Institución creada.')
      setModoForm(false)
      await cargar()
    } catch (e) { setError(mensajeError(e)) }
    finally { setGuardando(false) }
  }

  const alternar = async (fila) => {
    try {
      await configuracionServicio.cambiarEstadoInstitucionFinanciera(fila.id, !fila.activo)
      setMensaje(fila.activo ? `${fila.nombre} inactivada. Los cobros anteriores la conservan.` : `${fila.nombre} activada.`)
      await cargar()
    } catch (e) { setError(mensajeError(e)) }
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        icono={<AccountBalanceOutlinedIcon />}
        titulo={modoForm ? `${editando ? 'Editar' : 'Nueva'} institución financiera` : 'Instituciones financieras'}
        descripcion={modoForm ? 'Banco o cooperativa que se elige al registrar una transferencia o un depósito.' : 'Bancos y cooperativas para registrar transferencias y depósitos.'}
        acciones={modoForm ? <BotonVolver onClick={() => setModoForm(false)} /> : null}
      />
      <Paper className="page-content-container" elevation={0}>
        {modoForm ? (
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dbe5f0', borderRadius: 2 }}>
            <Stack spacing={2}>
              <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              <TextField select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS_INSTITUCION.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField label="Orden en la lista" type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })}
                helperText="Las de menor número salen primero dentro de su tipo." />
              <CampoActivo checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              <AccionesFormulario onCancelar={() => setModoForm(false)} onGuardar={guardar} guardando={guardando} />
            </Stack>
          </Paper>
        ) : <>
          <GestionToolbar total={filtradas.length} busqueda={buscar} onBusqueda={(valor) => { setBuscar(valor); setPage(1) }} acciones={<BotonAnadir onClick={() => abrir()} />} />
          <TablaGestion total={filas.length} filtrados={filtradas.length} page={page} onPageChange={setPage} rowsPerPage={porPagina} cargando={cargando} onRowsPerPageChange={(valor) => { setPorPagina(valor); setPage(1) }}>
            <TableHead><TableRow>
              <FilterHeaderCell value={filtrosColumna.nombre} onChange={(v) => cambiarFiltro('nombre', v)} options={opcionesFiltro.nombre}>Institución</FilterHeaderCell>
              <FilterHeaderCell value={filtrosColumna.tipo} onChange={(v) => cambiarFiltro('tipo', v)} options={opcionesFiltro.tipo}>Tipo</FilterHeaderCell>
              <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => cambiarFiltro('estado', v)} options={opcionesFiltro.estado}>Estado</FilterHeaderCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {visibles.length ? visibles.map((fila) => <TableRow key={fila.id} hover>
                <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{fila.nombre}</Typography></TableCell>
                <TableCell>{nombreTipo(fila.tipo)}</TableCell>
                <TableCell><EstadoToggleCell activo={Boolean(fila.activo)} onToggle={() => alternar(fila)} /></TableCell>
                <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => abrir(fila)}><EditOutlinedIcon /></IconButton></Tooltip></TableCell>
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
