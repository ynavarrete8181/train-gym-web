import { useEffect, useState } from 'react';
import { Alert, Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const mensajeError = (e) => {
  const errores = e?.response?.data?.errors;
  return (errores ? Object.values(errores).flat()[0] : null) || e?.response?.data?.mensaje || 'No se pudo guardar.';
};

/** Días de gracia y renovación automática de una membresía regular, con motivo e historial. */
export function ConfiguracionContrato({ membresia, onActualizado }) {
  const inicial = { dias_gracia: Number(membresia.dias_gracia || 0), renovacion_automatica: Boolean(membresia.renovacion_automatica) };
  const [form, setForm] = useState(inicial);
  const [motivoTexto, setMotivo] = useState('');
  const [motivoAuto, setMotivoAuto] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => { setForm(inicial); setMotivo(''); setMotivoAuto(true); }, [membresia?.id, membresia?.dias_gracia, membresia?.renovacion_automatica]);

  const cambiado = Number(form.dias_gracia) !== inicial.dias_gracia || form.renovacion_automatica !== inicial.renovacion_automatica;
  const permiteRenovacion = membresia.cantidad_periodos_contratados != null;
  // Motivo sugerido con lo que cambia; el usuario puede editarlo o completarlo.
  const siNo = (v) => (v ? 'activada' : 'desactivada');
  const cambios = [
    Number(form.dias_gracia) !== inicial.dias_gracia && `días de gracia ${inicial.dias_gracia} → ${Number(form.dias_gracia || 0)}`,
    form.renovacion_automatica !== inicial.renovacion_automatica && `renovación automática ${siNo(inicial.renovacion_automatica)} → ${siNo(form.renovacion_automatica)}`,
  ].filter(Boolean);
  const motivo = motivoAuto
    ? (cambios.length ? `Configuración del contrato ${membresia?.codigo || ''}: ${cambios.join('; ')}.` : '')
    : motivoTexto;

  const guardar = async () => {
    setGuardando(true); setError('');
    try {
      await gimnasioServicio.actualizarConfiguracionMembresia(membresia.id, { ...form, dias_gracia: Number(form.dias_gracia), motivo: motivo.trim() });
      setExito('Configuración guardada. El cambio quedó en el historial.');
      setMotivo(''); setMotivoAuto(true);
      await onActualizado?.();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Configuración administrativa</Typography>
    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
    {exito && <Alert severity="success" sx={{ mb: 1.5 }}>{exito}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
      <TextField size="small" type="number" label="Días de gracia" value={form.dias_gracia}
        helperText="Días de acceso después del fin del contrato."
        onChange={(e) => { setExito(''); setForm((a) => ({ ...a, dias_gracia: e.target.value })); }}
        slotProps={{ htmlInput: { min: 0, max: 365 } }} />
      {permiteRenovacion && <Box>
        <FormControlLabel label="Renovación automática" control={<Switch checked={form.renovacion_automatica}
          onChange={(e) => { setExito(''); setForm((a) => ({ ...a, renovacion_automatica: e.target.checked })); }} />} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          7 días antes del fin, si las cuotas están pagadas, se programa un período más. Se cobra en Ventas; sin pago no hay acceso.
        </Typography>
      </Box>}
    </Box>
    {cambiado && <>
      <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" sx={{ mt: 1.5 }}
        helperText="Escribe al menos 8 caracteres." value={motivo} onChange={(e) => { setMotivo(e.target.value); setMotivoAuto(false); }} />
      <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 1.5 }}>
        <BotonCancelar disabled={guardando} onClick={() => { setForm(inicial); setMotivo(''); setError(''); }} />
        <BotonGuardar texto="Guardar configuración" guardando={guardando} disabled={motivo.trim().length < 8} onClick={guardar} />
      </Box>
    </>}
  </Box>;
}
