import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const dinero = (valor) => Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');

function CumplimientoCelda({ real, meta, porcentaje, moneda = false }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 800, textAlign: 'center' }}>
        {moneda ? dinero(real) : numero(real)} / {moneda ? dinero(meta) : numero(meta)}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary', textAlign: 'center' }}>
        {Number(porcentaje || 0).toFixed(1)}%
      </Typography>
    </Box>
  );
}

export function MetasComercialesTable({
  items,
  meta,
  filtros,
  cargando,
  onFiltro,
  onPageChange,
  onRowsPerPageChange,
  onEditar,
  onVer,
}) {
  const sedes = (meta.catalogos?.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }));

  return (
    <TablaGestion
      total={meta.total || 0}
      filtrados={meta.total || 0}
      page={meta.pagina_actual || 1}
      rowsPerPage={meta.por_pagina || 10}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      cargando={cargando}
    >
      <TableHead>
        <TableRow>
          <FilterHeaderCell value={filtros.sede_id} onChange={(v) => onFiltro('sede_id', v)} options={sedes} multiple>
            Sede
          </FilterHeaderCell>
          <FilterHeaderCell align="center" value={filtros.periodo} onChange={(v) => onFiltro('periodo', v)}>
            Período
          </FilterHeaderCell>
          <FilterHeaderCell align="center" value={filtros.ventas} onChange={(v) => onFiltro('ventas', v)}>
            Ventas
          </FilterHeaderCell>
          <FilterHeaderCell align="center" value={filtros.cobros} onChange={(v) => onFiltro('cobros', v)}>
            Cobros
          </FilterHeaderCell>
          <FilterHeaderCell align="center" value={filtros.nuevas} onChange={(v) => onFiltro('nuevas', v)}>
            Nuevas
          </FilterHeaderCell>
          <FilterHeaderCell align="center" value={filtros.renovaciones} onChange={(v) => onFiltro('renovaciones', v)}>
            Renovaciones
          </FilterHeaderCell>
          <FilterHeaderCell
            align="center"
            value={filtros.estado ? [filtros.estado] : []}
            onChange={(v) => onFiltro('estado', Array.isArray(v) ? (v[0] || '') : v)}
            options={[
              { value: 'ACTIVA', label: 'Activa' },
              { value: 'INACTIVA', label: 'Inactiva' },
            ]}
          >
            Estado
          </FilterHeaderCell>
          <TableCell align="center">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {!cargando && items.length === 0 ? (
          <TablaEstadoFila colSpan={8} texto="No existen metas configuradas para los filtros seleccionados." />
        ) : null}

        {items.map((item) => (
          <TableRow hover key={item.id}>
            <TableCell>{item.sede}</TableCell>
            <TableCell align="center">{meses[Number(item.mes || 1) - 1]} {item.anio}</TableCell>
            <TableCell align="center">
              <CumplimientoCelda real={item.real_ventas} meta={item.meta_ventas} porcentaje={item.cumplimiento_ventas} moneda />
            </TableCell>
            <TableCell align="center">
              <CumplimientoCelda real={item.real_cobros} meta={item.meta_cobros} porcentaje={item.cumplimiento_cobros} moneda />
            </TableCell>
            <TableCell align="center">
              <CumplimientoCelda real={item.real_membresias_nuevas} meta={item.meta_membresias_nuevas} porcentaje={item.cumplimiento_membresias_nuevas} />
            </TableCell>
            <TableCell align="center">
              <CumplimientoCelda real={item.real_renovaciones} meta={item.meta_renovaciones} porcentaje={item.cumplimiento_renovaciones} />
            </TableCell>
            <TableCell align="center">
              <StatusChip estado={item.estado === 'ACTIVA' ? 'activo' : 'cerrado'} label={item.estado} />
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Ver seguimiento">
                <IconButton sx={dbanuStyles.actionView} onClick={() => onVer(item)}>
                  <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}>
                  <EditOutlinedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TablaGestion>
  );
}
