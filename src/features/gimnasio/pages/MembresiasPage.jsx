import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import { Box, Button, FormControlLabel, MenuItem, Paper, Switch, TextField, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { MembresiasTable } from '../components/MembresiasTable.jsx';

const hoyISO = () => new Date().toISOString().slice(0, 10);

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

const limpiarFecha = (valor) => valor ? String(valor).slice(0, 10) : '';

// Calcula la fecha de fin de una membresía sumando la duración del plan
// (DIAS, MESES o ANIOS) a la fecha de inicio. Mismo criterio que el proyecto
// de referencia (Desarrollo/Revive): se suma la duración tal cual, sin
// restar un día, para mantener el mismo comportamiento en todo el sistema.
const calcularFechaFin = (fechaInicioStr, plan) => {
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

const precioAplicable = (plan, sedeId) => {
  if (!plan) return null;
  const precioSede = (plan.precios_sede || []).find((p) => String(p.sede_id) === String(sedeId));
  return precioSede ? Number(precioSede.precio) : Number(plan.precio_base || 0);
};

export function MembresiasPage() {
  const [vista, setVista] = useState('lista');
  const [formData, setFormData] = useState(formInicial());
  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], cliente: [], plan: [], estado: [] });
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargarMembresias = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerMembresias(parametros);
      setMembresias(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
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
    } catch (error) {
      showNotificacion('Error al cargar catálogos del formulario', 'error');
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargarMembresias();
    else cargarCatalogosFormulario();
  }, [vista]);

  // Recalcula automáticamente la fecha_fin cuando cambian el plan o la fecha
  // de inicio, solo al crear (no al editar, para no pisar una fecha que el
  // administrador ya ajustó manualmente en una membresía existente).
  useEffect(() => {
    if (formData.id) return;
    if (!formData.fecha_inicio || !formData.plan_id) return;

    const plan = planes.find((p) => String(p.id) === String(formData.plan_id));
    if (!plan) return;

    const nuevaFechaFin = calcularFechaFin(formData.fecha_inicio, plan);
    if (nuevaFechaFin) {
      setFormData((actual) => ({ ...actual, fecha_fin: nuevaFechaFin }));
    }
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
    setFormData(formInicial());
    setVista('formulario');
  };

  const handleEditar = (membresia) => {
    setFormData({
      ...membresia,
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

  const handleGuardar = async () => {
    try {
      if (!formData.deportista_id || !formData.plan_id || !formData.sede_id || !formData.codigo_contrato || !formData.fecha_inicio || !formData.fecha_fin) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }

      const payload = {
        ...formData,
        dias_gracia: Number(formData.dias_gracia || 0),
        renovacion_automatica: Boolean(formData.renovacion_automatica),
      };

      if (!payload.fecha_congelacion_inicio) delete payload.fecha_congelacion_inicio;
      if (!payload.fecha_congelacion_fin) delete payload.fecha_congelacion_fin;

      if (formData.id) {
        await gimnasioServicio.actualizarMembresia(formData.id, payload);
        showNotificacion('Membresía actualizada con éxito', 'success');
      } else {
        await gimnasioServicio.crearMembresia(payload);
        showNotificacion('Membresía creada con éxito', 'success');
      }

      setVista('lista');
      cargarMembresias();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al guardar la membresía', 'error');
    }
  };

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={formData.id ? 'Editar Membresía' : 'Nueva Membresía'}
          descripcion="Asigna planes, vigencias y estados a los clientes."
          icono={<CardMembershipOutlinedIcon />}
          acciones={<BotonVolver onClick={() => setVista('lista')} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de la membresía</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                <TextField select label="Cliente" name="deportista_id" value={formData.deportista_id || ''} onChange={handleChange} required size="small" disabled={!!formData.id}>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id}>{cliente.usuario_nombre || cliente.name || 'Cliente'} - {cliente.codigo_deportista}</MenuItem>
                  ))}
                  {formData.id && !clientes.find((cliente) => String(cliente.id) === String(formData.deportista_id)) ? (
                    <MenuItem value={formData.deportista_id}>{formData.deportista_nombre || 'Cliente asignado'}</MenuItem>
                  ) : null}
                </TextField>
                <TextField select label="Plan" name="plan_id" value={formData.plan_id || ''} onChange={handleChange} required size="small" disabled={!!formData.id}>
                  {planes.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>{plan.nombre} - ${Number(plan.precio_base || 0).toFixed(2)}</MenuItem>
                  ))}
                  {formData.id && !planes.find((plan) => String(plan.id) === String(formData.plan_id)) ? (
                    <MenuItem value={formData.plan_id}>{formData.plan_nombre || 'Plan asignado'}</MenuItem>
                  ) : null}
                </TextField>
                <TextField
                  select
                  label="Sede"
                  name="sede_id"
                  value={formData.sede_id || ''}
                  onChange={handleChange}
                  required
                  size="small"
                  disabled={!!formData.id}
                  helperText={
                    !formData.id && formData.plan_id && formData.sede_id
                      ? `Precio aplicado: $${precioAplicable(planes.find((p) => String(p.id) === String(formData.plan_id)), formData.sede_id).toFixed(2)}`
                      : ''
                  }
                >
                  {sedes.map((sede) => (
                    <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>
                  ))}
                  {formData.id && !sedes.find((sede) => String(sede.id_sede) === String(formData.sede_id)) ? (
                    <MenuItem value={formData.sede_id}>{formData.sede_nombre || 'Sede asignada'}</MenuItem>
                  ) : null}
                </TextField>
                <TextField label="Código contrato" name="codigo_contrato" value={formData.codigo_contrato || ''} onChange={handleChange} required size="small" disabled={!!formData.id} />
                <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={formData.fecha_inicio || ''} onChange={handleChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField
                  label="Fecha fin"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin || ''}
                  onChange={handleChange}
                  required
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={!formData.id ? 'Calculada según la duración del plan. Puedes ajustarla si es necesario.' : ''}
                />
                <TextField select label="Estado" name="estado" value={formData.estado || 'PENDIENTE_PAGO'} onChange={handleChange} required size="small">
                  <MenuItem value="PENDIENTE_PAGO">Pendiente pago</MenuItem>
                  <MenuItem value="ACTIVA">Activa</MenuItem>
                  <MenuItem value="VENCIDA">Vencida</MenuItem>
                  <MenuItem value="CONGELADA">Congelada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                </TextField>
                <TextField label="Días de gracia" name="dias_gracia" type="number" value={formData.dias_gracia || 0} onChange={handleChange} size="small" />
                <FormControlLabel control={<Switch name="renovacion_automatica" checked={Boolean(formData.renovacion_automatica)} onChange={handleChange} />} label="Renovación automática" />
              </Box>
            </Box>

            <Box sx={{ ...formStyles.seccion, mt: 2 }}>
              <Typography sx={formStyles.modalSeccionTitulo}>Congelación</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                <TextField label="Inicio congelación" name="fecha_congelacion_inicio" type="date" value={formData.fecha_congelacion_inicio || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Fin congelación" name="fecha_congelacion_fin" type="date" value={formData.fecha_congelacion_fin || ''} onChange={handleChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
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
      <PageHeader
        titulo="Membresías"
        descripcion="Planes asignados, vigencias y estados de los clientes."
        icono={<CardMembershipOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || membresias.length}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />
        <MembresiasTable
          membresias={membresias}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onEditar={handleEditar}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargarMembresias(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargarMembresias(nuevos);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
