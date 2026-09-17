import { useEffect, useMemo, useState } from 'react';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  { value: 'SERVICIO', label: 'Servicio', icono: <FitnessCenterOutlinedIcon fontSize="small" /> },
  { value: 'PRODUCTO', label: 'Producto', icono: <Inventory2OutlinedIcon fontSize="small" /> },
  { value: 'MEMBRESIA', label: 'Membresía', icono: <BadgeOutlinedIcon fontSize="small" /> },
  { value: 'PASE_DIARIO', label: 'Pase diario', icono: <LocalActivityOutlinedIcon fontSize="small" /> },
  { value: 'OTRO', label: 'Otro', icono: <MoreHorizOutlinedIcon fontSize="small" /> },
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
    () => carrito.reduce((total, item) => total + Number(item.total_linea || 0), 0),
    [carrito],
  );
  const total = Math.max(0, subtotal - Number(descuento || 0) + Number(impuesto || 0));

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

  const guardar = async (cobrar = false) => {
    if (!contexto.turno?.id) {
      avisar('Debes abrir un turno de caja antes de registrar una venta.', 'warning');
      return;
    }
    if (carrito.length === 0) {
      avisar('Agrega al menos un ítem a la venta.', 'warning');
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
          observaciones: 'Cobro registrado desde POS.',
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

      <Paper className="page-content-container" elevation={0} sx={{ mt: 2, p: 2 }}>
        {errorContexto ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorContexto}
          </Alert>
        ) : null}

        {!cargando && !errorContexto && !turno?.id ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tienes un turno de caja abierto. Abre un turno antes de registrar ventas.
          </Alert>
        ) : null}

        <Seccion titulo="Datos de la operación" sx={{ mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(6, 1fr)' }, gap: 0 }}>
            <DatoOperacion label="Venta" valor="Se generará al guardar" />
            <DatoOperacion label="Fecha y hora" valor={fechaHora(new Date())} />
            <DatoOperacion label="Sede" valor={turno?.sede_nombre || '—'} />
            <DatoOperacion label="Caja" valor={turno ? `${turno.caja_nombre} · ${turno.caja_codigo}` : '—'} />
            <DatoOperacion label="Turno" valor={turno?.id ? `#${turno.id}` : '—'} />
            <DatoOperacion label="Estado" valor="Pendiente de pago" destacado />
          </Box>
        </Seccion>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(260px, .8fr) minmax(480px, 1.7fr) minmax(250px, .75fr)' }, gap: 2, alignItems: 'start' }}>
          <Stack spacing={2}>
            <Seccion titulo="1. Cliente">
              <Autocomplete
                options={contexto.clientes || []}
                value={cliente}
                onChange={(_, value) => setCliente(value)}
                getOptionLabel={(item) => `${item.nombre || ''}${item.codigo ? ` · ${item.codigo}` : ''}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Buscar por nombre o código" />}
              />

              {cliente ? (
                <Box sx={{ mt: 1.25, p: 1.25, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography fontWeight={700} variant="body2">{cliente.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{cliente.codigo} · {cliente.telefono || 'Sin teléfono'}</Typography>
                  <Chip size="small" label="Cliente activo" color="success" variant="outlined" sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Puedes continuar como consumidor final.
                </Typography>
              )}
            </Seccion>

            <Seccion titulo={`Catálogo · ${turno?.sede_nombre || 'sede actual'}`}>
              {tipo !== 'OTRO' ? (
                <>
                  <TextField value={busqueda} onChange={(e) => setBusqueda(e.target.value)} size="small" fullWidth placeholder="Buscar ítem..." />
                  <Stack spacing={1} sx={{ mt: 1.25, maxHeight: 390, overflowY: 'auto', pr: .5 }}>
                    {disponibles.map((item) => (
                      <Box key={`${tipo}-${item.id}`} sx={{ p: 1.15, border: '1px solid #e2e8f0', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700}>{item.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {tipo === 'SERVICIO'
                              ? `${item.duracion_minutos || 0} min${item.categoria ? ` · ${item.categoria}` : ''}`
                              : item.codigo || item.descripcion || ''}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color={item.precio == null ? 'warning.main' : 'text.primary'}>
                            {item.precio == null ? 'Precio por configurar' : dinero(item.precio)}
                          </Typography>
                        </Box>
                        <Tooltip title={tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO' ? 'Se asigna desde Membresías' : 'Agregar'}>
                          <span>
                            <IconButton size="small" onClick={() => agregar(item)} disabled={item.precio == null}>
                              <AddShoppingCartOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    {disponibles.length === 0 ? <Typography variant="body2" color="text.secondary">No hay ítems disponibles para este filtro.</Typography> : null}
                  </Stack>
                </>
              ) : (
                <Stack spacing={1.1}>
                  <TextField label="Descripción" size="small" value={otro.descripcion} onChange={(e) => setOtro((a) => ({ ...a, descripcion: e.target.value }))} />
                  <TextField label="Precio unitario" type="number" size="small" value={otro.precio} onChange={(e) => setOtro((a) => ({ ...a, precio: e.target.value }))} />
                  <TextField label="Cantidad" type="number" size="small" value={otro.cantidad} onChange={(e) => setOtro((a) => ({ ...a, cantidad: e.target.value }))} />
                  <Button startIcon={<AddShoppingCartOutlinedIcon />} variant="outlined" onClick={agregarOtro}>Agregar al detalle</Button>
                </Stack>
              )}
            </Seccion>
          </Stack>

          <Stack spacing={2}>
            <Seccion titulo="2. Tipo de ítem">
              <ToggleButtonGroup
                value={tipo}
                exclusive
                onChange={(_, value) => value && setTipo(value)}
                fullWidth
                size="small"
                sx={{
                  flexWrap: 'wrap',
                  gap: .75,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: '1px solid #d9e2ef !important',
                    borderRadius: '8px !important',
                    px: 1.1,
                    flex: '1 1 110px',
                  },
                }}
              >
                {tipos.map((item) => (
                  <ToggleButton key={item.value} value={item.value}>
                    {item.icono}
                    <Typography variant="caption" sx={{ ml: .6, fontWeight: 700 }}>{item.label}</Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {tipo === 'MEMBRESIA' || tipo === 'PASE_DIARIO' ? (
                <Alert severity="info" sx={{ mt: 1.25, py: 0 }}>
                  La asignación contractual se realiza desde Membresías; aquí se muestran planes y precios de referencia.
                </Alert>
              ) : null}
            </Seccion>

            <Seccion titulo="3. Detalle de la venta">
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell width={90}>Cant.</TableCell>
                      <TableCell align="right">P. Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell width={45} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carrito.map((item) => (
                      <TableRow key={item.clave}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.descripcion}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.tipo}</Typography>
                        </TableCell>
                        <TableCell>
                          <TextField type="number" size="small" value={item.cantidad} onChange={(e) => cambiarCantidad(item.clave, e.target.value)} inputProps={{ min: 1, style: { padding: '6px 8px' } }} />
                        </TableCell>
                        <TableCell align="right">{dinero(item.precio_unitario)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{dinero(item.total_linea)}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => setCarrito((a) => a.filter((fila) => fila.clave !== item.clave))}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {carrito.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                          Agrega servicios, productos u otros conceptos para construir la venta.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </Seccion>

            <Seccion titulo="4. Observaciones">
              <TextField fullWidth multiline minRows={2} size="small" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones opcionales de la venta" />
            </Seccion>
          </Stack>

          <Stack spacing={2}>
            <Seccion titulo="Resumen">
              <ResumenFila label="Subtotal" valor={dinero(subtotal)} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center', mt: 1 }}>
                <Typography variant="body2">Descuento</Typography>
                <TextField size="small" type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} inputProps={{ min: 0 }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center', mt: 1 }}>
                <Typography variant="body2">Impuesto</Typography>
                <TextField size="small" type="number" value={impuesto} onChange={(e) => setImpuesto(e.target.value)} inputProps={{ min: 0 }} />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', border: '1px solid #dbe4ef', borderRadius: 1.5, p: 1.4 }}>
                <Typography variant="h6" fontWeight={800}>Total</Typography>
                <Typography variant="h5" fontWeight={800}>{dinero(total)}</Typography>
              </Box>
            </Seccion>

            <Seccion titulo="Cobro">
              <TextField select label="Método de pago" size="small" fullWidth value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                <MenuItem value="DEPOSITO">Depósito</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </TextField>

              {metodoPago !== 'EFECTIVO' ? (
                <TextField label="Referencia" size="small" fullWidth value={referencia} onChange={(e) => setReferencia(e.target.value)} sx={{ mt: 1.15 }} />
              ) : null}

              <Stack spacing={1} sx={{ mt: 1.4 }}>
                <Button variant="contained" disabled={guardando || carrito.length === 0 || !turno?.id} onClick={() => guardar(true)} sx={dbanuStyles.addButtonRevive} startIcon={<ReceiptLongOutlinedIcon />}>
                  Guardar y cobrar
                </Button>
                <Button variant="outlined" disabled={guardando || carrito.length === 0 || !turno?.id} onClick={() => guardar(false)}>
                  Guardar pendiente
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.15 }}>
                El cobro se asocia automáticamente a {turno?.caja_nombre || 'la caja'} y al turno actual.
              </Typography>
            </Seccion>
          </Stack>
        </Box>
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((a) => ({ ...a, mensaje: '' }))} />
    </Box>
  );
}

function Seccion({ titulo, children, sx = {} }) {
  return (
    <Box sx={{ p: 1.6, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fff', ...sx }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.2 }}>{titulo}</Typography>
      {children}
    </Box>
  );
}

function DatoOperacion({ label, valor, destacado = false }) {
  return (
    <Box sx={{ px: 1.4, py: .45, minWidth: 0, borderRight: { md: '1px solid #e2e8f0' } }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      {destacado ? (
        <Chip size="small" label={valor} color="warning" variant="outlined" sx={{ mt: .45, fontWeight: 700 }} />
      ) : (
        <Typography variant="body2" fontWeight={700} noWrap title={valor}>{valor}</Typography>
      )}
    </Box>
  );
}

function ResumenFila({ label, valor }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: .5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{valor}</Typography>
    </Box>
  );
}
