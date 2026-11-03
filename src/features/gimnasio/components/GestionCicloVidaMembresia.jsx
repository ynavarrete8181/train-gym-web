import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonVistaPrevia } from '../../../components/common/BotonVistaPrevia.jsx';
import { formStyles } from '../../../styles/formStyles.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fechaLocal = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find(parte => parte.type === tipo)?.value;
  return [valor('year'), valor('month'), valor('day')].join('-');
};
const fechaLegible = (v) => {
  const a = String(v || '').slice(0, 10).split('-');
  return a.length === 3 ? [a[2], a[1], a[0]].join('/') : '—';
};
const leerDetalleMovimiento = (movimiento) => {
  if (!movimiento?.detalle) return {};
  if (typeof movimiento.detalle !== 'string') return movimiento.detalle;
  try { return JSON.parse(movimiento.detalle) || {}; }
  catch { return {}; }
};
const mensajeError = (e) => {
  const errores = e?.response?.data?.errors || e?.response?.data?.errores;
  const primero = errores && Object.values(errores).flat().find(Boolean);
  return primero || e?.response?.data?.mensaje || 'No fue posible completar la operación.';
};

/**
 * Fase 3: previsualización de cuotas, ventas y pagos, y congelación financiera
 * validada exclusivamente por Laravel. Los pagos confirmados son inmutables.
 */
export function GestionCicloVidaMembresia({ membresia, onVolver, onActualizado }) {
  const [ciclo, setCiclo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [operacion, setOperacion] = useState('');
  const [tipo, setTipo] = useState('TIEMPO');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [detalleSuspension, setDetalleSuspension] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [motivoCodigo, setMotivoCodigo] = useState('');
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [previewReactivacion, setPreviewReactivacion] = useState(null);
  const [inicio, setInicio] = useState(fechaLocal());
  const [fin, setFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [preview, setPreview] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = useCallback(async () => {
    if (!membresia?.id) return;
    setCargando(true);
    try {
      setCiclo(await gimnasioServicio.obtenerCicloVidaMembresia(membresia.id));
      setError('');
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [membresia?.id]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    let activo = true;
    gimnasioServicio.listarMotivosCicloVida({ solo_activos: true })
      .then(items => { if (activo) setMotivosCatalogo(Array.isArray(items) ? items : []); })
      .catch(() => {
        if (activo) {
          setMotivosCatalogo([]);
          setError('No se pudo consultar el catálogo de motivos. Verifica que la migración de motivos del ciclo de vida esté aplicada.');
        }
      });
    return () => { activo = false; };
  }, []);

  const simular = async () => {
    setProcesando(true); setError(''); setExito(''); setPreview(null);
    try {
      const resultado = await gimnasioServicio.previsualizarCongelacion(membresia.id, {
        tipo, fecha_inicio: inicio, fecha_fin: fin,
      });
      setPreview(resultado);
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const guardarCongelacion = async () => {
    if (!motivoCodigo || !inicio || !fin || fin < inicio || motivo.trim().length < 8) {
      setError('Selecciona el motivo, ingresa fechas válidas y una justificación de al menos 8 caracteres.');
      return;
    }
    if (procesando) return;
    setProcesando(true); setError(''); setExito('');
    try {
      // La vista previa nunca sustituye la autorización de Laravel.
      // Si no se solicitó manualmente, Guardar la obtiene antes de registrar.
      const calculo = preview || await gimnasioServicio.previsualizarCongelacion(membresia.id, {
        tipo, fecha_inicio: inicio, fecha_fin: fin,
      });
      setPreview(calculo);
      if (!calculo?.confirmable && !calculo?.programable) {
        setError(calculo?.motivo_bloqueo || 'La membresía no cumple los requisitos para registrar la congelación.');
        return;
      }
      const datos = {
        tipo, fecha_inicio: inicio, fecha_fin: fin,
        motivo: motivo.trim(), motivo_codigo: motivoCodigo,
      };
      if (calculo.programable) {
        await gimnasioServicio.programarCongelacionTiempo(membresia.id, datos);
        setExito('Congelación programada. El contrato permanecerá activo hasta la fecha autorizada.');
      } else {
        await gimnasioServicio.congelarMembresia(membresia.id, datos);
        setExito('Congelación registrada correctamente. Consulta el historial del contrato.');
      }
      setOperacion(''); setPreview(null); setMotivo('');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const cancelarProgramada = async () => {
    if (!detalleSuspension || motivoCancelacion.trim().length < 8) {
      setError('Indica el motivo de cancelación de al menos 8 caracteres.');
      return;
    }
    const confirmado = await confirmarAccion({
      titulo: 'Cancelar vacaciones programadas',
      texto: 'La solicitud quedará cancelada en el historial. No se alterarán pagos ni cuotas.',
      textoConfirmar: 'Sí, cancelar programación',
      icono: 'warning',
    });
    if (!confirmado) return;
    setProcesando(true); setError(''); setExito('');
    try {
      await gimnasioServicio.cancelarCongelacionProgramada(
        membresia.id, detalleSuspension.id, motivoCancelacion.trim()
      );
      setDetalleSuspension(null); setMotivoCancelacion('');
      setExito('Programación de vacaciones cancelada, con historial conservado.');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const simularReactivacion = async () => {
    setProcesando(true); setError(''); setExito(''); setPreviewReactivacion(null);
    try {
      setPreviewReactivacion(await gimnasioServicio.previsualizarReactivacion(membresia.id));
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const reactivar = async () => {
    if (!motivoCodigo || motivo.trim().length < 8) {
      setError('Selecciona un motivo y escribe una justificación de al menos 8 caracteres.');
      return;
    }
    if (procesando) return;
    setProcesando(true); setError(''); setExito('');
    try {
      const calculo = previewReactivacion
        || await gimnasioServicio.previsualizarReactivacion(membresia.id);
      setPreviewReactivacion(calculo);
      if (!calculo?.confirmable) {
        setError(calculo?.motivo_bloqueo || 'La reactivación requiere revisión administrativa.');
        return;
      }
      await gimnasioServicio.reactivarMembresia(membresia.id, motivo.trim(), motivoCodigo);
      setExito('Reactivación registrada. La vigencia quedó actualizada en el contrato.');
      setOperacion(''); setPreviewReactivacion(null); setMotivo('');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const estado = String(ciclo?.estado || membresia?.estado || '').toUpperCase();
  const suspensiones = ciclo?.suspensiones || [];
  const tienePendiente = suspensiones.some(s => ['PROGRAMADA', 'VIGENTE'].includes(s.estado));
  const puedeReactivar = estado === 'CONGELADA' &&
    suspensiones.some(s => s.estado === 'VIGENTE');
  const movimientoDe = s => (ciclo?.movimientos || [])
    .find(m => Number(m.id) === Number(s?.movimiento_inicio_id));
  const filtradas = suspensiones.filter(s => [
    s.tipo, s.estado, s.fecha_inicio, s.fecha_fin_prevista,
    movimientoDe(s)?.motivo,
  ].some(value => String(value || '').toLocaleLowerCase('es-EC').includes(busqueda.toLocaleLowerCase('es-EC'))));
  const paginaActual = Math.max(1, Math.min(pagina, Math.ceil(filtradas.length / porPagina) || 1));
  const visibles = filtradas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
  const mostrarFormulario = operacion === 'congelar' || operacion === 'reactivar';

  return <Box sx={{ ...formStyles.seccion, mt: 1.5, p: { xs: 1.5, sm: 2 } }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ mb: 1.5, width: '100%' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800}>
          {operacion === 'congelar' ? 'Registrar congelación' : operacion === 'reactivar' ? 'Reactivar membresía' : 'Gestión de congelaciones'}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto', flexShrink: 0 }}>
        <BotonVolver onClick={mostrarFormulario ? () => { setOperacion(''); setPreview(null); setError(''); } : onVolver}/>
      </Box>
    </Stack>
    {cargando && <CircularProgress size={23}/>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
    {ciclo && <>
      {!mostrarFormulario && <>
        <GestionToolbar
          total={filtradas.length}
          busqueda={busqueda}
          onBusqueda={valor => { setBusqueda(valor); setPagina(1); }}
          acciones={<Button startIcon={<AddOutlinedIcon />} disabled={estado !== 'ACTIVA' || tienePendiente || procesando}
            onClick={() => {
              setTipo('TIEMPO'); setInicio(fechaLocal()); setFin(''); setMotivo(''); setMotivoCodigo('VACACIONES');
              setDetalleSuspension(null); setPreview(null); setError(''); setOperacion('congelar');
            }}>Añadir</Button>}
        />
        {estado === 'ACTIVA' && tienePendiente && <Alert severity="info" sx={{ mb: 1.5 }}>
          Existe una congelación programada. No es posible registrar otra hasta que finalice o se resuelva la actual.
        </Alert>}
        {estado === 'CONGELADA' && <Alert severity="warning" sx={{ mb: 1.5 }}>
          El acceso deportivo está suspendido. Reactiva cuando regrese el cliente o revisa la fecha autorizada.
        </Alert>}
        <TablaGestion total={suspensiones.length} filtrados={filtradas.length}
          page={paginaActual} onPageChange={setPagina}
          rowsPerPage={porPagina} onRowsPerPageChange={valor => { setPorPagina(valor); setPagina(1); }}>
          <TableHead><TableRow>
            <TableCell>Desde</TableCell><TableCell>Hasta (incluido)</TableCell>
            <TableCell>Modalidad</TableCell><TableCell align="center">Días</TableCell>
            <TableCell>Estado</TableCell><TableCell align="center">Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {visibles.map(s => <TableRow key={s.id} hover>
              <TableCell>{fechaLegible(s.fecha_inicio)}</TableCell>
              <TableCell>{fechaLegible(s.fecha_fin_prevista)}</TableCell>
              <TableCell>{s.tipo === 'TIEMPO' ? 'Tiempo / vacaciones' : 'Facturación'}</TableCell>
              <TableCell align="center">{s.dias_reconocidos || leerDetalleMovimiento(movimientoDe(s)).dias_previstos || '—'}</TableCell>
              <TableCell><Chip size="small" variant="outlined"
                color={s.estado === 'VIGENTE' ? 'warning' : s.estado === 'FINALIZADA' ? 'success' : 'default'}
                label={({ PROGRAMADA: 'Programada', VIGENTE: 'Vigente', FINALIZADA: 'Finalizada',
                  NO_APLICADA: 'No aplicada', CANCELADA: 'Cancelada' })[s.estado] || s.estado} /></TableCell>
              <TableCell align="center">
                <Tooltip title="Ver detalle de la congelación">
                  <IconButton size="small" aria-label="Ver congelación" onClick={() => { setDetalleSuspension(s); setMotivoCancelacion(''); }}>
                    <VisibilityOutlinedIcon fontSize="small"/>
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>)}
            {!filtradas.length && <TableRow><TableCell colSpan={6} align="center">
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {busqueda ? 'No hay congelaciones que coincidan con la búsqueda.' : 'Este contrato todavía no tiene congelaciones registradas.'}
              </Typography>
            </TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
        {detalleSuspension && <Box sx={{ ...formStyles.seccion, mt: 2, bgcolor: 'background.default' }}>
          <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={800}>Detalle de la congelación #{detalleSuspension.id}</Typography>
            <Button size="small" onClick={() => setDetalleSuspension(null)}>Cerrar detalle</Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {fechaLegible(detalleSuspension.fecha_inicio)} al {fechaLegible(detalleSuspension.fecha_fin_prevista)}
            {' · '}{detalleSuspension.tipo === 'TIEMPO' ? 'Sin reprogramar cobros' : 'Reprogramación financiera'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Vigencia original: <strong>{fechaLegible(detalleSuspension.fecha_fin_original)}</strong>
            {' · '}Vigencia estimada: <strong>{fechaLegible(detalleSuspension.fecha_fin_ajustada)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Motivo: {movimientoDe(detalleSuspension)?.motivo || 'No disponible'}
          </Typography>
          {detalleSuspension.estado === 'NO_APLICADA' && <Alert severity="warning" sx={{ mt: 1.5 }}>
            {leerDetalleMovimiento(movimientoDe(detalleSuspension)).motivo_no_aplicacion
              || 'La programación no fue aplicada. Revisa las condiciones actuales del contrato.'}
          </Alert>}
          {detalleSuspension.estado === 'PROGRAMADA' && <Box sx={{ mt: 1.5 }}>
            <TextField size="small" fullWidth multiline minRows={2}
              label="Motivo para cancelar las vacaciones programadas"
              value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)}
              helperText="La cancelación será auditada; la membresía y sus cuotas permanecen intactas."/>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button variant="outlined" color="error" disabled={procesando || motivoCancelacion.trim().length < 8}
                onClick={cancelarProgramada}>Cancelar programación</Button>
            </Stack>
          </Box>}
          {detalleSuspension.fecha_fin_real && <Typography variant="body2" sx={{ mt: 0.5 }}>
            Último día efectivo de suspensión: {fechaLegible(detalleSuspension.fecha_fin_real)}
          </Typography>}
        </Box>}
        {puedeReactivar && <Stack alignItems="flex-end" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => { setOperacion('reactivar'); setMotivo(''); setMotivoCodigo('REGRESO'); setError(''); setPreviewReactivacion(null); }}>
            Reactivar membresía
          </Button>
        </Stack>}
      </>}
      {operacion === 'congelar' && <Box sx={{ mb: 0 }}>
        <TextField select size="small" fullWidth sx={{ mb: 2 }} label="Motivo principal"
          value={motivoCodigo} onChange={e => { setMotivoCodigo(e.target.value); setPreview(null); }}>
          <MenuItem value="">Seleccionar motivo</MenuItem>
          {motivosCatalogo.filter(m => m.operacion === 'CONGELAR').map(m =>
            <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField select size="small" fullWidth sx={{ mb: 2 }} label="Modalidad de congelación"
          value={tipo} onChange={(e) => { setTipo(e.target.value); setPreview(null); }}>
          <MenuItem value="TIEMPO">Congelación de tiempo · mantiene el calendario de pago</MenuItem>
          <MenuItem value="FACTURACION">Congelación de facturación · reprograma cuotas sin emitir</MenuItem>
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Desde" type="date" required value={inicio}
            onChange={e => { setInicio(e.target.value); setPreview(null); }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fechaLocal() } }}/>
          <TextField size="small" label="Hasta (incluido)" type="date" required value={fin}
            onChange={e => { setFin(e.target.value); setPreview(null); }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: inicio || fechaLocal() } }}/>
        </Stack>
        <TextField multiline minRows={2} size="small" fullWidth label="Motivo de congelación" required
          sx={{ mt: 2 }} value={motivo}
          onChange={e => { setMotivo(e.target.value); setPreview(null); }}/>
        {preview && <Box sx={{
          mt: 2, border: `1px solid ${uiTokens.colores.borde}`,
          borderRadius: uiTokens.radios.panel, bgcolor: 'background.paper', overflow: 'hidden',
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between" gap={1} sx={{ px: 2, py: 1.5, bgcolor: uiTokens.colores.primarioSuave }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>Vista previa de congelación</Typography>
              <Typography variant="caption" color="text.secondary">
                Cálculo realizado por Laravel · Sin cambios hasta guardar
              </Typography>
            </Box>
            <Chip size="small" variant="outlined"
              color={!preview.confirmable && !preview.programable ? 'warning' : 'success'}
              label={preview.programable ? 'Programación futura'
                : preview.confirmable ? 'Disponible para registrar' : 'Requiere revisión'} />
          </Stack>

          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>Impacto en la vigencia</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))',
            }, gap: 1.25 }}>
              {[
                { label: 'Días de congelación', value: `${preview.dias_previstos} días`, destacado: true },
                { label: 'Vencimiento actual', value: fechaLegible(preview.fecha_fin_original) },
                { label: 'Vencimiento proyectado', value: fechaLegible(preview.fecha_fin_ajustada), destacado: true },
              ].map(item => <Box key={item.label} sx={{
                px: 1.5, py: 1.25, border: `1px solid ${item.destacado
                  ? uiTokens.colores.acentoBorde : uiTokens.colores.bordeSuave}`,
                borderRadius: 1.5, bgcolor: item.destacado ? uiTokens.colores.acentoSuave : 'background.paper',
                minWidth: 0,
              }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="subtitle1" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
                  {item.value}
                </Typography>
              </Box>)}
            </Box>

            {preview.impacto_financiero && <>
              <Divider sx={{ my: 2 }}/>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>Impacto en Ventas y Cartera</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))',
              }, gap: 1.25, mb: 2 }}>
                {[
                  { label: 'Pagos confirmados', value: `$${Number(preview.impacto_financiero.pagos_confirmados || 0).toFixed(2)}` },
                  { label: 'Saldo emitido', value: `$${Number(preview.impacto_financiero.deuda_emitida || 0).toFixed(2)}` },
                  { label: 'Cuotas reprogramables', value: String(preview.impacto_financiero.cuotas_reprogramables ?? 0) },
                ].map(item => <Box key={item.label} sx={{
                  p: 1.25, border: `1px solid ${uiTokens.colores.bordeSuave}`, borderRadius: 1.5,
                }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body1" fontWeight={900}>{item.value}</Typography>
                </Box>)}
              </Box>

              {(preview.impacto_financiero.ventas_adicionales || []).length > 0 && (
                <Alert severity={preview.impacto_financiero.requiere_revision_cartera ? 'warning' : 'info'}
                  sx={{ mb: 1.5 }}>
                  Ventas adicionales vinculadas al contrato (sin modificación):
                  {(preview.impacto_financiero.ventas_adicionales || []).map(venta => (
                    <Typography variant="caption" display="block" key={venta.id}>
                      {venta.numero || `Venta ${venta.id}`} · Saldo $${Number(venta.saldo_emitido || 0).toFixed(2)}
                    </Typography>
                  ))}
                </Alert>
              )}

              <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>Detalle de cuotas</Typography>
              <TableContainer sx={{ border: `1px solid ${uiTokens.colores.bordeSuave}`,
                borderRadius: 1.5, overflowX: 'auto' }}>
                <Table size="small" aria-label="Impacto financiero por cuota" sx={{ ...dbanuStyles.table }}>
                  <TableHead><TableRow>
                    <TableCell>Cuota</TableCell>
                    <TableCell>Emisión actual</TableCell>
                    {tipo === 'FACTURACION' && <TableCell>Emisión propuesta</TableCell>}
                    <TableCell>Vencimiento actual</TableCell>
                    {tipo === 'FACTURACION' && <TableCell>Vencimiento propuesto</TableCell>}
                    <TableCell>Resultado</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {(preview.impacto_financiero.cuotas || []).map(cuota => <TableRow key={cuota.cuota_id}>
                      <TableCell>{cuota.numero}</TableCell>
                      <TableCell>{fechaLegible(cuota.emision_anterior)}</TableCell>
                      {tipo === 'FACTURACION' && <TableCell>{fechaLegible(cuota.emision_propuesta)}</TableCell>}
                      <TableCell>{fechaLegible(cuota.vencimiento_anterior)}</TableCell>
                      {tipo === 'FACTURACION' && <TableCell>{fechaLegible(cuota.vencimiento_propuesto)}</TableCell>}
                      <TableCell>
                        <Chip size="small" variant="outlined" label={({
                          REPROGRAMACION_PROPUESTA: 'A reprogramar',
                          PAGO_CONFIRMADO_CONSERVAR: 'Pago conservado',
                          VENTA_EMITIDA_REVISAR_CARTERA: 'Revisar Cartera',
                          SIN_CAMBIOS: 'Sin cambios',
                        })[cuota.accion] || cuota.accion || '—'}
                          color={cuota.accion === 'VENTA_EMITIDA_REVISAR_CARTERA' ? 'warning'
                            : cuota.accion === 'PAGO_CONFIRMADO_CONSERVAR' ? 'success' : 'default'} />
                      </TableCell>
                    </TableRow>)}
                    {!(preview.impacto_financiero.cuotas || []).length && <TableRow>
                      <TableCell colSpan={tipo === 'FACTURACION' ? 6 : 4} align="center">
                        No existen cuotas relacionadas con este período.
                      </TableCell>
                    </TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {tipo === 'TIEMPO'
                  ? 'Las fechas de pago y los importes se conservan. La vigencia se ajusta cuando se reactive la membresía.'
                  : 'Las fechas son proyectadas. Las ventas emitidas y los pagos confirmados permanecen intactos.'}
              </Typography>
            </>}

            {(!preview.confirmable && !preview.programable) && <Alert severity="warning" sx={{ mt: 1.5 }}>
              {preview.motivo_bloqueo || 'No es posible registrar esta congelación con las condiciones actuales.'}
            </Alert>}
            {preview.programable && <Alert severity="info" sx={{ mt: 1.5 }}>
              La solicitud se registrará como programada. El acceso se mantiene hasta la fecha de inicio;
              el ajuste definitivo de vigencia se realizará al reactivar.
            </Alert>}
          </Box>
        </Box>}
        <Box sx={{ ...dbanuStyles.formActions, width: '100%', px: 0, pb: 0, mt: 2,
          flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center',
          '& > .MuiButton-root': { flex: '0 0 auto' } }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreview(null); }}/>
          <BotonVistaPrevia disabled={!inicio || !fin || fin < inicio || procesando}
            cargando={procesando && !preview} onClick={simular}/>
          <BotonGuardar texto="Guardar" guardando={procesando}
            disabled={!motivoCodigo || !inicio || !fin || fin < inicio || motivo.trim().length < 8}
            onClick={guardarCongelacion}/>
        </Box>
      </Box>}
      {operacion === 'reactivar' && <Box sx={{ mb: 0 }}>
        <TextField select size="small" fullWidth sx={{ mt: 1 }} label="Motivo principal"
          value={motivoCodigo} onChange={e => { setMotivoCodigo(e.target.value); setPreviewReactivacion(null); }}>
          <MenuItem value="">Seleccionar motivo</MenuItem>
          {motivosCatalogo.filter(m => m.operacion === 'REACTIVAR').map(m =>
            <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField sx={{ mt: 2 }} size="small" multiline minRows={2} fullWidth required
          label="Justificación de reactivación" value={motivo} onChange={e => setMotivo(e.target.value)}/>
        {previewReactivacion && <Box sx={{ mt: 2, bgcolor: uiTokens.colores.acentoSuave,
          border: `1px solid ${uiTokens.colores.acentoBorde}`, p: 1.5, borderRadius: 1.5 }}>
          <Typography fontWeight={800} variant="subtitle2">Cálculo al regresar · Laravel</Typography>
          <Typography variant="body2">Días realmente suspendidos: <strong>{previewReactivacion.dias_reconocidos}</strong></Typography>
          <Typography variant="body2">Fin anterior: {fechaLegible(previewReactivacion.fecha_fin_original)}</Typography>
          <Typography variant="body2">Nuevo fin: <strong>{fechaLegible(previewReactivacion.fecha_fin_propuesta)}</strong></Typography>
          <Typography variant="body2">Pagos confirmados: ${Number(previewReactivacion.impacto_financiero?.pagos_confirmados || 0).toFixed(2)}</Typography>
          <Typography variant="body2">Saldo emitido: ${Number(previewReactivacion.impacto_financiero?.deuda_emitida || 0).toFixed(2)}</Typography>
          <Typography variant="caption" color="text.secondary">
            La vista previa no modifica contratos, cuotas ni Cartera. Guardar vuelve a validar todos los datos.
          </Typography>
          {!previewReactivacion.confirmable && <Alert severity="warning" sx={{ mt: 1 }}>
            {previewReactivacion.motivo_bloqueo || 'La reactivación requiere una revisión administrativa.'}
          </Alert>}
        </Box>}
        <Box sx={{ ...dbanuStyles.formActions, width: '100%', px: 0, pb: 0, mt: 2,
          flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center',
          '& > .MuiButton-root': { flex: '0 0 auto' } }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreviewReactivacion(null); }}/>
          <BotonVistaPrevia cargando={procesando && !previewReactivacion} disabled={procesando}
            onClick={simularReactivacion}/>
          <BotonGuardar texto="Guardar" guardando={procesando}
            disabled={!motivoCodigo || motivo.trim().length < 8}
            onClick={reactivar}/>
        </Box>
      </Box>}
    </>}
  </Box>;
}
