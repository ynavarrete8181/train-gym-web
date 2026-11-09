import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { ventaServicio } from '../../ventas/services/ventaServicio.js';

const fecha = value => value ? new Date(String(value).replace(' ', 'T')).toLocaleDateString('es-EC') : '—';
const fechaHora = value => value ? new Date(String(value).replace(' ', 'T')).toLocaleString('es-EC') : '—';
const dinero = value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

function TablaSimple({ columnas, filas, vacio }) {
  const tabla = useTablaLocal(filas, {});
  return <TablaGestion {...tabla.propsTabla}>
    <TableHead><TableRow>{columnas.map(c => <TableCell key={c.key}>{c.label}</TableCell>)}</TableRow></TableHead>
    <TableBody>
      {tabla.visibles.map((fila, i) => <TableRow key={fila.id || i} hover>
        {columnas.map(c => <TableCell key={c.key}>{c.render ? c.render(fila) : (fila[c.key] ?? '—')}</TableCell>)}
      </TableRow>)}
      {!filas.length && <TableRow><TableCell colSpan={columnas.length} align="center">{vacio}</TableCell></TableRow>}
    </TableBody>
  </TablaGestion>;
}

export function ExpedienteMembresiaCliente({ membresia, seccion }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError('');
    gimnasioServicio.obtenerExpedienteMembresia(membresia.id)
      .then(r => { if (vigente) setDatos(r); })
      .catch(e => { if (vigente) setError(e?.response?.data?.mensaje || 'No se pudo consultar el expediente.'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [membresia.id]);

  const ventaPorId = useMemo(() => Object.fromEntries((datos?.ventas || []).map(v => [v.id, v])), [datos]);
  const descargar = async ventaId => {
    try {
      setDescargando(ventaId);
      const blob = await ventaServicio.obtenerComprobantePdf(ventaId);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url; enlace.download = `comprobante-${ventaPorId[ventaId]?.numero || ventaId}.pdf`;
      enlace.click(); URL.revokeObjectURL(url);
    } finally { setDescargando(null); }
  };

  if (cargando) return <Stack direction="row" gap={1} sx={{ alignItems: 'center' }}><CircularProgress size={18}/><Typography variant="body2">Consultando expediente…</Typography></Stack>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!datos) return null;

  if (seccion === 'vigencia') return <Stack spacing={2}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, gap: 1.25 }}>
      {(datos.periodos || []).map(p => <Box key={p.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Período {p.numero_periodo}</Typography>
        <Typography variant="body2" fontWeight={800}>{fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)}</Typography>
        <Typography variant="caption">{dinero(p.precio)} · {p.estado}</Typography>
      </Box>)}
    </Box>
    {!(datos.periodos || []).length && <Alert severity="info">El contrato todavía no tiene períodos registrados.</Alert>}
  </Stack>;

  if (seccion === 'pagos') return <Stack spacing={2}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 1 }}>
      {Object.entries({ Facturado: datos.resumen_financiero.facturado, Pagado: datos.resumen_financiero.pagado, Saldo: datos.resumen_financiero.saldo }).map(([k, v]) =>
        <Box key={k} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="caption">{k}</Typography><Typography fontWeight={900}>{dinero(v)}</Typography></Box>)}
      <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="caption">Cuotas futuras</Typography><Typography fontWeight={900}>{datos.resumen_financiero.cuotas_programadas}</Typography></Box>
    </Box>
    <TablaSimple filas={datos.cuotas || []} vacio="No hay cuotas registradas." columnas={[
      { key: 'numero_cuota', label: 'Cuota' }, { key: 'fecha_vencimiento', label: 'Vencimiento', render: x => fecha(x.fecha_vencimiento) },
      { key: 'monto', label: 'Importe', render: x => dinero(x.monto) }, { key: 'estado', label: 'Estado', render: x => <StatusChip estado={String(x.venta_estado || x.estado).toLowerCase()}/> },
    ]}/>
    <Typography variant="subtitle2" fontWeight={900}>Comprobantes</Typography>
    <TablaSimple filas={datos.comprobantes || []} vacio="No hay comprobantes emitidos." columnas={[
      { key: 'numero', label: 'Número' }, { key: 'emitido_at', label: 'Emisión', render: x => fechaHora(x.emitido_at) },
      { key: 'total', label: 'Total', render: x => dinero(x.total) }, { key: 'estado', label: 'Estado' },
      { key: 'accion', label: 'Acción', render: x => <Button size="small" startIcon={<DownloadOutlinedIcon/>} disabled={descargando === x.venta_id} onClick={() => descargar(x.venta_id)}>PDF</Button> },
    ]}/>
  </Stack>;

  if (seccion === 'reservas') return <Stack spacing={2}>
    <Alert severity="info">Las reservas se muestran por cliente dentro de la vigencia del contrato; la asistencia real se confirma con los accesos vinculados.</Alert>
    <TablaSimple filas={datos.reservas || []} vacio="No existen reservas dentro de esta vigencia." columnas={[
      { key: 'fecha', label: 'Fecha', render: x => fecha(x.fecha) }, { key: 'hora_inicio', label: 'Hora' },
      { key: 'servicio_nombre', label: 'Servicio' }, { key: 'sede_nombre', label: 'Sede' },
      { key: 'estado', label: 'Resultado', render: x => <StatusChip estado={String(x.estado).toLowerCase()}/> },
    ]}/>
    <Typography variant="subtitle2" fontWeight={900}>Ingresos confirmados</Typography>
    <TablaSimple filas={datos.accesos || []} vacio="No existen accesos vinculados a esta membresía." columnas={[
      { key: 'fecha_hora', label: 'Fecha y hora', render: x => fechaHora(x.fecha_hora) }, { key: 'sede_nombre', label: 'Sede' },
      { key: 'metodo', label: 'Método' }, { key: 'estado', label: 'Estado', render: x => <StatusChip estado={String(x.estado).toLowerCase()}/> },
    ]}/>
  </Stack>;

  return <TablaSimple filas={datos.entrenadores || []} vacio="No existen asignaciones de entrenador para este contrato." columnas={[
    { key: 'entrenador_nombre', label: 'Entrenador' }, { key: 'especialidad', label: 'Especialidad' },
    { key: 'sede_nombre', label: 'Sede' }, { key: 'fecha_inicio', label: 'Desde', render: x => fecha(x.fecha_inicio) },
    { key: 'fecha_fin', label: 'Hasta', render: x => fecha(x.fecha_fin) }, { key: 'estado', label: 'Estado', render: x => <StatusChip estado={String(x.estado).toLowerCase()}/> },
  ]}/>;
}
