import { useEffect, useState } from 'react';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { membresiasPorVencerServicio } from '../services/ventas/membresiasPorVencerServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const sumarDias = (iso, dias) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
};
const SITUACIONES = {
  AUTOMATICA: ['Se renuevan solas', 'success', 'Renovación automática y todo pagado'],
  DEUDA: ['Bloqueadas por deuda', 'error', 'No se renuevan hasta que paguen'],
  MANUAL: ['Renovar a mano', 'warning', 'Sin renovación automática'],
};
const textoSituacion = (item) => (item.situacion === 'AUTOMATICA'
  ? `Se renueva sola el ${fecha(item.fecha_programacion)}`
  : item.situacion === 'DEUDA' ? `No se renueva: debe ${dinero(item.deuda)}` : 'Renovar a mano');

function Tarjeta({ titulo, valor, detalle, color, activo = false, onClick }) {
  return (
    <Box onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      sx={{ p: 1.5, border: '1px solid', borderColor: activo ? color : 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}`,
        bgcolor: activo ? 'action.selected' : 'background.paper', cursor: onClick ? 'pointer' : 'default', minWidth: 0,
        '&:hover': onClick ? { borderColor: color } : undefined }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color, fontSize: { xs: 16, md: 19 } }} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{detalle}</Typography>
    </Box>
  );
}

/** Membresías por vencer: qué pasa con cada contrato al vencer, a quién llamar y cuánto pagará al renovar. */
export function MembresiasPorVencerPage() {
  const hoy = hoyEcuador();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    vence_desde: hoy,
    vence_hasta: sumarDias(hoy, 30),
    sede_id: [],
    columnas: {},
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await membresiasPorVencerServicio.consultar(params);
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
  const situaciones = resumen.situaciones || {};
  const catalogos = meta.catalogos || {};
  const colores = { AUTOMATICA: uiTokens.colores.exito, DEUDA: uiTokens.colores.peligro, MANUAL: uiTokens.colores.acentoOscuro };
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Membresías por vencer"
        descripcion="Qué pasa con cada contrato al vencer, a quién llamar y cuánto pagará al renovar."
        icono={<EventAvailableOutlinedIcon />} />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Vence desde" value={filtros.vence_desde} onChange={(e) => aplicar({ vence_desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Vence hasta" value={filtros.vence_hasta} onChange={(e) => aplicar({ vence_hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Membresías por vencer"
                descripcion="Qué pasa con cada contrato al vencer, a quién llamar y cuánto pagará al renovar."
                filtros={filtros}
                columnas={[
                  { label: 'Cliente', value: 'cliente', align: 'left' },
                  { label: 'Paga', value: 'paga', align: 'left' },
                  { label: 'Teléfono', value: (f) => f.telefono || '' },
                  { label: 'Contrato', value: (f) => `${f.codigo_contrato} · ${f.plan}`, align: 'left' },
                  { label: 'Vence', value: (f) => fecha(f.fecha_fin) },
                  { label: 'Días', value: 'dias_restantes' },
                  { label: 'Al vencer', value: textoSituacion, align: 'left' },
                  { label: 'Pagará al renovar', value: (f) => dinero(f.monto_renovacion) },
                ]}
                obtenerFilas={() => membresiasPorVencerServicio.consultarTodo(filtros)}
                exportarExcel={() => membresiasPorVencerServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        {/* Las tarjetas filtran la tabla al tocarlas; al tocar de nuevo se quita el filtro. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Vencen en 7 días" valor={`${resumen.proximos_7 || 0}`} color={uiTokens.colores.info}
            detalle={filtros.proximos_7 ? 'Filtrado · toca para quitar' : 'Los más urgentes'} activo={Boolean(filtros.proximos_7)}
            onClick={() => aplicar({ proximos_7: filtros.proximos_7 ? undefined : 1 })} />
          {Object.entries(SITUACIONES).map(([clave, [titulo, , detalle]]) => (
            <Tarjeta key={clave} titulo={titulo} valor={`${situaciones[clave] || 0}`} color={colores[clave]}
              detalle={filtros.situacion === clave ? 'Filtrado · toca para quitar'
                : clave === 'DEUDA' ? `Deben ${dinero(resumen.deuda_total)}` : detalle}
              activo={filtros.situacion === clave}
              onClick={() => aplicar({ situacion: filtros.situacion === clave ? undefined : clave })} />
          ))}
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('cliente', 'Cliente')}
              {columna('paga', 'Paga')}
              {columna('telefono', 'Teléfono', { align: 'center' })}
              {columna('codigo_contrato', 'Contrato')}
              {columna('fecha_fin', 'Vence', { align: 'center', formato: fecha })}
              <FilterHeaderCell align="center" value={filtros.situacion ? [filtros.situacion] : []} multiple
                onChange={(valor) => aplicar({ situacion: (Array.isArray(valor) ? valor[valor.length - 1] : valor) || undefined })}
                options={Object.entries(SITUACIONES).map(([v, [l]]) => ({ value: v, label: l }))}>Al vencer</FilterHeaderCell>
              {columna('monto_renovacion', 'Pagará al renovar', { align: 'center', formato: dinero })}
              <FilterHeaderCell value={filtros.sede_id} multiple onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}>Sede</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ minWidth: 150 }}>{item.cliente}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>{item.paga === item.cliente ? <Typography variant="caption" color="text.secondary">El mismo cliente</Typography> : item.paga}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {item.telefono || <Typography variant="caption" sx={{ color: 'warning.dark' }}>Sin teléfono</Typography>}
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.codigo_contrato}</Box>
                  <Typography variant="caption" color="text.secondary">{item.plan}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit' }}>{fecha(item.fecha_fin)}</Box>
                  <Typography variant="caption" sx={{ color: item.dias_restantes <= 7 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
                    {item.dias_restantes === 0 ? 'Hoy' : `en ${item.dias_restantes} días`}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={SITUACIONES[item.situacion]?.[1] || 'default'} label={textoSituacion(item)} />
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit', fontWeight: 800 }}>{dinero(item.monto_renovacion)}</Box>
                  {Number(item.descuento_renovacion) > 0 && <Typography variant="caption" sx={{ color: 'success.dark' }}>{dinero(item.precio_renovacion)} − {dinero(item.descuento_renovacion)}</Typography>}
                </TableCell>
                <TableCell>{item.sede}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay contratos por vencer para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
