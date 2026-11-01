import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

const dinero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(numero) : '—';
};

const fecha = (valor) => {
  if (!valor) return '—';
  const iso = String(valor).slice(0, 10);
  const partes = iso.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : iso;
};

const etiquetaDuracion = (tipo, cantidad) => {
  if (!tipo || !cantidad) return '—';
  const nombres = { DIAS: 'día(s)', SEMANAS: 'semana(s)', MESES: 'mes(es)', ANIOS: 'año(s)' };
  return `${cantidad} ${nombres[String(tipo).toUpperCase()] || String(tipo).toLowerCase()}`;
};

export function CondicionesHistoricasContrato({ membresia }) {
  if (!membresia?.id) return null;
  const condiciones = typeof membresia.condiciones_contratadas === 'string'
    ? (() => { try { return JSON.parse(membresia.condiciones_contratadas); } catch { return null; } })()
    : membresia.condiciones_contratadas;
  const registrada = condiciones && typeof condiciones === 'object';
  const elementos = registrada ? [
    ['Plan contratado', condiciones.plan_nombre],
    ['Modalidad contratada', condiciones.modalidad_nombre || 'Sin modalidad específica'],
    ['Duración pactada por período', etiquetaDuracion(condiciones.tipo_duracion, condiciones.duracion)],
    ['Frecuencia semanal', condiciones.uso_ilimitado ? 'Uso ilimitado' : `${condiciones.usos_por_semana ?? condiciones.dias_por_semana ?? '—'} uso(s) por semana`],
    ['Precio original por período', dinero(condiciones.precio_periodo)],
    ['Total bruto referencial', dinero(condiciones.total_bruto_referencial ?? condiciones.total_contractual)],
    ['Períodos contratados', condiciones.cantidad_periodos],
    ['Inicio del contrato', fecha(condiciones.fecha_inicio)],
    ['Fin del contrato', fecha(membresia.fecha_fin)],
    ['Primera fecha de pago', fecha(condiciones.fecha_primer_pago)],
    ['Vencimiento mensual', condiciones.programacion_vencimientos === 'DIA_FIJO_MENSUAL'
      ? `Día ${condiciones.dia_pago} de cada mes`
      : 'Según condiciones originales'],
  ] : [
    ['Plan registrado', membresia.plan_nombre],
    ['Modalidad registrada', membresia.modalidad_nombre || '—'],
    ['Precio aplicado registrado', dinero(membresia.precio_aplicado)],
    ['Inicio', fecha(membresia.fecha_inicio)],
    ['Fin', fecha(membresia.fecha_fin)],
  ];

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1} sx={{ px: 1.75, py: 1.25, bgcolor: 'action.hover' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>Condiciones comerciales del contrato</Typography>
          <Typography variant="caption" color="text.secondary">
            {registrada ? 'Valores originales conservados al momento de contratar.' : 'Contrato anterior sin snapshot de condiciones originales.'}
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" color={registrada ? 'success' : 'default'} label={registrada ? 'Condiciones históricas' : 'Contrato anterior'} />
      </Stack>
      <Divider />
      <Box sx={{ p: 1.75, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        {elementos.map(([titulo, valor]) => (
          <Box key={titulo} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{titulo}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{valor ?? '—'}</Typography>
          </Box>
        ))}
      </Box>
      {registrada && Array.isArray(condiciones.servicios_incluidos) && condiciones.servicios_incluidos.length > 0 && (
        <Box sx={{ px: 1.75, pb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Servicios originalmente incluidos</Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
            {condiciones.servicios_incluidos.map((servicio) => (
              <Chip key={servicio.id} size="small" variant="outlined" label={servicio.nombre} />
            ))}
          </Stack>
        </Box>
      )}
      {registrada && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.75, pb: 1.5 }}>
          Cambios futuros de precios o modalidades no modifican estas condiciones originales. Los pagos y descuentos efectivos se consultan en Ventas y Cartera.
        </Typography>
      )}
    </Box>
  );
}
