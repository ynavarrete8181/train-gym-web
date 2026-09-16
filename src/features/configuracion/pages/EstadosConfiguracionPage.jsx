import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { Box, Button, FormControlLabel, MenuItem, Paper, Switch, TextField, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { EstadosConfiguracionTable } from '../components/EstadosConfiguracionTable.jsx';
import { configuracionServicio } from '../services/configuracionServicio.js';

const estadoInicial = () => ({
  id: null,
  codigo: '',
  entidad: 'MEMBRESIA',
  valor_interno: '',
  nombre: '',
  descripcion: '',
  color: 'default',
  orden: 1,
  activo: true,
  es_inicial: false,
  es_final: false,
  protegido_sistema: false,
});

const filtrosIniciales = () => ({ busqueda: '', page: 1, per_page: 5 });
const filtrosColumnaIniciales = () => ({
  codigo: [],
  entidad: [],
  valor_interno: [],
  nombre: [],
  color: [],
  inicial: [],
  final: [],
  protegido: [],
  estado: [],
});

const colores = [
  ['default', 'Neutro'],
  ['info', 'Informativo'],
  ['success', 'Éxito'],
  ['warning', 'Advertencia'],
  ['error', 'Error / cancelado'],
];

export function EstadosConfiguracionPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [formData, setFormData] = useState(estadoInicial());
  const [filtros, setFiltros] = useState(filtrosIniciales());
  const [filtrosColumna, setFiltrosColumna] = useState(filtrosColumnaIniciales());
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await configuracionServicio.obtenerEstados(parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo cargar el catálogo de estados', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargar();
  }, [vista]);

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevasColumnas = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevasColumnas, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevasColumnas);
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const handleNuevo = () => {
    setFormData(estadoInicial());
    setVista('formulario');
  };

  const handleEditar = (item) => {
    setFormData({ ...estadoInicial(), ...item });
    setVista('formulario');
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async () => {
    try {
      if (!formData.codigo || !formData.entidad || !formData.valor_interno || !formData.nombre) {
        showNotificacion('Complete código, entidad, valor interno y nombre', 'warning');
        return;
      }

      const payload = {
        ...formData,
        codigo: String(formData.codigo).trim().toUpperCase(),
        entidad: String(formData.entidad).trim().toUpperCase(),
        valor_interno: String(formData.valor_interno).trim().toUpperCase(),
        orden: Number(formData.orden || 1),
        activo: Boolean(formData.activo),
        es_inicial: Boolean(formData.es_inicial),
        es_final: Boolean(formData.es_final),
      };

      if (formData.id) {
        await configuracionServicio.actualizarEstado(formData.id, payload);
        showNotificacion('Estado actualizado correctamente', 'success');
      } else {
        await configuracionServicio.crearEstado(payload);
        showNotificacion('Estado creado correctamente', 'success');
      }

      setVista('lista');
      cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      showNotificacion(primerError || error.response?.data?.mensaje || 'No se pudo guardar el estado', 'error');
    }
  };

  const handleDesactivar = async (item) => {
    const confirmado = await confirmarAccion({
      titulo: 'Desactivar estado',
      texto: `¿Deseas desactivar el estado “${item.nombre}”?`,
      textoConfirmar: 'Sí, desactivar',
      icono: 'warning',
    });
    if (!confirmado) return;

    try {
      await configuracionServicio.desactivarEstado(item.id);
      showNotificacion('Estado desactivado correctamente', 'success');
      cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      showNotificacion(primerError || error.response?.data?.mensaje || 'No se pudo desactivar el estado', 'error');
    }
  };

  if (vista === 'formulario') {
    const protegido = Boolean(formData.protegido_sistema);
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={formData.id ? 'Editar estado' : 'Nuevo estado'}
          descripcion="Catálogos → Estados. El código y valor interno de estados protegidos no se modifican; su presentación sí."
          icono={<TuneOutlinedIcon />}
          acciones={<BotonVolver onClick={() => setVista('lista')} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos del estado</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                <TextField label="Código" name="codigo" value={formData.codigo} onChange={handleChange} required size="small" disabled={protegido} helperText={protegido ? 'Código protegido por reglas del sistema.' : 'Ej.: MEM_EN_REVISION'} />
                <TextField label="Entidad" name="entidad" value={formData.entidad} onChange={handleChange} required size="small" disabled={protegido} helperText="Ej.: MEMBRESIA, VENTA, PAGO" />
                <TextField label="Valor interno" name="valor_interno" value={formData.valor_interno} onChange={handleChange} required size="small" disabled={protegido} helperText="Valor guardado en la tabla, ej.: PENDIENTE_PAGO" />
                <TextField label="Nombre visible" name="nombre" value={formData.nombre} onChange={handleChange} required size="small" />
                <TextField select label="Color" name="color" value={formData.color} onChange={handleChange} required size="small">
                  {colores.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
                <TextField label="Orden" name="orden" type="number" value={formData.orden} onChange={handleChange} required size="small" />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', gridColumn: { xs: 'auto', md: 'span 3' } }}>
                  <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={handleChange} />} label="Activo" />
                  <FormControlLabel control={<Switch name="es_inicial" checked={Boolean(formData.es_inicial)} onChange={handleChange} />} label="Inicial" />
                  <FormControlLabel control={<Switch name="es_final" checked={Boolean(formData.es_final)} onChange={handleChange} />} label="Final" />
                </Box>
                <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={handleChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
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
        titulo="Estados"
        descripcion="Catálogos → Estados. Administra nombres, presentación y estados adicionales por entidad sin dispersarlos por el código."
        icono={<TuneOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />

        <EstadosConfiguracionTable
          items={items}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onEditar={handleEditar}
          onDesactivar={handleDesactivar}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
        />
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
