import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, Checkbox, FormControlLabel, IconButton, ListItemText, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const estadosReserva = ['RESERVADA', 'ASISTIO', 'CANCELADA', 'NO_ASISTIO'];

const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const hora = (valor) => valor ? String(valor).slice(0, 5) : '';
const fecha = (valor) => valor ? String(valor).slice(0, 10) : '';
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');

const configuraciones = {
  categorias: {
    titulo: 'Categorías de Servicio',
    tituloFormulario: 'Categoría',
    descripcion: 'Configura los grupos operativos de servicios del gimnasio.',
    icono: <CategoryOutlinedIcon />,
    obtener: 'obtenerCategoriasServicio',
    crear: 'crearCategoriaServicio',
    actualizar: 'actualizarCategoriaServicio',
    formInicial: { id: null, nombre: '', descripcion: '', activo: true },
  },
  servicios: {
    titulo: 'Servicios',
    tituloFormulario: 'Servicio',
    descripcion: 'Define servicios, duración, cupos y reserva requerida.',
    icono: <FitnessCenterOutlinedIcon />,
    obtener: 'obtenerServicios',
    crear: 'crearServicio',
    actualizar: 'actualizarServicio',
    formInicial: { id: null, categoria_id: '', nombre: '', descripcion: '', duracion_minutos: 60, capacidad_base: 1, requiere_reserva: true, activo: true },
  },
  horarios: {
    titulo: 'Horarios',
    tituloFormulario: 'Horario',
    descripcion: 'Configura disponibilidad por servicio, sede, día, hora y cupo.',
    icono: <ScheduleOutlinedIcon />,
    obtener: 'obtenerHorarios',
    crear: 'crearHorario',
    actualizar: 'actualizarHorario',
    formInicial: { id: null, nombre: '', servicio_id: '', sede_ids: [], dias_semana: ['LUNES'], hora_inicio: '', hora_fin: '', capacidad: 1, activo: true },
  },
  reservas: {
    titulo: 'Reservas del Día',
    tituloFormulario: 'Reserva',
    descripcion: 'Controla reservas diarias, asistencia y cancelaciones.',
    icono: <EventAvailableOutlinedIcon />,
    obtener: 'obtenerReservasDia',
    crear: 'crearReservaDia',
    actualizar: 'actualizarReservaDia',
    formInicial: { id: null, cliente_id: '', servicio_id: '', horario_id: '', sede_id: '', fecha: fecha(new Date().toISOString()), hora_inicio: '', hora_fin: '', estado: 'RESERVADA', observaciones: '' },
  },
};

export function ServicioAgendaCatalogo({ tipo }) {
  const config = configuraciones[tipo];
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({ categorias: [], servicios: [], horarios: [], sedes: [], clientes: [] });
  const [formData, setFormData] = useState(config.formInicial);
  const filtrosIniciales = () => ({ busqueda: '', page: 1, per_page: 5 });
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detalleHorario, setDetalleHorario] = useState(null);

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      if (response.meta?.catalogos) {
        setCatalogos((actual) => ({ ...actual, ...response.meta.catalogos }));
      }
    } catch (error) {
      showNotificacion(`Error al cargar ${config.titulo.toLowerCase()}`, 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogosFormulario = async () => {
    const pendientes = [];
    if (tipo === 'servicios') pendientes.push(gimnasioServicio.obtenerCategoriasServicio({ per_page: 100 }));
    if (['horarios', 'reservas'].includes(tipo)) pendientes.push(gimnasioServicio.obtenerServicios({ per_page: 100 }));
    if (['horarios', 'reservas'].includes(tipo)) pendientes.push(gimnasioServicio.obtenerEstructuraOperativa());
    if (tipo === 'reservas') pendientes.push(gimnasioServicio.obtenerDeportistas({ per_page: 100 }));
    if (tipo === 'reservas') pendientes.push(gimnasioServicio.obtenerHorarios({ per_page: 100, detalle: true }));

    if (!pendientes.length) return;

    try {
      const respuestas = await Promise.all(pendientes);
      let indice = 0;
      const nuevos = {};
      if (tipo === 'servicios') {
        nuevos.categorias = respuestas[indice++]?.datos || [];
      }
      if (['horarios', 'reservas'].includes(tipo)) nuevos.servicios = respuestas[indice++]?.datos || [];
      if (['horarios', 'reservas'].includes(tipo)) {
        const estructura = respuestas[indice++]?.datos || respuestas[indice - 1] || {};
        nuevos.sedes = estructura.sedes || [];
      }
      if (tipo === 'reservas') nuevos.clientes = respuestas[indice++]?.datos || [];
      if (tipo === 'reservas') nuevos.horarios = respuestas[indice++]?.datos || [];
      setCatalogos((actual) => ({ ...actual, ...nuevos }));
    } catch (error) {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
    }
  };

  useEffect(() => {
    setVista('lista');
    setFormData(config.formInicial);
    setFiltros(filtrosIniciales());
    setFiltrosColumna({});
  }, [tipo]);

  useEffect(() => {
    if (vista === 'lista') cargar();
    else cargarCatalogosFormulario();
  }, [vista, tipo]);

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
    setFormData({ ...config.formInicial });
    setVista('formulario');
  };

  const handleEditar = (item) => {
    setFormData({
      ...config.formInicial,
      ...item,
      sede_ids: item.sede_ids?.length ? item.sede_ids : (item.sede_id ? [item.sede_id] : []),
      dias_semana: item.dias_semana?.length ? item.dias_semana : (item.dia_semana ? [item.dia_semana] : []),
      fecha: fecha(item.fecha),
      hora_inicio: hora(item.hora_inicio),
      hora_fin: hora(item.hora_fin),
      activo: item.activo !== false,
      requiere_reserva: item.requiere_reserva !== false,
      horario_id: item.horario_id || '',
      sede_id: item.sede_id || '',
    });
    setVista('formulario');
  };

  const handleChange = (evento) => {
    const { name, value, checked, type: inputType } = evento.target;
    setFormData((actual) => ({ ...actual, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async () => {
    try {
      const payload = normalizarPayload(tipo, formData);
      if (!payload) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }

      if (formData.id) {
        await gimnasioServicio[config.actualizar](formData.id, payload);
        showNotificacion(`${config.tituloFormulario} actualizado correctamente`, 'success');
      } else {
        await gimnasioServicio[config.crear](payload);
        showNotificacion(`${config.tituloFormulario} creado correctamente`, 'success');
      }

      setVista('lista');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || `Error al guardar ${config.tituloFormulario.toLowerCase()}`, 'error');
    }
  };

  const handleVerDetalle = async (item) => {
    try {
      const response = await gimnasioServicio.obtenerDetalleHorario(item.id);
      setDetalleHorario(response.datos || null);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo cargar el detalle del horario', 'error');
    }
  };

  const handleDesactivar = async (item) => {
    const confirmado = await confirmarAccion({
      titulo: 'Desactivar horario',
      texto: `¿Deseas desactivar el horario "${item.nombre || item.servicio_nombre}"? Sus combinaciones dejarán de estar disponibles para nuevas reservas.`,
      textoConfirmar: 'Sí, desactivar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await gimnasioServicio.desactivarHorario(item.id);
      showNotificacion('Horario desactivado correctamente', 'success');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo desactivar el horario', 'error');
    }
  };

  const handleEliminar = async (item) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar horario',
      texto: `¿Deseas eliminar el horario "${item.nombre || item.servicio_nombre}"? Si ya tiene reservas, se ocultará sin romper el histórico.`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await gimnasioServicio.eliminarHorario(item.id);
      showNotificacion('Horario eliminado correctamente', 'success');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo eliminar el horario', 'error');
    }
  };

  const columnas = useMemo(() => construirColumnas(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  if (detalleHorario) {
    return (
      <DetalleHorarioVista
        detalle={detalleHorario}
        onVolver={() => setDetalleHorario(null)}
      />
    );
  }

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`${formData.id ? 'Editar' : 'Nuevo'} ${config.tituloFormulario}`}
          descripcion={config.descripcion}
          icono={config.icono}
          acciones={<BotonVolver onClick={() => setVista('lista')} />}
        />
        <Paper className="page-content-container" elevation={0} sx={{ mt: 2 }}>
          <Box sx={formStyles.seccion}>
            <Typography sx={formStyles.modalSeccionTitulo}>Datos de {config.tituloFormulario.toLowerCase()}</Typography>
            <FormularioCampos tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} />
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
        <PageHeader
          titulo={config.titulo}
          descripcion={config.descripcion}
          icono={config.icono}
        />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || items.length}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />
        <TablaServicioAgenda
          tipo={tipo}
          items={items}
          columnas={columnas}
          meta={meta}
          cargando={cargando}
          onEditar={handleEditar}
          onVerDetalle={tipo === 'horarios' ? handleVerDetalle : null}
          onDesactivar={tipo === 'horarios' ? handleDesactivar : null}
          onEliminar={tipo === 'horarios' ? handleEliminar : null}
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

function FormularioCampos({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };
  const cambiarDias = (dia) => {
    const actuales = formData.dias_semana || [];
    const siguientes = actuales.includes(dia)
      ? actuales.filter((item) => item !== dia)
      : [...actuales, dia];
    onChange({ target: { name: 'dias_semana', value: siguientes } });
  };

  if (tipo === 'categorias') {
    return (
      <Box sx={grid}>
        <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
        <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} />
        <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
      </Box>
    );
  }

  if (tipo === 'servicios') {
    return (
      <Box sx={grid}>
        <TextField select label="Categoría" name="categoria_id" value={formData.categoria_id || ''} onChange={onChange} required size="small">
          {catalogos.categorias.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField label="Servicio" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
        <TextField label="Duración minutos" name="duracion_minutos" type="number" value={formData.duracion_minutos || 60} onChange={onChange} required size="small" />
        <TextField label="Capacidad base" name="capacidad_base" type="number" value={formData.capacidad_base || 1} onChange={onChange} required size="small" />
        <FormControlLabel control={<Switch name="requiere_reserva" checked={Boolean(formData.requiere_reserva)} onChange={onChange} />} label="Requiere reserva" />
        <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
        <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
      </Box>
    );
  }

  if (tipo === 'horarios') {
    return (
      <Box sx={grid}>
        <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} size="small" helperText="Opcional: Mañana, tarde, bloque 8-9" />
        <TextField select label="Servicio" name="servicio_id" value={formData.servicio_id || ''} onChange={onChange} required size="small">
          {catalogos.servicios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField select label="Sedes" name="sede_ids" value={formData.sede_ids || []} onChange={onChange} required size="small" SelectProps={{ multiple: true, renderValue: (seleccionados) => seleccionados.map((id) => catalogos.sedes.find((sede) => String(sede.id_sede || sede.id) === String(id))?.nombre).filter(Boolean).join(', ') }}>
          {catalogos.sedes.map((item) => {
            const id = item.id_sede || item.id;
            return (
              <MenuItem key={id} value={id}>
                <Checkbox checked={(formData.sede_ids || []).map(String).includes(String(id))} size="small" />
                <ListItemText primary={item.sede || item.nombre} />
              </MenuItem>
            );
          })}
        </TextField>
        <TextField label="Hora inicio" name="hora_inicio" type="time" value={formData.hora_inicio || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Hora fin" name="hora_fin" type="time" value={formData.hora_fin || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Capacidad" name="capacidad" type="number" value={formData.capacidad || 1} onChange={onChange} required size="small" />
        <Box sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#64748b', mb: 0.5 }}>Días *</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {diasSemana.map((dia) => {
              const activo = (formData.dias_semana || []).includes(dia);
              return (
                <Button
                  key={dia}
                  variant={activo ? 'contained' : 'outlined'}
                  onClick={() => cambiarDias(dia)}
                  sx={{
                    minWidth: 46,
                    height: 30,
                    px: 1.25,
                    borderRadius: 1,
                    fontSize: 10.5,
                    fontWeight: 850,
                    textTransform: 'none',
                    bgcolor: activo ? '#004985' : '#fff',
                    borderColor: activo ? '#004985' : '#dbe5f0',
                    color: activo ? '#fff' : '#243447',
                    '&:hover': {
                      bgcolor: activo ? '#003a6a' : 'rgba(0, 73, 133, 0.06)',
                      borderColor: '#004985',
                    },
                  }}
                >
                  {dia.slice(0, 3)}
                </Button>
              );
            })}
          </Box>
        </Box>
        <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
      </Box>
    );
  }

  return (
    <Box sx={grid}>
      <TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} required size="small">
        {catalogos.clientes.map((item) => <MenuItem key={item.id} value={item.id}>{item.usuario_nombre || item.name || 'Cliente'} - {item.codigo_deportista}</MenuItem>)}
      </TextField>
      <TextField select label="Servicio" name="servicio_id" value={formData.servicio_id || ''} onChange={onChange} required size="small">
        {catalogos.servicios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
      </TextField>
      <TextField select label="Horario" name="horario_id" value={formData.horario_id || ''} onChange={onChange} size="small">
        <MenuItem value="">Sin horario fijo</MenuItem>
        {catalogos.horarios.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre ? `${item.nombre} · ` : ''}{item.dia_semana} {hora(item.hora_inicio)} - {hora(item.hora_fin)}</MenuItem>)}
      </TextField>
      <TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} size="small">
        <MenuItem value="">Sin sede</MenuItem>
        {catalogos.sedes.map((item) => <MenuItem key={item.id_sede || item.id} value={item.id_sede || item.id}>{item.sede || item.nombre}</MenuItem>)}
      </TextField>
      <TextField label="Fecha" name="fecha" type="date" value={formData.fecha || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select label="Estado" name="estado" value={formData.estado || 'RESERVADA'} onChange={onChange} required size="small">
        {estadosReserva.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
      </TextField>
      <TextField label="Hora inicio" name="hora_inicio" type="time" value={formData.hora_inicio || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Hora fin" name="hora_fin" type="time" value={formData.hora_fin || ''} onChange={onChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
    </Box>
  );
}

function TablaServicioAgenda({ tipo, items, columnas, meta, cargando, onEditar, onVerDetalle, onDesactivar, onEliminar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion
      total={meta.total || 0}
      filtrados={meta.total || 0}
      page={meta.pagina_actual || 1}
      rowsPerPage={meta.por_pagina || 5}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      cargando={cargando}
    >
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
              <Stack direction="row" spacing={0.4} justifyContent="flex-end">
                {onVerDetalle ? (
                  <Tooltip title="Ver detalle">
                    <IconButton sx={dbanuStyles.actionView} onClick={() => onVerDetalle(item)}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="Editar">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                {onDesactivar ? (
                  <Tooltip title="Desactivar">
                    <IconButton sx={dbanuStyles.actionState} onClick={() => onDesactivar(item)}>
                      <BlockOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {onEliminar ? (
                  <Tooltip title="Eliminar">
                    <IconButton sx={dbanuStyles.actionDelete} onClick={() => onEliminar(item)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 ? (
          <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto={`No hay registros para ${configuraciones[tipo].titulo.toLowerCase()}.`} />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}

function DetalleHorarioVista({ detalle, onVolver }) {
  const bloque = detalle?.bloque || {};
  const detalles = detalle?.detalles || [];

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo={bloque.nombre || 'Detalle de horario'}
        descripcion={`${bloque.servicio_nombre || 'Servicio'} · ${detalles.length} combinaciones`}
        icono={<VisibilityOutlinedIcon />}
        acciones={<BotonVolver texto="Volver a horarios" onClick={onVolver} />}
      />
      <Paper className="page-content-container" elevation={0}>
        <TablaGestion
          total={detalles.length}
          filtrados={detalles.length}
          textoResumen={`${detalles.length} combinaciones consultadas`}
        >
          <TableHead>
            <TableRow>
              <TableCell>Sede</TableCell>
              <TableCell>Día</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Cupo</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detalles.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.sede_nombre}</TableCell>
                <TableCell>{item.dia_semana}</TableCell>
                <TableCell>{hora(item.hora_inicio)} - {hora(item.hora_fin)}</TableCell>
                <TableCell>{item.capacidad}</TableCell>
              <TableCell><StatusChip estado={estadoBool(item.activo)} /></TableCell>
            </TableRow>
          ))}
          {!detalles.length ? (
            <TablaEstadoFila colSpan={5} texto="No hay combinaciones para este horario." />
          ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}

function construirColumnas(tipo, meta, filtrosColumna, onFiltroColumna) {
  const filtro = (key, label, opts) => (
    <FilterHeaderCell key={key} value={filtrosColumna[key]} onChange={(v) => onFiltroColumna(key, v)} options={opts}>{label}</FilterHeaderCell>
  );

  if (tipo === 'categorias') {
    return [
      { key: 'nombre', header: filtro('nombre', 'Nombre', opciones(meta.opciones_filtro?.nombre)), render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
      { key: 'descripcion', header: <TableCell key="descripcion">Descripción</TableCell>, render: (item) => <Typography variant="body2" color="text.secondary">{item.descripcion || 'Sin descripción'}</Typography> },
      { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
    ];
  }

  if (tipo === 'servicios') {
    return [
      { key: 'nombre', header: filtro('nombre', 'Servicio', opciones(meta.opciones_filtro?.servicio)), render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
      { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria_nombre || 'Sin categoría' },
      { key: 'duracion', header: <TableCell key="duracion">Duración / cupo</TableCell>, render: (item) => `${item.duracion_minutos} min / ${item.capacidad_base}` },
      { key: 'reserva', header: <TableCell key="reserva">Reserva</TableCell>, render: (item) => item.requiere_reserva ? 'Requerida' : 'Opcional' },
      { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
    ];
  }

  if (tipo === 'horarios') {
    return [
      { key: 'nombre', header: <TableCell key="nombre">Nombre</TableCell>, render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre || 'Sin nombre'}</Typography> },
      { key: 'servicio', header: filtro('servicio', 'Servicio', opciones(meta.opciones_filtro?.servicio)), render: (item) => <Typography variant="body2" fontWeight="600">{item.servicio_nombre}</Typography> },
      { key: 'sede', header: filtro('sede', 'Sedes', opciones(meta.opciones_filtro?.sede)), render: (item) => item.sede_nombre || 'Sin sede' },
      { key: 'dia', header: filtro('dia', 'Días', opciones(diasSemana)), render: (item) => item.dia_semana || 'Sin días' },
      { key: 'horario', header: <TableCell key="horario">Horario</TableCell>, render: (item) => `${hora(item.hora_inicio)} - ${hora(item.hora_fin)}` },
      { key: 'capacidad', header: <TableCell key="capacidad">Cupo / detalles</TableCell>, render: (item) => `${item.capacidad || 0} / ${item.total_detalles || 0}` },
      { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
    ];
  }

  return [
    { key: 'fecha', header: <TableCell key="fecha">Fecha</TableCell>, render: (item) => fecha(item.fecha) },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></Box> },
    { key: 'servicio', header: filtro('servicio', 'Servicio', opciones(meta.opciones_filtro?.servicio)), render: (item) => item.servicio_nombre },
    { key: 'horario', header: <TableCell key="horario">Horario</TableCell>, render: (item) => `${hora(item.hora_inicio)} - ${hora(item.hora_fin)}` },
    { key: 'sede', header: filtro('sede', 'Sede', opciones(meta.opciones_filtro?.sede)), render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'estado', header: filtro('estado', 'Estado', opciones(estadosReserva)), render: (item) => <StatusChip estado={String(item.estado || '').toLowerCase()} /> },
  ];
}

function normalizarPayload(tipo, data) {
  if (tipo === 'categorias') {
    if (!data.nombre) return null;
    return { nombre: data.nombre, descripcion: data.descripcion || null, activo: Boolean(data.activo) };
  }

  if (tipo === 'servicios') {
    if (!data.categoria_id || !data.nombre || !data.duracion_minutos || !data.capacidad_base) return null;
    return {
      categoria_id: Number(data.categoria_id),
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      duracion_minutos: Number(data.duracion_minutos),
      capacidad_base: Number(data.capacidad_base),
      requiere_reserva: Boolean(data.requiere_reserva),
      activo: Boolean(data.activo),
    };
  }

  if (tipo === 'horarios') {
    if (!data.servicio_id || !(data.sede_ids || []).length || !(data.dias_semana || []).length || !data.hora_inicio || !data.hora_fin || !data.capacidad) return null;
    return {
      nombre: data.nombre || null,
      servicio_id: Number(data.servicio_id),
      sede_ids: data.sede_ids.map(Number),
      dias_semana: data.dias_semana,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      capacidad: Number(data.capacidad),
      activo: Boolean(data.activo),
    };
  }

  if (!data.cliente_id || !data.servicio_id || !data.fecha || !data.hora_inicio || !data.hora_fin || !data.estado) return null;
  return {
    cliente_id: Number(data.cliente_id),
    servicio_id: Number(data.servicio_id),
    horario_id: data.horario_id ? Number(data.horario_id) : null,
    sede_id: data.sede_id ? Number(data.sede_id) : null,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
    estado: data.estado,
    observaciones: data.observaciones || null,
  };
}
