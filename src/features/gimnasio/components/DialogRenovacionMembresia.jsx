import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, Typography } from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { BotonVistaPrevia } from '../../../components/common/BotonVistaPrevia.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const fecha = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : '—';
const mensajeError = e => Object.values(e?.response?.data?.errors || e?.response?.data?.errores || {})
  .flat().find(Boolean) || e?.response?.data?.mensaje || e?.message || 'No se pudo procesar la renovación.';

function Dato({ label, value, destacado }) {
  return <Box sx={{ border: `1px solid ${destacado ? uiTokens.colores.acentoBorde : uiTokens.colores.borde}`,
    bgcolor: destacado ? uiTokens.colores.acentoSuave : 'background.paper',
    borderRadius: 1.5, p: 1.5 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography fontWeight={850} variant="subtitle1">{value}</Typography>
  </Box>;
}

/** Renueva el MISMO contrato: una cuota programada, sin emisión anticipada. */
export function DialogRenovacionMembresia({ abierto, membresia, onCerrar, onActualizado }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const id = membresia?.id;

  useEffect(() => {
    setPreview(null); setError(''); setGuardado(false);
  }, [id, abierto]);

  const previsualizar = async () => {
    if (!id) return;
    setProcesando(true); setError('');
    try { setPreview(await gimnasioServicio.previsualizarRenovacionProgramada(id)); }
    catch (e) { setPreview(null); setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };
  const guardar = async () => {
    if (!preview?.confirmable || procesando || !id) return;
    setProcesando(true); setError('');
    try {
      const resultado = await gimnasioServicio.registrarRenovacionProgramada(id);
      setPreview(resultado); setGuardado(true);
      try { await onActualizado?.(); }
      catch { setError('Renovación guardada. Actualiza el listado para ver los nuevos períodos.'); }
    } catch (e) {
      setError(mensajeError(e));
    } finally { setProcesando(false); }
  };

  return <Dialog open={Boolean(abierto)} onClose={procesando ? undefined : onCerrar}
    fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
    <DialogTitle sx={formStyles.modalHeader}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave,
        border: `1px solid ${uiTokens.colores.acentoBorde}`, color: uiTokens.colores.textoFuerte }}>
        <AutorenewOutlinedIcon/>
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={850} variant="h6" fontSize={18}>
          {guardado ? 'Renovación registrada' : 'Renovar membresía'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {membresia?.codigo_contrato || 'Contrato'} · Se conserva el mismo número de membresía
        </Typography>
      </Box>
      {guardado && <Chip size="small" label="Guardada" color="success" variant="outlined"/>}
    </DialogTitle>
    <Divider/>
    <DialogContent sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Se añadirá un período al contrato actual. Las cuotas pagadas y las ventas emitidas permanecen intactas.
      </Typography>
      {error && <Alert severity={guardado ? 'info' : 'warning'} sx={{ mb: 1.5 }}>{error}</Alert>}
      {preview ? <>
        <Box sx={{ display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))' }, gap: 1.25 }}>
          <Dato label="Período nuevo" value={`N.º ${preview.numero_periodo_nuevo}`} destacado/>
          <Dato label="Importe pactado" value={`$${Number(preview.precio || 0).toFixed(2)}`}/>
          <Dato label="Inicio nuevo período" value={fecha(preview.fecha_inicio)}/>
          <Dato label="Fin nuevo período" value={fecha(preview.fecha_fin)} destacado/>
          <Dato label="Emisión programada" value={fecha(preview.fecha_emision)}/>
          <Dato label="Vencimiento de cuota" value={fecha(preview.fecha_vencimiento)}/>
        </Box>
        <Alert severity={guardado ? 'success' : 'info'} sx={{ mt: 2 }}>
          {guardado ? 'Se agregó un nuevo período y su cuota al contrato original.'
            : 'Vista previa calculada por Laravel. No se ha creado ninguna cuota ni venta todavía.'}
        </Alert>
      </> : <Alert severity="info">
        Pulsa Vista previa para consultar si el contrato puede renovarse, las fechas y la próxima cuota.
      </Alert>}
    </DialogContent>
    <Divider/>
    <DialogActions sx={{ ...dbanuStyles.dialogActions, flexWrap: 'wrap' }}>
      <BotonCancelar texto="Cerrar" disabled={procesando} onClick={onCerrar}/>
      {!guardado && <BotonVistaPrevia onClick={previsualizar} cargando={procesando} disabled={procesando}/>}
      {!guardado && <BotonGuardar texto="Guardar" onClick={guardar}
        disabled={!preview?.confirmable} guardando={procesando}/>}
    </DialogActions>
  </Dialog>;
}
