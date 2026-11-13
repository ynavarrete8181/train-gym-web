import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx';
import { ModalConfirmacion } from '../../../components/common/ModalConfirmacion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { DialogDescuento } from './DialogDescuento.jsx';

const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : 'Sin fin');
const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const textoDescuento = (d) => (d.tipo === 'PORCENTAJE' ? `${Number(d.valor)} %` : dinero(d.valor));
const ESTADOS = {
  VIGENTE: { chip: 'activo', label: 'Vigente' },
  PROGRAMADO: { chip: 'pendiente', label: 'Programado' },
  VENCIDO: { chip: 'cerrado', label: 'Vencido' },
  FINALIZADO: { chip: 'cancelada', label: 'Finalizado' },
};
const textoSede = (d) => d.sede_nombre || 'Todas las sedes';
const COLUMNAS = {
  descuento: (d) => textoDescuento(d),
  sede: (d) => textoSede(d),
  desde: (d) => fecha(d.fecha_inicio),
  hasta: (d) => fecha(d.fecha_fin),
  estado: (d) => ESTADOS[d.estado]?.label || d.estado,
  autorizo: (d) => d.autorizado_nombre || '—',
};
const OPCIONES = { sinOrdenar: ['desde', 'hasta'] };
const mensajeError = (e) => {
  const errores = e?.response?.data?.errors;
  return (errores ? Object.values(errores).flat()[0] : null) || e?.response?.data?.mensaje || 'No se pudo guardar.';
};

/** Descuentos sobre el contrato: siempre dentro de sus fechas y con historial. */
export function DescuentosMembresia({ membresia, onActualizado }) {
  const [datos, setDatos] = useState({ contrato: {}, descuentos: [] });
  const [form, setForm] = useState(null);
  const [finalizar, setFinalizar] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [motivoFin, setMotivoFin] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = async () => {
    try {
      const respuesta = await gimnasioServicio.obtenerDescuentosMembresia(membresia.id);
      setDatos(respuesta || { contrato: {}, descuentos: [] });
    } catch (e) {
      setError(mensajeError(e));
    }
  };
  useEffect(() => { cargar(); }, [membresia?.id]);

  const filas = useMemo(() => datos.descuentos || [], [datos]);
  const tabla = useTablaLocal(filas, COLUMNAS, OPCIONES);
  const contrato = datos.contrato || {};
  const finContrato = String(contrato.fin || '').slice(0, 10);
  const fueraDelContrato = filas.filter((d) => ['VIGENTE', 'PROGRAMADO'].includes(d.estado) && finContrato
    && (!d.fecha_fin || String(d.fecha_fin).slice(0, 10) > finContrato));
  // Sedes autorizadas con su tarifa: el modal solo ofrece estas.
  const autorizadas = (membresia.sedes_habilitadas || []).filter((s) => s.activo !== false).map((s) => String(s.sede_id));
  const sedesModal = (datos.tarifas || []).filter((t) => !autorizadas.length || autorizadas.includes(String(t.sede_id)))
    .map((t) => ({ id: t.sede_id, nombre: t.sede_nombre, precio: Number(t.precio) }));
  const inicioContrato = String(contrato.inicio || '').slice(0, 10);
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

  const nuevo = () => { setExito(''); setError(''); setForm({ nuevo: true }); };
  const editar = (d) => {
    setExito(''); setError('');
    // Uno que ya empezó no se reescribe: el cambio rige desde una fecha y queda como registro nuevo.
    const inicio = String(d.fecha_inicio).slice(0, 10);
    const siguiente = (f) => { const x = new Date(`${f}T12:00:00`); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };
    const yaEmpezo = inicio <= hoy;
    setForm({ id: d.id, inicioOriginal: yaEmpezo ? inicio : null, inicial: {
      sede_id: d.sede_id, tipo: d.tipo, valor: Number(d.valor), motivo: '',
      fecha_inicio: yaEmpezo ? (hoy > inicio ? hoy : siguiente(inicio)) : inicio,
      fecha_fin: String(d.fecha_fin || '').slice(0, 10),
    } });
  };

  const guardar = async (payload) => {
    setGuardando(true); setError('');
    try {
      if (form.id) await gimnasioServicio.actualizarDescuentoMembresia(membresia.id, form.id, payload);
      else await gimnasioServicio.registrarDescuentoMembresia(membresia.id, payload);
      setExito(form.inicioOriginal ? 'Cambio registrado: el descuento anterior queda en el historial.' : form.id ? 'Descuento actualizado.' : 'Descuento registrado.');
      setForm(null);
      await cargar();
      await onActualizado?.();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarFinalizar = async () => {
    setGuardando(true); setError('');
    try {
      await gimnasioServicio.finalizarDescuentoMembresia(membresia.id, finalizar.id, motivoFin.trim());
      setExito('Descuento finalizado. Desde hoy ya no se aplica en Ventas.');
      setFinalizar(null); setMotivoFin('');
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return <Stack spacing={2}>
    <Stack direction="row" gap={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 260px' }}>
        Dentro del contrato ({fecha(contrato.inicio)} al {fecha(contrato.fin)}), para todas las sedes o solo una.
        Continúa solo al renovar; para que no siga, finalízalo.
      </Typography>
      <BotonAnadir onClick={nuevo} />
    </Stack>
    {error && !form && <Alert severity="error">{error}</Alert>}
    {exito && <Alert severity="success">{exito}</Alert>}
    {fueraDelContrato.length > 0 && <Alert severity="warning">
      {fueraDelContrato.length === 1 ? 'Un descuento termina' : `${fueraDelContrato.length} descuentos terminan`} después del contrato ({fecha(contrato.fin)}).
      Se registró antes de esta regla: edítalo para que termine a más tardar ese día.
    </Alert>}

    <DialogDescuento
      abierto={Boolean(form)}
      inicial={form?.inicial || null}
      sedes={sedesModal}
      inicio={form?.inicioOriginal ? null : inicioContrato}
      fin={finContrato}
      inicioOriginal={form?.inicioOriginal || null}
      otros={filas.filter((d) => ['VIGENTE', 'PROGRAMADO'].includes(d.estado) && d.id !== form?.id)
        .map((d) => ({ sede_id: d.sede_id, fecha_inicio: String(d.fecha_inicio).slice(0, 10), fecha_fin: d.fecha_fin ? String(d.fecha_fin).slice(0, 10) : null }))}
      guardando={guardando}
      error={form ? error : ''}
      textoGuardar={form?.id ? 'Guardar cambios' : 'Registrar descuento'}
      onCerrar={() => { setForm(null); setError(''); }}
      onGuardar={guardar}
    />

    <TablaGestion {...tabla.propsTabla}>
      <TableHead><TableRow>
        <FilterHeaderCell {...tabla.filtro('descuento')}>Descuento</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('sede')}>Sede</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('desde')}>Desde</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('hasta')}>Hasta</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('estado')}>Estado</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('autorizo')}>Autorizó</FilterHeaderCell>
        <TableCell>Motivo</TableCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {tabla.visibles.map((d) => {
          const abierto = ['VIGENTE', 'PROGRAMADO'].includes(d.estado);
          return <TableRow key={d.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>{textoDescuento(d)}</TableCell>
            <TableCell>{textoSede(d)}</TableCell>
            <TableCell>{fecha(d.fecha_inicio)}</TableCell>
            <TableCell>{fecha(d.fecha_fin)}</TableCell>
            <TableCell><StatusChip estado={ESTADOS[d.estado]?.chip} label={ESTADOS[d.estado]?.label || d.estado} /></TableCell>
            <TableCell>{d.autorizado_nombre || '—'}</TableCell>
            <TableCell sx={{ maxWidth: 220, overflowWrap: 'anywhere' }}>{d.motivo || '—'}</TableCell>
            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
              <Tooltip title="Ver dónde se aplica y cuánto paga en cada sede"><IconButton aria-label="Ver descuento por sede" sx={dbanuStyles.actionView}
                onClick={() => setDetalleId(detalleId === d.id ? null : d.id)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
              {abierto && <Tooltip title="Editar descuento"><IconButton aria-label="Editar descuento" sx={dbanuStyles.actionEdit} onClick={() => editar(d)}>
                <EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
              {abierto && <Tooltip title="Finalizar descuento"><IconButton aria-label="Finalizar descuento" color="error" sx={{ ml: 1 }}
                onClick={() => { setFinalizar(d); setMotivoFin(`Finalización del descuento ${textoDescuento(d)} (${textoSede(d)}) desde el ${fecha(hoy)}: deja de aplicarse en Ventas y en las próximas renovaciones.`); }}><StopCircleOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
            </TableCell>
          </TableRow>;
        })}
        {tabla.sinResultados && <TablaEstadoFila colSpan={8} texto="Esta membresía no tiene descuentos registrados." />}
      </TableBody>
    </TablaGestion>

    {(() => {
      const d = filas.find((x) => x.id === detalleId);
      if (!d) return null;
      return <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.2, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" fontWeight={900}>Descuento de {textoDescuento(d)} · {textoSede(d)} · {fecha(d.fecha_inicio)} al {fecha(d.fecha_fin)}</Typography>
          <Button size="small" onClick={() => setDetalleId(null)}>Cerrar</Button>
        </Stack>
        <PagaPorSede filas={d.por_sede || []} />
        <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 2, mb: 0.8 }}>Aplicado en</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead><TableRow>
              {['Sede', 'Período', 'Venta', 'Precio', 'Descuento', 'Pagó'].map((t) => <TableCell key={t} sx={{ fontWeight: 800, fontSize: 12, color: '#64748b' }}>{t}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {(d.aplicaciones || []).map((a, i) => <TableRow key={i}>
                <TableCell sx={{ fontWeight: 700 }}>{a.sede_nombre || '—'}</TableCell>
                <TableCell>Período {a.numero_periodo} · {fecha(a.fecha_inicio)}{a.fecha_fin && a.fecha_fin !== a.fecha_inicio ? ` al ${fecha(a.fecha_fin)}` : ''}</TableCell>
                <TableCell>{a.venta_numero || 'Sin venta'}{a.venta_estado ? <Chip size="small" variant="outlined" label={String(a.venta_estado).toLowerCase()} sx={{ ml: 0.8, height: 20 }} /> : null}</TableCell>
                <TableCell>{dinero(a.precio)}</TableCell>
                <TableCell sx={{ color: 'success.dark' }}>−{dinero(a.descuento_importe)}</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>{dinero(a.paga)}</TableCell>
              </TableRow>)}
              {(d.aplicaciones || []).length === 0 && <TableRow><TableCell colSpan={6} align="center">
                <Typography variant="caption" color="text.secondary">Todavía no se ha cobrado ningún período con este descuento.</Typography>
              </TableCell></TableRow>}
            </TableBody>
          </Table>
        </Box>
      </Box>;
    })()}

    <ModalConfirmacion
      open={Boolean(finalizar)}
      titulo="Finalizar descuento"
      descripcion={finalizar ? `${textoDescuento(finalizar)} desde ${fecha(finalizar.fecha_inicio)}. Desde hoy ya no se aplica en Ventas; queda en el historial.` : ''}
      textoConfirmar="Sí, finalizar"

      cargando={guardando}
      confirmarDeshabilitado={motivoFin.trim().length < 8}
      onClose={() => !guardando && setFinalizar(null)}
      onConfirmar={confirmarFinalizar}
    >
      <TextField autoFocus fullWidth multiline minRows={2} size="small" required label="Motivo" sx={{ mt: 1 }}
        helperText="Escribe al menos 8 caracteres." value={motivoFin} onChange={(e) => setMotivoFin(e.target.value)} />
    </ModalConfirmacion>
  </Stack>;
}

/** Mismo descuento, tarifa distinta en cada sede: cuánto paga el cliente en cada una. */
function PagaPorSede({ filas }) {
  if (!filas.length) return null;
  return <Box>
    <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.8 }}>Paga en cada sede</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(filas.length, 3)}, minmax(0, 1fr))` }, gap: 1 }}>
      {filas.map((f) => <Box key={f.sede_id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
        <Typography variant="body2" fontWeight={800}>{f.sede_nombre}</Typography>
        <Typography variant="caption" color="text.secondary">Tarifa {dinero(f.precio)} − descuento {dinero(f.descuento)}</Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 900, color: 'success.dark' }}>Paga {dinero(f.paga)}</Typography>
      </Box>)}
    </Box>
  </Box>;
}
