import { useEffect, useState } from 'react';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { AnaliticaComercialResumen } from '../components/reportes/AnaliticaComercialResumen.jsx';
import { reporteComercialServicio } from '../services/reporteComercialServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';

const opciones = (items = [], valueKey = null, labelKey = null) => (items || []).map((item) => ({
  value: String(valueKey ? item[valueKey] : item),
  label: String(labelKey ? item[labelKey] : item),
}));

export function ReportesComercialesPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [analitica, setAnalitica] = useState({});
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: inicioMes,
    hasta: hoyIso,
    sede_id: [],
    tipo_venta: [],
    page: 1,
    per_page: 10,
  });
  const [cargando, setCargando] = useState(true);

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const [response, responseAnalitica] = await Promise.all([
        reporteComercialServicio.consultar(params),
        reporteComercialServicio.obtenerAnalitica({
          desde: params.desde,
          hasta: params.hasta,
          sede_id: params.sede_id,
          tipo_venta: params.tipo_venta,
        }),
      ]);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setAnalitica(responseAnalitica.datos || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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
        titulo="Reportes comerciales"
        descripcion="Resumen comercial y financiero de ventas, cobros y cartera según el alcance autorizado por sede."
        icono={<InsightsOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <AnaliticaComercialResumen analitica={analitica} resumen={resumen} />

        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                size="small"
                type="date"
                label="Desde"
                value={filtros.desde}
                onChange={(e) => aplicar({ desde: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                value={filtros.hasta}
                onChange={(e) => aplicar({ hasta: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          )}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 10}
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
              <FilterHeaderCell>Fecha</FilterHeaderCell>
              <FilterHeaderCell
                value={filtros.sede_id}
                onChange={(valor) => aplicar({ sede_id: valor })}
                options={opciones(catalogos.sedes, 'id', 'nombre')}
                multiple
              >
                Sede
              </FilterHeaderCell>
              <FilterHeaderCell
                value={filtros.tipo_venta}
                onChange={(valor) => aplicar({ tipo_venta: valor })}
                options={opciones(catalogos.tipos_venta)}
                multiple
              >
                Tipo de venta
              </FilterHeaderCell>
              <FilterHeaderCell align="right">Transacciones</FilterHeaderCell>
              <FilterHeaderCell align="right">Ventas</FilterHeaderCell>
              <FilterHeaderCell align="right">Cobrado</FilterHeaderCell>
              <FilterHeaderCell align="right">Saldo</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.fecha}-${item.sede}-${item.tipo_venta}-${index}`} hover>
                <TableCell>{fecha(item.fecha)}</TableCell>
                <TableCell>{item.sede || 'Sin sede'}</TableCell>
                <TableCell>{item.tipo_venta || '—'}</TableCell>
                <TableCell align="right">{numero(item.transacciones)}</TableCell>
                <TableCell align="right">{dinero(item.total_ventas)}</TableCell>
                <TableCell align="right">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="right">{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={7} texto="No existen movimientos comerciales para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
