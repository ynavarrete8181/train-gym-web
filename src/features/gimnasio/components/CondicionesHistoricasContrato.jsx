import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const dinero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(numero)
    : '—';
};

const fecha = (valor) => {
  if (!valor) return '—';
  const iso = String(valor).slice(0, 10);
  const partes = iso.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : iso;
};

const fechaHora = (valor) => {
  if (!valor) return 'Fecha no disponible';
  const date = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? String(valor)
    : date.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
};

const duracion = (tipo, cantidad) => {
  const unidades = { DIAS: 'día(s)', SEMANAS: 'semana(s)', MESES: 'mes(es)', ANIOS: 'año(s)' };
  return tipo && cantidad ? `${cantidad} ${unidades[String(tipo).toUpperCase()] || tipo}` : '—';
};

const etiquetas = {
  estado: 'Estado de la membresía',
  dias_gracia: 'Días de gracia',
  sede_id: 'Sede principal',
  sedes_autorizadas: 'Sedes autorizadas',
  fecha_inicio: 'Fecha de inicio',
  fecha_fin: 'Fecha de finalización',
  dia_pago: 'Día de pago',
  renovacion_automatica: 'Renovación automática',
  modalidad_id: 'Modalidad',
  precio_aplicado: 'Precio aplicado',
  fecha_congelacion_inicio: 'Inicio de congelación',
  fecha_congelacion_fin: 'Fin de congelación',
  descuentos: 'Descuentos',
};

const presentarValor = (valor, campo) => {
  if (valor === null || valor === undefined || valor === '') return 'No registrado';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (['fecha_inicio', 'fecha_fin', 'fecha_congelacion_inicio', 'fecha_congelacion_fin'].includes(campo)) return fecha(valor);
  if (campo === 'precio_aplicado') return dinero(valor);
  if (Array.isArray(valor)) {
    if (!valor.length) return 'Ninguno';
    if (valor.every((item) => typeof item !== 'object')) return valor.join(', ');
    return valor.map((item) => Object.entries(item).map(([clave, dato]) =>
      `${clave}: ${typeof dato === 'boolean' ? (dato ? 'Sí' : 'No') : dato ?? '—'}`).join(' · ')).join(' | ');
  }
  return String(valor);
};

const dato = (titulo, valor) => (
  <Box key={titulo} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>{titulo}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{valor ?? '—'}</Typography>
  </Box>
);

export function CondicionesHistoricasContrato({ membresia }) {
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  if (!membresia?.id) return null;

  let condiciones = membresia.condiciones_contratadas;
  if (typeof condiciones === 'string') {
    try { condiciones = JSON.parse(condiciones); } catch { condiciones = null; }
  }
  const original = condiciones && typeof condiciones === 'object' ? condiciones : null;
  const historial = Array.isArray(membresia.historial_condiciones)
    ? [...membresia.historial_condiciones].sort((a, b) => Number(b.version) - Number(a.version))
    : [];
  const modificaciones = historial.filter((registro) => Object.keys(registro.condiciones?.cambios || {}).length > 0);
  const precioUnitario = original?.precio_periodo ?? membresia.precio_aplicado;
  const cantidadPeriodos = original?.cantidad_periodos ?? membresia.cantidad_periodos_contratados;
  const valorTotal = original?.total_bruto_referencial
    ?? original?.total_contractual
    ?? (cantidadPeriodos && precioUnitario != null ? Number(cantidadPeriodos) * Number(precioUnitario) : null);
  const diaPago = original?.dia_pago ?? membresia.dia_pago;

  const detalles = [
    ['Duración de cada período', duracion(original?.tipo_duracion ?? membresia.modalidad_tipo_duracion, original?.duracion ?? membresia.modalidad_duracion)],
    ['Frecuencia de uso', original?.uso_ilimitado ? 'Ilimitado' : `${original?.usos_por_semana ?? original?.dias_por_semana ?? membresia.modalidad_usos_por_semana ?? '—'} usos por semana`],
    ['Períodos contratados', cantidadPeriodos ?? '—'],
    ['Precio pactado por período', dinero(precioUnitario)],
    ['Total bruto del contrato', dinero(valorTotal)],
    ['Primera fecha de pago', fecha(original?.fecha_primer_pago)],
    ['Día habitual de vencimiento', diaPago ? `Día ${diaPago} de cada mes` : 'No registrado'],
  ];

  return (
    <Stack spacing={2.25}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 1.75, md: 2.25 }, py: 1.75, bgcolor: 'action.hover' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Resumen de la membresía</Typography>
              <Typography variant="body2" color="text.secondary">Condiciones pactadas al momento de la contratación.</Typography>
            </Box>
            <Chip label={original ? 'Contrato original conservado' : 'Contrato anterior'} size="small"
              variant="outlined" color={original ? 'success' : 'default'} />
          </Stack>
        </Box>
        <Box sx={{ p: { xs: 1.75, md: 2.25 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">Plan contratado</Typography>
              <Typography variant="body1" fontWeight={800}>{original?.plan_nombre || membresia.plan_nombre || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{original?.modalidad_nombre || membresia.modalidad_nombre || 'Sin modalidad'}</Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <EventAvailableOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }}/>
                <Typography variant="caption" color="text.secondary">Vigencia del contrato</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                {fecha(original?.fecha_inicio ?? membresia.fecha_inicio)} – {fecha(membresia.fecha_fin)}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <Inventory2OutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }}/>
                <Typography variant="caption" color="text.secondary">Períodos contratados</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>{cantidadPeriodos ?? '—'}</Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <PaymentsOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }}/>
                <Typography variant="caption" color="text.secondary">Total bruto pactado</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>{dinero(valorTotal)}</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 1.75 }}/>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {diaPago ? `Vencimiento habitual: día ${diaPago} de cada mes.` : 'Los vencimientos constan en el calendario de cuotas.'}
            </Typography>
            <Button size="small" variant="text" onClick={() => setDetallesAbiertos((actual) => !actual)}
              endIcon={<ExpandMoreOutlinedIcon sx={{ transform: detallesAbiertos ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>}
              sx={{ ...dbanuStyles.secondaryButtonRevive, border: 'none', minHeight: 32 }}>
              {detallesAbiertos ? 'Ocultar condiciones' : 'Ver todas las condiciones'}
            </Button>
          </Stack>
          {detallesAbiertos && (
            <Box sx={{ mt: 1.75, pt: 1.75, borderTop: 1, borderColor: 'divider',
              display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              {detalles.map(([titulo, valor]) => dato(titulo, valor))}
              {Array.isArray(original?.servicios_incluidos) && original.servicios_incluidos.length > 0 && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">Servicios incluidos originalmente</Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {original.servicios_incluidos.map((servicio, indice) => (
                      <Chip key={servicio.id ?? indice} size="small" variant="outlined" label={servicio.nombre || 'Servicio'} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 1.75, md: 2.25 }, py: 1.75, bgcolor: 'action.hover' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }}/>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800}>Historial de modificaciones</Typography>
              <Typography variant="body2" color="text.secondary">Quién realizó cada cambio, cuándo y qué se modificó.</Typography>
            </Box>
            <Chip label={`${modificaciones.length} ${modificaciones.length === 1 ? 'cambio' : 'cambios'}`} size="small" variant="outlined"/>
          </Stack>
        </Box>

        {modificaciones.length === 0 ? (
          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="body2" fontWeight={700}>No se han registrado modificaciones al contrato.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {historial.length
                ? 'Se conserva el registro de contratación original. Cuando se modifiquen datos administrativos, aparecerán aquí.'
                : 'Las condiciones originales están disponibles arriba. Los nuevos cambios administrativos se mostrarán aquí cuando se registren.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.25}>
              {modificaciones.map((registro) => {
                const cambios = Object.entries(registro.condiciones?.cambios || {});
                return (
                  <Accordion key={registro.id || registro.version} disableGutters elevation={0}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important',
                      '&:before': { display: 'none' }, overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}
                      sx={{ px: 1.75, py: 0.5, '& .MuiAccordionSummary-content': { my: 1 } }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800}>
                          {cambios.length === 1 ? etiquetas[cambios[0][0]] || cambios[0][0] : `${cambios.length} datos modificados`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {fechaHora(registro.registrado_at)} · {registro.autor_nombre || 'Usuario no identificado'}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 1.75, pt: 0, pb: 1.75 }}>
                      <Divider sx={{ mb: 1.25 }}/>
                      <Stack spacing={1.25}>
                        {cambios.map(([campo, cambio]) => (
                          <Box key={campo} sx={{ minWidth: 0 }}>
                            <Typography variant="caption" fontWeight={800}>{etiquetas[campo] || campo}</Typography>
                            <Box sx={{ mt: 0.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                              <Box sx={{ p: 1.1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                {dato('Anterior', presentarValor(cambio.antes, campo))}
                              </Box>
                              <Box sx={{ p: 1.1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                {dato('Nuevo', presentarValor(cambio.despues, campo))}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                        {registro.motivo && dato('Motivo', registro.motivo)}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
