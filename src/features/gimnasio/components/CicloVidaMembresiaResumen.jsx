import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { uiTokens } from '../../../styles/uiTokens.js';

/**
 * Resumen informativo. Las operaciones auditadas se realizan desde
 * GestionCicloVidaMembresia, nunca desde la edición convencional.
 */
export function CicloVidaMembresiaResumen({ membresia }) {
  if (!membresia?.id) return null;

  const estado = String(membresia.estado || '').toUpperCase();
  const cuotas = Array.isArray(membresia.cuotas) ? membresia.cuotas : [];
  const tieneCalendario = membresia.cantidad_periodos_contratados != null;
  const pendientes = cuotas.filter((cuota) => String(cuota.estado).toUpperCase() === 'PROGRAMADA').length;
  const fecha = (valor) => {
    const partes = String(valor || '').slice(0, 10).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : '—';
  };

  const terminal = ['CANCELADA', 'VENCIDA'].includes(estado);
  const descripcion = terminal
    ? 'El contrato está finalizado. Si el deportista regresa, corresponde evaluar una recontratación; una reapertura será excepcional.'
    : estado === 'CONGELADA'
      ? 'La membresía está congelada. Consulta el historial y solicita la reactivación desde Gestión del ciclo de vida.'
      : 'Las congelaciones pueden previsualizarse. La confirmación depende de las reglas de vigencia y conciliación financiera de Laravel.';

  return (
    <Box sx={{ border: '1px solid', borderColor: uiTokens.colores.borde, borderRadius: 2,
      bgcolor: 'background.paper', overflow: 'hidden', mt: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between" spacing={1} sx={{ p: 1.75, bgcolor: uiTokens.colores.primarioSuave }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={800}>Gestión del ciclo de vida</Typography>
          <Typography variant="caption" color="text.secondary">
            Resumen contractual y acceso a congelación/reactivación con validación financiera.
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" label="Ciclo de vida" />
      </Stack>
      <Divider />
      <Box sx={{ p: 1.75 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.75 }}>
          <Stack direction="row" gap={1} alignItems="flex-start">
            <EventAvailableOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }}/>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">Vigencia registrada</Typography>
              <Typography variant="body2" fontWeight={700}>{fecha(membresia.fecha_inicio)} – {fecha(membresia.fecha_fin)}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="flex-start">
            <ReceiptLongOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }}/>
            <Box>
              <Typography variant="caption" color="text.secondary">Tipo de contrato</Typography>
              <Typography variant="body2" fontWeight={700}>
                {tieneCalendario ? `A plazo fijo · ${membresia.cantidad_periodos_contratados} períodos` : 'Contrato sin calendario fijo de cuotas'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="flex-start">
            <PauseCircleOutlineOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }}/>
            <Box>
              <Typography variant="caption" color="text.secondary">Cuotas programadas sin emitir</Typography>
              <Typography variant="body2" fontWeight={700}>
                {tieneCalendario ? pendientes : 'No aplica'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Typography variant="body2" sx={{ mt: 1.5 }}>{descripcion}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          Los pagos y saldos reales se consultan en Ventas y Cartera. El estado es informativo: congelar y reactivar requiere un movimiento auditado y la validación del backend.
        </Typography>
      </Box>
    </Box>
  );
}
