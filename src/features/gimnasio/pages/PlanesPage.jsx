import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { PlanesTable } from '../components/PlanesTable.jsx';

const getInitialForm = () => ({
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_duracion: 'MESES',
  duracion: 1,
  precio_base: 0,
  tarifa_inscripcion: 0,
  tipo_producto: 'MEMBRESIA',
  tipo_cobro: 'RECURRENTE',
  generar_venta: true,
  requiere_pago: true,
  requiere_entrenador: false,
  renovable: true,
  activo: true,
  precios_sede: [],
});

export function PlanesPage() {
  const [vista, setVista] = useState('lista');
  const [formData, setFormData] = useState(getInitialForm());
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [planes, setPlanes] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], nombre: [], estado: [] });
  const [cargando, setCargando] = useState(true);
  const [sedes, setSedes] = useState([]);

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargarPlanes = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerPlanes(parametros);
      setPlanes(response.datos || []);
      setMeta(response.meta || {});
    } catch {
      showNotificacion('Error al cargar los planes', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (vista === 'lista') cargarPlanes(); }, [vista]);

  useEffect(() => {
    gimnasioServicio.obtenerEstructuraOperativa()
      .then((resp) => setSedes(resp.datos?.sedes || []))
      .catch(() => setSedes([]));
  }, []);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarPlanes(nuevos);
  };

  const handleNuevo = () => { setFormData(getInitialForm()); setVista('formulario'); };

  const handleEliminar = async (plan) => {
    const confirmado = await confirmarAccion({ titulo: 'Eliminar plan', texto: `¿Estás seguro que deseas eliminar el plan "${plan.nombre}"?`, textoConfirmar: 'Sí, eliminar', icono: 'warning' });
    if (!confirmado) return;
    try {
      await gimnasioServicio.eliminarPlan(plan.id);
      showNotificacion('Plan eliminado con éxito', 'success');
      cargarPlanes();
    } catch (error) {
      showNotificacion(error?.response?.data?.mensaje || 'Error al eliminar el plan', 'error');
    }
  };

  const handleAddPrecioSede = () => setFormData((prev) => ({ ...prev, precios_sede: [...(prev.precios_sede || []), { sede_id: '', precio: '' }] }));
  const handleUpdatePrecioSede = (index, field, value) => {
    const nuevos = [...(formData.precios_sede || [])];
    nuevos[index][field] = value;
    setFormData({ ...formData, precios_sede: nuevos });
  };
  const handleRemovePrecioSede = (index) => {
    const nuevos = [...(formData.precios_sede || [])];
    nuevos.splice(index, 1);
    setFormData({ ...formData, precios_sede: nuevos });
  };

  const handleEditar = (plan) => {
    setFormData({ ...getInitialForm(), ...plan, precios_sede: plan.precios_sede || [] });
    setVista('formulario');
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => {
      const siguiente = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'tipo_producto' && value === 'PASE_DIARIO') {
        siguiente.tipo_cobro = 'PAGO_UNICO';
        siguiente.renovable = false;
        siguiente.tipo_duracion = 'DIAS';
        siguiente.duracion = 1;
        siguiente.tarifa_inscripcion = 0;
      }
      return siguiente;
    });
  };

  const handleGuardar = async () => {
    try {
      if (!String(formData.nombre || '').trim()) {
        showNotificacion('Ingresa el nombre del plan.', 'warning');
        return;
      }

      const precioBase = Number(formData.precio_base);
      const duracion = Number(formData.duracion);

      if (!Number.isFinite(precioBase) || precioBase < 0) {
        showNotificacion('El precio base debe ser un valor válido mayor o igual a 0.', 'warning');
        return;
      }

      if (!Number.isInteger(duracion) || duracion < 1) {
        showNotificacion('La duración debe ser un número entero mayor o igual a 1.', 'warning');
        return;
      }

      const preciosSedeValidos = (formData.precios_sede || []).filter((fila) => fila.sede_id && fila.precio !== '');
      if (preciosSedeValidos.length !== (formData.precios_sede || []).length) {
        showNotificacion('Completa la sede y el precio de cada fila, o quítala.', 'warning');
        return;
      }

      const sedesSeleccionadas = preciosSedeValidos.map((fila) => String(fila.sede_id));
      if (new Set(sedesSeleccionadas).size !== sedesSeleccionadas.length) {
        showNotificacion('No puedes registrar dos precios para la misma sede.', 'warning');
        return;
      }

      const precioSedeInvalido = preciosSedeValidos.some((fila) => {
        const precio = Number(fila.precio);
        return !Number.isFinite(precio) || precio < 0;
      });
      if (precioSedeInvalido) {
        showNotificacion('Todos los precios por sede deben ser valores válidos mayores o iguales a 0.', 'warning');
        return;
      }

      const payload = {
        ...formData,
        codigo: formData.id ? formData.codigo : undefined,
        precio_base: precioBase,
        tarifa_inscripcion: formData.tipo_producto === 'PASE_DIARIO' ? 0 : Number(formData.tarifa_inscripcion || 0),
        duracion: formData.tipo_producto === 'PASE_DIARIO' ? 1 : duracion,
        generar_venta: Boolean(formData.generar_venta),
        requiere_pago: Boolean(formData.requiere_pago),
        requiere_entrenador: Boolean(formData.requiere_entrenador),
        renovable: Boolean(formData.renovable),
        precios_sede: preciosSedeValidos.map((fila) => ({ sede_id: Number(fila.sede_id), precio: parseFloat(fila.precio) })),
      };

      if (formData.id) await gimnasioServicio.actualizarPlan(formData.id, payload);
      else await gimnasioServicio.crearPlan(payload);

      showNotificacion(formData.id ? 'Plan actualizado con éxito' : 'Plan creado con éxito', 'success');
      setVista('lista');
      cargarPlanes();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      showNotificacion(error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el plan', 'error');
    }
  };

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={formData.id ? 'Editar Plan' : 'Nuevo Plan'} descripcion="Define producto, cobro, duración estándar y tarifas. La vigencia real se calcula al crear la membresía." icono={<LocalOfferOutlinedIcon />} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Stack spacing={2}>
              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Datos del plan</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 1.5 }}>
                  <TextField
                    label="Código"
                    value={formData.id ? formData.codigo || '' : 'Se genera al guardar'}
                    size="small"
                    disabled
                    helperText="Identificador generado automáticamente por el sistema."
                  />
                  <TextField label="Nombre del Plan" name="nombre" value={formData.nombre} onChange={handleChange} required size="small" />
                </Box>
                <TextField fullWidth label="Descripción / Beneficios" name="descripcion" value={formData.descripcion || ''} onChange={handleChange} multiline rows={2} size="small" sx={{ mt: 1.5 }} />
              </Box>

              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Comportamiento comercial</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <TextField select label="Tipo de producto" name="tipo_producto" value={formData.tipo_producto || 'MEMBRESIA'} onChange={handleChange} size="small">
                    <MenuItem value="MEMBRESIA">Membresía</MenuItem>
                    <MenuItem value="PASE_DIARIO">Pase diario</MenuItem>
                    <MenuItem value="PAQUETE_VISITAS">Paquete de visitas</MenuItem>
                    <MenuItem value="PAQUETE_SESIONES">Paquete de sesiones</MenuItem>
                  </TextField>
                  <TextField select label="Tipo de cobro" name="tipo_cobro" value={formData.tipo_cobro || 'PAGO_UNICO'} onChange={handleChange} size="small" disabled={formData.tipo_producto === 'PASE_DIARIO'}>
                    <MenuItem value="PAGO_UNICO">Pago único</MenuItem>
                    <MenuItem value="RECURRENTE">Recurrente</MenuItem>
                  </TextField>
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
                  <FormControlLabel control={<Switch name="generar_venta" checked={Boolean(formData.generar_venta)} onChange={handleChange} />} label="Generar cobro al contratar" />
                  <FormControlLabel control={<Switch name="requiere_pago" checked={Boolean(formData.requiere_pago)} onChange={handleChange} />} label="Requiere pago para activar" />
                  <FormControlLabel control={<Switch name="requiere_entrenador" checked={Boolean(formData.requiere_entrenador)} onChange={handleChange} />} label="Requiere entrenador" />
                  <FormControlLabel control={<Switch name="renovable" checked={Boolean(formData.renovable)} onChange={handleChange} disabled={formData.tipo_producto === 'PASE_DIARIO'} />} label="Renovable" />
                </Stack>
              </Box>

              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Duración estándar y tarifas</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>La fecha fin del contrato se calcula automáticamente desde esta duración.</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField select label="Tipo de Duración" name="tipo_duracion" value={formData.tipo_duracion} onChange={handleChange} size="small" disabled={formData.tipo_producto === 'PASE_DIARIO'}><MenuItem value="DIAS">Días</MenuItem><MenuItem value="MESES">Meses</MenuItem><MenuItem value="ANIOS">Años</MenuItem></TextField>
                  <TextField label="Duración" name="duracion" type="number" value={formData.duracion} onChange={handleChange} required size="small" disabled={formData.tipo_producto === 'PASE_DIARIO'} />
                  <TextField label="Precio Base ($)" name="precio_base" type="number" value={formData.precio_base} onChange={handleChange} required size="small" inputProps={{ min: 0, step: '0.01' }} />
                  {formData.tipo_producto !== 'PASE_DIARIO' ? (
                    <TextField label="Tarifa de Inscripción ($)" name="tarifa_inscripcion" type="number" value={formData.tarifa_inscripcion} onChange={handleChange} size="small" helperText="Opcional" inputProps={{ min: 0, step: '0.01' }} />
                  ) : (
                    <Box />
                  )}
                </Box>
              </Box>

              <Box sx={formStyles.seccion}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box><Typography sx={formStyles.modalSeccionTitulo}>Precios por sede</Typography><Typography variant="body2" color="text.secondary">Opcional. Si una sede no tiene precio propio, usa el Precio Base.</Typography></Box>
                  <Button size="small" startIcon={<AddOutlinedIcon />} onClick={handleAddPrecioSede}>Agregar precio</Button>
                </Stack>
                {(formData.precios_sede || []).length === 0 ? <Typography variant="body2" color="text.secondary">Este plan usa el mismo precio (${Number(formData.precio_base || 0).toFixed(2)}) en todas las sedes.</Typography> : (
                  <Stack spacing={1}>{(formData.precios_sede || []).map((fila, index) => (
                    <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                      <TextField select label="Sede" size="small" value={fila.sede_id || ''} onChange={(e) => handleUpdatePrecioSede(index, 'sede_id', e.target.value)} sx={{ flex: 1 }}>{sedes.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}</TextField>
                      <TextField label="Precio ($)" type="number" size="small" value={fila.precio} onChange={(e) => handleUpdatePrecioSede(index, 'precio', e.target.value)} sx={{ width: 140 }} />
                      <Tooltip title="Quitar"><IconButton size="small" onClick={() => handleRemovePrecioSede(index)} sx={dbanuStyles.actionDelete}><DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                    </Stack>
                  ))}</Stack>
                )}
              </Box>
            </Stack>
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Planes de membresía" descripcion="Administra los productos comerciales, vigencias y formas de cobro de Revive." icono={<ListAltOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || planes.length} busqueda={filtros.busqueda} onBusqueda={(v) => buscar({ ...filtros, busqueda: v })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <PlanesTable planes={planes} meta={meta} cargando={cargando} filtrosColumna={filtrosColumna} onFiltroColumna={(col, val) => setFiltrosColumna({ ...filtrosColumna, [col]: val })} onEditar={handleEditar} onEliminar={handleEliminar} onPageChange={(p) => { const n = { ...filtros, page: p }; setFiltros(n); cargarPlanes(n); }} onRowsPerPageChange={(pp) => { const n = { ...filtros, page: 1, per_page: pp }; setFiltros(n); cargarPlanes(n); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
