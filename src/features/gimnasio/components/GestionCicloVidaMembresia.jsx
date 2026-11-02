import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fechaLocal = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};
const fechaLegible = (v) => {
  const a = String(v || '').slice(0, 10).split('-');
  return a.length === 3 ? [a[2], a[1], a[0]].join('/') : '—';
};
const mensajeError = (e) => {
  const errores = e?.response?.data?.errors || e?.response?.data?.errores;
  const primero = errores && Object.values(errores).flat().find(Boolean);
  return primero || e?.response?.data?.mensaje || 'No fue posible completar la operación.';
};

/**
 * Fase 2: congelación de TIEMPO exclusivamente para contratos compatibles.
 * Fase 3 habilitará reprogramaciones de cuotas y facturación.
 */
export function GestionCicloVidaMembresia({ membresia, onVolver, onActualizado }) {
  const [ciclo, setCiclo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [operacion, setOperacion] = useState('');
  const [tipo, setTipo] = useState('TIEMPO');
  const [inicio, setInicio] = useState(fechaLocal());
  const [fin, setFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [preview, setPreview] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = useCallback(async () => {
    if (!membresia?.id) return;
    setCargando(true);
    try {
      setCiclo(await gimnasioServicio.obtenerCicloVidaMembresia(membresia.id));
      setError('');
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [membresia?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const simular = async () => {
    setProcesando(true); setError(''); setExito(''); setPreview(null);
    try {
      const resultado = await gimnasioServicio.previsualizarCongelacion(membresia.id, {
        tipo, fecha_inicio: inicio, fecha_fin: fin,
      });
      setPreview(resultado);
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const confirmar = async () => {
    if (!preview || motivo.trim().length < 8) {
      setError('Indica un motivo de al menos 8 caracteres y previsualiza el cambio.');
      return;
    }
    setProcesando(true); setError('');
    try {
      await gimnasioServicio.congelarMembresia(membresia.id, {
        tipo, fecha_inicio: inicio, fecha_fin: fin, motivo: motivo.trim(),
      });
      setExito('Congelación registrada correctamente. Consulta el historial del contrato.');
      setOperacion(''); setPreview(null); setMotivo('');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const reactivar = async () => {
    if (motivo.trim().length < 8) {
      setError('Registra el motivo de la reactivación (mínimo 8 caracteres).');
      return;
    }
    setProcesando(true); setError(''); setExito('');
    try {
      await gimnasioServicio.reactivarMembresia(membresia.id, motivo.trim());
      setExito('Reactivación registrada. La vigencia quedó actualizada en el contrato.');
      setOperacion(''); setPreview(null); setMotivo('');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const estado = String(ciclo?.estado || membresia?.estado || '').toUpperCase();
  const puedeCongelar = ciclo?.puede_congelar_tiempo === true;
  const puedeReactivar = estado === 'CONGELADA' &&
    (ciclo?.suspensiones || []).some(s => s.estado === 'VIGENTE');

  return <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2, width: '100%' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800}>Gestión del ciclo de vida</Typography>
        <Typography variant="caption" color="text.secondary">
          Congelaciones y reactivaciones documentadas · {membresia?.codigo_contrato || 'Contrato'}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto', flexShrink: 0 }}><BotonVolver onClick={onVolver}/></Box>
    </Stack>
    {cargando && <CircularProgress size={23}/>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
    {ciclo && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Estado del contrato</Typography>
          <Typography variant="body2" fontWeight={800}>{estado}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Vigencia registrada hasta</Typography>
          <Typography variant="body2" fontWeight={800}>{fechaLegible(ciclo.fecha_fin)}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Movimientos registrados</Typography>
          <Typography variant="body2" fontWeight={800}>{ciclo.movimientos?.length || 0}</Typography>
        </Box>
      </Stack>
      {estado === 'ACTIVA' && !puedeCongelar && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este contrato no permite congelación de tiempo en Fase 2. Si tiene varios períodos, cuotas por emitir o cobros
          recurrentes, primero debemos implementar la reprogramación financiera de Fase 3.
        </Alert>
      )}
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Button variant="contained" disabled={!puedeCongelar || procesando}
          sx={{ textTransform: 'none', bgcolor: uiTokens.colores.acento, color: uiTokens.colores.textoFuerte,
            '&:hover': { bgcolor: uiTokens.colores.acentoOscuro } }}
          onClick={() => { setOperacion('congelar'); setPreview(null); setError(''); }}>
          Congelar por tiempo
        </Button>
        <Button variant="outlined" disabled={!puedeReactivar || procesando} sx={{ textTransform: 'none' }}
          onClick={() => { setOperacion('reactivar'); setPreview(null); setError(''); }}>
          Reactivar
        </Button>
        <Button variant="outlined" disabled sx={{ textTransform: 'none' }}>Congelar facturación · Fase 3</Button>
      </Stack>
      {operacion === 'congelar' && <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Registrar congelación por tiempo</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Desde" type="date" required value={inicio}
            onChange={e => { setInicio(e.target.value); setPreview(null); }}
            slotProps={{ inputLabel: { shrink: true } }}/>
          <TextField size="small" label="Hasta (incluido)" type="date" required value={fin}
            onChange={e => { setFin(e.target.value); setPreview(null); }}
            slotProps={{ inputLabel: { shrink: true } }}/>
        </Stack>
        <TextField multiline minRows={2} size="small" fullWidth label="Motivo de congelación" required
          sx={{ mt: 2 }} value={motivo}
          onChange={e => { setMotivo(e.target.value); setPreview(null); }}/>
        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
          <Button onClick={() => { setOperacion(''); setPreview(null); }}>Cancelar</Button>
          <Button variant="outlined" disabled={!fin || procesando} onClick={simular}>Previsualizar impacto</Button>
        </Stack>
        {preview && <Box sx={{ mt: 2, p: 1.5, bgcolor: uiTokens.colores.acentoSuave,
          border: `1px solid ${uiTokens.colores.acentoBorde}`, borderRadius: 1.5 }}>
          <Typography variant="body2" fontWeight={800}>Resultado calculado por Laravel</Typography>
          <Typography variant="body2">Días reconocidos: {preview.dias_previstos}</Typography>
          <Typography variant="body2">Fin actual: {fechaLegible(preview.fecha_fin_original)}</Typography>
          <Typography variant="body2">Fin propuesto: {fechaLegible(preview.fecha_fin_ajustada)}</Typography>
          <Typography variant="caption">No genera ventas ni modifica pagos. El ajuste efectivo se confirma al reactivar.</Typography>
          <Stack alignItems="flex-end" sx={{ mt: 1.5 }}>
            <Button variant="contained" color="warning" disabled={procesando || motivo.trim().length < 8}
              onClick={confirmar}>Confirmar congelación</Button>
          </Stack>
        </Box>}
      </Box>}
      {operacion === 'reactivar' && <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={800}>Reactivar contrato congelado</Typography>
        <Typography variant="caption" color="text.secondary">
          Laravel calculará el período realmente congelado y ajustará la vigencia. Si se excedió la fecha prevista
          requerirá revisión administrativa.
        </Typography>
        <TextField sx={{ mt: 2 }} size="small" multiline minRows={2} fullWidth required
          label="Motivo de reactivación" value={motivo} onChange={e => setMotivo(e.target.value)}/>
        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
          <Button onClick={() => setOperacion('')}>Cancelar</Button>
          <Button color="warning" variant="contained" disabled={procesando || motivo.trim().length < 8}
            onClick={reactivar}>Confirmar reactivación</Button>
        </Stack>
      </Box>}
      <Divider sx={{ my: 2 }}/>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Historial de movimientos</Typography>
      {(ciclo.movimientos || []).length === 0
        ? <Typography variant="body2" color="text.secondary">Todavía no existen movimientos registrados.</Typography>
        : <Stack spacing={1}>{ciclo.movimientos.map(m => <Box key={m.id}
          sx={{ border: 1, borderColor: 'divider', p: 1.25, borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={700}>{m.tipo} · {fechaLegible(m.fecha_efectiva)}</Typography>
          <Typography variant="caption" color="text.secondary">{m.motivo}</Typography>
        </Box>)}</Stack>}
    </>}
  </Box>;
}
