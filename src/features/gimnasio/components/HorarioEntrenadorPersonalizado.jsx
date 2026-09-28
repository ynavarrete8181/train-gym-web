import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Paper,
  Stack, TextField, Tooltip, Typography
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
const inicial = {
  id: null,
  tipo_horario: 'INSTITUCIONAL',
  jornada_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true,
  observaciones: '',
  franjas: [],
  recesos: [],
};

const hora = (v) => String(v || '').slice(0, 5);

export function HorarioEntrenadorPersonalizado({ entrenador, onVolver }) {
  const [form, setForm] = useState(inicial);
  const [catalogos, setCatalogos] = useState({ sedes: [], jornadas: [], tipos_receso: [] });
  const [diaActivo, setDiaActivo] = useState('LUNES');
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const nombre = [entrenador?.nombres, entrenador?.apellidos].filter(Boolean).join(' ')
    || entrenador?.name
    || 'Entrenador';

  const esPersonalizado = form.tipo_horario === 'PERSONALIZADO';

  const cargar = async () => {
    setCargando(true);
    try {
      const [horariosRes, catalogosRes] = await Promise.all([
        gimnasioServicio.obtenerHorariosPersonalizadosEntrenador(entrenador.id),
        gimnasioServicio.obtenerCatalogosHorarioEntrenador(),
      ]);

      const catalogosData = catalogosRes.datos || { sedes: [], jornadas: [], tipos_receso: [] };
      setCatalogos(catalogosData);

      const actual = (horariosRes.datos || [])[0];
      if (actual) {
        setForm({
          ...inicial,
          ...actual,
          tipo_horario: actual.tipo_horario || 'PERSONALIZADO',
          jornada_id: actual.jornada_id || '',
          fecha_inicio: actual.fecha_inicio ? String(actual.fecha_inicio).slice(0, 10) : '',
          fecha_fin: actual.fecha_fin ? String(actual.fecha_fin).slice(0, 10) : '',
          franjas: (actual.franjas || []).map((x) => ({
            ...x,
            hora_inicio: hora(x.hora_inicio),
            hora_fin: hora(x.hora_fin),
          })),
          recesos: (actual.recesos || []).map((x) => ({
            ...x,
            hora_inicio: hora(x.hora_inicio),
            hora_fin: hora(x.hora_fin),
          })),
        });
      }
    } catch (error) {
      const errores = error.response?.data?.errores;
      const mensaje = errores
        ? Object.values(errores).flat().join(' ')
        : (error.response?.data?.mensaje || 'No se pudo cargar el horario del entrenador.');
      setNotificacion({ mensaje, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [entrenador.id]);

  const franjasDia = useMemo(
    () => form.franjas.map((x, index) => ({ ...x, index })).filter((x) => x.dia_semana === diaActivo),
    [form.franjas, diaActivo]
  );

  const recesosDia = useMemo(
    () => form.recesos.map((x, index) => ({ ...x, index })).filter((x) => x.dia_semana === diaActivo),
    [form.recesos, diaActivo]
  );

  const seleccionarHorarioInstitucional = (value) => {
    if (value === 'PERSONALIZADO') {
      setForm((prev) => ({
        ...prev,
        tipo_horario: 'PERSONALIZADO',
        jornada_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        franjas: [],
        recesos: [],
      }));
      return;
    }

    const jornada = (catalogos.jornadas || []).find((item) => String(item.id) === String(value));
    setForm((prev) => ({
      ...prev,
      tipo_horario: 'INSTITUCIONAL',
      jornada_id: value,
      fecha_inicio: '',
      fecha_fin: '',
      recesos: [],
      franjas: (jornada?.detalles || []).map((detalle) => ({
        dia_semana: detalle.dia_semana,
        sede_id: '',
        hora_inicio: hora(detalle.hora_inicio),
        hora_fin: hora(detalle.hora_fin),
      })),
    }));
  };

  const agregarFranja = () => setForm((prev) => ({
    ...prev,
    franjas: [...prev.franjas, { dia_semana: diaActivo, sede_id: '', hora_inicio: '', hora_fin: '' }],
  }));

  const editarFranja = (index, key, value) => setForm((prev) => ({
    ...prev,
    franjas: prev.franjas.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
  }));

  const eliminarFranja = (index) => setForm((prev) => ({
    ...prev,
    franjas: prev.franjas.filter((_, i) => i !== index),
  }));

  const agregarReceso = () => setForm((prev) => ({
    ...prev,
    recesos: [...prev.recesos, {
      dia_semana: diaActivo,
      tipo: 'ALMUERZO',
      descripcion: '',
      hora_inicio: '',
      hora_fin: '',
    }],
  }));

  const editarReceso = (index, key, value) => setForm((prev) => ({
    ...prev,
    recesos: prev.recesos.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
  }));

  const eliminarReceso = (index) => setForm((prev) => ({
    ...prev,
    recesos: prev.recesos.filter((_, i) => i !== index),
  }));

  const guardar = async () => {
    try {
      const payload = {
        tipo_horario: form.tipo_horario,
        jornada_id: form.tipo_horario === 'INSTITUCIONAL' ? Number(form.jornada_id) : null,
        fecha_inicio: esPersonalizado ? (form.fecha_inicio || null) : null,
        fecha_fin: esPersonalizado ? (form.fecha_fin || null) : null,
        activo: Boolean(form.activo),
        observaciones: form.observaciones || null,
        franjas: form.franjas.map(({ dia_semana, sede_id, hora_inicio, hora_fin }) => ({
          dia_semana,
          sede_id: Number(sede_id),
          hora_inicio,
          hora_fin,
        })),
        recesos: form.recesos.map(({ dia_semana, tipo, descripcion, hora_inicio, hora_fin }) => ({
          dia_semana,
          tipo,
          descripcion: descripcion || null,
          hora_inicio,
          hora_fin,
        })),
      };

      if (form.id) {
        await gimnasioServicio.actualizarHorarioPersonalizadoEntrenador(entrenador.id, form.id, payload);
      } else {
        await gimnasioServicio.crearHorarioPersonalizadoEntrenador(entrenador.id, payload);
      }

      setNotificacion({ mensaje: 'Horario del entrenador guardado correctamente.', tipo: 'success' });
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errores;
      const mensaje = errores
        ? Object.values(errores).flat().join(' ')
        : (error.response?.data?.mensaje || 'No se pudo guardar el horario.');
      setNotificacion({ mensaje, tipo: 'error' });
    }
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo={form.id ? `Editar horario de ${nombre}` : `Horario de ${nombre}`}
        descripcion="Configure la jornada institucional o un horario personalizado, la disponibilidad semanal por sede y los recesos."
        icono={<ScheduleOutlinedIcon />}
        acciones={<BotonVolver onClick={onVolver} />}
      />

      <Paper className="page-content-container" elevation={0} sx={{ mt: 2 }}>
        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Vigencia del horario</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr .8fr' }, gap: 1.5, alignItems: 'start' }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Horario institucional"
              value={esPersonalizado ? 'PERSONALIZADO' : (form.jornada_id || '')}
              onChange={(e) => seleccionarHorarioInstitucional(e.target.value)}
              helperText="Seleccione una jornada global o configure un horario personalizado."
            >
              {(catalogos.jornadas || []).map((jornada) => (
                <MenuItem key={jornada.id} value={jornada.id}>{jornada.nombre}</MenuItem>
              ))}
              <MenuItem value="PERSONALIZADO">Horario personalizado</MenuItem>
            </TextField>

            <TextField
              label="Vigente desde"
              type="date"
              size="small"
              value={form.fecha_inicio || ''}
              disabled={!esPersonalizado}
              required={esPersonalizado}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Vigente hasta"
              type="date"
              size="small"
              value={form.fecha_fin || ''}
              disabled={!esPersonalizado}
              required={esPersonalizado}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box sx={{
              minHeight: 40,
              px: 1.5,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(form.activo)}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                    size="small"
                  />
                }
                label={form.activo ? 'Activo' : 'Inactivo'}
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 800, fontSize: 13 } }}
              />
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {esPersonalizado
              ? 'El horario personalizado requiere Vigente desde y Vigente hasta.'
              : 'La jornada institucional utiliza su configuración global; la vigencia por fechas no se aplica.'}
          </Typography>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt: 2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Horario semanal</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Puede usar la jornada institucional como plantilla y definir la sede correspondiente para cada franja.
          </Typography>

          <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {DIAS.map((dia) => {
              const cantidad = form.franjas.filter((x) => x.dia_semana === dia).length;
              return (
                <Button
                  key={dia}
                  size="small"
                  variant={diaActivo === dia ? 'contained' : 'outlined'}
                  onClick={() => setDiaActivo(dia)}
                  sx={diaActivo === dia ? dbanuStyles.addButtonRevive : { minWidth: 76 }}
                >
                  {dia.slice(0, 3)}{cantidad ? ` · ${cantidad}` : ''}
                </Button>
              );
            })}
          </Stack>

          <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>{diaActivo}</Typography>

          <Stack spacing={1}>
            {franjasDia.map((franja) => (
              <Box
                key={franja.index}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr 1fr auto' }, gap: 1, alignItems: 'start' }}
              >
                <TextField
                  select
                  size="small"
                  label="Sede"
                  value={franja.sede_id || ''}
                  onChange={(e) => editarFranja(franja.index, 'sede_id', e.target.value)}
                >
                  {(catalogos.sedes || []).map((sede) => (
                    <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="time"
                  label="Desde"
                  value={hora(franja.hora_inicio)}
                  onChange={(e) => editarFranja(franja.index, 'hora_inicio', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                  size="small"
                  type="time"
                  label="Hasta"
                  value={hora(franja.hora_fin)}
                  onChange={(e) => editarFranja(franja.index, 'hora_fin', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Tooltip title="Eliminar horario">
                  <IconButton sx={dbanuStyles.actionDelete} onClick={() => eliminarFranja(franja.index)}>
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}

            <Box>
              <Button startIcon={<AddOutlinedIcon />} onClick={agregarFranja} sx={dbanuStyles.addButtonRevive}>
                Horario
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CoffeeOutlinedIcon fontSize="small" />
            <Typography sx={formStyles.modalSeccionTitulo}>Recesos</Typography>
          </Stack>

          <Stack spacing={1}>
            {recesosDia.map((receso) => (
              <Box
                key={receso.index}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr 1fr 1fr auto' }, gap: 1, alignItems: 'start' }}
              >
                <TextField
                  select
                  size="small"
                  label="Tipo"
                  value={receso.tipo || 'PAUSA'}
                  onChange={(e) => editarReceso(receso.index, 'tipo', e.target.value)}
                >
                  {(catalogos.tipos_receso || ['ALMUERZO','PAUSA','OTRO']).map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Descripción"
                  value={receso.descripcion || ''}
                  onChange={(e) => editarReceso(receso.index, 'descripcion', e.target.value)}
                />

                <TextField
                  size="small"
                  type="time"
                  label="Desde"
                  value={hora(receso.hora_inicio)}
                  onChange={(e) => editarReceso(receso.index, 'hora_inicio', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                  size="small"
                  type="time"
                  label="Hasta"
                  value={hora(receso.hora_fin)}
                  onChange={(e) => editarReceso(receso.index, 'hora_fin', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Tooltip title="Eliminar receso">
                  <IconButton sx={dbanuStyles.actionDelete} onClick={() => eliminarReceso(receso.index)}>
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}

            <Box>
              <Button startIcon={<AddOutlinedIcon />} onClick={agregarReceso} variant="outlined">
                Receso
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <EventAvailableOutlinedIcon fontSize="small" />
            <Typography sx={formStyles.modalSeccionTitulo}>Resumen de configuración</Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1 }}>
            <Box sx={{ p: 1.25, border: '1px solid #dbe5f0', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">HORARIO</Typography>
              <Typography variant="body2" fontWeight={800}>
                {esPersonalizado
                  ? 'Horario personalizado'
                  : ((catalogos.jornadas || []).find((j) => String(j.id) === String(form.jornada_id))?.nombre || 'Sin seleccionar')}
              </Typography>
            </Box>
            <Box sx={{ p: 1.25, border: '1px solid #dbe5f0', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">FRANJAS SEMANALES</Typography>
              <Typography variant="body2" fontWeight={800}>{form.franjas.length}</Typography>
            </Box>
            <Box sx={{ p: 1.25, border: '1px solid #dbe5f0', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">RECESOS CONFIGURADOS</Typography>
              <Typography variant="body2" fontWeight={800}>{form.recesos.length}</Typography>
            </Box>
          </Box>
        </Box>

        <AccionesFormulario onGuardar={guardar} onCancelar={onVolver} disabled={cargando} />
      </Paper>

      <NotificacionSnackbar
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={() => setNotificacion((prev) => ({ ...prev, mensaje: '' }))}
      />
    </Box>
  );
}
