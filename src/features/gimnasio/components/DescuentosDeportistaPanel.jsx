import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';

const hoyLocal = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};
const nuevo = () => ({
  tipo: 'PORCENTAJE', valor: '2', fecha_inicio: hoyLocal(), fecha_fin: '',
  motivo: '', alcance: 'GENERAL', plan_id: '', modalidad_id: '',
});
const errorApi = (e) => Object.values(e.response?.data?.errors || {}).flat()[0] || e.response?.data?.mensaje || e.response?.data?.message || 'No se pudo completar la operación.';

export function DescuentosDeportistaPanel({ deportistaId, planId, modalidadId }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(nuevo);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [autorizado, setAutorizado] = useState(true);
  const [expandido, setExpandido] = useState(false);
  const cambiar = (k, v) => setForm((a) => ({ ...a, [k]: v }));

  const recargar = async () => {
    if (!deportistaId) return;
    setCargando(true); setError('');
    try {
      const resp = await gimnasioServicio.obtenerDescuentosDeportista(deportistaId);
      setLista(resp.datos || []);
      setAutorizado(true);
    } catch (e) {
      if (e.response?.status === 403) setAutorizado(false);
      else setError(errorApi(e));
    } finally { setCargando(false); }
  };

  useEffect(() => {
    setLista([]); setAutorizado(true); setMensaje(''); setError('');
    if (deportistaId) recargar();
  }, [deportistaId]);

  const guardar = async () => {
    setMensaje(''); setError('');
    const valor = Number(form.valor);
    if (!Number.isFinite(valor) || valor < 0 || (form.tipo === 'PORCENTAJE' && valor > 100)) {
      setError('El descuento debe ser válido y no superar el 100 % cuando es porcentual.'); return;
    }
    if (!planId || !form.fecha_inicio || !form.motivo.trim()) {
      setError('Selecciona el plan e ingresa la fecha y el motivo.'); return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setError('La fecha final debe ser igual o posterior al inicio.'); return;
    }
    const payload = {
      deportista_id: Number(deportistaId), tipo: form.tipo, valor,
      fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null,
      motivo: form.motivo.trim(),
      plan_id: Number(planId) || null,
      modalidad_id: Number(modalidadId) || null,
    };
    setGuardando(true);
    try {
      await gimnasioServicio.crearDescuentoDeportista(payload);
      setMensaje('Descuento registrado. Continúa con el guardado de la membresía.');
      setForm(nuevo());
      await recargar();
    } catch (e) { setError(errorApi(e)); }
    finally { setGuardando(false); }
  };

  const desactivar = async (item) => {
    if (!window.confirm('¿Desactivar este descuento para futuras ventas?')) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      await gimnasioServicio.actualizarDescuentoDeportista(item.id, { activo: false });
      setMensaje('Beneficio desactivado; las ventas históricas no se modifican.');
      await recargar();
    } catch (e) { setError(errorApi(e)); }
    finally { setGuardando(false); }
  };

  if (!deportistaId || !autorizado) return null;
  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Stack spacing={2}>
        <FormControlLabel
          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 700 } }}
          control={<Switch size="small" checked={expandido} onChange={(e) => setExpandido(e.target.checked)} />}
          label="Requiere descuento"
        />
        {expandido && <>
        {cargando && <CircularProgress size={18} />}
        {error && <Typography role="alert" color="error" variant="body2">{error}</Typography>}
        {mensaje && <Typography color="success.main" variant="body2">{mensaje}</Typography>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField size="small" select label="Tipo" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
            <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
            <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
          </TextField>
          <TextField size="small" type="number" label="Descuento" value={form.valor}
            onChange={(e) => cambiar('valor', e.target.value)}
            inputProps={{ min: 0, max: form.tipo === 'PORCENTAJE' ? 100 : undefined, step: '0.01' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="label" htmlFor="beneficio-fecha-inicio" sx={{ display: 'block', mb: 0.75, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              Inicio de vigencia
            </Typography>
            <Box component="input" id="beneficio-fecha-inicio" type="date" value={form.fecha_inicio}
              onChange={(e) => cambiar('fecha_inicio', e.target.value)}
              sx={{ boxSizing: 'border-box', display: 'block', width: '100%', minWidth: 0, height: 40, px: 1.5,
                border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper',
                color: 'text.primary', font: 'inherit', fontSize: 13,
                '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-1px' } }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="label" htmlFor="beneficio-fecha-fin" sx={{ display: 'block', mb: 0.75, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              Fin de vigencia (opcional)
            </Typography>
            <Box component="input" id="beneficio-fecha-fin" type="date" value={form.fecha_fin}
              onChange={(e) => cambiar('fecha_fin', e.target.value)}
              sx={{ boxSizing: 'border-box', display: 'block', width: '100%', minWidth: 0, height: 40, px: 1.5,
                border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper',
                color: 'text.primary', font: 'inherit', fontSize: 13,
                '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-1px' } }} />
          </Box>
          <TextField size="small" label="Motivo / autorización" value={form.motivo}
            onChange={(e) => cambiar('motivo', e.target.value)}
            sx={{ gridColumn: { xs: '1', md: 'span 3' } }} />
        </Box>
        <Stack direction="row" justifyContent="flex-end">
          <BotonGuardar texto="Guardar" guardando={guardando} disabled={cargando} onClick={guardar} />
        </Stack>
        </>}
      </Stack>
    </Box>
  );
}
