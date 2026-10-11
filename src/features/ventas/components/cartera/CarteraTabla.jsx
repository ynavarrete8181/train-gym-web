import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Box, Button, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { StatusChip } from '../../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../../components/tables/TablaGestion.jsx';
import { cuentaCerrada, dinero, estadoVisualCartera, fecha } from '../../config/carteraConfig.js';

const columnas = [
  { key: 'sede', label: 'Sede', render: (item) => item.sede_nombre || '—' },
  {
    key: 'venta',
    label: 'N.º de venta',
    render: (item) => (
      <Box>
        <Typography variant="body2" fontWeight={700}>{item.venta_numero}</Typography>
        <Typography variant="caption" color="text.secondary">
          {item.plan_nombre || item.concepto}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'cliente',
    label: 'Cliente',
    render: (item) => (
      <Box>
        <Typography variant="body2" fontWeight={800}>{item.cliente_nombre}</Typography>
        <Typography variant="caption" color="text.secondary">
          {item.cliente_identificacion || 'Sin identificación'}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'vencimiento',
    label: 'Vencimiento',
    render: (item) => (
      <Box>
        <Typography variant="body2">{fecha(item.fecha_vencimiento)}</Typography>
        {Number(item.dias_vencidos || 0) > 0 ? (
          <Typography variant="caption" color="error.main">
            {item.dias_vencidos} días vencida
          </Typography>
        ) : null}
      </Box>
    ),
  },
  { key: 'total', label: 'Total', render: (item) => dinero(item.venta_total) },
  { key: 'pagado', label: 'Pagado', render: (item) => dinero(item.total_pagado) },
  {
    key: 'saldo',
    label: 'Saldo',
    render: (item) => <Typography fontWeight={900}>{dinero(item.saldo_pendiente)}</Typography>,
  },
  { key: 'responsable', label: 'Responsable', render: (item) => item.responsable_nombre || 'Sin asignar' },
  {
    key: 'estado',
    label: 'Estado',
    render: (item) => (
      <StatusChip
        estado={estadoVisualCartera(item.estado_cartera)}
        label={item.estado_cartera}
      />
    ),
  },
];

const opciones = (items = [], valorKey = 'id', labelKey = 'nombre') => (items || []).map((item) => ({
  value: String(typeof item === 'object' ? item[valorKey] : item),
  label: String(typeof item === 'object' ? item[labelKey] : item),
}));

export function CarteraTabla({
  items,
  meta,
  cargando,
  turnoActual,
  filtrosColumna = {},
  onFiltroColumna,
  onGestionar,
  onCobrar,
  onPageChange,
  onRowsPerPageChange,
}) {
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
          <FilterHeaderCell
            value={filtrosColumna.sede_id || []}
            onChange={(valor) => onFiltroColumna?.('sede_id', valor)}
            options={opciones(meta.catalogos?.sedes)}
            multiple
          >
            Sede
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.venta_numero || ''}
            onChange={(valor) => onFiltroColumna?.('venta_numero', valor)}
          >
            N.º de venta
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.cliente || ''}
            onChange={(valor) => onFiltroColumna?.('cliente', valor)}
          >
            Cliente
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.vencimiento || ''}
            onChange={(valor) => onFiltroColumna?.('vencimiento', valor)}
          >
            Vencimiento
          </FilterHeaderCell>
          <FilterHeaderCell
            align="right"
            value={filtrosColumna.total || ''}
            onChange={(valor) => onFiltroColumna?.('total', valor)}
          >
            Total
          </FilterHeaderCell>
          <FilterHeaderCell
            align="right"
            value={filtrosColumna.pagado || ''}
            onChange={(valor) => onFiltroColumna?.('pagado', valor)}
          >
            Pagado
          </FilterHeaderCell>
          <FilterHeaderCell
            align="right"
            value={filtrosColumna.saldo || ''}
            onChange={(valor) => onFiltroColumna?.('saldo', valor)}
          >
            Saldo
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.responsable_id || []}
            onChange={(valor) => onFiltroColumna?.('responsable_id', valor)}
            options={opciones(meta.catalogos?.responsables, 'id', 'name')}
            multiple
          >
            Responsable
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.prioridad || []}
            onChange={(valor) => onFiltroColumna?.('prioridad', valor)}
            options={opciones(meta.catalogos?.prioridades)}
            multiple
          >
            Prioridad
          </FilterHeaderCell>
          <FilterHeaderCell
            value={filtrosColumna.estado || []}
            onChange={(valor) => onFiltroColumna?.('estado', valor)}
            options={opciones(meta.catalogos?.estados)}
            multiple
          >
            Estado
          </FilterHeaderCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            {columnas.slice(0, 8).map((columna) => (
              <TableCell key={columna.key}>{columna.render(item)}</TableCell>
            ))}
            <TableCell>{item.prioridad || 'NORMAL'}</TableCell>
            {columnas.slice(8).map((columna) => (
              <TableCell key={columna.key}>{columna.render(item)}</TableCell>
            ))}
            <TableCell align="right">
              <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                <Tooltip title="Gestionar cuenta">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AssignmentOutlinedIcon />}
                    onClick={() => onGestionar(item)}
                  >
                    Gestionar
                  </Button>
                </Tooltip>
                <Tooltip title={turnoActual?.id ? 'Cobrar cuenta' : 'Necesitas un turno propio abierto'}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PaymentsOutlinedIcon />}
                      disabled={!turnoActual?.id || cuentaCerrada(item.estado_cartera)}
                      onClick={() => onCobrar(item)}
                    >
                      Cobrar
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 ? (
          <TablaEstadoFila
            colSpan={columnas.length + 2}
            cargando={cargando}
            texto="No hay cuentas en cartera."
          />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
