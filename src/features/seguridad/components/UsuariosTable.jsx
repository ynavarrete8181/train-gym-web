import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { IconButton, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import { EstadoToggleCell } from '../../../components/tables/EstadoToggleCell.jsx'
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx'
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx'
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'

export function UsuariosTable({ usuarios, meta, cargando, filtrosColumna, onFiltroColumna, roles = [], onVer, onEditar, onCambiarEstado, onCambiarClave, onPageChange, onRowsPerPageChange }) {
  const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }))
  return (
    <TablaGestion
      total={meta.total}
      filtrados={meta.total}
      page={meta.pagina_actual}
      rowsPerPage={meta.por_pagina}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      cargando={cargando}
    >
      <TableHead>
        <TableRow>
          <FilterHeaderCell value={filtrosColumna.usuario} onChange={(valor) => onFiltroColumna('usuario', valor)} options={opciones(meta.opciones_filtro?.usuario)}>Usuario</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.correo} onChange={(valor) => onFiltroColumna('correo', valor)} options={opciones(meta.opciones_filtro?.correo)}>Correo</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.cedula} onChange={(valor) => onFiltroColumna('cedula', valor)} options={opciones(meta.opciones_filtro?.cedula)}>Cédula</FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.rol}
            onChange={(valor) => onFiltroColumna('rol', valor)}
            options={roles.map((rol) => ({ value: String(rol.id_userrole), label: rol.role }))}
          >
            Rol
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.estado}
            onChange={(valor) => onFiltroColumna('estado', valor)}
            options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
          >
            Estado
          </FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {usuarios.map((usuario) => (
          <TableRow key={usuario.id} hover>
            <TableCell>{usuario.name}</TableCell>
            <TableCell>{usuario.email}</TableCell>
            <TableCell>{usuario.cedula || 'Sin registrar'}</TableCell>
            <TableCell>{usuario.rol_nombre || 'Sin rol'}</TableCell>
            <TableCell>
              <EstadoToggleCell
                activo={Number(usuario.usr_estado) === 1}
                onToggle={() => onCambiarEstado(usuario)}
                confirmacion={{
                  titulo: Number(usuario.usr_estado) === 1 ? 'Inactivar usuario' : 'Activar usuario',
                  texto: Number(usuario.usr_estado) === 1
                    ? `Se inactivará a ${usuario.name} y se cerrarán sus sesiones activas.`
                    : `Se permitirá nuevamente el acceso de ${usuario.name}.`,
                  textoConfirmar: Number(usuario.usr_estado) === 1 ? 'Sí, inactivar' : 'Sí, activar',
                  icono: Number(usuario.usr_estado) === 1 ? 'warning' : 'question',
                }}
              />
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Ver detalle"><IconButton sx={dbanuStyles.actionView} onClick={() => onVer(usuario)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                <Tooltip title="Editar usuario y permisos">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(usuario)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Enviar restablecimiento de contraseña">
                  <IconButton sx={dbanuStyles.actionView} onClick={() => onCambiarClave(usuario)}>
                    <LockResetOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {!usuarios.length ? (
          <TablaEstadoFila colSpan={6} cargando={cargando} texto="No existen usuarios por ahora." />
        ) : null}
      </TableBody>
    </TablaGestion>
  )
}
