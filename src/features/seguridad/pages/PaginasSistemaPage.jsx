import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import WebAssetOutlinedIcon from '@mui/icons-material/WebAssetOutlined'
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { catalogoPaginasSistema } from '../../../app/paginasSistema.js'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx'
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { obtenerMensajeError } from '../../../services/mensajeError.js'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import {
  asociarPaginaSistema,
  desasociarPaginaSistema,
  listarPaginasSistema,
} from '../services/paginaSistemaService.js'

export function PaginasSistemaPage() {
  const [filas, setFilas] = useState([])
  const [selecciones, setSelecciones] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState({ menu: [], submenu: [], codigo: [], pagina: [], estado: [] })
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    try {
      const datos = await listarPaginasSistema()
      setFilas(datos)
      setSelecciones(Object.fromEntries(datos.map((fila) => [fila.id_menu, fila.clave_pagina || ''])))
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudieron consultar las páginas del sistema.'))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => {
      const estado = fila.clave_pagina ? 'asociada' : 'sin asociar'
      const coincideTexto = !texto || [fila.menu, fila.nombre, fila.id_menu, fila.clave_pagina]
        .join(' ').toLowerCase().includes(texto)
      const coincide = (seleccion, valor) => !seleccion.length || seleccion.includes(String(valor || ''))
      return coincideTexto
        && coincide(filtros.menu, fila.menu)
        && coincide(filtros.submenu, fila.nombre)
        && coincide(filtros.codigo, fila.id_menu)
        && coincide(filtros.pagina, fila.clave_pagina || 'Sin asociación')
        && coincide(filtros.estado, estado)
    })
  }, [busqueda, filas, filtros])
  const opcionesFiltro = useMemo(() => {
    const opciones = (valores) => [...new Set(valores.map((valor) => String(valor || '')))]
      .filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'))
      .map((valor) => ({ value: valor, label: valor }))
    return {
      menu: opciones(filas.map((fila) => fila.menu)),
      submenu: opciones(filas.map((fila) => fila.nombre)),
      codigo: opciones(filas.map((fila) => fila.id_menu)),
      pagina: opciones(filas.map((fila) => fila.clave_pagina || 'Sin asociación')),
      estado: [{ value: 'asociada', label: 'Asociada' }, { value: 'sin asociar', label: 'Sin asociar' }],
    }
  }, [filas])
  const totalPages = Math.max(1, Math.ceil(filtradas.length / rowsPerPage))
  const filasPagina = useMemo(
    () => filtradas.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filtradas, page, rowsPerPage],
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const cambiarFiltro = (campo, valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor }))
    setPage(1)
  }

  const guardar = async (fila) => {
    const seleccion = selecciones[fila.id_menu] || ''
    setGuardando(fila.id_menu)
    try {
      if (seleccion) await asociarPaginaSistema(fila.id_menu, seleccion)
      else await desasociarPaginaSistema(fila.id_menu)
      setMensaje(seleccion ? 'Página asociada correctamente.' : 'Página desasociada correctamente.')
      await cargar()
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudo actualizar la asociación.'))
    } finally {
      setGuardando('')
    }
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Páginas del sistema"
        descripcion="Asocia las páginas disponibles con los submenús de navegación."
        icono={<WebAssetOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={filtradas.length}
          busqueda={busqueda}
          onBusqueda={(valor) => { setBusqueda(valor); setPage(1) }}
          etiqueta="SUBMENÚS"
          acciones={<Chip variant="outlined" label={`${catalogoPaginasSistema.length} PÁGINAS DISPONIBLES`} />}
        />
        <TablaGestion
          total={filas.length}
          filtrados={filtradas.length}
          page={page}
          onPageChange={setPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(valor) => { setRowsPerPage(valor); setPage(1) }}
          cargando={cargando}
        >
          <TableHead>
              <TableRow>
                <FilterHeaderCell value={filtros.menu} onChange={(valor) => cambiarFiltro('menu', valor)} options={opcionesFiltro.menu}>Menú</FilterHeaderCell>
                <FilterHeaderCell value={filtros.submenu} onChange={(valor) => cambiarFiltro('submenu', valor)} options={opcionesFiltro.submenu}>Submenú</FilterHeaderCell>
                <FilterHeaderCell value={filtros.codigo} onChange={(valor) => cambiarFiltro('codigo', valor)} options={opcionesFiltro.codigo}>Código</FilterHeaderCell>
                <FilterHeaderCell value={filtros.pagina} onChange={(valor) => cambiarFiltro('pagina', valor)} options={opcionesFiltro.pagina} sx={{ minWidth: 280 }}>Página asociada</FilterHeaderCell>
                <FilterHeaderCell
                  value={filtros.estado}
                  onChange={(valor) => cambiarFiltro('estado', valor)}
                  align="center"
                  options={opcionesFiltro.estado}
                >Estado</FilterHeaderCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
              {filasPagina.length ? filasPagina.map((fila) => {
                const seleccion = selecciones[fila.id_menu] || ''
                const cambio = seleccion !== (fila.clave_pagina || '')
                const disponible = !seleccion || catalogoPaginasSistema.some((pagina) => pagina.clave === seleccion)
                return (
                  <TableRow key={fila.id_menu} hover>
                    <TableCell>{fila.menu}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{fila.nombre}</TableCell>
                    <TableCell><Typography component="code" sx={{ fontSize: 11 }}>{fila.id_menu}</Typography></TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={seleccion}
                        onChange={(event) => setSelecciones((actual) => ({ ...actual, [fila.id_menu]: event.target.value }))}
                        error={!disponible}
                        helperText={!disponible ? 'La página ya no existe en esta compilación.' : ''}
                      >
                        <MenuItem value=""><em>Sin asociación</em></MenuItem>
                        {!disponible ? <MenuItem value={seleccion}>{seleccion} (no disponible)</MenuItem> : null}
                        {catalogoPaginasSistema.map((pagina) => (
                          <MenuItem key={pagina.clave} value={pagina.clave}>{pagina.nombre}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        color={fila.clave_pagina && disponible ? 'success' : 'default'}
                        label={fila.clave_pagina ? (disponible ? 'Asociada' : 'No disponible') : 'Sin asociar'}
                        variant={fila.clave_pagina ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={seleccion ? 'Guardar asociación' : 'Guardar sin asociación'}>
                        <span>
                          <IconButton
                            aria-label={seleccion ? 'Guardar asociación' : 'Guardar sin asociación'}
                            disabled={!cambio || guardando === fila.id_menu}
                            onClick={() => guardar(fila)}
                            sx={dbanuStyles.actionEdit}
                          >
                            {seleccion ? <SaveOutlinedIcon sx={{ fontSize: 17 }} /> : <LinkOffOutlinedIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              }) : <TablaEstadoFila colSpan={6} cargando={cargando} texto="No existen submenús que coincidan con los filtros." />}
          </TableBody>
        </TablaGestion>
      </Paper>

      <NotificacionSnackbar mensaje={mensaje} tipo="success" onClose={() => setMensaje('')} />
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError('')} />
    </Box>
  )
}
