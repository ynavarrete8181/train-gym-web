import { useEffect, useState } from 'react';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { cobrosMetodoPagoServicio } from '../services/ventas/cobrosMetodoPagoServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';

export function CobrosMetodoPagoPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    metodo_pago: [],
    page: 1,
    per_page: 5,
  });
  const [cargando, setCargando] = useState(true);

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await cobrosMetodoPagoServicio.consultar(params);
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
      <PageHeader titulo="Cobros por método de pago" descripcion="Consolida cobros confirmados por fecha, sede y método de pago." icono={<PaymentsOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda=""
          mostrarBusqueda={false}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Operaciones: ${resumen.operaciones || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Total cobrado: ${dinero(resumen.total_cobrado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Cobros por método de pago"
                descripcion="Cobros confirmados consolidados por fecha, sede y método."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (fila) => fecha(fila.fecha) },
                  { label: 'Sede', value: 'sede', align: 'left' },
                  { label: 'Método', value: 'metodo_pago' },
                  { label: 'Operaciones', value: 'operaciones' },
                  { label: 'Total', value: (fila) => dinero(fila.total) },
                ]}
                obtenerFilas={() => cobrosMetodoPagoServicio.consultarTodo(filtros)}
                exportarExcel={() => cobrosMetodoPagoServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }} onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }} cargando={cargando}>
          <TableHead>
            <TableRow>
              <FiltroColumna align="center" columna="fecha" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={fecha}>Fecha</FiltroColumna>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.metodo_pago} onChange={(valor) => aplicar({ metodo_pago: valor })} options={(catalogos.metodos_pago || []).map((m) => ({ value: m, label: m }))} multiple>Método</FilterHeaderCell>
              <FiltroColumna align="center" columna="operaciones" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Operaciones</FiltroColumna>
              <FiltroColumna align="center" columna="total" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Total</FiltroColumna>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.fecha}-${item.sede}-${item.metodo_pago}-${index}`} hover>
                <TableCell align="center">{fecha(item.fecha)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.metodo_pago}</TableCell>
                <TableCell align="center">{item.operaciones}</TableCell>
                <TableCell align="center">{dinero(item.total)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={5} texto="No existen cobros confirmados para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
