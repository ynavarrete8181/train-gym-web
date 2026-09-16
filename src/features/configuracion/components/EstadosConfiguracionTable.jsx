import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import { IconButton, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const opcionesSiNo = [
  { value: '1', label: 'Sí' },
  { value: '0', label: 'No' },
];
const opcionesEstado = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
];

export function EstadosConfiguracionTable({
  items,
  meta,
  cargando,
  filtrosColumna = {},
  onFiltroColumna,
  onEditar,
  onDesactivar,
  onPageChange,
  onRowsPerPageChange,
}) {
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
          <FilterHeaderCell value={filtrosColumna.entidad} onChange={(v) => onFiltroColumna('entidad', v)} options={opciones(meta.opciones_filtro?.entidad)}>Entidad</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.valor_interno} onChange={(v) => onFiltroColumna('valor_interno', v)} options={opciones(meta.opciones_filtro?.valor_interno)}>Valor interno</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.nombre} onChange={(v) => onFiltroColumna('nombre', v)} options={opciones(meta.opciones_filtro?.nombre)}>Nombre visible</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.color} onChange={(v) => onFiltroColumna('color', v)} options={opciones(meta.opciones_filtro?.color)}>Color</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.inicial} onChange={(v) => onFiltroColumna('inicial', v)} options={opcionesSiNo} align="center">Inicial</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.final} onChange={(v) => onFiltroColumna('final', v)} options={opcionesSiNo} align="center">Final</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.protegido} onChange={(v) => onFiltroColumna('protegido', v)} options={opcionesSiNo} align="center">Protegido</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => onFiltroColumna('estado', v)} options={opcionesEstado} align="center">Estado</FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight={700}>{item.codigo}</Typography>
            </TableCell>
            <TableCell>{item.entidad}</TableCell>
            <TableCell>{item.valor_interno}</TableCell>
            <TableCell>
              <Typography variant="body2">{item.nombre}</Typography>
              {item.descripcion ? <Typography variant="caption" color="text.secondary">{item.descripcion}</Typography> : null}
            </TableCell>
            <TableCell>{item.color}</TableCell>
            <TableCell align="center">{item.es_inicial ? 'Sí' : 'No'}</TableCell>
            <TableCell align="center">{item.es_final ? 'Sí' : 'No'}</TableCell>
            <TableCell align="center">{item.protegido_sistema ? 'Sí' : 'No'}</TableCell>
            <TableCell align="center"><StatusChip estado={item.activo ? 'activo' : 'inactivo'} /></TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Editar estado">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                {item.activo && !item.protegido_sistema ? (
                  <Tooltip title="Desactivar estado">
                    <IconButton sx={dbanuStyles.actionDelete} onClick={() => onDesactivar(item)}>
                      <PowerSettingsNewOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </TableCell>
          </TableRow>
        ))}

        {items.length === 0 ? (
          <TablaEstadoFila colSpan={10} cargando={cargando} texto="No hay estados registrados." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
