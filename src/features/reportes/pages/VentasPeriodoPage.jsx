import { useEffect, useState } from 'react';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { ventasPeriodoServicio } from '../services/ventas/ventasPeriodoServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const ESTADOS = { PAGADA: ['Pagada', 'success'], PARCIAL: ['Parcial', 'warning'], PENDIENTE: ['Pendiente', 'error'] };
const TIPOS = { MEMBRESIA: 'Membresía', PRODUCTO: 'Producto', SERVICIO: 'Servicio' };
const POR_COBRAR = ['PENDIENTE', 'PARCIAL'];

function Tarjeta({ titulo, valor, detalle, color, activo = false, onClick }) {
  return (
    <Box onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      sx={{ p: 1.5, border: '1px solid', borderColor: activo ? color : 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}`,
        bgcolor: activo ? 'action.selected' : 'background.paper', cursor: onClick ? 'pointer' : 'default', minWidth: 0,
        '&:hover': onClick ? { borderColor: color } : undefined }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color, fontSize: { xs: 16, md: 19 } }} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{detalle}</Typography>
    </Box>
  );
}

/** Ventas por período: cada venta con qué se vendió, descuento, lo cobrado y lo que falta. */
export function VentasPeriodoPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    tipo_venta: [],
    estado: [],
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventasPeriodoServicio.consultar(params);
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
  const porEstado = resumen.por_estado || {};
  const catalogos = meta.catalogos || {};
  const estadoActivo = (lista) => (filtros.estado || []).length === lista.length && lista.every((e) => filtros.estado.includes(e));
  const alternarEstado = (lista) => aplicar({ estado: estadoActivo(lista) ? [] : lista });
  const suma = (lista, campo) => lista.reduce((t, e) => t + Number(porEstado[e]?.[campo] || 0), 0);
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Ventas por período" descripcion="Cada venta con qué se vendió, descuento, lo cobrado y lo que falta."
        icono={<ReceiptLongOutlinedIcon />} />

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
                titulo="Ventas por período"
                descripcion="Cada venta con qué se vendió, descuento, lo cobrado y lo que falta."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (f) => fecha(f.fecha) },
                  { label: 'Cliente', value: (f) => (f.tutor ? `${f.cliente} (paga ${f.tutor})` : f.cliente), align: 'left' },
                  { label: 'Qué se vendió', value: 'que_se_vendio', align: 'left' },
                  { label: 'Precio', value: (f) => dinero(f.subtotal) },
                  { label: 'Descuento', value: (f) => dinero(f.descuento) },
                  { label: 'Total', value: (f) => dinero(f.total_venta) },
                  { label: 'Cobrado', value: (f) => dinero(f.total_cobrado) },
                  { label: 'Saldo', value: (f) => dinero(f.saldo_pendiente) },
                  { label: 'Estado', value: (f) => ESTADOS[f.estado]?.[0] || f.estado },
                ]}
                obtenerFilas={() => ventasPeriodoServicio.consultarTodo(filtros)}
                exportarExcel={() => ventasPeriodoServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        {/* "Por cobrar" y "Pagadas" filtran la tabla al tocarlas; al tocar de nuevo se quita el filtro. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Facturado" valor={dinero(resumen.total_ventas)} detalle={`${resumen.transacciones || 0} ventas`} color={uiTokens.colores.primario} />
          <Tarjeta titulo="Cobrado" valor={dinero(resumen.total_cobrado)} detalle="De estas ventas" color={uiTokens.colores.exito} />
          <Tarjeta titulo="Por cobrar" valor={dinero(suma(POR_COBRAR, 'saldo'))} color={uiTokens.colores.peligro}
            detalle={`${suma(POR_COBRAR, 'ventas')} ventas pendientes o parciales`} activo={estadoActivo(POR_COBRAR)}
            onClick={() => alternarEstado(POR_COBRAR)} />
          <Tarjeta titulo="Pagadas" valor={`${porEstado.PAGADA?.ventas || 0}`} color={uiTokens.colores.exito}
            detalle={`${dinero(porEstado.PAGADA?.total)} cobrados completos`} activo={estadoActivo(['PAGADA'])}
            onClick={() => alternarEstado(['PAGADA'])} />
          <Tarjeta titulo="Descuentos" valor={dinero(resumen.descuentos)} detalle="Dejado de cobrar" color={uiTokens.colores.textoFuerte} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('fecha', 'Fecha', { align: 'center', formato: fecha })}
              {columna('cliente', 'Cliente')}
              <FilterHeaderCell value={filtros.tipo_venta} multiple onChange={(valor) => aplicar({ tipo_venta: valor })}
                options={(catalogos.tipos_venta || []).map((t) => ({ value: t, label: TIPOS[t] || t }))}>Qué se vendió</FilterHeaderCell>
              {columna('subtotal', 'Precio', { align: 'center', formato: dinero })}
              {columna('total_venta', 'Total', { align: 'center', formato: dinero })}
              {columna('total_cobrado', 'Cobrado', { align: 'center', formato: dinero })}
              {columna('saldo_pendiente', 'Saldo', { align: 'center', formato: dinero })}
              <FilterHeaderCell align="center" value={filtros.estado} multiple onChange={(valor) => aplicar({ estado: valor })}
                options={Object.entries(ESTADOS).map(([v, [l]]) => ({ value: v, label: l }))}>Estado</FilterHeaderCell>
              <FilterHeaderCell value={filtros.sede_id} multiple onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}>Registró · sede</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{fecha(item.fecha)}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.cliente}</Box>
                  {item.tutor && <Typography variant="caption" color="text.secondary">Paga {item.tutor} (tutor)</Typography>}
                </TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  {String(item.que_se_vendio || '—').split(' · ').map((parte, i) => (
                    i === 0 ? <Box key={parte} sx={{ fontSize: 'inherit' }}>{parte}</Box>
                      : <Typography key={parte} variant="caption" color="text.secondary">{parte}</Typography>
                  ))}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit' }}>{dinero(item.subtotal)}</Box>
                  {Number(item.descuento) > 0 && <Typography variant="caption" sx={{ color: 'success.dark' }}>− {dinero(item.descuento)} desc.</Typography>}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.total_venta)}</TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.saldo_pendiente)}</TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={ESTADOS[item.estado]?.[1] || 'default'} label={ESTADOS[item.estado]?.[0] || item.estado} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.registro}</Box>
                  <Typography variant="caption" color="text.secondary">{item.sede}</Typography>
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={9} texto="No hay ventas para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
