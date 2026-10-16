import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { entrenamientoServicio } from '../services/entrenamientoServicio.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';

const nuevo = () => ({ codigo_prueba: '', fecha_prueba: new Date().toLocaleDateString('en-CA'), resultado: '', protocolo: '', observaciones: '' });
const fecha = (valor) => valor ? String(valor).substring(0, 10).split('-').reverse().join('/') : '—';

export function PruebasRendimientoDeportista({ deportistaId, onNotificacion }) {
  const [form, setForm] = useState(nuevo);
  const [editando, setEditando] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const cargar = useCallback(async () => {
    if (!deportistaId) return;
    setCargando(true); setError('');
    try {
      const r = await entrenamientoServicio.obtenerPruebasRendimiento(deportistaId);
      setCatalogo(r.datos?.catalogo || {});
      setRegistros(r.datos?.registros || []);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudieron consultar las pruebas de rendimiento.');
    } finally { setCargando(false); }
  }, [deportistaId]);
  useEffect(() => { cargar(); }, [cargar]);
  const guardar = async () => {
    if (!form.codigo_prueba || !form.resultado || !form.protocolo.trim()) {
      onNotificacion?.('Selecciona la prueba e ingresa resultado y protocolo.', 'warning'); return;
    }
    setGuardando(true);
    try {
      const payload = { ...form, resultado: Number(form.resultado) };
      if (editando) await entrenamientoServicio.actualizarPruebaRendimiento(deportistaId, editando, payload);
      else await entrenamientoServicio.registrarPruebaRendimiento(deportistaId, payload);
      setForm(nuevo()); setEditando(null); await cargar();
      onNotificacion?.(editando ? 'Prueba actualizada.' : 'Prueba registrada.', 'success');
    } catch (e) {
      const errores = e.response?.data?.errors;
      onNotificacion?.(errores ? Object.values(errores).flat()[0] : e.response?.data?.mensaje || 'No se pudo guardar la prueba.', 'error');
    } finally { setGuardando(false); }
  };
  const anular = async (registro) => {
    const confirmado = await confirmarAccion({ titulo: '¿Anular prueba?', texto: 'El registro se conservará para trazabilidad.', textoConfirmar: 'Anular' });
    if (!confirmado) return;
    setGuardando(true);
    try {
      await entrenamientoServicio.anularPruebaRendimiento(deportistaId, registro.id);
      await cargar(); onNotificacion?.('Prueba anulada.', 'success');
    } catch (e) {
      onNotificacion?.(e.response?.data?.mensaje || 'No se pudo anular la prueba.', 'error');
    } finally { setGuardando(false); }
  };
  const seleccionada = catalogo[form.codigo_prueba];
  return <Paper elevation={0} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
    <Typography fontWeight={800} fontSize={14}>{editando ? "Editar prueba de rendimiento" : "Pruebas de rendimiento físico"}</Typography>
    <Typography fontSize={12} color="text.secondary" sx={{ mb: 2 }}>Fuerza-resistencia, capacidad aeróbica, potencia, velocidad y flexibilidad. Las pruebas RM se registran en su apartado actual.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, gap: 1.5 }}>
      <TextField select size="small" fullWidth label="Prueba física" value={form.codigo_prueba} onChange={(e) => setForm((v) => ({ ...v, codigo_prueba: e.target.value }))}>
        {Object.entries(catalogo).map(([codigo, item]) => <MenuItem key={codigo} value={codigo}>{item.nombre}</MenuItem>)}
      </TextField>
      <TextField size="small" label={`Resultado ${seleccionada ? '(' + seleccionada.unidad.toLowerCase() + ')' : ''}`} type="number" fullWidth value={form.resultado}
        onChange={(e) => setForm((v) => ({ ...v, resultado: e.target.value }))} inputProps={{ min: 0, step: seleccionada?.unidad === 'REPETICIONES' ? 1 : 0.01 }} />
      <TextField size="small" type="date" label="Fecha de prueba" fullWidth value={form.fecha_prueba}
        onChange={(e) => setForm((v) => ({ ...v, fecha_prueba: e.target.value }))} InputLabelProps={{ shrink: true }} />
      <TextField size="small" label="Protocolo de evaluación" required fullWidth value={form.protocolo}
        onChange={(e) => setForm((v) => ({ ...v, protocolo: e.target.value }))} sx={{ gridColumn: { md: 'span 3' } }}
        helperText="Describe condiciones, técnica y procedimiento para comparar resultados posteriores." />
      <TextField size="small" label="Observaciones (opcional)" fullWidth value={form.observaciones}
        onChange={(e) => setForm((v) => ({ ...v, observaciones: e.target.value }))} sx={{ gridColumn: { md: 'span 3' } }} />
    </Box>
    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
      {editando && <Button size="small" onClick={() => { setEditando(null); setForm(nuevo()); }} disabled={guardando}>Cancelar edición</Button>}
      <Button variant="contained" size="small" disabled={guardando || cargando} onClick={guardar}>{editando ? 'Guardar cambios' : 'Guardar prueba'}</Button>
    </Stack>
    <Typography fontSize={13} fontWeight={800} sx={{ mt: 2, mb: 1 }}>Historial de pruebas</Typography>
    {cargando && <CircularProgress size={18} />}
    {!cargando && registros.length === 0 && <Typography fontSize={12} color="text.secondary">No se han registrado pruebas.</Typography>}
    <Stack spacing={1}>
      {registros.map((registro) => <Stack key={registro.id} direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between"
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
        <Box>
          <Typography fontWeight={700} fontSize={12}>{catalogo[registro.codigo_prueba]?.nombre || registro.codigo_prueba} · {registro.resultado} {registro.unidad.toLowerCase()}</Typography>
          <Typography fontSize={12} color="text.secondary">{fecha(registro.fecha_prueba)} · {registro.protocolo}</Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" size="small" disabled={guardando} onClick={() => {
            setEditando(registro.id);
            setForm({ codigo_prueba: registro.codigo_prueba, fecha_prueba: String(registro.fecha_prueba).slice(0,10),
              resultado: String(registro.resultado), protocolo: registro.protocolo || '', observaciones: registro.observaciones || '' });
          }}>Editar</Button>
          <Button color="error" variant="outlined" size="small" disabled={guardando} onClick={() => anular(registro)}>Anular</Button>
        </Stack>
      </Stack>)}
    </Stack>
  </Paper>;
}
