import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { VentaPosFormulario } from '../components/VentaPosFormulario.jsx';
import { ventaServicio } from '../services/ventaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : 'Sin fecha';

export function VentasPage() {
  const [vista, setVista] = useState('lista');
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [cuentaInicial, setCuentaInicial] = useState(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

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

  useEffect(() => { cargarCuentas(); }, []);

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

  if (vista === 'pos') {
    return (
      <VentaPosFormulario
        ventaInicial={cuentaInicial}
        onVolver={() => { setCuentaInicial(null); setVista('lista'); }}
        onGuardado={() => {
          setCuentaInicial(null);
          setVista('lista');
          cargarCuentas();
        }}
      />
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Ventas" descripcion="Facturación y punto de venta de servicios, productos y operaciones comerciales." icono={<ShoppingCartOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <Box sx={{ px: { xs: 1.5, md: 2 }, pt: 1.7, pb: 1.2, borderBottom: '1px solid #eceff3' }}>
          <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 1.4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box>
              <Typography variant="h6" fontWeight={950}>Cuentas abiertas</Typography>
              <Typography variant="body2" color="text.secondary">Gestiona consumos pendientes y cobra al finalizar la atención.</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar cliente por nombre o código"
                value={busquedaCuenta}
                onChange={(e) => setBusquedaCuenta(e.target.value)}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
              <Button
                startIcon={<AddOutlinedIcon />}
                onClick={() => { setCuentaInicial(null); setVista('pos'); }}
                sx={{ ...dbanuStyles.addButtonRevive, minWidth: 112 }}
              >
                Añadir
              </Button>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            {cuentasAbiertas
              .filter((venta) => {
                const texto = busquedaCuenta.trim().toLowerCase();
                if (!texto) return true;
                return `${venta.cliente_nombre || ''} ${venta.codigo_deportista || ''} ${venta.numero || ''}`
                  .toLowerCase()
                  .includes(texto);
              })
              .map((venta) => {
                const saldo = Number(venta.saldo_pendiente ?? venta.total ?? 0);
                const nombre = venta.cliente_nombre || 'Consumidor final';
                const estadoParcial = String(venta.estado || '').toUpperCase() === 'PARCIAL';
                return (
                  <Box
                    key={venta.id}
                    sx={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 2,
                      bgcolor: '#fff',
                      p: 1.7,
                      boxShadow: '0 7px 20px rgba(15,23,42,.05)',
                      transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: 'rgba(184,138,0,.34)',
                        boxShadow: '0 13px 28px rgba(15,23,42,.085)',
                      },
                    }}
                  >
                    <Box sx={{ minHeight: 54 }}
                      <Typography variant="subtitle1" fontWeight={950} sx={{ lineHeight: 1.08 }} title={nombre}>
                        {nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {venta.codigo_deportista || 'Cliente sin código'}
                      </Typography>
                    </Box>

                    <Stack spacing={0.85} sx={{ mt: 1.05 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#111827' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={700} noWrap>
                          {venta.sede_nombre || 'Sede no asignada'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: '#111827' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                          {fecha(venta.fecha_venta)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.35, borderColor: '#e8ebef' }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'end' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Saldo pendiente</Typography>
                        <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.05 }}>
                          {dinero(saldo)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={estadoParcial ? 'Pago parcial' : 'Pendiente'}
                        sx={{
                          height: 30,
                          px: .5,
                          fontWeight: 900,
                          color: estadoParcial ? '#b42318' : '#8a6500',
                          bgcolor: estadoParcial ? '#fee4e2' : '#fff3cf',
                          border: '1px solid',
                          borderColor: estadoParcial ? '#fecdca' : '#efd786',
                          '& .MuiChip-label': { px: .9 },
                        }}
                      />
                    </Box>

                    <Box sx={{ mt: 1.35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}>
                      <Button
                        variant="contained"
                        startIcon={<PointOfSaleOutlinedIcon />}
                        onClick={() => abrirCuenta(venta)}
                        sx={{
                          ...dbanuStyles.addButtonRevive,
                          minHeight: 38,
                          textTransform: 'none',
                          fontWeight: 950,
                          borderRadius: 0.5,
                        }}
                      >
                        Abrir cuenta
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => abrirDetalle(venta.id)}
                        sx={dbanuStyles.secondaryButtonRevive}
                      >
                        Ver detalle
                      </Button>
                    </Box>
                  </Box>
                );
              })}

            <Box
              onClick={() => { setCuentaInicial(null); setVista('pos'); }}
              sx={{
                minHeight: 260,
                border: '1px dashed #d5dae1',
                borderRadius: 2,
                bgcolor: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'border-color .18s ease, background .18s ease',
                '&:hover': { borderColor: '#b88a00', bgcolor: 'rgba(212,160,23,.035)' },
              }}
            >
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Box sx={{ width: 52, height: 52, mx: 'auto', borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(212,160,23,.14)', color: '#b88a00' }}>
                  <AddOutlinedIcon />
                </Box>
                <Typography variant="subtitle1" fontWeight={950} sx={{ mt: 1 }}>Nueva venta</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: .35 }}>
                  Registra una venta de servicios, productos o membresías.
                </Typography>
                <Button variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 900, borderColor: '#b88a00', color: '#8a6500' }}>
                  Añadir
                </Button>
              </Box>
            </Box>
          </Box>

          {!cargandoCuentas && cuentasAbiertas.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 38, opacity: .25 }} />
              <Typography variant="body2" fontWeight={850} color="text.secondary" sx={{ mt: .5 }}>No hay cuentas abiertas.</Typography>
              <Typography variant="caption" color="text.secondary">Las membresías, pases y ventas pendientes aparecerán aquí.</Typography>
            </Box>
          ) : null}
        </Box>
      </Paper>
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


function Dato({ label, valor }) {
  return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={850}>{valor || '—'}</Typography></Box>;
}

function Resumen({ label, valor, fuerte = false }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={fuerte ? 950 : 700}>{label}</Typography><Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={950}>{valor}</Typography></Box>;
}
