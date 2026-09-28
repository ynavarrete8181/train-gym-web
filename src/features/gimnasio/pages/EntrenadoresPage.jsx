import { useState, useEffect } from 'react';

import { Autocomplete, Box, Button, MenuItem, TextField, Typography, Stack, Paper } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import SportsIcon from '@mui/icons-material/Sports';
import { EntrenadoresTable } from '../components/EntrenadoresTable.jsx';
import { EntrenadorConfiguracion } from '../components/EntrenadorConfiguracion.jsx';
import { HorarioEntrenadorPersonalizado } from '../components/HorarioEntrenadorPersonalizado.jsx';
import { DisponibilidadAgendaPage } from './DisponibilidadAgendaPage.jsx';
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
  const [configuracionEntrenador, setConfiguracionEntrenador] = useState(null);
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(false);

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

  const handleVerHorarios = (entrenador) => {
    setEntrenadorFicha(entrenador);
    setVista('horarios');
  };

  const handleVerDisponibilidad = (entrenador) => {
    setEntrenadorFicha(entrenador);
    setVista('disponibilidad');
  };

  const handleVerConfiguracion = async (entrenador) => {
    setEntrenadorFicha(entrenador);
    setConfiguracionEntrenador(null);
    setCargandoConfiguracion(true);
    setVista('configuracion');

    try {
      const response = await gimnasioServicio.obtenerConfiguracionEntrenador(entrenador.id);
      setConfiguracionEntrenador(response.datos || null);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al cargar la configuración del entrenador', 'error');
    } finally {
      setCargandoConfiguracion(false);
    }
  };

  const handleEditarDesdeConfiguracion = () => {
    if (!configuracionEntrenador?.entrenador) return;

    const entrenador = {
      ...configuracionEntrenador.entrenador,
      servicio_ids: (configuracionEntrenador.servicios || []).map((servicio) => Number(servicio.id)),
    };

    handleEditar(entrenador);
  };

  const handleNuevo = () => { setFormData(getInitialForm()); setVista('formulario'); };
  const handleEditar = (ent) => {
    setFormData({
      ...ent,
      estado: 'ACTIVO',
      servicio_ids: (ent.servicio_ids || []).map((id) => Number(id)),
    });
    setVista('formulario');
  };
  const handleCancelar = () => { setVista('lista'); };

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

  if (vista === 'horarios' && entrenadorFicha) {
    return (
      <HorarioEntrenadorPersonalizado
        entrenador={entrenadorFicha}
        onVolver={() => { setEntrenadorFicha(null); setVista('lista'); }}
      />
    );
  }

  if (vista === 'disponibilidad' && entrenadorFicha) {
    return (
      <DisponibilidadAgendaPage
        entrenadorInicial={entrenadorFicha}
        onVolver={() => { setEntrenadorFicha(null); setVista('lista'); }}
      />
    );
  }

  if (vista === 'configuracion' && entrenadorFicha) {
    return (
      <>
        <EntrenadorConfiguracion
          datos={configuracionEntrenador}
          cargando={cargandoConfiguracion}
          onVolver={() => {
            setEntrenadorFicha(null);
            setConfiguracionEntrenador(null);
            setVista('lista');
          }}
          onEditar={handleEditarDesdeConfiguracion}
        />
        <NotificacionSnackbar
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onClose={() => setNotificacion({ ...notificacion, mensaje: '' })}
        />
      </>
    );
  }

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
                    label="Estado"
                    name="estado"
                    value="Activo"
                    size="small"
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
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
          onVerConfiguracion={handleVerConfiguracion}
          onVerHorarios={handleVerHorarios}
          onVerDisponibilidad={handleVerDisponibilidad}
          onPageChange={(p) => { const n = { ...filtros, page: p }; setFiltros(n); cargarEntrenadores(n); }}
          onRowsPerPageChange={(pp) => { const n = { ...filtros, page: 1, per_page: pp }; setFiltros(n); cargarEntrenadores(n); }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
