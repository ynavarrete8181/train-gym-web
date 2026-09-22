import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { configuracionServicio } from '../../configuracion/services/configuracionServicio.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { MembresiasTable } from '../components/MembresiasTable.jsx';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const limpiarFecha = (valor) => (valor ? String(valor).slice(0, 10) : '');
const obtenerDeportistaContexto = () => new URLSearchParams(window.location.search).get('deportista_id') || '';

const normalizarEstado = (estado) => {
  const valor = String(estado || '').toUpperCase();
  if (valor === 'ACTIVO') return 'ACTIVA';
  if (valor === 'PENDIENTE') return 'PENDIENTE_PAGO';
  return valor || 'PENDIENTE_PAGO';
};

const formInicial = () => ({
  id: null,
  deportista_id: '',
  plan_id: '',
  sede_id: '',
  sedes_habilitadas: [],
  asignaciones_entrenador: [],
  codigo_contrato: '',
  fecha_inicio: hoyISO(),
  fecha_fin: '',
  estado: 'PENDIENTE_PAGO',
  dias_gracia: 0,
  renovacion_automatica: false,
  requiere_facturar: false,
  fecha_congelacion_inicio: '',
  fecha_congelacion_fin: '',
});

const calcularFechaFin = (fechaInicioStr, plan) => {
  if (!fechaInicioStr || !plan) return '';
  const duracion = Number(plan.duracion || 0);
  if (!duracion) return '';
  const fecha = new Date(`${fechaInicioStr}T00:00:00`);

  switch (plan.tipo_duracion) {
    case 'DIAS': fecha.setDate(fecha.getDate() + Math.max(duracion - 1, 0)); break;
    case 'MESES': fecha.setMonth(fecha.getMonth() + duracion); fecha.setDate(fecha.getDate() - 1); break;
    case 'ANIOS': fecha.setFullYear(fecha.getFullYear() + duracion); fecha.setDate(fecha.getDate() - 1); break;
    default: return '';
  }
  return fecha.toISOString().slice(0, 10);
};


export function MembresiasPage() {
  const deportistaContextoId = obtenerDeportistaContexto();
  const [vista, setVista] = useState(deportistaContextoId ? 'formulario' : 'lista');
  const [formData, setFormData] = useState(() => ({ ...formInicial(), deportista_id: deportistaContextoId }));
  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [entrenadoresPorSede, setEntrenadoresPorSede] = useState({});
  const [horariosPorAsignacion, setHorariosPorAsignacion] = useState({});
  const [estadosMembresia, setEstadosMembresia] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], cliente: [], plan: [], estado: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargarMembresias = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerMembresias(parametros);
      setMembresias(response.datos || []);
      setMeta(response.meta || {});
      if (response.meta?.estados) setEstadosMembresia(response.meta.estados);
    } catch {
      showNotificacion('Error al cargar membresías', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogosFormulario = async () => {
    try {
      const [clientesResponse, planesResponse, estructuraResponse, estadosResponse] = await Promise.all([
        gimnasioServicio.obtenerDeportistas({ per_page: 100 }),
        gimnasioServicio.obtenerPlanes({ per_page: 100 }),
        gimnasioServicio.obtenerEstructuraOperativa(),
        configuracionServicio.obtenerEstados({ entidad: 'MEMBRESIA', activo: true, per_page: 100 }),
      ]);
      setClientes(clientesResponse.datos || []);
      setPlanes(planesResponse.datos || []);
      setSedes(estructuraResponse.datos?.sedes || []);
      setEstadosMembresia(estadosResponse.datos || []);
    } catch {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
    }
  };

  const cargarEntrenadoresSede = async (sedeId) => {
    if (!sedeId) return [];
    if (entrenadoresPorSede[sedeId]) return entrenadoresPorSede[sedeId];

    try {
      const response = await gimnasioServicio.obtenerEntrenadores({ per_page: 100, estado: 'ACTIVO', sede_id: sedeId });
      const datos = response.datos || [];
      setEntrenadoresPorSede((actual) => ({ ...actual, [sedeId]: datos }));
      return datos;
    } catch {
      showNotificacion('No se pudieron cargar los entrenadores de la sede.', 'error');
      return [];
    }
  };

  const cargarHorarios = async (sedeId, entrenadorId) => {
    if (!sedeId || !entrenadorId) return [];
    const clave = `${sedeId}-${entrenadorId}`;
    if (horariosPorAsignacion[clave]) return horariosPorAsignacion[clave];

    try {
      const response = await gimnasioServicio.obtenerTurnosEntrenador(entrenadorId, sedeId);
      const datos = response.datos || [];
      setHorariosPorAsignacion((actual) => ({ ...actual, [clave]: datos }));
      return datos;
    } catch {
      showNotificacion('No se pudieron cargar los horarios del entrenador.', 'error');
      return [];
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargarMembresias();
    else cargarCatalogosFormulario();
  }, [vista]);

  useEffect(() => {
    if (formData.id || !formData.fecha_inicio || !formData.plan_id) return;
    const plan = planes.find((p) => String(p.id) === String(formData.plan_id));
    const nuevaFechaFin = calcularFechaFin(formData.fecha_inicio, plan);
    if (nuevaFechaFin) setFormData((actual) => ({ ...actual, fecha_fin: nuevaFechaFin }));
  }, [formData.fecha_inicio, formData.plan_id, formData.id, planes]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarMembresias(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargarMembresias(nuevosFiltros);
  };

  const handleNuevo = () => {
    setEntrenadoresPorSede({});
    setHorariosPorAsignacion({});
    setFormData({ ...formInicial(), deportista_id: deportistaContextoId });
    setVista('formulario');
  };

  const handleCancelarFormulario = () => {
    if (deportistaContextoId && window.history.length > 1) {
      window.history.back();
      return;
    }
    setVista('lista');
  };

  const handleEditar = (membresia) => {
    const sedesIds = (membresia.sedes_habilitadas || []).map((item) => Number(item.sede_id));
    const asignaciones = (membresia.asignaciones_entrenador || []).map((item) => ({
      sede_id: Number(item.sede_id),
      entrenador_id: Number(item.entrenador_id),
      horario_bloque_id: Number(item.horario_bloque_id),
    }));

    setFormData({
      ...formInicial(),
      ...membresia,
      sede_id: membresia.sede_id || '',
      sedes_habilitadas: sedesIds.length ? sedesIds : (membresia.sede_id ? [Number(membresia.sede_id)] : []),
      asignaciones_entrenador: asignaciones,
      estado: normalizarEstado(membresia.estado_valor || membresia.estado),
      fecha_inicio: limpiarFecha(membresia.fecha_inicio),
      fecha_fin: limpiarFecha(membresia.fecha_fin),
      fecha_congelacion_inicio: limpiarFecha(membresia.fecha_congelacion_inicio),
      fecha_congelacion_fin: limpiarFecha(membresia.fecha_congelacion_fin),
      renovacion_automatica: Boolean(membresia.renovacion_automatica),
    });

    asignaciones.forEach((asignacion) => {
      cargarEntrenadoresSede(asignacion.sede_id);
      cargarHorarios(asignacion.sede_id, asignacion.entrenador_id);
    });

    setVista('formulario');
  };

  const handleChange = (evento) => {
    const { name, value, checked, type } = evento.target;

    setFormData((actual) => {
      const siguiente = { ...actual, [name]: type === 'checkbox' ? checked : value };

      if (name === 'plan_id') {
        const plan = planes.find((item) => String(item.id) === String(value));
        if (!plan?.requiere_entrenador) siguiente.asignaciones_entrenador = [];
        if (!(plan?.generar_venta ?? true)) siguiente.requiere_facturar = false;
      }

      return siguiente;
    });
  };

  const handleSedeHabilitada = (sedeId, habilitada) => {
    const id = Number(sedeId);

    setFormData((actual) => {
      const actuales = (actual.sedes_habilitadas || []).map(Number);
      const siguientes = habilitada
        ? Array.from(new Set([...actuales, id]))
        : actuales.filter((item) => item !== id);
      const sedeActual = Number(actual.sede_id || 0);
      const sedeOperativa = sedeActual && siguientes.includes(sedeActual)
        ? sedeActual
        : (siguientes[0] || '');

      return {
        ...actual,
        sede_id: sedeOperativa,
        sedes_habilitadas: siguientes,
        asignaciones_entrenador: (actual.asignaciones_entrenador || []).filter((a) => siguientes.includes(Number(a.sede_id))),
      };
    });

    if (habilitada) cargarEntrenadoresSede(id);
  };

  const agregarAsignacion = () => {
    const sedeId = Number((formData.sedes_habilitadas || [])[0] || formData.sede_id || 0);
    if (!sedeId) {
      showNotificacion('Selecciona primero una sede habilitada.', 'warning');
      return;
    }

    cargarEntrenadoresSede(sedeId);
    setFormData((actual) => ({
      ...actual,
      asignaciones_entrenador: [
        ...(actual.asignaciones_entrenador || []),
        { sede_id: sedeId, entrenador_id: '', horario_bloque_id: '' },
      ],
    }));
  };

  const actualizarAsignacion = async (indice, campo, valor) => {
    const actuales = [...(formData.asignaciones_entrenador || [])];
    const siguiente = { ...actuales[indice], [campo]: valor };

    if (campo === 'sede_id') {
      siguiente.entrenador_id = '';
      siguiente.horario_bloque_id = '';
      await cargarEntrenadoresSede(Number(valor));
    }

    if (campo === 'entrenador_id') {
      siguiente.horario_bloque_id = '';
      await cargarHorarios(Number(siguiente.sede_id), Number(valor));
    }

    actuales[indice] = siguiente;
    setFormData((actual) => ({ ...actual, asignaciones_entrenador: actuales }));
  };

  const quitarAsignacion = (indice) => {
    setFormData((actual) => ({
      ...actual,
      asignaciones_entrenador: (actual.asignaciones_entrenador || []).filter((_, i) => i !== indice),
    }));
  };

  const handleGuardar = async () => {
    try {
      const planSeleccionado = planes.find((p) => String(p.id) === String(formData.plan_id));

      if (!formData.deportista_id || !formData.plan_id || !formData.fecha_inicio || !(formData.sedes_habilitadas || []).length) {
        showNotificacion('Complete los campos obligatorios y selecciona al menos una sede habilitada.', 'warning');
        return;
      }

      if (planSeleccionado?.requiere_entrenador) {
        if (!(formData.asignaciones_entrenador || []).length) {
          showNotificacion('Este plan requiere al menos una asignación de entrenador.', 'warning');
          return;
        }
        const incompleta = formData.asignaciones_entrenador.some((a) => !a.sede_id || !a.entrenador_id || !a.horario_bloque_id);
        if (incompleta) {
          showNotificacion('Completa sede, entrenador y horario en todas las asignaciones.', 'warning');
          return;
        }
      }

      setGuardando(true);

      const comun = {
        sede_id: Number(formData.sede_id || (formData.sedes_habilitadas || [])[0]) || null,
        sedes_habilitadas: (formData.sedes_habilitadas || []).map(Number),
        asignaciones_entrenador: planSeleccionado?.requiere_entrenador
          ? (formData.asignaciones_entrenador || []).map((a) => ({
              sede_id: Number(a.sede_id),
              entrenador_id: Number(a.entrenador_id),
              horario_bloque_id: Number(a.horario_bloque_id),
            }))
          : [],
        fecha_inicio: formData.fecha_inicio,
        dias_gracia: Number(formData.dias_gracia || 0),
        renovacion_automatica: Boolean(formData.renovacion_automatica),
      };

      if (formData.id) {
        await gimnasioServicio.actualizarMembresia(formData.id, {
          ...comun,
          estado: normalizarEstado(formData.estado),
          fecha_congelacion_inicio: formData.fecha_congelacion_inicio || null,
          fecha_congelacion_fin: formData.fecha_congelacion_fin || null,
        });
        showNotificacion('Membresía actualizada con éxito', 'success');
      } else {
        const respuesta = await gimnasioServicio.crearMembresia({
          ...comun,
          deportista_id: formData.deportista_id,
          plan_id: formData.plan_id,
          generar_venta: Boolean(formData.requiere_facturar && (planSeleccionado?.generar_venta ?? true)),
        });

        const ventaNumero = respuesta.datos?.venta_numero;
        showNotificacion(
          ventaNumero ? `Membresía creada. Venta ${ventaNumero} generada y pendiente de pago.` : 'Membresía creada como pendiente de pago.',
          'success',
        );
      }

      if (deportistaContextoId && !formData.id && window.history.length > 1) {
        window.history.back();
        return;
      }
      setVista('lista');
      cargarMembresias();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores).flat()[0] : null;
      showNotificacion(primerError || error.response?.data?.mensaje || error.response?.data?.message || 'Error al guardar la membresía', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleMembresiaCancelada = () => {
    showNotificacion('Membresía cancelada. El contrato se conserva en el historial.', 'success');
    cargarMembresias();
  };

  const handleErrorCancelarMembresia = (error) => showNotificacion(error.response?.data?.mensaje || 'No se pudo cancelar la membresía', 'error');

  if (vista === 'formulario') {
    const clienteContextual = Boolean(deportistaContextoId && !formData.id);
    const esEdicion = Boolean(formData.id);
    const planSeleccionado = planes.find((p) => String(p.id) === String(formData.plan_id));
    const puedeGenerarVenta = Boolean(planSeleccionado?.generar_venta ?? true);
    const esRenovable = Boolean(planSeleccionado?.renovable ?? true);
    const requiereEntrenador = Boolean(planSeleccionado?.requiere_entrenador);
    const estadoInicial = estadosMembresia.find((estado) => estado.es_inicial) || estadosMembresia.find((estado) => estado.valor_interno === 'PENDIENTE_PAGO');

    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={esEdicion ? 'Editar Membresía' : 'Nueva Membresía'}
          descripcion={esEdicion ? 'Actualiza la vigencia, sedes habilitadas y asignaciones del contrato.' : 'Selecciona las sedes habilitadas y configura el entrenamiento según el plan.'}
          icono={<CardMembershipOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelarFormulario} />}
        />

        <Paper className="page-content-container" elevation={0} sx={{ mt: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#fff', px: { xs: 1.5, md: 2.5 }, py: 2.5 }}>
            <Stack spacing={2}>
              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Datos de la membresía</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                  <TextField select label="Cliente" name="deportista_id" value={formData.deportista_id || ''} onChange={handleChange} required size="small" disabled={esEdicion || clienteContextual} helperText={clienteContextual ? 'Cliente recibido desde su ficha.' : ''}>
                    {clientes.map((cliente) => <MenuItem key={cliente.id} value={cliente.id}>{cliente.usuario_nombre || cliente.name || 'Cliente'} - {cliente.codigo_deportista}</MenuItem>)}
                    {(esEdicion || clienteContextual) && !clientes.find((cliente) => String(cliente.id) === String(formData.deportista_id)) ? <MenuItem value={formData.deportista_id}>{formData.deportista_nombre || 'Cliente seleccionado'}</MenuItem> : null}
                  </TextField>

                  <TextField select label="Plan" name="plan_id" value={formData.plan_id || ''} onChange={handleChange} required size="small" disabled={esEdicion}>
                    {planes.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.nombre} - $${Number(plan.precio_base || 0).toFixed(2)}</MenuItem>)}
                    {esEdicion && !planes.find((plan) => String(plan.id) === String(formData.plan_id)) ? <MenuItem value={formData.plan_id}>{formData.plan_nombre || 'Plan asignado'}</MenuItem> : null}
                  </TextField>

                  <TextField label="Código contrato" value={esEdicion ? formData.codigo_contrato || '' : 'Se genera al guardar'} size="small" disabled helperText="Identificador único generado por el sistema." />

                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: 'text.secondary' }}>
                      Sedes habilitadas *
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        p: 1.15,
                        minHeight: 40,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: '#fff',
                      }}
                    >
                      {sedes.map((sede) => {
                        const sedeId = Number(sede.id_sede);
                        const seleccionada = (formData.sedes_habilitadas || []).map(Number).includes(sedeId);

                        return (
                          <FormControlLabel
                            key={sede.id_sede}
                            sx={{
                              m: 0,
                              pr: 1.25,
                              border: '1px solid',
                              borderColor: seleccionada ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              bgcolor: seleccionada ? 'action.selected' : 'transparent',
                            }}
                            control={
                              <Checkbox
                                size="small"
                                checked={seleccionada}
                                onChange={(e) => handleSedeHabilitada(sedeId, e.target.checked)}
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {sede.nombre}
                              </Typography>
                            }
                          />
                        );
                      })}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Selecciona una o varias sedes donde el cliente podrá utilizar la membresía.
                    </Typography>
                  </Box>

                  <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={formData.fecha_inicio || ''} onChange={handleChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Fecha fin" type="date" value={formData.fecha_fin || ''} size="small" disabled slotProps={{ inputLabel: { shrink: true } }} helperText="Calculada automáticamente según la duración del plan." />

                  {esEdicion ? (
                    <TextField select label="Estado" name="estado" value={normalizarEstado(formData.estado)} onChange={handleChange} required size="small">
                      {estadosMembresia.map((estado) => <MenuItem key={estado.id} value={estado.valor_interno}>{estado.nombre}</MenuItem>)}
                    </TextField>
                  ) : (
                    <TextField label="Estado inicial" value={estadoInicial?.nombre || 'Pendiente de pago'} size="small" disabled helperText="Se activa automáticamente cuando el pago queda confirmado." />
                  )}

                  <TextField label="Días de gracia" name="dias_gracia" type="number" value={formData.dias_gracia ?? 0} onChange={handleChange} size="small" helperText="Acceso adicional después del vencimiento; no cambia la fecha contractual." />
                  <FormControlLabel control={<Switch name="renovacion_automatica" checked={Boolean(formData.renovacion_automatica)} onChange={handleChange} disabled={!esRenovable} />} label={esRenovable ? 'Renovación automática' : 'Plan no renovable'} />
                </Box>
              </Box>

              {requiereEntrenador ? (
                <Box sx={formStyles.seccion}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1} sx={{ mb: 1 }}>
                    <Box>
                      <Typography sx={formStyles.modalSeccionTitulo}>Asignaciones de entrenamiento</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Puedes asignar entrenadores distintos por sede y horario. Solo se muestran opciones válidas para las sedes habilitadas.
                      </Typography>
                    </Box>
                    <Button startIcon={<AddOutlinedIcon />} onClick={agregarAsignacion} sx={dbanuStyles.addButtonRevive}>Añadir asignación</Button>
                  </Stack>

                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {(formData.asignaciones_entrenador || []).map((asignacion, indice) => {
                      const entrenadores = entrenadoresPorSede[Number(asignacion.sede_id)] || [];
                      const claveHorario = `${Number(asignacion.sede_id)}-${Number(asignacion.entrenador_id)}`;
                      const horarios = horariosPorAsignacion[claveHorario] || [];

                      return (
                        <Box key={`${indice}-${asignacion.sede_id}-${asignacion.entrenador_id}`} sx={{ py: 1.25, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr 1.4fr auto' }, gap: 1.2, alignItems: 'center' }}>
                          <TextField select label="Sede" size="small" value={asignacion.sede_id || ''} onChange={(e) => actualizarAsignacion(indice, 'sede_id', Number(e.target.value))}>
                            {(formData.sedes_habilitadas || []).map((sedeId) => {
                              const sede = sedes.find((item) => Number(item.id_sede) === Number(sedeId));
                              return <MenuItem key={sedeId} value={sedeId}>{sede?.nombre || `Sede #${sedeId}`}</MenuItem>;
                            })}
                          </TextField>

                          <TextField select label="Entrenador" size="small" value={asignacion.entrenador_id || ''} onOpen={() => cargarEntrenadoresSede(Number(asignacion.sede_id))} onChange={(e) => actualizarAsignacion(indice, 'entrenador_id', Number(e.target.value))}>
                            <MenuItem value="">Seleccione entrenador</MenuItem>
                            {entrenadores.map((entrenador) => <MenuItem key={entrenador.id} value={entrenador.id}>{entrenador.name || [entrenador.nombres, entrenador.apellidos].filter(Boolean).join(' ')}{entrenador.especialidad ? ` · ${entrenador.especialidad}` : ''}</MenuItem>)}
                          </TextField>

                          <TextField select label="Horario" size="small" value={asignacion.horario_bloque_id || ''} disabled={!asignacion.entrenador_id} onOpen={() => cargarHorarios(Number(asignacion.sede_id), Number(asignacion.entrenador_id))} onChange={(e) => actualizarAsignacion(indice, 'horario_bloque_id', Number(e.target.value))}>
                            <MenuItem value="">Seleccione horario</MenuItem>
                            {horarios.map((horario) => <MenuItem key={horario.id} value={horario.id}>{horario.servicio_nombre} · {horario.dia_semana || 'Días configurados'} · {String(horario.hora_inicio || '').slice(0, 5)}-{String(horario.hora_fin || '').slice(0, 5)}</MenuItem>)}
                          </TextField>

                          <Tooltip title="Quitar asignación">
                            <IconButton color="error" onClick={() => quitarAsignacion(indice)}><DeleteOutlineOutlinedIcon /></IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}

                    {(formData.asignaciones_entrenador || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
                        Este plan requiere entrenador. Añade al menos una asignación por sede/horario.
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>
              ) : null}

              {esEdicion ? (
                <Box sx={formStyles.seccion}>
                  <Typography sx={formStyles.modalSeccionTitulo}>Congelación</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Usa estas fechas solo cuando el contrato deba pausarse temporalmente.</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                    <TextField label="Inicio congelación" name="fecha_congelacion_inicio" type="date" value={formData.fecha_congelacion_inicio || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField label="Fin congelación" name="fecha_congelacion_fin" type="date" value={formData.fecha_congelacion_fin || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  </Box>
                </Box>
              ) : null}
            </Stack>
          </Box>

          {esEdicion ? (
            <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelarFormulario} guardando={guardando} />
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={dbanuStyles.formActions}
              spacing={1}
              justifyContent="flex-end"
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <FormControlLabel
                sx={{ mr: { sm: 'auto' } }}
                control={
                  <Switch
                    checked={Boolean(formData.requiere_facturar)}
                    onChange={(e) => setFormData((actual) => ({ ...actual, requiere_facturar: e.target.checked }))}
                    disabled={!puedeGenerarVenta || guardando}
                  />
                }
                label={puedeGenerarVenta ? '¿Requiere facturar?' : 'Este plan no genera venta'}
              />
              <BotonCancelar onClick={handleCancelarFormulario} disabled={guardando} />
              <BotonGuardar onClick={handleGuardar} guardando={guardando} />
            </Stack>
          )}
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Membresías" descripcion="Contratos asignados a clientes, con plan, sedes habilitadas, vigencia, cobro y estado." icono={<CardMembershipOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || membresias.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <MembresiasTable membresias={membresias} meta={meta} cargando={cargando} filtrosColumna={filtrosColumna} onFiltroColumna={aplicarFiltroColumna} onEditar={handleEditar} onCancelada={handleMembresiaCancelada} onErrorCancelar={handleErrorCancelarMembresia} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargarMembresias(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargarMembresias(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
