import { useEffect, useState } from 'react';
import {
  Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, InputAdornment, MenuItem, TextField, Typography,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : 'Sin fin');
export const importeDescuento = (precio, d) => (!d ? 0 : d.tipo === 'PORCENTAJE'
  ? Math.round(precio * Math.min(100, Math.max(0, Number(d.valor))) / 100 * 100) / 100
  : Math.min(precio, Math.max(0, Number(d.valor))));
const seCruzan = (a, b) => (a.fecha_inicio <= (b.fecha_fin || '9999-12-31')) && (b.fecha_inicio <= (a.fecha_fin || '9999-12-31'));

/**
 * Modal único para agregar o editar un descuento (nueva membresía y detalle del contrato).
 * - sedes: [{ id, nombre, precio }] autorizadas; inicio/fin: rango de la membresía.
 * - otros: descuentos que no pueden cruzarse con este en la misma sede.
 * - inicioOriginal: si el descuento ya empezó, el cambio rige desde una fecha posterior a ella.
 */
export function DialogDescuento({
  abierto, inicial, sedes, inicio, fin, otros = [], inicioOriginal = null,
  guardando = false, error = '', textoGuardar, onCerrar, onGuardar,
}) {
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (abierto) setForm({
      sede_id: inicial?.sede_id ? String(inicial.sede_id) : '', tipo: inicial?.tipo || 'PORCENTAJE',
      valor: inicial?.valor != null && inicial.valor !== '' ? String(inicial.valor) : '', motivo: inicial?.motivo || '', motivo_auto: !inicial?.motivo,
      fecha_inicio: inicial?.fecha_inicio || inicio || '', fecha_fin: inicial?.fecha_fin ?? (fin || ''),
    });
  }, [abierto]);
  if (!abierto || !form) return null;

  const cambiar = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor, ...(campo === 'motivo' ? { motivo_auto: false } : {}) }));
  const nombreSede = (id) => (id ? sedes.find((s) => String(s.id) === String(id))?.nombre || 'Sede' : 'todas las sedes');
  const sedesDelDescuento = form.sede_id ? sedes.filter((s) => String(s.id) === String(form.sede_id)) : sedes;
  const topeFijo = sedesDelDescuento.length ? Math.min(...sedesDelDescuento.map((s) => s.precio)) : null;
  const valor = Number(form.valor);
  // Motivo sugerido con los datos del descuento; el administrador lo completa (beca, convenio…) o lo reescribe.
  const textoValor = (t, v) => (t === 'PORCENTAJE' ? `${Number(v)} %` : dinero(v));
  const rango = `del ${fecha(form.fecha_inicio)} al ${fecha(form.fecha_fin)}`;
  const motivoSugerido = !(valor > 0) ? '' : inicial
    ? `Cambio del descuento en ${nombreSede(form.sede_id)}: ${textoValor(inicial.tipo, inicial.valor)} → ${textoValor(form.tipo, valor)}, ${inicioOriginal ? `rige desde el ${fecha(form.fecha_inicio)} hasta el ${fecha(form.fecha_fin)}` : rango}.`
    : `Descuento de ${textoValor(form.tipo, valor)} en ${nombreSede(form.sede_id)} ${rango}, autorizado por administración.`;
  const motivo = form.motivo_auto ? motivoSugerido : form.motivo;
  const desdeMinimo = inicioOriginal || inicio;
  const errores = {
    valor: String(form.valor).trim() === '' ? '' : (!(valor > 0) ? 'Debe ser mayor que 0.'
      : form.tipo === 'PORCENTAJE' && valor > 100 ? 'Debe estar entre 1 y 100 %.'
        : form.tipo === 'FIJO' && topeFijo !== null && valor > topeFijo ? `No puede superar ${dinero(topeFijo)}.` : ''),
    motivo: motivo.trim() && motivo.trim().length < 8 ? 'Escribe al menos 8 caracteres.' : '',
    fechas: !form.fecha_inicio ? 'Indica desde cuándo rige.'
      : inicioOriginal && form.fecha_inicio <= inicioOriginal ? `El cambio debe regir después del ${fecha(inicioOriginal)}.`
        : (inicio && form.fecha_inicio < inicio) || (fin && (!form.fecha_fin || form.fecha_fin > fin))
          ? 'Debe quedar dentro de la membresía.' : form.fecha_fin && form.fecha_fin < form.fecha_inicio ? 'La fecha fin no puede ser anterior.' : '',
    cruce: otros.some((d) => String(d.sede_id || '') === String(form.sede_id || '') && seCruzan(d, form))
      ? `Ya hay un descuento para ${nombreSede(form.sede_id)} en esas fechas.` : '',
  };
  const valido = valor > 0 && motivo.trim().length >= 8 && !Object.values(errores).some(Boolean);
  const guardar = () => onGuardar({
    sede_id: form.sede_id ? Number(form.sede_id) : null, tipo: form.tipo, valor: Number(form.valor),
    motivo: motivo.trim(), fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null,
  });

  return <Dialog open onClose={guardando ? undefined : onCerrar} fullWidth maxWidth="sm" aria-labelledby="dialog-descuento-titulo"
    slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', m: { xs: 1.5, sm: 3 }, width: { xs: 'calc(100% - 24px)', sm: undefined } } } }}>
    <DialogTitle id="dialog-descuento-titulo" sx={{ ...formStyles.modalHeader, py: 1.25 }}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave, color: uiTokens.colores.textoFuerte,
        boxShadow: 'none', border: `1px solid ${uiTokens.colores.acentoBorde}` }}>
        <LocalOfferOutlinedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>
          {inicial ? 'Editar descuento' : 'Agregar descuento'}
        </Typography>
        <Typography variant="caption" color="text.secondary">Membresía del {fecha(inicio)} al {fecha(fin)}</Typography>
      </Box>
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
      {inicioOriginal && <Alert severity="info" sx={{ gridColumn: '1 / -1' }}>
        Este descuento ya se está aplicando: el cambio se guarda como un registro nuevo y el actual queda en el historial.
      </Alert>}
      {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
      <TextField select size="small" label="Aplica en" value={form.sede_id} onChange={(e) => cambiar('sede_id', e.target.value)}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} sx={{ gridColumn: '1 / -1', mt: 0.75 }}
        helperText={form.sede_id ? 'En las demás sedes se usa el descuento general, si lo hay.' : 'Se aplica sobre la tarifa de cada sede donde se cobre.'}>
        <MenuItem value="">Todas las sedes autorizadas</MenuItem>
        {sedes.map((s) => <MenuItem key={s.id} value={String(s.id)}>Solo {s.nombre}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Tipo" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
        <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
        <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
      </TextField>
      <TextField size="small" type="number" label={form.tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Valor del descuento'} value={form.valor}
        onChange={(e) => cambiar('valor', e.target.value)} error={Boolean(errores.valor)}
        helperText={errores.valor || (form.tipo === 'PORCENTAJE' ? 'Entre 1 y 100 %.' : topeFijo !== null ? `Hasta ${dinero(topeFijo)}.` : '')}
        slotProps={{
          input: form.tipo === 'PORCENTAJE'
            ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
            : { startAdornment: <InputAdornment position="start">$</InputAdornment> },
          htmlInput: { min: 0.01, step: 0.01 },
        }} />
      <TextField size="small" label={inicial ? 'Motivo del cambio / autorización' : 'Motivo / autorización'} value={motivo} multiline minRows={2}
        onChange={(e) => cambiar('motivo', e.target.value)} placeholder="Ej. Beca deportiva, familiar"
        error={Boolean(errores.motivo)} helperText={errores.motivo || 'Se arma con los datos; agrega la razón (beca, convenio…) o edítalo.'} sx={{ gridColumn: '1 / -1' }} />
      <TextField size="small" type="date" label={inicioOriginal ? 'El cambio rige desde' : 'Desde'} value={form.fecha_inicio}
        onChange={(e) => cambiar('fecha_inicio', e.target.value)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: desdeMinimo || undefined, max: fin || undefined } }}
        helperText={inicioOriginal ? `Hasta el día anterior sigue el actual (desde ${fecha(inicioOriginal)}).`
          : form.fecha_inicio === inicio ? 'Igual al inicio de la membresía.' : ' '} />
      <TextField size="small" type="date" label="Hasta" value={form.fecha_fin} onChange={(e) => cambiar('fecha_fin', e.target.value)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.fecha_inicio || undefined, max: fin || undefined } }}
        helperText={!fin ? 'Opcional.' : form.fecha_fin === fin ? 'Igual al fin de la membresía.' : 'Termina antes que la membresía.'} />
      {(errores.fechas || errores.cruce) && <Alert severity="warning" sx={{ gridColumn: '1 / -1' }}>{errores.fechas || errores.cruce}</Alert>}
      {valor > 0 && !errores.valor && sedesDelDescuento.length > 0 && <Box sx={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
        {sedesDelDescuento.map((s) => <Box key={s.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
          <Typography variant="body2" fontWeight={800}>{s.nombre}</Typography>
          <Typography variant="caption" color="text.secondary">{dinero(s.precio)} − {dinero(importeDescuento(s.precio, form))}</Typography>
          <Typography sx={{ fontWeight: 900, color: 'success.dark' }}>Paga {dinero(s.precio - importeDescuento(s.precio, form))}</Typography>
        </Box>)}
      </Box>}
    </DialogContent>
    <Divider />
    <DialogActions sx={{ ...dbanuStyles.dialogActions, flexWrap: 'wrap', gap: 1.5 }}>
      <BotonCancelar onClick={onCerrar} disabled={guardando} />
      <BotonGuardar texto={textoGuardar || (inicial ? 'Guardar cambios' : 'Agregar')} guardando={guardando} disabled={!valido} onClick={guardar} />
    </DialogActions>
  </Dialog>;
}
