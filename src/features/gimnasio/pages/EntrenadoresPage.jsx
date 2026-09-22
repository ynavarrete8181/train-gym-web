import { useState, useEffect } from 'react';

import { Autocomplete, Box, Button, IconButton, MenuItem, TextField, Typography, Stack, Paper, Chip, Tooltip, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import SportsIcon from '@mui/icons-material/Sports';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { EntrenadoresTable } from '../components/EntrenadoresTable.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const getInitialForm = () => ({
  id: null,
  usuario_id: '',
  especialidad: '',
  tipo: 'COACH',
  estado: 'ACTIVO',
  servicio_ids: []
});

const abreviarDias = (dias = '') => String(dias)
  .split(',')
  .map((dia) => dia.trim().slice(0, 3))
  .filter(Boolean)
  .join(', ');

const horaCorta = (valor) => String(valor || '').slice(0, 5);

export function EntrenadoresPage() {

  const [vista, setVista] = useState('lista');
  const [formData, setFormData] = useState(getInitialForm());
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [entrenadores, setEntrenadores] = useState([]);
  const [usuariosDisp, setUsuariosDisp] = useState([]);
  const [serviciosDisp, setServiciosDisp] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ persona: '', tipo: '', especialidad: '', usuario: '', estado: '' });
  const [cargando, setCargando] = useState(true);

  const [entrenadorFicha, setEntrenadorFicha] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('');

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargarEntrenadores = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerEntrenadores(parametros);
      setEntrenadores(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      showNotificacion('Error al cargar entrenadores', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await gimnasioServicio.obtenerUsuarios({ per_page: 100 });
      setUsuariosDisp(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar usuarios disponibles', 'error');
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await gimnasioServicio.obtenerServiciosEntrenadorCatalogo();
      setServiciosDisp(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar servicios disponibles', 'error');
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargarEntrenadores();
    else if (vista === 'formulario') {
      cargarUsuarios();
      cargarServicios();
    }
  }, [vista]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarEntrenadores(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargarEntrenadores(nuevosFiltros);
  };

  const cargarTurnos = async (entrenadorId) => {
    setCargandoTurnos(true);
    try {
      const response = await gimnasioServicio.obtenerTurnosEntrenador(entrenadorId);
      setTurnos(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar los turnos', 'error');
    } finally {
      setCargandoTurnos(false);
    }
  };

  const cargarHorariosDisponibles = async (entrenadorId) => {
    try {
      const response = await gimnasioServicio.obtenerHorariosDisponiblesEntrenador(entrenadorId);
      setHorariosDisponibles(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar los horarios disponibles', 'error');
    }
  };

  const handleVerHorarios = (entrenador) => {
    setEntrenadorFicha(entrenador);
    setHorarioSeleccionado('');
    setVista('ficha');
    cargarTurnos(entrenador.id);
    cargarHorariosDisponibles(entrenador.id);
  };

  const handleNuevo = () => { setFormData(getInitialForm()); setVista('formulario'); };
  const handleEditar = (ent) => {
    setFormData({
      ...ent,
      servicio_ids: (ent.servicio_ids || []).map((id) => Number(id)),
    });
    setVista('formulario');
  };
  const handleCancelar = () => { setVista('lista'); };
  const handleCancelarFicha = () => { setEntrenadorFicha(null); setVista('lista'); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    try {
      if (!formData.usuario_id) { showNotificacion('Seleccione un usuario', 'warning'); return; }
      if (formData.id) await gimnasioServicio.actualizarEntrenador(formData.id, formData);
      else await gimnasioServicio.crearEntrenador(formData);

      showNotificacion(formData.id ? 'Entrenador actualizado' : 'Entrenador creado', 'success');
      setVista('lista');
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al guardar', 'error');
    }
  };

  const handleAsignarHorario = async () => {
    if (!horarioSeleccionado) {
      showNotificacion('Selecciona un horario configurado para asignar', 'warning');
      return;
    }
    try {
      await gimnasioServicio.asignarHorarioEntrenador(entrenadorFicha.id, Number(horarioSeleccionado));
      showNotificacion('Horario asignado correctamente', 'success');
      setHorarioSeleccionado('');
      cargarTurnos(entrenadorFicha.id);
      cargarHorariosDisponibles(entrenadorFicha.id);
    } catch (error) {
      const mensaje = error.response?.data?.errores
        ? Object.values(error.response.data.errores).flat().join(' ')
        : (error.response?.data?.mensaje || 'Error al asignar el horario');
      showNotificacion(mensaje, 'error');
    }
  };

  const handleEliminarTurno = async (turno) => {
    try {
      await gimnasioServicio.eliminarTurnoEntrenador(entrenadorFicha.id, turno.id);
      showNotificacion('Horario retirado del entrenador', 'success');
      cargarTurnos(entrenadorFicha.id);
      cargarHorariosDisponibles(entrenadorFicha.id);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al retirar el horario', 'error');
    }
  };

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={formData.id ? "Editar Entrenador" : "Nuevo Entrenador"}
          descripcion="Gestiona el perfil del entrenador en el gimnasio"
          icono={<SportsIcon />}
          acciones={<BotonVolver onClick={handleCancelar} />}
        />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Stack spacing={2}>
              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>
                  Información del entrenador
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <TextField
                    select
                    fullWidth
                    label="Usuario"
                    name="usuario_id"
                    value={formData.usuario_id || ''}
                    onChange={handleChange}
                    required
                    size="small"
                    disabled={!!formData.id}
                  >
                    {usuariosDisp.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.name || `${u.nombres || ''} ${u.apellidos || ''}`.trim()} - {u.email}</MenuItem>
                    ))}
                    {formData.id && !usuariosDisp.find(u => u.id === formData.usuario_id) && (
                       <MenuItem value={formData.usuario_id}>{formData.nombres} {formData.apellidos}</MenuItem>
                    )}
                  </TextField>
                  <TextField
                    label="Especialidad"
                    name="especialidad"
                    value={formData.especialidad || ''}
                    onChange={handleChange}
                    size="small"
                    helperText="Ej: Crossfit, Funcional, Pesas"
                  />
                  <TextField
                    select
                    label="Tipo"
                    name="tipo"
                    value={formData.tipo || 'COACH'}
                    onChange={handleChange}
                    size="small"
                  >
                    <MenuItem value="COACH">Coach / Entrenador</MenuItem>
                    <MenuItem value="MASTER">Master Coach</MenuItem>
                    <MenuItem value="ASISTENTE">Asistente</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Estado"
                    name="estado"
                    value={formData.estado || 'ACTIVO'}
                    onChange={handleChange}
                    size="small"
                  >
                    <MenuItem value="ACTIVO">Activo</MenuItem>
                    <MenuItem value="INACTIVO">Inactivo</MenuItem>
                  </TextField>
                  <Autocomplete
                    multiple
                    options={serviciosDisp}
                    value={serviciosDisp.filter((s) =>
                      (formData.servicio_ids || []).some((id) => String(id) === String(s.id))
                    )}
                    onChange={(_, values) => setFormData((prev) => ({
                      ...prev,
                      servicio_ids: values.map((s) => Number(s.id)),
                    }))}
                    getOptionLabel={(s) => s.nombre || ''}
                    isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Servicios habilitados"
                        size="small"
                        helperText="Servicios que este entrenador puede atender en Agenda."
                      />
                    )}
                    sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelar} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  if (vista === 'ficha' && entrenadorFicha) {
    const nombreEntrenador = `${entrenadorFicha.nombres || ''} ${entrenadorFicha.apellidos || ''}`.trim() || entrenadorFicha.name;
    const horarioDetalle = horariosDisponibles.find((item) => String(item.id) === String(horarioSeleccionado));

    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Turnos de ${nombreEntrenador}`}
          descripcion="Asigna bloques configurados en Servicios y Agenda. El sistema valida automáticamente cruces de día y hora entre sedes."
          icono={<ScheduleIcon />}
          acciones={<BotonVolver onClick={handleCancelarFicha} />}
        />
        <Paper className="page-content-container" elevation={0} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
            <Chip
              variant="outlined"
              label={`${turnos.length} ${turnos.length === 1 ? 'HORARIO ASIGNADO' : 'HORARIOS ASIGNADOS'}`}
              sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          </Stack>

          <Box sx={{ border: '1px solid #dbe5f0', borderRadius: 2, p: 2, mb: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={formStyles.modalSeccionTitulo}>Asignar horario al entrenador</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.5 }}>
              Selecciona un bloque previamente creado en Servicios y Agenda → Horarios. Cada bloque pertenece a una sola sede.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' }, gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                select
                fullWidth
                label="Horario disponible"
                value={horarioSeleccionado}
                onChange={(e) => setHorarioSeleccionado(e.target.value)}
                size="small"
                disabled={horariosDisponibles.length === 0}
                helperText={horariosDisponibles.length === 0
                  ? 'No hay horarios disponibles. Configúralos primero en Servicios y Agenda → Horarios.'
                  : 'Al asignar, el sistema impedirá cualquier cruce con los horarios activos del entrenador.'}
              >
                {horariosDisponibles.map((horario) => (
                  <MenuItem key={horario.id} value={horario.id} sx={{ py: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>
                        {horario.nombre || 'Horario sin nombre'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {horario.servicio_nombre} · {horario.sede_nombre || 'Sin sede'} · {abreviarDias(horario.dia_semana || 'Sin días')} · {horaCorta(horario.hora_inicio)}-{horaCorta(horario.hora_fin)} · Cupo {horario.capacidad || 0}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleAsignarHorario}
                disabled={!horarioSeleccionado || horariosDisponibles.length === 0}
                sx={{ ...dbanuStyles.addButtonRevive, height: 40, minWidth: 115 }}
              >
                Asignar
              </Button>
            </Box>

            {horarioDetalle ? (
              <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#fff' }}>
                <Typography variant="body2" fontWeight={900} sx={{ mb: 1 }}>
                  {horarioDetalle.nombre || 'Horario seleccionado'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
                  <ResumenHorario icono={<LocationOnOutlinedIcon />} etiqueta="Sede" valor={horarioDetalle.sede_nombre || 'Sin sede'} />
                  <ResumenHorario icono={<EventAvailableOutlinedIcon />} etiqueta="Días" valor={abreviarDias(horarioDetalle.dia_semana || 'Sin días')} />
                  <ResumenHorario icono={<AccessTimeOutlinedIcon />} etiqueta="Horario" valor={`${horaCorta(horarioDetalle.hora_inicio)} - ${horaCorta(horarioDetalle.hora_fin)}`} />
                  <ResumenHorario icono={<GroupsOutlinedIcon />} etiqueta="Cupo" valor={horarioDetalle.capacidad || 0} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Servicio: {horarioDetalle.servicio_nombre}
                </Typography>
              </Box>
            ) : null}
          </Box>

          <TablaGestion
            total={turnos.length}
            filtrados={turnos.length}
            textoResumen={`${turnos.length} ${turnos.length === 1 ? 'horario asignado' : 'horarios asignados'}`}
            cargando={cargandoTurnos}
          >
            <TableHead>
              <TableRow>
                <TableCell>Horario</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Días</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Cupo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turnos.map((turno) => (
                <TableRow key={turno.id} hover>
                  <TableCell><Typography variant="body2" fontWeight="700">{turno.nombre || 'Sin nombre'}</Typography></TableCell>
                  <TableCell>{turno.servicio_nombre}</TableCell>
                  <TableCell>{turno.sede_nombre || 'Sin sede'}</TableCell>
                  <TableCell>{abreviarDias(turno.dia_semana || 'Sin días')}</TableCell>
                  <TableCell>{horaCorta(turno.hora_inicio)} - {horaCorta(turno.hora_fin)}</TableCell>
                  <TableCell>{turno.capacidad}</TableCell>
                  <TableCell><StatusChip estado={turno.activo ? 'activo' : 'cerrado'} /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Retirar horario">
                      <IconButton sx={dbanuStyles.actionDelete} size="small" onClick={() => handleEliminarTurno(turno)}>
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {turnos.length === 0 ? (
                <TablaEstadoFila colSpan={8} cargando={cargandoTurnos} texto="Este entrenador todavía no tiene horarios asignados." />
              ) : null}
            </TableBody>
          </TablaGestion>
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Equipo / Entrenadores"
        descripcion="Administración de los entrenadores del gimnasio"
        icono={<SportsIcon />}
      />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || entrenadores.length}
          busqueda={filtros.busqueda}
          onBusqueda={(v) => buscar({ ...filtros, busqueda: v })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />
        <EntrenadoresTable
          entrenadores={entrenadores}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onEditar={handleEditar}
          onPageChange={(p) => { const n = { ...filtros, page: p }; setFiltros(n); cargarEntrenadores(n); }}
          onRowsPerPageChange={(pp) => { const n = { ...filtros, page: 1, per_page: pp }; setFiltros(n); cargarEntrenadores(n); }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}

function ResumenHorario({ icono, etiqueta, valor }) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center">
      <Box sx={{ display: 'flex', color: '#004985', '& svg': { fontSize: 18 } }}>{icono}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
          {etiqueta}
        </Typography>
        <Typography variant="body2" fontWeight={700} noWrap>
          {valor}
        </Typography>
      </Box>
    </Stack>
  );
}
