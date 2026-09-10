import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import ViewWeekOutlinedIcon from '@mui/icons-material/ViewWeekOutlined';
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
import { entrenamientoServicio } from '../services/entrenamientoServicio.js';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const estadosPlan = ['BORRADOR', 'ACTIVO', 'PAUSADO', 'FINALIZADO'];
const tiposRm = ['DIRECTO', 'ESTIMADO'];
const tiposCarga = ['LIBRE', 'KG', 'PORCENTAJE_RM', 'RPE'];
const hoy = () => new Date().toISOString().slice(0, 10);
const fecha = (valor) => valor ? String(valor).slice(0, 10) : '';
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');

const configs = {
  ejercicios: {
    titulo: 'Ejercicios',
    singular: 'Ejercicio',
    descripcion: 'Catálogo técnico para rutinas, RM y seguimiento físico.',
    icono: <FitnessCenterOutlinedIcon />,
    obtener: 'obtenerEjercicios',
    crear: 'crearEjercicio',
    actualizar: 'actualizarEjercicio',
    inicial: { id: null, nombre: '', grupo_muscular: '', equipamiento: 'Libre', tipo_entrenamiento: '', instrucciones: '', url_recurso: '', activo: true },
  },
  planes: {
    titulo: 'Planes de entrenamiento',
    singular: 'Plan',
    descripcion: 'Planifica objetivos, vigencias y responsable técnico por cliente.',
    icono: <AssignmentOutlinedIcon />,
    obtener: 'obtenerPlanes',
    crear: 'crearPlan',
    actualizar: 'actualizarPlan',
    inicial: { id: null, cliente_id: '', entrenador_id: '', nombre: '', objetivo: '', fecha_inicio: hoy(), fecha_fin: '', estado: 'BORRADOR', observaciones: '' },
  },
  rutinas: {
    titulo: 'Rutinas',
    singular: 'Rutina',
    descripcion: 'Organiza ejercicios por plan, semana, día, bloque y carga objetivo.',
    icono: <ViewWeekOutlinedIcon />,
    obtener: 'obtenerRutinas',
    crear: 'crearRutina',
    actualizar: 'actualizarRutina',
    inicial: { id: null, plan_id: '', ejercicio_id: '', semana: 1, dia: 'LUNES', bloque: '', series: 1, repeticiones: '', carga_objetivo: '', tipo_carga: 'LIBRE', descanso_segundos: '', orden: 1, notas: '' },
  },
  rm: {
    titulo: 'Registros RM',
    singular: 'Registro RM',
    descripcion: 'Registra marcas directas o estimadas para orientar cargas futuras.',
    icono: <MonitorWeightOutlinedIcon />,
    obtener: 'obtenerRegistrosRm',
    crear: 'crearRegistroRm',
    actualizar: 'actualizarRegistroRm',
    inicial: { id: null, cliente_id: '', ejercicio_id: '', tipo_registro: 'ESTIMADO', peso: '', repeticiones: '', rm_estimado: '', fecha_registro: hoy(), observaciones: '' },
  },
};

export function EntrenamientoCatalogo({ tipo }) {
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
      const response = await entrenamientoServicio[config.obtener](parametros);
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

  useEffect(() => {
    cargar();
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

  const handleNuevo = () => {
    setFormData(config.inicial);
    setVista('formulario');
  };

  const handleEditar = (item) => {
    setFormData({
      ...config.inicial,
      ...item,
      fecha_inicio: fecha(item.fecha_inicio),
      fecha_fin: fecha(item.fecha_fin),
      fecha_registro: fecha(item.fecha_registro),
      entrenador_id: item.entrenador_id || '',
      activo: item.activo !== false,
    });
    setVista('formulario');
  };

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

      if (formData.id) {
        await entrenamientoServicio[config.actualizar](formData.id, payload);
        showNotificacion(`${config.singular} actualizado correctamente`, 'success');
      } else {
        await entrenamientoServicio[config.crear](payload);
        showNotificacion(`${config.singular} creado correctamente`, 'success');
      }

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
        <GestionToolbar
          total={meta.total || items.length}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />
        <TablaEntrenamiento
          items={items}
          columnas={columnas}
          meta={meta}
          cargando={cargando}
          onEditar={handleEditar}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function Formulario({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };

  if (tipo === 'ejercicios') {
    return (
      <Box sx={grid}>
        <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
        <TextField label="Grupo muscular" name="grupo_muscular" value={formData.grupo_muscular || ''} onChange={onChange} required size="small" />
        <TextField label="Equipamiento" name="equipamiento" value={formData.equipamiento || ''} onChange={onChange} required size="small" />
        <TextField label="Tipo entrenamiento" name="tipo_entrenamiento" value={formData.tipo_entrenamiento || ''} onChange={onChange} size="small" />
        <TextField label="URL recurso" name="url_recurso" value={formData.url_recurso || ''} onChange={onChange} size="small" />
        <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
        <TextField label="Instrucciones" name="instrucciones" value={formData.instrucciones || ''} onChange={onChange} size="small" multiline minRows={3} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
      </Box>
    );
  }

  if (tipo === 'planes') {
    return (
      <Box sx={grid}>
        <TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} required size="small">
          {(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre} - {item.codigo_deportista}</MenuItem>)}
        </TextField>
        <TextField select label="Entrenador" name="entrenador_id" value={formData.entrenador_id || ''} onChange={onChange} size="small">
          <MenuItem value="">Sin asignar</MenuItem>
          {(catalogos.entrenadores || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField label="Nombre del plan" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
        <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={formData.fecha_inicio || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Fecha fin" name="fecha_fin" type="date" value={formData.fecha_fin || ''} onChange={onChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label="Estado" name="estado" value={formData.estado || 'BORRADOR'} onChange={onChange} required size="small">
          {estadosPlan.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField label="Objetivo" name="objetivo" value={formData.objetivo || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
        <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
      </Box>
    );
  }

  if (tipo === 'rutinas') {
    return (
      <Box sx={grid}>
        <TextField select label="Plan" name="plan_id" value={formData.plan_id || ''} onChange={onChange} required size="small">
          {(catalogos.planes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField select label="Ejercicio" name="ejercicio_id" value={formData.ejercicio_id || ''} onChange={onChange} required size="small">
          {(catalogos.ejercicios || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField select label="Día" name="dia" value={formData.dia || 'LUNES'} onChange={onChange} required size="small">
          {diasSemana.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField label="Semana" name="semana" type="number" value={formData.semana || 1} onChange={onChange} required size="small" />
        <TextField label="Bloque" name="bloque" value={formData.bloque || ''} onChange={onChange} size="small" />
        <TextField label="Orden" name="orden" type="number" value={formData.orden || 1} onChange={onChange} required size="small" />
        <TextField label="Series" name="series" type="number" value={formData.series || 1} onChange={onChange} required size="small" />
        <TextField label="Repeticiones" name="repeticiones" value={formData.repeticiones || ''} onChange={onChange} size="small" />
        <TextField select label="Tipo carga" name="tipo_carga" value={formData.tipo_carga || 'LIBRE'} onChange={onChange} required size="small">
          {tiposCarga.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField label="Carga objetivo" name="carga_objetivo" type="number" value={formData.carga_objetivo || ''} onChange={onChange} size="small" />
        <TextField label="Descanso segundos" name="descanso_segundos" type="number" value={formData.descanso_segundos || ''} onChange={onChange} size="small" />
        <TextField label="Notas" name="notas" value={formData.notas || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
      </Box>
    );
  }

  return (
    <Box sx={grid}>
      <TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} required size="small">
        {(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre} - {item.codigo_deportista}</MenuItem>)}
      </TextField>
      <TextField select label="Ejercicio" name="ejercicio_id" value={formData.ejercicio_id || ''} onChange={onChange} required size="small">
        {(catalogos.ejercicios || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
      </TextField>
      <TextField select label="Tipo registro" name="tipo_registro" value={formData.tipo_registro || 'ESTIMADO'} onChange={onChange} required size="small">
        {tiposRm.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
      </TextField>
      <TextField label="Peso" name="peso" type="number" value={formData.peso || ''} onChange={onChange} required size="small" />
      <TextField label="Repeticiones" name="repeticiones" type="number" value={formData.repeticiones || ''} onChange={onChange} size="small" />
      <TextField label="RM estimado" name="rm_estimado" type="number" value={formData.rm_estimado || ''} onChange={onChange} required size="small" />
      <TextField label="Fecha registro" name="fecha_registro" type="date" value={formData.fecha_registro || hoy()} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} />
    </Box>
  );
}

function TablaEntrenamiento({ items, columnas, meta, cargando, onEditar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead>
        <TableRow>
          {columnas.map((columna) => columna.header)}
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            {columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}
            <TableCell align="right">
              <Tooltip title="Editar">
                <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}>
                  <EditOutlinedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto="No hay registros para los filtros aplicados." /> : null}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtros[key]} onChange={(v) => onFiltro(key, v)} options={opts}>{label}</FilterHeaderCell>;

  if (tipo === 'ejercicios') {
    return [
      { key: 'nombre', header: filtro('nombre', 'Ejercicio', opciones(meta.opciones_filtro?.nombre)), render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
      { key: 'grupo', header: filtro('grupo', 'Grupo', opciones(meta.opciones_filtro?.grupo)), render: (item) => item.grupo_muscular },
      { key: 'equipamiento', header: filtro('equipamiento', 'Equipamiento', opciones(meta.opciones_filtro?.equipamiento)), render: (item) => item.equipamiento },
      { key: 'tipo', header: <TableCell key="tipo">Tipo</TableCell>, render: (item) => item.tipo_entrenamiento || 'Sin tipo' },
      { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
    ];
  }

  if (tipo === 'planes') {
    return [
      { key: 'nombre', header: <TableCell key="nombre">Plan</TableCell>, render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
      { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2">{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></Box> },
      { key: 'entrenador', header: filtro('entrenador', 'Entrenador', opciones(meta.opciones_filtro?.entrenador)), render: (item) => item.entrenador_nombre || 'Sin asignar' },
      { key: 'vigencia', header: <TableCell key="vigencia">Vigencia</TableCell>, render: (item) => `${fecha(item.fecha_inicio)} - ${fecha(item.fecha_fin) || 'Abierto'}` },
      { key: 'estado', header: filtro('estado', 'Estado', opciones(estadosPlan)), render: (item) => <StatusChip estado={String(item.estado || '').toLowerCase()} /> },
    ];
  }

  if (tipo === 'rutinas') {
    return [
      { key: 'plan', header: filtro('plan', 'Plan', opciones(meta.opciones_filtro?.plan)), render: (item) => <Typography variant="body2" fontWeight="600">{item.plan_nombre}</Typography> },
      { key: 'ejercicio', header: filtro('ejercicio', 'Ejercicio', opciones(meta.opciones_filtro?.ejercicio)), render: (item) => item.ejercicio_nombre },
      { key: 'semana', header: <TableCell key="semana">Semana / Día</TableCell>, render: (item) => `Semana ${item.semana} - ${item.dia}` },
      { key: 'bloque', header: <TableCell key="bloque">Bloque</TableCell>, render: (item) => item.bloque || 'General' },
      { key: 'series', header: <TableCell key="series">Series / reps</TableCell>, render: (item) => `${item.series} x ${item.repeticiones || '-'}` },
      { key: 'carga', header: <TableCell key="carga">Carga</TableCell>, render: (item) => item.carga_objetivo ? `${item.carga_objetivo} ${item.tipo_carga}` : item.tipo_carga },
    ];
  }

  return [
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></Box> },
    { key: 'ejercicio', header: filtro('ejercicio', 'Ejercicio', opciones(meta.opciones_filtro?.ejercicio)), render: (item) => item.ejercicio_nombre },
    { key: 'fecha', header: <TableCell key="fecha">Fecha</TableCell>, render: (item) => fecha(item.fecha_registro) },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(tiposRm)), render: (item) => item.tipo_registro },
    { key: 'marca', header: <TableCell key="marca">Marca / RM</TableCell>, render: (item) => `${item.peso} kg / ${item.rm_estimado} kg` },
  ];
}

function normalizar(tipo, data) {
  if (tipo === 'ejercicios') {
    if (!data.nombre || !data.grupo_muscular || !data.equipamiento) return null;
    return { nombre: data.nombre, grupo_muscular: data.grupo_muscular, equipamiento: data.equipamiento, tipo_entrenamiento: data.tipo_entrenamiento || null, instrucciones: data.instrucciones || null, url_recurso: data.url_recurso || null, activo: Boolean(data.activo) };
  }

  if (tipo === 'planes') {
    if (!data.cliente_id || !data.nombre || !data.fecha_inicio || !data.estado) return null;
    return { cliente_id: Number(data.cliente_id), entrenador_id: data.entrenador_id ? Number(data.entrenador_id) : null, nombre: data.nombre, objetivo: data.objetivo || null, fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin || null, estado: data.estado, observaciones: data.observaciones || null };
  }

  if (tipo === 'rutinas') {
    if (!data.plan_id || !data.ejercicio_id || !data.semana || !data.dia || !data.series || !data.orden) return null;
    return { plan_id: Number(data.plan_id), ejercicio_id: Number(data.ejercicio_id), semana: Number(data.semana), dia: data.dia, bloque: data.bloque || null, series: Number(data.series), repeticiones: data.repeticiones || null, carga_objetivo: data.carga_objetivo ? Number(data.carga_objetivo) : null, tipo_carga: data.tipo_carga || 'LIBRE', descanso_segundos: data.descanso_segundos ? Number(data.descanso_segundos) : null, orden: Number(data.orden), notas: data.notas || null };
  }

  if (!data.cliente_id || !data.ejercicio_id || !data.tipo_registro || !data.peso || !data.rm_estimado || !data.fecha_registro) return null;
  return { cliente_id: Number(data.cliente_id), ejercicio_id: Number(data.ejercicio_id), tipo_registro: data.tipo_registro, peso: Number(data.peso), repeticiones: data.repeticiones ? Number(data.repeticiones) : null, rm_estimado: Number(data.rm_estimado), fecha_registro: data.fecha_registro, observaciones: data.observaciones || null };
}
