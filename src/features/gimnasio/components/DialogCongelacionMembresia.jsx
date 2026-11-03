import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
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
    minWidth: 0, p: 1.5, borderRadius: 1.5,
    border: `1px solid ${destacado ? uiTokens.colores.acentoBorde : uiTokens.colores.borde}`,
    bgcolor: destacado ? uiTokens.colores.acentoSuave : 'background.paper',
  }}>
    <Typography variant="caption" color="text.secondary" display="block">{etiqueta}</Typography>
    <Typography variant="subtitle1" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
      {valor}
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
export function DialogCongelacionMembresia({
  abierto, modo = 'detalle', membresia, preview, suspension, movimiento, motivo = '',
  motivoCancelacion = '', onMotivoCancelacion, procesando = false,
  onCerrar, onGuardar, onCancelarProgramada, onVerDetalle,
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
  const dias = datos.dias_previstos
    ?? (esPrevia ? preview?.dias_previstos : (suspension?.dias_reconocidos || datosMovimiento.dias_previstos))
    ?? '—';
  const fechaOriginal = datos.fecha_fin_original;
  const fechaAjustada = datos.fecha_fin_ajustada || datos.fecha_fin_propuesta;
  const financiero = datos.impacto_financiero;
  const puedeCancelar = modo === 'detalle' && suspension?.estado === 'PROGRAMADA';
  const bloqueo = datos.motivo_bloqueo || datosMovimiento.motivo_no_aplicacion;

  const titulo = esPrevia ? 'Vista previa de congelación'
    : esExito ? 'Congelación registrada correctamente'
      : 'Detalle de congelación';
  const estadoLabel = estado === 'CONFIRMABLE' ? 'Lista para registrar'
    : estado === 'REVISAR' ? 'Requiere revisión'
      : estadoTexto[estado] || estado || '—';

  return <Dialog open={Boolean(abierto)} onClose={procesando ? undefined : onCerrar}
    fullWidth maxWidth="md" scroll="paper" aria-labelledby="dialog-congelacion-titulo"
    PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden', maxHeight: '90vh' } }}>
    <DialogTitle id="dialog-congelacion-titulo" sx={{ ...formStyles.modalHeader, py: 1.75 }}>
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
    <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="subtitle2" fontWeight={850} sx={{ mb: 1.25 }}>
        Período y modalidad
      </Typography>
      <Box sx={{ display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(4, minmax(0,1fr))' },
        gap: 1.25, mb: 2 }}>
        <Indicador etiqueta="Desde" valor={fecha(inicio)}/>
        <Indicador etiqueta="Hasta (incluido)" valor={fecha(fin)}/>
        <Indicador etiqueta="Días" valor={dias === '—' ? dias : `${dias} días`} destacado />
        <Indicador etiqueta="Modalidad" valor={modalidad === 'TIEMPO' ? 'Tiempo' : 'Facturación'}/>
      </Box>
      <Typography variant="subtitle2" fontWeight={850} sx={{ mb: 1.25 }}>
        Vigencia de la membresía
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))' }, gap: 1.25 }}>
        <Indicador etiqueta="Vencimiento original" valor={fecha(fechaOriginal)}/>
        <Indicador etiqueta="Vencimiento estimado" valor={fecha(fechaAjustada)} destacado/>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {modalidad === 'TIEMPO'
          ? 'Se conserva el calendario de cobros. La extensión definitiva se consolida al reactivar.'
          : 'La reprogramación de cuotas depende de las validaciones financieras de Laravel.'}
      </Typography>

      {(motivo || movimiento?.motivo) && <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" fontWeight={850} sx={{ mb: 0.75 }}>
          Motivo registrado
        </Typography>
        <Box sx={{ p: 1.5, border: `1px solid ${uiTokens.colores.borde}`,
          borderRadius: 1.5, bgcolor: uiTokens.colores.primarioSuave }}>
          <Typography variant="body2">{motivo || movimiento?.motivo}</Typography>
        </Box>
      </Box>}

      {financiero && <>
        <Divider sx={{ my: 2 }}/>
        <Typography variant="subtitle2" fontWeight={850} sx={{ mb: 1.25 }}>
          Ventas y Cartera
        </Typography>
        <Box sx={{ display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))' },
          gap: 1.25 }}>
          <Indicador etiqueta="Pagos confirmados" valor={dinero(financiero.pagos_confirmados)}/>
          <Indicador etiqueta="Saldo emitido" valor={dinero(financiero.deuda_emitida)}/>
          <Indicador etiqueta="Cuotas reprogramables" valor={financiero.cuotas_reprogramables ?? 0}/>
        </Box>
        {(financiero.cuotas || []).length > 0 && <>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 1 }}>Detalle de cuotas</Typography>
          <TableContainer sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5 }}>
            <Table size="small" sx={dbanuStyles.table}>
              <TableHead><TableRow>
                <TableCell>Cuota</TableCell><TableCell>Emisión</TableCell>
                <TableCell>Vencimiento</TableCell>
                {modalidad === 'FACTURACION' && <TableCell>Nuevo vencimiento</TableCell>}
                <TableCell>Resultado</TableCell>
              </TableRow></TableHead>
              <TableBody>{financiero.cuotas.map(c => <TableRow key={c.cuota_id}>
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
            </Table>
          </TableContainer>
        </>}
      </>}

      {bloqueo && <Alert severity="warning" sx={{ mt: 2 }}>{bloqueo}</Alert>}
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
      <Button variant="outlined" startIcon={<CloseOutlinedIcon/>}
        sx={{ ...dbanuStyles.backButton }} onClick={onCerrar} disabled={procesando}>Cerrar</Button>
      {puedeCancelar && <Button variant="outlined" color="error"
        disabled={procesando || motivoCancelacion.trim().length < 8}
        onClick={onCancelarProgramada}>Cancelar programación</Button>}
      {esExito && onVerDetalle && <Button variant="outlined" onClick={onVerDetalle}>
        Ver detalle
      </Button>}
      {esPrevia && (preview?.programable || preview?.confirmable) && onGuardar && <BotonGuardar
        texto="Guardar" guardando={procesando} onClick={onGuardar}/>}
    </DialogActions>
  </Dialog>;
}
