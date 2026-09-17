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
    () => carrito.reduce((totalActual, item) => totalActual + Number(item.total_linea || 0), 0),
    [carrito],
  );
  const total = Math.max(0, subtotal - Number(descuento || 0) + Number(impuesto || 0));
  const cambio = metodoPago === 'EFECTIVO' ? Math.max(0, Number(recibido || 0) - total) : 0;

  const disponibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    let items = [];

    if (tipo === 'SERVICIO') items = contexto.servicios || [];
    if (tipo === 'PRODUCTO') items = contexto.productos || [];
    if (tipo === 'MEMBRESIA') items = (contexto.planes || []).filter((item) => item.tipo_producto !== 'PASE_DIARIO');
    if (tipo === 'PASE_DIARIO') items = (contexto.planes || []).filter((item) => item.tipo_producto === 'PASE_DIARIO');

    if (!texto) return items;

    return items.filter((item) =>
      `${item.nombre || ''} ${item.codigo || ''} ${item.categoria || ''}`.toLowerCase().includes(texto),
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
        return actual.map((fila) =>
          fila.clave === clave
            ? { ...fila, cantidad: fila.cantidad + 1, total_linea: (fila.cantidad + 1) * fila.precio_unitario }
            : fila,
        );
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
        ? { ...item, cantidad: valor, total_linea: valor * item.precio_unitario }
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
    if (cobrar && metodoPago === 'EFECTIVO' && Number(recibido || 0) < total) {
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
        avisar('Venta y pago registrados correctamente.', 'success');
      } else {
        avisar('Venta guardada como pendiente de pago.', 'success');
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

      <Paper className="page-content-container" elevation={0} sx={{ mt: 2, p: { xs: 1.5, md: 2.25 } }}>
        {errorContexto ? <Alert severity="error" sx={{ mb: 2 }}>{errorContexto}</Alert> : null}
        {!cargando && !errorContexto && !turno?.id ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tienes un turno de caja abierto. Abre un turno antes de registrar ventas.
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 2,
            alignItems: 'start',
            pb: 2,
            mb: 2,
            borderBottom: '1px solid #e5eaf1',
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
              REVIVE SPORTS · FACTURACIÓN
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Punto de venta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .45 }}>
              {turno?.sede_nombre || 'Sede pendiente'} · {turno?.caja_nombre || 'Caja pendiente'}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { md: 220 } }}>
            <Typography variant="caption" color="text.secondary" display="block">VENTA</Typography>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -.8, lineHeight: 1.05 }}>
              # NUEVA
            </Typography>
            <Chip label="Pendiente de pago" size="small" color="warning" variant="outlined" sx={{ mt: .8, fontWeight: 700 }} />
          </Box>
        </Box>

        <SeccionFlotante titulo="Datos de la operación" sx={{ mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 0 }}>
            <DatoOperacion label="Fecha y hora" valor={fechaHora(new Date())} />
            <DatoOperacion label="Sede" valor={turno?.sede_nombre || '—'} />
            <DatoOperacion label="Caja" valor={turno ? `${turno.caja_nombre} · ${turno.caja_codigo}` : '—'} />
            <DatoOperacion label="Turno" valor={turno?.id ? `#${turno.id}` : '—'} />
            <DatoOperacion label="Estado" valor="Pendiente de pago" destacado />
          </Box>
        </SeccionFlotante>

        <SeccionFlotante titulo="Cliente" sx={{ mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: cliente ? 'minmax(0, 1.5fr) minmax(260px, .75fr)' : '1fr' }, gap: 1.5, alignItems: 'center' }}>
            <Autocomplete
              options={contexto.clientes || []}
              value={cliente}
              onChange={(_, value) => setCliente(value)}
              getOptionLabel={(item) => `${item.nombre || ''}${item.codigo ? ` · ${item.codigo}` : ''}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Buscar por nombre, código, cédula o teléfono"
                />
              )}
            />

            {cliente ? (
              <Box sx={{ px: 1.4, py: 1, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" fontWeight={800}>{cliente.nombre}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {cliente.codigo || 'Sin código'} · {cliente.telefono || 'Sin teléfono'}
                </Typography>
                <Chip size="small" label="Cliente activo" color="success" variant="outlined" sx={{ mt: .7 }} />
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Sin selección: la venta se registrará como consumidor final.
              </Typography>
            )}
          </Box>
        </SeccionFlotante>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.65fr) minmax(320px, .65fr)' }, gap: 2, alignItems: 'start' }}>
          <Stack spacing={2}>
            <SeccionFlotante titulo={`Catálogo de venta · ${turno?.sede_nombre || 'sede actual'}`}>
              <ToggleButtonGroup
                value={tipo}
                exclusive
                onChange={(_, value) => {
                  if (!value) return;
                  setTipo(value);
                  setBusqueda('');
                }}
                fullWidth
                size="small"
                sx={{
                  mb: 1.5,
                  flexWrap: 'wrap',
                  gap: .75,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: '1px solid #d9e2ef !important',
                    borderRadius: '8px !important',
                    px: 1.25,
                    py: .8,
                    flex: '1 1 120px',
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                }}
              >
                {tipos.map((item) => (
                  <ToggleButton key={item.value} value={item.value}>
                    {item.icono}
                    <Typography variant="caption" sx={{ ml: .65, fontWeight: 800 }}>{item.label}</Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO' ? (
                <Alert severity="info" sx={{ mb: 1.5, py: .2 }}>
                  Se muestran como referencia comercial. La asignación contractual continúa realizándose desde Membresías.
                </Alert>
              ) : null}

              {tipo !== 'OTRO' ? (
                <>
                  <TextField
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={`Buscar en ${tipos.find((item) => item.value === tipo)?.label?.toLowerCase() || 'catálogo'}...`}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchOutlinedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box
                    sx={{
                      mt: 1.5,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                      gap: 1.25,
                      maxHeight: 470,
                      overflowY: 'auto',
                      pr: .5,
                    }}
                  >
                    {disponibles.map((item) => (
                      <CatalogoCard key={`${tipo}-${item.id}`} item={item} tipo={tipo} onAgregar={() => agregar(item)} />
                    ))}
                  </Box>

                  {disponibles.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body2" color="text.secondary">No hay ítems disponibles para este filtro.</Typography>
                    </Box>
                  ) : null}
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

            <SeccionFlotante titulo="Detalle de la venta">
              {carrito.length === 0 ? (
                <Box sx={{ py: 4.5, textAlign: 'center', color: 'text.secondary' }}>
                  <ShoppingCartOutlinedIcon sx={{ fontSize: 38, opacity: .35, mb: .5 }} />
                  <Typography variant="body2">Selecciona un producto o servicio para comenzar la venta.</Typography>
                </Box>
              ) : (
                <Stack spacing={.75}>
                  {carrito.map((item) => (
                    <Box
                      key={item.clave}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr auto', md: 'minmax(0, 1fr) 140px 105px 105px 42px' },
                        gap: 1,
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid #e6ebf2',
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} noWrap>{item.descripcion}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.tipo}</Typography>
                      </Box>

                      <CantidadControl
                        cantidad={item.cantidad}
                        onMenos={() => ajustarCantidad(item.clave, -1)}
                        onMas={() => ajustarCantidad(item.clave, 1)}
                        onChange={(valor) => cambiarCantidad(item.clave, valor)}
                      />

                      <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                        <Typography variant="caption" color="text.secondary" display="block">P. unit.</Typography>
                        <Typography variant="body2" fontWeight={700}>{dinero(item.precio_unitario)}</Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                        <Typography variant="body2" fontWeight={900}>{dinero(item.total_linea)}</Typography>
                      </Box>

                      <Tooltip title="Quitar del carrito">
                        <IconButton size="small" color="error" onClick={() => setCarrito((a) => a.filter((fila) => fila.clave !== item.clave))}>
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>
              )}
            </SeccionFlotante>

            <SeccionFlotante titulo="Observaciones">
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones opcionales de la venta"
              />
            </SeccionFlotante>
          </Stack>

          <Box sx={{ position: { xl: 'sticky' }, top: { xl: 16 } }}>
            <SeccionFlotante titulo="Carrito y cobro">
              <Stack spacing={1.1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .8 }}>
                    <ShoppingCartOutlinedIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={800}>Carrito</Typography>
                  </Box>
                  <Chip size="small" label={`${carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0)} ítems`} />
                </Box>

                {carrito.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">Aún no has agregado conceptos a la venta.</Typography>
                ) : (
                  <Stack spacing={.8} sx={{ maxHeight: 220, overflowY: 'auto', pr: .4 }}>
                    {carrito.map((item) => (
                      <Box key={`mini-${item.clave}`} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: .75, alignItems: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={800} noWrap>{item.descripcion}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{item.cantidad} × {dinero(item.precio_unitario)}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800}>{dinero(item.total_linea)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Divider />
                <ResumenFila label="Subtotal" valor={dinero(subtotal)} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 108px', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Descuento</Typography>
                  <TextField size="small" type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} inputProps={{ min: 0 }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 108px', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Impuesto</Typography>
                  <TextField size="small" type="number" value={impuesto} onChange={(e) => setImpuesto(e.target.value)} inputProps={{ min: 0 }} />
                </Box>

                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #dbe4ef', borderRadius: 1.5, p: 1.35, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={900}>TOTAL</Typography>
                  <Typography variant="h5" fontWeight={900}>{dinero(total)}</Typography>
                </Box>

                <TextField select label="Método de pago" size="small" fullWidth value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="TARJETA">Tarjeta</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  <MenuItem value="DEPOSITO">Depósito</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>

                {metodoPago === 'EFECTIVO' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField
                      label="Recibido"
                      size="small"
                      type="number"
                      value={recibido}
                      onChange={(e) => setRecibido(e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1.25, px: 1.25, py: .7, bgcolor: '#fbfcfe' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Cambio</Typography>
                      <Typography variant="body1" fontWeight={900}>{dinero(cambio)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <TextField label="Referencia / comprobante" size="small" fullWidth value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                )}

                <Button
                  variant="contained"
                  disabled={guardando || carrito.length === 0 || !turno?.id}
                  onClick={() => guardar(true)}
                  sx={dbanuStyles.addButtonRevive}
                  startIcon={<ReceiptLongOutlinedIcon />}
                >
                  Guardar y cobrar
                </Button>
                <Button variant="outlined" disabled={guardando || carrito.length === 0 || !turno?.id} onClick={() => guardar(false)}>
                  Guardar pendiente
                </Button>

                <Typography variant="caption" color="text.secondary">
                  Caja y turno se asignan automáticamente desde la sesión operativa actual.
                </Typography>
              </Stack>
            </SeccionFlotante>
          </Box>
        </Box>
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((a) => ({ ...a, mensaje: '' }))} />
    </Box>
  );
}

function SeccionFlotante({ titulo, children, sx = {} }) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid #dce4ee',
        borderRadius: 2,
        px: { xs: 1.25, md: 1.6 },
        pt: 2.15,
        pb: 1.5,
        bgcolor: '#fff',
        ...sx,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: -10,
          left: 14,
          px: .8,
          bgcolor: '#fff',
          fontWeight: 900,
          color: 'text.primary',
          letterSpacing: .15,
        }}
      >
        {titulo}
      </Typography>
      {children}
    </Box>
  );
}

function CatalogoCard({ item, tipo, onAgregar }) {
  const sinPrecio = item.precio === null || item.precio === undefined || Number(item.precio) <= 0;
  const contractual = tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO';
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
        border: '1px solid #e1e7ef',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 215,
        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(15, 23, 42, .07)', borderColor: '#c8d4e3' },
      }}
    >
      <Box
        sx={{
          height: 76,
          bgcolor: '#f5f8fc',
          borderBottom: '1px solid #edf1f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.imagen_url || item.imagen ? (
          <Box component="img" src={item.imagen_url || item.imagen} alt={item.nombre} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(20, 73, 133, .10)', color: 'rgba(20, 73, 133, 1)' }}>
            {icono}
          </Avatar>
        )}
      </Box>

      <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.2, minHeight: 34 }}>
          {item.nombre}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: .35, minHeight: 18 }}>
          {tipo === 'SERVICIO'
            ? `${item.duracion_minutos || 0} min${item.categoria ? ` · ${item.categoria}` : ''}`
            : item.codigo || item.descripcion || tipos.find((opcion) => opcion.value === tipo)?.label}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="h6" fontWeight={900} color={sinPrecio ? 'warning.main' : 'text.primary'}>
            {sinPrecio ? 'Por configurar' : dinero(item.precio)}
          </Typography>
          {tipo === 'PRODUCTO' && item.controla_stock ? (
            <Typography variant="caption" color="text.secondary">Stock: {Number(item.stock_actual || 0)}</Typography>
          ) : null}

          <Tooltip title={contractual ? 'Se asigna desde Membresías' : sinPrecio ? 'Configura primero el precio comercial' : 'Agregar al carrito'}>
            <span>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<AddShoppingCartOutlinedIcon />}
                sx={{ mt: .9, textTransform: 'none', fontWeight: 800 }}
                onClick={onAgregar}
                disabled={sinPrecio || contractual}
              >
                {contractual ? 'Ver en Membresías' : 'Agregar'}
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
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: .25, border: '1px solid #dde4ed', borderRadius: 1.25, p: .2 }}>
      <IconButton size="small" onClick={onMenos} disabled={Number(cantidad) <= 1}>
        <RemoveOutlinedIcon fontSize="small" />
      </IconButton>
      <TextField
        variant="standard"
        type="number"
        value={cantidad}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ min: 1, style: { textAlign: 'center', width: 34, fontWeight: 800 } }}
        InputProps={{ disableUnderline: true }}
      />
      <IconButton size="small" onClick={onMas}>
        <AddOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function DatoOperacion({ label, valor, destacado = false }) {
  return (
    <Box sx={{ px: 1.35, py: .45, minWidth: 0, borderRight: { md: '1px solid #e2e8f0' } }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      {destacado ? (
        <Chip size="small" label={valor} color="warning" variant="outlined" sx={{ mt: .45, fontWeight: 700 }} />
      ) : (
        <Typography variant="body2" fontWeight={800} noWrap title={valor}>{valor}</Typography>
      )}
    </Box>
  );
}

function ResumenFila({ label, valor }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: .3 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={800}>{valor}</Typography>
    </Box>
  );
}
