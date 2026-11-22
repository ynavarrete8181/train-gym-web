import { useEffect, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Box, Paper, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { carteraVencidaServicio } from '../services/ventas/carteraVencidaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const TRAMOS = [
  ['1-7', '1 a 7 días', uiTokens.colores.info],
  ['8-30', '8 a 30 días', uiTokens.colores.advertencia],
  ['31+', 'Más de 30 días', uiTokens.colores.peligro],
];

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

/** Cartera vencida: quién debe, cuánto, desde cuándo y a quién llamar (el tutor si paga él). */
export function CarteraVencidaReportePage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', sede_id: [], columnas: {}, page: 1, per_page: 5 });
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

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const resumen = meta.resumen || {};
  const tramos = resumen.tramos || {};
  const catalogos = meta.catalogos || {};
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Cartera vencida" descripcion="Quién debe, cuánto, desde cuándo y cómo contactarlo."
        icono={<AccountBalanceWalletOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          acciones={(
            <ReporteExportaciones
              titulo="Cartera vencida"
              descripcion="Quién debe, cuánto, desde cuándo y cómo contactarlo."
              filtros={filtros}
              columnas={[
                { label: 'Cliente', value: 'cliente', align: 'left' },
                { label: 'Paga', value: 'paga', align: 'left' },
                { label: 'Teléfono', value: (f) => f.telefono || '' },
                { label: 'Qué debe', value: (f) => [f.contrato, f.periodo].filter(Boolean).join(' · '), align: 'left' },
                { label: 'Vencimiento', value: (f) => fecha(f.fecha_vencimiento) },
                { label: 'Días', value: 'dias_vencidos' },
                { label: 'Saldo', value: (f) => dinero(f.saldo_pendiente) },
              ]}
              obtenerFilas={() => carteraVencidaServicio.consultarTodo(filtros)}
              exportarExcel={() => carteraVencidaServicio.exportarExcel(filtros)}
            />
          )}
        />

        {/* Al tocar un tramo de atraso se filtra la tabla; al tocarlo de nuevo se quita el filtro. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Total vencido" valor={dinero(resumen.saldo_vencido)}
            detalle={`${resumen.cuentas_vencidas || 0} cuentas · ${resumen.deudores || 0} personas o familias`} color={uiTokens.colores.peligro} />
          {TRAMOS.map(([clave, titulo, color]) => (
            <Tarjeta key={clave} titulo={titulo} valor={dinero(tramos[clave]?.saldo)} color={color}
              detalle={`${tramos[clave]?.cuentas || 0} cuentas · ${filtros.tramo === clave ? 'toca para quitar' : 'toca para ver'}`}
              activo={filtros.tramo === clave}
              onClick={() => aplicar({ tramo: filtros.tramo === clave ? undefined : clave })} />
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
              {columna('contrato', 'Qué debe')}
              {columna('fecha_vencimiento', 'Vencimiento', { align: 'center', formato: fecha })}
              {columna('dias_vencidos', 'Días', { align: 'center' })}
              {columna('saldo_pendiente', 'Saldo', { align: 'center', formato: dinero })}
              <FilterHeaderCell value={filtros.sede_id} multiple onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}>Sede</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box sx={{ fontSize: 'inherit' }}>{item.cliente}</Box>
                  {item.identificacion && <Typography variant="caption" color="text.secondary">{item.identificacion}</Typography>}
                </TableCell>
                <TableCell>{item.paga === item.cliente ? <Typography variant="caption" color="text.secondary">El mismo cliente</Typography> : item.paga}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {item.telefono || <Typography variant="caption" sx={{ color: 'warning.dark' }}>Sin teléfono</Typography>}
                </TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{item.contrato}</Box>
                  {item.periodo && <Typography variant="caption" color="text.secondary">{item.periodo}</Typography>}
                </TableCell>
                <TableCell align="center">{fecha(item.fecha_vencimiento)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: item.dias_vencidos > 30 ? 'error.main' : item.dias_vencidos > 7 ? 'warning.dark' : 'text.primary' }}>
                  {item.dias_vencidos}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.saldo_pendiente)}</TableCell>
                <TableCell>{item.sede}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay cuentas vencidas para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
