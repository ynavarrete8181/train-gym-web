import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import SensorOccupiedOutlinedIcon from '@mui/icons-material/SensorOccupiedOutlined';
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
import { accesoServicio } from '../services/accesoServicio.js';

const tiposDispositivo = ['MANUAL', 'QR', 'BIOMETRICO', 'TORNIQUETE', 'APP'];
const tiposCredencial = ['QR', 'TARJETA', 'CODIGO', 'APP'];
const estadosCredencial = ['ACTIVA', 'INACTIVA', 'BLOQUEADA', 'VENCIDA'];
const tiposEvento = ['INGRESO', 'SALIDA', 'VALIDACION'];
const tiposAsistencia = ['INGRESO', 'SALIDA', 'CLASE', 'ENTRENAMIENTO'];
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const fechaHora = (valor) => valor ? new Date(valor).toLocaleString('es-EC') : 'Sin fecha';
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');
const estadoAcceso = (valor) => String(valor || '').toLowerCase().replace('permitido', 'activo').replace('valida', 'activo').replace('activa', 'activo').replace('denegado', 'bloqueado');

const configs = {
  dispositivos: {
    titulo: 'Dispositivos',
    singular: 'Dispositivo',
    descripcion: 'Administra puntos de validación de ingreso.',
    icono: <DevicesOutlinedIcon />,
    obtener: 'obtenerDispositivos',
    crear: 'crearDispositivo',
    actualizar: 'actualizarDispositivo',
    inicial: { id: null, sede_id: '', nombre: '', tipo: 'MANUAL', proveedor: '', identificador_externo: '', activo: true },
  },
  credenciales: {
    titulo: 'Credenciales',
    singular: 'Credencial',
    descripcion: 'Asigna códigos de ingreso a clientes activos.',
    icono: <BadgeOutlinedIcon />,
    obtener: 'obtenerCredenciales',
    crear: 'crearCredencial',
    actualizar: 'actualizarCredencial',
    inicial: { id: null, cliente_id: '', tipo: 'QR', codigo: '', estado: 'ACTIVA', vigencia_inicio: '', vigencia_fin: '' },
  },
  eventos: {
    titulo: 'Eventos de acceso',
    singular: 'Evento',
    descripcion: 'Valida ingresos, salidas y lecturas de credenciales.',
    icono: <SensorOccupiedOutlinedIcon />,
    obtener: 'obtenerEventos',
    crear: 'registrarEvento',
    actualizar: null,
    inicial: { id: null, dispositivo_id: '', sede_id: '', cliente_id: '', codigo_credencial: '', tipo_evento: 'INGRESO' },
  },
  asistencias: {
    titulo: 'Asistencia',
    singular: 'Asistencia',
    descripcion: 'Consulta y registra asistencias manuales de clientes.',
    icono: <HowToRegOutlinedIcon />,
    obtener: 'obtenerAsistencias',
    crear: 'registrarAsistencia',
    actualizar: null,
    inicial: { id: null, cliente_id: '', sede_id: '', tipo: 'INGRESO', metodo: 'MANUAL', estado: 'VALIDA', observaciones: '' },
  },
};

export function AccesoCatalogo({ tipo }) {
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

  const showNotificacion = (mensaje, tipoAviso = 'info') => setNotificacion({ mensaje, tipo: tipoAviso });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await accesoServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch (error) {
      showNotificacion(`Error al cargar ${config.titulo.toLowerCase()}`, 'error');
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

  const handleNuevo = () => { setFormData(config.inicial); setVista('formulario'); };
  const handleEditar = (item) => { setFormData({ ...config.inicial, ...item, activo: item.activo !== false }); setVista('formulario'); };
  const handleChange = (evento) => {
    const { name, value, checked, type: inputType } = evento.target;
    setFormData((actual) => ({ ...actual, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async () => {
    try {
      const payload = normalizar(tipo, formData);
      if (!payload) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }
      if (formData.id && config.actualizar) await accesoServicio[config.actualizar](formData.id, payload);
      else await accesoServicio[config.crear](payload);
      showNotificacion(`${config.singular} guardado correctamente`, 'success');
      setVista('lista');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || `Error al guardar ${config.singular.toLowerCase()}`, 'error');
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
              <Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} />
            </Box>
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <TablaAcceso items={items} columnas={columnas} meta={meta} cargando={cargando} editable={Boolean(config.actualizar)} onEditar={handleEditar} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function Formulario({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };

  if (tipo === 'dispositivos') {
    return <Box sx={grid}><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField select label="Tipo" name="tipo" value={formData.tipo || 'MANUAL'} onChange={onChange} required size="small">{tiposDispositivo.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin sede</MenuItem>{(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField label="Proveedor" name="proveedor" value={formData.proveedor || ''} onChange={onChange} size="small" /><TextField label="Identificador externo" name="identificador_externo" value={formData.identificador_externo || ''} onChange={onChange} size="small" /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /></Box>;
  }

  if (tipo === 'credenciales') {
    return <Box sx={grid}><TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} required size="small">{(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre} - {item.codigo_deportista}</MenuItem>)}</TextField><TextField select label="Tipo" name="tipo" value={formData.tipo || 'QR'} onChange={onChange} required size="small">{tiposCredencial.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField select label="Estado" name="estado" value={formData.estado || 'ACTIVA'} onChange={onChange} required size="small">{estadosCredencial.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField label="Código" name="codigo" value={formData.codigo || ''} onChange={onChange} required size="small" /><TextField label="Vigencia inicio" name="vigencia_inicio" type="datetime-local" value={String(formData.vigencia_inicio || '').slice(0, 16)} onChange={onChange} size="small" slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Vigencia fin" name="vigencia_fin" type="datetime-local" value={String(formData.vigencia_fin || '').slice(0, 16)} onChange={onChange} size="small" slotProps={{ inputLabel: { shrink: true } }} /></Box>;
  }

  if (tipo === 'eventos') {
    return <Box sx={grid}><TextField select label="Dispositivo" name="dispositivo_id" value={formData.dispositivo_id || ''} onChange={onChange} size="small"><MenuItem value="">Manual</MenuItem>{(catalogos.dispositivos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin sede</MenuItem>{(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField select label="Tipo evento" name="tipo_evento" value={formData.tipo_evento || 'INGRESO'} onChange={onChange} required size="small">{tiposEvento.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} size="small"><MenuItem value="">Buscar por credencial</MenuItem>{(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre} - {item.codigo_deportista}</MenuItem>)}</TextField><TextField label="Código credencial" name="codigo_credencial" value={formData.codigo_credencial || ''} onChange={onChange} size="small" sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /></Box>;
  }

  return <Box sx={grid}><TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} required size="small">{(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre} - {item.codigo_deportista}</MenuItem>)}</TextField><TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin sede</MenuItem>{(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField select label="Tipo" name="tipo" value={formData.tipo || 'INGRESO'} onChange={onChange} required size="small">{tiposAsistencia.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><TextField select label="Método" name="metodo" value={formData.metodo || 'MANUAL'} onChange={onChange} required size="small"><MenuItem value="MANUAL">MANUAL</MenuItem><MenuItem value="CREDENCIAL">CREDENCIAL</MenuItem><MenuItem value="APP">APP</MenuItem></TextField><TextField select label="Estado" name="estado" value={formData.estado || 'VALIDA'} onChange={onChange} required size="small"><MenuItem value="VALIDA">VALIDA</MenuItem><MenuItem value="OBSERVADA">OBSERVADA</MenuItem><MenuItem value="ANULADA">ANULADA</MenuItem></TextField><TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /></Box>;
}

function TablaAcceso({ items, columnas, meta, cargando, editable, onEditar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead><TableRow>{columnas.map((columna) => columna.header)}{editable ? <TableCell align="right">Acciones</TableCell> : null}</TableRow></TableHead>
      <TableBody>
        {items.map((item) => <TableRow key={item.id} hover>{columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}{editable ? <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></TableCell> : null}</TableRow>)}
        {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + (editable ? 1 : 0)} cargando={cargando} texto="No hay registros para los filtros aplicados." /> : null}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtros[key]} onChange={(v) => onFiltro(key, v)} options={opts}>{label}</FilterHeaderCell>;

  if (tipo === 'dispositivos') return [
    { key: 'nombre', header: filtro('nombre', 'Dispositivo', opciones(meta.opciones_filtro?.dispositivo)), render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
    { key: 'tipo', header: <TableCell key="tipo">Tipo</TableCell>, render: (item) => item.tipo },
    { key: 'sede', header: <TableCell key="sede">Sede</TableCell>, render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'proveedor', header: <TableCell key="proveedor">Proveedor</TableCell>, render: (item) => item.proveedor || 'Interno' },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];

  if (tipo === 'credenciales') return [
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></Box> },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(meta.opciones_filtro?.tipo_credencial)), render: (item) => item.tipo },
    { key: 'codigo', header: <TableCell key="codigo">Código</TableCell>, render: (item) => item.codigo },
    { key: 'vigencia', header: <TableCell key="vigencia">Vigencia</TableCell>, render: (item) => `${fechaHora(item.vigencia_inicio)} - ${fechaHora(item.vigencia_fin)}` },
    { key: 'estado', header: filtro('estado', 'Estado', opciones(estadosCredencial)), render: (item) => <StatusChip estado={estadoAcceso(item.estado)} /> },
  ];

  if (tipo === 'eventos') return [
    { key: 'fecha', header: <TableCell key="fecha">Fecha</TableCell>, render: (item) => fechaHora(item.fecha_hora) },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => item.cliente_nombre || 'Sin identificar' },
    { key: 'dispositivo', header: filtro('dispositivo', 'Dispositivo', opciones(meta.opciones_filtro?.dispositivo)), render: (item) => item.dispositivo_nombre || 'Manual' },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(tiposEvento)), render: (item) => item.tipo_evento },
    { key: 'resultado', header: filtro('resultado', 'Resultado', [{ value: 'PERMITIDO', label: 'Permitido' }, { value: 'DENEGADO', label: 'Denegado' }]), render: (item) => <StatusChip estado={estadoAcceso(item.resultado)} /> },
  ];

  return [
    { key: 'fecha', header: <TableCell key="fecha">Fecha</TableCell>, render: (item) => fechaHora(item.fecha_hora) },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></Box> },
    { key: 'sede', header: <TableCell key="sede">Sede</TableCell>, render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(tiposAsistencia)), render: (item) => item.tipo },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'VALIDA', label: 'Válida' }, { value: 'OBSERVADA', label: 'Observada' }, { value: 'ANULADA', label: 'Anulada' }]), render: (item) => <StatusChip estado={estadoAcceso(item.estado)} /> },
  ];
}

function normalizar(tipo, data) {
  if (tipo === 'dispositivos') {
    if (!data.nombre || !data.tipo) return null;
    return { sede_id: data.sede_id ? Number(data.sede_id) : null, nombre: data.nombre, tipo: data.tipo, proveedor: data.proveedor || null, identificador_externo: data.identificador_externo || null, activo: Boolean(data.activo) };
  }
  if (tipo === 'credenciales') {
    if (!data.cliente_id || !data.tipo || !data.codigo || !data.estado) return null;
    return { cliente_id: Number(data.cliente_id), tipo: data.tipo, codigo: data.codigo, estado: data.estado, vigencia_inicio: data.vigencia_inicio || null, vigencia_fin: data.vigencia_fin || null };
  }
  if (tipo === 'eventos') {
    if (!data.tipo_evento || (!data.cliente_id && !data.codigo_credencial)) return null;
    return { dispositivo_id: data.dispositivo_id ? Number(data.dispositivo_id) : null, sede_id: data.sede_id ? Number(data.sede_id) : null, cliente_id: data.cliente_id ? Number(data.cliente_id) : null, codigo_credencial: data.codigo_credencial || null, tipo_evento: data.tipo_evento };
  }
  if (!data.cliente_id || !data.tipo || !data.metodo || !data.estado) return null;
  return { cliente_id: Number(data.cliente_id), sede_id: data.sede_id ? Number(data.sede_id) : null, tipo: data.tipo, metodo: data.metodo, estado: data.estado, observaciones: data.observaciones || null };
}
