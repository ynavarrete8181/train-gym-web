import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { IconButton, TableBody, TableCell, TableHead, TableRow, Typography, Stack, Tooltip } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

export function DeportistasTable({ deportistas, meta, cargando, filtrosColumna = {}, onFiltroColumna, onAbrirFicha, onPageChange, onRowsPerPageChange }) {
  const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));

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
          <FilterHeaderCell value={filtrosColumna.codigo} onChange={(v) => onFiltroColumna('codigo', v)} options={opciones(meta.opciones_filtro?.codigo)}>Código</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.nombres} onChange={(v) => onFiltroColumna('nombres', v)} options={opciones(meta.opciones_filtro?.nombres)}>Cliente</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.telefono} onChange={(v) => onFiltroColumna('telefono', v)} options={opciones(meta.opciones_filtro?.telefono)}>Contacto</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.sede} onChange={(v) => onFiltroColumna('sede', v)} options={opciones(meta.opciones_filtro?.sede)}>Sede</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => onFiltroColumna('estado', v)} options={[{ value: 'ACTIVO', label: 'Activo' }, { value: 'INACTIVO', label: 'Inactivo' }, { value: 'PROSPECTO', label: 'Prospecto' }, { value: 'SUSPENDIDO', label: 'Suspendido' }]}>Estado</FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {deportistas.map((deportista) => (
          <TableRow key={deportista.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight="600" color="text.secondary">
                {deportista.codigo_deportista}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="500">
                {`${deportista.nombres || ''} ${deportista.apellidos || ''}`.trim() || deportista.usuario_nombre || deportista.name || 'Sin nombre'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {deportista.usuario_email || deportista.correo || deportista.cedula || 'Sin correo'}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{deportista.telefono || 'Sin teléfono'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{deportista.sede_nombre || 'No asignada'}</Typography>
            </TableCell>
            <TableCell>
              <StatusChip estado={String(deportista.estado).toLowerCase()} />
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Abrir ficha del cliente">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onAbrirFicha && onAbrirFicha(deportista)}>
                    <ArrowForwardIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {deportistas.length === 0 ? (
          <TablaEstadoFila colSpan={6} cargando={cargando} texto="No existen clientes registrados." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
