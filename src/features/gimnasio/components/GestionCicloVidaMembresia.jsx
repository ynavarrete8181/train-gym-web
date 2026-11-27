import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { esPaseDiario } from './estadoMembresia.js';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonVistaPrevia } from '../../../components/common/BotonVistaPrevia.jsx';
import { formStyles } from '../../../styles/formStyles.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { DialogCongelacionMembresia } from './DialogCongelacionMembresia.jsx';

const fechaLocal = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find(parte => parte.type === tipo)?.value;
  return [valor('year'), valor('month'), valor('day')].join('-');
};
const ETIQUETAS_SUSPENSION = { PROGRAMADA: 'Programada', VIGENTE: 'Vigente', FINALIZADA: 'Finalizada', NO_APLICADA: 'No aplicada', CANCELADA: 'Cancelada' };
const OPCIONES_SUSPENSIONES = { sinOrdenar: ['desde', 'hasta'] };
const MODALIDADES = { TIEMPO: 'Tiempo / vacaciones', FACTURACION: 'Facturación', SIN_USO: 'Sin uso · cuota anulada' };
const manana = () => {
  const [a, m, d] = fechaLocal().split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
};
const haceDias = (dias) => {
  const [a, m, d] = fechaLocal().split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - dias)).toISOString().slice(0, 10);
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
export function GestionCicloVidaMembresia({ membresia, onVolver, onActualizado, integrado = false, modo = 'congelaciones' }) {
  const [previewReapertura, setPreviewReapertura] = useState(null);
  const [ciclo, setCiclo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [operacion, setOperacion] = useState('');
  const [tipo, setTipo] = useState('TIEMPO');
  const [busqueda, setBusqueda] = useState('');
  const [detalleSuspension, setDetalleSuspension] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaFin, setVigenciaFin] = useState('');
  const [motivoCodigo, setMotivoCodigo] = useState('');
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [previewReactivacion, setPreviewReactivacion] = useState(null);
  const [previewCancelacion, setPreviewCancelacion] = useState(null);
  const [inicio, setInicio] = useState(fechaLocal());
  const [fin, setFin] = useState('');
  // Motivo: se arma solo con los datos del flujo hasta que el usuario lo edita (puede borrarlo o completarlo).
  const [motivoTexto, setMotivoTexto] = useState('');
  const [motivoAuto, setMotivoAuto] = useState(true);
  const setMotivo = (v) => { setMotivoTexto(v || ''); setMotivoAuto(!v); };
  const escribirMotivo = (v) => { setMotivoTexto(v); setMotivoAuto(false); };
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [desdePeriodo, setDesdePeriodo] = useState('');
  const [preview, setPreview] = useState(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [resumenGuardado, setResumenGuardado] = useState(null);
  const [editandoSuspensionId, setEditandoSuspensionId] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  // Congelar sin uso: período sin asistencias ni cobros (lo decide Laravel).
  const sinUso = ciclo?.congelacion_sin_uso?.disponible ? ciclo.congelacion_sin_uso : null;

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
      const datosFechas = { tipo, fecha_inicio: inicio, fecha_fin: fin };
      const resultado = editandoSuspensionId
        ? await gimnasioServicio.previsualizarEdicionCongelacion(membresia.id, editandoSuspensionId, datosFechas)
        : await gimnasioServicio.previsualizarCongelacion(membresia.id, datosFechas);
      setPreview(resultado);
      setVistaPreviaAbierta(true);
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const guardarSinUso = async () => {
    if (!motivoCodigo || !fin || fin <= fechaLocal() || motivo.trim().length < 8) {
      setError('Selecciona el motivo, el regreso estimado (después de hoy) y una justificación de al menos 8 caracteres.');
      return;
    }
    const confirmado = await confirmarAccion({
      titulo: 'Congelar sin uso',
      texto: `Se anulará la cuota ${sinUso?.venta_numero || ''} de ${dinero(sinUso?.monto)} y el contrato quedará congelado desde el ${fechaLegible(sinUso?.periodo_inicio)}. Al regresar, el período empieza ese día y la cuota se vuelve a emitir.`,
      textoConfirmar: 'Sí, congelar', icono: 'question',
    });
    if (!confirmado) return;
    setProcesando(true); setError(''); setExito('');
    try {
      const r = await gimnasioServicio.congelarSinUso(membresia.id, {
        fecha_regreso: fin, motivo: motivo.trim(), motivo_codigo: motivoCodigo,
      });
      setExito(`Contrato congelado desde el ${fechaLegible(r.inicio)}. La cuota ${r.venta_numero} de ${dinero(r.monto)} quedó anulada y ya no aparece como deuda; se volverá a emitir el día que regrese.`);
      setOperacion(''); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const guardarCongelacion = async () => {
    if (tipo === 'SIN_USO') { await guardarSinUso(); return; }
    if (!motivoCodigo || !inicio || !fin || fin < inicio || motivo.trim().length < 8) {
      setError('Selecciona el motivo, ingresa fechas válidas y una justificación de al menos 8 caracteres.');
      return;
    }
    if (procesando) return;
    setProcesando(true); setError(''); setExito('');
    try {
      // La vista previa nunca sustituye la autorización de Laravel.
      // Si no se solicitó manualmente, Guardar la obtiene antes de registrar.
      const datosFechas = { tipo, fecha_inicio: inicio, fecha_fin: fin };
      const calculo = preview || (editandoSuspensionId
        ? await gimnasioServicio.previsualizarEdicionCongelacion(membresia.id, editandoSuspensionId, datosFechas)
        : await gimnasioServicio.previsualizarCongelacion(membresia.id, datosFechas));
      setPreview(calculo);
      if (!calculo?.confirmable && !calculo?.programable) {
        setError(calculo?.motivo_bloqueo || 'La membresía no cumple los requisitos para registrar la congelación.');
        return;
      }
      const datos = {
        tipo, fecha_inicio: inicio, fecha_fin: fin,
        motivo: motivo.trim(), motivo_codigo: motivoCodigo,
      };
      const resultadoGuardado = editandoSuspensionId
        ? await gimnasioServicio.actualizarCongelacionProgramada(membresia.id, editandoSuspensionId, datos)
        : calculo.programable
          ? await gimnasioServicio.programarCongelacionTiempo(membresia.id, datos)
          : await gimnasioServicio.congelarMembresia(membresia.id, datos);
      const actualizado = await gimnasioServicio.obtenerCicloVidaMembresia(membresia.id);
      setCiclo(actualizado);
      setVistaPreviaAbierta(false);
      setResumenGuardado({
        preview: { ...calculo, ...resultadoGuardado },
        suspensionId: resultadoGuardado?.suspension_id,
        motivo: motivo.trim(),
        esEdicion: Boolean(editandoSuspensionId),
      });
      setOperacion(''); setPreview(null); setMotivo('');
      setEditandoSuspensionId(null);
      setExito('');
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const editarProgramacion = (suspension) => {
    if (!suspension || suspension.estado !== 'PROGRAMADA' || suspension.tipo !== 'TIEMPO'
        || String(suspension.fecha_inicio).slice(0, 10) <= fechaLocal()) return;
    const movimiento = (ciclo?.movimientos || [])
      .find(m => Number(m.id) === Number(suspension.movimiento_inicio_id));
    const detalle = leerDetalleMovimiento(movimiento);
    setEditandoSuspensionId(suspension.id);
    setTipo('TIEMPO');
    setInicio(String(suspension.fecha_inicio).slice(0, 10));
    setFin(String(suspension.fecha_fin_prevista).slice(0, 10));
    setMotivoCodigo(detalle.motivo_codigo || 'VACACIONES');
    setMotivo(movimiento?.motivo || '');
    setPreview(null); setVistaPreviaAbierta(false);
    setDetalleSuspension(null);
    setError(''); setExito('');
    setOperacion('editar');
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
      const resultado = await gimnasioServicio.reactivarMembresia(membresia.id, motivo.trim(), motivoCodigo);
      if (resultado.tipo === 'SIN_USO') {
        setExito(`Reactivación registrada: el período empieza hoy y termina el ${fechaLegible(resultado.fecha_fin)}. `
          + `Se emitió la cuota ${resultado.cuota_emitida || ''}; aparece en Ventas para cobrarla.`);
        setOperacion(''); setPreviewReactivacion(null); setMotivo('');
        await cargar(); await onActualizado?.();
        return;
      }
      setExito(`Reactivación registrada: ${resultado.dias_reconocidos} días reconocidos. `
        + `Vigencia anterior: ${fechaLegible(resultado.fecha_fin_original)}; `
        + `nueva vigencia: ${fechaLegible(resultado.fecha_fin)}. `
        + 'Las cuotas emitidas y los pagos confirmados se conservan.');
      setOperacion(''); setPreviewReactivacion(null); setMotivo('');
      await cargar();
      await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const prepararProrroga = (suspension) => {
    setEditandoSuspensionId(suspension.id);
    setInicio(String(suspension.fecha_inicio).slice(0, 10));
    setFin(String(suspension.fecha_fin_prevista).slice(0, 10));
    // Conserva el motivo con que se congeló (enfermedad, vacaciones…).
    setMotivoCodigo(leerDetalleMovimiento(movimientoDe(suspension)).motivo_codigo || 'VACACIONES'); setMotivo(''); setPreview(null);
    setError(''); setExito(''); setOperacion('prorrogar');
  };

  const simularProrroga = async () => {
    setProcesando(true); setError(''); setPreview(null);
    try {
      setPreview(await gimnasioServicio.previsualizarProrrogaCongelacion(
        membresia.id, editandoSuspensionId, fin
      ));
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const guardarProrroga = async () => {
    if (!motivoCodigo || motivo.trim().length < 8 || !fin) {
      setError('Selecciona el motivo, la nueva fecha y escribe una justificación de al menos 8 caracteres.');
      return;
    }
    setProcesando(true); setError('');
    try {
      const resultado = await gimnasioServicio.prorrogarCongelacion(membresia.id, editandoSuspensionId, {
        fecha_fin: fin, motivo: motivo.trim(), motivo_codigo: motivoCodigo,
      });
      setExito(resultado.dias_adicionales < 0
        ? `Congelación acortada en ${-resultado.dias_adicionales} días: termina el ${fechaLegible(resultado.fecha_fin_propuesta)} y se reactiva sola al día siguiente.`
        : `Prórroga registrada: ${resultado.dias_adicionales} días adicionales; regreso previsto después del ${fechaLegible(resultado.fecha_fin_propuesta)}.`);
      setOperacion(''); setEditandoSuspensionId(null); setPreview(null); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const simularCancelacion = async () => {
    setProcesando(true); setError('');
    try { setPreviewCancelacion(await gimnasioServicio.previsualizarCancelacionMembresia(membresia.id)); }
    catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  // Cambiar el precio pactado desde un período (solo administradores; el backend lo valida).
  const periodosContrato = [...(ciclo?.periodos_contrato || membresia?.periodos || [])].sort((a, b) => Number(a.numero_periodo) - Number(b.numero_periodo));
  const periodoCobrado = (p) => Boolean(p.cobrado) || ['PAGADA', 'PARCIAL'].includes(String(p.venta_estado || '').toUpperCase());
  const dinero = (v) => `$${Number(v || 0).toFixed(2)}`;
  // Motivos prellenados con los valores; el administrador puede ajustarlos.
  const motivoCambioPrecio = (precio, desde) => `Actualización del precio pactado de ${dinero(ciclo?.precio_contrato)} a ${dinero(precio)} desde el período ${desde || '—'} (tarifa vigente de la sede: ${dinero(ciclo?.tarifa_vigente)}).`;
  const nombreMotivoCatalogo = () => motivosCatalogo.find(m => m.codigo === motivoCodigo)?.nombre?.toLowerCase() || 'motivo por indicar';
  const membresiaTexto = `la membresía ${membresia?.codigo || membresia?.codigo_contrato || ''}${membresia?.plan_nombre ? ` (${membresia.plan_nombre})` : ''}`;
  const textoMotivoOperacion = () => {
    switch (operacion) {
      case 'congelar': if (tipo === 'SIN_USO') return `Congelación sin uso de ${membresiaTexto} por ${nombreMotivoCatalogo()}: no ha asistido desde el ${fechaLegible(sinUso?.periodo_inicio)}. Se anula la cuota ${sinUso?.venta_numero || ''} de ${dinero(sinUso?.monto)} y se vuelve a emitir al regresar.`;
        return `Congelación de ${membresiaTexto} ${tipo === 'TIEMPO' ? 'de tiempo' : 'financiera'} del ${fechaLegible(inicio)} al ${fin ? fechaLegible(fin) : '—'} por ${nombreMotivoCatalogo()}.`;
      case 'editar': return `Cambio de fechas de la congelación programada de ${membresiaTexto}: ahora del ${fechaLegible(inicio)} al ${fin ? fechaLegible(fin) : '—'} por ${nombreMotivoCatalogo()}.`;
      case 'prorrogar': {
        const actual = String((ciclo?.suspensiones || []).find(x => Number(x.id) === Number(editandoSuspensionId))?.fecha_fin_prevista || '').slice(0, 10);
        return `${fin && actual && fin < actual ? 'Se acorta' : 'Prórroga de'} la congelación de ${membresiaTexto} hasta el ${fin ? fechaLegible(fin) : '—'} por ${nombreMotivoCatalogo()}.`;
      }
      case 'reactivar': return `Reactivación de ${membresiaTexto} el ${fechaLegible(fechaLocal())} por ${nombreMotivoCatalogo()}.`;
      case 'reabrir': return `Reapertura de ${membresiaTexto} por ${nombreMotivoCatalogo()}; se conserva su historial de ventas y cobros.`;
      case 'vigencia': return `Ajuste de vigencia de ${membresiaTexto}: del ${fechaLegible(String(ciclo?.vigencia_inicio_sugerida || '').slice(0, 10))} – ${fechaLegible(String(ciclo?.vigencia_fin || '').slice(0, 10))} pasa a ${vigenciaInicio ? fechaLegible(vigenciaInicio) : '—'} – ${vigenciaFin ? fechaLegible(vigenciaFin) : '—'}.`;
      case 'cancelar': return `Cancelación de ${membresiaTexto} por ${nombreMotivoCatalogo()}${previewCancelacion?.fecha_efectiva ? `, efectiva el ${fechaLegible(previewCancelacion.fecha_efectiva)}` : ''}. Ventas, cobros y deuda se conservan.`;
      case 'precio': return motivoCambioPrecio(nuevoPrecio, desdePeriodo);
      default: return '';
    }
  };
  const motivo = motivoAuto ? textoMotivoOperacion() : motivoTexto;
  const abrirCambioPrecio = () => {
    const primeroSinCobrar = periodosContrato.find((p) => !periodoCobrado(p));
    const precio = ciclo?.tarifa_vigente ?? ciclo?.precio_contrato ?? '';
    const desde = primeroSinCobrar ? String(primeroSinCobrar.numero_periodo) : '';
    setOperacion('precio'); setError(''); setExito('');
    setNuevoPrecio(String(precio)); setDesdePeriodo(desde); setMotivo('');
  };
  const cambiarPrecio = async () => {
    setProcesando(true); setError('');
    try {
      await gimnasioServicio.cambiarPrecioMembresia(membresia.id, { precio: Number(nuevoPrecio), desde_periodo: Number(desdePeriodo), motivo: motivo.trim() });
      setExito(`Precio del contrato actualizado a $${Number(nuevoPrecio).toFixed(2)} desde el período ${desdePeriodo}. Queda en el historial.`);
      setOperacion(''); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const editarVigencia = async () => {
    setProcesando(true); setError('');
    try {
      await gimnasioServicio.editarVigenciaMembresia(membresia.id, { fecha_inicio: vigenciaInicio, fecha_fin: vigenciaFin, motivo: motivo.trim() });
      setExito(`Vigencia actualizada: ${fechaLegible(vigenciaInicio)} – ${fechaLegible(vigenciaFin)}.`);
      setOperacion(''); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const cancelarContrato = async () => {
    if (!motivoCodigo || motivo.trim().length < 8) {
      setError('Selecciona el motivo de cierre y escribe una justificación de al menos 8 caracteres.');
      return;
    }
    const confirmado = await confirmarAccion({
      titulo: 'Cancelar contrato de membresía',
      texto: 'Se bloquearán nuevos accesos. Ventas, pagos, comprobantes y deuda permanecerán en el historial.',
      textoConfirmar: 'Sí, cancelar contrato', icono: 'warning',
    });
    if (!confirmado) return;
    setProcesando(true); setError('');
    try {
      await gimnasioServicio.cancelarContratoMembresia(membresia.id, {
        motivo: motivo.trim(), motivo_codigo: motivoCodigo,
      });
      setExito('Contrato cancelado con trazabilidad. El historial financiero fue conservado.');
      setOperacion(''); setPreviewCancelacion(null); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const abrirReapertura = async () => {
    setProcesando(true); setError(''); setExito('');
    try {
      setPreviewReapertura(await gimnasioServicio.previsualizarReaperturaMembresia(membresia.id));
      setOperacion('reabrir'); setMotivo(''); setMotivoCodigo('');
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const reabrirContrato = async () => {
    if (!motivoCodigo || motivo.trim().length < 8) {
      setError('Selecciona el motivo y escribe una justificación de al menos 8 caracteres.');
      return;
    }
    const confirmado = await confirmarAccion({
      titulo: 'Reabrir contrato de membresía',
      texto: 'Es una acción excepcional y queda registrada. No restaura reservas ni el entrenador asignado.',
      textoConfirmar: 'Sí, reabrir', icono: 'warning',
    });
    if (!confirmado) return;
    setProcesando(true); setError('');
    try {
      await gimnasioServicio.reabrirMembresia(membresia.id, { motivo: motivo.trim(), motivo_codigo: motivoCodigo });
      setExito('Contrato reabierto con trazabilidad completa.');
      setOperacion(''); setPreviewReapertura(null); setMotivo('');
      await cargar(); await onActualizado?.();
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  const estado = String(ciclo?.estado || membresia?.estado || '').toUpperCase();
  const suspensiones = ciclo?.suspensiones || [];
  const tienePendiente = suspensiones.some(s => ['PROGRAMADA', 'VIGENTE'].includes(s.estado));
  // Administración: congelar por tiempo hasta N días atrás y con la cuota del mes por cobrar (lo valida Laravel).
  const excepcion = ciclo?.congelacion_excepcional || null;
  const puedeTiempo = estado === 'ACTIVA' || (estado === 'PENDIENTE_PAGO' && Boolean(excepcion?.permite_pendiente_pago));
  const minimoDesde = excepcion ? haceDias(excepcion.dias_retroactivos || 0) : fechaLocal();
  const puedeReactivar = estado === 'CONGELADA' &&
    suspensiones.some(s => s.estado === 'VIGENTE');
  const movimientoDe = s => (ciclo?.movimientos || [])
    .find(m => Number(m.id) === Number(s?.movimiento_inicio_id));
  const filtradas = suspensiones.filter(s => [
    s.tipo, s.estado, s.fecha_inicio, s.fecha_fin_prevista,
    movimientoDe(s)?.motivo,
  ].some(value => String(value || '').toLocaleLowerCase('es-EC').includes(busqueda.toLocaleLowerCase('es-EC'))));
  const tabla = useTablaLocal(filtradas, {
    desde: (s) => fechaLegible(s.fecha_inicio),
    hasta: (s) => fechaLegible(s.fecha_fin_prevista),
    modalidad: (s) => MODALIDADES[s.tipo] || s.tipo,
    dias: (s) => String(s.dias_previstos ?? leerDetalleMovimiento(movimientoDe(s)).dias_previstos ?? '—'),
    estado: (s) => ETIQUETAS_SUSPENSION[s.estado] || s.estado || '',
  }, OPCIONES_SUSPENSIONES);
  const { visibles } = tabla;
  const mostrarFormulario = ['congelar', 'editar', 'reactivar', 'prorrogar', 'cancelar', 'reabrir', 'vigencia', 'precio'].includes(operacion);
  const esPase = esPaseDiario(membresia);

  return <Box sx={integrado ? { width: '100%', minWidth: 0 } : {
    ...formStyles.seccion, mt: 1.5, p: { xs: 1.5, sm: 2 },
  }}>
    {(!integrado || mostrarFormulario) && <Stack direction="row" gap={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5, width: '100%' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800}>
          {operacion === 'congelar' ? 'Registrar congelación' : operacion === 'editar' ? 'Editar fechas programadas' : operacion === 'reactivar' ? 'Reactivar membresía' : operacion === 'prorrogar' ? 'Cambiar fecha hasta de la congelación' : operacion === 'cancelar' ? 'Cancelar contrato' : operacion === 'reabrir' ? 'Reabrir contrato' : operacion === 'vigencia' ? 'Editar vigencia' : operacion === 'precio' ? 'Cambiar precio del contrato' : 'Gestión del ciclo de vida'}
        </Typography>
      </Box>
      {!integrado && <Box sx={{ ml: 'auto', flexShrink: 0 }}>
        <BotonVolver onClick={mostrarFormulario ? () => { setOperacion(''); setEditandoSuspensionId(null); setPreview(null); setError(''); } : onVolver}/>
      </Box>}
    </Stack>}
    {cargando && <CircularProgress size={23}/>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
    {ciclo && <>
      {!mostrarFormulario && modo === 'contrato' && <Stack spacing={1.5}>
        {estado === 'VENCIDA' && !esPase && <Alert severity="info">
          Este contrato terminó su vigencia. Para continuar, añade una nueva membresía desde la lista.
        </Alert>}
        {estado === 'CANCELADA' && !ciclo?.puede_reabrir && <Alert severity="info">
          Este contrato está cancelado. Solo un administrador puede reabrirlo.
        </Alert>}
        {esPase && <Alert severity="info">
          Vigencia del pase: {ciclo?.vigencia_fin ? `${ciclo.vigencia_inicio ? `${fechaLegible(ciclo.vigencia_inicio)} – ` : 'hasta '}${fechaLegible(ciclo.vigencia_fin)}` : 'sin límite'}.
        </Alert>}
        {(ciclo?.puede_cancelar_contrato || ciclo?.puede_reabrir || puedeReactivar) ? (
          <Typography variant="body2" color="text.secondary">
            Las acciones quedan registradas con su motivo. Ventas, cobros y comprobantes se conservan.
          </Typography>
        ) : null}
        {ciclo?.puede_cambiar_precio && <Typography variant="body2" color="text.secondary">
          Precio pactado: {dinero(ciclo?.precio_contrato)}. El precio al renovar se configura en Renovaciones.
        </Typography>}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {puedeReactivar && <Button variant="outlined"
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={() => { setOperacion('reactivar'); setMotivo(''); setMotivoCodigo('REGRESO'); setError(''); setPreviewReactivacion(null); }}>
            Reactivar membresía
          </Button>}
          {ciclo?.puede_editar_vigencia && <Button variant="outlined"
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={() => {
              setOperacion('vigencia'); setMotivo(''); setError(''); setExito('');
              setVigenciaInicio(String(ciclo.vigencia_inicio_sugerida || '').slice(0, 10));
              setVigenciaFin(String(ciclo.vigencia_fin || '').slice(0, 10));
            }}>
            Editar vigencia
          </Button>}
          {ciclo?.puede_cambiar_precio && <Button variant="outlined"
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={abrirCambioPrecio}>
            Cambiar precio
          </Button>}
          {ciclo?.puede_cancelar_contrato && <Button color="error" variant="outlined"
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={() => { setOperacion('cancelar'); setMotivo(''); setMotivoCodigo('RETIRO_VOLUNTARIO'); setPreviewCancelacion(null); setError(''); }}>
            Cancelar contrato
          </Button>}
          {ciclo?.puede_reabrir && <Button variant="outlined" disabled={procesando}
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={abrirReapertura}>
            Reabrir contrato
          </Button>}
        </Box>
      </Stack>}
      {!mostrarFormulario && modo !== 'contrato' && <>
        <GestionToolbar
          total={filtradas.length}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          acciones={<Button startIcon={<AddOutlinedIcon />} disabled={((!puedeTiempo || tienePendiente) && !sinUso) || procesando}
            onClick={() => {
              const soloSinUso = !puedeTiempo || tienePendiente;
              setTipo(soloSinUso ? 'SIN_USO' : 'TIEMPO');
              setInicio(soloSinUso ? String(sinUso.periodo_inicio).slice(0, 10) : fechaLocal());
              setFin(''); setMotivo(''); setMotivoCodigo(soloSinUso ? 'ENFERMEDAD' : 'VACACIONES');
              setDetalleSuspension(null); setEditandoSuspensionId(null); setPreview(null); setError(''); setOperacion('congelar');
            }}>Añadir</Button>}
        />
        {sinUso && <Alert severity="info" sx={{ mb: 1.5 }}>
          No ha asistido desde el {fechaLegible(sinUso.periodo_inicio)} y su cuota de {dinero(sinUso.monto)} no tiene cobros:
          puedes <strong>congelarlo sin uso</strong> con "Añadir". La cuota se anula y se vuelve a emitir cuando regrese.
        </Alert>}
        {estado === 'ACTIVA' && tienePendiente && <Alert severity="info" sx={{ mb: 1.5 }}>
          Existe una congelación programada. No es posible registrar otra hasta que finalice o se resuelva la actual.
        </Alert>}
        <TablaGestion {...tabla.propsTabla} total={suspensiones.length}>
          <TableHead><TableRow>
            <FilterHeaderCell {...tabla.filtro('desde')}>Desde</FilterHeaderCell>
            <FilterHeaderCell {...tabla.filtro('hasta')}>Hasta (incluido)</FilterHeaderCell>
            <FilterHeaderCell {...tabla.filtro('modalidad')}>Modalidad</FilterHeaderCell>
            <FilterHeaderCell {...tabla.filtro('dias')} align="center">Días previstos</FilterHeaderCell>
            <FilterHeaderCell {...tabla.filtro('estado')}>Estado</FilterHeaderCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {visibles.map(s => <TableRow key={s.id} hover>
              <TableCell>{fechaLegible(s.fecha_inicio)}</TableCell>
              <TableCell>{fechaLegible(s.fecha_fin_prevista)}</TableCell>
              <TableCell>{MODALIDADES[s.tipo] || s.tipo}</TableCell>
              <TableCell align="center">
                <Tooltip title={s.estado === 'FINALIZADA'
                  ? `Período autorizado: ${s.dias_previstos ?? '—'} días. Días efectivos: ${s.dias_reconocidos ?? '—'}.`
                  : 'Duración solicitada; no son días compensados.'}>
                  <span>{s.dias_previstos ?? leerDetalleMovimiento(movimientoDe(s)).dias_previstos ?? '—'}</span>
                </Tooltip>
              </TableCell>
              <TableCell><Chip size="small" variant="outlined"
                color={s.estado === 'VIGENTE' ? 'warning' : s.estado === 'FINALIZADA' ? 'success' : 'default'}
                label={ETIQUETAS_SUSPENSION[s.estado] || s.estado} /></TableCell>
              <TableCell align="center">
                <Tooltip title="Ver detalle de la congelación">
                  <IconButton size="small" aria-label="Ver congelación" sx={dbanuStyles.actionView}
                    onClick={() => { setDetalleSuspension(s); setMotivoCancelacion(`Cancelación de la congelación programada de ${membresiaTexto} (del ${fechaLegible(s.fecha_inicio)} al ${fechaLegible(s.fecha_fin_prevista)}); el calendario de pagos sigue normal.`); }}>
                    <VisibilityOutlinedIcon fontSize="small"/>
                  </IconButton>
                </Tooltip>
                {s.estado === 'PROGRAMADA' && s.tipo === 'TIEMPO'
                  && String(s.fecha_inicio).slice(0, 10) > fechaLocal() && (
                  <Tooltip title="Editar fechas programadas">
                    <span>
                      <IconButton size="small" aria-label="Editar fechas programadas"
                        sx={{ ...dbanuStyles.actionEdit, mr: 0 }}
                        disabled={procesando} onClick={() => editarProgramacion(s)}>
                        <EditOutlinedIcon fontSize="small"/>
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                {s.estado === 'VIGENTE' && s.tipo === 'TIEMPO' && (
                  <Tooltip title="Cambiar fecha hasta (alargar o acortar)">
                    <span><IconButton size="small" aria-label="Prorrogar congelación"
                      sx={{ ...dbanuStyles.actionEdit, mr: 0 }} disabled={procesando}
                      onClick={() => prepararProrroga(s)}>
                      <EventRepeatOutlinedIcon fontSize="small"/>
                    </IconButton></span>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>)}
            {!visibles.length && <TableRow><TableCell colSpan={6} align="center">
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {busqueda ? 'No hay congelaciones que coincidan con la búsqueda.' : 'Este contrato todavía no tiene congelaciones registradas.'}
              </Typography>
            </TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
        {puedeReactivar && <Box>
          <Button variant="outlined"
            sx={{ width: 'auto', flex: '0 0 auto', textTransform: 'none', fontWeight: 800 }}
            onClick={() => { setOperacion('reactivar'); setMotivo(''); setMotivoCodigo('REGRESO'); setError(''); setPreviewReactivacion(null); }}>
            Reactivar membresía
          </Button>
        </Box>}
        </Box>
      </>}
      {(operacion === 'congelar' || operacion === 'editar') && <Box sx={{ mb: 0 }}>
        {operacion === 'editar' && <Alert severity="info" sx={{ mb: 2 }}>
          Cambia las fechas de esta solicitud programada. Laravel recalculará los días y la vigencia;
          no se creará otra congelación ni se modificarán cobros.
        </Alert>}
        <TextField select size="small" fullWidth sx={{ mb: 2 }} label="Motivo principal"
          value={motivoCodigo} onChange={e => { setMotivoCodigo(e.target.value); setPreview(null); }}>
          <MenuItem value="">Seleccionar motivo</MenuItem>
          {motivosCatalogo.filter(m => m.operacion === 'CONGELAR').map(m =>
            <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField select size="small" fullWidth sx={{ mb: 2 }} label="Modalidad de congelación"
          disabled={operacion === 'editar'} value={tipo} onChange={(e) => {
            const nuevo = e.target.value;
            setTipo(nuevo); setPreview(null); setFin('');
            setInicio(nuevo === 'SIN_USO' ? String(sinUso?.periodo_inicio || '').slice(0, 10) : fechaLocal());
          }}>
          <MenuItem value="TIEMPO" disabled={!puedeTiempo}>Congelación de tiempo · mantiene el calendario de pago</MenuItem>
          <MenuItem value="FACTURACION" disabled={estado !== 'ACTIVA'}>Congelación de facturación · reprograma cuotas sin emitir</MenuItem>
          {sinUso && <MenuItem value="SIN_USO">Congelación sin uso · anula la cuota de {dinero(sinUso.monto)} y congela desde el {fechaLegible(sinUso.periodo_inicio)}</MenuItem>}
        </TextField>
        {tipo === 'SIN_USO' && sinUso && <Alert severity="info" sx={{ mb: 2 }}>
          Período {sinUso.numero_periodo}: {fechaLegible(sinUso.periodo_inicio)} – {fechaLegible(sinUso.periodo_fin)}, sin asistencias ni cobros.
          Se <strong>anula la cuota {sinUso.venta_numero} de {dinero(sinUso.monto)}</strong> (sale de Cuentas abiertas y Cartera) y el contrato
          queda congelado desde el {fechaLegible(sinUso.periodo_inicio)}. Cuando regrese, al reactivar, el período empieza ese día con sus días
          completos y la cuota se vuelve a emitir.
        </Alert>}
        {tipo === 'SIN_USO' ? <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Congelado desde" type="date" disabled value={inicio}
            slotProps={{ inputLabel: { shrink: true } }}/>
          <TextField size="small" label="Regreso estimado" type="date" required value={fin}
            onChange={e => setFin(e.target.value)} helperText="Referencial: se reactiva el día que realmente regrese."
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: manana() } }}/>
        </Stack> : <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Desde" type="date" required value={inicio}
            onChange={e => { setInicio(e.target.value); setPreview(null); }}
            helperText={excepcion?.dias_retroactivos && operacion === 'congelar' ? `Puede empezar hasta ${excepcion.dias_retroactivos} días antes de hoy (sin asistencias en esos días).` : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: operacion === 'congelar' ? minimoDesde : fechaLocal() } }}/>
          <TextField size="small" label="Hasta (incluido)" type="date" required value={fin}
            onChange={e => { setFin(e.target.value); setPreview(null); }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: inicio || fechaLocal() } }}/>
        </Stack>}
        {tipo === 'TIEMPO' && estado === 'PENDIENTE_PAGO' && <Alert severity="info" sx={{ mt: 1.5 }}>
          Tiene la cuota del mes por cobrar: <strong>la deuda se mantiene igual</strong>. Los días congelados se suman al vencimiento
          del contrato y, al regresar, vuelve a "Pendiente de pago" hasta que pague.
        </Alert>}
        <TextField multiline minRows={2} size="small" fullWidth
          label={operacion === 'editar' ? 'Justificación del cambio de fechas' : 'Motivo de congelación'} required
          sx={{ mt: 2 }} value={motivo}
          onChange={e => { escribirMotivo(e.target.value); setPreview(null); }}/>
        <Box sx={{ ...dbanuStyles.formActions, width: '100%', px: 0, pb: 0, mt: 2,
          flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center',
          '& > .MuiButton-root': { flex: '0 0 auto' } }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreview(null); }}/>
          {tipo !== 'SIN_USO' && <BotonVistaPrevia disabled={!inicio || !fin || fin < inicio || procesando}
            cargando={procesando && !preview} onClick={simular}/>}
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
          label="Justificación de reactivación" value={motivo} onChange={e => escribirMotivo(e.target.value)}/>
        {(() => {
          const vigente = suspensiones.find(item => item.estado === 'VIGENTE');
          if (vigente?.tipo === 'SIN_USO') return <Alert severity="info" sx={{ mt: 1.5 }}>
            Congelado sin uso desde el {fechaLegible(vigente.fecha_inicio)} (regreso estimado: {fechaLegible(vigente.fecha_fin_prevista)}).
            Al reactivar, el período empieza hoy con sus días completos y se emite su cuota.
          </Alert>;
          return vigente ? <Alert severity="info" sx={{ mt: 1.5 }}>
            Congelación autorizada hasta <strong>{fechaLegible(vigente.fecha_fin_prevista)}</strong>.
            Si el cliente regresa antes, la reactivación reconoce únicamente los días completos
            anteriores a la fecha efectiva de regreso.
          </Alert> : null;
        })()}
        {previewReactivacion && <Box sx={{ mt: 2, bgcolor: uiTokens.colores.acentoSuave,
          border: `1px solid ${uiTokens.colores.acentoBorde}`, p: 1.5, borderRadius: 1.5 }}>
          <Typography fontWeight={800} variant="subtitle2">Cálculo al regresar · Laravel</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))',
            md: 'repeat(4,minmax(0,1fr))' }, gap: 1.25, mt: 1.25, mb: 1.25 }}>
            {[
              ['Regreso efectivo', fechaLegible(previewReactivacion.fecha_regreso)],
              ['Días suspendidos', `${previewReactivacion.dias_reconocidos} días`],
              ['Vencimiento anterior', fechaLegible(previewReactivacion.fecha_fin_original)],
              ['Nuevo vencimiento', fechaLegible(previewReactivacion.fecha_fin_propuesta)],
            ].map(([label, value], indice) => <Box key={label} sx={{
              p: 1.25, minWidth: 0, borderRadius: 1.5, border: '1px solid',
              borderColor: 'divider', bgcolor: indice === 3 ? 'background.paper' : 'transparent',
            }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
                {value}
              </Typography>
            </Box>)}
          </Box>
          {previewReactivacion.tipo === 'SIN_USO' && <Alert severity="info" sx={{ mb: 1 }}>
            Período nuevo: {fechaLegible(previewReactivacion.periodo_inicio_nuevo)} – {fechaLegible(previewReactivacion.periodo_fin_nuevo)}.
            Al guardar se emite hoy la cuota de {dinero(previewReactivacion.cuota_a_emitir)} (con el descuento vigente, si tiene) y aparece en Ventas para cobrarla.
          </Alert>}
          <Typography variant="body2">Pagos confirmados: ${Number(previewReactivacion.impacto_financiero?.pagos_confirmados || 0).toFixed(2)}</Typography>
          <Typography variant="body2">Saldo emitido: ${Number(previewReactivacion.impacto_financiero?.deuda_emitida || 0).toFixed(2)}</Typography>
          <Typography variant="caption" color="text.secondary">
            Esta operación reactiva hoy. No modifica pagos confirmados y vuelve a validar
            el cálculo en Laravel al guardar. Para un regreso futuro todavía no se registra una reactivación.
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
      {operacion === 'prorrogar' && <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Alarga la congelación (prórroga) o acórtala si regresa antes, sin cambiar todavía el vencimiento del contrato
          ni sus pagos. La fecha no puede ser anterior a hoy; si ya regresó, usa "Reactivar membresía".
        </Alert>
        <TextField select size="small" fullWidth label="Motivo principal" value={motivoCodigo}
          onChange={e => setMotivoCodigo(e.target.value)}>
          {motivosCatalogo.filter(m => m.operacion === 'CONGELAR').map(m =>
            <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Nueva fecha hasta (incluido)" type="date" required fullWidth sx={{ mt: 2 }}
          value={fin} onChange={e => { setFin(e.target.value); setPreview(null); }}
          slotProps={{ inputLabel: { shrink: true } }}/>
        <TextField multiline minRows={2} size="small" fullWidth label="Justificación del cambio"
          required sx={{ mt: 2 }} value={motivo} onChange={e => escribirMotivo(e.target.value)}/>
        {preview && <Alert severity="warning" sx={{ mt: 2 }}>
          {preview.dias_adicionales < 0
            ? <>Se quitarán <strong>{-preview.dias_adicionales} días</strong>.</>
            : <>Se añadirán <strong>{preview.dias_adicionales} días</strong>.</>} Total autorizado: {preview.dias_totales} días.
          Vencimiento proyectado al regresar: <strong>{fechaLegible(preview.fecha_fin_ajustada)}</strong>.
        </Alert>}
        <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 2 }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreview(null); }}/>
          <BotonVistaPrevia disabled={!fin || procesando} cargando={procesando && !preview} onClick={simularProrroga}/>
          <BotonGuardar texto="Guardar cambio" guardando={procesando}
            disabled={!motivoCodigo || !fin || motivo.trim().length < 8} onClick={guardarProrroga}/>
        </Box>
      </Box>}
      {operacion === 'reabrir' && <Box>
        {previewReapertura?.confirmable ? <Alert severity="warning" sx={{ mb: 2 }}>
          Es una acción excepcional. El contrato pasará a {previewReapertura.estado_resultante === 'ACTIVA' ? 'Activa' : previewReapertura.estado_resultante === 'VENCIDA' ? 'disponible para vender' : 'Pendiente de pago'}.
          {previewReapertura.tiene_deuda ? ' Tiene ventas sin pago completo.' : ''}
          {previewReapertura.requiere_reasignar_entrenador ? ' Hay que volver a asignar el entrenador.' : ''}
        </Alert> : <Alert severity="info" sx={{ mb: 2 }}>{previewReapertura?.motivo_bloqueo}</Alert>}
        {previewReapertura?.confirmable && <>
          <TextField select size="small" fullWidth label="Motivo de reapertura" value={motivoCodigo}
            onChange={e => setMotivoCodigo(e.target.value)}>
            {motivosCatalogo.filter(m => m.operacion === 'REABRIR').map(m =>
              <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
          </TextField>
          <TextField multiline minRows={2} size="small" fullWidth label="Justificación de reapertura"
            required sx={{ mt: 2 }} value={motivo} onChange={e => escribirMotivo(e.target.value)}/>
        </>}
        <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 2 }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreviewReapertura(null); }}/>
          {previewReapertura?.confirmable && <BotonGuardar texto="Reabrir contrato" guardando={procesando}
            disabled={!motivoCodigo || motivo.trim().length < 8} onClick={reabrirContrato}/>}
        </Box>
      </Box>}
      {operacion === 'vigencia' && <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Cambiar la vigencia no cobra ni crea una venta: cada día de uso se cobra en Ventas.
          {ciclo?.dias_vendidos?.primero ? ` Debe incluir los días ya vendidos: del ${fechaLegible(ciclo.dias_vendidos.primero)} al ${fechaLegible(ciclo.dias_vendidos.ultimo)}.` : ''}
        </Alert>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
          <TextField size="small" fullWidth required type="date" label="Fecha inicio" value={vigenciaInicio}
            onChange={e => setVigenciaInicio(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}/>
          <TextField size="small" fullWidth required type="date" label="Fecha fin" value={vigenciaFin}
            onChange={e => setVigenciaFin(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: vigenciaInicio || undefined } }}/>
        </Box>
        <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" sx={{ mt: 2 }}
          value={motivo} onChange={e => escribirMotivo(e.target.value)}/>
        <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 2 }}>
          <BotonCancelar disabled={procesando} onClick={() => setOperacion('')}/>
          <BotonGuardar texto="Guardar vigencia" guardando={procesando}
            disabled={!vigenciaInicio || !vigenciaFin || motivo.trim().length < 8} onClick={editarVigencia}/>
        </Box>
      </Box>}
      {operacion === 'precio' && <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Precio pactado actual: ${Number(ciclo?.precio_contrato || 0).toFixed(2)}. Tarifa vigente de la sede: ${Number(ciclo?.tarifa_vigente || 0).toFixed(2)}.
          Corrige períodos ya creados y sin cobrar (con su descuento recalculado); lo cobrado no cambia. Para el próximo mes usa "Precio de renovación".
        </Alert>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
          <TextField size="small" fullWidth required type="number" label="Nuevo precio" value={nuevoPrecio}
            onChange={e => { setNuevoPrecio(e.target.value); }}
            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}/>
          <TextField select size="small" fullWidth required label="Desde el período" value={desdePeriodo}
            onChange={e => { setDesdePeriodo(e.target.value); }}
            helperText={periodosContrato.every(periodoCobrado) ? 'Todos los períodos ya están cobrados: usa "Precio de renovación" para el próximo.' : ''}>
            {periodosContrato.map((p) => <MenuItem key={p.numero_periodo} value={String(p.numero_periodo)} disabled={periodoCobrado(p)}>
              Período {p.numero_periodo} · {fechaLegible(p.fecha_inicio)} – {fechaLegible(p.fecha_fin)} · ${Number(p.precio || 0).toFixed(2)}
              {periodoCobrado(p) ? ` · cobrado $${Number(p.venta_total || 0).toFixed(2)}` : ' · sin cobrar'}
            </MenuItem>)}
          </TextField>
        </Box>
        <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" sx={{ mt: 2 }}
          value={motivo} onChange={e => escribirMotivo(e.target.value)} helperText="Escribe al menos 8 caracteres."/>
        <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 2 }}>
          <BotonCancelar disabled={procesando} onClick={() => setOperacion('')}/>
          <BotonGuardar texto="Guardar precio" guardando={procesando}
            disabled={!(Number(nuevoPrecio) > 0) || !desdePeriodo || motivo.trim().length < 8} onClick={cambiarPrecio}/>
        </Box>
      </Box>}
      {operacion === 'cancelar' && <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta es una cancelación contractual formal. No elimina ventas, cobros, comprobantes ni deuda.
        </Alert>
        <TextField select size="small" fullWidth label="Motivo de cierre" value={motivoCodigo}
          onChange={e => setMotivoCodigo(e.target.value)}>
          {motivosCatalogo.filter(m => m.operacion === 'CERRAR').map(m =>
            <MenuItem key={m.codigo} value={m.codigo}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField multiline minRows={2} size="small" fullWidth label="Justificación de cancelación"
          required sx={{ mt: 2 }} value={motivo} onChange={e => escribirMotivo(e.target.value)}/>
        {previewCancelacion && <Alert severity="info" sx={{ mt: 2 }}>
          Fecha efectiva: {fechaLegible(previewCancelacion.fecha_efectiva)}. Ventas registradas: {previewCancelacion.ventas_emitidas};
          pendientes: {previewCancelacion.ventas_pendientes}. {previewCancelacion.congelacion_abierta ? 'La congelación abierta también quedará cerrada.' : ''}
        </Alert>}
        <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 2 }}>
          <BotonCancelar disabled={procesando} onClick={() => { setOperacion(''); setPreviewCancelacion(null); }}/>
          <BotonVistaPrevia disabled={procesando} cargando={procesando && !previewCancelacion} onClick={simularCancelacion}/>
          <BotonGuardar texto="Cancelar contrato" guardando={procesando}
            disabled={!motivoCodigo || motivo.trim().length < 8} onClick={cancelarContrato}/>
        </Box>
      </Box>}
    </>}
    <DialogCongelacionMembresia
      abierto={vistaPreviaAbierta && Boolean(preview)}
      modo="preview" membresia={membresia} preview={preview}
      motivo={motivo} procesando={procesando} error={error}
      puedeGuardar={Boolean(motivoCodigo && motivo.trim().length >= 8)}
      onCerrar={() => { setVistaPreviaAbierta(false); setError(''); }}
      onGuardar={guardarCongelacion}
    />
    <DialogCongelacionMembresia
      abierto={Boolean(detalleSuspension)} modo="detalle"
      membresia={membresia} suspension={detalleSuspension}
      movimiento={movimientoDe(detalleSuspension)}
      movimientos={ciclo?.movimientos || []} motivos={motivosCatalogo}
      motivoCancelacion={motivoCancelacion}
      onMotivoCancelacion={setMotivoCancelacion}
      onCerrar={() => { setDetalleSuspension(null); setMotivoCancelacion(''); setError(''); }}
      onCancelarProgramada={cancelarProgramada}
      onEditarProgramada={() => editarProgramacion(detalleSuspension)}
      procesando={procesando} error={error}
    />
    <DialogCongelacionMembresia
      abierto={Boolean(resumenGuardado)} modo="exito"
      membresia={membresia} preview={resumenGuardado?.preview}
      motivo={resumenGuardado?.motivo}
      esEdicion={Boolean(resumenGuardado?.esEdicion)}
      onCerrar={() => setResumenGuardado(null)}
      onVerDetalle={() => {
        const guardada = (ciclo?.suspensiones || [])
          .find(item => Number(item.id) === Number(resumenGuardado?.suspensionId));
        setResumenGuardado(null);
        if (guardada) {
          setDetalleSuspension(guardada);
          setMotivoCancelacion('');
        }
      }}
    />
  </Box>;
}
