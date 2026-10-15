import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { apiClient } from '../../../services/apiClient.js';

function FotoPrivada({ deportistaId, foto }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let valido = true;
    let recurso = '';
    apiClient.get(`/base/gimnasio/clientes/${deportistaId}/fotos-valoracion/${foto.id}`, { responseType: 'blob' })
      .then((r) => {
        recurso = URL.createObjectURL(r.data);
        if (valido) setUrl(recurso);
        else URL.revokeObjectURL(recurso);
      })
      .catch(() => {});
    return () => { valido = false; if (recurso) URL.revokeObjectURL(recurso); };
  }, [deportistaId, foto.id]);
  return <Box sx={{ width: 180 }}>
    {url ? <Box component="img" src={url} alt={`Foto ${foto.vista} del ${foto.fecha_fotografia}`} sx={{ width: '100%', height: 150, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 1 }} /> : <Box sx={{ height: 150, display: 'grid', placeItems: 'center' }}><CircularProgress size={22} /></Box>}
    <Typography variant="caption" color="text.secondary">{foto.vista} · {String(foto.fecha_fotografia).slice(0, 10)}</Typography>
  </Box>;
}
export function FotosEvaluacionDeportista({ deportistaId, registro, onNotificacion }) {
  const [fotos, setFotos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState('FRONTAL');
  const [fecha, setFecha] = useState(String(registro.fecha_registro).slice(0, 10));
  const [guardando, setGuardando] = useState(false);
  const cargar = async () => {
    const r = await gimnasioServicio.obtenerFotosValoracion(deportistaId);
    setFotos((r.datos || []).filter((f) => Number(f.valoracion_registro_id) === Number(registro.id)));
  };
  useEffect(() => { cargar().catch(() => onNotificacion?.('No se pudieron consultar las fotografías.', 'error')); }, [deportistaId, registro.id]);
  const guardar = async () => {
    if (!archivo || !fecha) return onNotificacion?.('Selecciona una fotografía y la fecha.', 'warning');
    setGuardando(true);
    try {
      await gimnasioServicio.subirFotoValoracion(deportistaId, archivo, registro.id, vista, fecha);
      await cargar();
      setArchivo(null);
      onNotificacion?.('Fotografía registrada correctamente.', 'success');
    } catch (error) {
      const mensaje = Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.mensaje || 'No se pudo guardar la fotografía.';
      onNotificacion?.(mensaje, error.response?.status === 422 ? 'warning' : 'error');
    } finally { setGuardando(false); }
  };
  return <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
    <Typography fontWeight={800} sx={{ mb: 1 }}>Fotografías de esta evaluación</Typography>
    <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>{fotos.map((foto) => <FotoPrivada key={foto.id} deportistaId={deportistaId} foto={foto} />)}</Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 1.5 }}>
      <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />} sx={{ justifyContent: 'flex-start' }}>
        {archivo?.name || 'Seleccionar fotografía'}
        <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
      </Button>
      <TextField select label="Vista" size="small" value={vista} onChange={(e) => setVista(e.target.value)} sx={dbanuStyles.field}>
        {['FRONTAL', 'LATERAL', 'POSTERIOR', 'OTRA'].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
      </TextField>
      <TextField type="date" size="small" value={fecha} onChange={(e) => setFecha(e.target.value)} inputProps={{ 'aria-label': 'Fecha de la fotografía' }} sx={dbanuStyles.field} />
    </Box>
    <Typography variant="caption" color="text.secondary">JPG, PNG o WEBP. Máximo 5 MB. Las imágenes requieren consentimiento informado y almacenamiento privado persistente.</Typography>
    <Stack direction="row" sx={{ ...dbanuStyles.formActions, justifyContent: 'flex-end', px: 0, pb: 0, mt: 1 }}>
      <BotonGuardar texto="Guardar fotografía" guardando={guardando} onClick={guardar} />
    </Stack>
  </Box>;
}
