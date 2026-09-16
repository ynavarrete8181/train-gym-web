import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { Box, Button, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
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
  activo: true
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

  const showNotificacion = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo });
  };

  const cargarPlanes = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerPlanes(parametros);
      setPlanes(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      showNotificacion('Error al cargar los planes', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargarPlanes();
  }, [vista]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const resp = await gimnasioServicio.obtenerEstructuraOperativa();
        setSedes(resp.datos?.sedes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSedes();
  }, []);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargarPlanes(nuevos);
  };

  const handleNuevo = () => {
    setFormData(getInitialForm());
    setVista('formulario');
  };

  const handleEliminar = async (plan) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar plan',
      texto: `¿Estás seguro que deseas eliminar el plan "${plan.nombre}"?`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning'
    });

    if (confirmado) {
      try {
        await gimnasioServicio.eliminarPlan(plan.id);
        setNotificacion({ abierto: true, mensaje: 'Plan eliminado con éxito', tipo: 'success' });
        cargarPlanes();
      } catch (error) {
        const msg = error?.response?.data?.mensaje || 'Error al eliminar el plan';
        setNotificacion({ abierto: true, mensaje: msg, tipo: 'error' });
      }
    }
  };

  const handleAddPrecioSede = () => {
    setFormData(prev => ({
      ...prev,
      precios_sede: [...(prev.precios_sede || []), { sede_id: '', precio: '' }]
    }));
  };

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
    setFormData({ ...plan, precios_sede: plan.precios_sede || [] });
    setVista('formulario');
  };

  const handleCancelar = () => {
    setVista('lista');
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardar = async () => {
    try {
      if (!formData.codigo || !formData.nombre || !formData.precio_base || !formData.duracion) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }

      const preciosSedeValidos = (formData.precios_sede || []).filter((fila) => fila.sede_id && fila.precio !== '');
      if (preciosSedeValidos.length !== (formData.precios_sede || []).length) {
        showNotificacion('Completa la sede y el precio de cada fila, o quítala', 'warning');
        return;
      }

      const payload = {
        ...formData,
        precio_base: parseFloat(formData.precio_base),
        tarifa_inscripcion: parseFloat(formData.tarifa_inscripcion || 0),
        duracion: parseInt(formData.duracion, 10),
        precios_sede: preciosSedeValidos.map((fila) => ({ sede_id: Number(fila.sede_id), precio: parseFloat(fila.precio) })),
      };

      if (formData.id) {
        await gimnasioServicio.actualizarPlan(formData.id, payload);
        showNotificacion('Plan actualizado con éxito', 'success');
      } else {
        await gimnasioServicio.crearPlan(payload);
        showNotificacion('Plan creado con éxito', 'success');
      }

      setVista('lista');
      cargarPlanes();
    } catch (error) {
      console.error(error);
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el plan';
      showNotificacion(mensaje, 'error');
    }
  };

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={formData.id ? "Editar Plan" : "Nuevo Plan"}
          descripcion="Define la duración estándar y las tarifas del plan. La vigencia real se establece al crear la membresía del cliente."
          icono={<LocalOfferOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelar} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Stack spacing={2}>
              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Datos del plan</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 1.5 }}>
                  <TextField label="Código Único" name="codigo" value={formData.codigo} onChange={handleChange} required size="small" helperText="Ej: MENSUAL-BASICO" />
                  <TextField label="Nombre del Plan" name="nombre" value={formData.nombre} onChange={handleChange} required size="small" helperText="Ej: Mensualidad Pesas Premium" />
                </Box>
                <Box sx={{ mt: 1.5 }}>
                  <TextField fullWidth label="Descripción / Beneficios" name="descripcion" value={formData.descripcion} onChange={handleChange} multiline rows={2} size="small" />
                </Box>
              </Box>

              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>Duración estándar y tarifas</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Esta duración define la vigencia habitual del producto. Al asignarlo a un cliente, la membresía calcula sus fechas reales de inicio y fin.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, alignItems: 'start' }}>
                  <TextField select label="Tipo de Duración" name="tipo_duracion" value={formData.tipo_duracion} onChange={handleChange} size="small">
                    <MenuItem value="DIAS">Días</MenuItem>
                    <MenuItem value="MESES">Meses</MenuItem>
                    <MenuItem value="ANIOS">Años</MenuItem>
                  </TextField>
                  <TextField label="Duración" name="duracion" type="number" value={formData.duracion} onChange={handleChange} required size="small" helperText="Ej.: 1 mes o 1 día, según el tipo seleccionado." />
                  <TextField label="Precio Base ($)" name="precio_base" type="number" value={formData.precio_base} onChange={handleChange} required size="small" />
                  <TextField label="Tarifa de Inscripción ($)" name="tarifa_inscripcion" type="number" value={formData.tarifa_inscripcion} onChange={handleChange} size="small" helperText="Opcional" />
                </Box>
              </Box>

              <Box sx={formStyles.seccion}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={formStyles.modalSeccionTitulo}>Precios por sede</Typography>
                    <Typography variant="body2" color="text.secondary">Opcional. Si una sede no tiene precio propio, se usa el Precio Base de arriba.</Typography>
                  </Box>
                  <Button size="small" startIcon={<AddOutlinedIcon />} onClick={handleAddPrecioSede}>Agregar precio</Button>
                </Stack>
                {(formData.precios_sede || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Este plan usa el mismo precio (${Number(formData.precio_base || 0).toFixed(2)}) en todas las sedes.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {(formData.precios_sede || []).map((fila, index) => (
                      <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                        <TextField select label="Sede" size="small" value={fila.sede_id || ''} onChange={(e) => handleUpdatePrecioSede(index, 'sede_id', e.target.value)} sx={{ flex: 1 }}>
                          {sedes.map((sede) => (
                            <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>
                          ))}
                        </TextField>
                        <TextField label="Precio ($)" type="number" size="small" value={fila.precio} onChange={(e) => handleUpdatePrecioSede(index, 'precio', e.target.value)} sx={{ width: 140 }} />
                        <Tooltip title="Quitar">
                          <IconButton size="small" onClick={() => handleRemovePrecioSede(index)} sx={dbanuStyles.actionDelete}>
                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}
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
      <PageHeader titulo="Planes de membresía" descripcion="Administra las suscripciones que ofreces en tu gimnasio" icono={<ListAltOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || planes.length}
          busqueda={filtros.busqueda}
          onBusqueda={(v) => buscar({ ...filtros, busqueda: v })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />
        <PlanesTable
          planes={planes}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={(col, val) => setFiltrosColumna({ ...filtrosColumna, [col]: val })}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
          onPageChange={(p) => {
            const n = { ...filtros, page: p };
            setFiltros(n);
            cargarPlanes(n);
          }}
          onRowsPerPageChange={(pp) => {
            const n = { ...filtros, page: 1, per_page: pp };
            setFiltros(n);
            cargarPlanes(n);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
