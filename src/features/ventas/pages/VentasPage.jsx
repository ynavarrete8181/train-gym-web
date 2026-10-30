import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
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
  const [turnoActual, setTurnoActual] = useState(null);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [cuentaInicial, setCuentaInicial] = useState(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detallePdfUrl, setDetallePdfUrl] = useState('');
  const [detallePdfNombre, setDetallePdfNombre] = useState('Comprobante');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [detallePdfBlob, setDetallePdfBlob] = useState(null);
  const cuentasFiltradas = cuentasAbiertas.filter((venta) => {
    const texto = busquedaCuenta.trim().toLocaleLowerCase('es-EC');
    if (!texto) return true;
    return [venta.cliente_nombre, venta.cliente_identificacion, venta.codigo_deportista, venta.numero, venta.sede_nombre]
      .some((valor) => String(valor || '').toLocaleLowerCase('es-EC').includes(texto));
  });
  const totalPendiente = cuentasAbiertas.reduce((total, venta) =>
    total + Math.max(0, Number(venta.saldo_pendiente ?? venta.total ?? 0)), 0);
  const pagosParciales = cuentasAbiertas.filter((venta) => String(venta.estado || '').toUpperCase() === 'PARCIAL').length;


  const cargarCuentas = async () => {
    setCargandoCuentas(true);
    try {
      const [response, turnoResponse] = await Promise.all([
        ventaServicio.obtenerCuentasAbiertasPos(),
        ventaServicio.obtenerTurnoCajaActual().catch(() => ({ datos: null })),
      ]);
      setCuentasAbiertas(response.datos || []);
      setTurnoActual(turnoResponse?.datos || null);
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudieron cargar las cuentas abiertas.', tipo: 'error' });
    } finally {
      setCargandoCuentas(false);
    }
  };

  const abrirCuenta = async (venta) => {
    if (!turnoActual?.id) {
      setNotificacion({
        mensaje: 'Modo consulta: para cobrar debes tener un turno de caja propio abierto.',
        tipo: 'warning',
      });
      return;
    }

    try {
      const response = await ventaServicio.obtenerDetalleVenta(venta.id);
      setCuentaInicial(response.datos || response);
      setVista('pos');
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo abrir la cuenta.', tipo: 'error' });
    }
  };

  useEffect(() => { cargarCuentas(); }, []);

  const cerrarDetalle = () => {
    if (detallePdfUrl) URL.revokeObjectURL(detallePdfUrl);
    setDetallePdfUrl('');
    setDetallePdfBlob(null);
    setDetallePdfNombre('Comprobante');
  };

  const abrirDetalle = async (venta) => {
    setCargandoDetalle(true);
    try {
      if (detallePdfUrl) URL.revokeObjectURL(detallePdfUrl);
      const blob = await ventaServicio.obtenerComprobantePdf(venta.id);
      const url = URL.createObjectURL(blob);
      setDetallePdfBlob(blob);
      setDetallePdfNombre(venta.numero || 'Comprobante');
      setDetallePdfUrl(url);
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'No se pudo cargar el comprobante PDF.', tipo: 'error' });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const descargarDetallePdf = () => {
    if (!detallePdfBlob) return;
    const url = URL.createObjectURL(detallePdfBlob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${detallePdfNombre || 'comprobante'}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

  const imprimirDetallePdf = () => {
    if (!detallePdfUrl) return;
    const iframe = document.querySelector('iframe[data-comprobante-pdf="true"]');
    iframe?.contentWindow?.focus();
    iframe?.contentWindow?.print();
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
        <Box sx={{ px: { xs: 1.5, md: 2.3 }, py: 2, bgcolor: '#fff', borderBottom: '1px solid #e9e9e9' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box sx={{ width: 40, height: 40, bgcolor: '#D4A017', color: '#141414', display: 'grid', placeItems: 'center', borderRadius: 1.5 }}>
                  <ReceiptLongOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 950, color: '#161616', lineHeight: 1.2 }}>Cuentas por cobrar</Typography>
                  <Typography variant="caption" sx={{ color: '#606060', fontWeight: 600 }}>
                    Consulta las cuentas pendientes y continúa sus cobros desde tu caja.
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar cliente, código o sede"
                value={busquedaCuenta}
                onChange={(e) => setBusquedaCuenta(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ color: '#A77B08' }} /></InputAdornment> }}
                sx={{ width: { xs: '100%', sm: 315 }, '& .MuiOutlinedInput-root': { borderRadius: 1.6, bgcolor: '#fff' } }}
              />
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={() => { setCuentaInicial(null); setVista('pos'); }}
                disabled={!turnoActual?.id}
                title={!turnoActual?.id ? 'Necesitas un turno de caja propio para registrar una venta.' : ''}
                sx={{
                  minWidth: 147, minHeight: 40, textTransform: 'none', fontWeight: 900,
                  bgcolor: '#D4A017', color: '#161616', borderRadius: 1.5, boxShadow: 'none',
                  '&:hover': { bgcolor: '#BF900F', boxShadow: 'none' },
                }}
              >
                Nueva venta
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.3, mt: 2 }}>
            {[
              { label: 'Cuentas abiertas', value: String(cuentasAbiertas.length), icon: <ReceiptLongOutlinedIcon />, dark: false },
              { label: 'Saldo pendiente', value: dinero(totalPendiente), icon: <AccountBalanceWalletOutlinedIcon />, dark: true },
              { label: 'Con pago parcial', value: String(pagosParciales), icon: <PointOfSaleOutlinedIcon />, dark: false },
            ].map(({ label, value, icon, dark }) => (
              <Box key={label} sx={{
                borderRadius: 1.7, border: '1px solid', borderColor: dark ? '#171717' : '#e5e5e5',
                bgcolor: dark ? '#171717' : '#fff', px: 1.7, py: 1.25,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
              }}>
                <Box>
                  <Typography variant="caption" sx={{ color: dark ? '#f1e2ad' : '#696969', fontWeight: 700 }}>{label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 950, color: dark ? '#fff' : '#171717', lineHeight: 1.3 }}>{value}</Typography>
                </Box>
                <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 1.3, bgcolor: dark ? '#D4A017' : '#fff5d5', color: '#141414' }}>{icon}</Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 1.5, px: 1.3, py: .9, borderRadius: 1.4, bgcolor: turnoActual?.id ? '#f5faf4' : '#fff8e8', border: '1px solid', borderColor: turnoActual?.id ? '#cfe4ce' : '#f0dcac' }}>
            <Typography variant="caption" sx={{ color: '#272727', fontWeight: 750 }}>
              {turnoActual?.id
                ? `Caja activa: ${turnoActual.caja_nombre || turnoActual.caja_codigo || 'Caja'} · Puedes abrir cuentas y registrar cobros.`
                : 'Modo consulta · Para cobrar o registrar nuevas ventas, abre primero un turno de caja propio.'}
            </Typography>
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
            {cuentasFiltradas.map((venta) => {
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
                    <Box sx={{ minHeight: 54 }}>
                      <Typography variant="subtitle1" fontWeight={950} sx={{ lineHeight: 1.08 }} title={nombre}>
                        {nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {venta.cliente_identificacion || 'Sin identificación'}
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
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: '#111827' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={700} noWrap>
                          Generada por: {venta.generado_por_nombre || 'Sistema'}
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
                        disabled={!turnoActual?.id}
                        title={!turnoActual?.id ? 'Solo consulta: abre tu propio turno de caja para cobrar.' : ''}
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
                        onClick={() => abrirDetalle(venta)}
                        sx={dbanuStyles.secondaryButtonRevive}
                      >
                        Ver detalle
                      </Button>
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
      </Paper>
      <Dialog
        open={Boolean(detallePdfUrl) || cargandoDetalle}
        onClose={() => !cargandoDetalle && cerrarDetalle()}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: { xs: '94vh', md: '90vh' }, overflow: 'hidden', borderRadius: 1.5 } }}
      >
        <DialogTitle
          sx={{
            px: 2.2,
            py: 1.45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: '#fff',
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={950}>
              {cargandoDetalle ? 'Generando comprobante...' : 'Comprobante'}
            </Typography>
            {!cargandoDetalle ? (
              <Typography variant="caption" color="text.secondary">{detallePdfNombre}</Typography>
            ) : null}
          </Box>
          <Chip
            size="small"
            label={cargandoDetalle ? 'Procesando' : 'PDF'}
            sx={{ fontWeight: 900, bgcolor: 'rgba(212,160,23,.13)', color: '#8a6500', border: '1px solid rgba(212,160,23,.28)' }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#e9edf1', height: '100%', overflow: 'hidden' }}>
          {cargandoDetalle ? (
            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Cargando PDF...</Typography>
            </Box>
          ) : detallePdfUrl ? (
            <Box
              component="iframe"
              data-comprobante-pdf="true"
              title={`Comprobante ${detallePdfNombre}`}
              src={detallePdfUrl}
              sx={{ width: '100%', height: '100%', minHeight: 640, border: 0, display: 'block', bgcolor: '#fff' }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2.2, py: 1.2, borderTop: '1px solid #e5e7eb', bgcolor: '#fff', gap: 1 }}>
          <Button onClick={cerrarDetalle} sx={dbanuStyles.secondaryButtonRevive}>
            Cerrar
          </Button>
          <Button
            startIcon={<DownloadOutlinedIcon />}
            onClick={descargarDetallePdf}
            disabled={!detallePdfBlob || cargandoDetalle}
            sx={dbanuStyles.secondaryButtonRevive}
          >
            Descargar PDF
          </Button>
          <Button
            startIcon={<PrintOutlinedIcon />}
            onClick={imprimirDetallePdf}
            disabled={!detallePdfUrl || cargandoDetalle}
            sx={dbanuStyles.addButtonRevive}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))} />
    </Box>
  );
}


