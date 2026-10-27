import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
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

export function DescuentosDeportistaPanel({ deportistaId, planes = [] }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(nuevo);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalidades, setModalidades] = useState([]);
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
    let vigente = true;
    setModalidades([]);
    if (form.alcance === 'MODALIDAD' && form.plan_id) {
      gimnasioServicio.obtenerModalidadesPlan(form.plan_id)
        .then((respuesta) => { if (vigente) setModalidades(respuesta.datos || []); })
        .catch(() => { if (vigente) setError('No se pudieron cargar las modalidades del plan.'); });
    }
    return () => { vigente = false; };
  }, [form.alcance, form.plan_id]);

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
    if (!form.fecha_inicio || !form.motivo.trim()) {
      setError('La fecha inicial y el motivo son obligatorios.'); return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setError('La fecha final debe ser igual o posterior al inicio.'); return;
    }
    const payload = {
      deportista_id: Number(deportistaId), tipo: form.tipo, valor,
      fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null,
      motivo: form.motivo.trim(),
      plan_id: form.alcance === 'GENERAL' ? null : Number(form.plan_id) || null,
      modalidad_id: form.alcance === 'MODALIDAD' ? Number(form.modalidad_id) || null : null,
    };
    if (form.alcance !== 'GENERAL' && !payload.plan_id) {
      setError('Selecciona un plan para limitar el beneficio.'); return;
    }
    if (form.alcance === 'MODALIDAD' && !payload.modalidad_id) {
      setError('Selecciona una modalidad para este beneficio.'); return;
    }
    setGuardando(true);
    try {
      await gimnasioServicio.crearDescuentoDeportista(payload);
      setMensaje('Beneficio registrado correctamente.');
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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
          <Box>
          <Typography variant="subtitle1" fontWeight={700}>¿Aplicar descuento a esta nueva membresía?</Typography>
          <Typography variant="body2" color="text.secondary">
            Opcional. Registra primero el beneficio para que Laravel pueda considerarlo al generar una nueva venta. No modifica el precio oficial del plan.
          </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => setExpandido((valor) => !valor)}>
            {expandido ? "Ocultar descuento" : "Configurar descuento"}
          </Button>
        </Stack>
        {expandido && <>
        {cargando && <CircularProgress size={18} />}
        {error && <Typography role="alert" color="error" variant="body2">{error}</Typography>}
        {mensaje && <Typography color="success.main" variant="body2">{mensaje}</Typography>}
        {lista.length > 0 && (
          <Stack spacing={1}>
            {lista.map((item) => (
              <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between"
                sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {item.valor}{item.tipo === 'PORCENTAJE' ? '%' : ' USD'} · {item.motivo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {String(item.fecha_inicio).slice(0, 10)} a {item.fecha_fin ? String(item.fecha_fin).slice(0, 10) : 'indefinido'}
                    {' · '}{item.activo ? 'Habilitado' : 'Desactivado'}
                    {' · '}{item.modalidad_id ? 'Modalidad específica' : item.plan_id ? 'Plan específico' : 'Todos los planes'}
                  </Typography>
                </Box>
                {item.activo && <Button size="small" color="error" disabled={guardando} onClick={() => desactivar(item)}>Desactivar</Button>}
              </Stack>
            ))}
          </Stack>
        )}
        <Divider />
        <Typography variant="subtitle2" fontWeight={600}>Nuevo beneficio</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField size="small" select label="Tipo" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
            <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
            <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
          </TextField>
          <TextField size="small" type="number" label="Descuento" value={form.valor}
            onChange={(e) => cambiar('valor', e.target.value)}
            inputProps={{ min: 0, max: form.tipo === 'PORCENTAJE' ? 100 : undefined, step: '0.01' }} />
          <TextField size="small" select label="Aplicar a" value={form.alcance}
            onChange={(e) => setForm((a) => ({ ...a, alcance: e.target.value, plan_id: '', modalidad_id: '' }))}>
            <MenuItem value="GENERAL">Todos los planes</MenuItem>
            <MenuItem value="PLAN">Un plan</MenuItem>
            <MenuItem value="MODALIDAD">Una modalidad</MenuItem>
          </TextField>
          {form.alcance !== 'GENERAL' &&
            <TextField size="small" select label="Plan" value={form.plan_id}
              onChange={(e) => cambiar('plan_id', e.target.value)}>
              {planes.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
            </TextField>}
          {form.alcance === 'MODALIDAD' &&
            <TextField size="small" select label="Modalidad" value={form.modalidad_id}
              onChange={(e) => cambiar('modalidad_id', e.target.value)}>
              <MenuItem value="">Selecciona una modalidad</MenuItem>
              {modalidades.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.nombre || m.codigo || `Modalidad #${m.id}`}</MenuItem>
              ))}
            </TextField>}
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
          <BotonGuardar texto="Guardar beneficio" guardando={guardando} disabled={cargando} onClick={guardar} />
        </Stack>
        </>}
      </Stack>
    </Box>
  );
}
