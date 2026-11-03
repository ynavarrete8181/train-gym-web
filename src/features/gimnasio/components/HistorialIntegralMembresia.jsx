import { useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip,
  CircularProgress, Divider, Stack, Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fecha = value => {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  const parts = text.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : text;
};
const fechaHora = value => {
  if (!value) return 'Fecha sin registrar';
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? String(value)
    : d.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
};
const dinero = value => {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n) : '—';
};
const tituloTipo = {
  CONTRATACION: 'Contratación original',
  MODIFICACION: 'Modificación administrativa',
  ACTUALIZAR_CONTRATO: 'Actualización contractual',
  RENOVACION_MANUAL: 'Renovación manual',
  CONGELAR: 'Congelación registrada',
  PROGRAMAR_CONGELACION: 'Congelación programada',
  REPROGRAMAR_CONGELACION: 'Cambio de fechas de congelación',
  CANCELAR_CONGELACION: 'Cancelación de congelación',
  REACTIVAR: 'Reactivación de membresía',
  CERRAR: 'Cierre de membresía',
  REABRIR: 'Reapertura de membresía',
};
const fechaCampo = campo => /fecha|inicio|fin|vigencia|vencimiento/i.test(campo);
const etiquetaCampo = {
  fecha_inicio: 'Inicio', fecha_fin: 'Fin', fecha_fin_prevista: 'Fin autorizado',
  fecha_fin_real: 'Último día suspendido', fecha_fin_original: 'Vencimiento anterior',
  fecha_fin_ajustada: 'Vencimiento proyectado', fecha_fin_anterior: 'Vencimiento anterior',
  fecha_fin_nueva: 'Nuevo vencimiento', dias_reconocidos: 'Días reconocidos',
  dias_previstos: 'Días previstos', fecha_regreso: 'Regreso efectivo',
  fecha_inicio_original: 'Inicio original', fecha_fin_propuesta: 'Vencimiento propuesto',
  periodo_id: 'Período agregado', cuota_id: 'Cuota agregada',
  numero_periodo_nuevo: 'Número del período nuevo',
  precio: 'Importe de renovación', tipo: 'Modalidad',
  sedes_autorizadas: 'Sedes autorizadas', sede_id: 'Sede principal',
  dias_gracia: 'Días de gracia', estado: 'Estado',
};
const valor = (input, campo) => {
  if (input === null || input === undefined || input === '') return '—';
  if (typeof input === 'boolean') return input ? 'Sí' : 'No';
  if (fechaCampo(campo) && typeof input === 'string') return fecha(input);
  if (campo === 'precio' || campo === 'precio_aplicado') return dinero(input);
  if (Array.isArray(input)) return input.map(x => typeof x === 'object'
    ? (x?.nombre || x?.id || 'Registro') : String(x)).join(', ') || '—';
  return typeof input === 'object' ? 'Consultar el registro' : String(input);
};

function Dato({ label, value, destacado = false }) {
  return <Box sx={{
    minWidth: 0, p: 1.35, borderRadius: 1.5, border: '1px solid',
    borderColor: destacado ? uiTokens.colores.acentoBorde : 'divider',
    bgcolor: destacado ? uiTokens.colores.acentoSuave : 'background.paper',
  }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
      {value}
    </Typography>
  </Box>;
}

function DetalleEvento({ evento }) {
  const d = evento.detalle || {};
  const cambios = d.cambios && typeof d.cambios === 'object' ? Object.entries(d.cambios) : [];
  const campos = evento.categoria === 'CICLO_VIDA'
    ? [
      ['fecha_regreso', d.fecha_regreso || (evento.tipo === 'REACTIVAR' ? evento.fecha_efectiva : null)],
      ['fecha_inicio', d.inicio || d.fecha_inicio || evento.suspension?.fecha_inicio],
      ['fecha_fin_prevista', d.fin_previsto || d.fecha_fin_prevista || evento.suspension?.fecha_fin_prevista],
      ['fecha_fin_real', d.fecha_fin_real || evento.suspension?.fecha_fin_real],
      ['dias_reconocidos', d.dias_reconocidos || (evento.tipo === 'REACTIVAR' ? evento.suspension?.dias_reconocidos : null)],
      ['dias_previstos', d.dias_previstos],
      ['fecha_fin_anterior', d.fecha_fin_anterior || d.fecha_fin_original || evento.suspension?.fecha_fin_original],
      ['fecha_fin_nueva', d.fecha_fin_nueva || d.fecha_fin_ajustada || evento.suspension?.fecha_fin_ajustada],
      ['tipo', d.tipo || evento.suspension?.tipo],
    ] : evento.tipo === 'RENOVACION_MANUAL'
      ? [
        ['numero_periodo_nuevo', d.numero_periodo_nuevo],
        ['fecha_inicio', d.fecha_inicio],
        ['fecha_fin', d.fecha_fin],
        ['precio', d.precio],
        ['periodo_id', d.periodo_id],
        ['cuota_id', d.cuota_id],
      ] : [];

  return <Stack spacing={1.25}>
    {evento.fecha_efectiva && <Typography variant="caption" color="text.secondary">
      Fecha efectiva: {fecha(evento.fecha_efectiva)}
    </Typography>}
    {evento.motivo && <Dato label="Motivo o justificación" value={evento.motivo}/>}
    {cambios.map(([campo, cambio]) => <Box key={campo} sx={{ minWidth: 0 }}>
      <Typography variant="caption" fontWeight={800}>
        {etiquetaCampo[campo] || campo.replaceAll('_', ' ')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1, mt: 0.5 }}>
        <Dato label="Anterior" value={valor(cambio?.antes, campo)}/>
        <Dato label="Nuevo" value={valor(cambio?.despues, campo)} destacado/>
      </Box>
    </Box>)}
    {d.antes && d.despues && <Box sx={{ display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
      <Dato label="Programación anterior"
        value={`${fecha(d.antes.fecha_inicio)} – ${fecha(d.antes.fecha_fin_prevista)}`}/>
      <Dato label="Programación nueva"
        value={`${fecha(d.despues.fecha_inicio)} – ${fecha(d.despues.fecha_fin_prevista)}`} destacado/>
    </Box>}
    {campos.filter(([, v]) => v !== undefined && v !== null).length > 0 &&
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' },
        gap: 1 }}>
        {campos.filter(([, v]) => v !== undefined && v !== null)
          .map(([campo, dato]) => <Dato key={campo}
            label={etiquetaCampo[campo] || campo} value={valor(dato, campo)}/>)}
      </Box>}
    {!cambios.length && !campos.some(([, v]) => v !== undefined && v !== null)
      && !evento.motivo && <Typography variant="body2" color="text.secondary">
        Movimiento registrado sin detalles adicionales.
      </Typography>}
  </Stack>;
}

/**
 * Lectura independiente de los dos historiales, sin reconstruir fechas
 * originales a partir del contrato actual.
 */
export function HistorialIntegralMembresia({ membresia }) {
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const id = membresia?.id;

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    setHistorial(null); setCargando(true); setError('');
    gimnasioServicio.obtenerHistorialIntegralMembresia(id)
      .then(datos => { if (vigente) setHistorial(datos); })
      .catch(e => {
        if (vigente) setError(Object.values(e?.response?.data?.errors || {}).flat().find(Boolean)
          || e?.response?.data?.mensaje || 'No se pudo consultar el historial.');
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id]);

  const eventos = useMemo(() => historial?.eventos || [], [historial]);
  const original = historial?.contratacion_original;
  const actual = historial?.vigencia_actual;
  const fechaFinOriginal = original?.fecha_fin || null;
  const nombrePlan = original?.plan_nombre || membresia?.plan_nombre || '—';

  return <Stack spacing={2}>
    {cargando && <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 2 }}>
      <CircularProgress size={20}/>
      <Typography variant="body2">Consultando historial contractual…</Typography>
    </Stack>}
    {error && <Alert severity="error">{error}</Alert>}
    {historial && <>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight={800}>Contrato y vigencia</Typography>
          <Typography variant="caption" color="text.secondary">
            Condiciones originalmente pactadas y estado efectivo actual, sin mezclar sus fechas.
          </Typography>
        </Box>
        <Box sx={{ p: 2, display: 'grid', gap: 1.25,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' } }}>
          <Dato label="Plan contratado" value={nombrePlan}/>
          <Dato label="Inicio original" value={fecha(original?.fecha_inicio)}/>
          <Dato label="Fin originalmente pactado" value={fecha(fechaFinOriginal)}/>
          <Dato label="Vigencia actual hasta" value={fecha(actual?.fecha_fin)} destacado/>
          <Dato label="Períodos contratados originalmente"
            value={original?.cantidad_periodos ?? 'No disponible'}/>
          <Dato label="Precio original por período" value={dinero(original?.precio_periodo)}/>
          <Dato label="Total bruto originalmente pactado"
            value={dinero(original?.total_bruto_referencial)}/>
          <Dato label="Estado actual" value={historial.estado_actual || '—'}/>
        </Box>
        {!original && <Alert severity="warning" sx={{ mx: 2, mb: 2 }}>
          No existe un registro histórico de contratación original para este contrato.
          No se puede afirmar cuál fue su fecha inicial de vencimiento.
        </Alert>}
        {original && fechaFinOriginal && actual?.fecha_fin
          && String(fechaFinOriginal).slice(0, 10) !== String(actual.fecha_fin).slice(0, 10) && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 2, display: 'block' }}>
            La vigencia actual incorpora los movimientos posteriores. El vencimiento originalmente pactado no se ha sobrescrito.
          </Typography>
        )}
      </Box>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
          <HistoryOutlinedIcon fontSize="small"/>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={800}>Historial integral de movimientos</Typography>
            <Typography variant="caption" color="text.secondary">
              Contratación, cambios administrativos, congelaciones, reactivaciones y renovaciones
            </Typography>
          </Box>
          <Chip size="small" variant="outlined" label={`${eventos.length} movimientos`}/>
        </Stack>
        <Box sx={{ p: { xs: 1.25, sm: 2 } }}>
          {!eventos.length && <Typography variant="body2" color="text.secondary">
            Todavía no existen movimientos auditados.
          </Typography>}
          <Stack spacing={1}>
            {eventos.map(evento => {
              const etiqueta = tituloTipo[evento.tipo] || evento.tipo.replaceAll('_', ' ').toLowerCase();
              const Icono = evento.tipo === 'RENOVACION_MANUAL' ? AutorenewOutlinedIcon
                : evento.categoria === 'CICLO_VIDA' ? AcUnitOutlinedIcon
                  : evento.tipo === 'CONTRATACION' ? EventAvailableOutlinedIcon : ReceiptLongOutlinedIcon;
              return <Accordion key={evento.id} disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important',
                  '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon/>}
                  sx={{ px: 1.5, '& .MuiAccordionSummary-content': { my: 1 } }}>
                  <Stack direction="row" gap={1.25} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                    <Icono sx={{ fontSize: 20, color: 'text.secondary' }}/>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                        {etiqueta}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fechaHora(evento.fecha)} · {evento.autor_nombre || 'Sistema / autor no disponible'}
                      </Typography>
                    </Box>
                    <Chip size="small" variant="outlined"
                      label={evento.categoria === 'CICLO_VIDA' ? 'Ciclo de vida' : 'Comercial'}/>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1.75, pb: 1.75 }}>
                  <Divider sx={{ mb: 1.25 }}/>
                  <DetalleEvento evento={evento}/>
                </AccordionDetails>
              </Accordion>;
            })}
          </Stack>
        </Box>
      </Box>
    </>}
  </Stack>;
}
