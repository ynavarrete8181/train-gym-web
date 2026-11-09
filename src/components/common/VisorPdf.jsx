import { useRef } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { dbanuStyles } from '../../styles/dbanuStyles.js';
import { BotonCancelar } from './BotonCancelar.jsx';

/**
 * Muestra un PDF dentro de la página, con descarga e impresión.
 * `pdf` es { url, blob, nombre } o null; `cargando` muestra la espera mientras se genera.
 */
export function VisorPdf({ titulo, pdf, cargando = false, onCerrar }) {
  const marco = useRef(null);
  const abierto = Boolean(pdf?.url) || cargando;

  const descargar = () => {
    if (!pdf?.blob) return;
    const url = URL.createObjectURL(pdf.blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = pdf.nombre || 'documento.pdf';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

  const imprimir = () => {
    marco.current?.contentWindow?.focus();
    marco.current?.contentWindow?.print();
  };

  return <Dialog open={abierto} onClose={() => !cargando && onCerrar?.()} fullWidth maxWidth="lg"
    slotProps={{ paper: { sx: { height: { xs: '94vh', md: '90vh' }, overflow: 'hidden', borderRadius: 1.5 } } }}>
    <DialogTitle sx={{ px: 2.2, py: 1.45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid #e5e7eb' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={900}>{cargando ? 'Generando documento...' : titulo}</Typography>
        {!cargando && pdf?.nombre && <Typography variant="caption" color="text.secondary">{pdf.nombre}</Typography>}
      </Box>
      <Chip size="small" label={cargando ? 'Procesando' : 'PDF'}
        sx={{ fontWeight: 900, bgcolor: 'rgba(212,160,23,.13)', color: '#8a6500', border: '1px solid rgba(212,160,23,.28)' }} />
    </DialogTitle>
    <DialogContent sx={{ p: 0, bgcolor: '#e9edf1', height: '100%', overflow: 'hidden' }}>
      {cargando ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">Cargando PDF...</Typography>
      </Box> : pdf?.url ? <Box component="iframe" ref={marco} title={titulo} src={pdf.url}
        sx={{ width: '100%', height: '100%', minHeight: 560, border: 0, display: 'block', bgcolor: '#fff' }} /> : null}
    </DialogContent>
    <DialogActions sx={{ px: 2.2, py: 1.2, borderTop: '1px solid #e5e7eb', gap: 1 }}>
      <BotonCancelar texto="Cerrar" onClick={onCerrar} disabled={cargando} />
      <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={descargar} disabled={!pdf?.blob || cargando} sx={dbanuStyles.backButton}>Descargar</Button>
      <Button variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={imprimir} disabled={!pdf?.url || cargando} sx={dbanuStyles.saveButton}>Imprimir</Button>
    </DialogActions>
  </Dialog>;
}
