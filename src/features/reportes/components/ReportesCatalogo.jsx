import { useEffect, useMemo, useState } from 'react';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { Box, Button, IconButton, Paper, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { reporteServicio } from '../services/reporteServicio.js';

const opciones = (valores = []) => (Array.isArray(valores) ? valores : []).map((valor) => ({
  value: String(valor),
  label: String(valor),
}));
const fecha = (valor) => valor ? new Date(valor).toLocaleString('es-EC') : 'Sin registrar';
const estadoReporte = (estado) => String(estado || '').toUpperCase() === 'GENERADO' ? 'activo' : 'pendiente';

const configs = {
  disponibles: {
    titulo: 'Reportes disponibles',
    descripcion: 'Consulta y genera reportes administrativos desde los módulos migrados.',
    icono: <AssessmentOutlinedIcon />,
    obtener: 'obtenerDisponibles',
  },
  historial: {
    titulo: 'Historial de reportes',
    descripcion: 'Revisa las ejecuciones generadas y su estado.',
    icono: <HistoryOutlinedIcon />,
    obtener: 'obtenerHistorial',
  },
};

export function ReportesCatalogo({ tipo }) {
  const config = configs[tipo];
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await reporteServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } catch {
      setNotificacion({ mensaje: `Error al cargar ${config.titulo.toLowerCase()}`, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setFiltros({ busqueda: '', page: 1, per_page: 5 });
    setFiltrosColumna({});
    cargar({ busqueda: '', page: 1, per_page: 5 });
  }, [tipo]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const generar = async (item) => {
    try {
      await reporteServicio.generar({ codigo: item.codigo, formato: 'VISTA', filtros: {} });
      setNotificacion({ mensaje: 'Reporte generado correctamente', tipo: 'success' });
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo generar el reporte', tipo: 'error' });
    }
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} />
        <TablaReportes items={items} columnas={columnas} meta={meta} cargando={cargando} tipo={tipo} onGenerar={generar} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function TablaReportes({ items, columnas, meta, cargando, tipo, onGenerar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead><TableRow>{columnas.map((columna) => columna.header)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
      <TableBody>
        {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} texto="No existen reportes para los filtros seleccionados." /> : null}
        {items.map((item) => (
          <TableRow hover key={item.id}>
            {columnas.map((columna) => <TableCell key={columna.key} align={columna.align || 'left'}>{columna.render(item)}</TableCell>)}
            <TableCell align="right">
              {tipo === 'disponibles' ? (
                <Tooltip title="Generar reporte">
                  <IconButton onClick={() => onGenerar(item)} sx={dbanuStyles.actionEdit}><PlayArrowOutlinedIcon /></IconButton>
                </Tooltip>
              ) : (
                <Button size="small" startIcon={<DownloadOutlinedIcon />} disabled sx={{ minWidth: 106, justifyContent: 'center' }}>Exportar</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, items = []) => <FilterHeaderCell key={key} value={filtros[key] || ''} onChange={(valor) => onFiltro(key, valor)} options={items}>{label}</FilterHeaderCell>;

  if (tipo === 'historial') {
    return [
      { key: 'reporte', header: <FilterHeaderCell key="reporte">Reporte</FilterHeaderCell>, render: (item) => <Box><Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{item.reporte_nombre}</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.codigo}</Typography></Box> },
      { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria },
      { key: 'formato', header: filtro('formato', 'Formato', opciones(meta.opciones_filtro?.formato)), render: (item) => item.formato },
      { key: 'estado', header: filtro('estado', 'Estado', opciones(meta.opciones_filtro?.estado)), render: (item) => <StatusChip estado={estadoReporte(item.estado)} /> },
      { key: 'generado', header: <FilterHeaderCell key="generado">Generado</FilterHeaderCell>, render: (item) => fecha(item.generado_at) },
      { key: 'usuario', header: <FilterHeaderCell key="usuario">Usuario</FilterHeaderCell>, render: (item) => item.usuario_nombre || 'Sistema' },
    ];
  }

  return [
    { key: 'codigo', header: <FilterHeaderCell key="codigo">Código</FilterHeaderCell>, render: (item) => item.codigo },
    { key: 'nombre', header: <FilterHeaderCell key="nombre">Reporte</FilterHeaderCell>, render: (item) => <Box><Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{item.nombre}</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.descripcion || 'Sin descripción'}</Typography></Box> },
    { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria },
    { key: 'estado', header: filtro('activo', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={item.activo ? 'activo' : 'inactivo'} /> },
  ];
}
