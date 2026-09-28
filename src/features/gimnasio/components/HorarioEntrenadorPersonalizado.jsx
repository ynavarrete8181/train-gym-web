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
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
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
  tipo_horario: 'INSTITUCIONAL',
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
  lunch_inicio: '',
  lunch_fin: '',
};

const hora = (value) => String(value || '').slice(0, 5);

export function HorarioEntrenadorPersonalizado({ entrenador, onVolver }) {
  const [form, setForm] = useState(inicial);
  const [catalogos, setCatalogos] = useState({ sedes: [], jornadas: [], tipos_receso: [] });
  const [bloque, setBloque] = useState(bloqueInicial);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const nombre =
    [entrenador?.nombres, entrenador?.apellidos].filter(Boolean).join(' ')
    || entrenador?.name
    || 'Entrenador';

  const esPersonalizado = form.tipo_horario === 'PERSONALIZADO';

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
      const jornadas = (catalogosData.jornadas || []).length
        ? catalogosData.jornadas
        : (jornadasRes.datos || []);

      setCatalogos({
        sedes: catalogosData.sedes || [],
        jornadas,
        tipos_receso: catalogosData.tipos_receso || ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'PAUSA', 'OTRO'],
      });

      const actual = (horariosRes.datos || [])[0];
      if (actual) {
        setForm({
          ...inicial,
          ...actual,
          tipo_horario: actual.tipo_horario || 'PERSONALIZADO',
          jornada_id: actual.jornada_id || '',
          fecha_inicio: actual.fecha_inicio ? String(actual.fecha_inicio).slice(0, 10) : '',
          fecha_fin: actual.fecha_fin ? String(actual.fecha_fin).slice(0, 10) : '',
          franjas: (actual.franjas || []).map((item) => ({
            ...item,
            hora_inicio: hora(item.hora_inicio),
            hora_fin: hora(item.hora_fin),
          })),
          recesos: (actual.recesos || []).map((item) => ({
            ...item,
            hora_inicio: hora(item.hora_inicio),
            hora_fin: hora(item.hora_fin),
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

  useEffect(() => {
    cargar();
  }, [entrenador.id]);

  const resumenDias = useMemo(
    () => DIAS.map((dia) => ({
      ...dia,
      franjas: form.franjas
        .map((franja, index) => ({ ...franja, index }))
        .filter((franja) => franja.dia_semana === dia.id),
      recesos: form.recesos
        .map((receso, index) => ({ ...receso, index }))
        .filter((receso) => receso.dia_semana === dia.id),
    })),
    [form.franjas, form.recesos],
  );

  const jornadaSeleccionada = useMemo(
    () => (catalogos.jornadas || []).find((item) => String(item.id) === String(form.jornada_id)),
    [catalogos.jornadas, form.jornada_id],
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
      setBloque(bloqueInicial);
      return;
    }

    const jornada = (catalogos.jornadas || []).find((item) => String(item.id) === String(value));
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

    setBloque({
      dias: dias.length ? dias : ['LUNES'],
      sede_id: '',
      hora_inicio: hora(primero?.hora_inicio) || '08:00',
      hora_fin: hora(primero?.hora_fin) || '17:00',
      lunch: false,
      lunch_inicio: '',
      lunch_fin: '',
    });
  };

  const toggleDia = (dia) => {
    setBloque((prev) => {
      const seleccionado = prev.dias.includes(dia);

      if (seleccionado && prev.dias.length === 1) {
        return prev;
      }

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

    setNotificacion({
      mensaje: `Horario agregado a ${bloque.dias.length} día(s).`,
      tipo: 'success',
    });
  };

  const eliminarFranja = (index) => {
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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr .8fr' },
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label="Horario institucional"
              value={esPersonalizado ? 'PERSONALIZADO' : (form.jornada_id || '')}
              onChange={(event) => seleccionarHorarioInstitucional(event.target.value)}
              helperText="Seleccione una jornada global o configure un horario personalizado."
            >
              {(catalogos.jornadas || []).map((jornada) => (
                <MenuItem key={jornada.id} value={jornada.id}>
                  {jornada.nombre}
                </MenuItem>
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
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Vigente hasta"
              type="date"
              size="small"
              value={form.fecha_fin || ''}
              disabled={!esPersonalizado}
              required={esPersonalizado}
              onChange={(event) => setForm((prev) => ({ ...prev, fecha_fin: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box
              sx={{
                minHeight: 40,
                px: 1.5,
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

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {esPersonalizado
              ? 'El horario personalizado requiere Vigente desde y Vigente hasta.'
              : 'La jornada institucional toma sus días y horas desde el catálogo global de Jornadas.'}
          </Typography>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt: 2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Horario semanal personalizado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Configure un bloque a la vez. Seleccione uno o varios días, sede, horario y active Lunch si corresponde.
          </Typography>

          <Box sx={{ border: '1px solid #dbe5f0', borderRadius: 1.5, p: 2 }}>
            <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {DIAS.map((dia) => {
                const seleccionado = bloque.dias.includes(dia.id);
                return (
                  <Button
                    key={dia.id}
                    size="small"
                    variant={seleccionado ? 'contained' : 'outlined'}
                    onClick={() => toggleDia(dia.id)}
                    sx={seleccionado ? dbanuStyles.addButtonRevive : { minWidth: 62 }}
                  >
                    {dia.corto}
                  </Button>
                );
              })}
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.2fr .8fr .8fr auto .8fr .8fr auto' },
                gap: 1,
                alignItems: 'center',
              }}
            >
              <TextField
                select
                size="small"
                label="Sede"
                value={bloque.sede_id}
                onChange={(event) => setBloque((prev) => ({ ...prev, sede_id: event.target.value }))}
              >
                {(catalogos.sedes || []).map((sede) => (
                  <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="time"
                label="Inicio jornada"
                value={bloque.hora_inicio}
                onChange={(event) => setBloque((prev) => ({ ...prev, hora_inicio: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                size="small"
                type="time"
                label="Fin jornada"
                value={bloque.hora_fin}
                onChange={(event) => setBloque((prev) => ({ ...prev, hora_fin: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />

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
                  height: 40,
                  border: '1px solid #dbe5f0',
                  borderRadius: 1,
                  '& .MuiFormControlLabel-label': { fontWeight: 700, fontSize: 13 },
                }}
              />

              <TextField
                size="small"
                type="time"
                label="Inicio receso"
                value={bloque.lunch_inicio}
                disabled={!bloque.lunch}
                onChange={(event) => setBloque((prev) => ({ ...prev, lunch_inicio: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                size="small"
                type="time"
                label="Fin receso"
                value={bloque.lunch_fin}
                disabled={!bloque.lunch}
                onChange={(event) => setBloque((prev) => ({ ...prev, lunch_fin: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Button
                variant="outlined"
                startIcon={<AddOutlinedIcon />}
                onClick={agregarBloque}
                sx={{ height: 40, whiteSpace: 'nowrap' }}
              >
                Horario
              </Button>
            </Box>

            {jornadaSeleccionada && !esPersonalizado ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                Plantilla seleccionada: {jornadaSeleccionada.nombre}. Puede ajustar los días y horas antes de agregar el bloque.
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt: 2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Resumen de configuración</Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1,
              mb: 1.5,
            }}
          >
            <ResumenDato
              icono={<LocationOnOutlinedIcon />}
              etiqueta="Sedes"
              valor={new Set(form.franjas.map((item) => item.sede_id)).size || 0}
            />
            <ResumenDato
              icono={<EventAvailableOutlinedIcon />}
              etiqueta="Franjas semanales"
              valor={form.franjas.length}
            />
            <ResumenDato
              icono={<AccessTimeOutlinedIcon />}
              etiqueta="Recesos configurados"
              valor={form.recesos.length}
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
                  minHeight: 118,
                  border: '1px solid #dbe5f0',
                  borderRadius: 1.25,
                  p: 1.25,
                  bgcolor: '#fbfdff',
                }}
              >
                <Typography variant="body2" fontWeight={900} textAlign="center" sx={{ mb: 1 }}>
                  {dia.nombre}
                </Typography>

                {dia.franjas.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    Sin horario
                  </Typography>
                ) : (
                  <Stack spacing={0.75}>
                    {dia.franjas.map((franja) => {
                      const sede = (catalogos.sedes || []).find((item) => String(item.id) === String(franja.sede_id));
                      const receso = dia.recesos.find(
                        (item) => item.hora_inicio >= franja.hora_inicio && item.hora_fin <= franja.hora_fin,
                      );

                      return (
                        <Box
                          key={franja.index}
                          sx={{
                            position: 'relative',
                            borderTop: '1px solid #edf2f7',
                            pt: 0.75,
                            pr: 2.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} sx={{ display: 'block' }}>
                            {hora(franja.hora_inicio)} - {hora(franja.hora_fin)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {sede?.nombre || 'Sede'}
                          </Typography>
                          {receso ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Lunch {hora(receso.hora_inicio)}-{hora(receso.hora_fin)}
                            </Typography>
                          ) : null}
                          <Tooltip title="Eliminar bloque">
                            <IconButton
                              size="small"
                              onClick={() => eliminarFranja(franja.index)}
                              sx={{ position: 'absolute', top: 2, right: -6, ...dbanuStyles.actionDelete }}
                            >
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            ))}
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

function ResumenDato({ icono, etiqueta, valor }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ p: 1.25, border: '1px solid #dbe5f0', borderRadius: 1.25, bgcolor: '#fbfdff' }}
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
