import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha';

export function MembresiasTable({ membresias, meta, cargando, filtrosColumna = {}, onFiltroColumna, onEditar, onPageChange, onRowsPerPageChange }) {
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
          <FilterHeaderCell value={filtrosColumna.codigo} onChange={(v) => onFiltroColumna('codigo', v)} options={opciones(meta.opciones_filtro?.codigo)}>Contrato</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.cliente} onChange={(v) => onFiltroColumna('cliente', v)} options={opciones(meta.opciones_filtro?.cliente)}>Cliente</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.plan} onChange={(v) => onFiltroColumna('plan', v)} options={opciones(meta.opciones_filtro?.plan)}>Plan</FilterHeaderCell>
          <TableCell>Vigencia</TableCell>
          <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => onFiltroColumna('estado', v)} options={[{ value: 'PENDIENTE_PAGO', label: 'Pendiente pago' }, { value: 'ACTIVA', label: 'Activa' }, { value: 'VENCIDA', label: 'Vencida' }, { value: 'CONGELADA', label: 'Congelada' }, { value: 'CANCELADA', label: 'Cancelada' }]}>Estado</FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {membresias.map((membresia) => (
          <TableRow key={membresia.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight="600">{membresia.codigo_contrato}</Typography>
              <Typography variant="caption" color="text.secondary">{membresia.renovacion_automatica ? 'Renovación automática' : 'Renovación manual'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="500">{membresia.deportista_nombre || 'Cliente sin nombre'}</Typography>
              <Typography variant="caption" color="text.secondary">{membresia.codigo_deportista || membresia.deportista_email || 'Sin código'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{membresia.plan_nombre || 'Plan no asignado'}{membresia.precio_aplicado ? ` · $${Number(membresia.precio_aplicado).toFixed(2)}` : ''}</Typography>
              <Typography variant="caption" color="text.secondary">{membresia.sede_nombre || 'Sede no asignada'}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{fecha(membresia.fecha_inicio)} - {fecha(membresia.fecha_fin)}</Typography>
              {membresia.fecha_congelacion_inicio ? (
                <Typography variant="caption" color="text.secondary">Congelada desde {fecha(membresia.fecha_congelacion_inicio)}</Typography>
              ) : null}
            </TableCell>
            <TableCell>
              <StatusChip estado={String(membresia.estado || '').toLowerCase()} />
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Editar membresía">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(membresia)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {membresias.length === 0 ? (
          <TablaEstadoFila colSpan={6} cargando={cargando} texto="No hay membresías registradas." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
