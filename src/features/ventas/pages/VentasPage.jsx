import { useEffect, useState } from 'react';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
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
  const [filtroSede, setFiltroSede] = useState('TODAS');
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [detallePdfUrl, setDetallePdfUrl] = useState('');
  const [detallePdfNombre, setDetallePdfNombre] = useState('Comprobante');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [detallePdfBlob, setDetallePdfBlob] = useState(null);
  const sedesDisponibles = Array.from(new Set(cuentasAbiertas.map((cuenta) => String(cuenta.sede_nombre || '').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es-EC'));
  const cuentasFiltradas = cuentasAbiertas.filter((venta) => {
    if (filtroSede !== 'TODAS' && String(venta.sede_nombre || '') !== filtroSede) return false;
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
      <PageHeader titulo="Ventas" descripcion="Gestiona cobros pendientes y ventas desde tu caja." icono={<ShoppingCartOutlinedIcon />} />
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
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={() => { setCuentaInicial(null); setVista('pos'); }}
                disabled={!turnoActual?.id}
                title={!turnoActual?.id ? 'Necesitas un turno de caja propio para registrar una venta.' : ''}
                sx={{
                  minWidth: 150, minHeight: 42, textTransform: 'none', fontWeight: 900,
                  bgcolor: '#D4A017', color: '#171717', borderRadius: 1.5, boxShadow: 'none',
                  '&:hover': { bgcolor: '#BE8E0D', boxShadow: 'none' },
                  '&.Mui-disabled': { bgcolor: '#e5e5e5', color: '#787878' },
                }}
              >Nueva venta</Button>
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

        <Box sx={{ px: { xs: 1.5, md: 2.3 }, pt: 2, pb: .65 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={1.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950, color: '#161616' }}>Cuentas abiertas</Typography>
              <Typography variant="caption" sx={{ color: '#5c5c5c' }}>
                {cargandoCuentas ? 'Consultando cuentas...' : `${cuentasFiltradas.length} de ${cuentasAbiertas.length} cuentas`}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField size="small" value={busquedaCuenta} onChange={(e) => setBusquedaCuenta(e.target.value)}
                placeholder="Buscar nombre, identificación o código"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ color: '#B18510' }} /></InputAdornment> }}
                sx={{ width: { xs: '100%', sm: 315 }, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              <TextField select size="small" value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)}
                aria-label="Filtrar por sede"
                InputProps={{ startAdornment: <InputAdornment position="start"><FilterAltOutlinedIcon sx={{ color: '#B18510', fontSize: 19 }} /></InputAdornment> }}
                sx={{ minWidth: { xs: '100%', sm: 185 }, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                <MenuItem value="TODAS">Todas las sedes</MenuItem>
                {sedesDisponibles.map((sede) => <MenuItem key={sede} value={sede}>{sede}</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
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
                  <Box key={venta.id} sx={{
                    position: 'relative', minWidth: 0, overflow: 'hidden',
                    border: '1px solid #e5e5e5', borderTop: '4px solid #D4A017', borderRadius: 2,
                    bgcolor: '#fff', p: 1.7, display: 'flex', flexDirection: 'column', minHeight: 298,
                    boxShadow: '0 5px 16px rgba(0,0,0,.055)',
                    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: '#D4A017', boxShadow: '0 9px 22px rgba(0,0,0,.11)' },
                  }}>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box sx={{
                        width: 45, height: 45, flexShrink: 0, display: 'grid', placeItems: 'center',
                        bgcolor: '#fff1c9', color: '#171717', borderRadius: '50%',
                        border: '1px solid #eed89f', fontWeight: 950, fontSize: 15,
                      }}>
                        {nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join('')}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#171717', fontWeight: 900, lineHeight: 1.25 }} title={nombre}>
                          {nombre}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: .2 }}>
                          {venta.cliente_identificacion || venta.codigo_deportista || 'Sin identificación'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack spacing={.85} sx={{ mt: 1.6, mb: 1.4 }}>
                      <Stack direction="row" alignItems="center" spacing={.8}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 17, color: '#BD8E0B' }} />
                        <Typography variant="body2" sx={{ color: '#333', fontWeight: 600 }}>{venta.sede_nombre || 'Sede no asignada'}</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={.8}>
                        <CalendarMonthOutlinedIcon sx={{ fontSize: 17, color: '#BD8E0B' }} />
                        <Typography variant="body2" sx={{ color: '#333', fontWeight: 600 }}>{fecha(venta.fecha_venta)}</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={.8}>
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 17, color: '#BD8E0B' }} />
                        <Typography variant="body2" sx={{ color: '#333', fontWeight: 600 }} noWrap>
                          Generada por: {venta.generado_por_nombre || 'Sistema'}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Divider sx={{ mt: 'auto', mb: 1.2, borderColor: '#ededed' }} />
                    <Stack direction="row" alignItems="end" justifyContent="space-between" gap={1}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>Saldo pendiente</Typography>
                        <Typography variant="h5" sx={{ color: '#171717', fontWeight: 950, lineHeight: 1.25 }}>{dinero(saldo)}</Typography>
                      </Box>
                      <Chip size="small" label={estadoParcial ? 'Pago parcial' : 'Pendiente'} sx={{
                        bgcolor: estadoParcial ? '#fff0e6' : '#fff0c6',
                        color: estadoParcial ? '#9b4212' : '#805b00',
                        border: '1px solid', borderColor: estadoParcial ? '#ebaf85' : '#e6c46c',
                        fontWeight: 850,
                      }} />
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .9, mt: 1.45 }}>
                      <Button variant="contained" size="small" startIcon={<PointOfSaleOutlinedIcon />}
                        onClick={() => abrirCuenta(venta)} disabled={!turnoActual?.id}
                        title={!turnoActual?.id ? 'Abre tu turno de caja para cobrar.' : ''}
                        sx={{
                          minHeight: 39, textTransform: 'none', fontWeight: 850, borderRadius: 1.3,
                          bgcolor: '#D4A017', color: '#171717', boxShadow: 'none',
                          '&:hover': { bgcolor: '#BE8E0D', boxShadow: 'none' },
                          '&.Mui-disabled': { bgcolor: '#ebebeb', color: '#8a8a8a' },
                        }}>Abrir cuenta</Button>
                      <Button variant="outlined" size="small" startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => abrirDetalle(venta)}
                        sx={{
                          minHeight: 39, textTransform: 'none', fontWeight: 850, borderRadius: 1.3,
                          borderColor: '#D4A017', color: '#171717', bgcolor: '#fff',
                          '&:hover': { borderColor: '#B58500', bgcolor: '#fff8e6' },
                        }}>Ver detalle</Button>
                    </Box>
                  </Box>
                );
              })}


          </Box>

          {!cargandoCuentas && cuentasFiltradas.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 38, opacity: .25 }} />
              <Typography variant="body2" fontWeight={850} color="text.secondary" sx={{ mt: .5 }}>{cuentasAbiertas.length === 0 ? 'No hay cuentas abiertas.' : 'No se encontraron cuentas con estos filtros.'}</Typography>
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


