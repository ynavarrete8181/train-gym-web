import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

const parseFecha = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return null;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia ? fecha : null;
};
const iso = (fecha) => fecha.toISOString().slice(0, 10);
const dias = (fecha, cantidad) => {
  const nueva = new Date(fecha.getTime());
  nueva.setUTCDate(nueva.getUTCDate() + cantidad);
  return nueva;
};
const meses = (fecha, cantidad) => {
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + cantidad;
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anio, mes, Math.min(fecha.getUTCDate(), ultimo)));
};
const avanzar = (fecha, tipo, cantidad) => {
  if (tipo === 'DIAS') return dias(fecha, cantidad);
  if (tipo === 'SEMANAS') return dias(fecha, cantidad * 7);
  if (tipo === 'MESES') return meses(fecha, cantidad);
  if (tipo === 'ANIOS') return meses(fecha, cantidad * 12);
  return null;
};

// Primer vencimiento en el día indicado, nunca anterior al inicio.
export const primerVencimientoDiaFijo = (inicio, diaPago) => {
  const fecha = parseFecha(inicio);
  const dia = Number(diaPago);
  if (!fecha || !Number.isInteger(dia) || dia < 1 || dia > 31) return '';
  const vencimientoEnMes = (base) => {
    const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(dia, ultimo)));
  };
  let primerPago = vencimientoEnMes(fecha);
  if (primerPago < fecha) primerPago = vencimientoEnMes(meses(fecha, 1));
  return iso(primerPago);
};

export const generarVistaPreviaCuotas = ({ inicio, primerPago, diaPago, cantidad, tipo, duracion }) => {
  const desde = parseFecha(inicio);
  const pago = parseFecha(diaPago === undefined || diaPago === null || diaPago === ''
    ? primerPago
    : primerVencimientoDiaFijo(inicio, diaPago));
  const n = Number(cantidad);
  const d = Number(duracion);
  if (!desde || !pago || !Number.isInteger(n) || n < 1 || n > 36 || !Number.isInteger(d) || d < 1 || pago < desde) return [];
  // El primer vencimiento determina el día fijo de cada mes.
  // Calcular desde esa fecha, nunca desde el vencimiento anterior.
  const diaFijo = diaPago === undefined || diaPago === null || diaPago === ''
    ? pago.getUTCDate()
    : Number(diaPago);
  const vencimientoMensual = (indice) => {
    const mes = new Date(Date.UTC(pago.getUTCFullYear(), pago.getUTCMonth() + indice, 1));
    const ultimo = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0)).getUTCDate();
    mes.setUTCDate(Math.min(diaFijo, ultimo));
    return mes;
  };
  const filas = [];
  let cursor = desde;
  for (let i = 1; i <= n; i++) {
    const siguiente = avanzar(cursor, tipo, d);
    if (!siguiente) return [];
    filas.push({
      numero: i,
      inicio: iso(cursor),
      fin: iso(dias(siguiente, -1)),
      emision: iso(cursor),
      vencimiento: iso(vencimientoMensual(i - 1)),
    });
    cursor = siguiente;
  }
  return filas;
};

/**
 * Encuentra el número mínimo de períodos completos que cubre la fecha indicada.
 * No genera períodos parciales ni modifica el calendario calculado en Laravel.
 */
export const periodosParaCubrirFecha = ({ inicio, objetivo, tipo, duracion, maximo = 36 }) => {
  const desde = parseFecha(inicio);
  const hasta = parseFecha(objetivo);
  const d = Number(duracion);
  if (!desde || !hasta || hasta < desde || !Number.isInteger(d) || d < 1) return null;
  let cursor = desde;
  for (let numero = 1; numero <= maximo; numero++) {
    const siguiente = avanzar(cursor, tipo, d);
    if (!siguiente || siguiente <= cursor) return null;
    if (dias(siguiente, -1) >= hasta) return numero;
    cursor = siguiente;
  }
  return null;
};

export function CalendarioCuotasPreview({ filas, precioPeriodo = null }) {
  if (!filas?.length) return null;
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1.25, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Vista previa del contrato</Typography>
        <Chip label={`${filas.length} ${filas.length === 1 ? 'período' : 'períodos'}`} size="small" variant="outlined" />
      </Stack>
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, '& th, & td': { px: 1.5, py: 1, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }, '& th': { color: 'text.secondary', fontWeight: 700 } }}>
          <thead><tr><th>Cuota</th><th>Inicio del período</th><th>Fin del período</th><th>Emisión de venta</th><th>Vencimiento</th><th>Importe estimado</th></tr></thead>
          <tbody>{filas.map((fila) => (
            <tr key={fila.numero}>
              <td>{fila.numero}</td><td>{fila.inicio}</td><td>{fila.fin}</td><td>{fila.emision}</td><td>{fila.vencimiento}</td><td>{precioPeriodo == null || !Number.isFinite(Number(precioPeriodo)) ? '—' : `${Number(precioPeriodo).toFixed(2)}`}</td>
            </tr>
          ))}</tbody>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, py: 1 }}>
        Vencimientos mensuales en el día elegido; en meses cortos se usa el último día. Laravel confirma los importes al guardar.
      </Typography>
    </Box>
  );
}
