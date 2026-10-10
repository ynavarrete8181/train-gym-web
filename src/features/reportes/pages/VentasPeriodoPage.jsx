import { useEffect, useState } from 'react';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ventasPeriodoServicio } from '../services/ventas/ventasPeriodoServicio.js';

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
    hasta: hoy.toISOString().slice(0, 10),
    fecha: '',
    sede_id: [],
    venta_numero: '',
    cliente: '',
    tipo_venta: [],
    estado: [],
    responsable: '',
    total: '',
    cobrado: '',
    saldo: '',
    page: 1,
    per_page: 10,
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
              <FilterHeaderCell align="center" value={filtros.fecha} onChange={(valor) => aplicar({ fecha: valor })}>Fecha</FilterHeaderCell>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.venta_numero} onChange={(valor) => aplicar({ venta_numero: valor })}>N.º de venta</FilterHeaderCell>
              <FilterHeaderCell value={filtros.cliente} onChange={(valor) => aplicar({ cliente: valor })}>Cliente</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tipo_venta} onChange={(valor) => aplicar({ tipo_venta: valor })} options={opciones(catalogos.tipos_venta)} multiple>Tipo</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado} onChange={(valor) => aplicar({ estado: valor })} options={opciones(catalogos.estados)} multiple>Estado</FilterHeaderCell>
              <FilterHeaderCell value={filtros.responsable} onChange={(valor) => aplicar({ responsable: valor })}>Responsable comercial</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.total} onChange={(valor) => aplicar({ total: valor })}>Total</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.cobrado} onChange={(valor) => aplicar({ cobrado: valor })}>Cobrado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.saldo} onChange={(valor) => aplicar({ saldo: valor })}>Saldo</FilterHeaderCell>
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
