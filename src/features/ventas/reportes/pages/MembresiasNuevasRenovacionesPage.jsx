import { useEffect, useState } from 'react';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../../utils/fechaLocal.js';
import { FiltroColumna } from '../../../reportes/components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../../../reportes/components/ReporteExportaciones.jsx';
import { membresiasNuevasRenovacionesServicio } from '../services/membresiasNuevasRenovacionesServicio.js';
import { TarjetaReporte as Tarjeta } from '../../../reportes/components/TarjetaReporte.jsx';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const TIPOS = {
  NUEVA: ['Nueva', 'success', 'Clientes que nunca tuvieron contrato'],
  RECONTRATACION: ['Recontratación', 'info', 'Clientes que vuelven con un contrato nuevo'],
  RENOVACION: ['Renovación', 'warning', 'Un período más del mismo contrato'],
};


/** Membresías nuevas, recontrataciones y renovaciones del período, con lo facturado, cobrado y por cobrar. */
export function MembresiasNuevasRenovacionesPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    tipo_movimiento: [],
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await membresiasNuevasRenovacionesServicio.consultar(params);
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
  const tipoActivo = (filtros.tipo_movimiento || []).length === 1 ? filtros.tipo_movimiento[0] : null;
  const conteo = { NUEVA: resumen.nuevas, RECONTRATACION: resumen.recontrataciones, RENOVACION: resumen.renovaciones };
  const colores = { NUEVA: uiTokens.colores.exito, RECONTRATACION: uiTokens.colores.info, RENOVACION: uiTokens.colores.acentoOscuro };
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Membresías nuevas y renovaciones"
        descripcion="Clientes nuevos, recontrataciones y renovaciones del período, con lo facturado y lo que falta cobrar."
        icono={<AutorenewOutlinedIcon />} />

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
                titulo="Membresías nuevas y renovaciones"
                descripcion="Clientes nuevos, recontrataciones y renovaciones del período."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (f) => fecha(f.fecha_movimiento) },
                  { label: 'Tipo', value: (f) => TIPOS[f.tipo_movimiento]?.[0] || f.tipo_movimiento },
                  { label: 'Cliente', value: (f) => (f.tutor ? `${f.cliente} (paga ${f.tutor})` : f.cliente), align: 'left' },
                  { label: 'Contrato', value: (f) => `${f.codigo_contrato} · ${f.plan}`, align: 'left' },
                  { label: 'Período', value: (f) => `${fecha(f.fecha_inicio)} al ${fecha(f.fecha_fin)}` },
                  { label: 'Total', value: (f) => dinero(f.total) },
                  { label: 'Cobrado', value: (f) => dinero(f.total_cobrado) },
                  { label: 'Saldo', value: (f) => dinero(f.saldo_pendiente) },
                ]}
                obtenerFilas={() => membresiasNuevasRenovacionesServicio.consultarTodo(filtros)}
                exportarExcel={() => membresiasNuevasRenovacionesServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        {/* Nuevas, Recontrataciones y Renovaciones filtran la tabla al tocarlas. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          {Object.entries(TIPOS).map(([clave, [titulo, , detalle]]) => (
            <Tarjeta key={clave} titulo={titulo === 'Nueva' ? 'Nuevas' : titulo === 'Renovación' ? 'Renovaciones' : 'Recontrataciones'}
              valor={`${conteo[clave] || 0}`} color={colores[clave]}
              detalle={tipoActivo === clave ? 'Filtrado · toca para quitar' : detalle}
              activo={tipoActivo === clave}
              onClick={() => aplicar({ tipo_movimiento: tipoActivo === clave ? [] : [clave] })} />
          ))}
          <Tarjeta titulo="Facturado" valor={dinero(resumen.total_facturado)}
            detalle={`Cobrado ${dinero(resumen.total_cobrado)} · desc. ${dinero(resumen.descuentos)}`} color={uiTokens.colores.primario} />
          <Tarjeta titulo="Por cobrar" valor={dinero(resumen.saldo_pendiente)} detalle="Saldo de estos contratos" color={uiTokens.colores.peligro} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('fecha_movimiento', 'Fecha', { align: 'center', formato: fecha })}
              {columna('cliente', 'Cliente')}
              {columna('codigo_contrato', 'Contrato')}
              {columna('numero_periodo', 'Período', { align: 'center' })}
              <FilterHeaderCell align="center" value={filtros.tipo_movimiento} multiple onChange={(valor) => aplicar({ tipo_movimiento: valor })}
                options={Object.entries(TIPOS).map(([v, [l]]) => ({ value: v, label: l }))}>Tipo</FilterHeaderCell>
              {columna('precio', 'Precio', { align: 'center', formato: dinero })}
              {columna('total_cobrado', 'Cobrado', { align: 'center', formato: dinero })}
              {columna('saldo_pendiente', 'Saldo', { align: 'center', formato: dinero })}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{fecha(item.fecha_movimiento)}</TableCell>
                <TableCell sx={{ minWidth: 160 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.cliente}</Box>
                  {item.tutor && <Typography variant="caption" color="text.secondary">Paga {item.tutor} (tutor)</Typography>}
                </TableCell>
                <TableCell sx={{ minWidth: 160 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.codigo_contrato}</Box>
                  <Typography variant="caption" color="text.secondary">{item.plan}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit' }}>N.º {item.numero_periodo}</Box>
                  <Typography variant="caption" color="text.secondary">{fecha(item.fecha_inicio)} al {fecha(item.fecha_fin)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={TIPOS[item.tipo_movimiento]?.[1] || 'default'} label={TIPOS[item.tipo_movimiento]?.[0] || item.tipo_movimiento} />
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit', fontWeight: 800 }}>{dinero(item.total)}</Box>
                  {Number(item.descuento) > 0 && <Typography variant="caption" sx={{ color: 'success.dark' }}>{dinero(item.precio)} − {dinero(item.descuento)}</Typography>}
                </TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay movimientos para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
