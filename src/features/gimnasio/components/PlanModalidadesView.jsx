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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
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
  const [editando, setEditando] = useState(false);
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
      setEditando(false);
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

      <Paper elevation={0} sx={{ mt: embedded ? 1.25 : 2, p: { xs: 1.5, md: 2 }, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: embedded ? '#fbfdff' : '#fff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1.2} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={900}>Modalidades configuradas</Typography>
            <Typography variant="body2" color="text.secondary">
              {cargando ? 'Cargando...' : modalidades.length + ' modalidad(es) registradas para este plan.'}
            </Typography>
          </Box>
          <Button startIcon={<AddOutlinedIcon />} onClick={nueva} sx={dbanuStyles.addButtonRevive}>
            Agregar modalidad
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
          {modalidades.map((modalidad) => (
            <Box key={modalidad.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1.4, bgcolor: '#fff' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={900}>{modalidad.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {modalidad.uso_ilimitado
                      ? 'Uso ilimitado'
                      : (modalidad.usos_por_semana || modalidad.dias_por_semana || 0) + ' uso(s) por semana'}
                    {' · '}
                    {modalidad.duracion} {String(modalidad.tipo_duracion || '').toLowerCase()}
                  </Typography>
                </Box>
                <Chip size="small" label={modalidad.activo ? 'ACTIVA' : 'INACTIVA'} variant="outlined" sx={{ fontWeight: 800 }} />
              </Stack>

              <Box sx={{ mt: 1.15, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Precio base</Typography>
                  <Typography variant="body2" fontWeight={900}>{'$' + Number(modalidad.precio_base || 0).toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cobro</Typography>
                  <Typography variant="body2" fontWeight={900}>
                    {modalidad.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS' ? 'Prorrateado' : 'Fijo por período'}
                  </Typography>
                </Box>
              </Box>

              {(modalidad.precios_sede || []).length ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .8 }}>
                  {(modalidad.precios_sede || []).length} precio(s) específico(s) por sede.
                </Typography>
              ) : null}

              <Stack direction="row" spacing={.6} justifyContent="flex-end" sx={{ mt: 1.2 }}>
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
            </Box>
          ))}
        </Box>

        {!cargando && modalidades.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={800}>Este plan todavía no tiene modalidades.</Typography>
            <Typography variant="caption" color="text.secondary">Agrega la primera modalidad para definir frecuencia, duración y precio.</Typography>
          </Box>
        ) : null}
      </Paper>

      {editando ? (
        <Paper elevation={0} sx={{ mt: 2, p: { xs: 1.5, md: 2 }, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={900}>{form.id ? 'Editar modalidad' : 'Nueva modalidad'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Define los derechos de uso y las condiciones comerciales de esta variante del plan.
          </Typography>

          <Stack spacing={1.6}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 1.5 }}>
              <TextField label="Nombre de modalidad" name="nombre" value={form.nombre} onChange={cambiar} required size="small" />
              <TextField label="Código" value={form.id ? form.codigo || '' : 'Se genera al guardar'} disabled size="small" />
            </Box>

            <TextField label="Descripción" name="descripcion" value={form.descripcion || ''} onChange={cambiar} multiline rows={2} size="small" />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              <TextField label="Días por semana" name="dias_por_semana" type="number" value={form.dias_por_semana} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 7 }} />
              <TextField label="Usos por semana" name="usos_por_semana" type="number" value={form.usos_por_semana} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 30 }} />
              <TextField select label="Tipo de duración" name="tipo_duracion" value={form.tipo_duracion} onChange={cambiar} size="small">
                <MenuItem value="DIAS">Días</MenuItem>
                <MenuItem value="SEMANAS">Semanas</MenuItem>
                <MenuItem value="MESES">Meses</MenuItem>
                <MenuItem value="ANIOS">Años</MenuItem>
              </TextField>
              <TextField label="Duración" name="duracion" type="number" value={form.duracion} onChange={cambiar} size="small" inputProps={{ min: 1 }} />
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch name="uso_ilimitado" checked={Boolean(form.uso_ilimitado)} onChange={cambiar} />} label="Uso ilimitado" />
              <FormControlLabel control={<Switch name="permite_extension" checked={Boolean(form.permite_extension)} onChange={cambiar} />} label="Permite extensión" />
              <FormControlLabel control={<Switch name="extension_automatica" checked={Boolean(form.extension_automatica)} onChange={cambiar} disabled={!form.permite_extension} />} label="Extensión automática" />
              <FormControlLabel control={<Switch name="permite_rollover" checked={Boolean(form.permite_rollover)} onChange={cambiar} />} label="Permite rollover" />
              <FormControlLabel control={<Switch name="activo" checked={Boolean(form.activo)} onChange={cambiar} />} label="Activa" />
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              <TextField label="Precio base ($)" name="precio_base" type="number" value={form.precio_base} onChange={cambiar} size="small" inputProps={{ min: 0, step: '0.01' }} />
              <TextField label="Tarifa inscripción ($)" name="tarifa_inscripcion" type="number" value={form.tarifa_inscripcion} onChange={cambiar} size="small" inputProps={{ min: 0, step: '0.01' }} />
              <TextField select label="Modelo de cobro" name="modelo_cobro" value={form.modelo_cobro} onChange={cambiar} size="small">
                <MenuItem value="FIJO_POR_PERIODO">Fijo por período</MenuItem>
                <MenuItem value="PRORRATEO_POR_SEMANAS_UTILIZADAS">Prorrateo por semanas utilizadas</MenuItem>
              </TextField>
              <TextField select label="Momento de cobro" name="momento_cobro" value={form.momento_cobro} onChange={cambiar} size="small" disabled={form.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS'}>
                <MenuItem value="ANTICIPADO">Anticipado</MenuItem>
                <MenuItem value="VENCIDO">Vencido</MenuItem>
              </TextField>
            </Box>

            <Box sx={formStyles.seccion}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography sx={formStyles.modalSeccionTitulo}>Precios por sede</Typography>
                  <Typography variant="body2" color="text.secondary">Opcional. Si no se configura una sede, se usa el precio base de la modalidad.</Typography>
                </Box>
                <Button size="small" startIcon={<AddOutlinedIcon />} onClick={agregarPrecio}>Agregar precio</Button>
              </Stack>

              <Stack spacing={1}>
                {(form.precios_sede || []).map((fila, index) => (
                  <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                    <TextField select label="Sede" size="small" value={fila.sede_id || ''} onChange={(e) => cambiarPrecio(index, 'sede_id', e.target.value)} sx={{ flex: 1 }}>
                      {sedes.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}
                    </TextField>
                    <TextField label="Precio ($)" type="number" size="small" value={fila.precio ?? ''} onChange={(e) => cambiarPrecio(index, 'precio', e.target.value)} sx={{ width: { xs: '100%', md: 150 } }} />
                    <Tooltip title="Quitar">
                      <IconButton size="small" onClick={() => quitarPrecio(index)} sx={dbanuStyles.actionDelete}>
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => { setEditando(false); setForm(initialModalidad()); }} sx={dbanuStyles.secondaryButtonRevive}>Cancelar</Button>
              <Button onClick={guardar} sx={dbanuStyles.addButtonRevive}>Guardar modalidad</Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((prev) => ({ ...prev, mensaje: '' }))} />
    </Box>
  );
}
