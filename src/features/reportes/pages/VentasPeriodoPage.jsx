import { useEffect, useState } from 'react';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { ventasPeriodoServicio } from '../services/ventas/ventasPeriodoServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function VentasPeriodoPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
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

  useEffect(() => { cargar(); }, []);

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Ventas por período"
        descripcion="Detalle transaccional de ventas por rango de fechas, sede, cliente y estado."
        icono={<ReceiptLongOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Transacciones: ${resumen.transacciones || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Ventas: ${dinero(resumen.total_ventas)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Cobrado: ${dinero(resumen.total_cobrado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
              <Chip variant="outlined" label={`Saldo: ${dinero(resumen.saldo_pendiente)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Ventas por período"
                descripcion="Detalle transaccional de ventas por rango de fechas, sede, cliente y estado."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (fila) => fecha(fila.fecha) },
                  { label: 'Sede', value: 'sede', align: 'left' },
                  { label: 'N.º venta', value: 'venta_numero' },
                  { label: 'Cliente', value: (fila) => `${fila.cliente || ''} ${fila.identificacion || ''}`, align: 'left' },
                  { label: 'Tipo', value: 'tipo_venta' },
                  { label: 'Estado', value: 'estado' },
                  { label: 'Responsable', value: 'responsable_comercial', align: 'left' },
                  { label: 'Total', value: (fila) => dinero(fila.total_venta) },
                  { label: 'Cobrado', value: (fila) => dinero(fila.total_cobrado) },
                  { label: 'Saldo', value: (fila) => dinero(fila.saldo_pendiente) },
                ]}
                obtenerFilas={() => ventasPeriodoServicio.consultarTodo(filtros)}
                exportarExcel={() => ventasPeriodoServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          cargando={cargando}
        >
          <TableHead>
            <TableRow>
              <FiltroColumna align="center" columna="fecha" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={fecha}>Fecha</FiltroColumna>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FiltroColumna align="center" columna="venta_numero" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>N.º de venta</FiltroColumna>
              <FiltroColumna columna="cliente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Cliente</FiltroColumna>
              <FilterHeaderCell align="center" value={filtros.tipo_venta} onChange={(valor) => aplicar({ tipo_venta: valor })} options={opciones(catalogos.tipos_venta)} multiple>Tipo</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado} onChange={(valor) => aplicar({ estado: valor })} options={opciones(catalogos.estados)} multiple>Estado</FilterHeaderCell>
              <FiltroColumna columna="responsable_comercial" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Responsable comercial</FiltroColumna>
              <FiltroColumna align="center" columna="total_venta" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Total</FiltroColumna>
              <FiltroColumna align="center" columna="total_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Cobrado</FiltroColumna>
              <FiltroColumna align="center" columna="saldo_pendiente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Saldo</FiltroColumna>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center">{fecha(item.fecha)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.venta_numero}</TableCell>
                <TableCell>{item.cliente}<br /><small>{item.identificacion}</small></TableCell>
                <TableCell align="center">{item.tipo_venta || '—'}</TableCell>
                <TableCell align="center">{item.estado || '—'}</TableCell>
                <TableCell>{item.responsable_comercial}</TableCell>
                <TableCell align="center">{dinero(item.total_venta)}</TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={10} texto="No existen ventas para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
