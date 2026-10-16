import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { entrenamientoServicio } from '../services/entrenamientoServicio.js';
import { PruebasRendimientoDeportista } from '../components/PruebasRendimientoDeportista.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';

export function EvaluacionesFisicasPage() {
  const [deportistas, setDeportistas] = useState([]);
  const [deportistaId, setDeportistaId] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    let activo = true;
    entrenamientoServicio.obtenerDeportistasEvaluaciones()
      .then((r) => { if (activo) setDeportistas(Array.isArray(r.datos) ? r.datos : []); })
      .catch((e) => { if (activo) setError(e.response?.data?.mensaje || 'No se pudieron cargar los deportistas autorizados.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);
  return <Box sx={{ pt: 2 }}>
    <PageHeader titulo="Evaluaciones físicas" subtitulo="Registra y consulta pruebas de rendimiento de los deportistas autorizados." />
    <Paper elevation={0} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" alignItems="center" gap={2}>
        <TextField select label="Deportista" size="small" value={deportistaId} onChange={(e) => setDeportistaId(e.target.value)}
          sx={{ width: { xs: '100%', md: 420 } }} helperText="Selecciona al deportista para visualizar sus evaluaciones.">
          <MenuItem value="">Seleccionar deportista</MenuItem>
          {deportistas.map((d) => <MenuItem key={d.id} value={d.id}>{[d.apellidos,d.nombres].filter(Boolean).join(' ')} · {d.codigo_deportista}</MenuItem>)}
        </TextField>
        {cargando && <CircularProgress size={20} />}
      </Stack>
      {!cargando && !deportistas.length && !error && <Typography color="text.secondary" fontSize={12}>No hay deportistas disponibles para tu usuario.</Typography>}
    </Paper>
    {deportistaId && <PruebasRendimientoDeportista key={deportistaId} deportistaId={deportistaId}
      onNotificacion={(mensaje, tipo) => setAviso({ mensaje, tipo })} />}
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo || 'info'} onClose={() => setAviso(null)} />
  </Box>;
}
