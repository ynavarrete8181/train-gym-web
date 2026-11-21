import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, TextField, Typography } from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const fecha = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '—');
const diaAnterior = (iso) => {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
};
const importe = (v) => (v == null ? '—' : new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(v)));
const mensajeError = (e) => {
  const errores = e?.response?.data?.errors;
  return (errores ? Object.values(errores).flat()[0] : null) || e?.response?.data?.mensaje || 'No se pudo anular la renovación.';
};

/**
 * Detalle de una renovación en un modal. Mientras el período está programado y sin venta,
 * se puede anular: se retira el período y la anulación queda en el historial con su motivo.
 */
export function DialogDetalleRenovacion({ renovacion, anulacion, puedeAnular, membresia, onCerrar, onAnulada }) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [apagar, setApagar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const d = renovacion?.detalle || {};

  useEffect(() => {
    setAnulando(false); setApagar(true); setError('');
    setMotivo(renovacion ? `Anulación de la renovación del período ${d.numero_periodo_nuevo ?? ''} (${fecha(d.fecha_inicio)} al ${fecha(d.fecha_fin)}) de ${membresia?.codigo_contrato || membresia?.codigo || 'la membresía'}: ` : '');
  }, [renovacion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!renovacion) return null;

  const anular = async () => {
    setGuardando(true); setError('');
    try {
      await gimnasioServicio.anularRenovacion(membresia.id, d.periodo_id, { motivo: motivo.trim(), apagar_renovacion: apagar });
      await onAnulada?.();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const datos = [
    ['Fecha del movimiento', fecha(renovacion.fecha)],
    ['Responsable', renovacion.autor_nombre || 'Sistema (automático)'],
    ['Período agregado', d.numero_periodo_nuevo ?? '—'],
    ['Vigencia', `${fecha(d.fecha_inicio)} al ${fecha(d.fecha_fin)}`],
    ['Importe registrado', importe(d.precio)],
    ...(d.origen_precio ? [['Precio tomado de', d.origen_precio.charAt(0).toUpperCase() + d.origen_precio.slice(1)]] : []),
    ['Tipo', renovacion.tipo === 'RENOVACION_AUTOMATICA' ? 'Automática' : 'Manual'],
  ];

  return <Dialog open onClose={guardando ? undefined : onCerrar} fullWidth maxWidth="sm"
    slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}>
    <DialogTitle sx={{ ...formStyles.modalHeader, py: 1.25 }}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave, color: uiTokens.colores.textoFuerte,
        boxShadow: 'none', border: `1px solid ${uiTokens.colores.acentoBorde}` }}>
        <AutorenewOutlinedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>Detalle de renovación</Typography>
        <Typography variant="caption" color="text.secondary">{membresia?.codigo_contrato || membresia?.codigo || ''}</Typography>
      </Box>
      {anulacion ? <Chip size="small" label="Anulada" color="default" variant="outlined" /> : null}
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {datos.map(([titulo, valor]) => <Box key={titulo}>
          <Typography variant="caption" color="text.secondary">{titulo}</Typography>
          <Typography variant="body2" fontWeight={800}>{valor}</Typography>
        </Box>)}
      </Box>
      {renovacion.motivo && <Typography variant="body2" sx={{ mt: 2 }}>{renovacion.motivo}</Typography>}
      {anulacion && <Alert severity="info" sx={{ mt: 2 }}>
        Anulada el {fecha(anulacion.fecha)} por {anulacion.autor_nombre || 'Sistema'}: {anulacion.motivo}
      </Alert>}
      {!anulacion && anulando && <Box sx={{ mt: 2 }}>
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Se retira el período programado y la membresía vuelve a vencer el {fecha(diaAnterior(d.fecha_inicio))}. La anulación queda en el historial con el motivo.
        </Alert>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" value={motivo}
          onChange={(e) => setMotivo(e.target.value)} helperText="Completa por qué se anula (al menos 8 caracteres)." />
        <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={apagar} onChange={(e) => setApagar(e.target.checked)} />}
          label="Apagar también la renovación automática (si no, el sistema la vuelve a programar 7 días antes del fin)" />
      </Box>}
    </DialogContent>
    <Divider />
    <DialogActions sx={{ ...dbanuStyles.dialogActions, flexWrap: 'wrap', gap: 1.5 }}>
      <BotonCancelar texto={anulando ? 'Cancelar' : 'Cerrar'} disabled={guardando} onClick={anulando ? () => setAnulando(false) : onCerrar} />
      {!anulacion && puedeAnular && !anulando && <Button variant="outlined" startIcon={<BlockOutlinedIcon />}
        onClick={() => setAnulando(true)} sx={dbanuStyles.cancelButton}>Anular renovación</Button>}
      {!anulacion && anulando && <Button variant="outlined" startIcon={<BlockOutlinedIcon />} color="success"
        disabled={guardando || motivo.trim().length < 8} onClick={anular} sx={dbanuStyles.saveButton}>
        {guardando ? 'Anulando…' : 'Sí, anular'}
      </Button>}
    </DialogActions>
  </Dialog>;
}
