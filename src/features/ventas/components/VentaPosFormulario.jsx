import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
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
import { uiTokens } from '../../../styles/uiTokens.js';
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
const DORADO_REVIVE = uiTokens.colores.acento;
const DORADO_REVIVE_OSCURO = uiTokens.colores.acentoOscuro;
const NEGRO_REVIVE = uiTokens.colores.textoFuerte;
const DORADO_SUAVE = uiTokens.colores.acentoSuave;

export function VentaPosFormulario({ onVolver, onGuardado, ventaInicial = null }) {
  const esCuentaAbierta = Boolean(ventaInicial?.id);
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

  const tiposVisibles = esCuentaAbierta
    ? tipos.filter((item) => ['SERVICIO', 'PRODUCTO', 'OTRO'].includes(item.value))
    : tipos;

  const avisar = (mensaje, tipoAviso = 'info') => setNotificacion({ mensaje, tipo: tipoAviso });

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setErrorContexto('');
      try {
        const response = await ventaServicio.obtenerContextoPos();
        const datosContexto = response.datos || response || {};
        setContexto(datosContexto);

        if (ventaInicial?.id) {
          const clienteCuenta = (datosContexto.clientes || []).find((item) => Number(item.id) === Number(ventaInicial.cliente_id));
          setCliente(clienteCuenta || (ventaInicial.cliente_id ? {
            id: ventaInicial.cliente_id,
            nombre: ventaInicial.cliente_nombre || 'Cliente',
            codigo: ventaInicial.codigo_deportista || '',
          } : null));
          setDescuento(Number(ventaInicial.descuento || 0));
          setImpuesto(Number(ventaInicial.impuesto || 0));
          setObservaciones(ventaInicial.observaciones || '');
          setCarrito((ventaInicial.detalles || []).map((fila, indice) => {
            const contractual = Boolean(ventaInicial.membresia_id) && (
              String(fila.tipo_item || '').toUpperCase() === 'MEMBRESIA'
              || (!fila.tipo_item && indice === 0)
            );
            const tipoItem = String(fila.tipo_item || (contractual ? 'MEMBRESIA' : 'OTRO')).toUpperCase();
            return {
              clave: `CUENTA-${fila.id || indice}`,
              tipo: tipoItem,
              referencia_id: fila.referencia_id || (contractual ? ventaInicial.membresia_plan_id : null),
              producto_id: fila.producto_id || null,
              descripcion: fila.descripcion,
              cantidad: Number(fila.cantidad || 1),
              precio_unitario: Number(fila.precio_unitario || 0),
              total_linea: Number(fila.total_linea || 0),
              bloqueado: contractual,
            };
          }));
        }
      } catch (error) {
        const mensaje = error.response?.data?.mensaje || 'No se pudo cargar el contexto de venta.';
        setErrorContexto(mensaje);
        avisar(mensaje, 'error');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [ventaInicial?.id]);

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
      const payloadVenta = {
        cliente_id: cliente?.id || null,
        descuento: Number(descuento || 0),
        impuesto: Number(impuesto || 0),
        observaciones: observaciones || null,
        detalles: carrito.map(({ clave, bloqueado, ...item }) => item),
      };

      const payloadCobro = {
        ...payloadVenta,
        metodo_pago: metodoPago,
        referencia_pago: referencia || null,
        observaciones_pago: metodoPago === 'EFECTIVO'
          ? `Cobro POS. Recibido ${dinero(recibido)}. Cambio ${dinero(cambio)}.`
          : 'Cobro registrado desde POS.',
      };

      const response = esCuentaAbierta
        ? (cobrar
            ? await ventaServicio.cobrarCuentaPos(ventaInicial.id, payloadCobro)
            : await ventaServicio.actualizarCuentaPos(ventaInicial.id, payloadVenta))
        : (cobrar
            ? await ventaServicio.cobrarVentaPos(payloadCobro)
            : await ventaServicio.crearVentaPos(payloadVenta));

      const venta = response.datos || response;
      if (cobrar) {
        const comprobante = venta.comprobante?.numero ? ` · Recibo ${venta.comprobante.numero}` : '';
        avisar(`${esCuentaAbierta ? 'Cuenta' : 'Venta'} ${venta.numero || ''} pagada correctamente${comprobante}.`, 'success');
      } else {
        avisar(`${esCuentaAbierta ? 'Cuenta' : 'Venta'} ${venta.numero || ''} guardada como pendiente de pago.`, 'success');
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
        titulo={esCuentaAbierta ? `Cuenta abierta · ${ventaInicial.numero || ''}` : 'Nueva venta'}
        descripcion={esCuentaAbierta ? 'Agrega consumos a la cuenta del cliente y cobra todo en una sola operación.' : 'Registra servicios, productos y cobros asociados al turno de caja activo.'}
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

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.75fr) minmax(380px, .82fr)' }, gap: 2.2, alignItems: 'start' }}>
          <Stack spacing={2}>
            <SeccionPos titulo="Cliente" icono={<PersonOutlineOutlinedIcon />} descripcion="Selecciona un cliente o registra la venta como consumidor final.">
              <Autocomplete
                options={contexto.clientes || []}
                value={cliente}
                onChange={(_, value) => setCliente(value)}
                disabled={esCuentaAbierta}
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
            </SeccionPos>

            <SeccionPos titulo={`Catálogo · ${turno?.sede_nombre || 'sede actual'}`} icono={<AppsOutlinedIcon />} descripcion="Servicios, productos y opciones disponibles para esta sede.">
              <ToggleButtonGroup
                value={tipo}
                exclusive
                onChange={(_, value) => { if (value) { setTipo(value); setBusqueda(''); } }}
                size="small"
                sx={{ mb: 1.4, display: 'flex', flexWrap: 'wrap', gap: .75, '& .MuiToggleButtonGroup-grouped': { minHeight: 38, border: '1px solid #e1e5ea !important', borderRadius: '9px !important', px: 1.5, py: .7, textTransform: 'none', fontWeight: 900, color: '#4b5563', bgcolor: '#f8fafc', transition: 'all .18s ease', '&:hover': { borderColor: `${DORADO_REVIVE} !important`, bgcolor: DORADO_SUAVE, color: DORADO_REVIVE_OSCURO }, '&.Mui-selected': { background: `linear-gradient(135deg, ${DORADO_REVIVE} 0%, ${DORADO_REVIVE_OSCURO} 100%)`, borderColor: `${DORADO_REVIVE} !important`, color: '#fff', boxShadow: '0 6px 14px rgba(184, 138, 0, .22)', '&:hover': { bgcolor: DORADO_REVIVE_OSCURO, color: '#fff' } } } }}
              >
                {tiposVisibles.map((item) => (
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
                    placeholder={`Buscar ${tiposVisibles.find((item) => item.value === tipo)?.label?.toLowerCase() || 'ítem'}...`}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" sx={{ color: DORADO_REVIVE }} /></InputAdornment> } }}
                  />
                  {!esCuentaAbierta && (tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO') ? <Alert severity="info" sx={{ mt: 1.15, py: .15 }}>Se muestran como referencia. La asignación contractual se realiza desde Membresías.</Alert> : null}
                  <Box sx={{ mt: 1.35, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 168px))', gap: 1.15, justifyContent: 'start', mt: 1.65, maxHeight: { lg: 'calc(100vh - 355px)', xs: 520 }, overflowY: 'auto', pr: .5 }}>
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
            </SeccionPos>
          </Stack>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
            <Box sx={{ border: '1px solid #e3e6ea', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 14px 30px rgba(23, 23, 23, .08)' }}>
              <Box sx={{ p: 2, background: `linear-gradient(135deg, ${NEGRO_REVIVE} 0%, #28230f 58%, ${DORADO_REVIVE_OSCURO} 145%)`, borderBottom: '1px solid rgba(255,255,255,.08)', position: 'relative', overflow: 'hidden', '&::after': { content: '""', position: 'absolute', width: 190, height: 190, right: -75, top: -110, borderRadius: '50%', bgcolor: 'rgba(212,160,23,.10)' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 950, color: '#fff', letterSpacing: .5, position: 'relative', zIndex: 1 }}>TOTAL</Typography>
                  <Typography variant="h3" fontWeight={950} sx={{ color: '#fff', lineHeight: 1, letterSpacing: -.8, position: 'relative', zIndex: 1 }}>{dinero(total)}</Typography>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .65, minWidth: 0, position: 'relative', zIndex: 1 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 17, color: '#fff', flexShrink: 0 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,.90)',
                        fontWeight: 850,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={`${turno?.sede_nombre || 'Sede pendiente'} · ${turno?.caja_nombre || 'Caja pendiente'}`}
                    >
                      {turno?.sede_nombre || 'Sede pendiente'} · {turno?.caja_nombre || 'Caja pendiente'}
                    </Typography>
                  </Box>
                  <Chip label="Pendiente de pago" size="small" sx={{ fontWeight: 900, color: DORADO_REVIVE_OSCURO, bgcolor: '#fff', border: `1px solid ${DORADO_REVIVE}`, position: 'relative', zIndex: 1 }} />
                </Box>
              </Box>

              <Box sx={{ px: 1.7, py: 1.35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, borderBottom: '1px solid #edf1f5' }}>
                <DatoFactura icono={<CalendarTodayOutlinedIcon />} label="Fecha" valor={fechaHora(new Date())} />
                <DatoFactura icono={<HistoryOutlinedIcon />} label="Turno" valor={turno?.id ? `#${turno.id}` : '—'} />
                <DatoFactura icono={<PointOfSaleOutlinedIcon />} label="Caja" valor={turno?.caja_codigo || '—'} />
                <DatoFactura icono={<PersonOutlineOutlinedIcon />} label="Atendido por" valor={turno?.cajero_nombre || 'Usuario actual'} />
              </Box>

              <Box sx={{ p: 1.7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.15 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .7 }}><ShoppingCartOutlinedIcon sx={{ fontSize: 20, color: DORADO_REVIVE }} /><Typography variant="subtitle2" fontWeight={950} sx={{ color: NEGRO_REVIVE }}>Detalle de la venta</Typography></Box>
                  <Chip size="small" label={`${totalItems} ítems`} />
                </Box>

                {carrito.length === 0 ? (
                  <Box sx={{ py: 5.2, textAlign: 'center', border: '1px dashed #d8dee7', borderRadius: 2, bgcolor: '#fbfcfe' }}>
                    <ShoppingCartOutlinedIcon sx={{ fontSize: 38, color: DORADO_REVIVE, opacity: .35, mb: .5 }} />
                    <Typography variant="body2" fontWeight={700} color="text.secondary">Carrito vacío</Typography>
                    <Typography variant="caption" color="text.secondary">Selecciona un ítem del catálogo.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 285, overflowY: 'auto', pr: .3 }}>
                    {carrito.map((item) => (
                      <Box key={item.clave} sx={{ p: 1, border: '1px solid #e4eaf1', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={900}>{item.descripcion}</Typography>
                            <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap">
                              <Typography variant="caption" color="text.secondary">{dinero(item.precio_unitario)} unitario</Typography>
                              {item.bloqueado ? <Chip size="small" label="Cargo original" variant="outlined" sx={{ height: 20, fontSize: 10 }} /> : null}
                            </Stack>
                          </Box>
                          {!item.bloqueado ? (
                            <Tooltip title="Quitar"><IconButton size="small" color="error" onClick={() => setCarrito((actual) => actual.filter((fila) => fila.clave !== item.clave))}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          ) : null}
                        </Box>
                        <Box sx={{ mt: .8, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                          {item.bloqueado
                            ? <Typography variant="caption" color="text.secondary">1 unidad</Typography>
                            : <CantidadControl cantidad={item.cantidad} onMenos={() => ajustarCantidad(item.clave, -1)} onMas={() => ajustarCantidad(item.clave, 1)} onChange={(valor) => cambiarCantidad(item.clave, valor)} />}
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

                <Box sx={{ mt: 1.3, pt: 1.25, borderTop: '1px solid #dfe4ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6" fontWeight={950} sx={{ color: NEGRO_REVIVE }}>TOTAL</Typography><Typography variant="h4" fontWeight={950} sx={{ color: DORADO_REVIVE_OSCURO }}>{dinero(total)}</Typography></Box>

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
                  <Button variant="contained" disabled={guardando || carrito.length === 0 || !turno?.id || (metodoPago === 'EFECTIVO' && faltante > 0)} onClick={() => guardar(true)} sx={{ ...dbanuStyles.addButtonRevive, minHeight: 46, borderRadius: 1.2, textTransform: 'none', color: '#111827', fontWeight: 950, fontSize: 13, boxShadow: '0 8px 18px rgba(184,138,0,.18)' }} startIcon={<ReceiptLongOutlinedIcon />}>{esCuentaAbierta ? 'Cobrar ahora' : 'Proceder al cobro'} · {dinero(total)}</Button>
                  <Button variant="outlined" disabled={guardando || carrito.length === 0 || !turno?.id} onClick={() => guardar(false)} sx={{ borderColor: '#c8cdd3', color: NEGRO_REVIVE, fontWeight: 900, '&:hover': { borderColor: DORADO_REVIVE, bgcolor: DORADO_SUAVE, color: DORADO_REVIVE_OSCURO } }}>{esCuentaAbierta ? 'Guardar cuenta' : 'Guardar pendiente'}</Button>
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

function SeccionPos({ titulo, icono, descripcion, children }) {
  return (
    <Box
      sx={{
        border: '1px solid #e1e5ea',
        borderRadius: 2,
        bgcolor: '#fff',
        px: { xs: 1.35, md: 1.7 },
        py: 1.45,
        boxShadow: '0 8px 22px rgba(15,23,42,.045)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.25, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: .9 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.2, display: 'grid', placeItems: 'center', bgcolor: DORADO_SUAVE, color: DORADO_REVIVE_OSCURO }}>
            {icono}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 950, color: NEGRO_REVIVE, lineHeight: 1 }}>
            {titulo}
          </Typography>
        </Box>
        {descripcion ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {descripcion}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Box>
  );
}

function SeccionFlotante({ titulo, children }) {
  return (
    <Box sx={{ position: 'relative', border: '1px solid #e1e5ea', borderRadius: 2, px: 1.5, pt: 2.1, pb: 1.5, bgcolor: '#fff', boxShadow: '0 6px 18px rgba(23,23,23,.035)' }}>
      <Box sx={{ position: 'absolute', top: -11, left: 14, px: .8, bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: .7 }}>
        <Box sx={{ width: 4, height: 14, borderRadius: 3, bgcolor: DORADO_REVIVE }} />
        <Typography variant="caption" sx={{ color: NEGRO_REVIVE, fontWeight: 950, letterSpacing: .2 }}>{titulo}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function SeccionInterna({ titulo, children, sx = {} }) {
  return (
    <Box sx={{ position: 'relative', border: '1px solid #e4e6e9', borderRadius: 1.5, px: 1.1, pt: 1.8, pb: 1.05, ...sx }}>
      <Typography variant="caption" sx={{ position: 'absolute', top: -9, left: 11, px: .55, bgcolor: '#fff', fontWeight: 950, color: NEGRO_REVIVE }}>{titulo}</Typography>
      {children}
    </Box>
  );
}

function CatalogoCard({ item, tipo, onAgregar }) {
  const sinPrecio = item.precio === null || item.precio === undefined || Number(item.precio) <= 0;
  const contractual = tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO';
  const imagen = item.imagen_url || item.imagen || null;
  const icono = tipo === 'PRODUCTO'
    ? <Inventory2OutlinedIcon />
    : tipo === 'SERVICIO'
      ? <FitnessCenterOutlinedIcon />
      : tipo === 'PASE_DIARIO'
        ? <LocalActivityOutlinedIcon />
        : <BadgeOutlinedIcon />;

  return (
    <Box
      sx={{
        border: '1px solid #dfe4ea',
        borderRadius: 1.8,
        overflow: 'hidden',
        bgcolor: '#fff',
        minHeight: 206,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(15,23,42,.045)',
        transition: 'transform .16s ease, box-shadow .16s ease, border-color .16s ease',
        '&:hover': {
          boxShadow: `0 0 0 1px ${DORADO_REVIVE}, 0 10px 22px rgba(15,23,42,.09)`,
          borderColor: DORADO_REVIVE,
        },
      }}
    >
      <Box
        sx={{
          height: 104,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#f3f4f6',
          borderBottom: '1px solid #e8ebef',
        }}
      >
        {imagen ? (
          <Box
            component="img"
            src={imagen}
            alt={item.nombre}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f2f3f5 55%, rgba(212,160,23,.14) 100%)',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#fff',
                color: DORADO_REVIVE_OSCURO,
                border: '1px solid rgba(212,160,23,.28)',
                boxShadow: '0 4px 10px rgba(15,23,42,.07)',
                '& .MuiSvgIcon-root': { fontSize: 22 },
              }}
            >
              {icono}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ p: .9, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 950,
            color: NEGRO_REVIVE,
            lineHeight: 1.2,
            minHeight: 28,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={item.nombre}
        >
          {item.nombre}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: .25,
            lineHeight: 1.25,
            minHeight: 26,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {tipo === 'SERVICIO'
            ? `${item.duracion_minutos || 0} min${item.categoria ? ` · ${item.categoria}` : ''}`
            : item.codigo || item.descripcion || tipos.find((opcion) => opcion.value === tipo)?.label}
        </Typography>

        <Box sx={{ mt: 'auto', pt: .65 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: .8, mb: .65 }}>
            {sinPrecio ? (
              <Chip
                size="small"
                label="Precio pendiente"
                variant="outlined"
                sx={{
                  height: 24,
                  fontWeight: 900,
                  color: DORADO_REVIVE_OSCURO,
                  borderColor: 'rgba(212,160,23,.45)',
                  bgcolor: DORADO_SUAVE,
                  '& .MuiChip-label': { px: .85 },
                }}
              />
            ) : (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 950,
                  color: DORADO_REVIVE_OSCURO,
                  lineHeight: 1,
                }}
              >
                {dinero(item.precio)}
              </Typography>
            )}
            {tipo === 'PRODUCTO' && item.controla_stock ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Stock {Number(item.stock_actual || 0)}
              </Typography>
            ) : null}
          </Box>

          <Tooltip title={contractual ? 'Se asigna desde Membresías' : sinPrecio ? 'Configura el precio comercial para esta sede' : 'Agregar al carrito'}>
            <span style={{ display: 'block', width: '100%' }}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<AddShoppingCartOutlinedIcon />}
                onClick={onAgregar}
                disabled={sinPrecio || contractual}
                sx={{
                  minHeight: 32,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: DORADO_REVIVE,
                  color: '#111827',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: DORADO_REVIVE_OSCURO, color: '#fff' },
                  '&.Mui-disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                {contractual ? 'Ver membresía' : 'Agregar'}
              </Button>
            </span>
          </Tooltip>
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

function DatoFactura({ icono, label, valor }) {
  return (
    <Box sx={{ minWidth: 0, display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: .8, alignItems: 'start' }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          color: DORADO_REVIVE_OSCURO,
          bgcolor: DORADO_SUAVE,
          '& .MuiSvgIcon-root': { fontSize: 17 },
        }}
      >
        {icono}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: DORADO_REVIVE_OSCURO, fontWeight: 900 }} display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={900} noWrap title={valor}>
          {valor}
        </Typography>
      </Box>
    </Box>
  );
}

function ResumenFila({ label, valor }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', py: .25 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={900}>{valor}</Typography></Box>;
}
