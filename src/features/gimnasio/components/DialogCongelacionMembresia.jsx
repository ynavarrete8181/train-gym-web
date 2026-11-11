import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fecha = (valor) => {
  const iso = String(valor || '').slice(0, 10);
  const partes = iso.split('-');
  return partes.length === 3 && partes.every(Boolean)
    ? `${partes[2]}/${partes[1]}/${partes[0]}` : '—';
};
const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const estadoTexto = {
  PROGRAMADA: 'Programada', VIGENTE: 'Vigente', FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada', NO_APLICADA: 'No aplicada',
};

function Indicador({ etiqueta, valor, destacado = false }) {
  return <Box sx={{
    minWidth: 0, px: 1.3, py: 0.75,
    minHeight: 56, borderRadius: 0.5,
    border: `1px solid ${destacado ? uiTokens.colores.acentoBorde : uiTokens.colores.borde}`,
    bgcolor: destacado ? uiTokens.colores.acentoSuave : 'background.paper',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  }}>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25, fontSize: 11 }}>
      {etiqueta}
    </Typography>
    <Typography variant="body2" fontWeight={800} sx={{ mt: 0.25, overflowWrap: 'anywhere', lineHeight: 1.3 }}>
      {valor}
    </Typography>
  </Box>;
}

function TituloReporte({ children }) {
  return <Box sx={{
    bgcolor: 'action.hover',
    border: '1px solid', borderColor: 'divider',
    borderRadius: 0.5, px: 1.25, py: 0.7, mb: 1,
  }}>
    <Typography variant="caption" fontWeight={900} color="text.primary" sx={{ letterSpacing: 0.2 }}>
      {children}
    </Typography>
  </Box>;
}

const leerDetalle = (movimiento) => {
  if (!movimiento?.detalle) return {};
  if (typeof movimiento.detalle === 'object') return movimiento.detalle;
  try { return JSON.parse(movimiento.detalle) || {}; } catch { return {}; }
};

/**
 * Componente visual sin escrituras: tanto la simulación como el historial
 * muestran exclusivamente datos del servicio Laravel, nunca recalculan días.
 */
function TablaCuotas({ cuotas, modalidad }) {
  const tabla = useTablaLocal(cuotas, {});

  return (
    <TablaGestion {...tabla.propsTabla}>
      <TableHead><TableRow>
        <TableCell>Cuota</TableCell><TableCell>Emisión</TableCell>
        <TableCell>Vencimiento</TableCell>
        {modalidad === 'FACTURACION' && <TableCell>Nuevo vencimiento</TableCell>}
        <TableCell>Resultado</TableCell>
      </TableRow></TableHead>
      <TableBody>{tabla.visibles.map(c => <TableRow key={c.cuota_id}>
        <TableCell>{c.numero}</TableCell>
        <TableCell>{fecha(c.emision_anterior)}</TableCell>
        <TableCell>{fecha(c.vencimiento_anterior)}</TableCell>
        {modalidad === 'FACTURACION' && <TableCell>{fecha(c.vencimiento_propuesto)}</TableCell>}
        <TableCell>{({
          PAGO_CONFIRMADO_CONSERVAR: 'Pago conservado',
          REPROGRAMACION_PROPUESTA: 'A reprogramar',
          VENTA_EMITIDA_REVISAR_CARTERA: 'Revisar Cartera',
          SIN_CAMBIOS: 'Sin cambios',
        })[c.accion] || c.accion || '—'}</TableCell>
      </TableRow>)}</TableBody>
    </TablaGestion>
  );
}

export function DialogCongelacionMembresia({
  abierto, modo = 'detalle', membresia, preview, suspension, movimiento, motivo = '',
  motivoCancelacion = '', onMotivoCancelacion, procesando = false,
  error = '', puedeGuardar = false, esEdicion = false,
  onCerrar, onGuardar, onCancelarProgramada, onEditarProgramada, onVerDetalle,
}) {
  const esPrevia = modo === 'preview';
  const esExito = modo === 'exito';
  const datosMovimiento = leerDetalle(movimiento);
  const datos = esPrevia || esExito ? (preview || {}) : {
    ...(datosMovimiento || {}), ...(suspension || {}),
  };
  const estado = esPrevia
    ? preview?.programable ? 'PROGRAMADA' : preview?.confirmable ? 'CONFIRMABLE' : 'REVISAR'
    : esExito ? (datos.estado || 'PROGRAMADA') : suspension?.estado;
  const modalidad = datos.tipo || suspension?.tipo || 'TIEMPO';
  const inicio = datos.inicio || datos.fecha_inicio || suspension?.fecha_inicio;
  const fin = datos.fin_previsto || datos.fecha_fin_prevista || suspension?.fecha_fin_prevista;
  const dias = esPrevia || esExito
    ? (datos.dias_previstos ?? '—')
    : (suspension?.dias_previstos ?? datosMovimiento.dias_previstos ?? '—');
  const finalizada = !esPrevia && !esExito && suspension?.estado === 'FINALIZADA';
  const cancelada = !esPrevia && !esExito && ['CANCELADA', 'NO_APLICADA'].includes(suspension?.estado);
  const diasReconocidos = finalizada ? (suspension?.dias_reconocidos ?? '—') : null;
  const fechaOriginal = datos.fecha_fin_original;
  const fechaAjustada = datos.fecha_fin_ajustada || datos.fecha_fin_propuesta;
  const financiero = datos.impacto_financiero;
  const puedeCancelar = modo === 'detalle' && suspension?.estado === 'PROGRAMADA';
  const hoyPartes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const parte = nombre => hoyPartes.find(item => item.type === nombre)?.value;
  const hoyEcuador = [parte('year'), parte('month'), parte('day')].join('-');
  const puedeEditar = puedeCancelar && suspension?.tipo === 'TIEMPO'
    && String(suspension?.fecha_inicio || '').slice(0, 10) > hoyEcuador;
  const bloqueo = datos.motivo_bloqueo || datosMovimiento.motivo_no_aplicacion;

  const titulo = esPrevia ? 'Vista previa de congelación'
    : esExito ? (esEdicion ? 'Programación actualizada correctamente' : 'Congelación registrada correctamente')
      : 'Detalle de congelación';
  const estadoLabel = estado === 'CONFIRMABLE' ? 'Lista para registrar'
    : estado === 'REVISAR' ? 'Requiere revisión'
      : estadoTexto[estado] || estado || '—';

  return <Dialog open={Boolean(abierto)} onClose={procesando ? undefined : onCerrar}
    fullWidth maxWidth="lg" scroll="paper" aria-labelledby="dialog-congelacion-titulo"
    slotProps={{ paper: { sx: {
      borderRadius: 2,
      overflow: 'hidden',
      width: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 48px)', lg: 'min(1180px, calc(100% - 64px))' },
      maxWidth: 1180,
      maxHeight: '90vh',
      m: { xs: 1.5, sm: 3 },
    } } }}>
    <DialogTitle id="dialog-congelacion-titulo" sx={{ ...formStyles.modalHeader, py: 1.25 }}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave,
        color: uiTokens.colores.textoFuerte, boxShadow: 'none',
        border: `1px solid ${uiTokens.colores.acentoBorde}` }}>
        {esExito ? <CheckCircleOutlineOutlinedIcon /> : <AcUnitOutlinedIcon />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>
          {titulo}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {membresia?.codigo_contrato || 'Membresía'} · Movimiento contractual
        </Typography>
      </Box>
      <Chip variant="outlined" size="small"
        color={estado === 'VIGENTE' || estado === 'REVISAR' || estado === 'NO_APLICADA'
          ? 'warning' : estado === 'FINALIZADA' || esExito ? 'success' : 'default'}
        label={estadoLabel} />
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1.5, sm: 1.75 } }}>
      <TituloReporte>Período y modalidad</TituloReporte>
      <Box sx={{ display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(4, minmax(0,1fr))' },
        gap: 1, mb: 1.5 }}>
        <Indicador etiqueta="Desde" valor={fecha(inicio)}/>
        <Indicador etiqueta="Hasta (incluido)" valor={fecha(fin)}/>
        <Indicador etiqueta="Días previstos" valor={dias === '—' ? dias : `${dias} días`}/>
        <Indicador etiqueta="Modalidad" valor={modalidad === 'TIEMPO' ? 'Tiempo' : 'Facturación'}/>
      </Box>
      {!esPrevia && !esExito && (
        <Box sx={{ mb: 1.25 }}>
          {finalizada ? <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 1 }}>
              <Indicador etiqueta="Días realmente reconocidos"
                valor={diasReconocidos === '—' ? diasReconocidos : `${diasReconocidos} días`} destacado/>
              <Indicador etiqueta="Fecha efectiva de regreso" valor={fecha(suspension?.fecha_regreso)}/>
              <Indicador etiqueta="Último día de congelación" valor={fecha(suspension?.fecha_fin_real)}/>
              <Indicador etiqueta="Reactivado por" valor={suspension?.autor_cierre || 'Sistema (automático)'}/>
            </Box>
          </> : <Typography variant="caption" color="text.secondary">
            {cancelada
              ? 'Solicitud cancelada o no aplicada: los días previstos no generan compensación.'
              : 'Los días reconocidos se determinarán al finalizar la congelación. No se deben confundir con los previstos.'}
          </Typography>}
        </Box>
      )}
      <TituloReporte>Vigencia contractual</TituloReporte>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))' }, gap: 1 }}>
        <Indicador etiqueta="Vencimiento anterior" valor={fecha(fechaOriginal)}/>
        <Indicador etiqueta={finalizada ? 'Nuevo vencimiento efectivo'
          : cancelada ? 'Proyección no aplicada' : 'Vencimiento proyectado'}
          valor={cancelada ? 'Sin cambio por esta solicitud' : fecha(fechaAjustada)}
          destacado={finalizada}/>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6, lineHeight: 1.3 }}>
        {cancelada ? 'La solicitud no modificó la vigencia ni los cobros.'
          : finalizada ? 'La vigencia efectiva quedó registrada al reactivar. Los pagos confirmados se conservan.'
            : modalidad === 'TIEMPO'
              ? 'El calendario de cobros se conserva. La extensión definitiva se consolida al reactivar.'
              : 'La reprogramación de cuotas depende de las validaciones financieras de Laravel.'}
      </Typography>

      {(motivo || movimiento?.motivo) && <Box sx={{ mt: 1.25 }}>
        <TituloReporte>Motivo registrado</TituloReporte>
        <Box sx={{ px: 1.3, py: 0.9, border: `1px solid ${uiTokens.colores.borde}`,
          borderRadius: 0.5, bgcolor: uiTokens.colores.primarioSuave }}>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{motivo || movimiento?.motivo}</Typography>
        </Box>
      </Box>}

      {!esPrevia && !esExito && <Box sx={{ mt: 1.25 }}>
        <TituloReporte>Trazabilidad</TituloReporte>
        <Box sx={{ display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' },
          gap: 1 }}>
          <Indicador etiqueta="Registrado por" valor={suspension?.autor_registro || movimiento?.autor_nombre || 'Usuario no disponible'}/>
          <Indicador etiqueta="Fecha de registro" valor={fecha(suspension?.registrado_at || movimiento?.created_at)}/>
          {suspension?.fecha_cierre && <Indicador etiqueta="Cerrado por"
            valor={suspension.autor_cierre || 'Sistema (automático)'}/>}
          {suspension?.fecha_cierre && <Indicador etiqueta="Fecha del movimiento de cierre"
            valor={fecha(suspension.fecha_cierre)}/>}
        </Box>
        {suspension?.motivo_cierre && <Box sx={{
          mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 0.5,
          px: 1.3, py: 0.8,
        }}>
          <Typography variant="caption" color="text.secondary">
            {cancelada ? 'Motivo de cancelación' : 'Justificación de reactivación'}
          </Typography>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{suspension.motivo_cierre}</Typography>
        </Box>}
      </Box>}

      {financiero && <>
        <Box sx={{ mt: 1.25 }}><TituloReporte>Ventas y cartera</TituloReporte></Box>
        <Box sx={{ display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))' },
          gap: 1 }}>
          <Indicador etiqueta="Pagos confirmados" valor={dinero(financiero.pagos_confirmados)}/>
          <Indicador etiqueta="Saldo emitido" valor={dinero(financiero.deuda_emitida)}/>
          <Indicador etiqueta="Cuotas reprogramables" valor={financiero.cuotas_reprogramables ?? 0}/>
        </Box>
        {(financiero.cuotas || []).length > 0 && <>
          <Box sx={{ mt: 1.25 }}><TituloReporte>Detalle de cuotas</TituloReporte></Box>
          <TablaCuotas cuotas={financiero.cuotas} modalidad={modalidad} />
        </>}
      </>}

      {bloqueo && <Alert severity="warning" sx={{ mt: 2 }}>{bloqueo}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {esExito && <Alert severity="success" sx={{ mt: 2 }}>
        El movimiento quedó registrado en el historial de la membresía.
      </Alert>}
      {esPrevia && !bloqueo && <Alert severity="info" sx={{ mt: 2 }}>
        Esta simulación no modifica pagos, ventas ni la vigencia del contrato.
      </Alert>}
      {puedeCancelar && <>
        <Divider sx={{ my: 2 }}/>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
          Cancelar vacaciones programadas
        </Typography>
        <TextField fullWidth size="small" multiline minRows={2}
          label="Justificación de cancelación" value={motivoCancelacion}
          onChange={e => onMotivoCancelacion?.(e.target.value)}
          helperText="El movimiento quedará auditado. No afecta cuotas ni pagos."/>
      </>}
    </DialogContent>
    <Divider />
    <DialogActions sx={{ ...dbanuStyles.dialogActions, flexWrap: 'wrap', gap: 1.5 }}>
      <BotonCancelar texto="Cerrar" onClick={onCerrar} disabled={procesando}/>
      {puedeEditar && onEditarProgramada && <Button variant="outlined"
        startIcon={<EditOutlinedIcon/>} sx={dbanuStyles.secondaryButtonRevive}
        disabled={procesando} onClick={onEditarProgramada}>Editar fechas</Button>}
      {puedeCancelar && <Button variant="outlined" color="error"
        sx={dbanuStyles.cancelButton}
        disabled={procesando || motivoCancelacion.trim().length < 8}
        onClick={onCancelarProgramada}>Cancelar programación</Button>}
      {esExito && onVerDetalle && <Button variant="outlined"
        sx={dbanuStyles.secondaryButtonRevive} onClick={onVerDetalle}>
        Ver detalle
      </Button>}
      {esPrevia && (preview?.programable || preview?.confirmable) && onGuardar && <BotonGuardar
        texto="Guardar" guardando={procesando} disabled={!puedeGuardar} onClick={onGuardar}/>}
    </DialogActions>
  </Dialog>;
}
