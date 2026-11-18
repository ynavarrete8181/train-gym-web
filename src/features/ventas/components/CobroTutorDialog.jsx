import { useEffect, useMemo, useState } from 'react';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { ventaServicio } from '../services/ventaServicio.js';
import { PagosCobroEditor, usePagosCobro } from './PagosCobroEditor.jsx';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fechaCorta = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '');
const saldoDe = (cuenta) => Math.max(0, Number(cuenta.saldo_pendiente ?? cuenta.total ?? 0));

/** Concepto de una cuenta: plan y período, o el concepto de la venta. */
export const conceptoCuenta = (cuenta) => {
  const periodo = cuenta.periodo_fecha_inicio ? ` · ${fechaCorta(cuenta.periodo_fecha_inicio)} al ${fechaCorta(cuenta.periodo_fecha_fin)}` : '';
  return cuenta.plan_nombre ? `${cuenta.plan_nombre}${periodo}` : (cuenta.concepto || 'Venta');
};

/**
 * Cobro de un tutor: todas las cuentas que tiene a cargo (la suya y las de sus
 * representados) se pagan en una sola operación y un solo recibo.
 */
export function CobroTutorDialog({ grupo, onClose, onCobrado, avisar }) {
  const [seleccion, setSeleccion] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesAuto, setObservacionesAuto] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setSeleccion(grupo ? grupo.cuentas.map((cuenta) => cuenta.id) : []);
    setObservaciones('');
    setObservacionesAuto(true);
  }, [grupo]);

  const elegidas = useMemo(() => (grupo?.cuentas || []).filter((cuenta) => seleccion.includes(cuenta.id)), [grupo, seleccion]);
  const saldoCobro = Math.round(elegidas.reduce((total, cuenta) => total + saldoDe(cuenta), 0) * 100) / 100;
  const cobro = usePagosCobro(saldoCobro);
  const { reiniciarPagos } = cobro;
  useEffect(() => { reiniciarPagos(); }, [grupo]); // eslint-disable-line react-hooks/exhaustive-deps

  const observacionSugerida = grupo && elegidas.length
    ? `Cobro pagado por el tutor ${grupo.responsable_nombre}: ${elegidas.map((c) => `${c.cliente_nombre} ${c.numero} (${dinero(saldoDe(c))})`).join('; ')}. Total ${dinero(saldoCobro)}${cobro.metodosTexto ? `. Pago: ${cobro.metodosTexto}` : ''}.`
    : '';
  const observacionesVista = observacionesAuto ? observacionSugerida : observaciones;

  const alternar = (id) => setSeleccion((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]));

  const cobrar = async () => {
    if (!elegidas.length) {
      avisar('Elige al menos una cuenta para cobrar.', 'warning');
      return;
    }
    const problema = cobro.errorPagos();
    if (problema) {
      avisar(problema, 'warning');
      return;
    }
    setGuardando(true);
    try {
      const response = await ventaServicio.cobrarGrupoPos({
        responsable_persona_id: grupo.responsable_persona_id,
        venta_ids: elegidas.map((cuenta) => cuenta.id),
        observaciones: observacionesVista || null,
        pagos: cobro.pagosParaEnviar().map(({ metodo_pago, monto, efectivo_recibido, referencia, institucion_financiera_id }) => ({ metodo_pago, monto, efectivo_recibido, referencia, institucion_financiera_id })),
      });
      onCobrado(response.datos || response);
    } catch (error) {
      const errores = error.response?.data?.errors;
      avisar((errores ? Object.values(errores).flat()[0] : null) || error.response?.data?.mensaje || 'No se pudo registrar el cobro.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(grupo)} onClose={() => !guardando && onClose()} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}>
      <DialogTitle sx={{ px: 2.2, py: 1.45, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="subtitle1" fontWeight={950}>Cobro al tutor · {grupo?.responsable_nombre}</Typography>
        <Typography variant="caption" color="text.secondary">
          Un solo pago para todas las cuentas a su cargo. Cada membresía queda pagada y activa por separado.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 2.2, pt: '16px !important' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: .8 }}>Cuentas a cobrar</Typography>
        <Box sx={{ border: '1px solid #e5e5e5', borderRadius: 1.5, overflow: 'hidden' }}>
          {(grupo?.cuentas || []).map((cuenta, indice) => (
            <Stack key={cuenta.id} direction="row" spacing={1} onClick={() => alternar(cuenta.id)}
              sx={{ alignItems: 'center', px: 1, py: .8, cursor: 'pointer', borderTop: indice ? '1px solid #f0f0f0' : 'none', '&:hover': { bgcolor: '#fffaf0' } }}>
              <Checkbox size="small" checked={seleccion.includes(cuenta.id)} sx={{ p: .4, '&.Mui-checked': { color: '#B18510' } }}
                slotProps={{ input: { 'aria-label': `Cobrar la cuenta de ${cuenta.cliente_nombre}` } }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>
                  {cuenta.cliente_nombre}{Number(cuenta.cliente_persona_id) === Number(grupo.responsable_persona_id) ? ' (tutor)' : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{cuenta.numero} · {conceptoCuenta(cuenta)}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>{dinero(saldoDe(cuenta))}</Typography>
            </Stack>
          ))}
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1.2, pt: 1, borderTop: '1px solid #dfe4ea' }}>
          <Typography variant="h6" fontWeight={900}>Total</Typography>
          <Typography variant="h5" fontWeight={900}>{dinero(saldoCobro)}</Typography>
        </Stack>
        {elegidas.length < (grupo?.cuentas.length || 0) ? (
          <Alert severity="info" sx={{ mt: 1 }}>Las cuentas sin marcar quedan pendientes para otro cobro.</Alert>
        ) : null}

        <Typography variant="subtitle2" sx={{ fontWeight: 950, mt: 2, mb: 1.2 }}>Método de pago</Typography>
        <PagosCobroEditor cobro={cobro} saldoCobro={saldoCobro} />
        <TextField fullWidth multiline minRows={2} size="small" label="Observaciones" value={observacionesVista}
          onChange={(e) => { setObservaciones(e.target.value); setObservacionesAuto(false); }}
          sx={{ mt: 1.6 }} helperText="Se arma con el detalle del cobro; puedes editarla." />
      </DialogContent>
      <DialogActions sx={{ px: 2.2, py: 1.2, borderTop: '1px solid #e5e7eb', gap: 1 }}>
        <BotonCancelar onClick={onClose} disabled={guardando} />
        <Button variant="outlined" onClick={cobrar}
          disabled={guardando || !elegidas.length || cobro.totalPagos <= 0 || cobro.excedentePagos > 0}
          startIcon={guardando ? <CircularProgress size={17} color="inherit" /> : <PointOfSaleOutlinedIcon />}
          sx={dbanuStyles.saveButton}>
          {guardando ? 'Cobrando…' : `Cobrar ${dinero(cobro.totalPagos)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
