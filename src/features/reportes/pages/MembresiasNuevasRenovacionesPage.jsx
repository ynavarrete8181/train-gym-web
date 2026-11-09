import { useEffect, useState } from 'react';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { membresiasNuevasRenovacionesServicio } from '../services/ventas/membresiasNuevasRenovacionesServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function MembresiasNuevasRenovacionesPage() {
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
    tipo_movimiento: [],
    estado_periodo: [],
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
        titulo="Membresías nuevas y renovaciones"
        descripcion="Consulta altas y renovaciones de membresías por período, sede, plan y estado."
        icono={<AutorenewOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Nuevas: ${resumen.nuevas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Renovaciones: ${resumen.renovaciones || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Facturado: ${dinero(resumen.total_facturado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Cobrado: ${dinero(resumen.total_cobrado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
              <Chip variant="outlined" label={`Saldo: ${dinero(resumen.saldo_pendiente)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Membresías nuevas y renovaciones"
                descripcion="Altas y renovaciones de membresías por período, sede, plan y estado."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (fila) => fecha(fila.fecha_movimiento) },
                  { label: 'Sede', value: 'sede', align: 'left' },
                  { label: 'Movimiento', value: (fila) => fila.tipo_movimiento === 'RENOVACION' ? 'Renovación' : 'Nueva' },
                  { label: 'Contrato', value: 'codigo_contrato' },
                  { label: 'Cliente', value: (fila) => `${fila.cliente || ''} ${fila.identificacion || ''}`, align: 'left' },
                  { label: 'Plan', value: 'plan', align: 'left' },
                  { label: 'Modalidad', value: 'modalidad', align: 'left' },
                  { label: 'Período', value: 'numero_periodo' },
                  { label: 'Estado', value: 'estado_periodo' },
                  { label: 'Precio', value: (fila) => dinero(fila.precio) },
                  { label: 'Cobrado', value: (fila) => dinero(fila.total_cobrado) },
                  { label: 'Saldo', value: (fila) => dinero(fila.saldo_pendiente) },
                ]}
                obtenerFilas={() => membresiasNuevasRenovacionesServicio.consultarTodo(filtros)}
                exportarExcel={() => membresiasNuevasRenovacionesServicio.exportarExcel(filtros)}
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
              <FiltroColumna align="center" columna="fecha_movimiento" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={fecha}>Fecha</FiltroColumna>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tipo_movimiento} onChange={(valor) => aplicar({ tipo_movimiento: valor })} options={catalogos.tipos_movimiento || []} multiple>Movimiento</FilterHeaderCell>
              <FiltroColumna align="center" columna="codigo_contrato" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Contrato</FiltroColumna>
              <FiltroColumna columna="cliente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Cliente</FiltroColumna>
              <FiltroColumna columna="plan" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Plan</FiltroColumna>
              <FiltroColumna columna="modalidad" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Modalidad</FiltroColumna>
              <FiltroColumna align="center" columna="numero_periodo" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Período</FiltroColumna>
              <FilterHeaderCell align="center" value={filtros.estado_periodo} onChange={(valor) => aplicar({ estado_periodo: valor })} options={opciones(catalogos.estados_periodo)} multiple>Estado</FilterHeaderCell>
              <FiltroColumna align="center" columna="precio" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Precio</FiltroColumna>
              <FiltroColumna align="center" columna="total_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Cobrado</FiltroColumna>
              <FiltroColumna align="center" columna="saldo_pendiente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Saldo</FiltroColumna>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center">{fecha(item.fecha_movimiento)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.tipo_movimiento === 'RENOVACION' ? 'Renovación' : 'Nueva'}</TableCell>
                <TableCell align="center">{item.codigo_contrato}</TableCell>
                <TableCell>{item.cliente}<br /><small>{item.identificacion}</small></TableCell>
                <TableCell>{item.plan}</TableCell>
                <TableCell>{item.modalidad}</TableCell>
                <TableCell align="center">{item.numero_periodo}</TableCell>
                <TableCell align="center">{item.estado_periodo}</TableCell>
                <TableCell align="center">{dinero(item.precio)}</TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={12} texto="No existen membresías nuevas o renovaciones para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
