import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import { Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { VentaPosFormulario } from '../components/VentaPosFormulario.jsx';
import { ventaServicio } from '../services/ventaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : 'Sin fecha';
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const opcionesEstados = (valores = []) => valores.map((item) => ({ value: String(item.valor_interno), label: String(item.nombre || item.valor_interno) }));
const estadoTexto = (valor) => String(valor || '').toLowerCase().replace('pagada', 'activo').replace('emitido', 'activo');
const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('') || 'CF';
const tipoCuenta = (venta) => {
  const tipoPlan = String(venta.plan_tipo_producto || '').toUpperCase();
  if (tipoPlan === 'PASE_DIARIO') return 'Pase diario';
  if (tipoPlan === 'PAQUETE_VISITAS') return 'Paquete de visitas';
  if (tipoPlan === 'PAQUETE_SESIONES') return 'Paquete de sesiones';
  const tipoVenta = String(venta.tipo_venta || '').toUpperCase();
  if (tipoVenta === 'MEMBRESIA') return 'Membresía';
  if (tipoVenta === 'SERVICIO') return 'Servicio';
  if (tipoVenta === 'PRODUCTO') return 'Producto';
  return 'Venta';
};

export function VentasPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [seccion, setSeccion] = useState('abiertas');
  const [cuentaInicial, setCuentaInicial] = useState(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [cobro, setCobro] = useState(null);
  const [guardandoCobro, setGuardandoCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [referenciaPago, setReferenciaPago] = useState('');

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventaServicio.obtenerVentas(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'Error al cargar ventas.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const cargarCuentas = async () => {
    setCargandoCuentas(true);
    try {
      const response = await ventaServicio.obtenerVentas({
        page: 1,
        per_page: 50,
        estado: ['PENDIENTE', 'PARCIAL'],
      });
      setCuentasAbiertas(response.datos || []);
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudieron cargar las cuentas abiertas.', tipo: 'error' });
    } finally {
      setCargandoCuentas(false);
    }
  };

  const abrirCuenta = async (venta) => {
    try {
      const response = await ventaServicio.obtenerDetalleVenta(venta.id);
      setCuentaInicial(response.datos || response);
      setVista('pos');
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo abrir la cuenta.', tipo: 'error' });
    }
  };

  useEffect(() => { cargar(); cargarCuentas(); }, []);

  const buscar = (params) => {
    const nuevos = { ...params, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltro = (columna, valor) => {
    const columnas = { ...filtrosColumna, [columna]: valor };
    const nuevos = { ...filtros, ...columnas, [columna]: valor, page: 1 };
    setFiltrosColumna(columnas);
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const abrirDetalle = async (id) => {
    setCargandoDetalle(true);
    try {
      const response = await ventaServicio.obtenerDetalleVenta(id);
      setDetalle(response.datos || response);
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo cargar el detalle de la venta.', tipo: 'error' });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const prepararCobro = async (venta) => {
    try {
      const [detalleResponse, turnoResponse] = await Promise.all([
        ventaServicio.obtenerDetalleVenta(venta.id),
        ventaServicio.obtenerTurnoCajaActual(),
      ]);
      const detalleVenta = detalleResponse.datos || detalleResponse;
      const turno = turnoResponse.datos || turnoResponse;

      if (!turno?.id) {
        setNotificacion({ mensaje: 'Debes abrir un turno de caja antes de cobrar esta venta.', tipo: 'warning' });
        return;
      }

      const pagado = (detalleVenta.pagos || [])
        .filter((pago) => String(pago.estado || '').toUpperCase() === 'CONFIRMADO')
        .reduce((total, pago) => total + Number(pago.monto || 0), 0);
      const saldo = Math.max(0, Number(detalleVenta.total || 0) - pagado);

      if (saldo <= 0) {
        setNotificacion({ mensaje: 'Esta venta ya no tiene saldo pendiente.', tipo: 'info' });
        cargar();
        return;
      }

      setMetodoPago('EFECTIVO');
      setReferenciaPago('');
      setCobro({ venta: detalleVenta, turno, saldo });
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo preparar el cobro.', tipo: 'error' });
    }
  };

  const confirmarCobro = async () => {
    if (!cobro?.venta?.id || !cobro?.saldo) return;
    setGuardandoCobro(true);
    try {
      await ventaServicio.crearPago({
        venta_id: Number(cobro.venta.id),
        metodo_pago: metodoPago,
        monto: Number(cobro.saldo),
        estado: 'CONFIRMADO',
        referencia: referenciaPago || null,
        observaciones: 'Cobro confirmado desde Ventas.',
      });
      setCobro(null);
      setNotificacion({ mensaje: 'Pago confirmado. La venta quedó actualizada y el comprobante fue emitido.', tipo: 'success' });
      cargar({ ...filtros, page: 1 });
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores).flat()[0] : null;
      setNotificacion({ mensaje: primerError || error.response?.data?.mensaje || 'No se pudo registrar el pago.', tipo: 'error' });
    } finally {
      setGuardandoCobro(false);
    }
  };

  const columnas = useMemo(() => {
    const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtrosColumna[key]} onChange={(value) => aplicarFiltro(key, value)} options={opts}>{label}</FilterHeaderCell>;
    return [
      { key: 'numero', header: filtro('numero', 'Venta', opciones(meta.opciones_filtro?.numero)), render: (item) => <Box><Typography variant="body2" fontWeight={700}>{item.numero}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.fecha_venta)}</Typography></Box> },
      { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => item.cliente_nombre || 'Consumidor final' },
      { key: 'concepto', header: <TableCell key="concepto">Concepto</TableCell>, render: (item) => item.concepto },
      { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(meta.opciones_filtro?.tipo)), render: (item) => item.tipo_venta },
      { key: 'total', header: <TableCell key="total">Total</TableCell>, render: (item) => dinero(item.total) },
      { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(meta.catalogos?.estados_venta || [])), render: (item) => <StatusChip estado={estadoTexto(item.estado_nombre || item.estado)} /> },
    ];
  }, [meta, filtrosColumna]);

  if (vista === 'pos') {
    return (
      <VentaPosFormulario
        ventaInicial={cuentaInicial}
        onVolver={() => { setCuentaInicial(null); setVista('lista'); }}
        onGuardado={() => {
          setCuentaInicial(null);
          setVista('lista');
          setSeccion('abiertas');
          cargar({ ...filtros, page: 1 });
          cargarCuentas();
        }}
      />
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Ventas" descripcion="Facturación y punto de venta de servicios, productos y operaciones comerciales." icono={<ShoppingCartOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <Box sx={{ px: 2, pt: 1.5, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Tabs value={seccion} onChange={(_, value) => setSeccion(value)} sx={{ minHeight: 42 }}>
            <Tab value="abiertas" label={`Cuentas abiertas (${cuentasAbiertas.length})`} sx={{ minHeight: 42, textTransform: 'none', fontWeight: 900 }} />
            <Tab value="historial" label="Historial" sx={{ minHeight: 42, textTransform: 'none', fontWeight: 900 }} />
          </Tabs>
          <Button
            startIcon={<AddOutlinedIcon />}
            onClick={() => { setCuentaInicial(null); setVista('pos'); }}
            sx={dbanuStyles.addButtonRevive}
          >
            Nueva venta
          </Button>
        </Box>

        {seccion === 'abiertas' ? (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 1.6, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={950}>Cuentas por cobrar</Typography>
                <Typography variant="caption" color="text.secondary">
                  Abre una cuenta para agregar consumos al mismo cliente y cobrar todo junto al finalizar.
                </Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Buscar cliente o concepto"
                value={busquedaCuenta}
                onChange={(e) => setBusquedaCuenta(e.target.value)}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              {cuentasAbiertas
                .filter((venta) => {
                  const texto = busquedaCuenta.trim().toLowerCase();
                  if (!texto) return true;
                  return `${venta.cliente_nombre || ''} ${venta.codigo_deportista || ''} ${venta.concepto || ''} ${venta.numero || ''}`
                    .toLowerCase()
                    .includes(texto);
                })
                .map((venta) => {
                  const saldo = Number(venta.saldo_pendiente ?? venta.total ?? 0);
                  const nombre = venta.cliente_nombre || 'Consumidor final';
                  return (
                    <Box
                      key={venta.id}
                      sx={{
                        border: '1px solid #e1e5ea',
                        borderRadius: 2.2,
                        bgcolor: '#fff',
                        overflow: 'hidden',
                        boxShadow: '0 10px 28px rgba(15,23,42,.065)',
                        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'rgba(184,138,0,.38)',
                          boxShadow: '0 16px 34px rgba(15,23,42,.10)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.65,
                          py: 1.15,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 1,
                          alignItems: 'center',
                          bgcolor: '#fbfcfd',
                          borderBottom: '1px solid #edf0f3',
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
                          <ReceiptLongOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box minWidth={0}>
                            <Typography variant="caption" color="text.secondary" display="block">Venta</Typography>
                            <Typography variant="body2" fontWeight={900} noWrap title={venta.numero}>{venta.numero}</Typography>
                          </Box>
                        </Stack>
                        <Chip
                          size="small"
                          label={venta.estado_nombre || String(venta.estado || 'Pendiente').replaceAll('_', ' ')}
                          variant="outlined"
                          sx={{
                            fontWeight: 850,
                            textTransform: 'capitalize',
                            color: venta.estado_color || '#8a6500',
                            borderColor: venta.estado_color || 'rgba(184,138,0,.4)',
                            bgcolor: venta.estado_color ? `${venta.estado_color}12` : 'rgba(212,160,23,.09)',
                          }}
                        />
                      </Box>

                      <Box sx={{ p: 1.65 }}>
                        <Stack direction="row" spacing={1.15} alignItems="center">
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              fontSize: 13,
                              fontWeight: 950,
                              bgcolor: '#171717',
                              border: '2px solid rgba(212,160,23,.38)',
                            }}
                          >
                            {iniciales(nombre)}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="body2" fontWeight={950} noWrap title={nombre}>{nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {venta.codigo_deportista || 'Cliente sin código'}
                            </Typography>
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            mt: 1.35,
                            p: 1.15,
                            borderRadius: 1.45,
                            border: '1px solid #edf0f3',
                            bgcolor: '#fafbfc',
                          }}
                        >
                          <Stack direction="row" spacing={0.8} alignItems="flex-start">
                            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18, mt: .1, color: '#a47700' }} />
                            <Box minWidth={0}>
                              <Typography variant="caption" color="text.secondary" display="block">Concepto</Typography>
                              <Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.35 }}>
                                {venta.concepto}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Box sx={{ mt: 1.25, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: .8 }}>
                          <DatoCard icono={<CategoryOutlinedIcon />} label="Tipo" valor={tipoCuenta(venta)} />
                          <DatoCard icono={<LocationOnOutlinedIcon />} label="Sede" valor={venta.sede_nombre || '—'} />
                          <DatoCard icono={<CalendarMonthOutlinedIcon />} label="Fecha" valor={fecha(venta.fecha_venta)} />
                        </Box>

                        <Box sx={{ mt: 1.45, pt: 1.2, borderTop: '1px solid #edf0f3', display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-end' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">Saldo pendiente</Typography>
                            <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                              {dinero(saldo)}
                            </Typography>
                            {saldo !== Number(venta.total || 0) ? (
                              <Typography variant="caption" color="text.secondary">Total original {dinero(venta.total)}</Typography>
                            ) : null}
                          </Box>
                          <Stack direction="row" spacing={.7}>
                            <Tooltip title="Ver detalle">
                              <IconButton
                                size="small"
                                onClick={() => abrirDetalle(venta.id)}
                                sx={{ border: '1px solid #d8dee7', borderRadius: 1.15 }}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              startIcon={<PointOfSaleOutlinedIcon />}
                              onClick={() => abrirCuenta(venta)}
                              sx={{
                                ...dbanuStyles.addButtonRevive,
                                textTransform: 'none',
                                fontWeight: 950,
                                minWidth: 132,
                                borderRadius: 1.15,
                              }}
                            >
                              Abrir cuenta
                            </Button>
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
            </Box>

            {!cargandoCuentas && cuentasAbiertas.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 38, opacity: .25 }} />
                <Typography variant="body2" fontWeight={850} color="text.secondary" sx={{ mt: .5 }}>No hay cuentas abiertas.</Typography>
                <Typography variant="caption" color="text.secondary">Las membresías, pases y ventas pendientes aparecerán aquí.</Typography>
              </Box>
            ) : null}
          </Box>
        ) : (
          <>
            <GestionToolbar
              total={meta.total || items.length}
              busqueda={filtros.busqueda}
              onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
            />
            <TablaGestion
              total={meta.total || 0}
              filtrados={meta.total || 0}
              page={meta.pagina_actual || 1}
              rowsPerPage={meta.por_pagina || 5}
              onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }}
              onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }}
              cargando={cargando}
            >
              <TableHead><TableRow>{columnas.map((columna) => columna.header)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    {columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.4} justifyContent="flex-end">
                        {['PENDIENTE', 'PARCIAL'].includes(String(item.estado || '').toUpperCase()) ? (
                          <Tooltip title="Abrir cuenta">
                            <IconButton size="small" onClick={() => abrirCuenta(item)}>
                              <PointOfSaleOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Tooltip title="Ver comprobante">
                          <IconButton size="small" onClick={() => abrirDetalle(item.id)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto="No hay ventas para los filtros aplicados." /> : null}
              </TableBody>
            </TablaGestion>
          </>
        )}
      </Paper>
      <Dialog open={Boolean(cobro)} onClose={() => !guardandoCobro && setCobro(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950, borderBottom: '1px solid #e5e7eb' }}>Cobrar venta pendiente</DialogTitle>
        <DialogContent sx={{ pt: 2.2 }}>
          {cobro ? (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={900}>{cobro.venta.concepto}</Typography>
                <Typography variant="caption" color="text.secondary">{cobro.venta.numero} · {cobro.venta.cliente_nombre || 'Consumidor final'}</Typography>
              </Box>
              <Box sx={{ p: 1.2, border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                <Typography variant="caption" color="text.secondary">Saldo por cobrar</Typography>
                <Typography variant="h5" fontWeight={950}>{dinero(cobro.saldo)}</Typography>
                <Typography variant="caption" color="text.secondary">{cobro.turno.caja_nombre} · {cobro.turno.sede_nombre}</Typography>
              </Box>
              <TextField select label="Método de pago" size="small" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                <MenuItem value="DEPOSITO">Depósito</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </TextField>
              {metodoPago !== 'EFECTIVO' ? (
                <TextField label="Referencia / comprobante" size="small" value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} />
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={() => setCobro(null)} disabled={guardandoCobro}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarCobro} disabled={guardandoCobro}>Confirmar cobro</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detalle) || cargandoDetalle} onClose={() => !cargandoDetalle && setDetalle(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950, borderBottom: '1px solid #e5e7eb' }}>
          {cargandoDetalle ? 'Cargando venta...' : `Comprobante · ${detalle?.comprobante?.numero || detalle?.numero || ''}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.2 }}>
          {detalle ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.2 }}>
                <Dato label="N.º venta" valor={detalle.numero} />
                <Dato label="Estado" valor={detalle.estado_nombre || detalle.estado} />
                <Dato label="Sede" valor={detalle.sede_nombre || '—'} />
                <Dato label="Caja" valor={detalle.caja_nombre || '—'} />
                <Dato label="Cliente" valor={detalle.cliente_nombre || 'Consumidor final'} />
                {detalle.membresia_codigo ? <Dato label="Membresía" valor={detalle.membresia_codigo} /> : null}
                {(detalle.sedes_membresia || []).length ? <Dato label="Sedes habilitadas" valor={(detalle.sedes_membresia || []).map((s) => s.sede_nombre).join(', ')} /> : null}
                <Dato label="Fecha" valor={detalle.fecha_venta ? new Date(detalle.fecha_venta).toLocaleString('es-EC') : '—'} />
                <Dato label="Comprobante" valor={detalle.comprobante?.numero || 'Pendiente'} />
                <Dato label="Tipo" valor={detalle.comprobante?.tipo_comprobante || 'RECIBO'} />
              </Box>

              <Divider />
              <Table size="small">
                <TableHead><TableRow><TableCell>Detalle</TableCell><TableCell align="right">Cant.</TableCell><TableCell align="right">P. unitario</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                <TableBody>
                  {(detalle.detalles || []).map((fila) => (
                    <TableRow key={fila.id}>
                      <TableCell><Typography variant="body2" fontWeight={800}>{fila.descripcion}</Typography><Typography variant="caption" color="text.secondary">{fila.tipo_item || 'ITEM'}</Typography></TableCell>
                      <TableCell align="right">{Number(fila.cantidad || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{dinero(fila.precio_unitario)}</TableCell>
                      <TableCell align="right">{dinero(fila.total_linea)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ ml: 'auto', width: { xs: '100%', sm: 320 } }}>
                <Stack spacing={.5}>
                  <Resumen label="Subtotal" valor={dinero(detalle.subtotal)} />
                  <Resumen label="Descuento" valor={dinero(detalle.descuento)} />
                  <Resumen label="Impuesto" valor={dinero(detalle.impuesto)} />
                  <Divider />
                  <Resumen label="TOTAL" valor={dinero(detalle.total)} fuerte />
                </Stack>
              </Box>

              {(detalle.entrenadores_membresia || []).length ? (
                <Box>
                  <Typography variant="subtitle2" fontWeight={950} sx={{ mb: .7 }}>Entrenamiento asociado</Typography>
                  <Stack spacing={.5}>
                    {(detalle.entrenadores_membresia || []).map((asignacion, indice) => (
                      <Typography key={`${asignacion.entrenador_id}-${asignacion.sede_id}-${asignacion.horario_bloque_id}-${indice}`} variant="caption" color="text.secondary">
                        {asignacion.sede_nombre || 'Sede'} · {asignacion.entrenador_nombre || 'Entrenador'}{asignacion.horario_nombre ? ` · ${asignacion.horario_nombre}` : ''}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {(detalle.pagos || []).length ? (
                <Box>
                  <Typography variant="subtitle2" fontWeight={950} sx={{ mb: .7 }}>Pago</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(detalle.pagos || []).map((pago) => <Chip key={pago.id} label={`${pago.metodo_pago} · ${dinero(pago.monto)} · ${pago.estado_nombre || pago.estado}`} size="small" />)}
                  </Stack>
                </Box>
              ) : null}

              {(detalle.movimientos_inventario || []).length ? (
                <Box sx={{ p: 1.2, border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" fontWeight={950}>Inventario aplicado</Typography>
                  {(detalle.movimientos_inventario || []).map((mov) => (
                    <Typography key={mov.id} variant="caption" display="block" color="text.secondary">
                      {mov.producto_nombre}: -{Number(mov.cantidad || 0)} · stock {Number(mov.stock_anterior || 0)} → {Number(mov.stock_nuevo || 0)}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={() => setDetalle(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))} />
    </Box>
  );
}


function DatoCard({ icono, label, valor }) {
  return (
    <Box sx={{ minWidth: 0, p: .8, borderRadius: 1.2, bgcolor: '#fff', border: '1px solid #edf0f3' }}>
      <Stack direction="row" spacing={.55} alignItems="center">
        <Box sx={{ color: '#9a7200', display: 'grid', placeItems: 'center', '& .MuiSvgIcon-root': { fontSize: 15 } }}>{icono}</Box>
        <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
      </Stack>
      <Typography variant="caption" fontWeight={900} display="block" noWrap title={valor} sx={{ mt: .25 }}>{valor || '—'}</Typography>
    </Box>
  );
}

function Dato({ label, valor }) {
  return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={850}>{valor || '—'}</Typography></Box>;
}

function Resumen({ label, valor, fuerte = false }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={fuerte ? 950 : 700}>{label}</Typography><Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={950}>{valor}</Typography></Box>;
}
