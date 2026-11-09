import { useEffect, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Box, Chip, Paper, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { carteraVencidaServicio } from '../services/ventas/carteraVencidaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';

export function CarteraVencidaReportePage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({
    busqueda: '',
    sede_id: [],
    columnas: {},
    prioridad: [],
    page: 1,
    per_page: 5,
  });
  const [cargando, setCargando] = useState(true);

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await carteraVencidaServicio.consultar(params);
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
  const catalogos = meta.catalogos || [];

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Cartera vencida" descripcion="Consulta las cuentas vencidas y su saldo pendiente por sede." icono={<AccountBalanceWalletOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Cuentas vencidas: ${resumen.cuentas_vencidas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.peligro, borderColor: uiTokens.colores.peligro }} />
              <Chip variant="outlined" label={`Saldo vencido: ${dinero(resumen.saldo_vencido)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
              <Chip variant="outlined" label={`Promedio días: ${Number(resumen.promedio_dias_vencidos || 0).toFixed(1)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
            </>
          )}
          acciones={(
            <ReporteExportaciones
              titulo="Cartera vencida"
              descripcion="Cuentas vencidas y saldos pendientes por sede."
              filtros={filtros}
              columnas={[
                { label: 'Sede', value: 'sede', align: 'left' },
                { label: 'N.º venta', value: 'venta_numero' },
                { label: 'Cliente', value: (fila) => `${fila.cliente || ''} ${fila.identificacion || ''}`, align: 'left' },
                { label: 'Vencimiento', value: (fila) => fecha(fila.fecha_vencimiento) },
                { label: 'Días', value: 'dias_vencidos' },
                { label: 'Saldo', value: (fila) => dinero(fila.saldo_pendiente) },
                { label: 'Responsable', value: 'responsable', align: 'left' },
                { label: 'Prioridad', value: 'prioridad' },
              ]}
              obtenerFilas={() => carteraVencidaServicio.consultarTodo(filtros)}
              exportarExcel={() => carteraVencidaServicio.exportarExcel(filtros)}
            />
          )}
        />

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }} onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }} cargando={cargando}>
          <TableHead>
            <TableRow>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FiltroColumna align="center" columna="venta_numero" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>N.º de venta</FiltroColumna>
              <FiltroColumna columna="cliente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Cliente</FiltroColumna>
              <FiltroColumna align="center" columna="fecha_vencimiento" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={fecha}>Vencimiento</FiltroColumna>
              <FiltroColumna align="center" columna="dias_vencidos" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Días</FiltroColumna>
              <FiltroColumna align="center" columna="saldo_pendiente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Saldo</FiltroColumna>
              <FiltroColumna columna="responsable" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Responsable</FiltroColumna>
              <FilterHeaderCell align="center" value={filtros.prioridad} onChange={(valor) => aplicar({ prioridad: valor })} options={(catalogos.prioridades || []).map((p) => ({ value: p, label: p }))} multiple>Prioridad</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.venta_numero}</TableCell>
                <TableCell>{item.cliente}<br /><small>{item.identificacion}</small></TableCell>
                <TableCell align="center">{fecha(item.fecha_vencimiento)}</TableCell>
                <TableCell align="center">{item.dias_vencidos}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
                <TableCell>{item.responsable}</TableCell>
                <TableCell align="center">{item.prioridad}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No existen cuentas vencidas para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
