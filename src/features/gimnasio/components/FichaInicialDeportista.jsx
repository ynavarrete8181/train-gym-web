import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, Divider, FormControlLabel, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { FotosEvaluacionDeportista } from './FotosEvaluacionDeportista.jsx';

import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const secciones = [
  { id: 'antecedentes', titulo: 'Antecedentes de salud', icono: HealthAndSafetyOutlinedIcon, campos: [['descripcion', 'Descripción', true], ['tipo', 'Tipo de antecedente'], ['restricciones', 'Restricciones o precauciones', true], ['observaciones', 'Observaciones', true]] },
  { id: 'evaluacion', titulo: 'Evaluación física', icono: MonitorHeartOutlinedIcon, campos: [['peso_kg', 'Peso (kg)'], ['talla_cm', 'Estatura (cm)'], ['cintura_cm', 'Cintura (cm)'], ['grasa_corporal_pct', 'Grasa corporal (%)'], ['actividad_fisica', 'Nivel de actividad'], ['patologia', 'Patología o condición de salud'], ['movilidad', 'Movilidad y observaciones funcionales', true], ['observaciones', 'Observaciones', true]] },
  { id: 'objetivos', titulo: 'Objetivos deportivos', icono: FlagOutlinedIcon, campos: [['objetivo', 'Descripción del objetivo', true], ['indicador', 'Indicador de seguimiento'], ['unidad_medida', 'Unidad de medida'], ['valor_inicial', 'Valor inicial'], ['valor_meta', 'Meta esperada'], ['prioridad', 'Prioridad'], ['estado_objetivo', 'Estado del objetivo'], ['observaciones', 'Observaciones', true]] },
  { id: 'valoracion', titulo: 'Valoración profesional', icono: AssignmentTurnedInOutlinedIcon, campos: [['condicion_fisica', 'Condición física observada'], ['movilidad_general', 'Movilidad observada'], ['experiencia_entrenamiento', 'Experiencia de entrenamiento'], ['requiere_adaptacion', 'Necesidad de adaptación'], ['frecuencia_seguimiento', 'Seguimiento recomendado'], ['conclusiones', 'Conclusiones', true], ['recomendaciones', 'Recomendaciones', true], ['observaciones', 'Observaciones', true]] },
];
const TIPOS_ANTECEDENTES = [{ value: 'LESION', label: 'Lesión' }, { value: 'CONDICION', label: 'Condición de salud' }, { value: 'RESTRICCION', label: 'Restricción de actividad' }, { value: 'OTRO', label: 'Otro antecedente' }];
const ACTIVIDADES = ['SEDENTARIO', 'LIGERA', 'MODERADA', 'ALTA', 'MUY_ALTA'];
const OBJETIVOS = [
  ['FUERZA', 'Mejorar fuerza'], ['RESISTENCIA', 'Mejorar resistencia'], ['MOVILIDAD', 'Mejorar movilidad'],
  ['COMPOSICION', 'Composición corporal'], ['ADHERENCIA', 'Constancia en el entrenamiento'],
];
const SELECTS_EVALUACION = {
  prioridad: [['ALTA', 'Alta'], ['MEDIA', 'Media'], ['BAJA', 'Baja']],
  estado_objetivo: [['PENDIENTE', 'Pendiente'], ['EN_PROGRESO', 'En progreso'], ['CUMPLIDO', 'Cumplido'], ['SUSPENDIDO', 'Suspendido']],
  unidad_medida: [['KG', 'Kilogramos (kg)'], ['CM', 'Centímetros (cm)'], ['PORCENTAJE', 'Porcentaje (%)'], ['REPETICIONES', 'Repeticiones'], ['MINUTOS', 'Minutos'], ['OTRO', 'Otra']],
  condicion_fisica: [['INICIAL', 'Inicial'], ['INTERMEDIA', 'Intermedia'], ['AVANZADA', 'Avanzada'], ['POR_EVALUAR', 'Por evaluar']],
  movilidad_general: [['ADECUADA', 'Adecuada'], ['LIMITADA', 'Limitada'], ['REQUIERE_EVALUACION', 'Requiere evaluación']],
  experiencia_entrenamiento: [['PRINCIPIANTE', 'Principiante'], ['INTERMEDIO', 'Intermedio'], ['AVANZADO', 'Avanzado']],
  requiere_adaptacion: [['SI', 'Sí'], ['NO', 'No'], ['POR_DETERMINAR', 'Por determinar']],
  frecuencia_seguimiento: [['SEMANAL', 'Semanal'], ['QUINCENAL', 'Quincenal'], ['MENSUAL', 'Mensual'], ['SEGUN_NECESIDAD', 'Según necesidad']],
};
const ETIQUETAS_SELECT = Object.fromEntries(Object.entries(SELECTS_EVALUACION).map(([campo, opciones]) => [campo, Object.fromEntries(opciones)]));
const hoy = () => new Date().toLocaleDateString('en-CA');
const limpio = () => ({ titulo: '', fecha_registro: hoy(), fecha_inicio: '', fecha_fin: '', proximo_control: '', datos: {} });
const numero = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const indicadores = (datos = {}) => {
  const peso = numero(datos.peso_kg);
  const altura = numero(datos.talla_cm);
  const cintura = numero(datos.cintura_cm);
  const grasa = numero(datos.grasa_corporal_pct);
  const validoGrasa = grasa !== null && grasa <= 100;
  return {
    imc: peso && altura ? peso / ((altura / 100) ** 2) : null,
    cinturaAltura: cintura && altura ? cintura / altura : null,
    grasa: validoGrasa ? grasa : null,
    magra: peso && validoGrasa ? peso * (1 - grasa / 100) : null,
  };
};
const mostrarIndicador = (valor, unidad = '') => valor === null ? '—' : `${valor.toFixed(2)}${unidad ? ` ${unidad}` : ''}`;
const mostrarFecha = (fecha) => fecha ? String(fecha).substring(0, 10).split('-').reverse().join('/') : '—';

const CampoFecha = ({ etiqueta, valor, onChange, obligatorio = false }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography component="label" sx={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.6 }}>
      {etiqueta}{obligatorio ? ' *' : ''}
    </Typography>
    <TextField
      fullWidth
      type="date"
      size="small"
      value={valor || ''}
      onChange={(evento) => onChange(evento.target.value)}
      inputProps={{ 'aria-label': etiqueta }}
      sx={dbanuStyles.field}
    />
  </Box>
);


export function FichaInicialDeportista({ deportistaId, onNotificacion }) {
  const [seccion, setSeccion] = useState('antecedentes');
  const [registros, setRegistros] = useState([]);
  const [controles, setControles] = useState([]);
  const [controlEnCurso, setControlEnCurso] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState('listado');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [form, setForm] = useState(limpio);
  const [fotoNueva, setFotoNueva] = useState(null);
  const [fotoVista, setFotoVista] = useState('FRONTAL');
  const [consentimientoFoto, setConsentimientoFoto] = useState(false);
  const [previewFoto, setPreviewFoto] = useState('');
  useEffect(() => {
    if (!fotoNueva) { setPreviewFoto(''); return undefined; }
    const url = URL.createObjectURL(fotoNueva);
    setPreviewFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [fotoNueva]);
  const limpiarFoto = () => { setFotoNueva(null); setFotoVista('FRONTAL'); setConsentimientoFoto(false); };
  const [ver, setVer] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [eliminarRegistro, setEliminarRegistro] = useState(null);
  const [error, setError] = useState('');
  const actual = secciones.find((s) => s.id === seccion) || secciones[0];

  useEffect(() => {
    if (!deportistaId) return;
    let activo = true;
    setCargando(true);
    setError('');
    setVista('listado');
    setVer(null);
    limpiarFoto();
    Promise.all([
      gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion),
      gimnasioServicio.obtenerControlesDeportista(deportistaId),
    ])
      .then(([r, c]) => {
        if (!activo) return;
        setRegistros(Array.isArray(r.datos) ? r.datos : []);
        setControles(Array.isArray(c.datos) ? c.datos : []);
      })
      .catch((e) => {
        if (!activo) return;
        const mensaje = e.response?.status === 500
          ? 'No se pudo cargar el historial. Verifica las migraciones de valoración en la base de desarrollo.'
          : e.response?.data?.mensaje || 'No se pudo consultar el historial.';
        setError(mensaje);
        onNotificacion?.(mensaje, 'error');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [deportistaId, seccion]);

  const filtrados = useMemo(() => registros.filter((r) => {
    const coincideTexto = !busqueda || [r.titulo, ...Object.values(r.datos || {})]
      .some((v) => String(v ?? '').toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')));
    return coincideTexto;
  }), [registros, busqueda]);

  const paginaRegistros = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  const iniciarEdicion = (registro) => {
    setEditandoId(registro.id);
    setForm({
      titulo: registro.titulo || '', fecha_registro: String(registro.fecha_registro || '').substring(0, 10),
      fecha_inicio: String(registro.fecha_inicio || '').substring(0, 10),
      fecha_fin: String(registro.fecha_fin || '').substring(0, 10),
      proximo_control: String(registro.proximo_control || '').substring(0, 10),
      datos: { ...(registro.datos || {}) },
    });
    setControlEnCurso(null); limpiarFoto(); setVista('editar');
  };
  const confirmarEliminacion = async () => {
    if (!eliminarRegistro || guardando) return;
    setGuardando(true);
    try {
      await gimnasioServicio.anularValoracionDeportista(deportistaId, eliminarRegistro.id);
      const res = await gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion);
      setRegistros(Array.isArray(res.datos) ? res.datos : []);
      setControles((prev) => prev.map((c) => c.registro_origen_id === eliminarRegistro.id && c.estado === 'PROGRAMADO' ? { ...c, estado: 'CANCELADO' } : c));
      setVista('listado'); setVer(null); setEliminarRegistro(null);
      onNotificacion?.('Registro anulado correctamente. Su historial se conserva.', 'success');
    } catch (e) {
      onNotificacion?.(e.response?.data?.mensaje || 'No se pudo anular el registro.', 'error');
    } finally { setGuardando(false); }
  };
  const iniciarRevision = (control) => {
    setSeccion(control.seccion);
    setForm({ ...limpio(), titulo: `Seguimiento · ${control.titulo}` });
    setEditandoId(null);
    setControlEnCurso(control);
    limpiarFoto();
    setVista('nuevo');
  };
  const refrescarHistorial = async () => {
    const [r, c] = await Promise.all([
      gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion),
      gimnasioServicio.obtenerControlesDeportista(deportistaId),
    ]);
    setRegistros(Array.isArray(r.datos) ? r.datos : []);
    setControles(Array.isArray(c.datos) ? c.datos : []);
  };
  const guardar = async () => {
    if (!form.titulo.trim() || (!['antecedentes', 'objetivos'].includes(seccion) && !form.fecha_registro) || !actual.campos.some(([campo]) => String(form.datos[campo] ?? '').trim())) {
      onNotificacion?.('Completa título, fecha y al menos un dato de la valoración.', 'warning');
      return;
    }
    if (fotoNueva && (!consentimientoFoto || !['image/jpeg', 'image/png', 'image/webp'].includes(fotoNueva.type) || fotoNueva.size > 5 * 1024 * 1024)) {
      onNotificacion?.(!consentimientoFoto ? 'Confirma la autorización para registrar la fotografía.' : 'La fotografía debe ser JPG, PNG o WEBP y pesar hasta 5 MB.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        seccion, titulo: form.titulo.trim(), fecha_registro: ['antecedentes', 'objetivos'].includes(seccion) ? undefined : form.fecha_registro,
        fecha_inicio: seccion === 'objetivos' ? null : form.fecha_inicio || null, fecha_fin: seccion === 'objetivos' ? null : form.fecha_fin || null,
        proximo_control: form.proximo_control || null, datos: form.datos,
        ...(!editandoId && controlEnCurso ? { control_id: controlEnCurso.id } : {}),
      };
      const creado = editandoId
        ? await gimnasioServicio.actualizarValoracionDeportista(deportistaId, editandoId, payload)
        : await gimnasioServicio.crearValoracionDeportista(deportistaId, payload);
      const nuevoId = creado?.datos?.id;
      if (fotoNueva) {
        try {
          if (!nuevoId) throw new Error('La API no devolvió el identificador de la evaluación.');
          await gimnasioServicio.subirFotoValoracion(
            deportistaId, fotoNueva, nuevoId, fotoVista, form.fecha_registro, consentimientoFoto,
          );
        } catch (fotoError) {
          const res = await gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion);
          const items = Array.isArray(res.datos) ? res.datos : [];
          setRegistros(items);
          setVer(items.find((item) => Number(item.id) === Number(nuevoId)) || null);
          setVista('detalle');
          limpiarFoto();
          onNotificacion?.('Evaluación guardada, pero no se pudo subir la foto. Abre el detalle y vuelve a intentarlo.', 'warning');
          return;
        }
      }
      await refrescarHistorial();
      setControlEnCurso(null);
      setForm(limpio());
      setEditandoId(null);
      limpiarFoto();
      setVista('listado');
      setVer(null);
      onNotificacion?.(controlEnCurso ? 'Revisión realizada y vinculada al control.' : editandoId ? 'Registro actualizado correctamente.' : fotoNueva ? 'Evaluación y fotografía registradas correctamente.' : 'Valoración registrada correctamente.', 'success');
    } catch (e) {
      const errores = e.response?.data?.errors;
      const mensaje = errores ? Object.values(errores).flat()[0] : e.response?.data?.mensaje || 'No se pudo guardar el registro.';
      onNotificacion?.(mensaje, e.response?.status === 422 ? 'warning' : 'error');
    } finally { setGuardando(false); }
  };

  if (!deportistaId) return <Alert severity="info">Guarda primero los datos del cliente.</Alert>;

  return <Box sx={{ mt: 0.5 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2, gap: 1 }}>
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: 15 }}>Ficha de valoración y seguimiento</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Historial de antecedentes, controles físicos, objetivos y valoraciones.</Typography>
      </Box>
      <Chip size="small" variant="outlined" label="Seguimiento continuo" />
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
      <Box component="nav" aria-label="Secciones de ficha inicial" sx={{
        p: 1, border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff',
        position: { md: 'sticky' }, top: { md: 16 },
      }}>
        <Typography variant="overline" sx={{ display: 'block', px: 1.5, pt: 1, pb: .5, color: 'text.secondary', fontWeight: 850 }}>
          Ficha inicial
        </Typography>
        <Stack spacing={.5}>
          {secciones.map((s) => {
            const Icono = s.icono;
            const activo = s.id === seccion;
            return <Button key={s.id} type="button" fullWidth
              aria-current={activo ? 'step' : undefined}
              onClick={() => { setSeccion(s.id); setPagina(1); setForm(limpio()); setEditandoId(null); setControlEnCurso(null); limpiarFoto(); }}
              startIcon={<Icono sx={{ fontSize: 19 }} />}
              sx={{
                justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none',
                borderRadius: 1.5, px: 1.2, py: 1.1, minHeight: 54,
                color: activo ? '#8b6410' : '#475467',
                bgcolor: activo ? '#fff7df' : 'transparent',
                borderLeft: activo ? '3px solid #b28a24' : '3px solid transparent',
                '&:hover': { bgcolor: activo ? '#fff2cc' : '#f8fafc' },
                '& .MuiButton-startIcon': { mr: 1.1 },
              }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: activo ? 900 : 700, lineHeight: 1.3 }}>{s.titulo}</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: 10.5, lineHeight: 1.3, mt: .25, color: 'text.secondary' }}>
                  {s.id === 'antecedentes' ? 'Condiciones y precauciones' :
                    s.id === 'evaluacion' ? 'Mediciones y composición corporal' :
                    s.id === 'objetivos' ? 'Metas y seguimiento deportivo' :
                    'Evaluación y observaciones'}
                </Typography>
              </Box>
            </Button>;
          })}
        </Stack>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, minWidth: 0 }}>
        {vista !== 'listado' && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 850, fontSize: 14 }}>{vista === 'nuevo' ? `Nuevo registro · ${actual.titulo}` : vista === 'editar' ? `Editar registro · ${actual.titulo}` : `Detalle · ${actual.titulo}`}</Typography>
          </Box>
          <Box sx={{ ml: 'auto', flexShrink: 0 }}><BotonVolver disabled={guardando} onClick={() => { setVista('listado'); setVer(null); setEditandoId(null); setControlEnCurso(null); limpiarFoto(); }} /></Box>
        </Stack>}
        {(vista === 'nuevo' || vista === 'editar') && <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: seccion === 'evaluacion' ? 'minmax(0,1fr) 266px' : '1fr' }, gap: 2, alignItems: 'start' }}>
          <Box sx={{ minWidth: 0 }}>
          {controlEnCurso && <Alert severity="info" sx={{ mb: 1.5 }}>Realizando revisión programada para {mostrarFecha(controlEnCurso.fecha_programada)}. Se guardará como una nueva valoración vinculada al control.</Alert>}
          <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1.75 }}>{seccion === 'evaluacion' ? 'Datos y mediciones físicas' : 'Información del registro'}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
            <TextField size="small" label="Título del registro *" value={form.titulo} onChange={(e) => cambiar('titulo', e.target.value)} sx={{ ...dbanuStyles.field, gridColumn: '1 / -1' }} />
            {['antecedentes', 'objetivos'].includes(seccion) ? (
              <>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">
                    {seccion === 'objetivos' ? 'La fecha de registro se asigna automáticamente al guardar.' : 'La fecha de registro se asigna automáticamente al guardar. Indica las fechas de la condición solo si las conoces.'}
                  </Typography>
                </Box>
                {seccion === 'antecedentes' ? <>
                  <CampoFecha etiqueta="Fecha de inicio (opcional)" valor={form.fecha_inicio} onChange={(valor) => cambiar('fecha_inicio', valor)} />
                  <CampoFecha etiqueta="Fecha de finalización (opcional)" valor={form.fecha_fin} onChange={(valor) => cambiar('fecha_fin', valor)} />
                </> : <CampoFecha etiqueta="Próxima revisión (opcional)" valor={form.proximo_control} onChange={(valor) => cambiar('proximo_control', valor)} />}
              </>
            ) : (
              <>
                <CampoFecha etiqueta="Fecha del registro" obligatorio valor={form.fecha_registro} onChange={(valor) => cambiar('fecha_registro', valor)} />
                <CampoFecha etiqueta="Próximo control" valor={form.proximo_control} onChange={(valor) => cambiar('proximo_control', valor)} />

              </>
            )}
            {seccion === 'evaluacion' && <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" color="text.secondary">
                Registra la composición corporal inicial. Las pruebas de fuerza, resistencia y 1RM se realizarán en el módulo del entrenador.
              </Typography>
            </Box>}
            {seccion === 'objetivos' && <>
              <TextField select size="small" label="Categoría del objetivo" value={form.datos.objetivo_codigo || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, objetivo_codigo: e.target.value } }))}
                sx={dbanuStyles.field}>
                <MenuItem value="">Seleccionar</MenuItem>
                {OBJETIVOS.map(([codigo, etiqueta]) => <MenuItem key={codigo} value={codigo}>{etiqueta}</MenuItem>)}
              </TextField>
              <TextField size="small" type="number" label="Plazo previsto (semanas)" value={form.datos.plazo_semanas ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, plazo_semanas: e.target.value } }))}
                sx={dbanuStyles.field} />
            </>}
            {actual.campos.map(([campo, etiqueta, multilinea]) => {
              if (seccion === 'antecedentes' && campo === 'tipo') return <TextField key={campo} select size="small"
                label={etiqueta} value={form.datos[campo] ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))}
                sx={dbanuStyles.field}>
                <MenuItem value="">Seleccionar</MenuItem>
                {TIPOS_ANTECEDENTES.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
              </TextField>;
              if (seccion === 'evaluacion' && campo === 'actividad_fisica') return <TextField key={campo} select size="small" label={etiqueta}
                value={form.datos[campo] ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))} sx={dbanuStyles.field}>
                <MenuItem value="">Sin especificar</MenuItem>
                {ACTIVIDADES.map((nivel) => <MenuItem key={nivel} value={nivel}>{nivel.replace('_', ' ').toLowerCase()}</MenuItem>)}
              </TextField>;
              if (SELECTS_EVALUACION[campo]) return <TextField key={campo} select size="small" label={etiqueta}
                value={form.datos[campo] ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))} sx={dbanuStyles.field}>
                <MenuItem value="">Seleccionar</MenuItem>
                {SELECTS_EVALUACION[campo].map(([codigo, nombre]) => <MenuItem key={codigo} value={codigo}>{nombre}</MenuItem>)}
              </TextField>;
              return <TextField key={campo} size="small" label={etiqueta} fullWidth
                type={(seccion === 'evaluacion' && ['peso_kg','talla_cm','cintura_cm','grasa_corporal_pct'].includes(campo)) || (seccion === 'objetivos' && ['valor_inicial','valor_meta'].includes(campo)) ? 'number' : 'text'}
                multiline={Boolean(multilinea)} minRows={multilinea ? 2 : undefined}
                inputProps={seccion === 'evaluacion' && ['peso_kg','talla_cm','cintura_cm','grasa_corporal_pct'].includes(campo) ? { min: 0, max: campo === 'grasa_corporal_pct' ? 100 : undefined, step: 'any' } : undefined}
                value={form.datos[campo] ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))}
                sx={{ ...dbanuStyles.field, gridColumn: multilinea ? '1 / -1' : 'auto' }} />;
            })}

          </Box>
          {seccion === 'evaluacion' && <Box sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.5 }}>Indicadores de composición corporal · vista previa</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 1 }}>
              {[
                ['IMC', indicadores(form.datos).imc, 'kg/m²'],
                ['Índice cintura/altura', indicadores(form.datos).cinturaAltura, ''],
                ['Grasa corporal', indicadores(form.datos).grasa, '%'],
                ['Masa corporal magra', indicadores(form.datos).magra, 'kg'],
              ].map(([etiqueta, valor, unidad]) => <Box key={etiqueta} sx={{ p: 1.25, bgcolor: 'action.hover', borderRadius: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{mostrarIndicador(valor, unidad)}</Typography>
              </Box>)}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Cálculos orientativos a partir de las mediciones ingresadas. No sustituyen una valoración profesional.</Typography>
          </Box>}
          </Box>
          {seccion === 'evaluacion' && vista !== 'editar' && <Box sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <AddPhotoAlternateOutlinedIcon sx={{ color: 'primary.main', fontSize: 19 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 850 }}>Fotografía de evolución</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Opcional · Se asociará a esta evaluación física.
            </Typography>
            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 1.25, textAlign: 'center', bgcolor: 'action.hover' }}>
              {previewFoto ? <Box component="img" src={previewFoto} alt="Vista previa de la fotografía seleccionada"
                sx={{ display: 'block', width: '100%', height: 180, objectFit: 'contain', borderRadius: 0.5, mb: 1.25 }} />
                : <Box sx={{ minHeight: 148, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 38, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">Sin fotografía seleccionada</Typography>
                  </Box>}
              <Button component="label" variant="outlined" size="small" fullWidth startIcon={<AddPhotoAlternateOutlinedIcon />}>
                {fotoNueva ? 'Cambiar fotografía' : 'Seleccionar fotografía'}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFotoNueva(e.target.files?.[0] || null)} />
              </Button>
              {fotoNueva && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere' }}>{fotoNueva.name}</Typography>}
            </Box>
            <TextField select fullWidth size="small" label="Orientación" value={fotoVista} onChange={(e) => setFotoVista(e.target.value)}
              sx={{ ...dbanuStyles.field, mt: 1.5 }}>
              <MenuItem value="FRONTAL">Frontal</MenuItem>
              <MenuItem value="LATERAL">Lateral</MenuItem>
              <MenuItem value="POSTERIOR">Posterior</MenuItem>
              <MenuItem value="OTRA">Otra</MenuItem>
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              JPG, PNG o WEBP · Máximo 5 MB
            </Typography>
            {fotoNueva && <FormControlLabel sx={{ mt: 1, mx: 0, alignItems: 'flex-start' }}
              control={<Checkbox size="small" sx={{ pt: 0.25 }} checked={consentimientoFoto} onChange={(e) => setConsentimientoFoto(e.target.checked)} />}
              label={<Typography variant="caption">Confirmo la autorización del deportista para registrar esta imagen.</Typography>} />}
          </Box>}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 0, justifyContent: 'flex-end' }}>
            <BotonGuardar guardando={guardando} onClick={guardar} />
          </Stack>
        </Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {vista === 'listado' && <>
          <GestionToolbar
            total={filtrados.length}
            busqueda={busqueda}
            onBusqueda={(valor) => { setBusqueda(valor); setPagina(1); }}
            acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => { setVista('nuevo'); setEditandoId(null); setControlEnCurso(null); setForm(limpio()); limpiarFoto(); }} disabled={cargando || Boolean(error)}>Añadir</Button>}

          />
          <TablaGestion total={registros.length} filtrados={filtrados.length} page={pagina} rowsPerPage={porPagina}
            onPageChange={setPagina} onRowsPerPageChange={(cantidad) => { setPorPagina(cantidad); setPagina(1); }} cargando={cargando}>
            <TableHead><TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell>Próximo control</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {paginaRegistros.map((registro) => <TableRow key={registro.id} hover>
                <TableCell>{mostrarFecha(registro.fecha_registro)}</TableCell>
                <TableCell>{registro.titulo}</TableCell>
                <TableCell>{mostrarFecha(registro.proximo_control)}</TableCell>
                <TableCell><StatusChip estado={String(registro.estado || 'ACTIVO').toLowerCase()} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver detalle">
                    <IconButton sx={dbanuStyles.actionView} onClick={() => { setVer(registro); setVista('detalle'); }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar registro">
                    <IconButton sx={dbanuStyles.actionEdit} onClick={() => iniciarEdicion(registro)} disabled={guardando}>
                      <EditOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Anular registro">
                    <IconButton sx={dbanuStyles.actionDelete} onClick={() => setEliminarRegistro(registro)} disabled={guardando}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  {seccion === 'evaluacion' && <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />}
                    sx={{ ml: 0.75, whiteSpace: 'nowrap' }}
                    onClick={() => { setVer(registro); setVista('detalle'); }}>
                    Añadir foto
                  </Button>}
                </TableCell>
              </TableRow>)}
              {!paginaRegistros.length && !cargando && <TableRow><TableCell colSpan={5} align="center">No se encontraron registros.</TableCell></TableRow>}
            </TableBody>
          </TablaGestion>
        </>}
        {vista === 'detalle' && ver && <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>{ver.titulo} · {mostrarFecha(ver.fecha_registro)}</Typography>
          {actual.campos.map(([campo, etiqueta]) => ver.datos?.[campo] !== undefined && ver.datos?.[campo] !== '' ? <Typography key={campo} variant="body2" sx={{ mb: 0.5 }}><strong>{etiqueta}:</strong> {ETIQUETAS_SELECT[campo]?.[ver.datos[campo]] || ver.datos[campo]}</Typography> : null)}
          {seccion === 'evaluacion' && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 1, my: 1.5 }}>
            {[
              ['IMC', indicadores(ver.datos).imc, 'kg/m²'],
              ['Cintura/altura', indicadores(ver.datos).cinturaAltura, ''],
              ['Grasa corporal', indicadores(ver.datos).grasa, '%'],
              ['Masa magra', indicadores(ver.datos).magra, 'kg'],
            ].map(([etiqueta, valor, unidad]) => <Box key={etiqueta} sx={{ bgcolor: 'action.hover', p: 1.25, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
              <Typography fontWeight={800}>{mostrarIndicador(valor, unidad)}</Typography>
            </Box>)}
          </Box>}
          <Typography variant="caption" color="text.secondary">Registrado por usuario #{ver.registrado_por}</Typography>
          {seccion === "evaluacion" && <FotosEvaluacionDeportista deportistaId={deportistaId} registro={ver} onNotificacion={onNotificacion} />}
        </Box>}
      </Paper>
    </Box>

    <Dialog open={Boolean(eliminarRegistro)} onClose={() => !guardando && setEliminarRegistro(null)} maxWidth="xs" fullWidth>
      <DialogTitle>¿Anular registro?</DialogTitle>
      <DialogContent><DialogContentText>
        Se anulará «{eliminarRegistro?.titulo}». Dejará de aparecer en el historial activo y los reportes, pero se conservará para trazabilidad.
      </DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={() => setEliminarRegistro(null)} disabled={guardando}>Cancelar</Button>
        <Button color="error" onClick={confirmarEliminacion} disabled={guardando}>Anular registro</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
