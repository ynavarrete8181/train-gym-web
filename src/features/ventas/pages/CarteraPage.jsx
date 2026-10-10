import { useEffect, useMemo, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { VentaPosFormulario } from '../components/VentaPosFormulario.jsx';
import { ventaServicio } from '../services/ventaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('es-EC') : '—';
const fechaHora = (valor) => valor ? new Date(valor).toLocaleString('es-EC') : '—';

const estadoSx = (estado) => {
  const e = String(estado || '').toUpperCase();
  if (e === 'VENCIDA') return { color: '#b42318', borderColor: '#fda29b', bgcolor: '#fff' };
  if (e === 'PARCIAL') return { color: '#b54708', borderColor: '#fedf89', bgcolor: '#fff' };
  if (e === 'PAGADA') return { color: '#027a48', borderColor: '#a6f4c5', bgcolor: '#fff' };
  if (e === 'ANULADA') return { color: '#667085', borderColor: '#d0d5dd', bgcolor: '#fff' };
  return { color: '#8a6500', borderColor: '#efd786', bgcolor: '#fff' };
};

function ResumenCard({ label, value, secondary }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.2, mt: .25 }}>{value}</Typography>
      {secondary ? <Typography variant="caption" color="text.secondary">{secondary}</Typography> : null}
    </Paper>
  );
}

export function CarteraPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', estado: '', page: 1, per_page: 10 });
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detalle, setDetalle] = useState(null);
  const [dialogo, setDialogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);
  const [ventaInicial, setVentaInicial] = useState(null);
  const [vista, setVista] = useState('lista');
  const [formCuenta, setFormCuenta] = useState({ fecha_vencimiento: '', prioridad: 'NORMAL', responsable_id: '', observaciones: '' });
  const [formGestion, setFormGestion] = useState({ tipo: 'LLAMADA', resultado: 'CONTACTADO', detalle: '', proxima_gestion_at: '' });
  const [formCompromiso, setFormCompromiso] = useState({ monto: '', fecha_compromiso: '', observaciones: '' });

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};

  const show = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const [response, turno] = await Promise.all([
        ventaServicio.obtenerCartera(params),
        ventaServicio.obtenerTurnoCajaActual().catch(() => ({ datos: null })),
      ]);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setTurnoActual(turno?.datos || null);
    } catch (error) {
      show(error.response?.data?.mensaje || 'No se pudo cargar la cartera.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const buscar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const abrirDetalle = async (item) => {
    try {
      const response = await ventaServicio.obtenerDetalleCartera(item.id);
      const d = response.datos || response;
      setDetalle(d);
      setFormCuenta({
        fecha_vencimiento: String(d.fecha_vencimiento || '').slice(0, 10),
        prioridad: d.prioridad || 'NORMAL',
        responsable_id: d.responsable_id || '',
        observaciones: d.observaciones || '',
      });
      setFormGestion({ tipo: 'LLAMADA', resultado: 'CONTACTADO', detalle: '', proxima_gestion_at: '' });
      setFormCompromiso({ monto: '', fecha_compromiso: '', observaciones: '' });
      setDialogo(true);
    } catch (error) {
      show(error.response?.data?.mensaje || 'No se pudo cargar el detalle de cartera.', 'error');
    }
  };

  const recargarDetalle = async () => {
    if (!detalle?.id) return;
    const response = await ventaServicio.obtenerDetalleCartera(detalle.id);
    setDetalle(response.datos || response);
  };

  const guardarCuenta = async () => {
    setGuardando(true);
    try {
      await ventaServicio.actualizarCartera(detalle.id, {
        fecha_vencimiento: formCuenta.fecha_vencimiento,
        prioridad: formCuenta.prioridad,
        responsable_id: formCuenta.responsable_id ? Number(formCuenta.responsable_id) : null,
        observaciones: formCuenta.observaciones || null,
      });
      await recargarDetalle();
      await cargar();
      show('Cuenta de cartera actualizada.', 'success');
    } catch (error) {
      show(error.response?.data?.mensaje || 'No se pudo actualizar la cuenta.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarGestion = async () => {
    if (!formGestion.detalle.trim()) {
      show('Ingresa el detalle de la gestión.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await ventaServicio.registrarGestionCartera(detalle.id, {
        tipo: formGestion.tipo,
        resultado: formGestion.resultado || null,
        detalle: formGestion.detalle,
        proxima_gestion_at: formGestion.proxima_gestion_at || null,
      });
      setFormGestion({ tipo: 'LLAMADA', resultado: 'CONTACTADO', detalle: '', proxima_gestion_at: '' });
      await recargarDetalle();
      await cargar();
      show('Gestión registrada correctamente.', 'success');
    } catch (error) {
      show(error.response?.data?.mensaje || 'No se pudo registrar la gestión.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarCompromiso = async () => {
    if (!formCompromiso.monto || !formCompromiso.fecha_compromiso) {
      show('Completa monto y fecha del compromiso.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await ventaServicio.registrarCompromisoCartera(detalle.id, {
        monto: Number(formCompromiso.monto),
        fecha_compromiso: formCompromiso.fecha_compromiso,
        observaciones: formCompromiso.observaciones || null,
      });
      setFormCompromiso({ monto: '', fecha_compromiso: '', observaciones: '' });
      await recargarDetalle();
      await cargar();
      show('Compromiso de pago registrado.', 'success');
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      show(primero || error.response?.data?.mensaje || 'No se pudo registrar el compromiso.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const abrirCobro = async (item) => {
    if (!turnoActual?.id) {
      show('Para cobrar esta cuenta necesitas un turno de caja propio abierto.', 'warning');
      return;
    }
    try {
      const response = await ventaServicio.obtenerDetalleVenta(item.venta_id);
      setVentaInicial(response.datos || response);
      setDialogo(false);
      setVista('cobro');
    } catch (error) {
      show(error.response?.data?.mensaje || 'No se pudo abrir la venta para cobrar.', 'error');
    }
  };

  const columnas = useMemo(() => [
    {
      key: 'cliente',
      label: 'Cliente',
      render: (item) => <Box><Typography variant="body2" fontWeight={800}>{item.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.cliente_identificacion || 'Sin identificación'}</Typography></Box>,
    },
    {
      key: 'venta',
      label: 'Venta',
      render: (item) => <Box><Typography variant="body2" fontWeight={700}>{item.venta_numero}</Typography><Typography variant="caption" color="text.secondary">{item.plan_nombre || item.concepto}</Typography></Box>,
    },
    { key: 'sede', label: 'Sede', render: (item) => item.sede_nombre || '—' },
    {
      key: 'vencimiento',
      label: 'Vencimiento',
      render: (item) => <Box><Typography variant="body2">{fecha(item.fecha_vencimiento)}</Typography>{Number(item.dias_vencidos || 0) > 0 ? <Typography variant="caption" color="error.main">{item.dias_vencidos} días vencida</Typography> : null}</Box>,
    },
    { key: 'total', label: 'Total', render: (item) => dinero(item.venta_total) },
    { key: 'pagado', label: 'Pagado', render: (item) => dinero(item.total_pagado) },
    { key: 'saldo', label: 'Saldo', render: (item) => <Typography fontWeight={900}>{dinero(item.saldo_pendiente)}</Typography> },
    { key: 'responsable', label: 'Responsable', render: (item) => item.responsable_nombre || 'Sin asignar' },
    {
      key: 'estado',
      label: 'Estado',
      render: (item) => <Chip size="small" variant="outlined" label={item.estado_cartera} sx={{ fontWeight: 800, ...estadoSx(item.estado_cartera) }} />,
    },
  ], []);

  if (vista === 'cobro' && ventaInicial) {
    return (
      <VentaPosFormulario
        ventaInicial={ventaInicial}
        onVolver={() => { setVentaInicial(null); setVista('lista'); }}
        onGuardado={() => {
          setVentaInicial(null);
          setVista('lista');
          cargar();
        }}
      />
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Cartera" descripcion="Seguimiento de cuentas por cobrar, vencimientos, gestiones y compromisos de pago." icono={<AccountBalanceWalletOutlinedIcon />} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.25, mt: 2, mb: 1.5 }}>
        <ResumenCard label="Cuentas abiertas" value={resumen.cuentas_abiertas || 0} />
        <ResumenCard label="Saldo por cobrar" value={dinero(resumen.saldo_total)} />
        <ResumenCard label="Cuentas vencidas" value={resumen.vencidas || 0} />
        <ResumenCard label="Saldo vencido" value={dinero(resumen.saldo_vencido)} secondary={`${resumen.compromisos_pendientes || 0} compromisos pendientes`} />
      </Box>

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ busqueda: valor })}
          acciones={(
            <TextField select size="small" label="Estado" value={filtros.estado} onChange={(e) => buscar({ estado: e.target.value })} sx={{ minWidth: 160 }}>
              <MenuItem value="">Todos</MenuItem>
              {(catalogos.estados || []).map((estado) => <MenuItem key={estado} value={estado}>{estado}</MenuItem>)}
            </TextField>
          )}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 10}
          onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }}
          onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }}
          cargando={cargando}
        >
          <TableHead>
            <TableRow>
              {columnas.map((col) => <TableCell key={col.key}>{col.label}</TableCell>)}
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                {columnas.map((col) => <TableCell key={col.key}>{col.render(item)}</TableCell>)}
                <TableCell align="right">
                  <Stack direction="row" spacing={.5} justifyContent="flex-end">
                    <Tooltip title="Gestionar cuenta">
                      <Button size="small" variant="outlined" startIcon={<AssignmentOutlinedIcon />} onClick={() => abrirDetalle(item)}>Gestionar</Button>
                    </Tooltip>
                    <Tooltip title={turnoActual?.id ? 'Cobrar cuenta' : 'Necesitas un turno propio abierto'}>
                      <span>
                        <Button size="small" variant="outlined" startIcon={<PaymentsOutlinedIcon />} disabled={!turnoActual?.id || ['PAGADA', 'ANULADA'].includes(item.estado_cartera)} onClick={() => abrirCobro(item)}>Cobrar</Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto="No hay cuentas en cartera." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>

      <Dialog open={dialogo} onClose={() => !guardando && setDialogo(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 900 }}>Gestión de cartera</DialogTitle>
        <DialogContent dividers>
          {detalle ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                <ResumenCard label="Cliente" value={detalle.cliente_nombre} secondary={detalle.cliente_identificacion} />
                <ResumenCard label="Venta" value={detalle.venta_numero} secondary={detalle.plan_nombre || detalle.concepto} />
                <ResumenCard label="Saldo pendiente" value={dinero(detalle.saldo_pendiente)} secondary={`Pagado ${dinero(detalle.total_pagado)}`} />
                <ResumenCard label="Estado" value={detalle.estado_cartera} secondary={detalle.dias_vencidos > 0 ? `${detalle.dias_vencidos} días vencida` : 'Al día'} />
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>Datos de seguimiento</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                  <TextField type="date" size="small" label="Vencimiento" InputLabelProps={{ shrink: true }} value={formCuenta.fecha_vencimiento} onChange={(e) => setFormCuenta((f) => ({ ...f, fecha_vencimiento: e.target.value }))} />
                  <TextField select size="small" label="Prioridad" value={formCuenta.prioridad} onChange={(e) => setFormCuenta((f) => ({ ...f, prioridad: e.target.value }))}>
                    {(catalogos.prioridades || []).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Responsable" value={formCuenta.responsable_id} onChange={(e) => setFormCuenta((f) => ({ ...f, responsable_id: e.target.value }))}>
                    <MenuItem value="">Sin asignar</MenuItem>
                    {(catalogos.responsables || []).map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </TextField>
                  <Button variant="outlined" disabled={guardando} onClick={guardarCuenta} sx={dbanuStyles.secondaryButtonRevive}>Guardar seguimiento</Button>
                  <TextField size="small" label="Observaciones" value={formCuenta.observaciones} onChange={(e) => setFormCuenta((f) => ({ ...f, observaciones: e.target.value }))} sx={{ gridColumn: { xs: 'auto', md: 'span 4' } }} />
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>Registrar gestión</Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField select size="small" label="Tipo" value={formGestion.tipo} onChange={(e) => setFormGestion((f) => ({ ...f, tipo: e.target.value }))}>
                        {(catalogos.tipos_gestion || []).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                      <TextField select size="small" label="Resultado" value={formGestion.resultado} onChange={(e) => setFormGestion((f) => ({ ...f, resultado: e.target.value }))}>
                        {(catalogos.resultados_gestion || []).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </TextField>
                    </Box>
                    <TextField multiline minRows={2} size="small" label="Detalle *" value={formGestion.detalle} onChange={(e) => setFormGestion((f) => ({ ...f, detalle: e.target.value }))} />
                    <TextField type="datetime-local" size="small" label="Próxima gestión" InputLabelProps={{ shrink: true }} value={formGestion.proxima_gestion_at} onChange={(e) => setFormGestion((f) => ({ ...f, proxima_gestion_at: e.target.value }))} />
                    <Button variant="outlined" disabled={guardando} onClick={registrarGestion}>Registrar gestión</Button>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>Compromiso de pago</Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField type="number" size="small" label="Monto *" value={formCompromiso.monto} onChange={(e) => setFormCompromiso((f) => ({ ...f, monto: e.target.value }))} inputProps={{ min: 0.01, step: 0.01 }} />
                      <TextField type="date" size="small" label="Fecha *" InputLabelProps={{ shrink: true }} value={formCompromiso.fecha_compromiso} onChange={(e) => setFormCompromiso((f) => ({ ...f, fecha_compromiso: e.target.value }))} />
                    </Box>
                    <TextField multiline minRows={2} size="small" label="Observaciones" value={formCompromiso.observaciones} onChange={(e) => setFormCompromiso((f) => ({ ...f, observaciones: e.target.value }))} />
                    <Button variant="outlined" disabled={guardando} onClick={registrarCompromiso}>Registrar compromiso</Button>
                  </Stack>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900}>Historial de gestiones</Typography>
                  <Stack spacing={.75} sx={{ mt: 1 }}>
                    {(detalle.gestiones || []).length ? detalle.gestiones.map((g) => (
                      <Box key={g.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1 }}>
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                          <Typography variant="body2" fontWeight={800}>{g.tipo} · {g.resultado || 'Sin resultado'}</Typography>
                          <Typography variant="caption" color="text.secondary">{fechaHora(g.gestion_at)}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{g.detalle}</Typography>
                        <Typography variant="caption" color="text.secondary">{g.usuario_nombre || 'Sistema'}</Typography>
                      </Box>
                    )) : <Typography variant="caption" color="text.secondary">Sin gestiones registradas.</Typography>}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900}>Compromisos</Typography>
                  <Stack spacing={.75} sx={{ mt: 1 }}>
                    {(detalle.compromisos || []).length ? detalle.compromisos.map((c) => (
                      <Box key={c.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1 }}>
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                          <Typography variant="body2" fontWeight={800}>{dinero(c.monto)} · {fecha(c.fecha_compromiso)}</Typography>
                          <Chip size="small" variant="outlined" label={c.estado} />
                        </Stack>
                        {c.observaciones ? <Typography variant="body2" color="text.secondary">{c.observaciones}</Typography> : null}
                      </Box>
                    )) : <Typography variant="caption" color="text.secondary">Sin compromisos registrados.</Typography>}
                  </Stack>
                </Box>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(false)} disabled={guardando}>Cerrar</Button>
          <Button variant="contained" startIcon={<PaymentsOutlinedIcon />} disabled={!turnoActual?.id || !detalle || ['PAGADA', 'ANULADA'].includes(detalle?.estado_cartera)} onClick={() => abrirCobro(detalle)} sx={dbanuStyles.addButtonRevive}>Cobrar</Button>
        </DialogActions>
      </Dialog>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
