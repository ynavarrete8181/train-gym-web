import { useEffect, useState } from 'react';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { resumenComercialServicio } from '../services/ventas/resumenComercialServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');

export function ResumenComercialPage() {
  const hoy = new Date();
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    sede_id: [],
    transacciones: '',
    total_ventas: '',
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
  const sedes = datos.catalogos?.sedes || [];
  const porSede = datos.por_sede || [];

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Resumen comercial"
        descripcion="Indicadores consolidados de ventas y cobros por período y sede."
        icono={<InsightsOutlinedIcon />}
      />
      <Paper className="page-content-container" elevation={0}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} sx={{ mb: 1.5, alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {[
              ['Ventas', dinero(indicadores.total_ventas), uiTokens.colores.primario],
              ['Transacciones', numero(indicadores.transacciones), uiTokens.colores.textoFuerte],
              ['Cobrado', dinero(indicadores.total_cobrado), uiTokens.colores.exito],
              ['Variación ventas', `${Number(indicadores.variacion_ventas || 0).toFixed(2)}%`, uiTokens.colores.info],
              ['Variación cobros', `${Number(indicadores.variacion_cobros || 0).toFixed(2)}%`, uiTokens.colores.acentoOscuro],
            ].map(([label, value, color]) => (
              <Chip key={label} variant="outlined" label={`${label}: ${value}`} sx={{ height: 36, borderRadius: 0.5, fontWeight: 900, color, borderColor: color, '& .MuiChip-label': { px: 1.25, fontSize: 11.3 } }} />
            ))}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <ReporteExportaciones
              titulo="Resumen comercial"
              descripcion="Indicadores consolidados de ventas y cobros por período y sede."
              filtros={filtros}
              columnas={[
                { label: 'Sede', value: 'sede', align: 'left' },
                { label: 'Transacciones', value: (fila) => numero(fila.transacciones) },
                { label: 'Ventas', value: (fila) => dinero(fila.total_ventas) },
              ]}
              obtenerFilas={() => resumenComercialServicio.consultarTodo(filtros)}
              exportarExcel={() => resumenComercialServicio.exportarExcel(filtros)}
            />
          </Stack>
        </Stack>

        <TablaGestion total={porSede.length} filtrados={porSede.length} cargando={cargando} textoResumen={`${porSede.length} sedes consultadas`}>
          <TableHead>
            <TableRow>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={sedes.map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.transacciones} onChange={(valor) => aplicar({ transacciones: valor })}>Transacciones</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.total_ventas} onChange={(valor) => aplicar({ total_ventas: valor })}>Ventas</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {porSede.map((item) => (
              <TableRow key={item.sede} hover>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important' }}>{numero(item.transacciones)}</TableCell>
                <TableCell align="center" sx={{ textAlign: 'center !important' }}>{dinero(item.total_ventas)}</TableCell>
              </TableRow>
            ))}
            {!cargando && porSede.length === 0 ? <TablaEstadoFila colSpan={3} texto="No existen movimientos comerciales para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
