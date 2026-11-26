import { useEffect, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Box, Chip, Paper, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '../../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../../styles/uiTokens.js';
import { FiltroColumna } from '../../../reportes/components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../../../reportes/components/ReporteExportaciones.jsx';
import { TarjetaReporte as Tarjeta } from '../../../reportes/components/TarjetaReporte.jsx';
import { clientesReporteServicio } from '../services/clientesReporteServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const ESTADOS = {
  ACTIVO: ['Activo', 'success'], PROSPECTO: ['Prospecto', 'info'], SUSPENDIDO: ['Suspendido', 'warning'], INACTIVO: ['Inactivo', 'default'],
};
const MEMBRESIA = {
  ACTIVA: ['Activa', 'success'], PENDIENTE_PAGO: ['Pendiente de pago', 'warning'], CONGELADA: ['Congelada', 'info'],
  VENCIDA: ['Vencida', 'default'], CANCELADA: ['Cancelada', 'error'],
};
const DESCRIPCION = 'Padrón de clientes con sus datos, membresía vigente, deuda, última asistencia y estado.';

/** Reporte de clientes: todos los clientes con sus datos y su situación actual. */
export function ClientesReportePage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', columnas: {}, page: 1, per_page: 5 });
  const [cargando, setCargando] = useState(true);

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await clientesReporteServicio.consultar(params);
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

  const r = meta.resumen || {};
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );
  // Cada tarjeta filtra la tabla; tocarla de nuevo quita el filtro.
  const tarjeta = (clave, titulo, valor, detalle, color) => (
    <Tarjeta titulo={titulo} valor={valor} color={color} activo={filtros.tarjeta === clave}
      detalle={detalle ?? (filtros.tarjeta === clave ? 'Toca para quitar' : 'Toca para ver')}
      onClick={() => aplicar({ tarjeta: filtros.tarjeta === clave ? undefined : clave })} />
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Clientes" descripcion={DESCRIPCION} icono={<GroupsOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          acciones={(
            <ReporteExportaciones
              titulo="Clientes"
              descripcion={DESCRIPCION}
              filtros={filtros}
              columnas={[
                { label: 'Cliente', value: (f) => `${f.cliente}${f.codigo ? ` (${f.codigo})` : ''}`, align: 'left' },
                { label: 'Cédula', value: 'cedula' },
                { label: 'Teléfono', value: 'telefono' },
                { label: 'Tutor', value: 'tutor', align: 'left' },
                { label: 'Sede', value: 'sede' },
                { label: 'Membresía', value: (f) => (f.membresia ? `${f.membresia} · ${MEMBRESIA[f.membresia_estado]?.[0] || ''} · vence ${fecha(f.vence)}` : 'Sin membresía'), align: 'left' },
                { label: 'Deuda', value: (f) => dinero(f.deuda) },
                { label: 'Últ. asistencia', value: (f) => fecha(f.ultima_asistencia) },
                { label: 'Estado', value: (f) => ESTADOS[f.estado]?.[0] || f.estado },
              ]}
              obtenerFilas={() => clientesReporteServicio.consultarTodo(filtros)}
              exportarExcel={() => clientesReporteServicio.exportarExcel(filtros)}
            />
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Clientes" valor={r.total || 0} color={uiTokens.colores.primario}
            detalle={`${r.sin_membresia || 0} sin membresía`} activo={filtros.tarjeta === 'SIN_MEMBRESIA'}
            onClick={() => aplicar({ tarjeta: filtros.tarjeta === 'SIN_MEMBRESIA' ? undefined : 'SIN_MEMBRESIA' })} />
          {tarjeta('ACTIVOS', 'Activos', r.activos || 0, null, uiTokens.colores.exito)}
          {tarjeta('MEMBRESIA_ACTIVA', 'Membresía activa', r.membresia_activa || 0,
            `${r.membresia_pendiente || 0} pendientes de pago`, uiTokens.colores.info)}
          {tarjeta('CON_DEUDA', 'Con deuda', r.con_deuda || 0, `Deben ${dinero(r.deuda_total)}`, uiTokens.colores.peligro)}
          {tarjeta('PROSPECTOS', 'Prospectos', r.prospectos || 0, null, uiTokens.colores.acentoOscuro)}
          {tarjeta('SIN_CEDULA', 'Sin cédula', r.sin_cedula || 0, null, uiTokens.colores.advertencia)}
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('cliente', 'Cliente')}
              {columna('cedula', 'Cédula', { align: 'center' })}
              {columna('telefono', 'Teléfono', { align: 'center' })}
              {columna('tutor', 'Tutor')}
              {columna('sede', 'Sede', { align: 'center' })}
              {columna('membresia', 'Membresía')}
              {columna('deuda', 'Deuda', { align: 'center', formato: dinero })}
              {columna('ultima_asistencia', 'Últ. asistencia', { align: 'center', formato: fecha })}
              {columna('estado', 'Estado', { align: 'center', formato: (v) => ESTADOS[v]?.[0] || v })}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box sx={{ fontSize: 'inherit', fontWeight: 700 }}>{item.cliente}</Box>
                  <Typography variant="caption" color="text.secondary">
                    {[item.codigo, item.edad != null ? `${item.edad} años` : null].filter(Boolean).join(' · ')}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ color: item.cedula === 'Sin documento' ? 'warning.dark' : 'inherit', whiteSpace: 'nowrap' }}>
                  {item.cedula}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ fontSize: 'inherit', color: item.telefono === 'Sin teléfono' ? 'warning.dark' : 'inherit' }}>{item.telefono}</Box>
                  {item.correo && <Typography variant="caption" color="text.secondary">{item.correo}</Typography>}
                </TableCell>
                <TableCell>{item.tutor === 'Sin tutor' ? <Typography variant="caption" color="text.secondary">Sin tutor</Typography> : item.tutor}</TableCell>
                <TableCell align="center">{item.sede}</TableCell>
                <TableCell sx={{ minWidth: 190 }}>
                  {item.membresia ? <>
                    <Box sx={{ fontSize: 'inherit' }}>{item.membresia}</Box>
                    <Typography variant="caption" color="text.secondary">{item.contrato} · vence {fecha(item.vence)} </Typography>
                    <Chip size="small" variant="outlined" sx={{ height: 18, fontSize: 10.5 }}
                      color={MEMBRESIA[item.membresia_estado]?.[1] || 'default'} label={MEMBRESIA[item.membresia_estado]?.[0] || item.membresia_estado} />
                  </> : <Typography variant="caption" color="text.secondary">Sin membresía</Typography>}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: Number(item.deuda) > 0 ? 'error.main' : 'text.secondary' }}>
                  {Number(item.deuda) > 0 ? dinero(item.deuda) : '—'}
                </TableCell>
                <TableCell align="center">{fecha(item.ultima_asistencia)}</TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={ESTADOS[item.estado]?.[1] || 'default'} label={ESTADOS[item.estado]?.[0] || item.estado} />
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={9} texto="No hay clientes para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
