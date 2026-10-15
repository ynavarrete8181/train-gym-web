import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const indicadores = [
  { clave: 'peso_kg', titulo: 'Peso', unidad: 'kg' },
  { clave: 'cintura_cm', titulo: 'Cintura', unidad: 'cm' },
  { clave: 'grasa_corporal_pct', titulo: 'Grasa corporal', unidad: '%' },
  { clave: 'imc', titulo: 'IMC orientativo', unidad: '' },
];
const formato = (valor, unidad = '') => valor === null || valor === undefined
  ? '—' : `${Number(valor).toLocaleString('es-EC', { maximumFractionDigits: 2 })}${unidad ? ` ${unidad}` : ''}`;
const fecha = (v) => v ? String(v).slice(0,10).split('-').reverse().join('/') : '—';

function Tendencia({ datos, campo, unidad }) {
  const puntos = datos.filter((r) => Number.isFinite(r[campo]));
  if (!puntos.length) return <Typography variant="body2" color="text.secondary">Todavía no hay mediciones para este indicador.</Typography>;
  const valores = puntos.map((p) => p[campo]);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const margen = Math.max((maximo - minimo) * 0.2, 1);
  const inferior = minimo - margen;
  const superior = maximo + margen;
  const coord = puntos.map((p, i) => ({
    x: puntos.length === 1 ? 50 : 8 + (84 * i / (puntos.length - 1)),
    y: 90 - ((p[campo] - inferior) / (superior - inferior)) * 80,
    fecha: p.fecha,
    valor: p[campo],
  }));
  return <Box>
    <Box component="svg" viewBox="0 0 100 100" role="img" aria-label={`Evolución de ${campo}`} sx={{ width: '100%', height: 210, overflow: 'visible' }}>
      {[10,30,50,70,90].map((y) => <line key={y} x1="7" y1={y} x2="94" y2={y} stroke={uiTokens.colores.borde} strokeWidth=".3" />)}
      <polyline fill="none" stroke={uiTokens.colores.primario} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" points={coord.map((p) => `${p.x},${p.y}`).join(' ')} />
      {coord.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.7" fill={uiTokens.colores.primario}><title>{fecha(p.fecha)}: {formato(p.valor, unidad)}</title></circle>)}
    </Box>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">{fecha(puntos[0].fecha)}</Typography>
      <Typography variant="caption" color="text.secondary">{fecha(puntos[puntos.length - 1].fecha)}</Typography>
    </Stack>
    <Typography variant="body2" sx={{ fontWeight: 800, mt: 1 }}>Inicial: {formato(valores[0], unidad)} · Último: {formato(valores[valores.length - 1], unidad)}</Typography>
  </Box>;
}

export function InformeProgresoDeportista({ deportistaId, onNotificacion }) {
  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!deportistaId) return;
    let activo = true;
    setCargando(true);
    gimnasioServicio.obtenerInformeProgreso(deportistaId)
      .then((res) => { if (activo) { setInforme(res.datos); setError(''); } })
      .catch((e) => { if (activo) { const mensaje = e.response?.data?.mensaje || 'No se pudo cargar el informe de progreso.'; setError(mensaje); onNotificacion?.(mensaje, 'error'); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [deportistaId]);
  const datos = useMemo(() => informe?.mediciones || [], [informe]);
  if (cargando) return <Stack direction="row" justifyContent="center" sx={{ py: 5 }}><CircularProgress size={24} /></Stack>;
  if (error) return <Alert severity="error">{error}</Alert>;
  return <Stack spacing={2}>
    <Box>
      <Typography sx={{ fontWeight: 850, fontSize: 15 }}>Informe de progreso físico</Typography>
      <Typography variant="body2" color="text.secondary">Datos provenientes de las evaluaciones físicas registradas en Ficha inicial.</Typography>
    </Box>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      {[
        ['Evaluaciones', String(informe?.resumen?.evaluaciones ?? 0)],
        ['Peso inicial', formato(informe?.resumen?.peso_inicial_kg, 'kg')],
        ['Último peso', formato(informe?.resumen?.peso_actual_kg, 'kg')],
        ['Variación de peso', formato(informe?.resumen?.variacion_peso_kg, 'kg')],
      ].map(([titulo, valor]) => <Paper key={titulo} elevation={0} sx={{ p: 2, flex: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">{titulo}</Typography>
        <Typography sx={{ fontWeight: 850, fontSize: 19 }}>{valor}</Typography>
      </Paper>)}
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {indicadores.map((metrica) => <Paper key={metrica.clave} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 1 }}>{metrica.titulo}</Typography>
        <Tendencia datos={datos} campo={metrica.clave} unidad={metrica.unidad} />
      </Paper>)}
    </Box>
    {!datos.length && <Alert severity="info">Todavía no existen evaluaciones físicas. Registra una en Ficha inicial → Evaluación física para generar las gráficas.</Alert>}
    <Typography variant="caption" color="text.secondary">El IMC es un indicador orientativo y no determina por sí solo el estado de salud o la aptitud para entrenar. Las variaciones deben interpretarse con el entrenador o profesional autorizado.</Typography>
  </Stack>;
}
