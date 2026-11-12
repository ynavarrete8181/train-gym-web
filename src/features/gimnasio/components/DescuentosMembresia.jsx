import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { ModalConfirmacion } from '../../../components/common/ModalConfirmacion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

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
  // Sedes autorizadas: un descuento puede valer en todas o solo en una de ellas.
  const sedesMembresia = (membresia.sedes_habilitadas || []).filter((s) => s.activo !== false);
  const tarifaSede = (datos.tarifas || []).find((t) => form?.sede_id && String(t.sede_id) === String(form.sede_id));
  const base = Number(tarifaSede?.precio ?? membresia.precio_aplicado ?? 0);
  const ejemplo = form && Number(form.valor) > 0
    ? Math.min(base, form.tipo === 'PORCENTAJE' ? base * Number(form.valor) / 100 : Number(form.valor))
    : 0;

  const nuevo = () => {
    setExito(''); setError('');
    setForm({ tipo: 'FIJO', valor: '', sede_id: '', fecha_inicio: String(contrato.inicio || '').slice(0, 10), fecha_fin: String(contrato.fin || '').slice(0, 10), motivo: '' });
  };
  const editar = (d) => {
    setExito(''); setError('');
    // Uno que ya empezó no se reescribe: el cambio rige desde una fecha y queda como registro nuevo.
    const inicio = String(d.fecha_inicio).slice(0, 10);
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
    const siguiente = (f) => { const x = new Date(`${f}T12:00:00`); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };
    const yaEmpezo = inicio <= hoy;
    setForm({ id: d.id, yaEmpezo, inicioOriginal: inicio, tipo: d.tipo, valor: Number(d.valor), sede_id: d.sede_id ? String(d.sede_id) : '',
      fecha_inicio: yaEmpezo ? (hoy > inicio ? hoy : siguiente(inicio)) : inicio, fecha_fin: String(d.fecha_fin || '').slice(0, 10), motivo: '' });
  };
  const cambiar = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  const guardar = async () => {
    setGuardando(true); setError('');
    const payload = { tipo: form.tipo, valor: Number(form.valor), sede_id: form.sede_id ? Number(form.sede_id) : null, fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null, motivo: form.motivo.trim() };
    try {
      if (form.id) await gimnasioServicio.actualizarDescuentoMembresia(membresia.id, form.id, payload);
      else await gimnasioServicio.registrarDescuentoMembresia(membresia.id, payload);
      setExito(form.yaEmpezo ? 'Cambio registrado: el descuento anterior queda en el historial.' : form.id ? 'Descuento actualizado.' : 'Descuento registrado.');
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

  const valido = form && Number(form.valor) > 0 && form.fecha_inicio && (form.fecha_fin || !contrato.fin) && form.motivo.trim().length >= 8;

  return <Stack spacing={2}>
    <Stack direction="row" gap={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 260px' }}>
        Dentro del contrato ({fecha(contrato.inicio)} al {fecha(contrato.fin)}), para todas las sedes o solo una.
        Continúa solo al renovar; para que no siga, finalízalo.
      </Typography>
      {!form && <Button startIcon={<AddOutlinedIcon />} onClick={nuevo}>Agregar descuento</Button>}
    </Stack>
    {error && <Alert severity="error">{error}</Alert>}
    {exito && <Alert severity="success">{exito}</Alert>}
    {fueraDelContrato.length > 0 && <Alert severity="warning">
      {fueraDelContrato.length === 1 ? 'Un descuento termina' : `${fueraDelContrato.length} descuentos terminan`} después del contrato ({fecha(contrato.fin)}).
      Se registró antes de esta regla: edítalo para que termine a más tardar ese día.
    </Alert>}

    {form && <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: form.yaEmpezo ? 0.5 : 1.5 }}>{form.id ? 'Editar descuento' : 'Nuevo descuento'}</Typography>
      {form.yaEmpezo && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Este descuento ya se está aplicando: el cambio se guarda como un registro nuevo y el actual queda en el historial.
      </Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 1.5 }}>
        <TextField select size="small" label="Aplica en" value={form.sede_id} onChange={(e) => cambiar('sede_id', e.target.value)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Todas las sedes</MenuItem>
          {sedesMembresia.map((s) => <MenuItem key={s.sede_id} value={String(s.sede_id)}>Solo {s.sede_nombre}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Tipo" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
          <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
          <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
        </TextField>
        <TextField size="small" type="number" required label={form.tipo === 'FIJO' ? 'Descuento ($)' : 'Descuento (%)'} value={form.valor}
          onChange={(e) => cambiar('valor', e.target.value)} slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
        <TextField size="small" type="date" required label={form.yaEmpezo ? 'El cambio rige desde' : 'Fecha inicio'} value={form.fecha_inicio}
          onChange={(e) => cambiar('fecha_inicio', e.target.value)}
          helperText={form.yaEmpezo ? `Hasta el día anterior sigue el descuento actual (desde ${fecha(form.inicioOriginal)}).` : ''}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: (form.yaEmpezo ? form.inicioOriginal : String(contrato.inicio || '').slice(0, 10)) || undefined, max: String(contrato.fin || '').slice(0, 10) || undefined } }} />
        <TextField size="small" type="date" required={Boolean(contrato.fin)} label="Fecha fin" value={form.fecha_fin}
          onChange={(e) => cambiar('fecha_fin', e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.fecha_inicio || undefined, max: String(contrato.fin || '').slice(0, 10) || undefined } }} />
      </Box>
      <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" sx={{ mt: 1.5 }} value={form.motivo}
        helperText="Escribe al menos 8 caracteres." onChange={(e) => cambiar('motivo', e.target.value)} />
      {ejemplo > 0 && <Alert severity="info" sx={{ mt: 1.5 }}>
        {tarifaSede ? `En ${tarifaSede.sede_nombre}` : 'Con el precio del contrato'}: {dinero(base)} − {dinero(ejemplo)} = {dinero(base - ejemplo)}.
        {tarifaSede ? ' En las demás sedes no cambia.' : ' En Ventas se calcula con la tarifa de la sede donde se cobra.'}
      </Alert>}
      {Number(form.valor) > 0 && (datos.tarifas || []).length > 0 && <Box sx={{ mt: 1.5 }}>
        <PagaPorSede filas={(datos.tarifas || []).filter((t) => !form.sede_id || String(t.sede_id) === String(form.sede_id)).map((t) => {
          const importe = Math.min(t.precio, form.tipo === 'PORCENTAJE' ? Math.round(t.precio * Number(form.valor)) / 100 : Number(form.valor));
          return { ...t, descuento: importe, paga: t.precio - importe };
        })} />
      </Box>}
      <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 1.5 }}>
        <BotonCancelar disabled={guardando} onClick={() => setForm(null)} />
        <BotonGuardar texto={form.id ? 'Guardar descuento' : 'Registrar descuento'} guardando={guardando} disabled={!valido} onClick={guardar} />
      </Box>
    </Box>}

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
                onClick={() => { setFinalizar(d); setMotivoFin(''); }}><StopCircleOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
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
