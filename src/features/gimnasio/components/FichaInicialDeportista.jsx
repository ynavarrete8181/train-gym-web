import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const secciones = [
  { id: 'antecedentes', titulo: 'Antecedentes de salud', icono: HealthAndSafetyOutlinedIcon, campos: [['descripcion', 'Descripción', true], ['tipo', 'Tipo de antecedente'], ['restricciones', 'Restricciones o precauciones', true], ['observaciones', 'Observaciones', true]] },
  { id: 'evaluacion', titulo: 'Evaluación física', icono: MonitorHeartOutlinedIcon, campos: [['peso_kg', 'Peso (kg)'], ['talla_cm', 'Estatura (cm)'], ['cintura_cm', 'Cintura (cm)'], ['grasa_corporal_pct', 'Grasa corporal (%)'], ['movilidad', 'Movilidad y pruebas funcionales', true], ['observaciones', 'Observaciones', true]] },
  { id: 'objetivos', titulo: 'Objetivos deportivos', icono: FlagOutlinedIcon, campos: [['objetivo', 'Objetivo', true], ['indicador', 'Indicador de evaluación'], ['valor_inicial', 'Valor inicial'], ['valor_meta', 'Meta esperada'], ['observaciones', 'Observaciones', true]] },
  { id: 'valoracion', titulo: 'Valoración profesional', icono: AssignmentTurnedInOutlinedIcon, campos: [['conclusiones', 'Conclusiones', true], ['recomendaciones', 'Recomendaciones', true], ['observaciones', 'Observaciones', true]] },
];
const hoy = () => new Date().toLocaleDateString('en-CA');
const limpio = () => ({ titulo: '', fecha_registro: hoy(), fecha_inicio: '', fecha_fin: '', proximo_control: '', datos: {} });
const mostrarFecha = (fecha) => fecha ? String(fecha).substring(0, 10).split('-').reverse().join('/') : '—';

export function FichaInicialDeportista({ deportistaId, onNotificacion }) {
  const [seccion, setSeccion] = useState('antecedentes');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(limpio);
  const [ver, setVer] = useState(null);
  const [error, setError] = useState('');
  const actual = secciones.find((s) => s.id === seccion) || secciones[0];

  useEffect(() => {
    if (!deportistaId) return;
    let activo = true;
    setCargando(true);
    setError('');
    setAbierto(false);
    setVer(null);
    gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion)
      .then((r) => { if (activo) setRegistros(Array.isArray(r.datos) ? r.datos : []); })
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

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  const guardar = async () => {
    if (!form.titulo.trim() || !form.fecha_registro || !actual.campos.some(([campo]) => String(form.datos[campo] ?? '').trim())) {
      onNotificacion?.('Completa título, fecha y al menos un dato de la valoración.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await gimnasioServicio.crearValoracionDeportista(deportistaId, {
        seccion, titulo: form.titulo.trim(), fecha_registro: form.fecha_registro,
        fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null,
        proximo_control: form.proximo_control || null, datos: form.datos,
      });
      const res = await gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion);
      setRegistros(Array.isArray(res.datos) ? res.datos : []);
      setForm(limpio());
      setAbierto(false);
      onNotificacion?.('Valoración registrada correctamente.', 'success');
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
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '224px minmax(0,1fr)' }, gap: 1.5, alignItems: 'start' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', p: 0.75 }}>
        {secciones.map((s) => {
          const Icono = s.icono;
          const seleccionado = s.id === seccion;
          return <Box key={s.id} component="button" type="button" onClick={() => { setSeccion(s.id); setForm(limpio()); }}
            sx={{ width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left', gap: 1, p: 1.4,
              fontSize: 12, fontWeight: seleccionado ? 850 : 650, cursor: 'pointer',
              color: seleccionado ? 'primary.main' : 'text.primary',
              bgcolor: seleccionado ? uiTokens.colores.primarioSuave : 'transparent',
              border: 0, borderLeft: seleccionado ? `3px solid ${uiTokens.colores.primario}` : '3px solid transparent',
              borderRadius: 0.5, '&:hover': { bgcolor: uiTokens.colores.primarioSuave } }}>
            <Icono sx={{ fontSize: 18, flexShrink: 0 }} />{s.titulo}
          </Box>;
        })}
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, gap: 2 }}>
          <Box><Typography sx={{ fontWeight: 850, fontSize: 14 }}>{actual.titulo}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>Registro cronológico de evaluaciones</Typography></Box>
          <Button size="small" variant="outlined" startIcon={abierto ? <CloseOutlinedIcon /> : <AddOutlinedIcon />} onClick={() => { setAbierto(!abierto); setForm(limpio()); setVer(null); }} disabled={cargando || guardando || Boolean(error)}>{abierto ? 'Cancelar' : 'Añadir'}</Button>
        </Stack>
        {abierto && <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 850, mb: 2 }}>Nuevo registro de {actual.titulo.toLowerCase()}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
            <TextField size="small" label="Título del registro *" value={form.titulo} onChange={(e) => cambiar('titulo', e.target.value)} sx={{ ...dbanuStyles.field, gridColumn: '1 / -1' }} />
            <TextField size="small" type="date" label="Fecha del registro *" value={form.fecha_registro} onChange={(e) => cambiar('fecha_registro', e.target.value)} InputLabelProps={{ shrink: true }} sx={dbanuStyles.field} />
            <TextField size="small" type="date" label="Próximo control" value={form.proximo_control} onChange={(e) => cambiar('proximo_control', e.target.value)} InputLabelProps={{ shrink: true }} sx={dbanuStyles.field} />
            {(seccion === 'antecedentes' || seccion === 'objetivos') && <>
              <TextField size="small" type="date" label="Fecha de inicio" value={form.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)} InputLabelProps={{ shrink: true }} sx={dbanuStyles.field} />
              <TextField size="small" type="date" label="Fecha de finalización" value={form.fecha_fin} onChange={(e) => cambiar('fecha_fin', e.target.value)} InputLabelProps={{ shrink: true }} sx={dbanuStyles.field} />
            </>}
            {actual.campos.map(([campo, etiqueta, multilinea]) => <TextField key={campo} size="small" label={etiqueta} fullWidth
              multiline={Boolean(multilinea)} minRows={multilinea ? 2 : undefined}
              value={form.datos[campo] ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, datos: { ...p.datos, [campo]: e.target.value } }))}
              sx={{ ...dbanuStyles.field, gridColumn: multilinea ? '1 / -1' : 'auto' }} />)}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 0, justifyContent: 'flex-end' }}>
            <BotonGuardar guardando={guardando} onClick={guardar} />
          </Stack>
        </Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {cargando ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={26} /></Box> : <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Registro</TableCell><TableCell>Próximo control</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acción</TableCell></TableRow></TableHead>
            <TableBody>
              {registros.map((registro) => <TableRow key={registro.id} hover>
                <TableCell>{mostrarFecha(registro.fecha_registro)}</TableCell>
                <TableCell>{registro.titulo}</TableCell>
                <TableCell>{mostrarFecha(registro.proximo_control)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={registro.estado || 'ACTIVO'} /></TableCell>
                <TableCell align="right"><Button size="small" variant="text" onClick={() => { setVer(ver?.id === registro.id ? null : registro); setAbierto(false); }}>Ver detalle</Button></TableCell>
              </TableRow>)}
              {!registros.length && <TableRow><TableCell colSpan={5} align="center">No hay registros. Utiliza Añadir para iniciar el historial.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>}
        {ver && <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>{ver.titulo} · {mostrarFecha(ver.fecha_registro)}</Typography>
          {actual.campos.map(([campo, etiqueta]) => ver.datos?.[campo] !== undefined && ver.datos?.[campo] !== '' ? <Typography key={campo} variant="body2" sx={{ mb: 0.5 }}><strong>{etiqueta}:</strong> {ver.datos[campo]}</Typography> : null)}
          <Typography variant="caption" color="text.secondary">Registrado por usuario #{ver.registrado_por}</Typography>
        </Box>}
      </Paper>
    </Box>
  </Box>;
}
