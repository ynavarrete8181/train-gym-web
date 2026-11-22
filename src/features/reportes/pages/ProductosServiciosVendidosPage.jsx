import { useEffect, useState } from 'react';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Box, Chip, LinearProgress, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { productosServiciosVendidosServicio } from '../services/ventas/productosServiciosVendidosServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const TIPOS = { MEMBRESIA: ['Membresía', 'primary'], PRODUCTO: ['Producto', 'success'], SERVICIO: ['Servicio', 'info'] };

function Tarjeta({ titulo, valor, detalle, color }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}`, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color, fontSize: { xs: 16, md: 19 } }} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{detalle}</Typography>
    </Box>
  );
}

/** Productos y servicios vendidos: qué se vende más, con ventas, clientes, descuentos y total neto. */
export function ProductosServiciosVendidosPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    tipo_item: [],
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await productosServiciosVendidosServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};
  const mas = resumen.mas_vendido;
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Productos y servicios vendidos"
        descripcion="Qué se vende más: planes y productos con ventas, clientes, descuentos y total neto."
        icono={<Inventory2OutlinedIcon />} />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Productos y servicios vendidos"
                descripcion="Qué se vende más: planes y productos con ventas, clientes, descuentos y total neto."
                filtros={filtros}
                columnas={[
                  { label: 'Plan o producto', value: 'item', align: 'left' },
                  { label: 'Tipo', value: (f) => TIPOS[f.tipo_item]?.[0] || f.tipo_item },
                  { label: 'Ventas', value: 'ventas' },
                  { label: 'Clientes', value: 'clientes' },
                  { label: 'Descuentos', value: (f) => dinero(f.descuentos) },
                  { label: 'Total neto', value: (f) => dinero(f.total_vendido) },
                  { label: '% del total', value: (f) => `${f.porcentaje} %` },
                ]}
                obtenerFilas={() => productosServiciosVendidosServicio.consultarTodo(filtros)}
                exportarExcel={() => productosServiciosVendidosServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Total vendido (neto)" valor={dinero(resumen.total_vendido)}
            detalle={`${resumen.ventas || 0} ventas · descuentos ${dinero(resumen.descuentos)}`} color={uiTokens.colores.primario} />
          <Tarjeta titulo="Membresías" valor={dinero(resumen.membresias)} detalle="Planes y modalidades" color={uiTokens.colores.exito} />
          <Tarjeta titulo="Productos y servicios" valor={dinero(resumen.productos_servicios)}
            detalle={Number(resumen.productos_servicios) > 0 ? 'Inventario y servicios' : 'Aún no se venden'} color={uiTokens.colores.info} />
          <Tarjeta titulo="El más vendido" valor={mas ? `${mas.ventas} ventas` : '—'}
            detalle={mas ? `${mas.item} · ${dinero(mas.total)}` : 'Sin ventas'} color={uiTokens.colores.acentoOscuro} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('item', 'Plan o producto')}
              <FilterHeaderCell align="center" value={filtros.tipo_item} multiple onChange={(valor) => aplicar({ tipo_item: valor })}
                options={(catalogos.tipos_item || []).map((t) => ({ value: t, label: TIPOS[t]?.[0] || t }))}>Tipo</FilterHeaderCell>
              {columna('ventas', 'Ventas', { align: 'center' })}
              {columna('clientes', 'Clientes', { align: 'center' })}
              {columna('precio_promedio', 'Precio', { align: 'center', formato: dinero })}
              {columna('descuentos', 'Descuentos', { align: 'center', formato: dinero })}
              {columna('total_vendido', 'Total neto', { align: 'center', formato: dinero })}
              <TableCell sx={{ minWidth: 170 }}>% del total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.tipo_item}-${item.item}`} hover>
                <TableCell sx={{ fontWeight: 700 }}>{item.item}</TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={TIPOS[item.tipo_item]?.[1] || 'default'} label={TIPOS[item.tipo_item]?.[0] || item.tipo_item} />
                </TableCell>
                <TableCell align="center">{item.ventas}</TableCell>
                <TableCell align="center">{item.clientes}</TableCell>
                <TableCell align="center">{dinero(item.precio_promedio)}</TableCell>
                <TableCell align="center" sx={{ color: Number(item.descuentos) > 0 ? 'success.dark' : 'text.secondary' }}>
                  {Number(item.descuentos) > 0 ? `− ${dinero(item.descuentos)}` : '—'}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.total_vendido)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <LinearProgress variant="determinate" value={Math.min(100, Number(item.porcentaje) || 0)}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                    <Typography variant="caption" sx={{ minWidth: 38, textAlign: 'right', fontWeight: 700 }}>{item.porcentaje} %</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay ventas para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
