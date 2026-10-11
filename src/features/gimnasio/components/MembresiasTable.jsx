import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { Chip, IconButton, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { CancelarMembresiaButton } from './CancelarMembresiaButton.jsx';

const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha';

export function MembresiasTable({ membresias, meta, cargando, filtrosColumna = {}, onFiltroColumna, onEditar, onRenovar, onCancelada, onErrorCancelar, onPageChange, onRowsPerPageChange }) {
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
          <TableCell>Sedes / entrenamiento</TableCell>
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
              <Typography variant="body2">{membresia.plan_nombre || 'Plan no asignado'}{membresia.precio_aplicado ? ` · ${Number(membresia.precio_aplicado).toFixed(2)}` : ''}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight="500">
                {(membresia.sedes_habilitadas || []).map((sede) => sede.sede_nombre).filter(Boolean).join(', ') || membresia.sede_nombre || 'Sin sedes'}
              </Typography>
              {(membresia.asignaciones_entrenador || []).length ? (
                <Typography variant="caption" color="text.secondary">
                  {(membresia.asignaciones_entrenador || []).length} asignación(es) de entrenamiento
                </Typography>
              ) : (membresia.requiere_entrenador ? (
                <Typography variant="caption" color="warning.main">Entrenador pendiente</Typography>
              ) : null)}
            </TableCell>
            <TableCell>
              <Typography variant="body2">{fecha(membresia.fecha_inicio)} - {fecha(membresia.fecha_fin)}</Typography>
              {membresia.fecha_congelacion_inicio ? (
                <Typography variant="caption" color="text.secondary">Congelada desde {fecha(membresia.fecha_congelacion_inicio)}</Typography>
              ) : null}
            </TableCell>
            <TableCell>
              <Chip
                label={membresia.estado_nombre || String(membresia.estado_valor || membresia.estado || '').replaceAll('_', ' ').toLowerCase().replace(/^./, (letra) => letra.toUpperCase())}
                size="small"
                variant="outlined"
                sx={membresia.estado_color ? { color: membresia.estado_color, borderColor: membresia.estado_color } : undefined}
              />
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                {membresia.renovable && String(membresia.estado || '').toUpperCase() !== 'CANCELADA' ? (
                  <Tooltip title="Renovar membresía">
                    <IconButton sx={dbanuStyles.actionView} onClick={() => onRenovar(membresia)}>
                      <AutorenewOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="Editar membresía">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(membresia)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                <CancelarMembresiaButton membresia={membresia} onCancelada={onCancelada} onError={onErrorCancelar} />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {membresias.length === 0 ? (
          <TablaEstadoFila colSpan={7} cargando={cargando} texto="No hay membresías registradas." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
