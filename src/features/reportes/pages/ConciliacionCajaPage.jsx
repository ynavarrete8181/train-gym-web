import { useEffect, useState } from 'react';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { conciliacionCajaServicio } from '../services/ventas/conciliacionCajaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const hay = (valor) => valor !== null && valor !== undefined && Math.abs(Number(valor)) > 0.009;

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

/** Conciliación de caja: cada turno con su fondo, efectivo esperado y contado, diferencias y arqueos pendientes. */
export function ConciliacionCajaPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await conciliacionCajaServicio.consultar(params);
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
  const alertas = resumen.alertas || {};
  const alternar = (alerta) => aplicar({ alerta: filtros.alerta === alerta ? undefined : alerta });
  const fueraRango = (alertas.pendientes_totales || 0) - (alertas.pendientes || 0);
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Conciliación de caja"
        descripcion="Cada turno con su fondo, efectivo esperado y contado, diferencias y arqueos pendientes."
        icono={<BalanceOutlinedIcon />} />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Conciliación de caja"
                descripcion="Cada turno con su fondo, efectivo esperado y contado, diferencias y estado del arqueo."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (f) => `${fecha(f.fecha)} ${f.hora_apertura}–${f.hora_cierre}` },
                  { label: 'Cajero', value: 'cajero', align: 'left' },
                  { label: 'Fondo inicial', value: (f) => dinero(f.saldo_inicial) },
                  { label: 'Cierre anterior', value: (f) => (f.fondo_anterior == null ? '—' : dinero(f.fondo_anterior)) },
                  { label: 'Efectivo cobrado', value: (f) => dinero(f.efectivo_cobrado) },
                  { label: 'Esperado', value: (f) => dinero(f.efectivo_esperado) },
                  { label: 'Contado', value: (f) => (f.efectivo_contado == null ? 'Sin arqueo' : dinero(f.efectivo_contado)) },
                  { label: 'Diferencia', value: (f) => (f.diferencia == null ? '—' : dinero(f.diferencia)) },
                  { label: 'Transferencias', value: (f) => dinero(Number(f.transferencia_cobrada) + Number(f.deposito_cobrado)) },
                ]}
                obtenerFilas={() => conciliacionCajaServicio.consultarTodo(filtros)}
                exportarExcel={() => conciliacionCajaServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        {/* Las tres alertas filtran la tabla al tocarlas; al tocar de nuevo se quita el filtro. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Pendientes de arqueo" valor={`${alertas.pendientes || 0}`} color={uiTokens.colores.acentoOscuro}
            detalle={fueraRango > 0 ? `+ ${fueraRango} antes de estas fechas` : 'Cerrados sin contar el efectivo'}
            activo={filtros.alerta === 'PENDIENTE'} onClick={() => alternar('PENDIENTE')} />
          <Tarjeta titulo="Con diferencia" valor={`${alertas.con_diferencia || 0}`} color={uiTokens.colores.peligro}
            detalle={`Faltó ${dinero(alertas.faltantes)} · sobró ${dinero(alertas.sobrantes)}`}
            activo={filtros.alerta === 'DIFERENCIA'} onClick={() => alternar('DIFERENCIA')} />
          <Tarjeta titulo="Fondo que no cuadra" valor={`${alertas.fondo_no_cuadra || 0}`} color={uiTokens.colores.advertencia}
            detalle="Abrió distinto al cierre anterior" activo={filtros.alerta === 'FONDO'} onClick={() => alternar('FONDO')} />
          <Tarjeta titulo="Efectivo cobrado" valor={dinero(resumen.efectivo_cobrado)} detalle={`${resumen.turnos_cerrados || 0} turnos cerrados`} color={uiTokens.colores.exito} />
          <Tarjeta titulo="Transferencias" valor={dinero(resumen.transferencias)} detalle="No pasan por la caja" color={uiTokens.colores.info} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('fecha', 'Turno', { formato: fecha })}
              {columna('cajero', 'Cajero')}
              {columna('saldo_inicial', 'Fondo', { align: 'center', formato: dinero })}
              {columna('efectivo_cobrado', 'Efectivo cobrado', { align: 'center', formato: dinero })}
              {columna('efectivo_contado', 'Contado / esperado', { align: 'center', formato: dinero })}
              {columna('diferencia', 'Diferencia', { align: 'center', formato: dinero })}
              {columna('transferencia_cobrada', 'Transferencias', { align: 'center', formato: dinero })}
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit', fontWeight: 700 }}>{fecha(item.fecha)}</Box>
                  <Typography variant="caption" color="text.secondary">{item.hora_apertura} – {item.hora_cierre} · {item.caja_nombre}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 110 }}>{item.cajero}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit' }}>{dinero(item.saldo_inicial)}</Box>
                  {hay(item.diferencia_fondo) && (
                    <Typography variant="caption" sx={{ color: 'warning.dark', display: 'block', lineHeight: 1.3 }}>
                      {Number(item.diferencia_fondo) < 0
                        ? `${dinero(-item.diferencia_fondo)} retirados`
                        : `${dinero(item.diferencia_fondo)} agregados`}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">{dinero(item.efectivo_cobrado)}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {item.efectivo_contado == null ? <Typography variant="caption" sx={{ color: 'warning.dark' }}>Sin arqueo</Typography> : dinero(item.efectivo_contado)}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>de {dinero(item.efectivo_esperado)}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800,
                  color: !hay(item.diferencia) ? 'text.secondary' : Number(item.diferencia) < 0 ? 'error.main' : 'warning.dark' }}>
                  {item.diferencia == null ? '—' : !hay(item.diferencia) ? '$0.00'
                    : `${Number(item.diferencia) < 0 ? 'Faltó' : 'Sobró'} ${dinero(Math.abs(item.diferencia))}`}
                </TableCell>
                <TableCell align="center">{dinero(Number(item.transferencia_cobrada) + Number(item.deposito_cobrado))}</TableCell>
                <TableCell>
                  {item.pendiente_arqueo
                    ? <Chip size="small" variant="outlined" color="warning" label="Sin arqueo" />
                    : item.conciliado_at
                      ? <Tooltip title={`Conciliado por ${item.conciliado_por_nombre || ''} el ${fecha(item.conciliado_at)}`}>
                        <Chip size="small" variant="outlined" color="success" label="Conciliado" />
                      </Tooltip>
                      : <Typography variant="caption" color="text.secondary">Cerrado</Typography>}
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay turnos cerrados para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
