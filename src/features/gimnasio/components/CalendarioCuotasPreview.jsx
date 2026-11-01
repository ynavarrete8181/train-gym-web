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

export const generarVistaPreviaCuotas = ({ inicio, primerPago, cantidad, tipo, duracion }) => {
  const desde = parseFecha(inicio);
  const pago = parseFecha(primerPago);
  const n = Number(cantidad);
  const d = Number(duracion);
  if (!desde || !pago || !Number.isInteger(n) || n < 1 || n > 36 || !Number.isInteger(d) || d < 1 || pago < desde) return [];
  const desfase = Math.round((pago.getTime() - desde.getTime()) / 86400000);
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
      vencimiento: iso(dias(cursor, desfase)),
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

export function CalendarioCuotasPreview({ filas }) {
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
          <thead><tr><th>Cuota</th><th>Inicio del período</th><th>Fin del período</th><th>Emisión de venta</th><th>Vencimiento</th></tr></thead>
          <tbody>{filas.map((fila) => (
            <tr key={fila.numero}>
              <td>{fila.numero}</td><td>{fila.inicio}</td><td>{fila.fin}</td><td>{fila.emision}</td><td>{fila.vencimiento}</td>
            </tr>
          ))}</tbody>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, py: 1 }}>
        Fechas estimadas. Laravel confirma el calendario al guardar.
      </Typography>
    </Box>
  );
}
