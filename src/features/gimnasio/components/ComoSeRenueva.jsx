import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { ConfiguracionContrato } from './ConfiguracionContrato.jsx';
import { DialogPrecioRenovacion, montoPrecioRenovacion, textoPrecioRenovacion } from './DialogPrecioRenovacion.jsx';
import { importeDescuento } from './DialogDescuento.jsx';

const dinero = (v) => `$${Number(v || 0).toFixed(2)}`;
const fecha = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '—');
const sumarDias = (iso, dias) => {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
};

function Dato({ titulo, children, accion }) {
  return <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{titulo}</Typography>
    <Typography variant="body2" fontWeight={800} component="div">{children}</Typography>
    {accion}
  </Box>;
}

/**
 * Todo lo que define la próxima renovación en un solo lugar: si se renueva sola, cuándo,
 * con qué precio y qué descuento sigue, más los días de gracia. Andrea ve aquí cuánto
 * pagará el cliente en la renovación.
 */
export function ComoSeRenueva({ membresia, onActualizado }) {
  const [ciclo, setCiclo] = useState(null);
  const [descuentos, setDescuentos] = useState([]);
  const [precioAbierto, setPrecioAbierto] = useState(false);
  const [exito, setExito] = useState('');
  const [errorCarga, setErrorCarga] = useState(false);

  const cargar = useCallback(async () => {
    if (!membresia?.id) return;
    try {
      const [c, d] = await Promise.all([
        gimnasioServicio.obtenerCicloVidaMembresia(membresia.id),
        gimnasioServicio.obtenerDescuentosMembresia(membresia.id).catch(() => null),
      ]);
      setCiclo(c);
      setDescuentos(d?.descuentos || []);
      setErrorCarga(false);
    } catch {
      setCiclo(null);
      setErrorCarga(true);
    }
  }, [membresia?.id]);
  useEffect(() => { cargar(); }, [cargar, membresia?.renovacion_automatica]);

  const fin = String(membresia?.fecha_fin || '').slice(0, 10);
  const inicioSiguiente = sumarDias(fin, 1);
  const seProgramaEl = sumarDias(fin, -7);
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const renueva = Boolean(membresia?.renovacion_automatica);
  const precio = montoPrecioRenovacion(ciclo);
  // Al renovar, sigue el descuento general vigente al terminar el período actual (llegue hasta
  // su fin o no tenga fin): el sistema lo copia al nuevo período hasta que se finalice.
  const descuento = descuentos.find((d) => ['VIGENTE', 'PROGRAMADO'].includes(d.estado) && !d.sede_id
    && String(d.fecha_inicio).slice(0, 10) <= fin && (!d.fecha_fin || String(d.fecha_fin).slice(0, 10) >= fin));
  const importe = descuento ? importeDescuento(precio, descuento) : 0;

  return <Box sx={{ p: 1.75, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: '#fcfcfd' }}>
    <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1.5 }}>Cómo se renueva este contrato</Typography>
    {exito && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setExito('')}>{exito}</Alert>}
    {errorCarga && <Alert severity="warning" sx={{ mb: 1.5 }}
      action={<Button color="inherit" size="small" onClick={cargar}>Reintentar</Button>}>
      No se pudo consultar el precio y el descuento de la renovación.
    </Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2, mb: 1.75 }}>
      <Dato titulo="Próxima renovación">
        {!renueva
          ? <>No se renueva sola: vence el {fecha(fin)}</>
          : seProgramaEl >= hoy
            ? <>El {fecha(seProgramaEl)} se programa el período desde el {fecha(inicioSiguiente)}</>
            // La fecha de programación ya pasó: la renovación espera a que se pague lo pendiente.
            : String(membresia?.estado || '').toUpperCase() === 'PENDIENTE_PAGO'
              ? <>El período desde el {fecha(inicioSiguiente)} se programa cuando pague la cuota pendiente</>
              : <>El período desde el {fecha(inicioSiguiente)} se programa en la próxima revisión</>}
      </Dato>
      <Dato titulo="Precio al renovar"
        accion={ciclo?.puede_cambiar_precio ? <Button size="small" sx={{ mt: 0.5, px: 0, minWidth: 0, textTransform: 'none', fontWeight: 800 }}
          onClick={() => setPrecioAbierto(true)}>Cambiar precio</Button> : null}>
        {ciclo ? <>{dinero(precio)} <Typography component="span" variant="caption" color="text.secondary">({textoPrecioRenovacion(ciclo).replace(/ \(.*\)$/, '')})</Typography></> : '—'}
      </Dato>
      <Dato titulo="Descuento que sigue">
        {descuento
          ? <>{descuento.tipo === 'PORCENTAJE' ? `${Number(descuento.valor)} %` : dinero(descuento.valor)} · sigue al renovar hasta que se finalice</>
          : 'Sin descuento'}
      </Dato>
    </Box>
    {ciclo && <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.75, px: 1.25, py: 1, borderRadius: 1, bgcolor: '#f1f8f3', border: '1px solid #cfe4d6' }}>
      <Typography variant="body2" color="text.secondary">En la próxima renovación paga</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color: 'success.dark' }}>{dinero(Math.max(0, precio - importe))}</Typography>
      {importe > 0 && <Typography variant="caption" color="text.secondary">({dinero(precio)} − {dinero(importe)} de descuento)</Typography>}
    </Stack>}
    <ConfiguracionContrato membresia={membresia} onActualizado={onActualizado} />
    <DialogPrecioRenovacion abierto={precioAbierto} membresia={membresia} ciclo={ciclo}
      onCerrar={() => setPrecioAbierto(false)}
      onGuardado={async (mensaje) => { setPrecioAbierto(false); setExito(mensaje); await cargar(); await onActualizado?.(); }} />
  </Box>;
}
