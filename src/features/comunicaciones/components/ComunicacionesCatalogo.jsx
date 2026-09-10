import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { comunicacionServicio } from '../services/comunicacionServicio.js';

const canales = ['SISTEMA', 'CORREO', 'PUSH', 'APP'];
const estadosMensaje = ['BORRADOR', 'PROGRAMADO', 'ENVIADO', 'CANCELADO'];
const estadosProgramacion = ['ACTIVA', 'PAUSADA', 'FINALIZADA'];
const frecuencias = ['UNICA', 'DIARIA', 'SEMANAL', 'MENSUAL', 'EVENTO'];
const opciones = (valores = []) => (Array.isArray(valores) ? valores : []).map((valor) => ({
  value: String(valor),
  label: String(valor),
}));
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');
const estadoTexto = (valor) => {
  const estado = String(valor || '').toUpperCase();
  if (['ACTIVA', 'ENVIADO'].includes(estado)) return 'activo';
  if (['BORRADOR', 'PROGRAMADO', 'PAUSADA'].includes(estado)) return 'pendiente';
  if (['CANCELADO', 'FINALIZADA'].includes(estado)) return 'cerrado';
  return 'pendiente';
};
const fecha = (valor) => valor ? new Date(valor).toLocaleString('es-EC') : 'Sin programar';

const configs = {
  tipos: {
    titulo: 'Tipos de comunicación',
    singular: 'Tipo',
    descripcion: 'Clasifica los procesos de comunicación propios de Revive.',
    icono: <CategoryOutlinedIcon />,
    obtener: 'obtenerTipos',
    crear: 'crearTipo',
    actualizar: 'actualizarTipo',
    inicial: { id: null, codigo: '', nombre: '', descripcion: '', canal_preferido: 'SISTEMA', activo: true },
  },
  segmentos: {
    titulo: 'Segmentos',
    singular: 'Segmento',
    descripcion: 'Define audiencias de negocio sin modificar usuarios ni notificaciones base.',
    icono: <GroupsOutlinedIcon />,
    obtener: 'obtenerSegmentos',
    crear: 'crearSegmento',
    actualizar: 'actualizarSegmento',
    inicial: { id: null, codigo: '', nombre: '', descripcion: '', activo: true },
  },
  mensajes: {
    titulo: 'Mensajes',
    singular: 'Mensaje',
    descripcion: 'Prepara comunicaciones de negocio antes de enviarlas por el motor base.',
    icono: <CampaignOutlinedIcon />,
    obtener: 'obtenerMensajes',
    crear: 'crearMensaje',
    actualizar: 'actualizarMensaje',
    inicial: { id: null, tipo_id: '', segmento_id: '', titulo: '', contenido: '', canal: 'SISTEMA', estado: 'BORRADOR', programado_at: '' },
  },
  programaciones: {
    titulo: 'Programaciones',
    singular: 'Programación',
    descripcion: 'Agenda comunicaciones recurrentes o eventos automáticos del gimnasio.',
    icono: <EventRepeatOutlinedIcon />,
    obtener: 'obtenerProgramaciones',
    crear: 'crearProgramacion',
    actualizar: 'actualizarProgramacion',
    inicial: { id: null, mensaje_id: '', nombre: '', frecuencia: 'UNICA', proxima_ejecucion: '', estado: 'ACTIVA', observaciones: '' },
  },
};

export function ComunicacionesCatalogo({ tipo }) {
  const config = configs[tipo];
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({});
  const [formData, setFormData] = useState(config.inicial);
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await comunicacionServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch {
      setNotificacion({ mensaje: `Error al cargar ${config.titulo.toLowerCase()}`, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setVista('lista');
    setFormData(config.inicial);
    setFiltros({ busqueda: '', page: 1, per_page: 5 });
    setFiltrosColumna({});
  }, [tipo]);

  useEffect(() => { cargar(); }, [tipo]);

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

  const nuevo = () => { setFormData(config.inicial); setVista('formulario'); };
  const editar = (item) => { setFormData({ ...config.inicial, ...item, activo: item.activo !== false }); setVista('formulario'); };
  const cambiar = ({ target }) => setFormData((actual) => ({ ...actual, [target.name]: target.type === 'checkbox' ? target.checked : target.value }));

  const guardar = async () => {
    try {
      const payload = normalizar(tipo, formData);
      if (!payload) {
        setNotificacion({ mensaje: 'Complete los campos obligatorios', tipo: 'warning' });
        return;
      }
      if (formData.id) await comunicacionServicio[config.actualizar](formData.id, payload);
      else await comunicacionServicio[config.crear](payload);
      setNotificacion({ mensaje: `${config.singular} guardado correctamente`, tipo: 'success' });
      setVista('lista');
      cargar();
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || `Error al guardar ${config.singular.toLowerCase()}`, tipo: 'error' });
    }
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={`${formData.id ? 'Editar' : 'Nuevo'} ${config.singular}`} descripcion={config.descripcion} icono={config.icono} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#f6f8fc', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de {config.singular.toLowerCase()}</Typography>
              <Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={cambiar} />
            </Box>
          </Box>
          <AccionesFormulario onGuardar={guardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={nuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <TablaComunicaciones items={items} columnas={columnas} meta={meta} cargando={cargando} onEditar={editar} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function Formulario({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };
  if (tipo === 'tipos') return <Box sx={grid}><TextField label="Código" name="codigo" value={formData.codigo || ''} onChange={onChange} required size="small" /><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField select label="Canal preferido" name="canal_preferido" value={formData.canal_preferido || 'SISTEMA'} onChange={onChange} required size="small">{canales.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /></Box>;
  if (tipo === 'segmentos') return <Box sx={grid}><TextField label="Código" name="codigo" value={formData.codigo || ''} onChange={onChange} required size="small" /><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /><TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /></Box>;
  if (tipo === 'mensajes') return <Box sx={grid}><TextField select label="Tipo" name="tipo_id" value={formData.tipo_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin tipo</MenuItem>{(catalogos.tipos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField select label="Segmento" name="segmento_id" value={formData.segmento_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin segmento</MenuItem>{(catalogos.segmentos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField select label="Canal" name="canal" value={formData.canal || 'SISTEMA'} onChange={onChange} required size="small">{canales.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField label="Título" name="titulo" value={formData.titulo || ''} onChange={onChange} required size="small" sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /><TextField select label="Estado" name="estado" value={formData.estado || 'BORRADOR'} onChange={onChange} required size="small">{estadosMensaje.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField label="Contenido" name="contenido" value={formData.contenido || ''} onChange={onChange} required size="small" multiline minRows={4} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /></Box>;
  return <Box sx={grid}><TextField select label="Mensaje" name="mensaje_id" value={formData.mensaje_id || ''} onChange={onChange} required size="small"><MenuItem value="">Seleccione</MenuItem>{(catalogos.mensajes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.titulo}</MenuItem>)}</TextField><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField select label="Frecuencia" name="frecuencia" value={formData.frecuencia || 'UNICA'} onChange={onChange} required size="small">{frecuencias.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField select label="Estado" name="estado" value={formData.estado || 'ACTIVA'} onChange={onChange} required size="small">{estadosProgramacion.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /></Box>;
}

function TablaComunicaciones({ items, columnas, meta, cargando, onEditar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead><TableRow>{columnas.map((columna) => columna.header)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
      <TableBody>
        {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} texto="No existen comunicaciones para los filtros seleccionados." /> : null}
        {items.map((item) => <TableRow hover key={item.id}>{columnas.map((columna) => <TableCell key={columna.key} align={columna.align || 'left'}>{columna.render(item)}</TableCell>)}<TableCell align="right"><Tooltip title="Editar"><IconButton onClick={() => onEditar(item)} sx={dbanuStyles.actionEdit}><EditOutlinedIcon /></IconButton></Tooltip></TableCell></TableRow>)}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, items = []) => <FilterHeaderCell key={key} value={filtros[key] || ''} onChange={(valor) => onFiltro(key, valor)} options={items}>{label}</FilterHeaderCell>;
  if (tipo === 'tipos') return [
    { key: 'codigo', header: <FilterHeaderCell key="codigo">Código</FilterHeaderCell>, render: (item) => item.codigo },
    { key: 'nombre', header: <FilterHeaderCell key="nombre">Nombre</FilterHeaderCell>, render: (item) => item.nombre },
    { key: 'canal', header: filtro('canal', 'Canal', opciones(meta.opciones_filtro?.canal)), render: (item) => item.canal_preferido },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];
  if (tipo === 'segmentos') return [
    { key: 'codigo', header: <FilterHeaderCell key="codigo">Código</FilterHeaderCell>, render: (item) => item.codigo },
    { key: 'nombre', header: <FilterHeaderCell key="nombre">Nombre</FilterHeaderCell>, render: (item) => item.nombre },
    { key: 'descripcion', header: <FilterHeaderCell key="descripcion">Descripción</FilterHeaderCell>, render: (item) => item.descripcion || 'Sin descripción' },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];
  if (tipo === 'mensajes') return [
    { key: 'titulo', header: <FilterHeaderCell key="titulo">Mensaje</FilterHeaderCell>, render: (item) => <Box><Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{item.titulo}</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.tipo_nombre || 'Sin tipo'}</Typography></Box> },
    { key: 'segmento', header: <FilterHeaderCell key="segmento">Segmento</FilterHeaderCell>, render: (item) => item.segmento_nombre || 'Sin segmento' },
    { key: 'canal', header: filtro('canal', 'Canal', opciones(meta.opciones_filtro?.canal)), render: (item) => item.canal },
    { key: 'estado', header: filtro('estado', 'Estado', opciones(meta.opciones_filtro?.estado_mensaje)), render: (item) => <StatusChip estado={estadoTexto(item.estado)} /> },
  ];
  return [
    { key: 'nombre', header: <FilterHeaderCell key="nombre">Programación</FilterHeaderCell>, render: (item) => <Box><Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{item.nombre}</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.mensaje_titulo}</Typography></Box> },
    { key: 'frecuencia', header: filtro('frecuencia', 'Frecuencia', opciones(meta.opciones_filtro?.frecuencia)), render: (item) => item.frecuencia },
    { key: 'proxima', header: <FilterHeaderCell key="proxima">Próxima ejecución</FilterHeaderCell>, render: (item) => fecha(item.proxima_ejecucion) },
    { key: 'estado', header: filtro('estado', 'Estado', opciones(meta.opciones_filtro?.estado_programacion)), render: (item) => <StatusChip estado={estadoTexto(item.estado)} /> },
  ];
}

function normalizar(tipo, data) {
  if (tipo === 'tipos') return data.codigo && data.nombre ? { codigo: data.codigo, nombre: data.nombre, descripcion: data.descripcion || null, canal_preferido: data.canal_preferido || 'SISTEMA', activo: Boolean(data.activo) } : null;
  if (tipo === 'segmentos') return data.codigo && data.nombre ? { codigo: data.codigo, nombre: data.nombre, descripcion: data.descripcion || null, criterios: { origen: 'REVIVE' }, activo: Boolean(data.activo) } : null;
  if (tipo === 'mensajes') return data.titulo && data.contenido ? { tipo_id: data.tipo_id || null, segmento_id: data.segmento_id || null, titulo: data.titulo, contenido: data.contenido, canal: data.canal || 'SISTEMA', estado: data.estado || 'BORRADOR', programado_at: data.programado_at || null } : null;
  return data.mensaje_id && data.nombre ? { mensaje_id: data.mensaje_id, nombre: data.nombre, frecuencia: data.frecuencia || 'UNICA', proxima_ejecucion: data.proxima_ejecucion || null, estado: data.estado || 'ACTIVA', observaciones: data.observaciones || null } : null;
}
