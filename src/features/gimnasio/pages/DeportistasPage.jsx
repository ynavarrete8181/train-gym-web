import { useState, useEffect } from 'react';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Switch, TextField, Typography, Chip, Tooltip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { formStyles } from '../../../styles/formStyles.js';
import { Stack } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { PestanasEstandar } from '../../../components/common/PestanasEstandar.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SportsIcon from '@mui/icons-material/Sports';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { DeportistasTable } from '../components/DeportistasTable.jsx';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { entrenamientoServicio } from '../../entrenamiento/services/entrenamientoServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const getInitialForm = () => ({
  id: null,
  usuario_id: '',
  codigo_deportista: '',
  fecha_nacimiento: '',
  genero: '',
  telefono: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  observaciones_medicas: '',
  sede_principal_id: '',
  estado: 'PROSPECTO'
});

const getInitialAsignacion = () => ({
  entrenador_id: '',
  horario_bloque_id: '',
  membresia_id: '',
  observaciones: '',
});

const TABS_FICHA = [
  { value: 'datos', label: 'Datos del cliente', icon: <BadgeOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'entrenador', label: 'Entrenador y horario', icon: <SportsIcon sx={{ fontSize: 17 }} /> },
  { value: 'membresia', label: 'Membresía', icon: <CardMembershipOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'progreso', label: 'Progreso', icon: <MonitorWeightOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'entrenamiento', label: 'Entrenamiento', icon: <FitnessCenterOutlinedIcon sx={{ fontSize: 17 }} /> },
];

const hoyISO = () => new Date().toISOString().slice(0, 10);

const getInitialMembresia = () => ({
  id: null,
  plan_id: '',
  sede_id: '',
  codigo_contrato: '',
  fecha_inicio: hoyISO(),
  fecha_fin: '',
  estado: 'PENDIENTE_PAGO',
  dias_gracia: 0,
  renovacion_automatica: false,
  fecha_congelacion_inicio: '',
  fecha_congelacion_fin: '',
});

const limpiarFechaMembresia = (valor) => (valor ? String(valor).slice(0, 10) : '');

// Mismo criterio que se usa en Membresías: suma la duración del plan
// (DIAS, MESES o ANIOS) a la fecha de inicio, sin restar un día.
const calcularFechaFinMembresia = (fechaInicioStr, plan) => {
  if (!fechaInicioStr || !plan) return '';
  const duracion = Number(plan.duracion || 0);
  if (!duracion) return '';

  const fecha = new Date(`${fechaInicioStr}T00:00:00`);
  switch (plan.tipo_duracion) {
    case 'DIAS':
      fecha.setDate(fecha.getDate() + duracion);
      break;
    case 'MESES':
      fecha.setMonth(fecha.getMonth() + duracion);
      break;
    case 'ANIOS':
      fecha.setFullYear(fecha.getFullYear() + duracion);
      break;
    default:
      return '';
  }
  return fecha.toISOString().slice(0, 10);
};

const precioAplicableMembresia = (plan, sedeId) => {
  if (!plan) return null;
  const precioSede = (plan.precios_sede || []).find((p) => String(p.sede_id) === String(sedeId));
  return precioSede ? Number(precioSede.precio) : Number(plan.precio_base || 0);
};

const fechaMembresia = (valor) => (valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha');

const getInitialProgreso = () => ({
  id: null,
  fecha_registro: hoyISO(),
  peso_kg: '',
  talla_cm: '',
  cintura_cm: '',
  grasa_corporal_pct: '',
  objetivo: '',
  observaciones: '',
});

const limpiarFechaProgreso = (valor) => (valor ? String(valor).slice(0, 10) : '');

const fechaProgreso = (valor) => (valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha');

const calcularImcPreview = (pesoKg, tallaCm) => {
  const peso = Number(pesoKg);
  const talla = Number(tallaCm);
  if (!peso || !talla) return null;
  return peso / ((talla / 100) ** 2);
};

const estadoImc = (imc) => {
  if (!imc) return { label: 'Sin datos', color: 'default' };
  if (imc < 18.5) return { label: 'Bajo peso', color: 'warning' };
  if (imc < 25) return { label: 'Normal', color: 'success' };
  if (imc < 30) return { label: 'Sobrepeso', color: 'warning' };
  return { label: 'Obesidad', color: 'error' };
};

const getInitialPlanEntrenamiento = () => ({
  id: null,
  nombre: '',
  entrenador_id: '',
  objetivo: '',
  fecha_inicio: hoyISO(),
  fecha_fin: '',
  estado: 'BORRADOR',
  observaciones: '',
});

const limpiarFechaPlan = (valor) => (valor ? String(valor).slice(0, 10) : '');

const fechaPlan = (valor) => (valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha');

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const TIPOS_CARGA = ['LIBRE', 'KG', 'PORCENTAJE_RM', 'RPE'];
const TIPOS_RM = ['DIRECTO', 'ESTIMADO'];

const getInitialRutina = () => ({
  id: null,
  plan_id: '',
  ejercicio_id: '',
  semana: 1,
  dia: 'LUNES',
  bloque: '',
  series: 1,
  repeticiones: '',
  tipo_carga: 'LIBRE',
  carga_objetivo: '',
  descanso_segundos: '',
  orden: 1,
  notas: '',
});

const getInitialRm = () => ({
  id: null,
  ejercicio_id: '',
  tipo_registro: 'ESTIMADO',
  peso: '',
  repeticiones: '',
  rm_estimado: '',
  fecha_registro: hoyISO(),
  observaciones: '',
});

const limpiarFechaRm = (valor) => (valor ? String(valor).slice(0, 10) : '');

const fechaRm = (valor) => (valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : 'Sin fecha');

const pesoSugeridoPorPorcentaje = (rutina, ultimosRm) => {
  if (rutina.tipo_carga !== 'PORCENTAJE_RM' || !rutina.carga_objetivo) return null;
  const ultimo = ultimosRm[rutina.ejercicio_id];
  if (!ultimo || !ultimo.rm_estimado) return null;
  return (Number(rutina.carga_objetivo) / 100) * Number(ultimo.rm_estimado);
};

export function DeportistasPage() {
  const [vista, setVista] = useState('lista');
  const [formData, setFormData] = useState(getInitialForm());
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const [deportistas, setDeportistas] = useState([]);
  const [usuariosDisp, setUsuariosDisp] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], nombres: [], telefono: [], sede: [], estado: [] });
  const [cargando, setCargando] = useState(true);

  // Ficha del cliente (pestañas: datos / entrenador y horario)
  const [tabFicha, setTabFicha] = useState('datos');
  const [membresiasCliente, setMembresiasCliente] = useState([]);
  const [entrenadoresDisp, setEntrenadoresDisp] = useState([]);
  const [turnosEntrenador, setTurnosEntrenador] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionForm, setAsignacionForm] = useState(getInitialAsignacion());
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [membresiaForm, setMembresiaForm] = useState(getInitialMembresia());
  const [progresosCliente, setProgresosCliente] = useState([]);
  const [progresoForm, setProgresoForm] = useState(getInitialProgreso());
  const [planesEntrenamiento, setPlanesEntrenamiento] = useState([]);
  const [planEntrenamientoForm, setPlanEntrenamientoForm] = useState(getInitialPlanEntrenamiento());
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState(null);
  const [rutinasPlan, setRutinasPlan] = useState([]);
  const [rutinaForm, setRutinaForm] = useState(getInitialRutina());
  const [ejerciciosDisp, setEjerciciosDisp] = useState([]);
  const [rmCliente, setRmCliente] = useState([]);
  const [rmForm, setRmForm] = useState(getInitialRm());
  const [ultimosRm, setUltimosRm] = useState({});

  const showNotificacion = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo });
  };

  const cargarDeportistas = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerDeportistas(parametros);
      setDeportistas(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      showNotificacion('Error al cargar los clientes', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogosFormulario = async () => {
    try {
      const [usuariosResponse, estructuraResponse, planesResponse, ejerciciosResponse] = await Promise.all([
        gimnasioServicio.obtenerUsuarios({ per_page: 100, rol: 'DEPORTISTA' }),
        gimnasioServicio.obtenerEstructuraOperativa(),
        gimnasioServicio.obtenerPlanes({ per_page: 100 }),
        entrenamientoServicio.obtenerEjercicios({ per_page: 100 }),
      ]);
      setUsuariosDisp(usuariosResponse.datos || []);
      setSedes(estructuraResponse.datos?.sedes || []);
      setPlanes(planesResponse.datos || []);
      setEjerciciosDisp(ejerciciosResponse.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
    }
  };

  useEffect(() => {
    if (vista === 'lista') {
      cargarDeportistas();
    } else if (vista === 'formulario') {
      cargarCatalogosFormulario();
    } else if (vista === 'ficha') {
      cargarCatalogosFormulario();
    }
  }, [vista]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarDeportistas(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargarDeportistas(nuevosFiltros);
  };

  const handleNuevo = () => {
    setFormData(getInitialForm());
    setVista('formulario');
  };

  const handleCancelar = () => {
    setVista('lista');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async () => {
    try {
      if (!formData.codigo_deportista || !formData.usuario_id) {
        showNotificacion('Faltan campos obligatorios', 'warning');
        return;
      }

      const payload = { ...formData };

      if (formData.id) {
        await gimnasioServicio.actualizarDeportista(formData.id, payload);
        showNotificacion('Cliente actualizado con éxito', 'success');
      } else {
        await gimnasioServicio.crearDeportista(payload);
        showNotificacion('Cliente creado con éxito. Ahora completa su ficha.', 'success');
      }

      setVista('lista');
      cargarDeportistas();
    } catch (error) {
      console.error(error);
      showNotificacion(error.response?.data?.mensaje || 'Error al guardar el cliente', 'error');
    }
  };

  // --- Ficha del cliente ---

  const cargarAsignacionesYEntrenadores = async (deportistaId) => {
    try {
      const [entrenadoresResp, asignacionesResp] = await Promise.all([
        gimnasioServicio.obtenerEntrenadores({ per_page: 100, estado: 'ACTIVO' }),
        gimnasioServicio.obtenerAsignacionesEntrenador({ deportista_id: deportistaId }),
      ]);
      setEntrenadoresDisp(entrenadoresResp.datos || []);
      setAsignaciones(asignacionesResp.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar entrenador y horario', 'error');
    }
  };

  const cargarProgresoCliente = async (deportistaId) => {
    try {
      const response = await entrenamientoServicio.obtenerProgreso({ cliente_id: deportistaId, per_page: 50 });
      setProgresosCliente(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar el progreso físico', 'error');
    }
  };

  const cargarEntrenamientoCliente = async (deportistaId) => {
    try {
      const [planesResp, rmResp, ultimosRmResp] = await Promise.all([
        entrenamientoServicio.obtenerPlanes({ cliente_id: deportistaId, per_page: 50 }),
        entrenamientoServicio.obtenerRegistrosRm({ cliente_id: deportistaId, per_page: 50 }),
        entrenamientoServicio.obtenerUltimosRm(deportistaId),
      ]);
      setPlanesEntrenamiento(planesResp.datos || []);
      setRmCliente(rmResp.datos || []);
      setUltimosRm(ultimosRmResp.datos || {});
    } catch (error) {
      showNotificacion('Error al cargar el entrenamiento del cliente', 'error');
    }
  };

  const cargarFicha = async (deportista) => {
    setCargandoFicha(true);
    try {
      const detalle = await gimnasioServicio.obtenerDeportistaPorId(deportista.id);
      setFormData({ ...detalle.datos });
      setMembresiasCliente(detalle.datos?.membresias || []);
      await cargarAsignacionesYEntrenadores(deportista.id);
      await cargarProgresoCliente(deportista.id);
      await cargarEntrenamientoCliente(deportista.id);
    } catch (error) {
      showNotificacion('Error al cargar la ficha del cliente', 'error');
    } finally {
      setCargandoFicha(false);
    }
  };

  const handleAbrirFicha = (deportista) => {
    setFormData({ ...deportista });
    setTabFicha('datos');
    setAsignacionForm(getInitialAsignacion());
    setMembresiaForm(getInitialMembresia());
    setProgresoForm(getInitialProgreso());
    setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
    setPlanSeleccionadoId(null);
    setRutinasPlan([]);
    setRutinaForm(getInitialRutina());
    setRmForm(getInitialRm());
    setTurnosEntrenador([]);
    setVista('ficha');
    cargarFicha(deportista);
  };

  const handleCancelarFicha = () => {
    setVista('lista');
  };

  const handleGuardarDatosFicha = async () => {
    try {
      if (!formData.codigo_deportista || !formData.usuario_id) {
        showNotificacion('Faltan campos obligatorios', 'warning');
        return;
      }
      await gimnasioServicio.actualizarDeportista(formData.id, formData);
      showNotificacion('Datos del cliente actualizados', 'success');
      cargarDeportistas();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al guardar el cliente', 'error');
    }
  };

  const handleAsignacionEntrenadorChange = async (e) => {
    const entrenadorId = e.target.value;
    setAsignacionForm(prev => ({ ...prev, entrenador_id: entrenadorId, horario_bloque_id: '' }));
    if (!entrenadorId) { setTurnosEntrenador([]); return; }
    try {
      const response = await gimnasioServicio.obtenerTurnosEntrenador(entrenadorId);
      setTurnosEntrenador(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar los turnos del entrenador', 'error');
    }
  };

  const handleAsignacionChange = (e) => {
    const { name, value } = e.target;
    setAsignacionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarAsignacion = async () => {
    if (!asignacionForm.entrenador_id || !asignacionForm.horario_bloque_id) {
      showNotificacion('Selecciona un entrenador y un turno', 'warning');
      return;
    }
    try {
      await gimnasioServicio.crearAsignacionEntrenador({
        entrenador_id: Number(asignacionForm.entrenador_id),
        deportista_id: formData.id,
        horario_bloque_id: Number(asignacionForm.horario_bloque_id),
        membresia_id: asignacionForm.membresia_id ? Number(asignacionForm.membresia_id) : null,
        observaciones: asignacionForm.observaciones || null,
      });
      showNotificacion('Cliente asignado correctamente', 'success');
      setAsignacionForm(getInitialAsignacion());
      setTurnosEntrenador([]);
      cargarAsignacionesYEntrenadores(formData.id);
    } catch (error) {
      const mensaje = error.response?.data?.errores
        ? Object.values(error.response.data.errores).flat().join(' ')
        : (error.response?.data?.mensaje || 'Error al asignar el entrenador');
      showNotificacion(mensaje, 'error');
    }
  };

  const handleFinalizarAsignacion = async (asignacion) => {
    try {
      await gimnasioServicio.finalizarAsignacionEntrenador(asignacion.id);
      showNotificacion('Asignación finalizada', 'success');
      cargarAsignacionesYEntrenadores(formData.id);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al finalizar la asignación', 'error');
    }
  };

  // --- Membresía (dentro de la ficha del cliente) ---

  useEffect(() => {
    if (membresiaForm.id) return; // no recalcular al editar una membresía existente
    if (!membresiaForm.fecha_inicio || !membresiaForm.plan_id) return;

    const plan = planes.find((p) => String(p.id) === String(membresiaForm.plan_id));
    if (!plan) return;

    const nuevaFechaFin = calcularFechaFinMembresia(membresiaForm.fecha_inicio, plan);
    if (nuevaFechaFin) {
      setMembresiaForm((actual) => ({ ...actual, fecha_fin: nuevaFechaFin }));
    }
  }, [membresiaForm.fecha_inicio, membresiaForm.plan_id, membresiaForm.id, planes]);

  const handleMembresiaChange = (e) => {
    const { name, value, checked, type } = e.target;
    setMembresiaForm((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNuevaMembresia = () => {
    setMembresiaForm(getInitialMembresia());
  };

  const handleEditarMembresia = (m) => {
    setMembresiaForm({
      ...m,
      fecha_inicio: limpiarFechaMembresia(m.fecha_inicio),
      fecha_fin: limpiarFechaMembresia(m.fecha_fin),
      fecha_congelacion_inicio: limpiarFechaMembresia(m.fecha_congelacion_inicio),
      fecha_congelacion_fin: limpiarFechaMembresia(m.fecha_congelacion_fin),
      renovacion_automatica: Boolean(m.renovacion_automatica),
    });
  };

  const handleGuardarMembresia = async () => {
    try {
      if (!membresiaForm.plan_id || !membresiaForm.sede_id || !membresiaForm.codigo_contrato || !membresiaForm.fecha_inicio || !membresiaForm.fecha_fin) {
        showNotificacion('Completa los campos obligatorios de la membresía', 'warning');
        return;
      }

      const payload = {
        ...membresiaForm,
        deportista_id: formData.id,
        dias_gracia: Number(membresiaForm.dias_gracia || 0),
        renovacion_automatica: Boolean(membresiaForm.renovacion_automatica),
      };
      if (!payload.fecha_congelacion_inicio) delete payload.fecha_congelacion_inicio;
      if (!payload.fecha_congelacion_fin) delete payload.fecha_congelacion_fin;

      if (membresiaForm.id) {
        await gimnasioServicio.actualizarMembresia(membresiaForm.id, payload);
        showNotificacion('Membresía actualizada con éxito', 'success');
      } else {
        await gimnasioServicio.crearMembresia(payload);
        showNotificacion('Membresía creada con éxito', 'success');
      }

      setMembresiaForm(getInitialMembresia());
      cargarFicha(formData);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar la membresía';
      showNotificacion(mensaje, 'error');
    }
  };

  const renderCamposDatos = () => (
    <Stack spacing={2}>
      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>
          Información principal
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
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
            helperText={!formData.id && usuariosDisp.length === 0 ? 'No hay usuarios con rol Deportista disponibles. Créalo primero en Seguridad > Usuarios.' : 'Solo se listan usuarios con rol Deportista.'}
          >
            {usuariosDisp.map((usuario) => (
              <MenuItem key={usuario.id} value={usuario.id}>
                {usuario.name || `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim()} - {usuario.email}
              </MenuItem>
            ))}
            {formData.id && !usuariosDisp.find((usuario) => String(usuario.id) === String(formData.usuario_id)) ? (
              <MenuItem value={formData.usuario_id}>{formData.usuario_nombre || formData.name || 'Usuario asignado'}</MenuItem>
            ) : null}
          </TextField>
          <TextField
            label="Código Cliente"
            name="codigo_deportista"
            value={formData.codigo_deportista}
            onChange={handleChange}
            required
            size="small"
          />
          <TextField
            select
            label="Sede principal"
            name="sede_principal_id"
            value={formData.sede_principal_id || ''}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="">No asignada</MenuItem>
            {sedes.map((sede) => (
              <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Teléfono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            size="small"
          />
          <TextField
            select
            label="Estado"
            name="estado"
            value={formData.estado || 'PROSPECTO'}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="PROSPECTO">Prospecto</MenuItem>
            <MenuItem value="ACTIVO">Activo</MenuItem>
            <MenuItem value="INACTIVO">Inactivo</MenuItem>
            <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
          </TextField>
          <TextField
            label="Fecha de nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento || ''}
            onChange={handleChange}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Género"
            name="genero"
            value={formData.genero || ''}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="">No especificado</MenuItem>
            <MenuItem value="FEMENINO">Femenino</MenuItem>
            <MenuItem value="MASCULINO">Masculino</MenuItem>
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
        </Box>
      </Box>
      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>
          Contacto y observaciones
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
          <TextField
            label="Contacto de emergencia"
            name="contacto_emergencia_nombre"
            value={formData.contacto_emergencia_nombre || ''}
            onChange={handleChange}
            size="small"
          />
          <TextField
            label="Teléfono de emergencia"
            name="contacto_emergencia_telefono"
            value={formData.contacto_emergencia_telefono || ''}
            onChange={handleChange}
            size="small"
          />
          <TextField
            label="Observaciones médicas"
            name="observaciones_medicas"
            value={formData.observaciones_medicas || ''}
            onChange={handleChange}
            size="small"
            multiline
            minRows={3}
            sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
          />
        </Box>
      </Box>
    </Stack>
  );

  const renderEntrenadorYHorario = () => (
    <Stack spacing={2}>
      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Nueva asignación</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField
            select
            label="Entrenador"
            name="entrenador_id"
            value={asignacionForm.entrenador_id}
            onChange={handleAsignacionEntrenadorChange}
            size="small"
            required
          >
            {entrenadoresDisp.map((ent) => (
              <MenuItem key={ent.id} value={ent.id}>
                {`${ent.nombres || ''} ${ent.apellidos || ''}`.trim() || ent.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Horario"
            name="horario_bloque_id"
            value={asignacionForm.horario_bloque_id}
            onChange={handleAsignacionChange}
            size="small"
            required
            disabled={!asignacionForm.entrenador_id}
            helperText={asignacionForm.entrenador_id && turnosEntrenador.length === 0 ? 'Este entrenador no tiene horarios asignados' : ''}
          >
            {turnosEntrenador.map((turno) => (
              <MenuItem key={turno.id} value={turno.id}>
                {turno.nombre ? `${turno.nombre} · ` : ''}{turno.dia_semana} {String(turno.hora_inicio).slice(0, 5)}-{String(turno.hora_fin).slice(0, 5)} · {turno.sede_nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Membresía"
            name="membresia_id"
            value={asignacionForm.membresia_id}
            onChange={handleAsignacionChange}
            size="small"
            helperText={membresiasCliente.length === 0 ? 'El cliente no tiene membresías registradas' : ''}
          >
            <MenuItem value="">Sin membresía asociada</MenuItem>
            {membresiasCliente.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.plan_nombre}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Observaciones"
            name="observaciones"
            value={asignacionForm.observaciones}
            onChange={handleAsignacionChange}
            size="small"
            sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
          />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto="Asignar" onClick={handleGuardarAsignacion} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Asignaciones activas</Typography>
        {cargandoFicha ? (
          <Typography variant="body2" color="text.secondary">Cargando...</Typography>
        ) : asignaciones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene entrenador ni horario asignado todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {asignaciones.map((a) => (
              <Stack key={a.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Chip label={`${a.entrenador_nombres || ''} ${a.entrenador_apellidos || ''}`.trim() || a.entrenador_nombre} size="small" color="default" />
                  {a.dia_semana && (
                    <Typography variant="body2" fontWeight="500">
                      {a.dia_semana} {String(a.hora_inicio).slice(0, 5)}-{String(a.hora_fin).slice(0, 5)}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">{a.sede_nombre}</Typography>
                </Stack>
                <Tooltip title="Finalizar asignación">
                  <IconButton sx={dbanuStyles.actionDelete} size="small" onClick={() => handleFinalizarAsignacion(a)}>
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  const handleEliminarMembresia = async (m) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar membresía',
      texto: `¿Estás seguro que deseas eliminar la membresía "${m.plan_nombre}" (${m.codigo_contrato})?`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await gimnasioServicio.eliminarMembresia(m.id);
      showNotificacion('Membresía eliminada con éxito', 'success');
      if (membresiaForm.id === m.id) setMembresiaForm(getInitialMembresia());
      cargarFicha(formData);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al eliminar la membresía', 'error');
    }
  };

  const renderMembresia = () => (
    <Stack spacing={2}>
      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {membresiaForm.id ? 'Editar membresía' : 'Nueva membresía'}
          </Typography>
          {membresiaForm.id ? (
            <Button size="small" onClick={handleNuevaMembresia}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField select label="Plan" name="plan_id" value={membresiaForm.plan_id || ''} onChange={handleMembresiaChange} required size="small" disabled={!!membresiaForm.id}>
            {planes.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>{plan.nombre} - ${Number(plan.precio_base || 0).toFixed(2)}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Sede"
            name="sede_id"
            value={membresiaForm.sede_id || ''}
            onChange={handleMembresiaChange}
            required
            size="small"
            disabled={!!membresiaForm.id}
            helperText={
              !membresiaForm.id && membresiaForm.plan_id && membresiaForm.sede_id
                ? `Precio aplicado: $${precioAplicableMembresia(planes.find((p) => String(p.id) === String(membresiaForm.plan_id)), membresiaForm.sede_id).toFixed(2)}`
                : ''
            }
          >
            {sedes.map((sede) => (
              <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField label="Código contrato" name="codigo_contrato" value={membresiaForm.codigo_contrato || ''} onChange={handleMembresiaChange} required size="small" disabled={!!membresiaForm.id} />
          <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={membresiaForm.fecha_inicio || ''} onChange={handleMembresiaChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField
            label="Fecha fin"
            name="fecha_fin"
            type="date"
            value={membresiaForm.fecha_fin || ''}
            onChange={handleMembresiaChange}
            required
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={!membresiaForm.id ? 'Calculada según la duración del plan. Puedes ajustarla si es necesario.' : ''}
          />
          <TextField select label="Estado" name="estado" value={membresiaForm.estado || 'PENDIENTE_PAGO'} onChange={handleMembresiaChange} required size="small">
            <MenuItem value="PENDIENTE_PAGO">Pendiente pago</MenuItem>
            <MenuItem value="ACTIVA">Activa</MenuItem>
            <MenuItem value="VENCIDA">Vencida</MenuItem>
            <MenuItem value="CONGELADA">Congelada</MenuItem>
            <MenuItem value="CANCELADA">Cancelada</MenuItem>
          </TextField>
          <TextField label="Días de gracia" name="dias_gracia" type="number" value={membresiaForm.dias_gracia || 0} onChange={handleMembresiaChange} size="small" />
          <FormControlLabel control={<Switch name="renovacion_automatica" checked={Boolean(membresiaForm.renovacion_automatica)} onChange={handleMembresiaChange} />} label="Renovación automática" />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, mt: 1.5 }}>
          <TextField label="Inicio congelación" name="fecha_congelacion_inicio" type="date" value={membresiaForm.fecha_congelacion_inicio || ''} onChange={handleMembresiaChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Fin congelación" name="fecha_congelacion_fin" type="date" value={membresiaForm.fecha_congelacion_fin || ''} onChange={handleMembresiaChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={membresiaForm.id ? 'Guardar cambios' : 'Guardar membresía'} onClick={handleGuardarMembresia} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Membresías del cliente</Typography>
        {cargandoFicha ? (
          <Typography variant="body2" color="text.secondary">Cargando...</Typography>
        ) : membresiasCliente.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene membresías registradas todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {membresiasCliente.map((m) => (
              <Stack key={m.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Chip label={m.estado} size="small" color="default" />
                  <Typography variant="body2" fontWeight="500">{m.plan_nombre}{m.precio_aplicado ? ` · $${Number(m.precio_aplicado).toFixed(2)}` : ''}</Typography>
                  <Typography variant="body2" color="text.secondary">{fechaMembresia(m.fecha_inicio)} - {fechaMembresia(m.fecha_fin)}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Editar membresía">
                    <IconButton size="small" onClick={() => handleEditarMembresia(m)}>
                      <EditOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar membresía">
                    <IconButton size="small" sx={dbanuStyles.actionDelete} onClick={() => handleEliminarMembresia(m)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );


  // --- Progreso físico (dentro de la ficha del cliente) ---

  const handleProgresoChange = (e) => {
    const { name, value } = e.target;
    setProgresoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoProgreso = () => {
    setProgresoForm(getInitialProgreso());
  };

  const handleEditarProgreso = (p) => {
    setProgresoForm({
      ...p,
      fecha_registro: limpiarFechaProgreso(p.fecha_registro),
      peso_kg: p.peso_kg ?? '',
      talla_cm: p.talla_cm ?? '',
      cintura_cm: p.cintura_cm ?? '',
      grasa_corporal_pct: p.grasa_corporal_pct ?? '',
    });
  };

  const handleGuardarProgreso = async () => {
    try {
      if (!progresoForm.fecha_registro) {
        showNotificacion('La fecha de registro es obligatoria', 'warning');
        return;
      }
      if (!progresoForm.peso_kg && !progresoForm.talla_cm && !progresoForm.cintura_cm && !progresoForm.grasa_corporal_pct) {
        showNotificacion('Registra al menos una medida (peso, talla, cintura o % grasa)', 'warning');
        return;
      }

      const payload = {
        ...progresoForm,
        cliente_id: formData.id,
      };
      ['peso_kg', 'talla_cm', 'cintura_cm', 'grasa_corporal_pct'].forEach((campo) => {
        if (payload[campo] === '') delete payload[campo];
      });
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (progresoForm.id) {
        await entrenamientoServicio.actualizarProgreso(progresoForm.id, payload);
        showNotificacion('Progreso actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearProgreso(payload);
        showNotificacion('Progreso registrado con éxito', 'success');
      }

      setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el progreso';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleEliminarProgreso = async (p) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar registro de progreso',
      texto: `¿Estás seguro que deseas eliminar el registro del ${fechaProgreso(p.fecha_registro)}?`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await entrenamientoServicio.eliminarProgreso(p.id);
      showNotificacion('Registro eliminado con éxito', 'success');
      if (progresoForm.id === p.id) setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al eliminar el registro', 'error');
    }
  };

  const renderProgreso = () => {
    const imcPreview = calcularImcPreview(progresoForm.peso_kg, progresoForm.talla_cm);
    const estado = estadoImc(imcPreview);

    return (
      <Stack spacing={2}>
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {progresoForm.id ? 'Editar registro' : 'Nuevo registro de progreso'}
            </Typography>
            {progresoForm.id ? (
              <Button size="small" onClick={handleNuevoProgreso}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <TextField label="Fecha de registro" name="fecha_registro" type="date" value={progresoForm.fecha_registro || ''} onChange={handleProgresoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Peso (kg)" name="peso_kg" type="number" value={progresoForm.peso_kg || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Talla (cm)" name="talla_cm" type="number" value={progresoForm.talla_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Cintura (cm)" name="cintura_cm" type="number" value={progresoForm.cintura_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField
              label="% Grasa corporal"
              name="grasa_corporal_pct"
              type="number"
              value={progresoForm.grasa_corporal_pct || ''}
              onChange={handleProgresoChange}
              size="small"
              helperText={imcPreview ? `IMC estimado: ${imcPreview.toFixed(1)} (${estado.label})` : ''}
            />
            <TextField label="Objetivo" name="objetivo" value={progresoForm.objetivo || ''} onChange={handleProgresoChange} size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Observaciones" name="observaciones" value={progresoForm.observaciones || ''} onChange={handleProgresoChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={progresoForm.id ? 'Guardar cambios' : 'Guardar registro'} onClick={handleGuardarProgreso} />
          </Stack>
        </Box>

        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Historial de progreso</Typography>
          {cargandoFicha ? (
            <Typography variant="body2" color="text.secondary">Cargando...</Typography>
          ) : progresosCliente.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de progreso todavía.</Typography>
          ) : (
            <Stack spacing={1}>
              {progresosCliente.map((p) => {
                const estadoFila = estadoImc(p.imc);
                return (
                  <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary">{fechaProgreso(p.fecha_registro)}</Typography>
                      <Typography variant="body2" fontWeight="500">{p.peso_kg ? `${Number(p.peso_kg).toFixed(1)} kg` : 'Sin peso'}</Typography>
                      {p.imc ? <Chip label={`IMC ${Number(p.imc).toFixed(1)} · ${estadoFila.label}`} size="small" color={estadoFila.color} /> : null}
                      {p.grasa_corporal_pct ? <Typography variant="body2" color="text.secondary">{Number(p.grasa_corporal_pct).toFixed(1)}% grasa</Typography> : null}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar registro">
                        <IconButton size="small" onClick={() => handleEditarProgreso(p)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar registro">
                        <IconButton size="small" sx={dbanuStyles.actionDelete} onClick={() => handleEliminarProgreso(p)}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    );
  };


  // --- Entrenamiento (plan + rutinas + RM, dentro de la ficha del cliente) ---

  const handlePlanEntrenamientoChange = (e) => {
    const { name, value } = e.target;
    setPlanEntrenamientoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoPlanEntrenamiento = () => {
    setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
  };

  const handleEditarPlanEntrenamiento = (p) => {
    setPlanEntrenamientoForm({
      ...p,
      fecha_inicio: limpiarFechaPlan(p.fecha_inicio),
      fecha_fin: limpiarFechaPlan(p.fecha_fin),
    });
  };

  const handleGuardarPlanEntrenamiento = async () => {
    try {
      if (!planEntrenamientoForm.nombre || !planEntrenamientoForm.fecha_inicio) {
        showNotificacion('Completa los campos obligatorios del plan', 'warning');
        return;
      }

      const payload = {
        ...planEntrenamientoForm,
        cliente_id: formData.id,
      };
      if (!payload.entrenador_id) delete payload.entrenador_id;
      if (!payload.fecha_fin) delete payload.fecha_fin;
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (planEntrenamientoForm.id) {
        await entrenamientoServicio.actualizarPlan(planEntrenamientoForm.id, payload);
        showNotificacion('Plan actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearPlan(payload);
        showNotificacion('Plan creado con éxito', 'success');
      }

      setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el plan';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleSeleccionarPlan = async (plan) => {
    setPlanSeleccionadoId(plan.id);
    setRutinaForm({ ...getInitialRutina(), plan_id: plan.id });
    try {
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: plan.id, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar las rutinas del plan', 'error');
    }
  };

  const handleRutinaChange = (e) => {
    const { name, value } = e.target;
    setRutinaForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevaRutina = () => {
    setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
  };

  const handleEditarRutina = (r) => {
    setRutinaForm({ ...r });
  };

  const handleGuardarRutina = async () => {
    try {
      if (!rutinaForm.ejercicio_id || !rutinaForm.dia || !rutinaForm.series || !rutinaForm.orden) {
        showNotificacion('Completa los campos obligatorios de la rutina', 'warning');
        return;
      }

      const payload = {
        ...rutinaForm,
        plan_id: planSeleccionadoId,
        semana: Number(rutinaForm.semana || 1),
        series: Number(rutinaForm.series || 1),
        orden: Number(rutinaForm.orden || 1),
        carga_objetivo: rutinaForm.carga_objetivo ? Number(rutinaForm.carga_objetivo) : null,
        descanso_segundos: rutinaForm.descanso_segundos ? Number(rutinaForm.descanso_segundos) : null,
      };
      if (!payload.bloque) delete payload.bloque;
      if (!payload.repeticiones) delete payload.repeticiones;
      if (!payload.notas) delete payload.notas;
      if (payload.carga_objetivo === null) delete payload.carga_objetivo;
      if (payload.descanso_segundos === null) delete payload.descanso_segundos;

      if (rutinaForm.id) {
        await entrenamientoServicio.actualizarRutina(rutinaForm.id, payload);
        showNotificacion('Rutina actualizada con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRutina(payload);
        showNotificacion('Rutina creada con éxito', 'success');
      }

      setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: planSeleccionadoId, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar la rutina';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleRmChange = (e) => {
    const { name, value } = e.target;
    setRmForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoRm = () => {
    setRmForm(getInitialRm());
  };

  const handleEditarRm = (r) => {
    setRmForm({
      ...r,
      fecha_registro: limpiarFechaRm(r.fecha_registro),
    });
  };

  const handleGuardarRm = async () => {
    try {
      if (!rmForm.ejercicio_id || !rmForm.peso || !rmForm.rm_estimado || !rmForm.fecha_registro) {
        showNotificacion('Completa los campos obligatorios del registro RM', 'warning');
        return;
      }

      const payload = {
        ...rmForm,
        cliente_id: formData.id,
        peso: Number(rmForm.peso),
        rm_estimado: Number(rmForm.rm_estimado),
        repeticiones: rmForm.repeticiones ? Number(rmForm.repeticiones) : null,
      };
      if (payload.repeticiones === null) delete payload.repeticiones;
      if (!payload.observaciones) delete payload.observaciones;

      if (rmForm.id) {
        await entrenamientoServicio.actualizarRegistroRm(rmForm.id, payload);
        showNotificacion('Registro RM actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRegistroRm(payload);
        showNotificacion('Registro RM guardado con éxito', 'success');
      }

      setRmForm(getInitialRm());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el registro RM';
      showNotificacion(mensaje, 'error');
    }
  };

  const renderEntrenamiento = () => (
    <Stack spacing={2}>
      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {planEntrenamientoForm.id ? 'Editar plan' : 'Nuevo plan de entrenamiento'}
          </Typography>
          {planEntrenamientoForm.id ? (
            <Button size="small" onClick={handleNuevoPlanEntrenamiento}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField label="Nombre del plan" name="nombre" value={planEntrenamientoForm.nombre || ''} onChange={handlePlanEntrenamientoChange} required size="small" />
          <TextField select label="Entrenador" name="entrenador_id" value={planEntrenamientoForm.entrenador_id || ''} onChange={handlePlanEntrenamientoChange} size="small">
            <MenuItem value="">Sin asignar</MenuItem>
            {entrenadoresDisp.map((ent) => (
              <MenuItem key={ent.usuario_id} value={ent.usuario_id}>{`${ent.nombres || ''} ${ent.apellidos || ''}`.trim() || ent.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Estado" name="estado" value={planEntrenamientoForm.estado || 'BORRADOR'} onChange={handlePlanEntrenamientoChange} required size="small">
            <MenuItem value="BORRADOR">Borrador</MenuItem>
            <MenuItem value="ACTIVO">Activo</MenuItem>
            <MenuItem value="PAUSADO">Pausado</MenuItem>
            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
          </TextField>
          <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={planEntrenamientoForm.fecha_inicio || ''} onChange={handlePlanEntrenamientoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Fecha fin" name="fecha_fin" type="date" value={planEntrenamientoForm.fecha_fin || ''} onChange={handlePlanEntrenamientoChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Objetivo" name="objetivo" value={planEntrenamientoForm.objetivo || ''} onChange={handlePlanEntrenamientoChange} size="small" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={planEntrenamientoForm.observaciones || ''} onChange={handlePlanEntrenamientoChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={planEntrenamientoForm.id ? 'Guardar cambios' : 'Guardar plan'} onClick={handleGuardarPlanEntrenamiento} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Planes del cliente</Typography>
        {planesEntrenamiento.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene planes de entrenamiento todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {planesEntrenamiento.map((p) => (
              <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: p.id === planSeleccionadoId ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: 2, p: 1.25, cursor: 'pointer' }}
                onClick={() => handleSeleccionarPlan(p)}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Chip label={p.estado} size="small" />
                  <Typography variant="body2" fontWeight="500">{p.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{fechaPlan(p.fecha_inicio)} - {p.fecha_fin ? fechaPlan(p.fecha_fin) : 'Sin fin'}</Typography>
                  {p.entrenador_nombre ? <Typography variant="body2" color="text.secondary">Entrenador: {p.entrenador_nombre}</Typography> : null}
                </Stack>
                <Tooltip title="Editar plan">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditarPlanEntrenamiento(p); }}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {planSeleccionadoId ? (
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {rutinaForm.id ? 'Editar rutina' : 'Nueva rutina'} — {planesEntrenamiento.find((p) => p.id === planSeleccionadoId)?.nombre}
            </Typography>
            {rutinaForm.id ? (
              <Button size="small" onClick={handleNuevaRutina}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            <TextField select label="Ejercicio" name="ejercicio_id" value={rutinaForm.ejercicio_id || ''} onChange={handleRutinaChange} required size="small">
              {ejerciciosDisp.map((ej) => (
                <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Día" name="dia" value={rutinaForm.dia || 'LUNES'} onChange={handleRutinaChange} required size="small">
              {DIAS_SEMANA.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Semana" name="semana" type="number" value={rutinaForm.semana || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Bloque" name="bloque" value={rutinaForm.bloque || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Series" name="series" type="number" value={rutinaForm.series || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Repeticiones" name="repeticiones" value={rutinaForm.repeticiones || ''} onChange={handleRutinaChange} size="small" />
            <TextField select label="Tipo carga" name="tipo_carga" value={rutinaForm.tipo_carga || 'LIBRE'} onChange={handleRutinaChange} required size="small">
              {TIPOS_CARGA.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label={rutinaForm.tipo_carga === 'PORCENTAJE_RM' ? 'Carga objetivo (%)' : 'Carga objetivo'}
              name="carga_objetivo"
              type="number"
              value={rutinaForm.carga_objetivo || ''}
              onChange={handleRutinaChange}
              size="small"
              helperText={(() => {
                const sugerido = pesoSugeridoPorPorcentaje(rutinaForm, ultimosRm);
                return sugerido ? `Peso sugerido: ${sugerido.toFixed(1)} (último RM: ${Number(ultimosRm[rutinaForm.ejercicio_id]?.rm_estimado).toFixed(1)})` : '';
              })()}
            />
            <TextField label="Descanso (seg)" name="descanso_segundos" type="number" value={rutinaForm.descanso_segundos || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Orden" name="orden" type="number" value={rutinaForm.orden || 1} onChange={handleRutinaChange} required size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Notas" name="notas" value={rutinaForm.notas || ''} onChange={handleRutinaChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={rutinaForm.id ? 'Guardar cambios' : 'Guardar rutina'} onClick={handleGuardarRutina} />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>Rutinas del plan</Typography>
            {rutinasPlan.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Este plan no tiene rutinas todavía.</Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {rutinasPlan.map((r) => {
                  const sugerido = pesoSugeridoPorPorcentaje(r, ultimosRm);
                  return (
                    <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                      sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Chip label={`Sem ${r.semana} · ${r.dia}`} size="small" />
                        <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.series} series{r.repeticiones ? ` x ${r.repeticiones}` : ''}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.carga_objetivo ? `${r.carga_objetivo} ${r.tipo_carga}` : r.tipo_carga}</Typography>
                        {sugerido ? <Chip label={`Sugerido: ${sugerido.toFixed(1)}`} size="small" color="info" /> : null}
                      </Stack>
                      <Tooltip title="Editar rutina">
                        <IconButton size="small" onClick={() => handleEditarRutina(r)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      ) : null}

      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {rmForm.id ? 'Editar registro RM' : 'Nuevo registro RM'}
          </Typography>
          {rmForm.id ? (
            <Button size="small" onClick={handleNuevoRm}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField select label="Ejercicio" name="ejercicio_id" value={rmForm.ejercicio_id || ''} onChange={handleRmChange} required size="small">
            {ejerciciosDisp.map((ej) => (
              <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Tipo registro" name="tipo_registro" value={rmForm.tipo_registro || 'ESTIMADO'} onChange={handleRmChange} required size="small">
            {TIPOS_RM.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Fecha de registro" name="fecha_registro" type="date" value={rmForm.fecha_registro || ''} onChange={handleRmChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Peso" name="peso" type="number" value={rmForm.peso || ''} onChange={handleRmChange} required size="small" />
          <TextField label="Repeticiones" name="repeticiones" type="number" value={rmForm.repeticiones || ''} onChange={handleRmChange} size="small" />
          <TextField label="RM estimado" name="rm_estimado" type="number" value={rmForm.rm_estimado || ''} onChange={handleRmChange} required size="small" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={rmForm.observaciones || ''} onChange={handleRmChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={rmForm.id ? 'Guardar cambios' : 'Guardar registro RM'} onClick={handleGuardarRm} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Historial de RM</Typography>
        {rmCliente.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de RM todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {rmCliente.map((r) => (
              <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">{fechaRm(r.fecha_registro)}</Typography>
                  <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                  <Chip label={`RM ${Number(r.rm_estimado).toFixed(1)}`} size="small" />
                  <Typography variant="body2" color="text.secondary">{r.tipo_registro}</Typography>
                </Stack>
                <Tooltip title="Editar registro">
                  <IconButton size="small" onClick={() => handleEditarRm(r)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo="Nuevo Cliente"
          descripcion="Registra los datos principales; luego podrás completar el resto de su ficha"
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelar} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {renderCamposDatos()}
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelar} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  if (vista === 'ficha') {
    const nombreCliente = `${formData.nombres || ''} ${formData.apellidos || ''}`.trim() || formData.usuario_nombre || formData.name || formData.codigo_deportista;
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Ficha de ${nombreCliente}`}
          descripcion="Completa los datos del cliente y, desde la pestaña Entrenador y horario, asígnalo a uno de los turnos ya configurados."
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelarFicha} />}
        />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <PestanasEstandar
            value={tabFicha}
            onChange={(_, valor) => setTabFicha(valor)}
            opciones={TABS_FICHA}
          />
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {tabFicha === 'datos' && renderCamposDatos()}
            {tabFicha === 'entrenador' && renderEntrenadorYHorario()}
            {tabFicha === 'membresia' && renderMembresia()}
            {tabFicha === 'progreso' && renderProgreso()}
            {tabFicha === 'entrenamiento' && renderEntrenamiento()}
          </Box>
          {tabFicha === 'datos' && (
            <AccionesFormulario onGuardar={handleGuardarDatosFicha} onCancelar={handleCancelarFicha} textoCancelar="Volver a la lista" />
          )}
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  // VISTA LISTA
  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Clientes"
        descripcion="Directorio principal de clientes y miembros del gimnasio"
        icono={<PeopleAltOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || deportistas.length}
          busqueda={filtros.busqueda}
          onBusqueda={(v) => buscar({ ...filtros, busqueda: v })}
          acciones={
            <Button
              startIcon={<AddOutlinedIcon />}
              onClick={handleNuevo}
              sx={dbanuStyles.addButtonRevive}
            >
              Añadir
            </Button>
          }
        />

        <DeportistasTable
          deportistas={deportistas}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onAbrirFicha={handleAbrirFicha}
          onPageChange={(p) => {
            const n = { ...filtros, page: p };
            setFiltros(n);
            cargarDeportistas(n);
          }}
          onRowsPerPageChange={(pp) => {
            const n = { ...filtros, page: 1, per_page: pp };
            setFiltros(n);
            cargarDeportistas(n);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
