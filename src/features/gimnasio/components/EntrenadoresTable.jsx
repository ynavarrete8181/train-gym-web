import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, TableBody, TableCell, TableHead, TableRow, Typography, Stack, Tooltip } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

export function EntrenadoresTable({ entrenadores, meta, cargando, filtrosColumna = {}, onFiltroColumna, onEditar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion
      total={meta.total || 0}
      filtrados={meta.total || 0}
      page={meta.pagina_actual || 1}
      rowsPerPage={meta.por_pagina || 5}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      cargando={cargando}
    >
      <TableHead>
        <TableRow>
          <FilterHeaderCell value={filtrosColumna.persona} onChange={(v) => onFiltroColumna('persona', v)}>Persona</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.tipo} onChange={(v) => onFiltroColumna('tipo', v)} options={[{ value: 'COACH', label: 'Coach / Entrenador' }, { value: 'MASTER', label: 'Master Coach' }, { value: 'ASISTENTE', label: 'Asistente' }]}>Tipo</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.especialidad} onChange={(v) => onFiltroColumna('especialidad', v)}>Especialidad</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.usuario} onChange={(v) => onFiltroColumna('usuario', v)}>Usuario</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => onFiltroColumna('estado', v)} options={[{ value: 'ACTIVO', label: 'Activo' }, { value: 'INACTIVO', label: 'Inactivo' }]}>Estado</FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entrenadores.map((entrenador) => (
          <TableRow key={entrenador.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight="500">
                {`${entrenador.nombres || ''} ${entrenador.apellidos || ''}`.trim() || entrenador.name || 'Sin nombre'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entrenador.cedula || 'Sin identificacion'}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{entrenador.tipo || 'COACH'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{entrenador.especialidad || 'General'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">{entrenador.email}</Typography>
            </TableCell>
            <TableCell>
              <StatusChip estado={String(entrenador.estado).toLowerCase()} />
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Editar entrenador">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(entrenador)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {entrenadores.length === 0 ? (
          <TablaEstadoFila colSpan={6} cargando={cargando} texto="No existen entrenadores registrados." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
