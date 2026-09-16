import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
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

const colores = [
  ['default', 'Neutro'], ['info', 'Informativo'], ['success', 'Éxito'], ['warning', 'Advertencia'], ['error', 'Error / cancelado'],
];

export function EstadosConfiguracionPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ entidades: [] });
  const [formData, setFormData] = useState(estadoInicial());
  const [busqueda, setBusqueda] = useState('');
  const [entidad, setEntidad] = useState('');
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });
  const entidades = useMemo(() => meta.entidades || [], [meta]);

  const cargar = async (params = {}) => {
    setCargando(true);
    try {
      const response = await configuracionServicio.obtenerEstados({ busqueda, entidad, ...params });
      setItems(response.datos || []);
      setMeta(response.meta || { entidades: [] });
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo cargar el catálogo de estados', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

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
      if (formData.id) await configuracionServicio.actualizarEstado(formData.id, payload);
      else await configuracionServicio.crearEstado(payload);
      showNotificacion(formData.id ? 'Estado actualizado correctamente' : 'Estado creado correctamente', 'success');
      setVista('lista');
      cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      showNotificacion((errores && Object.values(errores)[0]?.[0]) || error.response?.data?.mensaje || 'No se pudo guardar el estado', 'error');
    }
  };

  const handleDesactivar = async (item) => {
    const confirmado = await confirmarAccion({ titulo: 'Desactivar estado', texto: `¿Deseas desactivar el estado “${item.nombre}”?`, textoConfirmar: 'Sí, desactivar', icono: 'warning' });
    if (!confirmado) return;
    try {
      await configuracionServicio.desactivarEstado(item.id);
      showNotificacion('Estado desactivado correctamente', 'success');
      cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      showNotificacion((errores && Object.values(errores)[0]?.[0]) || error.response?.data?.mensaje || 'No se pudo desactivar el estado', 'error');
    }
  };

  if (vista === 'formulario') {
    const protegido = Boolean(formData.protegido_sistema);
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={formData.id ? 'Editar estado' : 'Nuevo estado'} descripcion="Catálogos → Estados. El código y valor interno de estados protegidos no se modifican; su presentación sí." icono={<TuneOutlinedIcon />} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos del estado</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                <TextField label="Código" name="codigo" value={formData.codigo} onChange={handleChange} required size="small" disabled={protegido} helperText={protegido ? 'Código protegido por reglas del sistema.' : 'Ej.: MEM_EN_REVISION'} />
                <TextField label="Entidad" name="entidad" value={formData.entidad} onChange={handleChange} required size="small" disabled={protegido} helperText="Ej.: MEMBRESIA, VENTA, PAGO" />
                <TextField label="Valor interno" name="valor_interno" value={formData.valor_interno} onChange={handleChange} required size="small" disabled={protegido} helperText="Valor guardado en la tabla, ej.: PENDIENTE_PAGO" />
                <TextField label="Nombre visible" name="nombre" value={formData.nombre} onChange={handleChange} required size="small" />
                <TextField select label="Color" name="color" value={formData.color} onChange={handleChange} required size="small">{colores.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
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
      <PageHeader titulo="Estados" descripcion="Catálogos → Estados. Administra nombres, presentación y estados adicionales por entidad sin dispersarlos por el código." icono={<TuneOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={items.length} busqueda={busqueda} onBusqueda={(valor) => { setBusqueda(valor); cargar({ busqueda: valor }); }} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => { setFormData(estadoInicial()); setVista('formulario'); }} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <Box sx={{ px: 2, pb: 1.5, maxWidth: 320 }}><TextField select fullWidth size="small" label="Entidad" value={entidad} onChange={(e) => { setEntidad(e.target.value); cargar({ entidad: e.target.value }); }}><MenuItem value="">Todas</MenuItem>{entidades.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Entidad</TableCell><TableCell>Valor interno</TableCell><TableCell>Nombre visible</TableCell><TableCell>Color</TableCell><TableCell align="center">Inicial</TableCell><TableCell align="center">Final</TableCell><TableCell align="center">Protegido</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {!cargando && items.length === 0 ? <TableRow><TableCell colSpan={9} align="center">No hay estados registrados.</TableCell></TableRow> : items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.codigo}</TableCell><TableCell>{item.entidad}</TableCell><TableCell>{item.valor_interno}</TableCell><TableCell>{item.nombre}</TableCell><TableCell>{item.color}</TableCell><TableCell align="center">{item.es_inicial ? 'Sí' : 'No'}</TableCell><TableCell align="center">{item.es_final ? 'Sí' : 'No'}</TableCell><TableCell align="center">{item.protegido_sistema ? 'Sí' : 'No'}</TableCell>
                  <TableCell align="center"><Tooltip title="Editar"><IconButton size="small" onClick={() => { setFormData({ ...estadoInicial(), ...item }); setVista('formulario'); }} sx={dbanuStyles.actionEdit}><EditOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>{item.activo && !item.protegido_sistema ? <Tooltip title="Desactivar"><IconButton size="small" onClick={() => handleDesactivar(item)} sx={dbanuStyles.actionDelete}><PowerSettingsNewOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
