import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const DIAS = [
  { id: 'LUNES', corto: 'Lun', nombre: 'Lunes' },
  { id: 'MARTES', corto: 'Mar', nombre: 'Martes' },
  { id: 'MIERCOLES', corto: 'Mié', nombre: 'Miércoles' },
  { id: 'JUEVES', corto: 'Jue', nombre: 'Jueves' },
  { id: 'VIERNES', corto: 'Vie', nombre: 'Viernes' },
  { id: 'SABADO', corto: 'Sáb', nombre: 'Sábado' },
  { id: 'DOMINGO', corto: 'Dom', nombre: 'Domingo' },
];

const inicial = {
  id: null,
  tipo_horario: '',
  jornada_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true,
  observaciones: '',
  franjas: [],
  recesos: [],
};

const bloqueInicial = {
  dias: ['LUNES'],
  sede_id: '',
  hora_inicio: '08:00',
  hora_fin: '17:00',
  lunch: false,
  lunch_inicio: '13:00',
  lunch_fin: '14:00',
};

const hora = (value) => String(value || '').slice(0, 5);

export function HorarioEntrenadorPersonalizado({ entrenador, onVolver }) {
  const [form, setForm] = useState(inicial);
  const [catalogos, setCatalogos] = useState({ sedes: [], jornadas: [], tipos_receso: [] });
  const [bloque, setBloque] = useState(bloqueInicial);
  const [sedeInstitucional, setSedeInstitucional] = useState('');
  const [versiones, setVersiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const nombre =
    [entrenador?.nombres, entrenador?.apellidos].filter(Boolean).join(' ')
    || entrenador?.name
    || 'Entrenador';

  const horarioSeleccionado = Boolean(form.tipo_horario);
  const esPersonalizado = form.tipo_horario === 'PERSONALIZADO';
  const esInstitucional = form.tipo_horario === 'INSTITUCIONAL';

  const jornadaSeleccionada = useMemo(
    () => (catalogos.jornadas || []).find((item) => String(item.id) === String(form.jornada_id)),
    [catalogos.jornadas, form.jornada_id],
  );

  const detallesJornada = useMemo(
    () => jornadaSeleccionada?.detalles || jornadaSeleccionada?.dias || [],
    [jornadaSeleccionada],
  );

  const franjasVista = useMemo(() => {
    if (!esInstitucional) return form.franjas;

    return detallesJornada.map((detalle) => ({
      dia_semana: String(detalle.dia_semana || '').toUpperCase(),
      sede_id: sedeInstitucional || '',
      hora_inicio: hora(detalle.hora_inicio),
      hora_fin: hora(detalle.hora_fin),
    }));
  }, [esInstitucional, detallesJornada, sedeInstitucional, form.franjas]);

  const recesosVista = esInstitucional
    ? (bloque.lunch
        ? franjasVista.map((franja) => ({
            dia_semana: franja.dia_semana,
            tipo: 'ALMUERZO',
            descripcion: 'LUNCH',
            hora_inicio: bloque.lunch_inicio,
            hora_fin: bloque.lunch_fin,
          }))
        : [])
    : form.recesos;

  const resumenDias = useMemo(
    () => DIAS.map((dia) => ({
      ...dia,
      franjas: franjasVista
        .map((franja, index) => ({ ...franja, index }))
        .filter((franja) => franja.dia_semana === dia.id),
      recesos: recesosVista
        .map((receso, index) => ({ ...receso, index }))
        .filter((receso) => receso.dia_semana === dia.id),
    })),
    [franjasVista, recesosVista],
  );

  const cargar = async () => {
    setCargando(true);
    try {
      const [horariosRes, catalogosRes, jornadasRes] = await Promise.all([
        gimnasioServicio.obtenerHorariosPersonalizadosEntrenador(entrenador.id),
        gimnasioServicio.obtenerCatalogosHorarioEntrenador(),
        gimnasioServicio.obtenerJornadas({ page: 1, per_page: 100, estado: true })
          .catch(() => ({ datos: [] })),
      ]);

      const catalogosData = catalogosRes.datos || {};
      const jornadasBase = (catalogosData.jornadas || []).length
        ? catalogosData.jornadas
        : (jornadasRes.datos || []);

      const jornadas = jornadasBase.map((jornada) => {
        const detallesExistentes = Array.isArray(jornada.detalles) && jornada.detalles.length
          ? jornada.detalles
          : (Array.isArray(jornada.dias) && jornada.dias.length ? jornada.dias : null);

        const detalles = detallesExistentes || (jornada.dias_semana || []).map((dia) => ({
          dia_semana: dia,
          hora_inicio: jornada.hora_inicio,
          hora_fin: jornada.hora_fin,
        }));

        return {
          ...jornada,
          detalles: detalles.map((detalle) => ({
            dia_semana: String(detalle.dia_semana || '').toUpperCase(),
            hora_inicio: hora(detalle.hora_inicio),
            hora_fin: hora(detalle.hora_fin),
          })),
        };
      });

      setCatalogos({
        sedes: catalogosData.sedes || [],
        jornadas,
        tipos_receso: catalogosData.tipos_receso || ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'PAUSA', 'OTRO'],
      });

      const versionesData = horariosRes.datos || [];
      setVersiones(versionesData);
      const actual = versionesData[0];
      if (actual) {
        const franjasActuales = (actual.franjas || []).map((item) => ({
          ...item,
          hora_inicio: hora(item.hora_inicio),
          hora_fin: hora(item.hora_fin),
        }));

        setForm({
          ...inicial,
          ...actual,
          tipo_horario: actual.tipo_horario || 'PERSONALIZADO',
          jornada_id: actual.jornada_id || '',
          fecha_inicio: actual.fecha_inicio ? String(actual.fecha_inicio).slice(0, 10) : '',
          fecha_fin: actual.fecha_fin ? String(actual.fecha_fin).slice(0, 10) : '',
          franjas: franjasActuales,
          recesos: (actual.recesos || []).map((item) => ({
            ...item,
            hora_inicio: hora(item.hora_inicio),
            hora_fin: hora(item.hora_fin),
          })),
        });

        if ((actual.tipo_horario || '') === 'INSTITUCIONAL') {
          setSedeInstitucional(franjasActuales[0]?.sede_id || '');
        }
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

  useEffect(() => {
    cargar();
  }, [entrenador.id]);

  const seleccionarHorario = (value) => {
    if (!value) {
      setForm((prev) => ({ ...prev, ...inicial }));
      setSedeInstitucional('');
      setBloque(bloqueInicial);
      return;
    }

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
      setSedeInstitucional('');
      setBloque(bloqueInicial);
      return;
    }

    const jornada = (catalogos.jornadas || []).find(
      (item) => String(item.id) === String(value),
    );
    const detalles = jornada?.detalles || jornada?.dias || [];
    const dias = detalles
      .map((item) => String(item.dia_semana || '').toUpperCase())
      .filter(Boolean);
    const primero = detalles[0];

    setForm((prev) => ({
      ...prev,
      tipo_horario: 'INSTITUCIONAL',
      jornada_id: value,
      fecha_inicio: '',
      fecha_fin: '',
      franjas: [],
      recesos: [],
    }));

    setSedeInstitucional('');
    setBloque({
      dias: dias.length ? dias : ['LUNES'],
      sede_id: '',
      hora_inicio: hora(primero?.hora_inicio) || '',
      hora_fin: hora(primero?.hora_fin) || '',
      lunch: false,
      lunch_inicio: '13:00',
      lunch_fin: '14:00',
    });
  };

  const toggleDia = (dia) => {
    if (esInstitucional) return;

    setBloque((prev) => {
      const seleccionado = prev.dias.includes(dia);
      if (seleccionado && prev.dias.length === 1) return prev;

      return {
        ...prev,
        dias: seleccionado
          ? prev.dias.filter((item) => item !== dia)
          : [...prev.dias, dia],
      };
    });
  };

  const agregarBloque = () => {
    if (!bloque.dias.length) {
      setNotificacion({ mensaje: 'Seleccione al menos un día.', tipo: 'warning' });
      return;
    }
    if (!bloque.sede_id) {
      setNotificacion({ mensaje: 'Seleccione la sede del horario.', tipo: 'warning' });
      return;
    }
    if (!bloque.hora_inicio || !bloque.hora_fin || bloque.hora_inicio >= bloque.hora_fin) {
      setNotificacion({ mensaje: 'Ingrese una hora de inicio y fin válidas.', tipo: 'warning' });
      return;
    }
    if (
      bloque.lunch
      && (!bloque.lunch_inicio || !bloque.lunch_fin || bloque.lunch_inicio >= bloque.lunch_fin)
    ) {
      setNotificacion({ mensaje: 'Complete correctamente el horario de Lunch.', tipo: 'warning' });
      return;
    }
    if (
      bloque.lunch
      && (bloque.lunch_inicio < bloque.hora_inicio || bloque.lunch_fin > bloque.hora_fin)
    ) {
      setNotificacion({ mensaje: 'El Lunch debe estar contenido dentro del horario del bloque.', tipo: 'warning' });
      return;
    }

    const nuevasFranjas = bloque.dias.map((dia) => ({
      dia_semana: dia,
      sede_id: Number(bloque.sede_id),
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
    }));

    const nuevosRecesos = bloque.lunch
      ? bloque.dias.map((dia) => ({
          dia_semana: dia,
          tipo: 'ALMUERZO',
          descripcion: 'LUNCH',
          hora_inicio: bloque.lunch_inicio,
          hora_fin: bloque.lunch_fin,
        }))
      : [];

    setForm((prev) => ({
      ...prev,
      franjas: [...prev.franjas, ...nuevasFranjas],
      recesos: [...prev.recesos, ...nuevosRecesos],
    }));
  };

  const eliminarFranja = (index) => {
    if (esInstitucional) return;

    const franja = form.franjas[index];
    setForm((prev) => ({
      ...prev,
      franjas: prev.franjas.filter((_, i) => i !== index),
      recesos: prev.recesos.filter(
        (receso) => !(
          receso.dia_semana === franja.dia_semana
          && receso.hora_inicio >= franja.hora_inicio
          && receso.hora_fin <= franja.hora_fin
        ),
      ),
    }));
  };

  const guardar = async () => {
    if (!form.tipo_horario) {
      setNotificacion({ mensaje: 'Seleccione una jornada global o un horario personalizado.', tipo: 'warning' });
      return;
    }

    if (esPersonalizado && (!form.fecha_inicio || !form.fecha_fin)) {
      setNotificacion({ mensaje: 'El horario personalizado requiere Vigente desde y Vigente hasta.', tipo: 'warning' });
      return;
    }

    if (esPersonalizado && !form.franjas.length) {
      setNotificacion({ mensaje: 'Agregue al menos un bloque al horario semanal personalizado.', tipo: 'warning' });
      return;
    }

    if (esInstitucional && !sedeInstitucional) {
      setNotificacion({ mensaje: 'Seleccione la sede donde se aplicará la jornada institucional.', tipo: 'warning' });
      return;
    }

    const franjasInstitucionales = esInstitucional
      ? detallesJornada.map((detalle) => ({
          dia_semana: String(detalle.dia_semana || '').toUpperCase(),
          sede_id: Number(sedeInstitucional),
          hora_inicio: hora(detalle.hora_inicio),
          hora_fin: hora(detalle.hora_fin),
        }))
      : [];

    try {
      const payload = {
        tipo_horario: form.tipo_horario,
        jornada_id: esInstitucional ? Number(form.jornada_id) : null,
        fecha_inicio: esPersonalizado ? form.fecha_inicio : null,
        fecha_fin: esPersonalizado ? form.fecha_fin : null,
        activo: Boolean(form.activo),
        observaciones: form.observaciones || null,
        franjas: esInstitucional
          ? franjasInstitucionales
          : form.franjas.map(({ dia_semana, sede_id, hora_inicio, hora_fin }) => ({
              dia_semana,
              sede_id: Number(sede_id),
              hora_inicio,
              hora_fin,
            })),
        recesos: esPersonalizado
          ? form.recesos.map(({ dia_semana, tipo, descripcion, hora_inicio, hora_fin }) => ({
              dia_semana,
              tipo,
              descripcion: descripcion || null,
              hora_inicio,
              hora_fin,
            }))
          : (bloque.lunch
              ? franjasInstitucionales.map((franja) => ({
                  dia_semana: franja.dia_semana,
                  tipo: 'ALMUERZO',
                  descripcion: 'LUNCH',
                  hora_inicio: bloque.lunch_inicio,
                  hora_fin: bloque.lunch_fin,
                }))
              : []),
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

  const sedeBloque = esInstitucional ? sedeInstitucional : bloque.sede_id;

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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr .8fr' },
              gap: 1.25,
              alignItems: 'start',
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label="Horario institucional"
              value={esPersonalizado ? 'PERSONALIZADO' : (form.jornada_id || '')}
              onChange={(event) => seleccionarHorario(event.target.value)}
            >
              <MenuItem value="">Seleccione...</MenuItem>
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
              onChange={(event) => setForm((prev) => ({ ...prev, fecha_inicio: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
            />

            <TextField
              label="Vigente hasta"
              type="date"
              size="small"
              value={form.fecha_fin || ''}
              disabled={!esPersonalizado}
              required={esPersonalizado}
              onChange={(event) => setForm((prev) => ({ ...prev, fecha_fin: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
            />

            <Box
              sx={{
                minHeight: 40,
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
                  <Checkbox
                    checked={Boolean(form.activo)}
                    onChange={(event) => setForm((prev) => ({ ...prev, activo: event.target.checked }))}
                    size="small"
                  />
                }
                label={form.activo ? 'Activo' : 'Inactivo'}
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 800, fontSize: 13 } }}
              />
            </Box>
          </Box>

          {esPersonalizado ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              El horario personalizado requiere Vigente desde y Vigente hasta.
            </Typography>
          ) : null}
        </Box>

        {horarioSeleccionado ? (
          <>
            <Box sx={{ ...formStyles.seccion, mt: 1.5 }}>
              <Typography sx={formStyles.modalSeccionTitulo}>
                {esPersonalizado ? 'Horario semanal personalizado' : 'Horario semanal institucional'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, fontWeight: 600 }}>
                {esPersonalizado
                  ? 'Configure un bloque a la vez. Seleccione uno o varios días, sede, horario y active Lunch si corresponde.'
                  : 'La jornada global se muestra en modo lectura. Seleccione únicamente la sede donde se aplicará.'}
              </Typography>

              <Box sx={{ border: '1px solid #dbe5f0', borderRadius: 1.5, p: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap',
                    mb: 1.25,
                  }}
                >
                  <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                    {DIAS.map((dia) => {
                      const seleccionado = esInstitucional
                        ? detallesJornada.some(
                            (detalle) => String(detalle.dia_semana || '').toUpperCase() === dia.id,
                          )
                        : bloque.dias.includes(dia.id);

                      return (
                        <Button
                          key={dia.id}
                          size="small"
                          variant={seleccionado ? 'contained' : 'outlined'}
                          disabled={esInstitucional}
                          onClick={() => toggleDia(dia.id)}
                          sx={seleccionado ? dbanuStyles.addButtonRevive : { minWidth: 58 }}
                        >
                          {dia.corto}
                        </Button>
                      );
                    })}
                  </Stack>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={bloque.lunch}
                        onChange={(event) => setBloque((prev) => ({
                          ...prev,
                          lunch: event.target.checked,
                          lunch_inicio: event.target.checked ? prev.lunch_inicio : '',
                          lunch_fin: event.target.checked ? prev.lunch_fin : '',
                        }))}
                      />
                    }
                    label="Lunch"
                    sx={{
                      m: 0,
                      px: 1,
                      height: 38,
                      border: '1px solid #dbe5f0',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      '& .MuiFormControlLabel-label': { fontWeight: 700, fontSize: 13 },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1.2fr .8fr .8fr .8fr .8fr auto' },
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label="Sede"
                    value={sedeBloque}
                    onChange={(event) => {
                      if (esInstitucional) {
                        setSedeInstitucional(event.target.value);
                      } else {
                        setBloque((prev) => ({ ...prev, sede_id: event.target.value }));
                      }
                    }}
                  >
                    {(catalogos.sedes || []).map((sede) => (
                      <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    label="Inicio jornada"
                    value={esInstitucional ? hora(detallesJornada[0]?.hora_inicio) : bloque.hora_inicio}
                    disabled={esInstitucional}
                    onChange={(event) => setBloque((prev) => ({ ...prev, hora_inicio: event.target.value }))}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
                  />

                  <TextField
                    size="small"
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    label="Fin jornada"
                    value={esInstitucional ? hora(detallesJornada[0]?.hora_fin) : bloque.hora_fin}
                    disabled={esInstitucional}
                    onChange={(event) => setBloque((prev) => ({ ...prev, hora_fin: event.target.value }))}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
                  />

                  <TextField
                    size="small"
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    label="Inicio receso"
                    value={bloque.lunch_inicio}
                    disabled={!bloque.lunch}
                    onChange={(event) => setBloque((prev) => ({ ...prev, lunch_inicio: event.target.value }))}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
                  />

                  <TextField
                    size="small"
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    label="Fin receso"
                    value={bloque.lunch_fin}
                    disabled={!bloque.lunch}
                    onChange={(event) => setBloque((prev) => ({ ...prev, lunch_fin: event.target.value }))}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5, pattern: '[0-2][0-9]:[0-5][0-9]' } }}
                  />

                  <Button
                    variant="outlined"
                    startIcon={<AddOutlinedIcon />}
                    onClick={agregarBloque}
                    disabled={esInstitucional}
                    sx={{ height: 40, whiteSpace: 'nowrap' }}
                  >
                    Horario
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box sx={{ ...formStyles.seccion, mt: 1.5 }}>
              <Typography sx={formStyles.modalSeccionTitulo}>Resumen de configuración</Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 1,
                  mb: 1.25,
                }}
              >
                <ResumenDato
                  icono={<LocationOnOutlinedIcon />}
                  etiqueta="Sedes"
                  valor={sedeBloque
                    ? ((catalogos.sedes || []).find((item) => String(item.id) === String(sedeBloque))?.nombre || '1')
                    : 'Por seleccionar'}
                />
                <ResumenDato
                  icono={<EventAvailableOutlinedIcon />}
                  etiqueta="Franjas semanales"
                  valor={franjasVista.length}
                />
                <ResumenDato
                  icono={<AccessTimeOutlinedIcon />}
                  etiqueta="Recesos configurados"
                  valor={recesosVista.length}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(7, 1fr)' },
                  gap: 1,
                }}
              >
                {resumenDias.map((dia) => (
                  <Box
                    key={dia.id}
                    sx={{
                      minHeight: 106,
                      border: '1px solid #dbe5f0',
                      borderRadius: 1.25,
                      p: 1,
                      bgcolor: '#fbfdff',
                    }}
                  >
                    <Typography variant="body2" fontWeight={900} textAlign="center" sx={{ mb: 0.75 }}>
                      {dia.nombre}
                    </Typography>

                    {dia.franjas.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                        Sin horario
                      </Typography>
                    ) : (
                      <Stack spacing={0.6}>
                        {dia.franjas.map((franja) => {
                          const sede = (catalogos.sedes || []).find(
                            (item) => String(item.id) === String(franja.sede_id),
                          );
                          const receso = dia.recesos.find(
                            (item) => item.hora_inicio >= franja.hora_inicio && item.hora_fin <= franja.hora_fin,
                          );

                          return (
                            <Box
                              key={franja.index}
                              sx={{
                                position: 'relative',
                                borderTop: '1px solid #edf2f7',
                                pt: 0.6,
                                pr: esPersonalizado ? 2.2 : 0,
                              }}
                            >
                              <Typography variant="caption" fontWeight={800} sx={{ display: 'block' }}>
                                {hora(franja.hora_inicio)} - {hora(franja.hora_fin)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {sede?.nombre || (esInstitucional ? 'Seleccione sede' : 'Sede')}
                              </Typography>
                              {receso ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Lunch {hora(receso.hora_inicio)}-{hora(receso.hora_fin)}
                                </Typography>
                              ) : null}

                              {esPersonalizado ? (
                                <Tooltip title="Eliminar bloque">
                                  <IconButton
                                    size="small"
                                    onClick={() => eliminarFranja(franja.index)}
                                    sx={{ position: 'absolute', top: 0, right: -6, ...dbanuStyles.actionDelete }}
                                  >
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        ) : null}

        {versiones.length > 0 ? (
          <Box sx={{ ...formStyles.seccion, mt: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <HistoryOutlinedIcon sx={{ fontSize: 19 }} />
              <Typography sx={formStyles.modalSeccionTitulo}>Historial de versiones</Typography>
            </Stack>

            <Stack spacing={0.8}>
              {versiones.map((version) => (
                <Box
                  key={version.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '90px 1.4fr 1fr 120px' },
                    gap: 1,
                    alignItems: 'center',
                    px: 1.25,
                    py: 1,
                    border: '1px solid #dbe5f0',
                    borderRadius: 1,
                    bgcolor: version.es_vigente ? '#fbfdff' : '#f8fafc',
                  }}
                >
                  <Typography variant="body2" fontWeight={900}>
                    v{version.version || 1}
                  </Typography>

                  <Box>
                    <Typography variant="body2" fontWeight={800}>
                      {version.tipo_horario === 'INSTITUCIONAL'
                        ? (version.jornada_nombre || 'Jornada institucional')
                        : 'Horario personalizado'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(version.franjas || []).length} franja(s) · {(version.recesos || []).length} receso(s)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Vigencia
                    </Typography>
                    <Typography variant="body2">
                      {String(version.fecha_inicio || '').slice(0, 10) || '—'}
                      {' '}
                      {version.fecha_fin ? `→ ${String(version.fecha_fin).slice(0, 10)}` : '→ Actual'}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    fontWeight={900}
                    sx={{
                      justifySelf: { xs: 'start', md: 'end' },
                      px: 1,
                      py: 0.4,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: version.es_vigente ? '#7cc28a' : '#cbd5e1',
                    }}
                  >
                    {version.es_vigente ? 'VIGENTE' : 'FINALIZADA'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}

        <AccionesFormulario
          onGuardar={guardar}
          onCancelar={onVolver}
          disabled={cargando || !horarioSeleccionado}
        />
      </Paper>

      <NotificacionSnackbar
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={() => setNotificacion((prev) => ({ ...prev, mensaje: '' }))}
      />
    </Box>
  );
}

function ResumenDato({ icono, etiqueta, valor }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ p: 1, border: '1px solid #dbe5f0', borderRadius: 1.25, bgcolor: '#fbfdff' }}
    >
      <Box sx={{ display: 'flex', color: '#004985', '& svg': { fontSize: 18 } }}>{icono}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
          {etiqueta}
        </Typography>
        <Typography variant="body2" fontWeight={900}>{valor}</Typography>
      </Box>
    </Stack>
  );
}
