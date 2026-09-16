import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import { Box, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
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
  codigo_contrato: '',
  fecha_inicio: hoyISO(),
  fecha_fin: '',
  estado: 'PENDIENTE_PAGO',
  dias_gracia: 0,
  renovacion_automatica: false,
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

const precioAplicable = (plan, sedeId) => {
  if (!plan) return null;
  const precioSede = (plan.precios_sede || []).find((p) => String(p.sede_id) === String(sedeId));
  return precioSede ? Number(precioSede.precio) : Number(plan.precio_base || 0);
};

export function MembresiasPage() {
  const deportistaContextoId = obtenerDeportistaContexto();
  const [vista, setVista] = useState(deportistaContextoId ? 'formulario' : 'lista');
  const [formData, setFormData] = useState(() => ({ ...formInicial(), deportista_id: deportistaContextoId }));
  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], cliente: [], plan: [], estado: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [sedeHistoricaEditable, setSedeHistoricaEditable] = useState(false);

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargarMembresias = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerMembresias(parametros);
      setMembresias(response.datos || []);
      setMeta(response.meta || {});
    } catch {
      showNotificacion('Error al cargar membresías', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogosFormulario = async () => {
    try {
      const [clientesResponse, planesResponse, estructuraResponse] = await Promise.all([
        gimnasioServicio.obtenerDeportistas({ per_page: 100 }),
        gimnasioServicio.obtenerPlanes({ per_page: 100 }),
        gimnasioServicio.obtenerEstructuraOperativa(),
      ]);
      setClientes(clientesResponse.datos || []);
      setPlanes(planesResponse.datos || []);
      setSedes(estructuraResponse.datos?.sedes || []);
    } catch {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
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
    setSedeHistoricaEditable(false);
    setFormData(formInicial());
    setVista('formulario');
  };

  const handleCancelarFormulario = () => {
    setSedeHistoricaEditable(false);
    if (deportistaContextoId && window.history.length > 1) {
      window.history.back();
      return;
    }
    setVista('lista');
  };

  const handleEditar = (membresia) => {
    setSedeHistoricaEditable(!membresia.sede_id);
    setFormData({
      ...membresia,
      sede_id: membresia.sede_id || '',
      estado: normalizarEstado(membresia.estado),
      fecha_inicio: limpiarFecha(membresia.fecha_inicio),
      fecha_fin: limpiarFecha(membresia.fecha_fin),
      fecha_congelacion_inicio: limpiarFecha(membresia.fecha_congelacion_inicio),
      fecha_congelacion_fin: limpiarFecha(membresia.fecha_congelacion_fin),
      renovacion_automatica: Boolean(membresia.renovacion_automatica),
    });
    setVista('formulario');
  };

  const handleChange = (evento) => {
    const { name, value, checked, type } = evento.target;
    setFormData((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async (generarVenta = false) => {
    try {
      if (!formData.deportista_id || !formData.plan_id || !formData.sede_id || !formData.fecha_inicio) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }

      setGuardando(true);

      if (formData.id) {
        const payload = {
          sede_id: formData.sede_id || null,
          fecha_inicio: formData.fecha_inicio,
          estado: normalizarEstado(formData.estado),
          dias_gracia: Number(formData.dias_gracia || 0),
          renovacion_automatica: Boolean(formData.renovacion_automatica),
          fecha_congelacion_inicio: formData.fecha_congelacion_inicio || null,
          fecha_congelacion_fin: formData.fecha_congelacion_fin || null,
        };
        await gimnasioServicio.actualizarMembresia(formData.id, payload);
        showNotificacion('Membresía actualizada con éxito', 'success');
      } else {
        const respuesta = await gimnasioServicio.crearMembresia({
          deportista_id: formData.deportista_id,
          plan_id: formData.plan_id,
          sede_id: formData.sede_id,
          fecha_inicio: formData.fecha_inicio,
          dias_gracia: Number(formData.dias_gracia || 0),
          renovacion_automatica: Boolean(formData.renovacion_automatica),
          generar_venta: Boolean(generarVenta),
        });

        const ventaNumero = respuesta.datos?.venta_numero;
        showNotificacion(
          ventaNumero
            ? `Membresía creada. Venta ${ventaNumero} generada y pendiente de pago.`
            : 'Membresía creada como pendiente de pago.',
          'success'
        );
      }

      setSedeHistoricaEditable(false);
      if (deportistaContextoId && !formData.id && window.history.length > 1) {
        window.history.back();
        return;
      }
      setVista('lista');
      cargarMembresias();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || error.response?.data?.message || 'Error al guardar la membresía', 'error');
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

    return (
      <Box className="page-wrapper">
        <PageHeader titulo={esEdicion ? 'Editar Membresía' : 'Nueva Membresía'} descripcion={esEdicion ? 'Actualiza la vigencia y estado del contrato.' : 'Selecciona cliente, plan y sede. El código, la vigencia y el estado inicial se gestionan automáticamente.'} icono={<CardMembershipOutlinedIcon />} acciones={<BotonVolver onClick={handleCancelarFormulario} />} />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de la membresía</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                <TextField select label="Cliente" name="deportista_id" value={formData.deportista_id || ''} onChange={handleChange} required size="small" disabled={esEdicion || clienteContextual} helperText={clienteContextual ? 'Cliente recibido desde su ficha.' : ''}>
                  {clientes.map((cliente) => <MenuItem key={cliente.id} value={cliente.id}>{cliente.usuario_nombre || cliente.name || 'Cliente'} - {cliente.codigo_deportista}</MenuItem>)}
                  {(esEdicion || clienteContextual) && !clientes.find((cliente) => String(cliente.id) === String(formData.deportista_id)) ? <MenuItem value={formData.deportista_id}>{formData.deportista_nombre || 'Cliente seleccionado'}</MenuItem> : null}
                </TextField>

                <TextField select label="Plan" name="plan_id" value={formData.plan_id || ''} onChange={handleChange} required size="small" disabled={esEdicion}>
                  {planes.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.nombre} - ${Number(plan.precio_base || 0).toFixed(2)}</MenuItem>)}
                  {esEdicion && !planes.find((plan) => String(plan.id) === String(formData.plan_id)) ? <MenuItem value={formData.plan_id}>{formData.plan_nombre || 'Plan asignado'}</MenuItem> : null}
                </TextField>

                <TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={handleChange} required size="small" disabled={esEdicion && !sedeHistoricaEditable} helperText={sedeHistoricaEditable ? 'Registro histórico sin sede. Selecciónala y guarda.' : (!esEdicion && formData.plan_id && formData.sede_id ? `Precio aplicado: $${precioAplicable(planSeleccionado, formData.sede_id).toFixed(2)}` : '')}>
                  {sedes.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}
                  {esEdicion && formData.sede_id && !sedes.find((sede) => String(sede.id_sede) === String(formData.sede_id)) ? <MenuItem value={formData.sede_id}>{formData.sede_nombre || 'Sede asignada'}</MenuItem> : null}
                </TextField>

                <TextField label="Código contrato" value={esEdicion ? formData.codigo_contrato || '' : 'Se genera al guardar'} size="small" disabled helperText="Identificador único generado por el sistema." />
                <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={formData.fecha_inicio || ''} onChange={handleChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Fecha fin" type="date" value={formData.fecha_fin || ''} size="small" disabled slotProps={{ inputLabel: { shrink: true } }} helperText="Calculada automáticamente según la duración del plan." />

                {esEdicion ? (
                  <TextField select label="Estado" name="estado" value={normalizarEstado(formData.estado)} onChange={handleChange} required size="small"><MenuItem value="PENDIENTE_PAGO">Pendiente pago</MenuItem><MenuItem value="ACTIVA">Activa</MenuItem><MenuItem value="VENCIDA">Vencida</MenuItem><MenuItem value="CONGELADA">Congelada</MenuItem><MenuItem value="CANCELADA">Cancelada</MenuItem></TextField>
                ) : (
                  <TextField label="Estado inicial" value="Pendiente de pago" size="small" disabled helperText="Se activa automáticamente cuando el pago queda confirmado." />
                )}

                <TextField label="Días de gracia" name="dias_gracia" type="number" value={formData.dias_gracia ?? 0} onChange={handleChange} size="small" helperText="Acceso adicional después del vencimiento; no cambia la fecha contractual." />
                <FormControlLabel control={<Switch name="renovacion_automatica" checked={Boolean(formData.renovacion_automatica)} onChange={handleChange} disabled={!esRenovable} />} label={esRenovable ? 'Renovación automática' : 'Plan no renovable'} />
              </Box>
            </Box>

            {esEdicion ? (
              <Box sx={{ ...formStyles.seccion, mt: 2 }}>
                <Typography sx={formStyles.modalSeccionTitulo}>Congelación</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Usa estas fechas solo cuando el contrato deba pausarse temporalmente.</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <TextField label="Inicio congelación" name="fecha_congelacion_inicio" type="date" value={formData.fecha_congelacion_inicio || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Fin congelación" name="fecha_congelacion_fin" type="date" value={formData.fecha_congelacion_fin || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                </Box>
              </Box>
            ) : null}
          </Box>

          {esEdicion ? (
            <AccionesFormulario onGuardar={() => handleGuardar(false)} onCancelar={handleCancelarFormulario} guardando={guardando} />
          ) : (
            <Stack direction="row" sx={dbanuStyles.formActions} spacing={1}>
              <BotonCancelar onClick={handleCancelarFormulario} disabled={guardando} />
              <BotonGuardar onClick={() => handleGuardar(false)} texto="Guardar pendiente" guardando={guardando} />
              {puedeGenerarVenta ? <BotonGuardar onClick={() => handleGuardar(true)} texto="Guardar y cobrar" guardando={guardando} /> : null}
            </Stack>
          )}
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Membresías" descripcion="Contratos asignados a clientes, con plan, sede, vigencia, cobro y estado." icono={<CardMembershipOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || membresias.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <MembresiasTable membresias={membresias} meta={meta} cargando={cargando} filtrosColumna={filtrosColumna} onFiltroColumna={aplicarFiltroColumna} onEditar={handleEditar} onCancelada={handleMembresiaCancelada} onErrorCancelar={handleErrorCancelarMembresia} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargarMembresias(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargarMembresias(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
