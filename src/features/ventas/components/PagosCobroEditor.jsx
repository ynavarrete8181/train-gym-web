import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Alert, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { BANCOS_ECUADOR } from '../config/bancosConfig.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const DORADO_REVIVE = uiTokens.colores.acento;
const DORADO_REVIVE_OSCURO = uiTokens.colores.acentoOscuro;
const DORADO_SUAVE = uiTokens.colores.acentoSuave;

export const METODOS_PAGO = [
  { codigo: 'EFECTIVO', etiqueta: 'Efectivo', Icono: PaymentsOutlinedIcon },
  { codigo: 'TRANSFERENCIA', etiqueta: 'Transferencia', Icono: AccountBalanceOutlinedIcon },
  { codigo: 'TARJETA', etiqueta: 'Tarjeta', Icono: CreditCardOutlinedIcon },
  { codigo: 'DEPOSITO', etiqueta: 'Depósito', Icono: ReceiptOutlinedIcon },
];

const CON_BANCO = ['TRANSFERENCIA', 'DEPOSITO'];

const pagoInicial = () => ({ clave: 'PAGO-1', metodo_pago: 'EFECTIVO', monto: '0.00', referencia: '', banco: '', recibido: '0.00', montoManual: false, recibidoManual: false });

/**
 * Estado de las formas de pago de un cobro. La primera forma propone el saldo
 * completo; al editar el monto a mano se respeta el valor (pagos divididos).
 */
export function usePagosCobro(saldoCobro) {
  const [pagos, setPagos] = useState([pagoInicial()]);

  useEffect(() => {
    setPagos((actual) => {
      if (actual.length !== 1 || actual[0].montoManual) return actual;
      const sugerido = saldoCobro.toFixed(2);
      const recibido = actual[0].recibidoManual ? actual[0].recibido : sugerido;
      if (actual[0].monto === sugerido && actual[0].recibido === recibido) return actual;
      return [{ ...actual[0], monto: sugerido, recibido }];
    });
  }, [saldoCobro]);

  const actualizarPago = (clave, campo, valor) => {
    setPagos((actual) => actual.map((pago) => (
      pago.clave === clave
        ? { ...pago, [campo]: valor, ...(campo === 'monto' ? { montoManual: true } : {}),
            ...(campo === 'recibido' ? { recibidoManual: true } : {}),
            ...(campo === 'metodo_pago' ? { referencia: '', banco: '', recibido: pago.monto, recibidoManual: false } : {}) }
        : pago
    )));
  };

  const agregarPago = () => {
    setPagos((actual) => [
      ...actual,
      { clave: `PAGO-${Date.now()}-${actual.length + 1}`, metodo_pago: 'EFECTIVO', monto: '', referencia: '', banco: '', recibido: '', montoManual: true, recibidoManual: false },
    ]);
  };

  const quitarPago = (clave) => {
    setPagos((actual) => actual.length > 1 ? actual.filter((pago) => pago.clave !== clave) : actual);
  };

  const reiniciarPagos = () => setPagos([pagoInicial()]);

  const totalPagos = pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const excedentePagos = Math.max(0, totalPagos - saldoCobro);
  const saldoDespuesPago = Math.max(0, saldoCobro - totalPagos);
  const metodosTexto = pagos.filter((p) => Number(p.monto || 0) > 0)
    .map((p) => `${String(p.metodo_pago).toLowerCase()} ${dinero(p.monto)}${p.referencia || p.banco ? ` (${[p.referencia ? `N.º ${p.referencia}` : '', p.banco].filter(Boolean).join(', ')})` : ''}`).join(', ');

  /** Mensaje del primer problema que impide cobrar, o null si se puede cobrar. */
  const errorPagos = () => {
    if (totalPagos <= 0) return 'Registra al menos un pago mayor que cero.';
    if (excedentePagos > 0.00001) return 'La suma de los pagos no puede superar el saldo pendiente.';
    if (pagos.some((pago) => pago.metodo_pago === 'EFECTIVO' && pago.recibido !== '' && Number(pago.recibido || 0) < Number(pago.monto || 0))) {
      return 'En efectivo, el valor recibido no puede ser menor que el monto aplicado.';
    }
    const sinDetalle = pagos.find((pago) => Number(pago.monto || 0) > 0 && CON_BANCO.includes(pago.metodo_pago) && (!pago.referencia.trim() || !pago.banco.trim()));
    if (sinDetalle) {
      return `Escribe el número de comprobante y el banco de la ${sinDetalle.metodo_pago === 'DEPOSITO' ? 'papeleta de depósito' : 'transferencia'}.`;
    }
    return null;
  };

  /** Pagos con monto, en el formato que espera la API. */
  const pagosParaEnviar = () => pagos
    .filter((pago) => Number(pago.monto || 0) > 0)
    .map((pago) => {
      const monto = Number(pago.monto || 0);
      const esEfectivo = pago.metodo_pago === 'EFECTIVO';
      const recibido = esEfectivo ? (pago.recibido === '' ? monto : Number(pago.recibido)) : null;
      const cambio = esEfectivo ? Math.max(0, recibido - monto) : 0;
      return {
        metodo_pago: pago.metodo_pago,
        monto,
        efectivo_recibido: esEfectivo ? recibido : null,
        cambio_entregado: esEfectivo ? cambio : null,
        referencia: pago.referencia.trim() || null,
        banco: esEfectivo ? null : (pago.banco.trim() || null),
        observaciones: esEfectivo ? `Cobro POS. Recibido ${dinero(recibido)}. Cambio ${dinero(cambio)}.` : 'Cobro registrado desde POS.',
      };
    });

  return {
    pagos, actualizarPago, agregarPago, quitarPago, reiniciarPagos,
    totalPagos, excedentePagos, saldoDespuesPago, metodosTexto, errorPagos, pagosParaEnviar,
  };
}

/** Formas de pago de un cobro: método, valor, efectivo recibido y cambio. */
export function PagosCobroEditor({ cobro, saldoCobro }) {
  const { pagos, actualizarPago, agregarPago, quitarPago, totalPagos, excedentePagos, saldoDespuesPago } = cobro;
  return (
    <Stack spacing={1.25}>
      {pagos.map((pago, indice) => {
        const monto = Number(pago.monto || 0);
        const recibidoEfectivo = pago.recibido === '' ? monto : Number(pago.recibido || 0);
        const cambioEfectivo = pago.metodo_pago === 'EFECTIVO' ? Math.max(0, recibidoEfectivo - monto) : 0;
        return (
          <Box key={pago.clave} sx={{
            border: pagos.length > 1 ? '1px solid #e4e4e4' : 'none',
            borderRadius: 1.5, p: pagos.length > 1 ? 1.2 : 0,
            bgcolor: '#fff',
          }}>
            {pagos.length > 1 && (
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 850, color: '#545454' }}>Pago {indice + 1}</Typography>
                <IconButton size="small" title="Quitar este pago" onClick={() => quitarPago(pago.clave)}
                  sx={{ color: '#a32121' }}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton>
              </Stack>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
              {METODOS_PAGO.map(({ codigo, etiqueta, Icono }) => {
                const activo = pago.metodo_pago === codigo;
                return (
                  <Button key={codigo} type="button" fullWidth
                    aria-pressed={activo} variant={activo ? 'contained' : 'outlined'}
                    startIcon={<Icono sx={{ fontSize: 19 }} />}
                    onClick={() => actualizarPago(pago.clave, 'metodo_pago', codigo)}
                    sx={{
                      height: 42, px: 1, minWidth: 0, fontSize: 12.5,
                      borderRadius: 0.5, fontWeight: 900, textTransform: 'none',
                      bgcolor: activo ? DORADO_SUAVE : '#fff',
                      color: activo ? DORADO_REVIVE_OSCURO : '#404040', border: '1px solid',
                      borderColor: activo ? DORADO_REVIVE : '#d8d8d8',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: activo ? DORADO_SUAVE : '#fafafa', borderColor: activo ? DORADO_REVIVE : '#bdbdbd', boxShadow: 'none' },
                    }}>{etiqueta}</Button>
                );
              })}
            </Box>
            <Box sx={{ mt: 1.4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.3, alignItems: 'start' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 850, color: '#404040', display: 'block', mb: .7 }}>
                  Valor que se va a cobrar
                </Typography>
                <TextField size="small" type="number" fullWidth
                  value={pago.monto} onChange={(e) => actualizarPago(pago.clave, 'monto', e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: '0.01', 'aria-label': 'Valor que se va a cobrar' } }}
                  sx={{ ...dbanuStyles.field, '& .MuiOutlinedInput-root': { borderRadius: 1.4, bgcolor: '#fff' } }} />
              </Box>
              {pago.metodo_pago === 'EFECTIVO' ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#171717', display: 'block', mb: .7 }}>
                    Efectivo recibido
                  </Typography>
                  <TextField size="small" type="number" fullWidth
                    placeholder="Ej.: 5, 10, 20..."
                    value={pago.recibido} onChange={(e) => actualizarPago(pago.clave, 'recibido', e.target.value)}
                    slotProps={{ htmlInput: { min: 0, step: '0.01', 'aria-label': 'Efectivo recibido del cliente' } }}
                    sx={{
                      ...dbanuStyles.field,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.4, bgcolor: '#fffdf5',
                        '& fieldset': { borderColor: '#D4A017', borderWidth: 2 },
                        '&:hover fieldset': { borderColor: '#B78400' },
                        '&.Mui-focused fieldset': { borderColor: '#B78400' },
                      },
                    }} />
                  <Stack direction="row" spacing={.6} useFlexGap sx={{ mt: .7, flexWrap: 'wrap' }}>
                    {[['Exacto', monto], ['$5', 5], ['$10', 10], ['$20', 20]].map(([etiqueta, valor]) => (
                      <Button key={etiqueta} size="small" variant="outlined"
                        onClick={() => actualizarPago(pago.clave, 'recibido', Number(valor).toFixed(2))}
                        sx={{ minWidth: 0, px: 1.1, height: 28, fontSize: 11.5, fontWeight: 800, textTransform: 'none', borderRadius: 0.5, color: '#404040', borderColor: '#d8d8d8' }}>
                        {etiqueta}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 850, color: '#404040', display: 'block', mb: .7 }}>
                    {pago.metodo_pago === 'TARJETA' ? 'Referencia del voucher' : pago.metodo_pago === 'DEPOSITO' ? 'Número de depósito' : 'Número de comprobante'}
                  </Typography>
                  <TextField size="small" fullWidth
                    placeholder="Número de comprobante"
                    value={pago.referencia} onChange={(e) => actualizarPago(pago.clave, 'referencia', e.target.value)}
                    sx={{ ...dbanuStyles.field, '& .MuiOutlinedInput-root': { borderRadius: 1.4 } }} />
                </Box>
              )}
            </Box>
            {CON_BANCO.includes(pago.metodo_pago) ? (
              <Box sx={{ mt: 1.3 }}>
                <Typography variant="caption" sx={{ fontWeight: 850, color: '#404040', display: 'block', mb: .7 }}>
                  Banco
                </Typography>
                {/* Lista nativa: en el celular abre el selector del teléfono. */}
                <TextField select fullWidth size="small" value={pago.banco}
                  onChange={(e) => actualizarPago(pago.clave, 'banco', e.target.value)}
                  slotProps={{ select: { native: true }, htmlInput: { 'aria-label': 'Banco' } }}
                  sx={{ ...dbanuStyles.field, '& .MuiOutlinedInput-root': { borderRadius: 1.4, bgcolor: '#fff' } }}>
                  <option value="">Selecciona el banco</option>
                  {BANCOS_ECUADOR.map(({ grupo, opciones }) => (
                    <optgroup key={grupo} label={grupo}>
                      {opciones.map((banco) => <option key={banco} value={banco}>{banco}</option>)}
                    </optgroup>
                  ))}
                </TextField>
              </Box>
            ) : null}
            {pago.metodo_pago === 'EFECTIVO' && monto > 0 && (
              <Box sx={{
                mt: 1.2, px: 1.5, py: 1, border: '1px solid rgba(8, 127, 91, .35)',
                bgcolor: 'rgba(8, 127, 91, .07)', borderRadius: 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap',
              }}>
                <Typography variant="body2" sx={{ color: uiTokens.colores.exito, fontWeight: 800 }}>
                  Cambio a entregar
                </Typography>
                <Typography variant="h6" sx={{ color: uiTokens.colores.exito, fontWeight: 900, lineHeight: 1.2 }}>
                  {dinero(cambioEfectivo)}
                </Typography>
                {recibidoEfectivo < monto && (
                  <Typography variant="caption" sx={{ width: '100%', color: '#A04418' }}>
                    El efectivo recibido es menor que el importe del pago.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );
      })}
      <Button variant="text" startIcon={<AddOutlinedIcon />} onClick={agregarPago}
        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: '#956b00', fontWeight: 850, px: .5 }}>
        Dividir pago con otro método
      </Button>
      <Box sx={{ pt: 1.2, borderTop: '1px solid #ececec' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: .6 }}>
          <Typography variant="caption" color="text.secondary">Total a cobrar</Typography>
          <Typography variant="body2" fontWeight={850}>{dinero(saldoCobro)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: .6 }}>
          <Typography variant="caption" color="text.secondary">Pagos ingresados</Typography>
          <Typography variant="body2" fontWeight={850}>{dinero(totalPagos)}</Typography>
        </Stack>
        {saldoDespuesPago > 0 && (
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">Saldo restante</Typography>
            <Typography variant="body2" fontWeight={900} color="warning.main">{dinero(saldoDespuesPago)}</Typography>
          </Stack>
        )}
      </Box>
      {excedentePagos > 0 ? <Alert severity="warning">Los pagos superan el saldo por {dinero(excedentePagos)}.</Alert> : null}
    </Stack>
  );
}
