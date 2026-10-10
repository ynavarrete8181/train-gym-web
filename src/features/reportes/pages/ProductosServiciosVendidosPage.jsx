import { useEffect, useState } from 'react';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { productosServiciosVendidosServicio } from '../services/ventas/productosServiciosVendidosServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function ProductosServiciosVendidosPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    sede_id: [],
    tipo_item: [],
    item: '',
    ventas: '',
    cantidad: '',
    precio_promedio: '',
    total_vendido: '',
    page: 1,
    per_page: 10,
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
        titulo="Productos y servicios vendidos"
        descripcion="Consolida los ítems vendidos por tipo, sede, cantidad e ingresos."
        icono={<Inventory2OutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Ítems distintos: ${resumen.items_distintos || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Unidades: ${numero(resumen.unidades)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Total vendido: ${dinero(resumen.total_vendido)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
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
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tipo_item} onChange={(valor) => aplicar({ tipo_item: valor })} options={opciones(catalogos.tipos_item)} multiple>Tipo</FilterHeaderCell>
              <FilterHeaderCell value={filtros.item} onChange={(valor) => aplicar({ item: valor })}>Producto / servicio</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.ventas} onChange={(valor) => aplicar({ ventas: valor })}>Ventas</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.cantidad} onChange={(valor) => aplicar({ cantidad: valor })}>Cantidad</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.precio_promedio} onChange={(valor) => aplicar({ precio_promedio: valor })}>Precio promedio</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.total_vendido} onChange={(valor) => aplicar({ total_vendido: valor })}>Total vendido</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.sede}-${item.tipo_item}-${item.item}-${index}`} hover>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.tipo_item}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell align="center">{numero(item.ventas)}</TableCell>
                <TableCell align="center">{numero(item.cantidad)}</TableCell>
                <TableCell align="center">{dinero(item.precio_promedio)}</TableCell>
                <TableCell align="center">{dinero(item.total_vendido)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={7} texto="No existen productos o servicios vendidos para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
