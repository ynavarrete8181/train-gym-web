import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const FORMATO = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
const etiquetas = {
  antecedentes: 'Antecedentes', evaluacion: 'Evaluaciones físicas', objetivos: 'Objetivos', valoracion: 'Valoraciones profesionales',
  peso_kg: 'Peso (kg)', grasa_corporal_pct: 'Grasa corporal (%)', imc: 'IMC',
  masa_magra_kg: 'Masa magra (kg)', indice_cintura_altura: 'Índice cintura/altura',
  estado_objetivo: 'Estado del objetivo', prioridad: 'Prioridad', objetivo_codigo: 'Categoría del objetivo',
  condicion_fisica: 'Condición física', movilidad_general: 'Movilidad', experiencia_entrenamiento: 'Experiencia',
  requiere_adaptacion: 'Adaptación', frecuencia_seguimiento: 'Seguimiento recomendado', actividad_fisica: 'Nivel de actividad',
};
const formatear = (valor) => valor === null || valor === undefined ? '—' : FORMATO.format(Number(valor));
const fecha = (f) => f ? String(f).substring(0, 10).split('-').reverse().join('/') : '—';

export function ReporteValoracionesDeportista({ deportistaId }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const cargar = useCallback(async () => {
    if (!deportistaId) return;
    setCargando(true); setError('');
    try {
      const respuesta = await gimnasioServicio.obtenerReporteValoraciones(deportistaId, {
        ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}),
      });
      setReporte(respuesta.datos || null);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo consultar el reporte de valoraciones.');
    } finally { setCargando(false); }
  }, [deportistaId, desde, hasta]);
  useEffect(() => { cargar(); }, [cargar]);
  const mediciones = reporte?.mediciones || [];
  const ultima = mediciones[mediciones.length - 1] || {};
  const primera = mediciones[0] || {};
  const secciones = reporte?.por_seccion || {};
  const controles = reporte?.controles || {};
  const criterios = reporte?.criterios || [];
  return <Paper elevation={0} sx={{ mt: 2, p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <AssessmentOutlinedIcon color="primary" />
        <Box>
          <Typography fontWeight={800} fontSize={14}>Reporte de valoración y seguimiento</Typography>
          <Typography color="text.secondary" fontSize={12}>Datos reales del historial activo, sin incluir registros anulados.</Typography>
        </Box>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
        <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={desde} onChange={(e) => setDesde(e.target.value)} />
        <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={hasta} onChange={(e) => setHasta(e.target.value)} inputProps={{ min: desde || undefined }} />
        <Button variant="outlined" size="small" onClick={cargar} disabled={cargando}>Actualizar</Button>
      </Stack>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {cargando && <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 2 }}><CircularProgress size={18} /><Typography fontSize={12}>Consultando estadísticas…</Typography></Stack>}
    {reporte && <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 1 }}>
        {Object.entries({ antecedentes: 0, evaluacion: 0, objetivos: 0, valoracion: 0 }).map(([clave]) => (
          <Box key={clave} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography fontSize={11} color="text.secondary">{etiquetas[clave]}</Typography>
            <Typography fontSize={21} fontWeight={800}>{Number(secciones[clave] || 0)}</Typography>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography fontSize={13} fontWeight={800} sx={{ mb: 1 }}>Evolución de composición corporal</Typography>
      {mediciones.length ? <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, '& th, & td': { p: 1, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider' } }}>
          <thead><tr><th>Fecha</th><th>Peso (kg)</th><th>IMC</th><th>Grasa (%)</th><th>Masa magra (kg)</th><th>Cintura/altura</th></tr></thead>
          <tbody>{mediciones.map((m) => <tr key={m.id}><td>{fecha(m.fecha_registro)}</td><td>{formatear(m.peso_kg)}</td><td>{formatear(m.imc)}</td><td>{formatear(m.grasa_corporal_pct)}</td><td>{formatear(m.masa_magra_kg)}</td><td>{formatear(m.indice_cintura_altura)}</td></tr>)}</tbody>
        </Box>
      </Box> : <Typography color="text.secondary" fontSize={12}>Todavía no hay mediciones físicas para el período seleccionado.</Typography>}
      {mediciones.length > 1 && primera.peso_kg !== null && ultima.peso_kg !== null &&
        <Typography color="text.secondary" fontSize={12} sx={{ mt: 1 }}>Variación de peso: {formatear(Number(ultima.peso_kg) - Number(primera.peso_kg))} kg respecto a la primera medición del período.</Typography>}
      <Divider sx={{ my: 2 }} />
      <Typography fontSize={13} fontWeight={800} sx={{ mb: 1 }}>Clasificaciones registradas</Typography>
      {criterios.length ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {criterios.map((item) => <Box key={`${item.campo}-${item.valor}`} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, minWidth: 140 }}>
          <Typography color="text.secondary" fontSize={11}>{etiquetas[item.campo] || item.campo}</Typography>
          <Typography fontSize={12} fontWeight={700}>{String(item.valor).replaceAll('_', ' ')} · {item.total}</Typography>
        </Box>)}
      </Box> : <Typography color="text.secondary" fontSize={12}>No hay criterios registrados para este período.</Typography>}
      <Typography fontSize={12} color="text.secondary" sx={{ mt: 2 }}>Controles: {Number(controles.PROGRAMADO || 0)} pendientes · {Number(controles.REALIZADO || 0)} realizados · {Number(controles.CANCELADO || 0)} cancelados.</Typography>
    </>}
  </Paper>;
}
