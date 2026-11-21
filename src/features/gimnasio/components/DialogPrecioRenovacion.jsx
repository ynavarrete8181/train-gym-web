import { useEffect, useState } from 'react';
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, TextField, Typography } from '@mui/material';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const dinero = (v) => `$${Number(v || 0).toFixed(2)}`;

/** Texto del precio con el que nace el próximo período. */
export const textoPrecioRenovacion = (ciclo, modo = ciclo?.precio_renovacion_modo || 'CONTRATO', precio = ciclo?.precio_renovacion) => (
  modo === 'TARIFA' ? `tarifa vigente de la sede (hoy ${dinero(ciclo?.tarifa_vigente)})`
    : modo === 'FIJO' ? `precio programado ${dinero(precio)}`
      : `precio del contrato (${dinero(ciclo?.precio_contrato)})`);

/** Importe con el que nace el próximo período, según el modo configurado. */
export const montoPrecioRenovacion = (ciclo) => {
  const modo = ciclo?.precio_renovacion_modo || 'CONTRATO';
  return Number(modo === 'TARIFA' ? ciclo?.tarifa_vigente : modo === 'FIJO' ? ciclo?.precio_renovacion : ciclo?.precio_contrato) || 0;
};

const mensajeError = (e) => {
  const errores = e?.response?.data?.errors;
  return (errores ? Object.values(errores).flat()[0] : null) || e?.response?.data?.mensaje || 'No se pudo guardar.';
};

/** Define con qué precio nace el próximo período al renovar; queda en el historial. */
export function DialogPrecioRenovacion({ abierto, membresia, ciclo, onCerrar, onGuardado }) {
  const [modo, setModo] = useState('CONTRATO');
  const [precio, setPrecio] = useState('');
  const [motivoTexto, setMotivoTexto] = useState('');
  const [motivoAuto, setMotivoAuto] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!abierto) return;
    setModo(ciclo?.precio_renovacion_modo || 'CONTRATO');
    setPrecio(String(ciclo?.precio_renovacion ?? ciclo?.tarifa_vigente ?? ''));
    setMotivoTexto(''); setMotivoAuto(true); setError('');
  }, [abierto]);

  const motivo = motivoAuto
    ? `La próxima renovación se hará con el ${textoPrecioRenovacion(ciclo, modo, precio)}. El período actual mantiene ${dinero(ciclo?.precio_contrato)}.`
    : motivoTexto;

  const guardar = async () => {
    setGuardando(true); setError('');
    try {
      await gimnasioServicio.configurarPrecioRenovacion(membresia.id, {
        modo, precio: modo === 'FIJO' ? Number(precio) : null, motivo: motivo.trim(),
      });
      await onGuardado?.(`La próxima renovación usará el ${textoPrecioRenovacion(ciclo, modo, precio)}.`);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;
  return <Dialog open onClose={guardando ? undefined : onCerrar} fullWidth maxWidth="sm"
    slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}>
    <DialogTitle sx={{ ...formStyles.modalHeader, py: 1.25 }}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave, color: uiTokens.colores.textoFuerte,
        boxShadow: 'none', border: `1px solid ${uiTokens.colores.acentoBorde}` }}>
        <PriceChangeOutlinedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>Precio de renovación</Typography>
        <Typography variant="caption" color="text.secondary">{membresia?.codigo_contrato || membresia?.codigo || ''}</Typography>
      </Box>
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ p: 2.5 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Define con qué precio nace el próximo período al renovar (automática o manual). El período actual y lo cobrado no cambian; queda en el historial.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
        <TextField select size="small" fullWidth required label="Al renovar usar" value={modo} onChange={(e) => setModo(e.target.value)}>
          <MenuItem value="CONTRATO">Precio del contrato ({dinero(ciclo?.precio_contrato)})</MenuItem>
          <MenuItem value="TARIFA">Tarifa vigente de la sede (hoy {dinero(ciclo?.tarifa_vigente)})</MenuItem>
          <MenuItem value="FIJO">Precio específico</MenuItem>
        </TextField>
        {modo === 'FIJO' && <TextField size="small" fullWidth required type="number" label="Precio para la renovación" value={precio}
          onChange={(e) => setPrecio(e.target.value)} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />}
      </Box>
      <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" sx={{ mt: 2 }}
        value={motivo} onChange={(e) => { setMotivoTexto(e.target.value); setMotivoAuto(false); }}
        helperText="Se llena solo con los valores; puedes ajustarlo." />
    </DialogContent>
    <Divider />
    <DialogActions sx={dbanuStyles.dialogActions}>
      <BotonCancelar onClick={onCerrar} disabled={guardando} />
      <BotonGuardar texto="Guardar" guardando={guardando}
        disabled={(modo === 'FIJO' && !(Number(precio) > 0)) || motivo.trim().length < 8} onClick={guardar} />
    </DialogActions>
  </Dialog>;
}
