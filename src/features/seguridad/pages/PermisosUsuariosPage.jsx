import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Alert, Box, MenuItem, Paper, Stack, TextField } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx'
import { confirmarAccion } from '../../../utils/confirmacion.js'
import { FuncionesUsuarioPanel } from '../components/FuncionesUsuarioPanel.jsx'
import { PermisosUsuariosTable } from '../components/PermisosUsuariosTable.jsx'
import { guardarAccesosUsuario, listarFuncionesDisponibles, listarFuncionesRol, listarFuncionesUsuario, listarRoles, listarUsuarios } from '../services/usuarioService.js'

const metaInicial = { pagina_actual: 1, por_pagina: 5, total: 0, opciones_filtro: { usuario: [], correo: [] } }
const obtenerCodigos = (grupos = []) => grupos.flatMap((grupo) => grupo.funciones.map((funcion) => funcion.id_menu))
const obtenerMensajeError = (error, respaldo) => {
  const datos = error?.response?.data
  const errores = datos?.errors
  const primerError = errores && typeof errores === 'object'
    ? Object.values(errores).flat().find(Boolean)
    : null

  return primerError || datos?.mensaje || datos?.message || error?.message || respaldo
}

export function PermisosUsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [meta, setMeta] = useState(metaInicial)
  const [roles, setRoles] = useState([])
  const [filtros, setFiltros] = useState({ busqueda: '', usuario: [], correo: [], rol: [], estado: [], page: 1, per_page: 5 })
  const [usuario, setUsuario] = useState(null)
  const [rol, setRol] = useState('')
  const [grupos, setGrupos] = useState([])
  const [rolBase, setRolBase] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [inicial, setInicial] = useState({ rol: '', funciones: [] })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const modificado = usuario && (String(rol) !== String(inicial.rol) || JSON.stringify([...seleccionadas].sort()) !== JSON.stringify([...inicial.funciones].sort()))

  const cargar = useCallback(async (parametros) => {
    setCargando(true)
    try {
      const respuesta = await listarUsuarios(parametros)
      setUsuarios(respuesta.datos)
      setMeta(respuesta.meta)
    } finally { setCargando(false) }
  }, [])

  useEffect(() => {
    Promise.all([listarRoles(), cargar(filtros)]).then(([rolesData]) => setRoles(rolesData))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = async (seleccionado) => {
    setCargando(true)
    setError('')
    try {
      const [disponibles, funcionesRol, funcionesUsuario] = await Promise.all([
        listarFuncionesDisponibles(),
        listarFuncionesRol(seleccionado.usr_tipo),
        listarFuncionesUsuario(seleccionado.id),
      ])
      const codigos = funcionesUsuario.map((funcion) => funcion.id_menu)
      setUsuario(seleccionado)
      setRol(seleccionado.usr_tipo)
      setGrupos(disponibles)
      setRolBase(obtenerCodigos(funcionesRol))
      setSeleccionadas(codigos)
      setInicial({ rol: seleccionado.usr_tipo, funciones: codigos })
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudieron cargar los accesos del usuario.'))
    } finally { setCargando(false) }
  }

  const cambiarRol = async (nuevoRol) => {
    setRol(nuevoRol)
    setError('')
    try {
      const funcionesRol = await listarFuncionesRol(nuevoRol)
      const codigos = obtenerCodigos(funcionesRol)
      setRolBase(codigos)
      setSeleccionadas(codigos)
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudieron cargar los permisos del rol seleccionado.'))
    }
  }

  const alternar = (codigo) => setSeleccionadas((actuales) => actuales.includes(codigo) ? actuales.filter((item) => item !== codigo) : [...actuales, codigo])
  const cambiarFiltro = (campo, valor) => {
    const nuevos = { ...filtros, [campo]: valor, page: 1 }
    setFiltros(nuevos)
    cargar(nuevos)
  }

  const volver = async () => {
    if (modificado) {
      const confirmado = await confirmarAccion({ titulo: 'Salir sin guardar', texto: 'Se perderán los cambios de rol y permisos.', textoConfirmar: 'Sí, salir', textoCancelar: 'Continuar editando', icono: 'warning' })
      if (!confirmado) return
    }
    setUsuario(null)
    setError('')
  }

  const guardar = async () => {
    setCargando(true)
    setError('')
    try {
      await guardarAccesosUsuario(usuario.id, Number(rol), seleccionadas)
      setMensaje('Rol y permisos actualizados correctamente.')
      setUsuario(null)
      await cargar(filtros)
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudieron guardar los accesos.'))
    } finally { setCargando(false) }
  }

  if (usuario) return <Box className="page-wrapper">
    <PageHeader titulo={`Accesos de ${usuario.name}`} descripcion="Asigna el rol y los permisos de navegación." icono={<SecurityOutlinedIcon />} acciones={<BotonVolver texto="Volver" onClick={volver} />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <FuncionesUsuarioPanel
        grupos={grupos}
        funcionesRolBase={rolBase}
        seleccionadas={seleccionadas}
        disabled={cargando}
        onToggle={alternar}
        onSincronizar={() => setSeleccionadas(rolBase)}
        controlRol={<TextField select label="Rol" value={rol} onChange={(evento) => cambiarRol(evento.target.value)} disabled={cargando} sx={{ width: { xs: 220, sm: 300 } }}>
          {roles.map((item) => <MenuItem key={item.id_userrole} value={item.id_userrole}>{item.role}</MenuItem>)}
        </TextField>}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        <BotonVolver texto="Cancelar" onClick={volver} disabled={cargando} />
        <BotonGuardar texto="Guardar accesos" onClick={guardar} guardando={cargando} disabled={!modificado} />
      </Stack>
    </Paper>
  </Box>

  return <Box className="page-wrapper">
    <PageHeader titulo="Permisos de usuarios" descripcion="Asigna roles y permisos sin modificar los demás datos de la cuenta." icono={<ManageAccountsOutlinedIcon />} />
    <Paper className="page-content-container" elevation={0}>
      {error ? <Alert severity="error" sx={{ m: 2 }}>{error}</Alert> : null}
      <GestionToolbar total={meta.total} busqueda={filtros.busqueda} onBusqueda={(busqueda) => { const nuevos = { ...filtros, busqueda, page: 1 }; setFiltros(nuevos); cargar(nuevos) }} />
      <PermisosUsuariosTable usuarios={usuarios} meta={meta} roles={roles} filtros={filtros} cargando={cargando} onFiltro={cambiarFiltro} onAdministrar={abrir}
        onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos) }}
        onRowsPerPageChange={(per_page) => { const nuevos = { ...filtros, page: 1, per_page }; setFiltros(nuevos); cargar(nuevos) }} />
    </Paper>
    <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje('')} />
  </Box>
}
