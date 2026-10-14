import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const menus = [
  { id: 'antecedentes', titulo: 'Antecedentes de salud', icono: HealthAndSafetyOutlinedIcon, campos: [
    ['enfermedades', 'Antecedentes de salud relevantes', true],
    ['lesiones', 'Lesiones actuales o previas', true],
    ['medicamentos', 'Medicamentos relevantes', true],
    ['restricciones', 'Restricciones y precauciones indicadas', true],
  ] },
  { id: 'evaluacion', titulo: 'Evaluación física', icono: MonitorHeartOutlinedIcon, campos: [
    ['peso_kg', 'Peso (kg)'], ['talla_cm', 'Estatura (cm)'], ['cintura_cm', 'Cintura (cm)'],
    ['grasa_corporal_pct', 'Grasa corporal (%)'], ['movilidad', 'Movilidad y pruebas funcionales', true],
  ] },
  { id: 'objetivos', titulo: 'Objetivos deportivos', icono: FlagOutlinedIcon, campos: [
    ['objetivo_principal', 'Objetivo principal'], ['experiencia', 'Experiencia deportiva'],
    ['dias_semana', 'Días disponibles por semana'], ['metas', 'Metas y preferencias', true],
  ] },
  { id: 'valoracion', titulo: 'Valoración profesional', icono: AssignmentTurnedInOutlinedIcon, campos: [
    ['conclusiones', 'Conclusiones', true], ['recomendaciones', 'Recomendaciones y seguimiento', true],
    ['fecha_seguimiento', 'Fecha sugerida de seguimiento'],
  ] },
];

export function FichaInicialDeportista({ deportistaId, onNotificacion }) {
  const [seccion, setSeccion] = useState('antecedentes');
  const [ficha, setFicha] = useState(null);
  const [formularios, setFormularios] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [camposInvalidos, setCamposInvalidos] = useState(false);

  useEffect(() => {
    if (!deportistaId) return;
    let activo = true;
    setCargando(true);
    setFicha(null);
    setFormularios({});
    setError('');
    setCamposInvalidos(false);
    gimnasioServicio.obtenerFichaInicial(deportistaId)
      .then((res) => {
        if (!activo) return;
        const datos = res.datos || null;
        setFicha(datos);
        setFormularios(Object.fromEntries(menus.map((m) => [m.id, datos?.[m.id] || {}])));
      })
.catch((e) => { if (activo) { const mensaje = e.response?.data?.mensaje || 'No se pudo cargar la ficha.'; setError(mensaje); onNotificacion?.(mensaje, 'error'); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [deportistaId]);

  const actual = menus.find((m) => m.id === seccion) || menus[0];
  const terminado = actual.campos.some(([campo]) => String(formularios[seccion]?.[campo] ?? '').trim() !== '');
  const guardar = async () => {
    if (!terminado) {
      setCamposInvalidos(true);
      onNotificacion?.('Ingresa al menos un dato en esta sección antes de guardar.', 'warning');
      return;
    }
    setGuardando(true);
    setError('');
    setCamposInvalidos(false);
    try {
      const respuesta = await gimnasioServicio.guardarFichaInicial(deportistaId, {
        seccion, datos: formularios[seccion] || {},
      });
      setFicha(respuesta.datos || null);
      onNotificacion?.('Sección guardada correctamente.', 'success');
    } catch (e) {
      const mensaje = e.response?.data?.mensaje || e.response?.data?.message || 'No se pudo guardar la ficha.';
      onNotificacion?.(mensaje === 'validation.required' ? 'Completa los campos antes de guardar.' : mensaje, e.response?.status === 422 ? 'warning' : 'error');
    } finally { setGuardando(false); }
  };
  if (!deportistaId) return <Typography variant="body2">Guarda primero los datos del cliente para registrar su ficha.</Typography>;

  return (
    <Box sx={{ mt: 0.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2, gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 850, fontSize: 15 }}>Ficha de valoración inicial</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Registro de antecedentes, evaluación y objetivos del deportista</Typography>
        </Box>
        <Chip size="small" variant="outlined" label={ficha?.estado === 'COMPLETADA' ? 'Completada' : 'Borrador'} color={ficha?.estado === 'COMPLETADA' ? 'success' : 'warning'} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '224px minmax(0,1fr)' }, gap: 1.5, alignItems: 'start' }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', p: 0.75 }}>
          {menus.map((m) => {
            const Icono = m.icono;
            const seleccionado = m.id === seccion;
            return <Box key={m.id} component="button" type="button" onClick={() => { setSeccion(m.id); setError(''); setCamposInvalidos(false); }}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left', gap: 1, p: 1.4,
                fontSize: 12, fontWeight: seleccionado ? 850 : 650, cursor: 'pointer',
                color: seleccionado ? 'primary.main' : 'text.primary', bgcolor: seleccionado ? 'rgba(20,73,133,0.08)' : 'transparent',
                border: 0, borderLeft: seleccionado ? `3px solid ${uiTokens.colores.primario}` : '3px solid transparent', borderRadius: 0.5,
                '&:hover': { bgcolor: 'rgba(20,73,133,0.05)' } }}>
              <Icono sx={{ fontSize: 18, flexShrink: 0 }} />{m.titulo}
            </Box>;
          })}
        </Paper>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 850 }}>{actual.titulo}</Typography>
            <Chip size="small" variant="outlined" label={terminado ? 'Con datos' : 'Sin completar'} />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {cargando ? <CircularProgress size={24} /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
            {actual.campos.map(([campo, etiqueta, multilinea]) =>
              <TextField key={campo} size="small" fullWidth label={etiqueta} multiline={Boolean(multilinea)}
                minRows={multilinea ? 2 : undefined}
                value={formularios[seccion]?.[campo] ?? ''}
                error={camposInvalidos && String(formularios[seccion]?.[campo] ?? '').trim() === ''}
                onChange={(e) => { setCamposInvalidos(false); setFormularios((prev) => ({
                  ...prev, [seccion]: { ...prev[seccion], [campo]: e.target.value },
                })); }}
                disabled={guardando || ficha?.estado === 'COMPLETADA'}
                sx={{ ...dbanuStyles.field, gridColumn: multilinea ? '1 / -1' : 'auto' }} />
            )}
          </Box>}
          {error && <Typography color="error" sx={{ fontSize: 12, mt: 1.5 }}>{error}</Typography>}
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <BotonGuardar guardando={guardando} disabled={cargando || ficha?.estado === 'COMPLETADA' || Boolean(error)} onClick={guardar} />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
