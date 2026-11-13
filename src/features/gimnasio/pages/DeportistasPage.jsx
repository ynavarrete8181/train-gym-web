import { useState, useEffect } from 'react';
import { Autocomplete, Box, Button, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Switch, TextField, Typography, Chip, Tooltip, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { formStyles } from '../../../styles/formStyles.js';
import { Stack } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { PestanasEstandar } from '../../../components/common/PestanasEstandar.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PinDropOutlinedIcon from '@mui/icons-material/PinDropOutlined';
import ContactEmergencyOutlinedIcon from '@mui/icons-material/ContactEmergencyOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import SportsIcon from '@mui/icons-material/Sports';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { DeportistasTable } from '../components/DeportistasTable.jsx';
import { SelectorTutor } from '../components/SelectorTutor.jsx';
import { RepresentadosTutor } from '../components/RepresentadosTutor.jsx';
import { HistorialTutores } from '../components/HistorialTutores.jsx';
import { ModalConfirmacion } from '../../../components/common/ModalConfirmacion.jsx';
import { MapaUbicacionPersona } from '../components/MapaUbicacionPersona.jsx';
import { FichaInicialDeportista } from '../components/FichaInicialDeportista.jsx';
import { InformeProgresoDeportista } from '../components/InformeProgresoDeportista.jsx';
import { PruebasRendimientoDeportista } from '../../entrenamiento/components/PruebasRendimientoDeportista.jsx';
import { AsignacionesClienteTable } from '../components/AsignacionesClienteTable.jsx';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { entrenamientoServicio } from '../../entrenamiento/services/entrenamientoServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { CalendarioCuotasPreview, CalendarioCuotasRegistradas, generarVistaPreviaCuotas, periodosParaCubrirFecha } from '../components/CalendarioCuotasPreview.jsx';
import { DetalleMembresiaCliente, MenuSeccionesMembresia, SECCION_NUEVA_MEMBRESIA } from '../components/DetalleMembresiaCliente.jsx';
import { VisorPdf } from '../../../components/common/VisorPdf.jsx';
import { esPaseDiario, membresiaEditable, presentarEstadoMembresia, textoVigenciaPase } from '../components/estadoMembresia.js';
import { CampoActivo } from '../../../components/common/CampoActivo.jsx';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const nombreGeografico = (valor = '') =>
  String(valor).trim().toLocaleLowerCase('es-EC')
    .replace(/(^|[\s(/-])([a-záéíóúñü])/g, (_, espacio, letra) => espacio + letra.toLocaleUpperCase('es-EC'))
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (palabra, offset) => offset === 0 ? palabra : palabra.toLocaleLowerCase('es-EC'));

const tutorVacio = { persona_id: null, tipo_relacion: 'TUTOR', responsable_pago: false };

// La ficha del deportista solo guarda el vínculo; los datos del tutor se editan en su propia ficha.
const mapearTutorDeFicha = (tutor) => (tutor ? {
  persona_id: tutor.persona_id,
  tipo_identificacion: tutor.tipo_identificacion || 'CEDULA',
  identificacion: tutor.identificacion || '',
  nombres: tutor.nombres || '',
  apellidos: tutor.apellidos || '',
  nombre_completo: tutor.nombre_completo || '',
  telefono: tutor.telefono || '',
  email: tutor.email || '',
  direccion: tutor.direccion || '',
  tipo_relacion: tutor.tipo_relacion || 'TUTOR',
  responsable_pago: booleanoBackend(tutor.responsable_pago),
} : { ...tutorVacio });

const esMenorDeEdad = (fecha) => {
  if (!fecha) return false;
  const hoy = hoyEcuador();
  return String(fecha).slice(0, 10) > `${Number(hoy.slice(0, 4)) - 18}${hoy.slice(4)}`;
};

const getInitialForm = () => ({
  id: null,
  persona_id: null,
  tipo_identificacion: 'CEDULA',
  identificacion: '',
  nombres: '',
  apellidos: '',
  email: '',
  direccion: '',
  provincia_codigo: '',
  canton_codigo: '',
  parroquia_codigo: '',
  ubicacion: { latitud: '', longitud: '', referencia: '' },
  codigo_deportista: '',
  fecha_nacimiento: '',
  genero: '',
  telefono: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  observaciones_medicas: '',
  sede_principal_id: '',
  estado: 'ACTIVO',
  tipo_cliente: 'DEPORTISTA',
  tutor_id: null,
  representados: [],
  representados_anteriores: [],
  historial_tutores: [],
  requiere_representante_legal: false,
  representante_legal: { ...tutorVacio },
});

const getInitialAsignacion = () => ({
  entrenador_id: '',
  entrenador_horario_id: '',
  observaciones: '',
});

const SECCIONES_CLIENTE = [
  { id: 'persona', nombre: 'Datos de la persona', descripcion: 'Identificación y datos generales', Icono: BadgeOutlinedIcon },
  { id: 'ubicacion', nombre: 'Ubicación geográfica', descripcion: 'Provincia, cantón, parroquia y mapa', Icono: MapOutlinedIcon },
  { id: 'representante', nombre: 'Tutor', descripcion: 'Tutor y responsable de pago', Icono: ContactEmergencyOutlinedIcon },
  { id: 'contacto', nombre: 'Contacto y observaciones', descripcion: 'Emergencias y notas', Icono: ContactPhoneOutlinedIcon },
];

const TAB_REPRESENTADOS = { value: 'representados', label: 'Representados', icon: <ContactEmergencyOutlinedIcon sx={{ fontSize: 17 }} /> };

const TABS_FICHA = [
  { value: 'datos', label: 'Datos del cliente', icon: <BadgeOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'ficha_inicial', label: 'Ficha inicial', icon: <MonitorWeightOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'membresia', label: 'Membresía', icon: <CardMembershipOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'entrenador', label: 'Entrenador y horario', icon: <SportsIcon sx={{ fontSize: 17 }} /> },
  { value: 'progreso', label: 'Progreso', icon: <MonitorWeightOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'entrenamiento', label: 'Entrenamiento', icon: <FitnessCenterOutlinedIcon sx={{ fontSize: 17 }} /> },
];

const booleanoBackend = (valor) =>
  valor === true || valor === 1 || valor === '1' || valor === 'true' || valor === 't';

const resumirDiasHorario = (diasTexto = '') => {
  const dias = String(diasTexto)
    .split(',')
    .map((dia) => dia.trim().toUpperCase())
    .filter(Boolean);

  const orden = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  const corto = {
    LUNES: 'Lun',
    MARTES: 'Mar',
    MIERCOLES: 'Mié',
    JUEVES: 'Jue',
    VIERNES: 'Vie',
    SABADO: 'Sáb',
    DOMINGO: 'Dom',
  };

  const posiciones = dias.map((dia) => orden.indexOf(dia)).filter((i) => i >= 0);
  const consecutivos = posiciones.length > 1
    && posiciones.every((valor, indice) => indice === 0 || valor === posiciones[indice - 1] + 1);

  if (consecutivos) {
    return `${corto[dias[0]]}–${corto[dias[dias.length - 1]]}`;
  }

  return dias.map((dia) => corto[dia] || dia).join(', ');
};

const hoyISO = () => hoyEcuador();

const getInitialMembresia = () => ({
  id: null,
  plan_id: '',
  modalidad_id: '',
  cantidad_periodos_contratados: 1,
  fecha_fin_solicitada: '',
  fecha_primer_pago: '',
  sede_id: '',
  sedes_habilitadas: [],
  codigo_contrato: '',
  fecha_inicio: hoyISO(),
  fecha_fin: '',
  estado: 'PENDIENTE_PAGO',
  dias_gracia: 0,
  dia_pago: '',
  generar_venta_automatica: false,
  proxima_fecha_cobro: '',
  renovacion_automatica: false,
  congelar_membresia: false,
  fecha_congelacion_inicio: '',
  fecha_congelacion_fin: '',
});

const limpiarFechaMembresia = (valor) => (valor ? String(valor).slice(0, 10) : '');

// Preview alineado con el backend. Si el plan usa modalidades, la duración viene de la modalidad seleccionada.
const calcularFechaFinMembresia = (fechaInicioStr, configuracion) => {
  if (!fechaInicioStr || !configuracion) return '';
  const duracion = Number(configuracion.duracion || 0);
  if (!duracion) return '';

  const partes = String(fechaInicioStr).split('-').map(Number);
  if (partes.length !== 3 || partes.some(valor => !Number.isInteger(valor))) return '';
  const [anio, mes, dia] = partes;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return '';
  const moverMesesSinDesborde = (base, cantidad) => {
    const indiceMes = base.getUTCMonth() + cantidad;
    const primerDiaDestino = new Date(Date.UTC(base.getUTCFullYear(), indiceMes, 1));
    const ultimoDiaDestino = new Date(Date.UTC(
      primerDiaDestino.getUTCFullYear(), primerDiaDestino.getUTCMonth() + 1, 0,
    )).getUTCDate();
    primerDiaDestino.setUTCDate(Math.min(base.getUTCDate(), ultimoDiaDestino));
    return primerDiaDestino;
  };
  switch (configuracion.tipo_duracion) {
    case 'DIAS':
      fecha.setUTCDate(fecha.getUTCDate() + Math.max(duracion - 1, 0));
      break;
    case 'SEMANAS':
      fecha.setUTCDate(fecha.getUTCDate() + (duracion * 7) - 1);
      break;
    case 'MESES': {
      const finExclusivo = moverMesesSinDesborde(fecha, duracion);
      fecha.setTime(finExclusivo.getTime());
      fecha.setUTCDate(fecha.getUTCDate() - 1);
      break;
    }
    case 'ANIOS': {
      const finExclusivo = moverMesesSinDesborde(fecha, duracion * 12);
      fecha.setTime(finExclusivo.getTime());
      fecha.setUTCDate(fecha.getUTCDate() - 1);
      break;
    }
    default:
      return '';
  }
  return fecha.toISOString().slice(0, 10);
};

const calcularProximaFechaCobroPreview = (fechaInicioStr, diaPagoValor) => {
  if (!fechaInicioStr || !diaPagoValor) return '';

  const inicio = new Date(`${fechaInicioStr}T00:00:00`);
  const diaPago = Math.max(1, Math.min(31, Number(diaPagoValor)));

  const construirFecha = (anio, mes) => {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return new Date(anio, mes, Math.min(diaPago, ultimoDia));
  };

  let candidata = construirFecha(inicio.getFullYear(), inicio.getMonth());
  if (candidata < inicio) {
    const siguiente = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    candidata = construirFecha(siguiente.getFullYear(), siguiente.getMonth());
  }

  const anio = candidata.getFullYear();
  const mes = String(candidata.getMonth() + 1).padStart(2, '0');
  const dia = String(candidata.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const precioAplicableMembresia = (plan, modalidad, sedeId) => {
  if (!plan) return null;

  if (modalidad) {
    const precioModalidadSede = (modalidad.precios_sede || [])
      .find((p) => String(p.sede_id) === String(sedeId));

    return precioModalidadSede
      ? Number(precioModalidadSede.precio)
      : Number(modalidad.precio_base || 0);
  }

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
  const [seccionCliente, setSeccionCliente] = useState('persona');
  const [dialogoQuitarTutor, setDialogoQuitarTutor] = useState(false);
  const [motivoQuitarTutor, setMotivoQuitarTutor] = useState('');
  const [quitandoTutor, setQuitandoTutor] = useState(false);
  const [mostrarMapaCliente, setMostrarMapaCliente] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [diagnosticoIdentidad, setDiagnosticoIdentidad] = useState(null);
  const [consultandoIdentidad, setConsultandoIdentidad] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const [deportistas, setDeportistas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [parroquias, setParroquias] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ cedula: [], nombres: [], telefono: [], tipo_cliente: [], estado: [] });
  const [cargando, setCargando] = useState(true);

  // Ficha del cliente (pestañas: datos / entrenador y horario)
  const [tabFicha, setTabFicha] = useState('datos');
  const [membresiasCliente, setMembresiasCliente] = useState([]);
  const [vistaMembresia, setVistaMembresia] = useState('listado');
  const [membresiaDetalle, setMembresiaDetalle] = useState(null);
  const [resumenPdf, setResumenPdf] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [descuentoMembresia, setDescuentoMembresia] = useState({ tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: '', fecha_fin: '' });
  const [requiereDescuento, setRequiereDescuento] = useState(false);
  // Descuentos de una membresía nueva: se agregan de uno en uno y se guardan con la membresía.
  const [descuentosNuevos, setDescuentosNuevos] = useState([]);
  const [conDescuentos, setConDescuentos] = useState(false);
  const [seccionNueva, setSeccionNueva] = useState('nueva');
  const [verSedesConDescuento, setVerSedesConDescuento] = useState(false);
  const [buscarMembresia, setBuscarMembresia] = useState('');
  const [paginaMembresia, setPaginaMembresia] = useState(1);
  const [porPaginaMembresia, setPorPaginaMembresia] = useState(5);
  const [filtrosMembresia, setFiltrosMembresia] = useState({ plan: [], vigencia: [], precio: [], estado: [] });
  const [filtrosAsignacion, setFiltrosAsignacion] = useState({ entrenador: [], disponibilidad: [], sede: [], vigencia: [], estado: [] });
  const [entrenadoresDisp, setEntrenadoresDisp] = useState([]);
  const [turnosEntrenador, setTurnosEntrenador] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [vistaAsignacion, setVistaAsignacion] = useState('listado');
  const [buscarAsignacion, setBuscarAsignacion] = useState('');
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
      const response = await gimnasioServicio.obtenerDeportistas({ ...parametros, incluir_tutores: 1 });
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
      const [estructuraResponse, planesResponse, ejerciciosResponse] = await Promise.all([
        gimnasioServicio.obtenerEstructuraOperativa(),
        gimnasioServicio.obtenerPlanes({ per_page: 100 }),
        entrenamientoServicio.obtenerEjercicios({ per_page: 100 }),
      ]);
      setSedes(estructuraResponse.datos?.sedes || []);
      setPlanes(planesResponse.datos || []);
      setEjerciciosDisp(ejerciciosResponse.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
    }
  };

  useEffect(() => {
    gimnasioServicio.obtenerProvincias()
      .then((respuesta) => setProvincias(respuesta.datos || []))
      .catch(() => setProvincias([]));
  }, []);

  useEffect(() => {
    if (!formData.provincia_codigo) { setCantones([]); return undefined; }
    let activo = true;
    gimnasioServicio.obtenerCantones(formData.provincia_codigo)
      .then((res) => { if (activo) setCantones(res.datos || []); })
      .catch(() => { if (activo) setCantones([]); });
    return () => { activo = false; };
  }, [formData.provincia_codigo]);

  useEffect(() => {
    if (!formData.canton_codigo) { setParroquias([]); return undefined; }
    let activo = true;
    gimnasioServicio.obtenerParroquias(formData.canton_codigo)
      .then((res) => { if (activo) setParroquias(res.datos || []); })
      .catch(() => { if (activo) setParroquias([]); });
    return () => { activo = false; };
  }, [formData.canton_codigo]);

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
    const inicial = getInitialForm();
    setFormData({
      ...inicial,
      requiere_representante_legal: false,
      representante_legal: {
        ...inicial.representante_legal,
        responsable_pago: false,
      },
    });
    setSeccionCliente('persona');
    setMostrarMapaCliente(false);
    setVista('formulario');
  };

  const handleCancelar = () => {
    setVista('lista');
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name === 'provincia_codigo') {
      setFormData(prev => ({ ...prev, provincia_codigo: value, canton_codigo: '', parroquia_codigo: '' }));
      return;
    }
    if (name === 'canton_codigo') {
      setFormData(prev => ({ ...prev, canton_codigo: value, parroquia_codigo: '' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...((name === 'requiere_representante_legal' && !checked) || (name === 'tipo_cliente' && value !== 'DEPORTISTA')
        ? { requiere_representante_legal: false, representante_legal: { ...tutorVacio } }
        : {}),
    }));
  };

  const handleRepresentanteChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      representante_legal: {
        ...(prev.representante_legal || {}),
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleSeleccionarTutor = (tutor) => {
    setFormData((prev) => ({
      ...prev,
      representante_legal: tutor
        ? { ...mapearTutorDeFicha(tutor), tipo_relacion: prev.representante_legal?.tipo_relacion || 'TUTOR', responsable_pago: Boolean(prev.representante_legal?.responsable_pago) }
        : { ...tutorVacio },
    }));
  };

  // Devuelve el motivo que impide guardar el tutor del cliente, si existe.
  const validarTutorCliente = () => {
    if (formData.tipo_cliente !== 'DEPORTISTA') {
      if (formData.tipo_cliente === 'TUTOR' && !String(formData.identificacion || '').trim()) return 'La identificación del tutor es obligatoria.';
      if (esMenorDeEdad(formData.fecha_nacimiento)) return 'Un tutor debe ser mayor de edad.';
      return null;
    }
    if (esMenorDeEdad(formData.fecha_nacimiento) && !formData.requiere_representante_legal) {
      setSeccionCliente('representante');
      return 'El cliente es menor de edad: selecciona su tutor.';
    }
    if (formData.requiere_representante_legal && !formData.representante_legal?.persona_id) {
      setSeccionCliente('representante');
      return 'Selecciona el tutor del cliente.';
    }
    return null;
  };

  // Solo se puede quitar el tutor ya guardado de un cliente mayor de edad.
  const tutorVigente = (formData.historial_tutores || []).find((item) => item.activo);
  const puedeQuitarTutor = Boolean(formData.id) && Boolean(tutorVigente) && !esMenorDeEdad(formData.fecha_nacimiento);

  const confirmarQuitarTutor = async () => {
    setQuitandoTutor(true);
    try {
      const respuesta = await gimnasioServicio.quitarTutorCliente(formData.id, motivoQuitarTutor);
      const datos = respuesta.datos || {};
      setFormData((prev) => ({
        ...prev,
        requiere_representante_legal: booleanoBackend(datos.requiere_representante_legal),
        representante_legal: mapearTutorDeFicha(datos.representante_legal),
        historial_tutores: datos.historial_tutores || [],
      }));
      setDialogoQuitarTutor(false);
      setMotivoQuitarTutor('');
      showNotificacion('Tutor quitado. El vínculo queda en el historial.', 'success');
    } catch (error) {
      const errores = error.response?.data?.errors || error.response?.data?.errores;
      showNotificacion((errores ? Object.values(errores).flat().join(' ') : '') || error.response?.data?.mensaje || 'No se pudo quitar el tutor.', 'error');
    } finally {
      setQuitandoTutor(false);
    }
  };

  const payloadPersonaTutor = () => ({
    estado: formData.estado || 'ACTIVO',
    tipo_cliente: formData.tipo_cliente,
    persona: {
      tipo_identificacion: formData.tipo_identificacion || null,
      identificacion: formData.identificacion || null,
      nombres: formData.nombres || '',
      apellidos: formData.apellidos || '',
      fecha_nacimiento: formData.fecha_nacimiento || null,
      genero: formData.genero || null,
      telefono: formData.telefono || null,
      email: formData.email || null,
      direccion: formData.direccion || null,
      provincia_codigo: formData.provincia_codigo || null,
      canton_codigo: formData.canton_codigo || null,
      parroquia_codigo: formData.parroquia_codigo || null,
    },
    ubicacion: formData.ubicacion?.latitud != null && formData.ubicacion.latitud !== ''
      && formData.ubicacion?.longitud != null && formData.ubicacion.longitud !== ''
      ? { latitud: Number(formData.ubicacion.latitud), longitud: Number(formData.ubicacion.longitud), referencia: formData.ubicacion.referencia || null }
      : null,
  });

  const handleGuardar = async () => {
    if (guardandoCliente) return;
    setGuardandoCliente(true);
    try {
      if (!String(formData.nombres || '').trim()) {
        showNotificacion('Ingresa al menos los nombres de la persona.', 'warning');
        return;
      }

      const motivoTutor = validarTutorCliente();
      if (motivoTutor) {
        showNotificacion(motivoTutor, 'warning');
        return;
      }

      if (formData.tipo_cliente === 'TUTOR') {
        const respuesta = await gimnasioServicio.crearTutor(payloadPersonaTutor());
        handleAbrirFicha(respuesta.datos);
        showNotificacion('Tutor registrado. Ya puedes seleccionarlo en la ficha de cada deportista.', 'success');
        return;
      }

      const payload = {
        ...formData,
        usuario_id: formData.usuario_id || null,
        persona: {
          tipo_identificacion: formData.tipo_identificacion || null,
          identificacion: formData.identificacion || null,
          nombres: formData.nombres || '',
          apellidos: formData.apellidos || '',
          fecha_nacimiento: formData.fecha_nacimiento || null,
          genero: formData.genero || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          direccion: formData.direccion || null,
          provincia_codigo: formData.provincia_codigo || null,
          canton_codigo: formData.canton_codigo || null,
          parroquia_codigo: formData.parroquia_codigo || null,
        },
        ubicacion: formData.ubicacion?.latitud !== '' && formData.ubicacion?.longitud !== ''
          ? { latitud: Number(formData.ubicacion.latitud), longitud: Number(formData.ubicacion.longitud), referencia: formData.ubicacion.referencia || null }
          : null,
        requiere_representante_legal: Boolean(formData.requiere_representante_legal),
        representante_legal: formData.requiere_representante_legal
          ? {
              ...formData.representante_legal,
              responsable_pago: Boolean(formData.representante_legal?.responsable_pago),
            }
          : null,
      };

      if (formData.id) {
        await gimnasioServicio.actualizarDeportista(formData.id, payload);
        showNotificacion('Cliente actualizado correctamente.', 'success');
        setVista('lista');
      } else {
        const respuesta = await gimnasioServicio.crearDeportista(payload);
        const creado = respuesta?.datos;
        if (creado?.id) {
          handleAbrirFicha(creado);
          showNotificacion('Cliente registrado. Puedes completar su ficha inicial, membresía y entrenador.', 'success');
        } else {
          setVista('lista');
          showNotificacion('Cliente registrado, pero no se recibió su identificador para abrir la ficha.', 'warning');
        }
      }
    } catch (error) {
      const errores = error.response?.data?.errors || error.response?.data?.errores;
      const detalle = errores ? Object.values(errores).flat().join(' ') : '';
      showNotificacion(detalle || error.response?.data?.mensaje || error.response?.data?.message || 'Error al guardar el cliente', 'error');
    } finally {
      setGuardandoCliente(false);
    }
  };

  // --- Ficha del cliente ---

  const cargarAsignacionesYEntrenadores = async (deportistaId) => {
    try {
      const [entrenadoresResp, asignacionesResp] = await Promise.all([
        gimnasioServicio.obtenerEntrenadores({ per_page: 100, estado: 'ACTIVO' }),
        gimnasioServicio.obtenerAsignacionesEntrenador({ deportista_id: deportistaId, estado: 'TODOS' }),
      ]);
      const todas = asignacionesResp.datos || [];
      setEntrenadoresDisp(entrenadoresResp.datos || []);
      setAsignaciones(todas);
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
      const detalle = deportista.id
        ? await gimnasioServicio.obtenerDeportistaPorId(deportista.id)
        : await gimnasioServicio.obtenerTutor(deportista.tutor_id);
      const datos = detalle.datos || {};
      setFormData({
        ...getInitialForm(),
        ...datos,
        tipo_identificacion: datos.tipo_identificacion || 'CEDULA',
        identificacion: datos.identificacion || '',
        nombres: datos.nombres || datos.nombre_completo || '',
        apellidos: datos.apellidos || '',
        fecha_nacimiento: datos.persona_fecha_nacimiento || datos.fecha_nacimiento || '',
        genero: datos.persona_genero || datos.genero || '',
        telefono: datos.persona_telefono || datos.telefono || '',
        email: datos.persona_email || '',
        direccion: datos.persona_direccion || '',
        provincia_codigo: datos.provincia_codigo || '',
        canton_codigo: datos.canton_codigo || '',
        parroquia_codigo: datos.parroquia_codigo || '',
        ubicacion: {
          latitud: datos.ubicacion?.latitud ?? '',
          longitud: datos.ubicacion?.longitud ?? '',
          referencia: datos.ubicacion?.referencia || '',
        },
        requiere_representante_legal: booleanoBackend(datos.requiere_representante_legal),
        representante_legal: mapearTutorDeFicha(datos.representante_legal),
      });
      if (!deportista.id) return;
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

  // Cada entrada a una pestaña vuelve a su vista principal y consulta datos vigentes.
  const handleCambiarTabFicha = async (_evento, siguienteTab) => {
    setTabFicha(siguienteTab);
    setVistaMembresia('listado');
    setVistaAsignacion('listado');
    setMembresiaForm(getInitialMembresia());
    setAsignacionForm(getInitialAsignacion());
    setRequiereDescuento(false);
    setDescuentoMembresia({ tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: '', fecha_fin: '', sede_id: '' }); setDescuentosNuevos([]); setConDescuentos(false); setSeccionNueva('nueva');
    setTurnosEntrenador([]);

    if (!formData.id) return;

    if (siguienteTab === 'membresia') {
      try {
        const respuesta = await gimnasioServicio.obtenerDeportistaPorId(formData.id);
        setMembresiasCliente(respuesta.datos?.membresias || []);
      } catch (error) {
        showNotificacion(error.response?.data?.mensaje || 'No se pudieron actualizar las membresías.', 'error');
      }
    } else if (siguienteTab === 'entrenador') {
      await cargarAsignacionesYEntrenadores(formData.id);
    } else if (siguienteTab === 'progreso') {
      await cargarProgresoCliente(formData.id);
    } else if (siguienteTab === 'entrenamiento') {
      await cargarEntrenamientoCliente(formData.id);
    }
    // Ficha inicial realiza su consulta al montarse en la pestaña.
  };

  const handleAbrirFicha = (deportista) => {
    setDiagnosticoIdentidad(null);
    setFormData({ ...deportista });
    setTabFicha('datos');
    setVistaMembresia('listado');
    setVistaAsignacion('listado');
    setRequiereDescuento(false);
    setDescuentoMembresia({ tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: '', fecha_fin: '', sede_id: '' }); setDescuentosNuevos([]); setConDescuentos(false); setSeccionNueva('nueva');
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

  const consultarIdentidad = async () => {
    if (!formData.id || consultandoIdentidad) return;
    setConsultandoIdentidad(true);
    try {
      const respuesta = await gimnasioServicio.diagnosticarIdentidadCliente(formData.id);
      setDiagnosticoIdentidad(respuesta.datos || null);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo consultar la identidad del cliente.', 'error');
    } finally {
      setConsultandoIdentidad(false);
    }
  };

  const handleCancelarFicha = () => {
    setVista('lista');
  };

  const handleGuardarDatosFicha = async () => {
    const motivoTutor = validarTutorCliente();
    if (motivoTutor) {
      showNotificacion(motivoTutor, 'warning');
      return;
    }
    try {
      if (!formData.id) {
        const respuesta = await gimnasioServicio.actualizarTutor(formData.tutor_id, payloadPersonaTutor());
        const tutor = respuesta.datos;
        if (tutor?.id) {
          handleAbrirFicha(tutor);
          showNotificacion('Ficha de deportista creada. Ya puedes completar sus datos y su membresía.', 'success');
        } else {
          showNotificacion('Tutor actualizado.', 'success');
          cargarFicha(tutor);
        }
        cargarDeportistas();
        return;
      }
      await gimnasioServicio.actualizarDeportista(formData.id, {
        ...formData,
        persona: {
          tipo_identificacion: formData.tipo_identificacion || null,
          identificacion: formData.identificacion || null,
          nombres: formData.nombres || '',
          apellidos: formData.apellidos || '',
          fecha_nacimiento: formData.fecha_nacimiento || null,
          genero: formData.genero || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          direccion: formData.direccion || null,
          provincia_codigo: formData.provincia_codigo || null,
          canton_codigo: formData.canton_codigo || null,
          parroquia_codigo: formData.parroquia_codigo || null,
        },
        ubicacion: formData.ubicacion?.latitud != null && formData.ubicacion.latitud !== ''
          && formData.ubicacion?.longitud != null && formData.ubicacion.longitud !== ''
          ? { latitud: Number(formData.ubicacion.latitud), longitud: Number(formData.ubicacion.longitud), referencia: formData.ubicacion.referencia || null }
          : null,
        requiere_representante_legal: Boolean(formData.requiere_representante_legal),
        representante_legal: formData.requiere_representante_legal
          ? {
              ...formData.representante_legal,
              responsable_pago: Boolean(formData.representante_legal?.responsable_pago),
            }
          : null,
      });
      const actualizado = await gimnasioServicio.obtenerDeportistaPorId(formData.id);
      const datosActualizados = actualizado.datos || {};
      setFormData((actual) => ({
        ...actual,
        ...datosActualizados,
        nombres: datosActualizados.nombres || datosActualizados.nombre_completo || actual.nombres,
        apellidos: datosActualizados.apellidos || '',
        identificacion: datosActualizados.identificacion || '',
        fecha_nacimiento: datosActualizados.persona_fecha_nacimiento || datosActualizados.fecha_nacimiento || '',
        genero: datosActualizados.persona_genero || datosActualizados.genero || '',
        telefono: datosActualizados.persona_telefono || datosActualizados.telefono || '',
        email: datosActualizados.persona_email || '',
        direccion: datosActualizados.persona_direccion || '',
        requiere_representante_legal: booleanoBackend(datosActualizados.requiere_representante_legal),
        representante_legal: mapearTutorDeFicha(datosActualizados.representante_legal),
      }));
      showNotificacion('Datos del cliente actualizados', 'success');
      cargarDeportistas();
    } catch (error) {
      const errores = error.response?.data?.errors || error.response?.data?.errores;
      const detalle = errores ? Object.values(errores).flat().join(' ') : null;
      const mensajeServidor = error.response?.data?.mensaje || error.response?.data?.message;
      const estado = error.response?.status;
      showNotificacion(
        detalle || mensajeServidor || (estado
          ? `No se pudo actualizar el cliente (HTTP ${estado}). Revisa el registro de Laravel.`
          : 'No se pudo conectar con el servidor al guardar el cliente.'),
        'error',
      );
    }
  };

  const handleAsignacionEntrenadorChange = async (e) => {
    const entrenadorId = e.target.value;
    setAsignacionForm(prev => ({ ...prev, entrenador_id: entrenadorId, entrenador_horario_id: '' }));
    if (!entrenadorId) { setTurnosEntrenador([]); return; }
    try {
      const response = await gimnasioServicio.obtenerTurnosEntrenador(entrenadorId);
      const horarios = response.datos || [];
      setTurnosEntrenador(horarios);
      setAsignacionForm((prev) => ({
        ...prev,
        entrenador_horario_id: horarios.length === 1 ? horarios[0].id : '',
      }));
    } catch (error) {
      showNotificacion('Error al cargar los turnos del entrenador', 'error');
    }
  };

  const handleAsignacionChange = (e) => {
    const { name, value } = e.target;
    setAsignacionForm(prev => ({ ...prev, [name]: value, ...(name === 'observaciones' ? { observaciones_editada: true } : {}) }));
  };

  const handleGuardarAsignacion = async () => {
    if (!asignacionForm.entrenador_id || !asignacionForm.entrenador_horario_id) {
      showNotificacion('Selecciona un entrenador y un turno', 'warning');
      return;
    }
    const membresiaCompatible = membresiasCliente.find((membresia) =>
      booleanoBackend(membresia.requiere_entrenador)
      && String(membresia.estado || '').toUpperCase() === 'ACTIVA'
    );
    if (!membresiaCompatible) {
      showNotificacion('El cliente no tiene una membresía activa que incluya entrenador. Revisa el plan contratado en Membresía.', 'warning');
      return;
    }
    const horarioSeleccionado = turnosEntrenador.find(
      (horario) => String(horario.id) === String(asignacionForm.entrenador_horario_id),
    );
    const sedeHorario = (horarioSeleccionado?.franjas || []).find(
      (franja) => String(franja.sede_id) === String(membresiaCompatible.sede_id),
    )?.sede_id || membresiaCompatible.sede_id;
    try {
      await gimnasioServicio.crearAsignacionEntrenador({
        entrenador_id: Number(asignacionForm.entrenador_id),
        deportista_id: formData.id,
        entrenador_horario_id: Number(asignacionForm.entrenador_horario_id),
        membresia_id: Number(membresiaCompatible.id),
        sede_id: Number(sedeHorario),
        observaciones: observacionesAsignacion || null,
      });
      showNotificacion('Cliente asignado correctamente', 'success');
      setAsignacionForm(getInitialAsignacion());
      setTurnosEntrenador([]);
      cargarAsignacionesYEntrenadores(formData.id);
      setVistaAsignacion('listado');
    } catch (error) {
      const errores = error.response?.data?.errors || error.response?.data?.errores;
      const mensaje = errores
        ? Object.values(errores).flat().join(' ')
        : (
            error.response?.data?.message
            || error.response?.data?.mensaje
            || 'Error al asignar el entrenador'
          );
      showNotificacion(mensaje, 'error');
    }
  };

  const handleFinalizarAsignacion = async (asignacion) => {
    const confirmado = await confirmarAccion({
      titulo: 'Finalizar asignación',
      texto: 'Se finalizará la asignación de este entrenador, se liberará su cupo y el historial permanecerá disponible.',
      textoConfirmar: 'Sí, finalizar',
      icono: 'warning',
    });
    if (!confirmado) return;

    try {
      await gimnasioServicio.finalizarAsignacionEntrenador(asignacion.id);
      showNotificacion('Asignación finalizada. El historial se conserva.', 'success');
      await cargarAsignacionesYEntrenadores(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors || error.response?.data?.errores;
      showNotificacion(
        (errores ? Object.values(errores).flat().join(' ') : null)
          || error.response?.data?.mensaje
          || error.response?.data?.message
          || 'No se pudo finalizar la asignación.',
        'error',
      );
    }
  };

  // --- Membresía (dentro de la ficha del cliente) ---

  useEffect(() => {
    if (membresiaForm.id) return;
    if (!membresiaForm.fecha_inicio || !membresiaForm.plan_id) return;

    const plan = planes.find((p) => String(p.id) === String(membresiaForm.plan_id));
    if (!plan) return;

    const modalidadesActivas = (plan.modalidades || [])
      .filter((modalidad) => booleanoBackend(modalidad.activo));
    const modalidad = modalidadesActivas.find(
      (item) => String(item.id) === String(membresiaForm.modalidad_id),
    );

    if (booleanoBackend(plan.requiere_modalidades) && !modalidad) {
      setMembresiaForm((actual) => ({ ...actual, fecha_fin: '' }));
      return;
    }

    const nuevaFechaFin = calcularFechaFinMembresia(
      membresiaForm.fecha_inicio,
      modalidad || plan,
    );

    if (nuevaFechaFin) {
      setMembresiaForm((actual) => ({ ...actual, fecha_fin: nuevaFechaFin }));
    }
  }, [
    membresiaForm.fecha_inicio,
    membresiaForm.plan_id,
    membresiaForm.modalidad_id,
    membresiaForm.id,
    planes,
  ]);

  const handleMembresiaChange = (e) => {
    const { name, value, checked, type } = e.target;

    setMembresiaForm((actual) => {
      const nuevoValor = type === 'checkbox' ? checked : value;

      if (name === 'fecha_inicio') {
        return { ...actual, fecha_inicio: nuevoValor };
      }
      if (name === 'congelar_membresia') {
        return {
          ...actual,
          congelar_membresia: checked,
          fecha_congelacion_inicio: checked ? actual.fecha_congelacion_inicio : '',
          fecha_congelacion_fin: checked ? actual.fecha_congelacion_fin : '',
        };
      }

      if (name === 'plan_id') {
        return {
          ...actual,
          plan_id: nuevoValor,
          modalidad_id: '',
          fecha_fin: '',
          cantidad_periodos_contratados: 1,
        };
      }

      if (name === 'sede_id') {
        const sedeSeleccionada = Number(nuevoValor);
        return { ...actual, sede_id: nuevoValor,
          sedes_habilitadas: Array.from(new Set([...(actual.sedes_habilitadas || []).map(Number), sedeSeleccionada])).filter(Boolean) };
      }
      if (name === 'cantidad_periodos_contratados') {
        return { ...actual, cantidad_periodos_contratados: nuevoValor };
      }
      return { ...actual, [name]: nuevoValor };
    });
  };

  const handleNuevaMembresia = () => {
    setMembresiaDetalle(null);
    setMembresiaForm(getInitialMembresia());
    setDescuentoMembresia({ tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: '', fecha_fin: '', sede_id: '' }); setDescuentosNuevos([]); setConDescuentos(false); setSeccionNueva('nueva');
    setRequiereDescuento(false);
    setVistaMembresia('formulario');
  };

  const handleEditarMembresia = (m) => {
    const descuentoActual = m.descuento_vigente;
    setRequiereDescuento(Boolean(descuentoActual));
    setDescuentoMembresia(descuentoActual ? {
      id: descuentoActual.id,
      tipo: descuentoActual.tipo,
      valor: descuentoActual.valor,
      motivo: descuentoActual.motivo || '',
      fecha_inicio: limpiarFechaMembresia(descuentoActual.fecha_inicio),
      fecha_fin: limpiarFechaMembresia(descuentoActual.fecha_fin),
    } : { tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: '', fecha_fin: '' });
    setVistaMembresia('formulario');
    setMembresiaForm({
      ...m,
      sedes_habilitadas: Array.from(new Set([
        ...(m.sedes_habilitadas || []).map((item) => Number(item.sede_id || item)),
        Number(m.sede_id),
      ].filter(Boolean))),
      fecha_inicio: limpiarFechaMembresia(m.fecha_inicio),
      fecha_fin: limpiarFechaMembresia(m.fecha_fin),
      fecha_congelacion_inicio: limpiarFechaMembresia(m.fecha_congelacion_inicio),
      fecha_congelacion_fin: limpiarFechaMembresia(m.fecha_congelacion_fin),
      renovacion_automatica: Boolean(m.renovacion_automatica),
      generar_venta_automatica: Boolean(m.generar_venta_automatica),
      dia_pago: m.dia_pago ?? '',
      proxima_fecha_cobro: limpiarFechaMembresia(m.proxima_fecha_cobro),
      congelar_membresia: Boolean(m.fecha_congelacion_inicio || m.fecha_congelacion_fin),
    });
  };

  const abrirResumenContrato = async (m) => {
    setResumenPdf(null);
    setCargandoResumen(true);
    try {
      const blob = await gimnasioServicio.obtenerResumenContratoPdf(m.id);
      setResumenPdf({ blob, url: URL.createObjectURL(blob), nombre: `contrato-${m.codigo_contrato || m.id}.pdf` });
    } catch (error) {
      showNotificacion('No se pudo generar el resumen del contrato.', 'error');
    } finally {
      setCargandoResumen(false);
    }
  };

  const cerrarResumenContrato = () => {
    if (resumenPdf?.url) URL.revokeObjectURL(resumenPdf.url);
    setResumenPdf(null);
  };

  const handleGuardarMembresia = async () => {
    let membresiaCreada = null;
    try {
      if (!membresiaForm.plan_id || !membresiaForm.fecha_inicio) {
        showNotificacion('Completa los campos obligatorios de la membresía', 'warning');
        return;
      }

      if (!(membresiaForm.sedes_habilitadas || []).length) {
        showNotificacion('Selecciona al menos una sede autorizada.', 'warning');
        return;
      }

      const planSeleccionado = planes.find((plan) => String(plan.id) === String(membresiaForm.plan_id));
      if (booleanoBackend(planSeleccionado?.requiere_modalidades) && !membresiaForm.modalidad_id) {
        showNotificacion('Selecciona una modalidad para este plan.', 'warning');
        return;
      }

      if (membresiaForm.id && membresiaForm.generar_venta_automatica && !membresiaForm.dia_pago) {
        showNotificacion('Selecciona el día habitual de pago para generar la venta automáticamente', 'warning');
        return;
      }

      const contratoNuevo = !membresiaForm.id && String(planSeleccionado?.tipo_producto || '').toUpperCase() !== 'PASE_DIARIO';
      const modalidadSeleccionada = (planSeleccionado?.modalidades || [])
        .find((modalidad) => String(modalidad.id) === String(membresiaForm.modalidad_id));
      const cantidadCalculada = contratoNuevo ? periodosParaCubrirFecha({
        inicio: membresiaForm.fecha_inicio,
        objetivo: membresiaForm.fecha_fin_solicitada,
        tipo: modalidadSeleccionada?.tipo_duracion || planSeleccionado?.tipo_duracion,
        duracion: modalidadSeleccionada?.duracion || planSeleccionado?.duracion,
      }) : null;
      if (contratoNuevo && !cantidadCalculada) {
        showNotificacion('Ingresa una fecha fin válida, dentro de los 36 períodos permitidos.', 'warning'); return;
      }
      if (contratoNuevo && (!Number.isInteger(Number(membresiaForm.dia_pago))
        || Number(membresiaForm.dia_pago) < 1 || Number(membresiaForm.dia_pago) > 31)) {
        showNotificacion('Ingresa un día de pago válido, del 1 al 31.', 'warning'); return;
      }
      if (contratoNuevo) {
        const cuotasPropuestas = generarVistaPreviaCuotas({
          inicio: membresiaForm.fecha_inicio,
          diaPago: membresiaForm.dia_pago,
          cantidad: cantidadCalculada,
          tipo: modalidadSeleccionada?.tipo_duracion || planSeleccionado?.tipo_duracion,
          duracion: modalidadSeleccionada?.duracion || planSeleccionado?.duracion,
        });
        if (cuotasPropuestas.some((cuota) => cuota.vencimiento > cuota.fin)) {
          showNotificacion('Una cuota vence después de su período. Ajusta la fecha de pago o selecciona una modalidad mensual.', 'warning');
          return;
        }
      }
      if (!membresiaForm.id && String(planSeleccionado?.tipo_producto || '').toUpperCase() === 'PASE_DIARIO' && !membresiaForm.vigencia_fin) {
        showNotificacion('Indica la fecha de fin de la vigencia del pase.', 'warning');
        return;
      }
      const payload = {
        ...membresiaForm,
        fecha_fin_solicitada: undefined,
        fecha_primer_pago: contratoNuevo ? undefined : membresiaForm.fecha_primer_pago,
        // Solo un contrato nuevo lleva calendario de cuotas; un pase diario no.
        cantidad_periodos_contratados: contratoNuevo ? cantidadCalculada
          : (membresiaForm.id ? membresiaForm.cantidad_periodos_contratados : undefined),
        // El servidor fija fecha_fin según los períodos completos.
        fecha_fin: contratoNuevo ? undefined : membresiaForm.fecha_fin,
        // Los movimientos de congelación y reactivación tienen endpoints auditados.
        // Nunca se realizan mediante la actualización general del contrato.
        congelar_membresia: undefined,
        fecha_congelacion_inicio: undefined,
        fecha_congelacion_fin: undefined,
        deportista_id: formData.id,
        modalidad_id: membresiaForm.modalidad_id ? Number(membresiaForm.modalidad_id) : null,
        sede_id: (membresiaForm.sedes_habilitadas || []).map(Number).includes(Number(membresiaForm.sede_id))
          ? Number(membresiaForm.sede_id)
          : Number(membresiaForm.sedes_habilitadas?.[0] || 0),
        sedes_habilitadas: Array.from(new Set((membresiaForm.sedes_habilitadas || []).map(Number))).filter(Boolean),
        dias_gracia: Number(membresiaForm.dias_gracia || 0),
        dia_pago: membresiaForm.dia_pago ? Number(membresiaForm.dia_pago) : null,
        generar_venta_automatica: contratoNuevo ? false : Boolean(membresiaForm.generar_venta_automatica),

        proxima_fecha_cobro: undefined,
        renovacion_automatica: Boolean(membresiaForm.renovacion_automatica),
      };
      if (!membresiaForm.id) {
        delete payload.fecha_congelacion_inicio;
        delete payload.fecha_congelacion_fin;
        delete payload.estado; // Lo establece Laravel según las reglas del plan y del pago.
      }
      if (membresiaForm.id && membresiaForm.cantidad_periodos_contratados != null) {
        // Contrato existente: no enviar condiciones inmutables al endpoint
        // administrativo. Laravel conserva el calendario y las ventas emitidas.
        delete payload.fecha_inicio;
        delete payload.modalidad_id;
        delete payload.dia_pago;
        delete payload.generar_venta_automatica;
        delete payload.cantidad_periodos_contratados;
        delete payload.fecha_primer_pago;
      }


      if (membresiaForm.id) {
        await gimnasioServicio.actualizarMembresia(membresiaForm.id, payload);
        showNotificacion('Membresía actualizada con éxito', 'success');
      } else {
        const creada = await gimnasioServicio.crearMembresia(payload);
        membresiaCreada = creada?.datos || creada || null;
        const esPaseDiario = String(planSeleccionado?.tipo_producto || 'MEMBRESIA').toUpperCase() === 'PASE_DIARIO';
        showNotificacion(
          esPaseDiario
            ? 'Pase diario asignado. La venta se generará cuando se consuma.'
            : planSeleccionado?.generar_venta && planSeleccionado?.requiere_pago
              ? 'Membresía creada y venta pendiente generada con éxito'
              : 'Membresía creada correctamente según la configuración comercial del plan.',
          'success',
        );
      }

      setMembresiaForm(getInitialMembresia());
      cargarFicha(formData);
      // Al registrar se abre el detalle completo de la membresía nueva.
      if (membresiaCreada?.id) {
        setMembresiaDetalle(membresiaCreada);
        setVistaMembresia('detalle');
      } else {
        setVistaMembresia('listado');
      }
    } catch (error) {
      const estadoHttp = Number(error.response?.status || 0);
      const errores = error.response?.data?.errors;
      const primerCampoInvalido = errores ? Object.keys(errores)[0] : null;
      const primerError = errores ? Object.values(errores).flat().find((item) => typeof item === 'string') : null;
      const camposLegibles = {
        fecha_inicio: 'fecha de inicio', estado: 'estado', modalidad_id: 'modalidad',
        sedes_habilitadas: 'sedes autorizadas', dia_pago: 'día de pago',
        fecha_congelacion_inicio: 'inicio de congelación',
        fecha_congelacion_fin: 'fin de congelación',
      };
      const mensajeValidacion = primerError === 'validation.required'
        ? `Es obligatorio completar ${camposLegibles[primerCampoInvalido] || primerCampoInvalido || 'un campo'}.`
        : primerError === 'validation.prohibited'
          ? `No es posible modificar ${camposLegibles[primerCampoInvalido] || primerCampoInvalido || 'este campo'} en un contrato vigente.`
          : primerError;
      const mensajeGenerico = error.response?.data?.mensaje;
      const avisoValidacion = estadoHttp === 422 || estadoHttp === 409;
      const mensaje = mensajeValidacion || (mensajeGenerico && !/No se pudo completar la operación/i.test(mensajeGenerico)
        ? mensajeGenerico : null) || (avisoValidacion
          ? 'Revisa los datos de la membresía antes de continuar.'
          : 'Ocurrió un error al registrar la membresía. Inténtalo nuevamente.');
      showNotificacion(mensaje, avisoValidacion ? 'warning' : 'error');
    }
  };

  // Tutor ya registrado que todavía no tiene ficha de deportista.
  const tutorSinFicha = !formData.id && Boolean(formData.tutor_id);

  const renderCamposDatos = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
      <Box component="nav" aria-label="Secciones de datos del cliente" sx={{
        p: 1, border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff',
        position: { md: 'sticky' }, top: { md: 16 },
      }}>
        <Typography variant="overline" sx={{ display: 'block', px: 1.5, pt: 1, pb: .5, color: 'text.secondary', fontWeight: 850 }}>
          Datos del cliente
        </Typography>
        <Stack spacing={.5}>
          {SECCIONES_CLIENTE
            .filter(({ id }) => {
              // Un tutor no puede tener tutor; el solo tutor tampoco tiene datos deportivos.
              if (id === 'representante') return formData.tipo_cliente === 'DEPORTISTA';
              return id !== 'contacto' || formData.tipo_cliente !== 'TUTOR';
            })
            .map(({ id, nombre, descripcion, Icono }) => {
            const activo = seccionCliente === id;
            return (
              <Button key={id} type="button" fullWidth onClick={() => setSeccionCliente(id)}
                aria-current={activo ? 'step' : undefined}
                startIcon={<Icono sx={{ fontSize: 19 }} />}
                sx={{
                  justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none',
                  borderRadius: 1.5, px: 1.2, py: 1.1, minHeight: 54,
                  color: activo ? '#14243c' : '#475467',
                  bgcolor: activo ? '#d4a017' : 'transparent',
                  borderLeft: activo ? '3px solid #b98500' : '3px solid transparent',
                  '&:hover': { bgcolor: activo ? '#c3920c' : '#f8fafc' },
                  '& .MuiButton-startIcon': { mr: 1.1 },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: activo ? 900 : 700, lineHeight: 1.3 }}>{nombre}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: 10.5, lineHeight: 1.3, mt: .25, color: activo ? '#27344b' : 'text.secondary' }}>{descripcion}</Typography>
                </Box>
              </Button>
            );
          })}
        </Stack>
      </Box>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
          {seccionCliente === 'persona' ? (
      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>
          Datos de la persona
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField
            select
            label="Tipo de cliente"
            name="tipo_cliente"
            value={formData.tipo_cliente || 'DEPORTISTA'}
            onChange={handleChange}
            size="small"
          >
            {tutorSinFicha ? null : <MenuItem value="DEPORTISTA">Deportista</MenuItem>}
            {formData.id ? null : <MenuItem value="TUTOR">Tutor</MenuItem>}
            <MenuItem value="DEPORTISTA_TUTOR">Deportista y tutor</MenuItem>
          </TextField>
          <TextField
            select
            label="Tipo de identificación"
            name="tipo_identificacion"
            value={formData.tipo_identificacion || 'CEDULA'}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="CEDULA">Cédula</MenuItem>
            <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
            <MenuItem value="RUC">RUC</MenuItem>
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
          <TextField label="Identificación" name="identificacion" value={formData.identificacion || ''} onChange={handleChange} size="small" required={formData.tipo_cliente === 'TUTOR'} />
          <TextField label="Nombres" name="nombres" value={formData.nombres || ''} onChange={handleChange} required size="small" />
          <TextField label="Apellidos" name="apellidos" value={formData.apellidos || ''} onChange={handleChange} size="small" />
          <TextField label="Correo" name="email" type="email" value={formData.email || ''} onChange={handleChange} size="small" />
          <TextField label="Dirección" name="direccion" value={formData.direccion || ''} onChange={handleChange} size="small" />
          <TextField
            label="Teléfono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            size="small"
          />
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
          <CampoActivo
            checked={formData.estado === 'ACTIVO'}
            onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.checked ? 'ACTIVO' : 'INACTIVO' }))}
          />
        </Box>
      </Box>
          ) : null}
          {seccionCliente === 'ubicacion' ? (
      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Ubicación geográfica</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          La ubicación es opcional. Selecciona los catálogos oficiales del INEC o deja los campos vacíos.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          {[
            { key: 'provincia_codigo', titulo: 'Provincia', icono: MapOutlinedIcon, opciones: provincias, disabled: false, placeholder: 'Seleccionar provincia' },
            { key: 'canton_codigo', titulo: 'Cantón', icono: LocationCityOutlinedIcon, opciones: cantones, disabled: !formData.provincia_codigo, placeholder: formData.provincia_codigo ? 'Seleccionar cantón' : 'Primero selecciona una provincia' },
            { key: 'parroquia_codigo', titulo: 'Parroquia', icono: PlaceOutlinedIcon, opciones: parroquias, disabled: !formData.canton_codigo, placeholder: formData.canton_codigo ? 'Seleccionar parroquia' : 'Primero selecciona un cantón' },
          ].map(({ key, titulo, icono: Icono, opciones, disabled, placeholder }) => (
            <Autocomplete
              key={key}
              size="small"
              fullWidth
              openOnFocus
              autoHighlight
              forcePopupIcon
              popupIcon={<KeyboardArrowDownRoundedIcon sx={{ color: '#946c17' }} />}
              options={opciones}
              disabled={disabled}
              value={opciones.find((opcion) => String(opcion.codigo) === String(formData[key])) || null}
              isOptionEqualToValue={(opcion, valor) => String(opcion.codigo) === String(valor.codigo)}
              getOptionLabel={(opcion) => nombreGeografico(opcion.nombre)}
              filterOptions={(items, { inputValue }) => {
                const buscar = inputValue.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (!buscar) return items;
                return items.filter((item) =>
                  nombreGeografico(item.nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(buscar)
                  || String(item.codigo).includes(buscar)
                );
              }}
              noOptionsText="No se encontraron resultados"
              clearText="Limpiar selección"
              openText="Mostrar opciones"
              closeText="Cerrar opciones"
              slotProps={{
                paper: { sx: { mt: 0.6, borderRadius: 2, border: '1px solid #e6dfce', boxShadow: '0 12px 32px rgba(16,24,40,0.12)' } },
                listbox: { sx: { maxHeight: 285, py: 0.6, '& .MuiAutocomplete-option.Mui-focused': { bgcolor: '#fff7e6' }, '& .MuiAutocomplete-option[aria-selected="true"]': { bgcolor: '#fdf2d2' } } },
              }}
              onChange={(_, nuevo) => {
                const codigo = nuevo?.codigo || '';
                setFormData((anterior) => ({
                  ...anterior,
                  [key]: codigo,
                  ...(key === 'provincia_codigo' ? { canton_codigo: '', parroquia_codigo: '' } : {}),
                  ...(key === 'canton_codigo' ? { parroquia_codigo: '' } : {}),
                }));
              }}
              renderOption={(props, opcion, { selected }) => {
                const { key: optionKey, ...resto } = props;
                return (
                  <Box component="li" key={optionKey} {...resto} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    mx: 0.65, my: 0.2, px: 1.25, py: 1, borderRadius: 1.2,
                  }}>
                    <Box sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 1.1, bgcolor: '#fff6df', flexShrink: 0 }}>
                      <Icono sx={{ color: '#a57a1a', fontSize: 19 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: selected ? 800 : 600, color: '#26354a' }}>
                        {nombreGeografico(opcion.nombre)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Código DPA {opcion.codigo}</Typography>
                    </Box>
                    {selected && <CheckRoundedIcon fontSize="small" sx={{ color: '#a57a1a' }} />}
                  </Box>
                );
              }}
              renderInput={(params) => {
                // MUI 9 entrega los adornos en slotProps.input; versiones previas
                // lo hacían en InputProps. Conservar los originales mantiene la
                // flecha, el botón de limpiar y los handlers del Autocomplete.
                const inputOriginal = params.slotProps?.input ?? params.InputProps ?? {};
                return (
                  <TextField
                    {...params}
                    label={titulo}
                    placeholder={placeholder}
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...inputOriginal,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <Icono sx={{ color: disabled ? '#aab3bf' : '#ae851d', fontSize: 20 }} />
                            </InputAdornment>
                            {inputOriginal.startAdornment}
                          </>
                        ),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 1.7, bgcolor: disabled ? '#f9fafb' : '#fff' },
                      '& .MuiAutocomplete-popupIndicator': { display: 'inline-flex !important' },
                    }}
                  />
                );
              }}
            />
          ))}
        </Box>
        <Box sx={{ mt: 2, border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, bgcolor: '#fcfcfd' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" fontWeight={750}>Ubicación exacta en el mapa</Typography>
              <Typography variant="caption" color="text.secondary">
                Opcional: no necesitas indicar coordenadas para registrar al cliente.
              </Typography>
            </Box>
            <FormControlLabel control={<Switch checked={mostrarMapaCliente} onChange={(_, valor) => setMostrarMapaCliente(valor)} />}
              label="Mostrar mapa" sx={{ ml: 0, mr: 0 }} />
          </Stack>
          {mostrarMapaCliente && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <TextField size="small" label="Referencia (opcional)" value={formData.ubicacion?.referencia ?? ''}
                onChange={(e) => setFormData(actual => ({ ...actual, ubicacion: { ...actual.ubicacion, referencia: e.target.value } }))} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                <TextField size="small" type="number" label="Latitud" value={formData.ubicacion?.latitud ?? ''}
                  slotProps={{ htmlInput: { min: -5.1, max: 2, step: 0.0000001 } }}
                  onChange={(e) => setFormData(actual => ({ ...actual, ubicacion: { ...actual.ubicacion, latitud: e.target.value } }))} />
                <TextField size="small" type="number" label="Longitud" value={formData.ubicacion?.longitud ?? ''}
                  slotProps={{ htmlInput: { min: -92.1, max: -74, step: 0.0000001 } }}
                  onChange={(e) => setFormData(actual => ({ ...actual, ubicacion: { ...actual.ubicacion, longitud: e.target.value } }))} />
              </Box>
              <MapaUbicacionPersona
                latitud={formData.ubicacion?.latitud ?? ''}
                longitud={formData.ubicacion?.longitud ?? ''}
              />
              {(formData.ubicacion?.latitud !== '' || formData.ubicacion?.longitud !== '') && (
                <Button startIcon={<PinDropOutlinedIcon />} size="small" sx={{ alignSelf: 'flex-start' }}
                  onClick={() => setFormData(actual => ({
                    ...actual, ubicacion: { ...actual.ubicacion, latitud: '', longitud: '' },
                  }))}>Quitar punto guardado</Button>
              )}
            </Stack>
          )}
        </Box>
      </Box>
          ) : null}
          {seccionCliente === 'representante' ? (
      <Box sx={formStyles.seccion}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography sx={formStyles.modalSeccionTitulo}>Tutor</Typography>
            <Typography variant="body2" color="text.secondary">
              {esMenorDeEdad(formData.fecha_nacimiento)
                ? 'El cliente es menor de edad: el tutor es obligatorio.'
                : 'Actívalo cuando el cliente necesite un tutor o responsable de pago.'}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                name="requiere_representante_legal"
                checked={Boolean(formData.requiere_representante_legal)}
                onChange={handleChange}
              />
            }
            label="Requiere tutor"
          />
        </Stack>

        {formData.requiere_representante_legal ? (
          <SelectorTutor
            tutor={formData.representante_legal}
            excluirPersonaId={formData.persona_id}
            onSeleccionar={handleSeleccionarTutor}
            onCambiarVinculo={handleRepresentanteChange}
            onQuitar={puedeQuitarTutor ? () => {
              setMotivoQuitarTutor(`Se retira a ${tutorVigente?.nombre_completo || 'el tutor'} como tutor de ${[formData.nombres, formData.apellidos].filter(Boolean).join(' ') || 'el cliente'} desde el ${new Date().toLocaleDateString('es-EC')}.`);
              setDialogoQuitarTutor(true);
            } : undefined}
          />
        ) : null}
        <HistorialTutores historial={formData.historial_tutores} />
        <ModalConfirmacion
          open={dialogoQuitarTutor}
          titulo="Quitar tutor"
          descripcion={`${tutorVigente?.nombre_completo || 'El tutor'} dejará de estar a cargo desde hoy. El vínculo queda en el historial.`}
          textoConfirmar="Sí, quitar"
          cargando={quitandoTutor}
          onClose={() => setDialogoQuitarTutor(false)}
          onConfirmar={confirmarQuitarTutor}
        >
          <TextField label="Motivo (opcional)" size="small" multiline minRows={2} value={motivoQuitarTutor}
            onChange={(e) => setMotivoQuitarTutor(e.target.value)} slotProps={{ htmlInput: { maxLength: 250 } }} />
        </ModalConfirmacion>
      </Box>
          ) : null}
          {seccionCliente === 'contacto' ? (
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
          ) : null}

      </Stack>
    </Box>
  );

  const horarioAsignacionSeleccionado = turnosEntrenador.find(
    (turno) => String(turno.id) === String(asignacionForm.entrenador_horario_id),
  ) || (turnosEntrenador.length === 1 ? turnosEntrenador[0] : null);

  // Observación sugerida de la asignación; el usuario puede editarla o borrarla.
  const entrenadorAsignacion = entrenadoresDisp.find((ent) => String(ent.id) === String(asignacionForm.entrenador_id));
  const nombreEntrenadorAsignacion = entrenadorAsignacion ? (`${entrenadorAsignacion.nombres || ''} ${entrenadorAsignacion.apellidos || ''}`.trim() || entrenadorAsignacion.name) : '';
  const observacionesAsignacion = asignacionForm.observaciones_editada ? asignacionForm.observaciones
    : (nombreEntrenadorAsignacion ? `Asignación de ${[formData.nombres, formData.apellidos].filter(Boolean).join(' ') || 'el cliente'} con ${nombreEntrenadorAsignacion}${horarioAsignacionSeleccionado ? ` en el turno ${horarioAsignacionSeleccionado.nombre ? `${horarioAsignacionSeleccionado.nombre} · ` : ''}${horarioAsignacionSeleccionado.dia_semana} ${String(horarioAsignacionSeleccionado.hora_inicio).slice(0, 5)}-${String(horarioAsignacionSeleccionado.hora_fin).slice(0, 5)} (${horarioAsignacionSeleccionado.sede_nombre})` : ''}.` : '');
  const capacidadHorarioSeleccionado = Number(horarioAsignacionSeleccionado?.capacidad ?? 15);
  const asignadosHorarioSeleccionado = Number(horarioAsignacionSeleccionado?.asignados ?? 0);
  const disponiblesHorarioSeleccionado = Number(
    horarioAsignacionSeleccionado?.disponibles
      ?? Math.max(0, capacidadHorarioSeleccionado - asignadosHorarioSeleccionado),
  );

  const recesoResumenAsignacion = horarioAsignacionSeleccionado?.recesos?.length
    ? horarioAsignacionSeleccionado.recesos
        .map((receso) => `${String(receso.hora_inicio).slice(0, 5)}-${String(receso.hora_fin).slice(0, 5)}`)
        .filter((valor, indice, lista) => lista.indexOf(valor) === indice)
        .join(', ')
    : 'Sin recesos';

  const textoAsignacion = (item, campo) => {
    if (campo === 'entrenador') return item.entrenador_nombre || [item.entrenador_nombres, item.entrenador_apellidos].filter(Boolean).join(' ') || 'Sin entrenador';
    if (campo === 'disponibilidad') return `${item.dia_semana || ''} ${item.hora_inicio || ''} ${item.hora_fin || ''}`.trim();
    if (campo === 'sede') return item.sede_nombre || 'Sin sede';
    if (campo === 'vigencia') return `${String(item.fecha_inicio || '').slice(0, 10)} → ${String(item.fecha_fin || (item.estado === 'ACTIVO' ? 'Actual' : '')).slice(0, 10)}`;
    return item.estado || '';
  };
  const opcionesExcel = (items, obtener) => [...new Set(items.map(obtener).filter(Boolean))].sort().map((valor) => ({ value: valor, label: valor }));
  const asignacionesFiltradas = asignaciones.filter((item) =>
    [item.entrenador_nombre, item.entrenador_nombres, item.entrenador_apellidos, item.sede_nombre, item.dia_semana, item.estado]
      .some((valor) => String(valor || '').toLocaleLowerCase('es').includes(buscarAsignacion.toLocaleLowerCase('es')))
    && Object.entries(filtrosAsignacion).every(([campo, valores]) => !valores.length || valores.includes(textoAsignacion(item, campo)))
  );

  const membresiaEntrenadorDisponible = membresiasCliente.some((membresia) =>
    booleanoBackend(membresia.requiere_entrenador)
    && String(membresia.estado || '').toUpperCase() === 'ACTIVA'
  );

  const renderEntrenadorYHorario = () => (
    <Stack spacing={2}>
      {vistaAsignacion === 'formulario' ? <Box sx={formStyles.seccion}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Nueva asignación</Typography>
          <Box sx={{ ml: 'auto' }}><BotonVolver onClick={() => setVistaAsignacion('listado')} /></Box>
        </Stack>
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
            label="Disponibilidad vigente"
            name="entrenador_horario_id"
            value={asignacionForm.entrenador_horario_id}
            onChange={handleAsignacionChange}
            size="small"
            required
            disabled={!asignacionForm.entrenador_id}
            helperText={asignacionForm.entrenador_id && turnosEntrenador.length === 0 ? 'Este entrenador no tiene un horario activo y vigente configurado' : ''}
          >
            {turnosEntrenador.map((turno) => (
              <MenuItem key={turno.id} value={turno.id}>
                {turno.nombre ? `${turno.nombre} · ` : ''}{turno.dia_semana} · {String(turno.hora_inicio).slice(0, 5)}-{String(turno.hora_fin).slice(0, 5)} · {turno.sede_nombre} · {Number(turno.disponibles ?? Math.max(0, Number(turno.capacidad ?? 15) - Number(turno.asignados ?? 0)))} de {Number(turno.capacidad ?? 15)} cupos
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Observaciones"
            name="observaciones"
            value={observacionesAsignacion}
            onChange={handleAsignacionChange}
            multiline
            size="small"
          />
        </Box>

        {horarioAsignacionSeleccionado ? (
          <Box
            sx={{
              mt: 1.5,
              border: '1px solid #dbe5f0',
              borderRadius: 1.5,
              bgcolor: '#fff',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: '1.35fr 1fr .9fr .9fr' },
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #dbe5f0',
              }}
            >
              {['Disponibilidad', 'Sede', 'Receso', 'Cupos'].map((titulo, indice) => (
                <Box
                  key={titulo}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRight: {
                      xs: indice % 2 === 0 ? '1px solid #dbe5f0' : 'none',
                      md: indice < 3 ? '1px solid #dbe5f0' : 'none',
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    {titulo}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: '1.35fr 1fr .9fr .9fr' },
              }}
            >
              <Box sx={{ px: 1.5, py: 1, borderRight: '1px solid #dbe5f0', minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {resumirDiasHorario(horarioAsignacionSeleccionado.dia_semana)}
                  {' · '}
                  {String(horarioAsignacionSeleccionado.hora_inicio).slice(0, 5)}
                  -
                  {String(horarioAsignacionSeleccionado.hora_fin).slice(0, 5)}
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 1, borderRight: { xs: 'none', md: '1px solid #dbe5f0' }, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {horarioAsignacionSeleccionado.sede_nombre || 'Sin sede'}
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 1, borderRight: '1px solid #dbe5f0', minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>{recesoResumenAsignacion}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={900}
                  color={disponiblesHorarioSeleccionado > 0 ? 'success.main' : 'error.main'}
                  noWrap
                >
                  {disponiblesHorarioSeleccionado} de {capacidadHorarioSeleccionado} disponibles
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : null}

        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar
            texto="Asignar"
            onClick={handleGuardarAsignacion}
            disabled={Boolean(horarioAsignacionSeleccionado && disponiblesHorarioSeleccionado <= 0)}
          />
        </Stack>
      </Box> : <Box sx={formStyles.seccion}>
        <GestionToolbar
          total={asignacionesFiltradas.length}
          busqueda={buscarAsignacion}
          onBusqueda={setBuscarAsignacion}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => { setAsignacionForm(getInitialAsignacion()); setTurnosEntrenador([]); setVistaAsignacion('formulario'); }}>Añadir</Button>}
        />
        <AsignacionesClienteTable
          asignaciones={asignacionesFiltradas}
          filtrosColumna={filtrosAsignacion}
          onFiltroColumna={(campo, valores) => setFiltrosAsignacion((actual) => ({ ...actual, [campo]: valores }))}
          opcionesColumna={Object.fromEntries(['entrenador', 'disponibilidad', 'sede', 'vigencia', 'estado']
            .map((campo) => [campo, opcionesExcel(asignaciones, (item) => textoAsignacion(item, campo))]))}
          cargando={cargandoFicha}
          onFinalizar={handleFinalizarAsignacion}
        />
      </Box>}
    </Stack>
  );

  const planMembresiaSeleccionado = planes.find(
    (plan) => String(plan.id) === String(membresiaForm.plan_id),
  );
  const modalidadesMembresiaDisponibles = (planMembresiaSeleccionado?.modalidades || [])
    .filter((modalidad) => booleanoBackend(modalidad.activo));
  const modalidadMembresiaSeleccionada = modalidadesMembresiaDisponibles.find(
    (modalidad) => String(modalidad.id) === String(membresiaForm.modalidad_id),
  );
  // En edición no reinterpretar la tarifa histórica con los precios
  // actuales del catálogo, que pueden haber cambiado.
  const precioHistorico = membresiaForm.id
    ? (membresiaForm.condiciones_contratadas?.precio_periodo ?? membresiaForm.precio_aplicado)
    : null;
  const precioMembresiaPreview = membresiaForm.id && precioHistorico != null
    ? Number(precioHistorico)
    : membresiaForm.plan_id && membresiaForm.sede_id
      ? precioAplicableMembresia(
          planMembresiaSeleccionado,
          modalidadMembresiaSeleccionada,
          membresiaForm.sede_id,
        )
      : null;
  const descuentoNumerico = Number(descuentoMembresia.valor || 0);
  const sedesHabilitadasIds = (membresiaForm.sedes_habilitadas || []).map(String);
  // Un descuento puede valer solo en una sede autorizada; el resumen se calcula con la tarifa de esa sede.
  const sedeDescuentoId = requiereDescuento && descuentoMembresia.sede_id
    && sedesHabilitadasIds.includes(String(descuentoMembresia.sede_id)) ? String(descuentoMembresia.sede_id) : '';
  const sedeResumenId = !membresiaForm.id && sedeDescuentoId ? sedeDescuentoId : membresiaForm.sede_id;
  const precioBaseResumen = Number((!membresiaForm.id && sedeDescuentoId && planMembresiaSeleccionado
    ? precioAplicableMembresia(planMembresiaSeleccionado, modalidadMembresiaSeleccionada, sedeDescuentoId)
    : precioMembresiaPreview) ?? 0);
  const importeDescuentoPreview = !requiereDescuento || !Number.isFinite(descuentoNumerico)
    ? 0
    : descuentoMembresia.tipo === 'PORCENTAJE'
      ? Math.round(precioBaseResumen * Math.min(100, Math.max(0, descuentoNumerico)) / 100 * 100) / 100
      : Math.min(precioBaseResumen, Math.max(0, descuentoNumerico));
  const descuentoInvalido = requiereDescuento && (
    !Number.isFinite(descuentoNumerico)
    || descuentoNumerico <= 0
    || (descuentoMembresia.tipo === 'PORCENTAJE' && descuentoNumerico > 100)
    || (descuentoMembresia.tipo === 'FIJO' && precioMembresiaPreview !== null && descuentoNumerico > precioBaseResumen)
  );
  // Un campo vacío todavía no es un error: solo se avisa cuando ya se escribió algo inválido.
  const descuentoVacio = requiereDescuento && String(descuentoMembresia.valor ?? '').trim() === '';
  const mostrarErrorDescuento = descuentoInvalido && !descuentoVacio;
  // Las columnas dependen del espacio real del formulario, no del ancho de la ventana.
  const columnasFormulario = 'repeat(auto-fit, minmax(190px, 1fr))';
  // Máximo dos columnas (una sola si no caben dos de 200 px).
  const columnasDos = 'repeat(auto-fit, minmax(max(200px, calc((100% - 12px) / 2)), 1fr))';
  // Un descuento general se aplica sobre la tarifa de cada sede; uno de sede, solo en ella.
  const pagaPorSede = !membresiaForm.id && requiereDescuento && !descuentoInvalido && planMembresiaSeleccionado
    ? sedes
      .filter((sede) => !sedesHabilitadasIds.length || sedesHabilitadasIds.includes(String(sede.id_sede)))
      .map((sede) => {
        const precio = Number(precioAplicableMembresia(planMembresiaSeleccionado, modalidadMembresiaSeleccionada, sede.id_sede) || 0);
        const aplica = !sedeDescuentoId || String(sede.id_sede) === sedeDescuentoId;
        const importe = !aplica ? 0 : descuentoMembresia.tipo === 'PORCENTAJE'
          ? Math.round(precio * Math.min(100, Math.max(0, descuentoNumerico)) / 100 * 100) / 100
          : Math.min(precio, Math.max(0, descuentoNumerico));
        return { id: sede.id_sede, nombre: sede.nombre, precio, importe, paga: Math.max(0, precio - importe) };
      })
    : [];
  const paseEnFormulario = String(planMembresiaSeleccionado?.tipo_producto || '').toUpperCase() === 'PASE_DIARIO';
  const contratoNuevoVisible = !membresiaForm.id && !paseEnFormulario;
  const periodosCalculados = contratoNuevoVisible && membresiaForm.fecha_fin_solicitada
    ? periodosParaCubrirFecha({
      inicio: membresiaForm.fecha_inicio,
      objetivo: membresiaForm.fecha_fin_solicitada,
      tipo: modalidadMembresiaSeleccionada?.tipo_duracion || planMembresiaSeleccionado?.tipo_duracion,
      duracion: modalidadMembresiaSeleccionada?.duracion || planMembresiaSeleccionado?.duracion,
    }) : null;
  const calendarioContratoPreview = contratoNuevoVisible
    && (!booleanoBackend(planMembresiaSeleccionado?.requiere_modalidades) || modalidadMembresiaSeleccionada)
    ? generarVistaPreviaCuotas({
    inicio: membresiaForm.fecha_inicio,
    diaPago: membresiaForm.dia_pago,
    cantidad: periodosCalculados || 0,
    tipo: modalidadMembresiaSeleccionada?.tipo_duracion || planMembresiaSeleccionado?.tipo_duracion,
    duracion: modalidadMembresiaSeleccionada?.duracion || planMembresiaSeleccionado?.duracion,
  }) : [];
  const cuotaFueraDePeriodo = calendarioContratoPreview.find((cuota) => cuota.vencimiento > cuota.fin);
  // El descuento nace con las mismas fechas de la membresía; el administrador solo puede acortarlo.
  const finMembresiaForm = paseEnFormulario
    ? (membresiaForm.vigencia_fin || '')
    : contratoNuevoVisible
      ? (calendarioContratoPreview[calendarioContratoPreview.length - 1]?.fin || membresiaForm.fecha_fin_solicitada || '')
      : (membresiaForm.fecha_fin || '');
  const inicioDescuentoForm = descuentoMembresia.fecha_inicio || membresiaForm.fecha_inicio || '';
  const finDescuentoForm = descuentoMembresia.fecha_fin || finMembresiaForm;
  const sedesDescuento = planMembresiaSeleccionado ? sedes
    .filter((sede) => sedesHabilitadasIds.includes(String(sede.id_sede)))
    .map((sede) => ({ id: sede.id_sede, nombre: sede.nombre,
      precio: Number(precioAplicableMembresia(planMembresiaSeleccionado, modalidadMembresiaSeleccionada, sede.id_sede) || 0) })) : [];
  const finDescuentoFueraDeRango = Boolean(finDescuentoForm && (
    (finMembresiaForm && finDescuentoForm > finMembresiaForm) || (inicioDescuentoForm && finDescuentoForm < inicioDescuentoForm)
  ));
  // Flujo de asignación progresivo: plan → modalidad → fechas → cuotas → sedes → descuento.
  const modalidadLista = Boolean(membresiaForm.plan_id)
    && (!booleanoBackend(planMembresiaSeleccionado?.requiere_modalidades) || Boolean(modalidadMembresiaSeleccionada));
  const fechasListas = modalidadLista && (
    !contratoNuevoVisible
      ? Boolean(membresiaForm.fecha_inicio)
      : Boolean(
        membresiaForm.fecha_inicio
        && membresiaForm.fecha_fin_solicitada
        && Number(membresiaForm.dia_pago) >= 1
        && Number(membresiaForm.dia_pago) <= 31
        && calendarioContratoPreview.length
      )
  );
  const sedesListas = (membresiaForm.sedes_habilitadas || []).length > 0;
  const mostrarSedes = !membresiaForm.id && fechasListas;
  const mostrarComercial = !membresiaForm.id && fechasListas && sedesListas;
  const permiteCobroProgramado = Boolean(planMembresiaSeleccionado?.renovable) && !contratoNuevoVisible;
  const proximoCobroPreview = membresiaForm.proxima_fecha_cobro
    || calcularProximaFechaCobroPreview(membresiaForm.fecha_inicio, membresiaForm.dia_pago);

  const textoMembresia = (m, campo) => {
    if (campo === 'plan') return [m.plan_nombre, m.modalidad_nombre].filter(Boolean).join(' · ') || 'Sin plan';
    if (campo === 'vigencia') return String(m.tipo_producto || '').toUpperCase() === 'PASE_DIARIO'
      ? textoVigenciaPase(m, fechaMembresia)
      : `${fechaMembresia(m.fecha_inicio)} – ${fechaMembresia(m.fecha_fin)}`;
    if (campo === 'precio') return m.precio_aplicado == null ? '—' : `$${Number(m.precio_aplicado).toFixed(2)}`;
    return presentarEstadoMembresia(m).label;
  };
  const membresiasFiltradas = membresiasCliente.filter((m) =>
    [m.plan_nombre, m.modalidad_nombre, m.codigo_contrato, m.estado, m.sede_nombre]
      .some((valor) => String(valor || '').toLocaleLowerCase('es').includes(buscarMembresia.toLocaleLowerCase('es')))
    && Object.entries(filtrosMembresia).every(([campo, valores]) => !valores.length || valores.includes(textoMembresia(m, campo)))
  );
  const filtrarMembresia = (campo, valores) => {
    setFiltrosMembresia((prev) => ({ ...prev, [campo]: valores }));
    setPaginaMembresia(1);
  };

  const renderMembresia = () => (
    <Stack spacing={2}>

      {vistaMembresia === 'formulario' ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: membresiaForm.id ? 'minmax(0, 1fr)' : '230px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
        {!membresiaForm.id && <MenuSeccionesMembresia seccion={seccionNueva} onSeleccionar={setSeccionNueva}
          secciones={SECCION_NUEVA_MEMBRESIA.map((x) => (x.id === 'sedes' ? { ...x, bloqueada: !fechasListas } : x))} />}
        <Box sx={{ ...formStyles.seccion, minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          gap: 2, width: '100%', boxSizing: 'border-box',
          mb: 2, px: membresiaForm.id ? 1.5 : 0, py: membresiaForm.id ? 1.25 : 0,
            borderRadius: membresiaForm.id ? 1.5 : 0,
            bgcolor: membresiaForm.id ? uiTokens.colores.acentoSuave : 'transparent',
            border: membresiaForm.id ? `1px solid ${uiTokens.colores.acentoBorde}` : 'none' }}>
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography sx={{ ...formStyles.modalSeccionTitulo, mb: membresiaForm.id ? 0.25 : 0,
              color: membresiaForm.id ? uiTokens.colores.acentoTexto : uiTokens.colores.textoFuerte }}>
              {membresiaForm.id ? 'Editar membresía' : 'Nueva membresía'}
            </Typography>
            {membresiaForm.id && (
              <Typography variant="caption" sx={{ color: uiTokens.colores.acentoTexto }}>
                Modifica únicamente los datos administrativos permitidos; las cuotas pactadas se conservan. Sedes y descuentos se cambian desde el detalle de la membresía.
              </Typography>
            )}
          </Box>
          <Box sx={{ ml: 'auto', flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
            <BotonVolver onClick={() => {
              setVistaMembresia('listado');
              setMembresiaForm(getInitialMembresia());
            }} />
          </Box>
        </Box>
        {membresiaForm.id ? (
          <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1.5, p: { xs: 1.5, md: 2 }, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Contrato registrado</Typography>
            <Box sx={{ display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.75 }}>
              {[
                ['Plan', membresiaForm.plan_nombre || planMembresiaSeleccionado?.nombre || '—'],
                ['Modalidad', membresiaForm.modalidad_nombre || 'Sin modalidad'],
                ['Inicio', fechaMembresia(membresiaForm.fecha_inicio)],
                ['Fin', fechaMembresia(membresiaForm.fecha_fin)],
                ['Día de pago', membresiaForm.dia_pago ? `Día ${membresiaForm.dia_pago} de cada mes` : '—'],
                ['Períodos', membresiaForm.cantidad_periodos_contratados ?? '—'],
              ].map(([etiqueta, valor]) => (
                <Box key={etiqueta} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{etiqueta}</Typography>
                  <Typography variant="body2" fontWeight={750} sx={{ overflowWrap: 'anywhere' }}>{valor}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : seccionNueva === 'sedes' ? null : (
          <>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Datos del contrato</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: booleanoBackend(planMembresiaSeleccionado?.requiere_modalidades) ? 'minmax(0, 1fr) minmax(0, 2fr)' : 'minmax(0, 1fr)' }, gap: 1.5 }}>
          <TextField
            select
            label="Plan"
            name="plan_id"
            value={membresiaForm.plan_id || ''}
            onChange={handleMembresiaChange}
            required
            size="small"
            disabled={!!membresiaForm.id}
            helperText={membresiaForm.id ? 'Plan del contrato original' : ''}
          >
            {planes.map((plan) => {
              const modalidadesActivas = (plan.modalidades || [])
                .filter((modalidad) => booleanoBackend(modalidad.activo));
              const textoPlan = booleanoBackend(plan.requiere_modalidades)
                ? `${plan.nombre} · ${modalidadesActivas.length} modalidad(es)`
                // Sin precio: depende de la sede y se muestra en el resumen.
                : plan.nombre;

              return <MenuItem key={plan.id} value={plan.id}>{textoPlan}</MenuItem>;
            })}
          </TextField>

          {booleanoBackend(planMembresiaSeleccionado?.requiere_modalidades) ? (
            <TextField
              select
              label={`Modalidad · ${modalidadesMembresiaDisponibles.length} disponibles`}
              name="modalidad_id"
              value={membresiaForm.modalidad_id || ''}
              onChange={handleMembresiaChange}
              required
              size="small"
              disabled={!!membresiaForm.id}
              helperText=""
            >
              {modalidadesMembresiaDisponibles.map((modalidad) => (
                <MenuItem key={modalidad.id} value={modalidad.id}>
                  {modalidad.nombre}
                  {' · '}
                  {modalidad.uso_ilimitado
                    ? 'Ilimitado'
                    : `${modalidad.usos_por_semana || modalidad.dias_por_semana} uso(s)/sem.`}
                  {' · '}
                  {modalidad.duracion} {String(modalidad.tipo_duracion || '').toLowerCase()}
                  {' · $'}
                  {Number(modalidad.precio_base || 0).toFixed(2)}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

        </Box>
        {modalidadLista && (
        <Box sx={{ display: 'grid', gridTemplateColumns: columnasFormulario, gap: 1.5, mt: 1.5 }}>
          <TextField
            label={paseEnFormulario && membresiaForm.id ? 'Fecha de uso' : 'Fecha inicio'}
            name="fecha_inicio" type="date" value={membresiaForm.fecha_inicio || ''}
            onChange={handleMembresiaChange} required size="small"
            disabled={Boolean(membresiaForm.id && (membresiaForm.cantidad_periodos_contratados != null || (paseEnFormulario && membresiaForm.uso_con_venta)))}
            helperText={membresiaForm.id && membresiaForm.cantidad_periodos_contratados != null
              ? 'Fecha contractual: los días de congelación se compensan al reactivar.'
              : (membresiaForm.id && paseEnFormulario && membresiaForm.uso_con_venta ? 'Este día ya tiene una venta: no se puede cambiar.' : '')}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {contratoNuevoVisible ? (
            <>
              <TextField label="Fecha fin" name="fecha_fin_solicitada" type="date" required size="small"
                value={membresiaForm.fecha_fin_solicitada || ''}
                onChange={handleMembresiaChange}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: membresiaForm.fecha_inicio || undefined } }}
              />
              <TextField label="Día de pago" name="dia_pago" type="number" required size="small"
                value={membresiaForm.dia_pago ?? ''} onChange={handleMembresiaChange}
                slotProps={{ htmlInput: { min: 1, max: 31, step: 1 } }}
                placeholder="Ej. 5"
              />
            </>
          ) : paseEnFormulario && !membresiaForm.id ? (
            <TextField label="Fecha fin" name="vigencia_fin" type="date" required size="small"
              value={membresiaForm.vigencia_fin || ''}
              onChange={handleMembresiaChange}
              helperText="Hasta esta fecha se puede vender el pase."
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: membresiaForm.fecha_inicio || undefined } }}
            />
          ) : paseEnFormulario ? (
            <TextField label="Vigencia" size="small"
              value={textoVigenciaPase(membresiaForm, fechaMembresia)}
              helperText="Se cambia con Editar vigencia, en Acciones del contrato."
              slotProps={{ input: { readOnly: true } }}
            />
          ) : (
            <TextField label="Fecha fin del contrato" type="date" size="small"
              value={membresiaForm.fecha_fin || ''}
              slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
            />
          )}
        </Box>
        )}
          </>
        )}
        {membresiaForm.id && (
          <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.25 }}>
            Configuración administrativa
          </Typography>
        )}
        {membresiaForm.id && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mt: 1.5 }}>
          {membresiaForm.id && (
            <TextField label="Estado del contrato" size="small"
              value={({
                PENDIENTE_PAGO: 'Pendiente de pago',
                ACTIVA: 'Activa',
                VENCIDA: 'Vencida',
                CONGELADA: 'Congelada',
                CANCELADA: 'Cancelada',
              })[String(membresiaForm.estado || '').toUpperCase()] || membresiaForm.estado || 'Sin estado'}
              slotProps={{ input: { readOnly: true } }}
              helperText="El estado cambia mediante los procesos autorizados de membresías, pagos y ciclo de vida."
            />
          )}
          {membresiaForm.id && (
            <TextField
              label="Días de gracia"
              name="dias_gracia"
              type="number"
              value={membresiaForm.dias_gracia ?? 0}
              onChange={handleMembresiaChange}
              size="small"
              slotProps={{ htmlInput: { min: 0, max: 365 } }}
            />
          )}

          {membresiaForm.id && membresiaForm.cantidad_periodos_contratados != null && !paseEnFormulario && booleanoBackend(planMembresiaSeleccionado?.renovable) ? (
            <>
          <Box
            sx={{
              height: 40,
              boxSizing: 'border-box',
              px: 1.25,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="renovacion_automatica"
                  checked={Boolean(membresiaForm.renovacion_automatica)}
                  onChange={handleMembresiaChange}
                  size="small"
                />
              }
              label="Renovación automática"
              sx={{ m: 0 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', mt: -0.75 }}>
            7 días antes del fin, si las cuotas están pagadas, se programa un período más. Su venta se emite al iniciar y se cobra en Ventas; sin pago no hay acceso.
          </Typography>


            </>
          ) : null}
        </Box>
        )}

        {contratoNuevoVisible && fechasListas && seccionNueva !== 'sedes' ? (
          <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Contrato y calendario de cuotas</Typography>
 
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {calendarioContratoPreview.length} {calendarioContratoPreview.length === 1 ? 'período' : 'períodos'} · {calendarioContratoPreview.length} cuotas · Pago el día {Number(membresiaForm.dia_pago)} de cada mes
            </Typography>
            {calendarioContratoPreview.length > 0 && calendarioContratoPreview[calendarioContratoPreview.length - 1].fin !== membresiaForm.fecha_fin_solicitada && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                La modalidad se contrata por períodos completos. La vigencia real termina el {calendarioContratoPreview[calendarioContratoPreview.length - 1].fin}.
              </Typography>
            )}
            {cuotaFueraDePeriodo && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                La cuota {cuotaFueraDePeriodo.numero} vence después de su período. Ajusta la fecha de pago o usa una modalidad de 1 mes.
              </Typography>
            )}
            {String(modalidadMembresiaSeleccionada?.tipo_duracion || planMembresiaSeleccionado?.tipo_duracion) === 'SEMANAS'
              && Number(modalidadMembresiaSeleccionada?.duracion || planMembresiaSeleccionado?.duracion) === 4 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  4 semanas son 28 días; no equivalen a 1 mes calendario.
                </Typography>
              )}
            <CalendarioCuotasPreview filas={calendarioContratoPreview} precioPeriodo={precioMembresiaPreview} />
          </Box>
        ) : null}
        {membresiaForm.id && membresiaForm.cuotas?.length ? (
          <CalendarioCuotasRegistradas
            periodos={membresiaForm.periodos || []}
            cuotas={membresiaForm.cuotas}
          />
        ) : null}
        {mostrarSedes && seccionNueva === 'sedes' && (
          // Paso Sedes del menú: dónde se vende y se usa, cada una con su precio normal.
          <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid #dbe5f0', borderRadius: 1.5, bgcolor: '#fafbfc' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Sedes autorizadas *</Typography>
          <Stack direction="row" spacing={1.2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {sedes.map((sede) => {
              const seleccionada = (membresiaForm.sedes_habilitadas || [])
                .some((id) => String(id) === String(sede.id_sede));
              return (
                <Button key={sede.id_sede} type="button"
                  variant={seleccionada ? 'contained' : 'outlined'}
                  aria-pressed={seleccionada}
                  startIcon={seleccionada ? <CheckRoundedIcon sx={{ fontSize: 19 }} /> : <LocationCityOutlinedIcon sx={{ fontSize: 19 }} />}
                  onClick={() => setMembresiaForm((actual) => {
                    const anteriores = (actual.sedes_habilitadas || []).map(Number).filter(Boolean);
                    const id = Number(sede.id_sede);
                    const nuevas = anteriores.includes(id)
                      ? anteriores.filter((valor) => valor !== id)
                      : Array.from(new Set([...anteriores, id]));
                    if (!nuevas.length) {
                      showNotificacion('Debes habilitar al menos una sede para la membresía.', 'warning');
                      return actual;
                    }
                    const sedePrincipal = nuevas.includes(Number(actual.sede_id))
                      ? Number(actual.sede_id)
                      : nuevas[0];
                    return { ...actual, sede_id: sedePrincipal, sedes_habilitadas: nuevas };
                  })}
                  sx={{
                    textTransform: 'none', fontSize: 13, fontWeight: 800,
                    minHeight: 42, minWidth: 145, px: 2, borderRadius: 1.7,
                    boxShadow: seleccionada ? '0 2px 5px rgba(155, 111, 0, 0.16)' : 'none',
                    border: '1px solid', borderColor: seleccionada ? '#d3a018' : '#dbe5f0',
                    bgcolor: seleccionada ? '#d4a017' : '#fff',
                    color: seleccionada ? '#14243c' : '#475467',
                    '&:hover': {
                      bgcolor: seleccionada ? '#bd8e0f' : '#fff8e5',
                      borderColor: '#d4a017',
                      boxShadow: seleccionada ? '0 3px 8px rgba(155, 111, 0, 0.2)' : 'none',
                    },
                    '&:focus-visible': { outline: '2px solid #14243c', outlineOffset: 2 },
                  }}
                >
                  {/* Precio normal de la sede: sin descuento es lo que paga. */}
                  {sede.nombre}
                  {planMembresiaSeleccionado && (
                    <Box component="span" sx={{ ml: 0.75, fontWeight: 700, opacity: 0.8 }}>
                      · ${Number(precioAplicableMembresia(planMembresiaSeleccionado, modalidadMembresiaSeleccionada, sede.id_sede) || 0).toFixed(2)}
                    </Box>
                  )}
                </Button>
              );
            })}
          </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Los descuentos se agregan al guardar, en Descuentos del menú.
            </Typography>
          </Box>
        )}
        {mostrarSedes && seccionNueva !== 'sedes' && (
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setSeccionNueva('sedes')}>Siguiente: Sedes</Button>
          </Stack>
        )}

        {mostrarComercial && seccionNueva === 'sedes' && (String(planMembresiaSeleccionado?.tipo_producto || 'MEMBRESIA').toUpperCase() !== 'PASE_DIARIO'
          || (permiteCobroProgramado && !membresiaForm.cantidad_periodos_contratados)) && (
        <Box sx={{ mt: 1.25, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
            Configuración comercial
          </Typography>
          {!membresiaForm.id && membresiaForm.plan_id && String(planMembresiaSeleccionado?.tipo_producto || 'MEMBRESIA').toUpperCase() !== 'PASE_DIARIO' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {planMembresiaSeleccionado?.generar_venta && planMembresiaSeleccionado?.requiere_pago
                ? 'Venta inicial pendiente de cobro'
                : 'Sin venta inicial automática'}
            </Typography>
          )}
          {permiteCobroProgramado && !membresiaForm.cantidad_periodos_contratados && (
            <Box sx={{ display: 'grid', gridTemplateColumns: columnasFormulario, gap: 1.5, mb: 1.5 }}>
              <TextField fullWidth size="small" label="Día de pago" name="dia_pago" type="number"
                value={membresiaForm.dia_pago ?? ''} onChange={handleMembresiaChange}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 31 } }} />
              <TextField fullWidth size="small" label="Próximo cobro"
                value={proximoCobroPreview || 'Automático'}
                slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
              <Box sx={{ minHeight: 40, px: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                <FormControlLabel control={<Switch size="small" name="generar_venta_automatica"
                  checked={Boolean(membresiaForm.generar_venta_automatica)} onChange={handleMembresiaChange} />}
                  label="Renovaciones automáticas" sx={{ m: 0 }} />
              </Box>
            </Box>
          )}
        </Box>
        )}


        {(membresiaForm.id || (mostrarComercial && seccionNueva === 'sedes')) && (
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar onClick={handleGuardarMembresia} />
          </Stack>
        )}
        </Box>
      </Box> : null}
      {vistaMembresia === 'listado' && <Box sx={formStyles.seccion}>
        <GestionToolbar total={membresiasFiltradas.length} busqueda={buscarMembresia}
          onBusqueda={(valor) => { setBuscarMembresia(valor); setPaginaMembresia(1); }}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevaMembresia}>Añadir</Button>} />
        <TablaGestion total={membresiasCliente.length} filtrados={membresiasFiltradas.length}
          cargando={cargandoFicha} page={paginaMembresia} rowsPerPage={porPaginaMembresia}
          onPageChange={setPaginaMembresia} onRowsPerPageChange={(numero) => { setPorPaginaMembresia(numero); setPaginaMembresia(1); }}>
          <TableHead><TableRow>
            {['plan','vigencia','precio','estado'].map((campo) => <FilterHeaderCell key={campo}
              value={filtrosMembresia[campo]} onChange={(valores) => filtrarMembresia(campo, valores)}
              options={opcionesExcel(membresiasCliente, (m) => textoMembresia(m, campo))}>
              {{ plan: 'Plan', vigencia: 'Vigencia', precio: 'Precio', estado: 'Estado' }[campo]}
            </FilterHeaderCell>)}
            <TableCell align="center" sx={{ width: 116, minWidth: 116 }}>Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {membresiasFiltradas.slice((paginaMembresia - 1) * porPaginaMembresia, paginaMembresia * porPaginaMembresia).map((m) => <TableRow key={m.id} hover>
              <TableCell><Typography variant="body2" fontWeight={600}>{m.plan_nombre || '—'}</Typography>
                {m.modalidad_nombre && <Typography variant="caption" color="text.secondary">{m.modalidad_nombre}</Typography>}</TableCell>
              <TableCell>{textoMembresia(m, 'vigencia')}</TableCell>
              <TableCell>{textoMembresia(m, 'precio')}</TableCell>
              <TableCell><StatusChip estado={presentarEstadoMembresia(m).chip} label={presentarEstadoMembresia(m).label} /></TableCell>
              <TableCell align="center" sx={{ width: 116, minWidth: 116, whiteSpace: 'nowrap' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
                  <Tooltip title="Gestionar contrato">
                    <IconButton aria-label="Gestionar contrato" sx={{ ...dbanuStyles.actionEdit, m: 0, flexShrink: 0 }}
                      onClick={() => {
                        setMembresiaDetalle(m);
                        setVistaMembresia('detalle');
                      }}>
                      <EditOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver resumen del contrato (PDF)">
                    <IconButton aria-label="Ver resumen del contrato"
                      sx={{ ...dbanuStyles.actionView, m: 0, flexShrink: 0 }}
                      onClick={() => abrirResumenContrato(m)}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>)}
            {!membresiasFiltradas.length && !cargandoFicha && <TableRow><TableCell colSpan={5} align="center">No se encontraron membresías.</TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
      </Box>}
      <VisorPdf titulo="Resumen del contrato" pdf={resumenPdf} cargando={cargandoResumen} onCerrar={cerrarResumenContrato} />
      {vistaMembresia === 'detalle' && membresiaDetalle && (
        <DetalleMembresiaCliente
          membresia={membresiaDetalle}
          sedes={sedes}
          onVolver={() => setVistaMembresia('listado')}
          onEditar={handleEditarMembresia}
          onActualizado={async () => {
            try {
              const respuesta = await gimnasioServicio.obtenerDeportistaPorId(formData.id);
              const actualizadas = respuesta.datos?.membresias || [];
              setMembresiasCliente(actualizadas);
              const contrato = actualizadas.find(item => String(item.id) === String(membresiaDetalle.id));
              if (contrato) {
                setMembresiaDetalle(contrato);
                setMembresiaForm(anterior => ({
                  ...anterior,
                  estado: contrato.estado,
                  fecha_fin: limpiarFechaMembresia(contrato.fecha_fin),
                  periodos: contrato.periodos || anterior.periodos,
                  cuotas: contrato.cuotas || anterior.cuotas,
                }));
              }
            } catch (error) {
              showNotificacion('El movimiento fue guardado; no se logró actualizar la ficha. Recarga la pestaña.', 'warning');
            }
          }}
        />
      )}
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

  const renderProgreso = () => {
    const imcPreview = calcularImcPreview(progresoForm.peso_kg, progresoForm.talla_cm);
    const estado = estadoImc(imcPreview);

    return (
      <Stack spacing={2}>
        <Box sx={formStyles.seccion}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                  <Stack key={p.id} direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">{fechaProgreso(p.fecha_registro)}</Typography>
                      <Typography variant="body2" fontWeight="500">{p.peso_kg ? `${Number(p.peso_kg).toFixed(1)} kg` : 'Sin peso'}</Typography>
                      {p.imc ? <Chip label={`IMC ${Number(p.imc).toFixed(1)} · ${estadoFila.label}`} size="small" color={estadoFila.color} /> : null}
                      {p.grasa_corporal_pct ? <Typography variant="body2" color="text.secondary">{Number(p.grasa_corporal_pct).toFixed(1)}% grasa</Typography> : null}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar registro">
                        <IconButton sx={dbanuStyles.actionEdit} onClick={() => handleEditarProgreso(p)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
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
      if (!rmForm.ejercicio_id || !rmForm.peso || !rmForm.fecha_registro || (rmForm.tipo_registro === 'ESTIMADO' && !rmForm.repeticiones)) {
        showNotificacion('Completa los campos obligatorios del registro RM', 'warning');
        return;
      }

      const payload = {
        ...rmForm,
        cliente_id: formData.id,
        peso: Number(rmForm.peso),
        rm_estimado: undefined,
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
      <PruebasRendimientoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />
      <Box sx={formStyles.seccion}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
              <Stack key={p.id} direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', border: p.id === planSeleccionadoId ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: 2, p: 1.25, cursor: 'pointer' }}
                onClick={() => handleSeleccionarPlan(p)}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label={p.estado} size="small" />
                  <Typography variant="body2" fontWeight="500">{p.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{fechaPlan(p.fecha_inicio)} - {p.fecha_fin ? fechaPlan(p.fecha_fin) : 'Sin fin'}</Typography>
                  {p.entrenador_nombre ? <Typography variant="body2" color="text.secondary">Entrenador: {p.entrenador_nombre}</Typography> : null}
                </Stack>
                <Tooltip title="Editar plan">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={(e) => { e.stopPropagation(); handleEditarPlanEntrenamiento(p); }}>
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
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                    <Stack key={r.id} direction="row"
                      sx={{ alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip label={`Sem ${r.semana} · ${r.dia}`} size="small" />
                        <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.series} series{r.repeticiones ? ` x ${r.repeticiones}` : ''}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.carga_objetivo ? `${r.carga_objetivo} ${r.tipo_carga}` : r.tipo_carga}</Typography>
                        {sugerido ? <Chip label={`Sugerido: ${sugerido.toFixed(1)}`} size="small" color="info" /> : null}
                      </Stack>
                      <Tooltip title="Editar rutina">
                        <IconButton sx={dbanuStyles.actionEdit} onClick={() => handleEditarRutina(r)}>
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
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
          <TextField label="Repeticiones" name="repeticiones" type="number" value={rmForm.tipo_registro === 'DIRECTO' ? 1 : rmForm.repeticiones || ''} onChange={handleRmChange} size="small"
            disabled={rmForm.tipo_registro === 'DIRECTO'} required={rmForm.tipo_registro === 'ESTIMADO'}
            slotProps={{ htmlInput: { min: 1, max: 10 } }} helperText={rmForm.tipo_registro === 'ESTIMADO' ? '1 a 10 repeticiones · fórmula Epley' : 'Una repetición máxima real'} />
          <TextField label={rmForm.tipo_registro === 'DIRECTO' ? '1RM medida (kg)' : '1RM estimada (kg)'} size="small"
            value={rmForm.peso && rmForm.tipo_registro === 'DIRECTO' ? Number(rmForm.peso).toFixed(2) : rmForm.peso && Number(rmForm.repeticiones) >= 1 && Number(rmForm.repeticiones) <= 10 ? (Number(rmForm.peso) * (1 + Number(rmForm.repeticiones) / 30)).toFixed(2) : ''}
            slotProps={{ input: { readOnly: true } }} helperText="Cálculo definitivo validado por Laravel" />
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
              <Stack key={r.id} direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">{fechaRm(r.fecha_registro)}</Typography>
                  <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                  <Chip label={`RM ${Number(r.rm_estimado).toFixed(1)}`} size="small" />
                  <Typography variant="body2" color="text.secondary">{r.tipo_registro}</Typography>
                </Stack>
                <Tooltip title="Editar registro">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => handleEditarRm(r)}>
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
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelar} guardando={guardandoCliente} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  if (vista === 'ficha') {
    // Las pestañas dependen de lo guardado, no del select mientras se edita.
    const tabsFicha = !formData.id
      ? [TABS_FICHA[0], TAB_REPRESENTADOS]
      : formData.tutor_id || formData.representados_anteriores?.length ? [...TABS_FICHA, TAB_REPRESENTADOS] : TABS_FICHA;
    const nombreCliente = `${formData.nombres || ''} ${formData.apellidos || ''}`.trim() || formData.usuario_nombre || formData.name || formData.codigo_deportista;
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Perfil integral de ${nombreCliente}`}
          descripcion={formData.id
            ? 'Consulta y administra su información personal, membresías, valoraciones, entrenamientos y seguimiento deportivo.'
            : 'Consulta y administra los datos del tutor y los deportistas a su cargo.'}
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelarFicha} />}
        />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          {formData.codigo_deportista && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1.5 }}>
              <Chip size="small" variant="outlined" label={`Código cliente: ${formData.codigo_deportista}`} />
            </Box>
          )}
          <PestanasEstandar
            value={tabFicha}
            onChange={handleCambiarTabFicha}
            opciones={tabsFicha}
          />
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {tabFicha === 'datos' && renderCamposDatos()}
            {tabFicha === 'ficha_inicial' && <FichaInicialDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenador' && renderEntrenadorYHorario()}
            {tabFicha === 'membresia' && renderMembresia()}
            {tabFicha === 'progreso' && <InformeProgresoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenamiento' && renderEntrenamiento()}
            {tabFicha === 'representados' && <RepresentadosTutor representados={formData.representados} anteriores={formData.representados_anteriores} onAbrir={handleAbrirFicha} />}
          </Box>
          {tabFicha === 'datos' && (
            <Stack spacing={1.5}>
              <AccionesFormulario onGuardar={handleGuardarDatosFicha} onCancelar={handleCancelarFicha} textoCancelar="Volver a la lista" />
            </Stack>
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
