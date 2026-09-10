import { useEffect, useMemo, useState } from 'react';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Paper, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { auditoriaServicio } from '../services/auditoriaServicio.js';

const opciones = (valores = []) => (Array.isArray(valores) ? valores : []).map((valor) => ({ value: String(valor), label: String(valor) }));
const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : 'Sin fecha');
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const colorAccion = (accion) => {
  const normalizado = String(accion || '').toUpperCase();
  if (normalizado === 'CREAR') return 'success';
  if (normalizado === 'ELIMINAR') return 'error';
  return 'info';
};
const colorAcceso = (tipo) => (String(tipo || '').toUpperCase() === 'LOGIN_FALLIDO' ? 'error' : 'success');
const colorNivel = (nivel) => {
  const normalizado = String(nivel || '').toUpperCase();
  if (normalizado === 'ERROR') return 'error';
  if (normalizado === 'WARNING') return 'warning';
  return 'info';
};

const configs = {
  eventos: {
    titulo: 'Registro de actividad',
    descripcion: 'Quién creó, modificó o eliminó cada dato del sistema, cuándo y desde dónde.',
    icono: <FactCheckOutlinedIcon />,
    obtener: 'obtenerEventos',
  },
  accesos: {
    titulo: 'Accesos al sistema',
    descripcion: 'Inicios y cierres de sesión, incluyendo intentos fallidos.',
    icono: <LoginOutlinedIcon />,
    obtener: 'obtenerAccesos',
  },
  logs: {
    titulo: 'Errores del sistema',
    descripcion: 'Excepciones y errores técnicos del backend, capturados automáticamente.',
    icono: <BugReportOutlinedIcon />,
    obtener: 'obtenerLogs',
  },
};

export function AuditoriaCatalogo({ tipo }) {
  if (tipo === 'resumen') return <ResumenAuditoria />;
  return <TablaAuditoria tipo={tipo} />;
}

function TablaAuditoria({ tipo }) {
  const config = configs[tipo];
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 10 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await auditoriaServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setFiltros({ busqueda: '', page: 1, per_page: 10 });
    setFiltrosColumna({});
    cargar({ busqueda: '', page: 1, per_page: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const buscar = (parametros) => { const nuevos = { ...parametros, page: 1 }; setFiltros(nuevos); cargar(nuevos); };
  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} />
        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 10} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} cargando={cargando}>
          <TableHead><TableRow>{columnas.map((columna) => columna.header)}{tipo === 'eventos' || tipo === 'logs' ? <TableCell align="right">Detalle</TableCell> : null}</TableRow></TableHead>
          <TableBody>
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + (tipo === 'eventos' || tipo === 'logs' ? 1 : 0)} texto="No hay registros para los filtros seleccionados." /> : null}
            {items.map((item) => (
              <TableRow hover key={item.id}>
                {columnas.map((columna) => <TableCell key={columna.key} align={columna.align || 'left'}>{columna.render(item)}</TableCell>)}
                {tipo === 'eventos' || tipo === 'logs' ? (
                  <TableCell align="right">
                    <Tooltip title={tipo === 'logs' ? 'Ver detalle técnico' : 'Ver datos antes/después'}>
                      <span>
                        <IconButton size="small" disabled={tipo === 'eventos' ? !item.datos_antes && !item.datos_despues : !item.stack_trace} onClick={() => setDetalle(item)} sx={dbanuStyles.actionEdit}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </TablaGestion>
      </Paper>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 15 }}>
          {detalle && tipo === 'logs' ? (detalle.exception_class || detalle.modulo) : detalle ? `${detalle.modulo} · ${detalle.tabla || 'sistema'} · ${detalle.accion}` : ''}
        </DialogTitle>
        <DialogContent>
          {tipo === 'logs' ? (
            <>
              <Typography sx={{ fontSize: 12, mb: 1 }}>{detalle?.mensaje}</Typography>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: uiTokens.colores.textoMedio, mb: 0.5 }}>{detalle?.archivo ? `${detalle.archivo}:${detalle.linea}` : 'Sin archivo registrado'}</Typography>
              <Box component="pre" sx={{ fontSize: 11, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1, p: 1.2, overflowX: 'auto', maxHeight: 320 }}>
                {detalle?.stack_trace || 'Sin traza registrada.'}
              </Box>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: uiTokens.colores.textoMedio, mb: 0.5 }}>ANTES</Typography>
              <Box component="pre" sx={{ fontSize: 11.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1, p: 1.2, overflowX: 'auto', mb: 1.5 }}>
                {formatearJson(detalle?.datos_antes)}
              </Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: uiTokens.colores.textoMedio, mb: 0.5 }}>DESPUÉS</Typography>
              <Box component="pre" sx={{ fontSize: 11.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1, p: 1.2, overflowX: 'auto' }}>
                {formatearJson(detalle?.datos_despues)}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function formatearJson(valor) {
  if (!valor) return 'Sin datos.';
  try {
    const objeto = typeof valor === 'string' ? JSON.parse(valor) : valor;
    return JSON.stringify(objeto, null, 2);
  } catch {
    return String(valor);
  }
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, items = []) => <FilterHeaderCell key={key} value={filtros[key] || ''} onChange={(valor) => onFiltro(key, valor)} options={items}>{label}</FilterHeaderCell>;

  if (tipo === 'accesos') {
    return [
      { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.created_at) },
      { key: 'email', header: <FilterHeaderCell key="email">Usuario</FilterHeaderCell>, render: (item) => item.email || 'Desconocido' },
      { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(meta.opciones_filtro?.tipo_acceso)), render: (item) => <Chip label={item.tipo} color={colorAcceso(item.tipo)} size="small" variant="outlined" /> },
      { key: 'motivo', header: <FilterHeaderCell key="motivo">Motivo</FilterHeaderCell>, render: (item) => item.motivo || '—' },
      { key: 'ip', header: <FilterHeaderCell key="ip">IP</FilterHeaderCell>, render: (item) => item.ip || '—' },
    ];
  }

  if (tipo === 'logs') {
    return [
      { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.created_at) },
      { key: 'nivel', header: filtro('nivel', 'Nivel', opciones(meta.opciones_filtro?.nivel)), render: (item) => <Chip label={item.nivel} color={colorNivel(item.nivel)} size="small" variant="outlined" /> },
      { key: 'canal', header: filtro('canal', 'Canal', opciones(meta.opciones_filtro?.canal)), render: (item) => item.canal },
      { key: 'modulo', header: filtro('modulo', 'Módulo', opciones(meta.opciones_filtro?.modulo)), render: (item) => item.modulo || '—' },
      { key: 'mensaje', header: <FilterHeaderCell key="mensaje">Mensaje</FilterHeaderCell>, render: (item) => <Typography sx={{ fontSize: 12, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.mensaje}</Typography> },
      { key: 'usuario', header: <FilterHeaderCell key="usuario">Usuario</FilterHeaderCell>, render: (item) => item.usuario_nombre || 'Sistema' },
    ];
  }

  return [
    { key: 'fecha', header: <FilterHeaderCell key="fecha">Fecha</FilterHeaderCell>, render: (item) => fecha(item.created_at) },
    { key: 'usuario', header: filtro('usuario', 'Usuario', opciones(meta.opciones_filtro?.usuario)), render: (item) => item.usuario_nombre || 'Sistema' },
    { key: 'rol', header: filtro('rol', 'Rol', opciones(meta.opciones_filtro?.rol)), render: (item) => item.rol || '—' },
    { key: 'modulo', header: filtro('modulo', 'Módulo', opciones(meta.opciones_filtro?.modulo)), render: (item) => item.modulo },
    { key: 'tabla', header: <FilterHeaderCell key="tabla">Tabla</FilterHeaderCell>, render: (item) => item.tabla || '—' },
    { key: 'accion', header: filtro('accion', 'Acción', opciones(meta.opciones_filtro?.accion)), render: (item) => <Chip label={item.accion} color={colorAccion(item.accion)} size="small" variant="outlined" /> },
    { key: 'descripcion', header: <FilterHeaderCell key="descripcion">Descripción</FilterHeaderCell>, render: (item) => item.descripcion || '—' },
  ];
}

function ResumenAuditoria() {
  const [resumen, setResumen] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const response = await auditoriaServicio.obtenerResumen();
        setResumen(response.datos || {});
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const metricas = [
    { label: 'Eventos registrados', valor: resumen.total_eventos },
    { label: 'Accesos hoy', valor: resumen.total_accesos_hoy },
    { label: 'Accesos fallidos hoy', valor: resumen.accesos_fallidos_hoy },
  ];

  const listas = [
    { titulo: 'Por módulo', datos: resumen.por_modulo },
    { titulo: 'Por acción', datos: resumen.por_accion },
    { titulo: 'Por usuario', datos: resumen.por_usuario },
  ];

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Resumen de auditoría" descripcion="Vista general de la actividad registrada en el sistema." icono={<InsightsOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
          {metricas.map((metrica) => (
            <Box key={metrica.label} sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1, px: 2, py: 1.6, bgcolor: 'background.paper', minHeight: 82 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: uiTokens.colores.textoMedio, textTransform: 'uppercase' }}>{metrica.label}</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.1 }}>{numero(metrica.valor)}</Typography>
            </Box>
          ))}
        </Box>

        {cargando ? <Typography sx={{ fontSize: 12, fontWeight: 800, color: uiTokens.colores.textoMedio }}>Cargando indicadores...</Typography> : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          {listas.map((lista) => (
            <Box key={lista.titulo} sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1, p: 1.5 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, mb: 1 }}>{lista.titulo}</Typography>
              {(lista.datos || []).length === 0 ? (
                <Typography sx={{ fontSize: 12, color: uiTokens.colores.textoMedio }}>Sin datos.</Typography>
              ) : (
                (lista.datos || []).slice(0, 8).map((fila) => (
                  <Box key={fila.clave} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: 12 }}>{fila.clave}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{numero(fila.total)}</Typography>
                  </Box>
                ))
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
