import { useState, useEffect } from 'react';

import { Box, Button, IconButton, MenuItem, TextField, Typography, Stack, Paper, Chip, Tooltip, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
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
  estado: 'ACTIVO'
});

export function EntrenadoresPage() {

  const [vista, setVista] = useState('lista');
  const [formData, setFormData] = useState(getInitialForm());
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [entrenadores, setEntrenadores] = useState([]);
  const [usuariosDisp, setUsuariosDisp] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ persona: '', tipo: '', especialidad: '', usuario: '', estado: '' });
  const [cargando, setCargando] = useState(true);

  // Ficha / turnos
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

  useEffect(() => {
    if (vista === 'lista') cargarEntrenadores();
    else if (vista === 'formulario') cargarUsuarios();
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
  const handleEditar = (ent) => { setFormData({ ...ent }); setVista('formulario'); };
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
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Turnos de ${nombreEntrenador}`}
          descripcion="Horarios ya configurados en Servicios y Agenda que este entrenador tiene asignados. Los clientes se asignan a estos horarios desde la ficha del cliente."
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

          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={formStyles.modalSeccionTitulo}>Añadir turno · seleccionar horario configurado</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr auto' }, gap: 1.5, alignItems: 'flex-start', mt: 1 }}>
              <TextField
                select
                label="Horario"
                value={horarioSeleccionado}
                onChange={(e) => setHorarioSeleccionado(e.target.value)}
                size="small"
                disabled={horariosDisponibles.length === 0}
                helperText={horariosDisponibles.length === 0
                  ? 'No hay horarios disponibles para asignar. Configúralos primero en Servicios y Agenda > Horarios.'
                  : 'Los días y horas se configuran en Servicios y Agenda > Horarios; aquí solo seleccionas cuál cubre este entrenador.'}
              >
                {horariosDisponibles.map((horario) => (
                  <MenuItem key={horario.id} value={horario.id}>
                    {horario.nombre ? `${horario.nombre} · ` : ''}{horario.servicio_nombre} · {horario.dia_semana || 'Sin días'} {String(horario.hora_inicio || '').slice(0, 5)}-{String(horario.hora_fin || '').slice(0, 5)} · {horario.sede_nombre}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleAsignarHorario}
                disabled={horariosDisponibles.length === 0}
                sx={{ ...dbanuStyles.addButtonRevive, height: 40 }}
              >
                Asignar
              </Button>
            </Box>
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
                <TableCell>Días</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Cupo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turnos.map((turno) => (
                <TableRow key={turno.id} hover>
                  <TableCell><Typography variant="body2" fontWeight="600">{turno.nombre || 'Sin nombre'}</Typography></TableCell>
                  <TableCell>{turno.servicio_nombre}</TableCell>
                  <TableCell>{turno.dia_semana || 'Sin días'}</TableCell>
                  <TableCell>{String(turno.hora_inicio || '').slice(0, 5)} - {String(turno.hora_fin || '').slice(0, 5)}</TableCell>
                  <TableCell>{turno.sede_nombre || 'Sin sede'}</TableCell>
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
                <TablaEstadoFila colSpan={8} cargando={cargandoTurnos} texto="Este entrenador todavía no tiene turnos configurados." />
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
          onVerHorarios={handleVerHorarios}
          onPageChange={(p) => { const n = { ...filtros, page: p }; setFiltros(n); cargarEntrenadores(n); }}
          onRowsPerPageChange={(pp) => { const n = { ...filtros, page: 1, per_page: pp }; setFiltros(n); cargarEntrenadores(n); }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
