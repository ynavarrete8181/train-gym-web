import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const initialModalidad = () => ({
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  dias_por_semana: 3,
  usos_por_semana: 3,
  uso_ilimitado: false,
  tipo_duracion: 'SEMANAS',
  duracion: 4,
  precio_base: 0,
  tarifa_inscripcion: 0,
  modelo_cobro: 'FIJO_POR_PERIODO',
  momento_cobro: 'ANTICIPADO',
  permite_prorrateo: false,
  permite_extension: true,
  extension_automatica: false,
  permite_rollover: false,
  activo: true,
  precios_sede: [],
});

export function PlanModalidadesView({ plan, sedes = [], onVolver, onActualizado, embedded = false }) {
  const [modalidades, setModalidades] = useState([]);
  const [form, setForm] = useState(initialModalidad());
  const [editando, setEditando] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const avisar = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async () => {
    if (!plan?.id) return;
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerModalidadesPlan(plan.id);
      const datos = response.datos || [];
      setModalidades(datos);
      onActualizado?.(datos);
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'No se pudieron cargar las modalidades del plan.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [plan?.id]);

  const cambiar = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => {
      const siguiente = { ...prev, [name]: type === 'checkbox' ? checked : value };

      if (name === 'uso_ilimitado' && checked) {
        siguiente.dias_por_semana = '';
        siguiente.usos_por_semana = '';
      }

      if (name === 'dias_por_semana' && !prev.uso_ilimitado) {
        siguiente.usos_por_semana = value;
      }

      if (name === 'modelo_cobro' && value === 'PRORRATEO_POR_SEMANAS_UTILIZADAS') {
        siguiente.permite_prorrateo = true;
        siguiente.momento_cobro = 'VENCIDO';
      }

      if (name === 'permite_extension' && !checked) {
        siguiente.extension_automatica = false;
      }

      return siguiente;
    });
  };

  const nueva = () => {
    setForm(initialModalidad());
    setEditando(true);
  };

  const editar = (modalidad) => {
    setForm({
      ...initialModalidad(),
      ...modalidad,
      dias_por_semana: modalidad.dias_por_semana ?? '',
      usos_por_semana: modalidad.usos_por_semana ?? '',
      precios_sede: modalidad.precios_sede || [],
    });
    setEditando(true);
  };

  const agregarPrecio = () => setForm((prev) => ({
    ...prev,
    precios_sede: [...(prev.precios_sede || []), { sede_id: '', precio: '' }],
  }));

  const cambiarPrecio = (index, field, value) => {
    setForm((prev) => {
      const filas = [...(prev.precios_sede || [])];
      filas[index] = { ...filas[index], [field]: value };
      return { ...prev, precios_sede: filas };
    });
  };

  const quitarPrecio = (index) => setForm((prev) => ({
    ...prev,
    precios_sede: (prev.precios_sede || []).filter((_, i) => i !== index),
  }));

  const guardar = async () => {
    try {
      if (!String(form.nombre || '').trim()) {
        avisar('Ingresa el nombre de la modalidad.', 'warning');
        return;
      }

      if (!form.uso_ilimitado && (!form.dias_por_semana || !form.usos_por_semana)) {
        avisar('Define los días y usos permitidos por semana.', 'warning');
        return;
      }

      const precios = (form.precios_sede || []).filter((fila) => fila.sede_id && fila.precio !== '');
      if (precios.length !== (form.precios_sede || []).length) {
        avisar('Completa o elimina las filas incompletas de precios por sede.', 'warning');
        return;
      }

      const payload = {
        ...form,
        codigo: form.id ? form.codigo : undefined,
        dias_por_semana: form.uso_ilimitado ? null : Number(form.dias_por_semana),
        usos_por_semana: form.uso_ilimitado ? null : Number(form.usos_por_semana),
        duracion: Number(form.duracion),
        precio_base: Number(form.precio_base || 0),
        tarifa_inscripcion: Number(form.tarifa_inscripcion || 0),
        uso_ilimitado: Boolean(form.uso_ilimitado),
        permite_prorrateo: Boolean(form.permite_prorrateo),
        permite_extension: Boolean(form.permite_extension),
        extension_automatica: Boolean(form.extension_automatica),
        permite_rollover: Boolean(form.permite_rollover),
        activo: Boolean(form.activo),
        precios_sede: precios.map((fila) => ({
          sede_id: Number(fila.sede_id),
          precio: Number(fila.precio),
        })),
      };

      if (form.id) {
        await gimnasioServicio.actualizarModalidadPlan(plan.id, form.id, payload);
      } else {
        await gimnasioServicio.crearModalidadPlan(plan.id, payload);
      }

      avisar(form.id ? 'Modalidad actualizada con éxito' : 'Modalidad creada con éxito', 'success');
      setEditando(true);
      setForm(initialModalidad());
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      avisar(primero || error.response?.data?.mensaje || error.response?.data?.message || 'No se pudo guardar la modalidad.', 'error');
    }
  };

  const eliminar = async (modalidad) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar modalidad',
      texto: '¿Deseas eliminar la modalidad "' + modalidad.nombre + '"? Si ya está asociada a membresías, no podrá eliminarse.',
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await gimnasioServicio.eliminarModalidadPlan(plan.id, modalidad.id);
      avisar('Modalidad eliminada con éxito', 'success');
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      avisar(primero || error.response?.data?.mensaje || 'No se pudo eliminar la modalidad.', 'error');
    }
  };

  return (
    <Box className={embedded ? undefined : 'page-wrapper'}>
      {!embedded ? (
        <PageHeader
          titulo={'Modalidades · ' + (plan?.nombre || 'Plan')}
          descripcion="Configura frecuencia, duración, precio y reglas comerciales de cada modalidad."
          icono={<ListAltOutlinedIcon />}
          acciones={<BotonVolver onClick={onVolver} />}
        />
      ) : null}

      <Paper elevation={0} sx={{ mt: embedded ? 1.25 : 2, p: { xs: 1.25, md: 1.5 }, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: embedded ? '#fbfdff' : '#fff' }}>
        <Box sx={formStyles.seccion}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1} sx={{ mb: 1.2 }}>
            <Box>
              <Typography sx={formStyles.modalSeccionTitulo}>{form.id ? 'Editar modalidad' : 'Nueva modalidad'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Define los derechos de uso y las condiciones comerciales de esta variante del plan.
              </Typography>
            </Box>
            {form.id ? (
              <Button size="small" startIcon={<AddOutlinedIcon />} onClick={nueva}>
                Nueva modalidad
              </Button>
            ) : null}
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr .72fr .72fr .78fr .68fr .8fr .9fr .9fr' }, gap: 1, alignItems: 'start' }}>
            <TextField label="Nombre de modalidad" name="nombre" value={form.nombre} onChange={cambiar} required size="small" />
            <TextField label="Días/sem." name="dias_por_semana" type="number" value={form.dias_por_semana} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 7 }} />
            <TextField label="Usos/sem." name="usos_por_semana" type="number" value={form.usos_por_semana} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 30 }} />
            <TextField select label="Duración" name="tipo_duracion" value={form.tipo_duracion} onChange={cambiar} size="small">
              <MenuItem value="DIAS">Días</MenuItem>
              <MenuItem value="SEMANAS">Semanas</MenuItem>
              <MenuItem value="MESES">Meses</MenuItem>
              <MenuItem value="ANIOS">Años</MenuItem>
            </TextField>
            <TextField label="Cantidad" name="duracion" type="number" value={form.duracion} onChange={cambiar} size="small" inputProps={{ min: 1 }} />
            <TextField label="Precio ($)" name="precio_base" type="number" value={form.precio_base} onChange={cambiar} size="small" inputProps={{ min: 0, step: '0.01' }} />
            <TextField select label="Modelo de cobro" name="modelo_cobro" value={form.modelo_cobro} onChange={cambiar} size="small">
              <MenuItem value="FIJO_POR_PERIODO">Fijo</MenuItem>
              <MenuItem value="PRORRATEO_POR_SEMANAS_UTILIZADAS">Prorrateado</MenuItem>
            </TextField>
            <TextField select label="Momento" name="momento_cobro" value={form.momento_cobro} onChange={cambiar} size="small" disabled={form.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS'}>
              <MenuItem value="ANTICIPADO">Anticipado</MenuItem>
              <MenuItem value="VENCIDO">Vencido</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.6fr auto' }, gap: 1, mt: 1 }}>
            <TextField
              label="Descripción"
              name="descripcion"
              value={form.descripcion || ''}
              onChange={cambiar}
              size="small"
              placeholder="Descripción breve de la modalidad"
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <FormControlLabel control={<Switch size="small" name="uso_ilimitado" checked={Boolean(form.uso_ilimitado)} onChange={cambiar} />} label="Uso ilimitado" />
              <FormControlLabel control={<Switch size="small" name="permite_extension" checked={Boolean(form.permite_extension)} onChange={cambiar} />} label="Permite extensión" />
              <FormControlLabel control={<Switch size="small" name="extension_automatica" checked={Boolean(form.extension_automatica)} onChange={cambiar} disabled={!form.permite_extension} />} label="Extensión automática" />
              <FormControlLabel control={<Switch size="small" name="permite_rollover" checked={Boolean(form.permite_rollover)} onChange={cambiar} />} label="Rollover" />
              <FormControlLabel control={<Switch size="small" name="activo" checked={Boolean(form.activo)} onChange={cambiar} />} label="Activa" />
            </Stack>
          </Box>

          <Box sx={{ mt: 1, borderTop: '1px solid #edf2f7', pt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1}>
              <Box>
                <Typography variant="body2" fontWeight={800}>Precios por sede</Typography>
                <Typography variant="caption" color="text.secondary">Opcional. Si no hay precio específico, se usa el precio base.</Typography>
              </Box>
              <Button size="small" startIcon={<AddOutlinedIcon />} onClick={agregarPrecio}>Agregar precio</Button>
            </Stack>

            {(form.precios_sede || []).length ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mt: 1 }}>
                {(form.precios_sede || []).map((fila, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    <TextField select label="Sede" size="small" value={fila.sede_id || ''} onChange={(e) => cambiarPrecio(index, 'sede_id', e.target.value)} sx={{ flex: 1 }}>
                      {sedes.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}
                    </TextField>
                    <TextField label="Precio ($)" type="number" size="small" value={fila.precio ?? ''} onChange={(e) => cambiarPrecio(index, 'precio', e.target.value)} sx={{ width: 130 }} />
                    <Tooltip title="Quitar">
                      <IconButton size="small" onClick={() => quitarPrecio(index)} sx={dbanuStyles.actionDelete}>
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Box>
            ) : null}
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.25 }}>
            {form.id ? (
              <Button onClick={nueva} sx={dbanuStyles.secondaryButtonRevive}>Cancelar edición</Button>
            ) : null}
            <Button onClick={guardar} sx={dbanuStyles.addButtonRevive}>
              {form.id ? 'Actualizar modalidad' : 'Agregar modalidad'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Modalidades configuradas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {cargando ? 'Cargando...' : modalidades.length + ' modalidad(es) registradas para este plan.'}
          </Typography>

          <TablaGestion
            total={modalidades.length}
            filtrados={modalidades.length}
            cargando={cargando}
            textoResumen={modalidades.length + ' modalidad(es) configuradas'}
          >
            <TableHead>
              <TableRow>
                <TableCell>Modalidad</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Cobro</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modalidades.map((modalidad) => (
                <TableRow key={modalidad.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{modalidad.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{modalidad.codigo || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {modalidad.uso_ilimitado
                      ? 'Ilimitado'
                      : (modalidad.usos_por_semana || modalidad.dias_por_semana || 0) + ' uso(s)/sem.'}
                  </TableCell>
                  <TableCell>{modalidad.duracion} {String(modalidad.tipo_duracion || '').toLowerCase()}</TableCell>
                  <TableCell>{'$' + Number(modalidad.precio_base || 0).toFixed(2)}</TableCell>
                  <TableCell>{modalidad.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS' ? 'Prorrateado' : 'Fijo'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={modalidad.activo ? 'ACTIVA' : 'INACTIVA'} variant="outlined" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={.5} justifyContent="center">
                      <Tooltip title="Editar modalidad">
                        <IconButton size="small" onClick={() => editar(modalidad)} sx={dbanuStyles.actionEdit}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar modalidad">
                        <IconButton size="small" onClick={() => eliminar(modalidad)} sx={dbanuStyles.actionDelete}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!cargando && modalidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay modalidades configuradas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </TablaGestion>
        </Box>
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((prev) => ({ ...prev, mensaje: '' }))} />
    </Box>
  );
}
