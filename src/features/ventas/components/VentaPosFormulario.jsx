import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { ventaServicio } from '../services/ventaServicio.js';

const tipos = [
  { value: 'SERVICIO', label: 'Servicios', icono: <FitnessCenterOutlinedIcon fontSize="small" /> },
  { value: 'PRODUCTO', label: 'Productos', icono: <Inventory2OutlinedIcon fontSize="small" /> },
  { value: 'MEMBRESIA', label: 'Membresías', icono: <BadgeOutlinedIcon fontSize="small" /> },
  { value: 'PASE_DIARIO', label: 'Pase diario', icono: <LocalActivityOutlinedIcon fontSize="small" /> },
  { value: 'OTRO', label: 'Otros', icono: <MoreHorizOutlinedIcon fontSize="small" /> },
];

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : '—');
const AZUL_REVIVE = 'rgba(20, 73, 133, 1)';

export function VentaPosFormulario({ onVolver, onGuardado }) {
  const [contexto, setContexto] = useState({ turno: null, clientes: [], servicios: [], planes: [], productos: [] });
  const [cargando, setCargando] = useState(true);
  const [errorContexto, setErrorContexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState('SERVICIO');
  const [cliente, setCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [impuesto, setImpuesto] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [otro, setOtro] = useState({ descripcion: '', precio: '', cantidad: 1 });
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [referencia, setReferencia] = useState('');
  const [recibido, setRecibido] = useState('');
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const avisar = (mensaje, tipoAviso = 'info') => setNotificacion({ mensaje, tipo: tipoAviso });

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setErrorContexto('');
      try {
        const response = await ventaServicio.obtenerContextoPos();
        setContexto(response.datos || response || {});
      } catch (error) {
        const mensaje = error.response?.data?.mensaje || 'No se pudo cargar el contexto de venta.';
        setErrorContexto(mensaje);
        avisar(mensaje, 'error');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const subtotal = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + Number(item.total_linea || 0), 0),
    [carrito],
  );
  const total = Math.max(0, subtotal - Number(descuento || 0) + Number(impuesto || 0));
  const recibidoNumero = Number(recibido || 0);
  const cambio = metodoPago === 'EFECTIVO' ? Math.max(0, recibidoNumero - total) : 0;
  const faltante = metodoPago === 'EFECTIVO' ? Math.max(0, total - recibidoNumero) : 0;
  const totalItems = carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

  const disponibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    let items = [];
    if (tipo === 'SERVICIO') items = contexto.servicios || [];
    if (tipo === 'PRODUCTO') items = contexto.productos || [];
    if (tipo === 'MEMBRESIA') items = (contexto.planes || []).filter((item) => item.tipo_producto !== 'PASE_DIARIO');
    if (tipo === 'PASE_DIARIO') items = (contexto.planes || []).filter((item) => item.tipo_producto === 'PASE_DIARIO');
    if (!texto) return items;
    return items.filter((item) =>
      `${item.nombre || ''} ${item.codigo || ''} ${item.categoria || ''} ${item.descripcion || ''}`
        .toLowerCase()
        .includes(texto),
    );
  }, [tipo, contexto, busqueda]);

  const agregar = (item) => {
    if (tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO') {
      avisar('La membresía o pase se asigna desde Membresías para crear correctamente su contrato y vigencia.', 'info');
      return;
    }
    if (item.precio === null || item.precio === undefined || Number(item.precio) <= 0) {
      avisar('Este ítem aún no tiene un precio comercial configurado para la sede.', 'warning');
      return;
    }
    const clave = `${tipo}-${item.id}`;
    setCarrito((actual) => {
      const existe = actual.find((fila) => fila.clave === clave);
      if (existe) {
        return actual.map((fila) => {
          if (fila.clave !== clave) return fila;
          const cantidad = Number(fila.cantidad || 0) + 1;
          return { ...fila, cantidad, total_linea: cantidad * Number(fila.precio_unitario || 0) };
        });
      }
      return [...actual, {
        clave,
        tipo,
        referencia_id: item.id,
        producto_id: tipo === 'PRODUCTO' ? item.id : null,
        descripcion: item.nombre,
        cantidad: 1,
        precio_unitario: Number(item.precio),
        total_linea: Number(item.precio),
      }];
    });
  };

  const agregarOtro = () => {
    const precio = Number(otro.precio || 0);
    const cantidad = Number(otro.cantidad || 1);
    if (!otro.descripcion.trim() || precio <= 0 || cantidad <= 0) {
      avisar('Completa descripción, precio y cantidad.', 'warning');
      return;
    }
    setCarrito((actual) => [...actual, {
      clave: `OTRO-${Date.now()}`,
      tipo: 'OTRO',
      referencia_id: null,
      producto_id: null,
      descripcion: otro.descripcion.trim(),
      cantidad,
      precio_unitario: precio,
      total_linea: precio * cantidad,
    }]);
    setOtro({ descripcion: '', precio: '', cantidad: 1 });
  };

  const cambiarCantidad = (clave, cantidad) => {
    const valor = Math.max(1, Number(cantidad || 1));
    setCarrito((actual) => actual.map((item) =>
      item.clave === clave
        ? { ...item, cantidad: valor, total_linea: valor * Number(item.precio_unitario || 0) }
        : item,
    ));
  };

  const ajustarCantidad = (clave, delta) => {
    setCarrito((actual) => actual.map((item) => {
      if (item.clave !== clave) return item;
      const cantidad = Math.max(1, Number(item.cantidad || 1) + delta);
      return { ...item, cantidad, total_linea: cantidad * Number(item.precio_unitario || 0) };
    }));
  };

  const guardar = async (cobrar = false) => {
    if (!contexto.turno?.id) {
      avisar('Debes abrir un turno de caja antes de registrar una venta.', 'warning');
      return;
    }
    if (carrito.length === 0) {
      avisar('Agrega al menos un ítem a la venta.', 'warning');
      return;
    }
    if (cobrar && metodoPago === 'EFECTIVO' && recibidoNumero < total) {
      avisar('El valor recibido en efectivo no puede ser menor que el total de la venta.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      const response = await ventaServicio.crearVentaPos({
        cliente_id: cliente?.id || null,
        descuento: Number(descuento || 0),
        impuesto: Number(impuesto || 0),
        observaciones: observaciones || null,
        detalles: carrito.map(({ clave, ...item }) => item),
      });
      const venta = response.datos || response;
      if (cobrar) {
        await ventaServicio.crearPago({
          venta_id: Number(venta.id),
          metodo_pago: metodoPago,
          monto: Number(total.toFixed(2)),
          estado: 'CONFIRMADO',
          referencia: referencia || null,
          observaciones: metodoPago === 'EFECTIVO'
            ? `Cobro POS. Recibido ${dinero(recibido)}. Cambio ${dinero(cambio)}.`
            : 'Cobro registrado desde POS.',
        });
        avisar(`Venta ${venta.numero || ''} y pago registrados correctamente.`, 'success');
      } else {
        avisar(`Venta ${venta.numero || ''} guardada como pendiente de pago.`, 'success');
      }
      setTimeout(() => onGuardado?.(), 500);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      avisar(primero || error.response?.data?.mensaje || 'No se pudo registrar la venta.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const turno = contexto.turno;

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Nueva venta"
        descripcion="Registra servicios, productos y cobros asociados al turno de caja activo."
        icono={<PointOfSaleOutlinedIcon />}
        acciones={<BotonVolver onClick={onVolver} />}
      />

      <Paper className="page-content-container" elevation={0} sx={{ mt: 2, p: { xs: 1.5, md: 2.2 } }}>
        {errorContexto ? <Alert severity="error" sx={{ mb: 2 }}>{errorContexto}</Alert> : null}
        {!cargando && !errorContexto && !turno?.id ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tienes un turno de caja abierto. Abre un turno antes de registrar ventas.
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(355px, .78fr)' }, gap: 2, alignItems: 'start' }}>
          <Stack spacing={2}>
            <SeccionFlotante titulo="Cliente">
              <Autocomplete
                options={contexto.clientes || []}
                value={cliente}
                onChange={(_, value) => setCliente(value)}
                getOptionLabel={(item) => `${item.nombre || ''}${item.codigo ? ` · ${item.codigo}` : ''}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Buscar por nombre, código, cédula o teléfono" />}
              />
              {cliente ? (
                <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center', px: 1.3, py: 1, bgcolor: '#f8fafc', border: '1px solid #e1e7ef', borderRadius: 1.5 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={900}>{cliente.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cliente.codigo || 'Sin código'} · {cliente.telefono || 'Sin teléfono'}{cliente.email ? ` · ${cliente.email}` : ''}
                    </Typography>
                  </Box>
                  <Chip size="small" label="Cliente activo" color="success" variant="outlined" />
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Sin cliente seleccionado: la venta se registrará como consumidor final.
                </Typography>
              )}
            </SeccionFlotante>

            <SeccionFlotante titulo={`Catálogo · ${turno?.sede_nombre || 'sede actual'}`}>
              <ToggleButtonGroup
                value={tipo}
                exclusive
                onChange={(_, value) => { if (value) { setTipo(value); setBusqueda(''); } }}
                size="small"
                sx={{ mb: 1.4, display: 'flex', flexWrap: 'wrap', gap: .7, '& .MuiToggleButtonGroup-grouped': { border: '1px solid #dce4ee !important', borderRadius: '7px !important', px: 1.15, py: .65, textTransform: 'none', fontWeight: 800, color: '#52606d', '&.Mui-selected': { bgcolor: 'rgba(20, 73, 133, .08)', borderColor: `${AZUL_REVIVE} !important`, color: AZUL_REVIVE } } }}
              >
                {tipos.map((item) => (
                  <ToggleButton key={item.value} value={item.value}>{item.icono}<Typography variant="caption" sx={{ ml: .55, fontWeight: 900 }}>{item.label}</Typography></ToggleButton>
                ))}
              </ToggleButtonGroup>

              {tipo !== 'OTRO' ? (
                <>
                  <TextField
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={`Buscar ${tipos.find((item) => item.value === tipo)?.label?.toLowerCase() || 'ítem'}...`}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment> } }}
                  />
                  {(tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO') ? <Alert severity="info" sx={{ mt: 1.15, py: .15 }}>Se muestran como referencia. La asignación contractual se realiza desde Membresías.</Alert> : null}
                  <Box sx={{ mt: 1.35, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 1, maxHeight: { lg: 'calc(100vh - 355px)', xs: 520 }, overflowY: 'auto', pr: .5 }}>
                    {disponibles.map((item) => <CatalogoCard key={`${tipo}-${item.id}`} item={item} tipo={tipo} onAgregar={() => agregar(item)} />)}
                  </Box>
                  {disponibles.length === 0 ? <Box sx={{ textAlign: 'center', py: 5 }}><Typography variant="body2" color="text.secondary">No hay ítems disponibles para este filtro.</Typography></Box> : null}
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' }, gap: 1, alignItems: 'end' }}>
                  <TextField label="Descripción" size="small" value={otro.descripcion} onChange={(e) => setOtro((a) => ({ ...a, descripcion: e.target.value }))} />
                  <TextField label="Precio unitario" type="number" size="small" value={otro.precio} onChange={(e) => setOtro((a) => ({ ...a, precio: e.target.value }))} />
                  <TextField label="Cantidad" type="number" size="small" value={otro.cantidad} onChange={(e) => setOtro((a) => ({ ...a, cantidad: e.target.value }))} />
                  <Button startIcon={<AddShoppingCartOutlinedIcon />} variant="outlined" onClick={agregarOtro}>Agregar</Button>
                </Box>
              )}
            </SeccionFlotante>
          </Stack>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
            <Box sx={{ border: '1px solid #dbe3ec', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 12px 28px rgba(15, 58, 107, .08)' }}>
              <Box sx={{ p: 1.7, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>TOTAL</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ color: AZUL_REVIVE, lineHeight: 1 }}>{dinero(total)}</Typography>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    {turno?.sede_nombre || 'Sede pendiente'} · {turno?.caja_nombre || 'Caja pendiente'}
                  </Typography>
                  <Chip label="Pendiente de pago" size="small" color="warning" variant="outlined" sx={{ fontWeight: 800 }} />
                </Box>
              </Box>

              <Box sx={{ px: 1.7, py: 1.35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, borderBottom: '1px solid #edf1f5' }}>
                <DatoFactura label="Fecha" valor={fechaHora(new Date())} />
                <DatoFactura label="Turno" valor={turno?.id ? `#${turno.id}` : '—'} />
                <DatoFactura label="Caja" valor={turno?.caja_codigo || '—'} />
                <DatoFactura label="Atendido por" valor={turno?.cajero_nombre || 'Usuario actual'} />
              </Box>

              <Box sx={{ p: 1.7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.15 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .7 }}><ShoppingCartOutlinedIcon sx={{ fontSize: 20, color: AZUL_REVIVE }} /><Typography variant="subtitle2" fontWeight={900}>Detalle de la venta</Typography></Box>
                  <Chip size="small" label={`${totalItems} ítems`} />
                </Box>

                {carrito.length === 0 ? (
                  <Box sx={{ py: 4.5, textAlign: 'center', border: '1px dashed #d7e0ea', borderRadius: 1.5, bgcolor: '#fbfcfe' }}>
                    <ShoppingCartOutlinedIcon sx={{ fontSize: 38, opacity: .22, mb: .5 }} />
                    <Typography variant="body2" fontWeight={700} color="text.secondary">Carrito vacío</Typography>
                    <Typography variant="caption" color="text.secondary">Selecciona un ítem del catálogo.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 285, overflowY: 'auto', pr: .3 }}>
                    {carrito.map((item) => (
                      <Box key={item.clave} sx={{ p: 1, border: '1px solid #e4eaf1', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                          <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={900}>{item.descripcion}</Typography><Typography variant="caption" color="text.secondary">{dinero(item.precio_unitario)} unitario</Typography></Box>
                          <Tooltip title="Quitar"><IconButton size="small" color="error" onClick={() => setCarrito((actual) => actual.filter((fila) => fila.clave !== item.clave))}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                        <Box sx={{ mt: .8, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                          <CantidadControl cantidad={item.cantidad} onMenos={() => ajustarCantidad(item.clave, -1)} onMas={() => ajustarCantidad(item.clave, 1)} onChange={(valor) => cambiarCantidad(item.clave, valor)} />
                          <Box sx={{ textAlign: 'right' }}><Typography variant="caption" color="text.secondary" display="block">{item.cantidad} × {dinero(item.precio_unitario)}</Typography><Typography variant="body1" fontWeight={900}>{dinero(item.total_linea)}</Typography></Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 1.4 }} />
                <Stack spacing={.75}>
                  <ResumenFila label="Subtotal" valor={dinero(subtotal)} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center' }}><Typography variant="body2" color="text.secondary">Descuento</Typography><TextField size="small" type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} inputProps={{ min: 0 }} /></Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center' }}><Typography variant="body2" color="text.secondary">Impuesto</Typography><TextField size="small" type="number" value={impuesto} onChange={(e) => setImpuesto(e.target.value)} inputProps={{ min: 0 }} /></Box>
                </Stack>

                <Box sx={{ mt: 1.25, px: 1.3, py: 1.15, bgcolor: AZUL_REVIVE, color: '#fff', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="subtitle1" fontWeight={900}>TOTAL</Typography><Typography variant="h4" fontWeight={900}>{dinero(total)}</Typography></Box>

                <SeccionInterna titulo="Cobro" sx={{ mt: 1.8 }}>
                  <TextField select label="Método de pago" size="small" fullWidth value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <MenuItem value="EFECTIVO">Efectivo</MenuItem><MenuItem value="TARJETA">Tarjeta</MenuItem><MenuItem value="TRANSFERENCIA">Transferencia</MenuItem><MenuItem value="DEPOSITO">Depósito</MenuItem><MenuItem value="OTRO">Otro</MenuItem>
                  </TextField>
                  {metodoPago === 'EFECTIVO' ? (
                    <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField label="Recibido" size="small" type="number" value={recibido} onChange={(e) => setRecibido(e.target.value)} inputProps={{ min: 0 }} />
                      <Box sx={{ px: 1.1, py: .7, borderRadius: 1.25, border: '1px solid #e0e7ef', bgcolor: '#f8fafc' }}><Typography variant="caption" color="text.secondary" display="block">{faltante > 0 ? 'Faltante' : 'Cambio'}</Typography><Typography variant="body1" fontWeight={900} color={faltante > 0 ? 'error.main' : 'success.main'}>{dinero(faltante > 0 ? faltante : cambio)}</Typography></Box>
                    </Box>
                  ) : <TextField label="Referencia / comprobante" size="small" fullWidth value={referencia} onChange={(e) => setReferencia(e.target.value)} sx={{ mt: 1 }} />}
                </SeccionInterna>

                <TextField fullWidth multiline minRows={2} size="small" label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} sx={{ mt: 1.4 }} />
                <Stack spacing={1} sx={{ mt: 1.4 }}>
                  <Button variant="contained" disabled={guardando || carrito.length === 0 || !turno?.id || (metodoPago === 'EFECTIVO' && faltante > 0)} onClick={() => guardar(true)} sx={dbanuStyles.addButtonRevive} startIcon={<ReceiptLongOutlinedIcon />}>Cobrar {dinero(total)}</Button>
                  <Button variant="outlined" disabled={guardando || carrito.length === 0 || !turno?.id} onClick={() => guardar(false)}>Guardar pendiente</Button>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))} />
    </Box>
  );
}

function SeccionFlotante({ titulo, children }) {
  return (
    <Box sx={{ position: 'relative', border: '1px solid #dce4ed', borderRadius: 2, px: 1.5, pt: 2.05, pb: 1.45, bgcolor: '#fff' }}>
      <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 14, px: .8, bgcolor: '#fff', color: AZUL_REVIVE, fontWeight: 900, letterSpacing: .25 }}>{titulo}</Typography>
      {children}
    </Box>
  );
}

function SeccionInterna({ titulo, children, sx = {} }) {
  return (
    <Box sx={{ position: 'relative', border: '1px solid #e1e7ef', borderRadius: 1.5, px: 1.1, pt: 1.8, pb: 1.05, ...sx }}>
      <Typography variant="caption" sx={{ position: 'absolute', top: -9, left: 11, px: .55, bgcolor: '#fff', fontWeight: 900, color: AZUL_REVIVE }}>{titulo}</Typography>
      {children}
    </Box>
  );
}

function CatalogoCard({ item, tipo, onAgregar }) {
  const sinPrecio = item.precio === null || item.precio === undefined || Number(item.precio) <= 0;
  const contractual = tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO';
  const icono = tipo === 'PRODUCTO' ? <Inventory2OutlinedIcon /> : tipo === 'SERVICIO' ? <FitnessCenterOutlinedIcon /> : tipo === 'PASE_DIARIO' ? <LocalActivityOutlinedIcon /> : <BadgeOutlinedIcon />;
  return (
    <Box sx={{ border: '1px solid #e1e7ef', borderRadius: 1.6, overflow: 'hidden', bgcolor: '#fff', minHeight: 188, display: 'flex', flexDirection: 'column', transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 18px rgba(15, 58, 107, .08)', borderColor: '#b9c9dc' } }}>
      <Box sx={{ height: 68, bgcolor: '#f4f7fb', display: 'grid', placeItems: 'center', borderBottom: '1px solid #edf1f5' }}>
        {item.imagen_url || item.imagen ? <Box component="img" src={item.imagen_url || item.imagen} alt={item.nombre} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(20, 73, 133, .10)', color: AZUL_REVIVE }}>{icono}</Avatar>}
      </Box>
      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.2, minHeight: 32 }}>{item.nombre}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: .3 }}>{tipo === 'SERVICIO' ? `${item.duracion_minutos || 0} min${item.categoria ? ` · ${item.categoria}` : ''}` : item.codigo || item.descripcion || tipos.find((opcion) => opcion.value === tipo)?.label}</Typography>
        <Box sx={{ mt: 'auto', pt: .75 }}>
          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: .6 }}>
            <Box><Typography variant="subtitle1" fontWeight={900} color={sinPrecio ? 'warning.main' : AZUL_REVIVE}>{sinPrecio ? 'Por configurar' : dinero(item.precio)}</Typography>{tipo === 'PRODUCTO' && item.controla_stock ? <Typography variant="caption" color="text.secondary">Stock {Number(item.stock_actual || 0)}</Typography> : null}</Box>
            <Tooltip title={contractual ? 'Se asigna desde Membresías' : sinPrecio ? 'Configura primero el precio' : 'Agregar al carrito'}><span><IconButton size="small" onClick={onAgregar} disabled={sinPrecio || contractual} sx={{ border: '1px solid #d6e0eb', borderRadius: 1, color: AZUL_REVIVE }}><AddShoppingCartOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function CantidadControl({ cantidad, onMenos, onMas, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #dce4ed', borderRadius: 1.1, overflow: 'hidden' }}>
      <IconButton size="small" onClick={onMenos} disabled={Number(cantidad) <= 1} sx={{ borderRadius: 0 }}><RemoveOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
      <TextField variant="standard" type="number" value={cantidad} onChange={(e) => onChange(e.target.value)} slotProps={{ input: { disableUnderline: true }, htmlInput: { min: 1, style: { textAlign: 'center', width: 32, fontWeight: 900, padding: 0 } } }} />
      <IconButton size="small" onClick={onMas} sx={{ borderRadius: 0 }}><AddOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
    </Box>
  );
}

function DatoFactura({ label, valor }) {
  return <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" display="block">{label}</Typography><Typography variant="body2" fontWeight={800} noWrap title={valor}>{valor}</Typography></Box>;
}

function ResumenFila({ label, valor }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', py: .25 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={900}>{valor}</Typography></Box>;
}
