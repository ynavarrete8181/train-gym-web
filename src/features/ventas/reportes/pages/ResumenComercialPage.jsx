import { useEffect, useState } from 'react';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../../../reportes/components/FiltroColumna.jsx';
import { TablaEstadoFila } from '../../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../../components/tables/useTablaLocal.js';
import { uiTokens } from '../../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../../../reportes/components/ReporteExportaciones.jsx';
import { resumenComercialServicio } from '../services/resumenComercialServicio.js';
import { hoyEcuador } from '../../../../utils/fechaLocal.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const variacion = (valor) => (valor == null ? '—' : `${Number(valor) > 0 ? '+' : ''}${Number(valor).toFixed(1)} %`);

export function ResumenComercialPage() {
  const hoy = new Date();
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await resumenComercialServicio.consultar(params);
      setDatos(response.datos || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const indicadores = datos.indicadores || {};
  const comparativo = datos.comparativo || {};
  const sedes = datos.catalogos?.sedes || [];
  const porSede = datos.por_sede || [];
  const tabla = useTablaLocal(porSede, {});

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Resumen comercial"
        descripcion="Ventas, cobros, saldo por cobrar y descuentos del período, por sede."
        icono={<InsightsOutlinedIcon />}
      />
      <Paper className="page-content-container" elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5, justifyContent: 'flex-end' }}>
          <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <ReporteExportaciones
            titulo="Resumen comercial"
            descripcion="Ventas, cobros, saldo por cobrar y descuentos del período, por sede."
            filtros={filtros}
            columnas={[
              { label: 'Sede', value: 'sede', align: 'left' },
              { label: 'Transacciones', value: (fila) => numero(fila.transacciones) },
              { label: 'Ventas', value: (fila) => dinero(fila.total_ventas) },
              { label: 'Descuentos', value: (fila) => dinero(fila.descuentos) },
              { label: 'Cobrado', value: (fila) => dinero(fila.total_cobrado) },
              { label: 'Por cobrar', value: (fila) => dinero(fila.por_cobrar) },
            ]}
            obtenerFilas={() => resumenComercialServicio.consultarTodo(filtros)}
            exportarExcel={() => resumenComercialServicio.exportarExcel(filtros)}
          />
        </Stack>

        {/* Indicadores del período: qué se facturó, qué entró y qué falta cobrar. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          {[
            ['Ventas (facturado)', dinero(indicadores.total_ventas), `${numero(indicadores.transacciones)} ventas`, uiTokens.colores.primario],
            ['Cobrado', dinero(indicadores.total_cobrado), 'Dinero que entró en el período', uiTokens.colores.exito],
            ['Por cobrar', dinero(indicadores.por_cobrar), 'Saldo de las ventas del período', uiTokens.colores.acentoOscuro],
            ['Descuentos otorgados', dinero(indicadores.descuentos), 'Dejado de cobrar por descuentos', uiTokens.colores.textoFuerte],
          ].map(([titulo, valor, detalle, color]) => (
            <Box key={titulo} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}` }}>
              <Typography variant="caption" color="text.secondary">{titulo}</Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color }}>{valor}</Typography>
              <Typography variant="caption" color="text.secondary">{detalle}</Typography>
            </Box>
          ))}
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
          <Chip variant="outlined" label={`Membresías: ${dinero(indicadores.membresias)}`} sx={{ fontWeight: 800 }} />
          <Chip variant="outlined" label={`Productos y servicios: ${dinero(indicadores.productos_servicios)}`} sx={{ fontWeight: 800 }} />
          {comparativo.disponible ? (
            <>
              <Chip variant="outlined" label={`Ventas vs. ${fecha(comparativo.desde)}–${fecha(comparativo.hasta)}: ${variacion(indicadores.variacion_ventas)}`} sx={{ fontWeight: 800 }} />
              <Chip variant="outlined" label={`Cobros vs. período anterior: ${variacion(indicadores.variacion_cobros)}`} sx={{ fontWeight: 800 }} />
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Sin comparación: el sistema aún no tenía ventas durante todo el período anterior ({fecha(comparativo.desde)}–{fecha(comparativo.hasta)}).
            </Typography>
          )}
        </Stack>

        <TablaGestion {...tabla.propsTabla} cargando={cargando}>
          <TableHead>
            <TableRow>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={sedes.map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FiltroColumna align="center" columna="transacciones" filtros={filtros} opciones={datos.opciones_filtro} aplicar={aplicar} formato={numero}>Transacciones</FiltroColumna>
              <FiltroColumna align="center" columna="total_ventas" filtros={filtros} opciones={datos.opciones_filtro} aplicar={aplicar} formato={dinero}>Ventas</FiltroColumna>
              <FiltroColumna align="center" columna="descuentos" filtros={filtros} opciones={datos.opciones_filtro} aplicar={aplicar} formato={dinero}>Descuentos</FiltroColumna>
              <TableCell align="center">Cobrado</TableCell>
              <FiltroColumna align="center" columna="por_cobrar" filtros={filtros} opciones={datos.opciones_filtro} aplicar={aplicar} formato={dinero}>Por cobrar</FiltroColumna>
            </TableRow>
          </TableHead>
          <TableBody>
            {tabla.visibles.map((item) => (
              <TableRow key={item.sede} hover>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important' }}>{numero(item.transacciones)}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important' }}>{dinero(item.total_ventas)}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important' }}>{dinero(item.descuentos)}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important', color: 'success.dark', fontWeight: 800 }}>{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important', fontWeight: 800 }}>{dinero(item.por_cobrar)}</TableCell>
              </TableRow>
            ))}
            {!cargando && porSede.length === 0 ? <TablaEstadoFila colSpan={6} texto="No existen movimientos comerciales para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
