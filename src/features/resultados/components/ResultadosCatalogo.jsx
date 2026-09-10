import { useEffect, useMemo, useState } from 'react';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { Box, Paper, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { resultadoServicio } from '../services/resultadoServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin registrar';
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));

const configs = {
  resumen: {
    titulo: 'Resumen operativo',
    descripcion: 'Indicadores generales para seguimiento diario del gimnasio.',
    icono: <InsightsOutlinedIcon />,
  },
  asistencia: {
    titulo: 'Resultados de asistencia',
    descripcion: 'Consolidado de asistencias por fecha y sede.',
    icono: <HowToRegOutlinedIcon />,
    obtener: 'obtenerAsistencia',
  },
  ventas: {
    titulo: 'Resultados de ventas',
    descripcion: 'Resumen de transacciones por fecha, tipo y estado.',
    icono: <PaidOutlinedIcon />,
    obtener: 'obtenerVentas',
  },
  progreso: {
    titulo: 'Progreso físico',
    descripcion: 'Registros de rendimiento tomados desde entrenamiento.',
    icono: <FitnessCenterOutlinedIcon />,
    obtener: 'obtenerProgreso',
  },
};

const metricas = [
  { key: 'clientes_activos', label: 'Clientes activos', icono: <PeopleAltOutlinedIcon />, formato: numero },
  { key: 'membresias_activas', label: 'Membresías activas', icono: <TableChartOutlinedIcon />, formato: numero },
  { key: 'asistencias_hoy', label: 'Asistencias hoy', icono: <HowToRegOutlinedIcon />, formato: numero },
  { key: 'ventas_mes', label: 'Ventas del mes', icono: <PaidOutlinedIcon />, formato: dinero },
  { key: 'reservas_hoy', label: 'Reservas hoy', icono: <InsightsOutlinedIcon />, formato: numero },
  { key: 'planes_entrenamiento_activos', label: 'Planes activos', icono: <FitnessCenterOutlinedIcon />, formato: numero },
];

export function ResultadosCatalogo({ tipo }) {
  const config = configs[tipo];
  const [resumen, setResumen] = useState({});
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarResumen = async () => {
    setCargando(true);
    try {
      const response = await resultadoServicio.obtenerResumen();
      setResumen(response.datos || {});
    } finally {
      setCargando(false);
    }
  };

  const cargarTabla = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await resultadoServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setFiltros({ busqueda: '', page: 1, per_page: 5 });
    setFiltrosColumna({});
    setItems([]);
    setMeta({});
    if (tipo === 'resumen') cargarResumen();
    else cargarTabla({ busqueda: '', page: 1, per_page: 5 });
  }, [tipo]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarTabla(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargarTabla(nuevosFiltros);
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  if (tipo === 'resumen') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
        <Paper className="page-content-container" elevation={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {metricas.map((metrica) => (
              <Box key={metrica.key} sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1, px: 2, py: 1.6, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1.4, minHeight: 82 }}>
                <Box className="page-header-icon-box" sx={{ position: 'static' }}>{metrica.icono}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: uiTokens.colores.textoMedio, textTransform: 'uppercase' }}>{metrica.label}</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.1 }}>{metrica.formato(resumen[metrica.key])}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          {cargando ? <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 800, color: uiTokens.colores.textoMedio }}>Cargando indicadores...</Typography> : null}
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} />
        <TablaResultados items={items} columnas={columnas} meta={meta} cargando={cargando} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargarTabla(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargarTabla(nuevos); }} />
      </Paper>
    </Box>
  );
}

function TablaResultados({ items, columnas, meta, cargando, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead><TableRow>{columnas.map((columna) => columna.header)}</TableRow></TableHead>
      <TableBody>
        {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={columnas.length} texto="No existen resultados para los filtros aplicados." /> : null}
        {items.map((item, index) => (
          <TableRow hover key={`${item.id || item.fecha || index}-${index}`}>
            {columnas.map((columna) => <TableCell key={columna.key} align={columna.align || 'left'}>{columna.render(item)}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, items = []) => <FilterHeaderCell key={key} value={filtros[key] || ''} onChange={(valor) => onFiltro(key, valor)} options={items}>{label}</FilterHeaderCell>;

  if (tipo === 'asistencia') {
    return [
      { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.fecha) },
      { key: 'sede', header: filtro('sede', 'Sede', opciones(meta.catalogos?.sede)), render: (item) => item.sede || 'Sin sede' },
      { key: 'asistencias', header: <FilterHeaderCell key="asistencias" align="right">Asistencias</FilterHeaderCell>, align: 'right', render: (item) => numero(item.asistencias) },
      { key: 'clientes', header: <FilterHeaderCell key="clientes" align="right">Clientes</FilterHeaderCell>, align: 'right', render: (item) => numero(item.clientes) },
    ];
  }

  if (tipo === 'ventas') {
    return [
      { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.fecha) },
      { key: 'tipo_venta', header: filtro('tipo_venta', 'Tipo', opciones(meta.catalogos?.tipo_venta)), render: (item) => item.tipo_venta || 'Sin tipo' },
      { key: 'estado', header: filtro('estado', 'Estado', opciones(meta.catalogos?.estado_venta)), render: (item) => <StatusChip estado={estadoVenta(item.estado)} /> },
      { key: 'transacciones', header: <FilterHeaderCell key="transacciones" align="right">Transacciones</FilterHeaderCell>, align: 'right', render: (item) => numero(item.transacciones) },
      { key: 'total', header: <FilterHeaderCell key="total" align="right">Total</FilterHeaderCell>, align: 'right', render: (item) => dinero(item.total) },
    ];
  }

  return [
    { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.fecha_registro) },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.catalogos?.cliente)), render: (item) => <Box><Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{item.cliente_nombre || 'Sin cliente'}</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.codigo_deportista || 'Sin código'}</Typography></Box> },
    { key: 'ejercicio', header: filtro('ejercicio', 'Ejercicio', opciones(meta.catalogos?.ejercicio)), render: (item) => item.ejercicio_nombre || 'Sin ejercicio' },
    { key: 'peso', header: <FilterHeaderCell key="peso" align="right">Peso</FilterHeaderCell>, align: 'right', render: (item) => `${numero(item.peso)} kg` },
    { key: 'repeticiones', header: <FilterHeaderCell key="repeticiones" align="right">Reps</FilterHeaderCell>, align: 'right', render: (item) => numero(item.repeticiones) },
    { key: 'rm_estimado', header: <FilterHeaderCell key="rm_estimado" align="right">RM estimado</FilterHeaderCell>, align: 'right', render: (item) => item.rm_estimado ? `${numero(item.rm_estimado)} kg` : 'Sin registrar' },
    { key: 'tipo_registro', header: <FilterHeaderCell key="tipo_registro">Tipo</FilterHeaderCell>, render: (item) => item.tipo_registro || 'General' },
  ];
}

function estadoVenta(estado) {
  const normalizado = String(estado || '').toUpperCase();
  if (normalizado === 'PAGADA' || normalizado === 'CONFIRMADA') return 'activo';
  if (normalizado === 'ANULADA') return 'inactivo';
  return 'pendiente';
}
