import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Chip, IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'

const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }))

export function PermisosUsuariosTable({ usuarios, meta, roles, filtros, cargando, onFiltro, onAdministrar, onPageChange, onRowsPerPageChange }) {
  return <TablaGestion total={meta.total} filtrados={meta.total} page={meta.pagina_actual} rowsPerPage={meta.por_pagina} cargando={cargando} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange}>
    <TableHead><TableRow>
      <FilterHeaderCell value={filtros.usuario} onChange={(valor) => onFiltro('usuario', valor)} options={opciones(meta.opciones_filtro?.usuario)}>Usuario</FilterHeaderCell>
      <FilterHeaderCell value={filtros.correo} onChange={(valor) => onFiltro('correo', valor)} options={opciones(meta.opciones_filtro?.correo)}>Correo</FilterHeaderCell>
      <FilterHeaderCell value={filtros.rol} onChange={(valor) => onFiltro('rol', valor)} options={roles.map((rol) => ({ value: String(rol.id_userrole), label: rol.role }))}>Rol actual</FilterHeaderCell>
      <FilterHeaderCell value={filtros.estado} onChange={(valor) => onFiltro('estado', valor)} options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}>Estado</FilterHeaderCell>
      <TableCell align="right">Acciones</TableCell>
    </TableRow></TableHead>
    <TableBody>
      {usuarios.map((usuario) => <TableRow key={usuario.id} hover>
        <TableCell>{usuario.name}</TableCell><TableCell>{usuario.email}</TableCell><TableCell>{usuario.rol_nombre || 'Sin rol'}</TableCell>
        <TableCell><Chip size="small" color={Number(usuario.usr_estado) === 1 ? 'success' : 'default'} label={Number(usuario.usr_estado) === 1 ? 'Activo' : 'Inactivo'} /></TableCell>
        <TableCell align="right"><Tooltip title="Administrar rol y permisos"><IconButton sx={dbanuStyles.actionView} onClick={() => onAdministrar(usuario)}><SecurityOutlinedIcon /></IconButton></Tooltip></TableCell>
      </TableRow>)}
      {!usuarios.length ? <TablaEstadoFila colSpan={5} cargando={cargando} texto="No existen usuarios que coincidan con los filtros." /> : null}
    </TableBody>
  </TablaGestion>
}
