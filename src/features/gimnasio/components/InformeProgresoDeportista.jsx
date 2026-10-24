import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { GaleriaProgresoDeportista } from './FotosEvaluacionDeportista.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';

// Exclusivamente para demostración visual. No se envía a la API ni se guarda en PostgreSQL.
const INFORME_DEMO = {
  resumen: { evaluaciones: 4, peso_inicial_kg: 82, peso_actual_kg: 80.8, variacion_peso_kg: -1.2 },
  mediciones: [
    { fecha:'2026-08-01', peso_kg:82, cintura_cm:92, grasa_corporal_pct:24.5, imc:26.78 },
    { fecha:'2026-08-15', peso_kg:81.7, cintura_cm:91, grasa_corporal_pct:24.2, imc:26.68 },
    { fecha:'2026-09-01', peso_kg:81.3, cintura_cm:90.5, grasa_corporal_pct:23.9, imc:26.55 },
    { fecha:'2026-10-01', peso_kg:80.8, cintura_cm:90, grasa_corporal_pct:23.5, imc:26.38 },
  ],
  pruebas: [
    { fecha:'2026-08-01', codigo:'FLEXIONES', nombre:'Flexiones', unidad:'repeticiones', valor:10 },
    { fecha:'2026-08-15', codigo:'FLEXIONES', nombre:'Flexiones', unidad:'repeticiones', valor:12 },
    { fecha:'2026-09-01', codigo:'FLEXIONES', nombre:'Flexiones', unidad:'repeticiones', valor:14 },
    { fecha:'2026-10-01', codigo:'FLEXIONES', nombre:'Flexiones', unidad:'repeticiones', valor:16 },
    { fecha:'2026-08-01', codigo:'PLANCHA', nombre:'Plancha abdominal', unidad:'segundos', valor:30 },
    { fecha:'2026-10-01', codigo:'PLANCHA', nombre:'Plancha abdominal', unidad:'segundos', valor:50 },
  ],
  comparativas_pruebas: [
    { codigo:'FLEXIONES', nombre:'Flexiones', unidad:'repeticiones', inicial:10, actual:16, variacion:6, mejora_verificada:true },
    { codigo:'PLANCHA', nombre:'Plancha abdominal', unidad:'segundos', inicial:30, actual:50, variacion:20, mejora_verificada:true },
  ],
};
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
  const [demostracion, setDemostracion] = useState(false);
  const [pruebaElegida, setPruebaElegida] = useState('FLEXIONES');
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
  const fuente = demostracion ? INFORME_DEMO : informe;
  const datos = useMemo(() => fuente?.mediciones || [], [fuente]);
  const pruebas = fuente?.pruebas || [];
  const comparativas = fuente?.comparativas_pruebas || [];
  const codigoActivo = comparativas.some((p) => p.codigo === pruebaElegida) ? pruebaElegida : comparativas[0]?.codigo || '';
  if (cargando && !demostracion) return <Stack direction="row" justifyContent="center" sx={{ py: 5 }}><CircularProgress size={24} /></Stack>;
  if (error && !demostracion) return <Stack spacing={2}><Alert severity="warning">{error}</Alert><Button variant="outlined" onClick={() => setDemostracion(true)}>Ver demostración con datos ficticios</Button></Stack>;
  return <Stack spacing={2}>
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography sx={{ fontWeight: 850, fontSize: 15 }}>Informe de progreso físico</Typography>
        <Button size="small" variant="outlined" onClick={() => setDemostracion((v) => !v)}>{demostracion ? 'Ver datos reales' : 'Ver ejemplo simulado'}</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">Mediciones corporales de Ficha inicial y pruebas de rendimiento registradas en Entrenamiento.</Typography>
    </Box>
    {demostracion && <Alert severity="info"><strong>DEMOSTRACIÓN:</strong> todos los valores y logros son ficticios. No se guardan registros ni se envían notificaciones.</Alert>}
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      {[
        ['Evaluaciones', String(fuente?.resumen?.evaluaciones ?? 0)],
        ['Peso inicial', formato(fuente?.resumen?.peso_inicial_kg, 'kg')],
        ['Último peso', formato(fuente?.resumen?.peso_actual_kg, 'kg')],
        ['Variación de peso', formato(fuente?.resumen?.variacion_peso_kg, 'kg')],
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
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography fontWeight={850} sx={{ mb: 1 }}>Evolución de las pruebas deportivas</Typography>
      <TextField select size="small" label="Prueba comparable" value={codigoActivo}
        onChange={(e) => setPruebaElegida(e.target.value)} sx={{ minWidth: 230, mb: 2 }}
        disabled={!comparativas.length}>
        {comparativas.map((prueba) => <MenuItem key={prueba.codigo} value={prueba.codigo}>{prueba.nombre} · {prueba.unidad}</MenuItem>)}
      </TextField>
      {comparativas.length
        ? <Tendencia datos={pruebas.filter((prueba) => prueba.codigo === codigoActivo).map((prueba) => ({ ...prueba, medicion: prueba.valor }))} campo="medicion"
            unidad={comparativas.find((prueba) => prueba.codigo === pruebaElegida)?.unidad || ''} />
        : <Typography variant="body2" color="text.secondary">Registra pruebas en Entrenamiento para visualizar una tendencia. Se necesitan al menos dos registros comparables para evaluar cambios.</Typography>}
      {comparativas.filter((prueba) => prueba.mejora_verificada).map((prueba) =>
        <Alert key={prueba.codigo} severity="success" sx={{ mt: 1 }}>
          Mejora registrada en {prueba.nombre}: {formato(prueba.inicial, prueba.unidad)} → {formato(prueba.actual, prueba.unidad)}.
          {demostracion ? ' Ejemplo de felicitación: ¡Excelente constancia, sigue así!' : ' Disponible para revisión antes de felicitar al deportista.'}
        </Alert>)}
    </Paper>
    {!demostracion && <GaleriaProgresoDeportista deportistaId={deportistaId} onNotificacion={onNotificacion} />}

    {!datos.length && <Alert severity="info">Todavía no existen evaluaciones físicas. Registra una en Ficha inicial → Evaluación física para generar las gráficas.</Alert>}
    <Typography variant="caption" color="text.secondary">El IMC es un indicador orientativo y no determina por sí solo el estado de salud o la aptitud para entrenar. Las variaciones deben interpretarse con el entrenador o profesional autorizado.</Typography>
  </Stack>;
}
