import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
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
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import {
  Alert,
  CircularProgress,
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
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';

const tipos = [
  { value: 'MEMBRESIA', label: 'Membresías', icono: <BadgeOutlinedIcon fontSize="small" /> },
  { value: 'PRODUCTO', label: 'Productos', icono: <Inventory2OutlinedIcon fontSize="small" /> },
];

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : '—');
const DORADO_REVIVE = uiTokens.colores.acento;
const METODOS_PAGO = [
  { codigo: 'EFECTIVO', etiqueta: 'Efectivo', Icono: PaymentsOutlinedIcon },
  { codigo: 'TRANSFERENCIA', etiqueta: 'Transferencia', Icono: AccountBalanceOutlinedIcon },
  { codigo: 'TARJETA', etiqueta: 'Tarjeta', Icono: CreditCardOutlinedIcon },
  { codigo: 'DEPOSITO', etiqueta: 'Depósito', Icono: ReceiptOutlinedIcon },
];
const DORADO_REVIVE_OSCURO = uiTokens.colores.acentoOscuro;
const NEGRO_REVIVE = uiTokens.colores.textoFuerte;
const DORADO_SUAVE = uiTokens.colores.acentoSuave;

const inicialesCliente = (nombre = '') => String(nombre)
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte.charAt(0).toLocaleUpperCase('es'))
  .join('') || 'CL';

const fotoCliente = (cliente) => {
  const valor = cliente?.foto_url || cliente?.foto_perfil_url || cliente?.avatar_url || null;
  return typeof valor === 'string' && /^https?:\/\//i.test(valor) ? valor : undefined;
};

const detalleCliente = (cliente) => [
  cliente?.identificacion || 'Sin identificación',
  cliente?.codigo || null,
  cliente?.telefono || null,
].filter(Boolean).join(' · ');

export function VentaPosFormulario({ onVolver, onGuardado, ventaInicial = null }) {
  const esCuentaAbierta = Boolean(ventaInicial?.id);
  const [contexto, setContexto] = useState({ turno: null, clientes: [], servicios: [], planes: [], membresias: [], productos: [] });
  const [cargando, setCargando] = useState(true);
  const [errorContexto, setErrorContexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState('MEMBRESIA');
  const [categoriaProducto, setCategoriaProducto] = useState('TODAS');
  const [cliente, setCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [beneficioPos, setBeneficioPos] = useState(null);
  const [cotizacionesCliente, setCotizacionesCliente] = useState({});
  const [cotizandoBeneficio, setCotizandoBeneficio] = useState(false);
  const [errorBeneficio, setErrorBeneficio] = useState('');
  const [impuesto, setImpuesto] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesAuto, setObservacionesAuto] = useState(true);
  const [pagos, setPagos] = useState([
    { clave: 'PAGO-1', metodo_pago: 'EFECTIVO', monto: '0.00', referencia: '', recibido: '0.00', montoManual: false, recibidoManual: false },
  ]);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const tiposVisibles = esCuentaAbierta ? [] : tipos;

  const categoriasProducto = useMemo(() => {
    const nombres = (contexto.productos || [])
      .map((item) => item.categoria)
      .filter(Boolean);
    return ['TODAS', ...Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [contexto.productos]);

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
          setObservacionesAuto(!ventaInicial.observaciones);
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
              membresia_id: contractual ? ventaInicial.membresia_id : null,
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

  // Al seleccionar al cliente, mostrar en el catálogo sus pases asignados
  // con el precio y descuento de la sede del turno ANTES de añadir al carrito.
  useEffect(() => {
    if (!cliente?.id || !contexto.turno?.id || esCuentaAbierta) {
      setCotizacionesCliente({});
      return undefined;
    }
    let activo = true;
    setCotizacionesCliente({});
    const asignadas = (contexto.membresias || []).filter((m) =>
      Number(m.cliente_id) === Number(cliente.id) && m.cobro_disponible !== false);
    Promise.all(asignadas.map(async (m) => {
      try {
        const res = await ventaServicio.cotizarBeneficioPos({
          cliente_id: cliente.id, plan_id: m.plan_id, membresia_id: m.id,
        });
        return [m.id, { datos: res.datos || res }];
      } catch (error) {
        const errores = error.response?.data?.errors;
        return [m.id, { error: (errores ? Object.values(errores).flat()[0] : null)
          || error.response?.data?.mensaje || 'No se pudo cotizar esta membresía.' }];
      }
    })).then((resultados) => {
      if (activo) setCotizacionesCliente(Object.fromEntries(resultados));
    });
    return () => { activo = false; };
  }, [cliente?.id, contexto.membresias, contexto.turno?.id, esCuentaAbierta]);

  const itemConBeneficio = useMemo(() => carrito.find((item) =>
    (item.tipo === 'PASE_DIARIO' || (item.tipo === 'MEMBRESIA' && item.membresia_id))
  ), [carrito]);

  const claveBeneficio = !esCuentaAbierta && itemConBeneficio && cliente
    ? `${cliente.id}:${itemConBeneficio.referencia_id}:${itemConBeneficio.membresia_id || ''}`
    : '';

  useEffect(() => {
    if (!claveBeneficio || (esCuentaAbierta && !itemConBeneficio?.membresia_id)) {
      setBeneficioPos(null);
      setErrorBeneficio('');
      setCotizandoBeneficio(false);
      if (!esCuentaAbierta) setDescuento(0);
      return undefined;
    }
    let activo = true;
    setCotizandoBeneficio(true);
    setBeneficioPos(null);
    setErrorBeneficio('');
    setDescuento(0);
    ventaServicio.cotizarBeneficioPos({
      cliente_id: cliente.id,
      plan_id: itemConBeneficio.referencia_id,
      ...(itemConBeneficio.membresia_id ? { membresia_id: itemConBeneficio.membresia_id } : {}),
    }).then((res) => {
      if (!activo) return;
      const cotizacion = res.datos || {};
      setBeneficioPos({ ...cotizacion, clave: claveBeneficio });
      setDescuento(Number(cotizacion.importe_descuento || 0));
      if (itemConBeneficio.tipo === 'PASE_DIARIO' || itemConBeneficio.tipo === 'MEMBRESIA') {
        setCarrito((actual) => actual.map((fila) =>
          fila.clave === itemConBeneficio.clave && Number(fila.precio_unitario) !== Number(cotizacion.precio_base)
            ? { ...fila, precio_unitario: Number(cotizacion.precio_base), total_linea: Number(cotizacion.precio_base) }
            : fila
        ));
      }
    }).catch((error) => {
      if (!activo) return;
      const errores = error.response?.data?.errors;
      setErrorBeneficio((errores ? Object.values(errores).flat()[0] : null)
        || error.response?.data?.mensaje || 'No se pudo validar la tarifa y el descuento.');
    }).finally(() => { if (activo) setCotizandoBeneficio(false); });
    return () => { activo = false; };
  }, [claveBeneficio, esCuentaAbierta]);

  const subtotal = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + Number(item.total_linea || 0), 0),
    [carrito],
  );
  const total = Math.max(0, subtotal - Number(descuento || 0) + Number(impuesto || 0));
  const pagadoPrevio = esCuentaAbierta
    ? Math.max(0, Number(ventaInicial?.total || 0) - Number(ventaInicial?.saldo_pendiente ?? ventaInicial?.total ?? 0))
    : 0;
  const saldoCobro = Math.max(0, total - pagadoPrevio);
  const totalPagos = pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const saldoDespuesPago = Math.max(0, saldoCobro - totalPagos);
  const excedentePagos = Math.max(0, totalPagos - saldoCobro);
  const totalItems = carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  // Observación sugerida con el detalle de la venta; el usuario puede editarla o borrarla.
  const metodosTexto = pagos.filter((p) => Number(p.monto || 0) > 0)
    .map((p) => `${String(p.metodo_pago).toLowerCase()} ${dinero(p.monto)}${p.referencia ? ` (ref. ${p.referencia})` : ''}`).join(', ');
  const observacionSugerida = carrito.length ? `${esCuentaAbierta ? `Cobro de la cuenta ${ventaInicial?.numero || ''}` : 'Venta'} a ${cliente?.nombre || 'consumidor final'}: ${carrito
    .map((item) => `${Number(item.cantidad || 1)} × ${item.descripcion} (${dinero(item.total_linea)})`).join('; ')}. Total ${dinero(total)}${Number(descuento || 0) > 0 ? `, descuento ${dinero(descuento)}` : ''}${metodosTexto ? `. Pago: ${metodosTexto}` : ''}.` : '';
  const observacionesVista = observacionesAuto ? observacionSugerida : observaciones;

  // La primera forma de pago propone el saldo completo. Al editar manualmente
  // el monto, se respeta el valor ingresado (pagos divididos).
  useEffect(() => {
    setPagos((actual) => {
      if (actual.length !== 1 || actual[0].montoManual) return actual;
      const sugerido = saldoCobro.toFixed(2);
      const recibido = actual[0].recibidoManual ? actual[0].recibido : sugerido;
      if (actual[0].monto === sugerido && actual[0].recibido === recibido) return actual;
      return [{ ...actual[0], monto: sugerido, recibido }];
    });
  }, [saldoCobro]);

  const actualizarPago = (clave, campo, valor) => {
    setPagos((actual) => actual.map((pago) => (
      pago.clave === clave
        ? { ...pago, [campo]: valor, ...(campo === 'monto' ? { montoManual: true } : {}),
            ...(campo === 'recibido' ? { recibidoManual: true } : {}),
            ...(campo === 'metodo_pago' ? { referencia: '', recibido: pago.monto, recibidoManual: false } : {}) }
        : pago
    )));
  };

  const agregarPago = () => {
    setPagos((actual) => [
      ...actual,
      {
        clave: `PAGO-${Date.now()}-${actual.length + 1}`,
        metodo_pago: 'EFECTIVO',
        monto: '',
        referencia: '',
        recibido: '',
        montoManual: true,
        recibidoManual: false,
      },
    ]);
  };

  const quitarPago = (clave) => {
    setPagos((actual) => actual.length > 1 ? actual.filter((pago) => pago.clave !== clave) : actual);
  };

  const disponibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    let items = [];

    if (esCuentaAbierta) {
      items = contexto.productos || [];
      if (categoriaProducto !== 'TODAS') {
        items = items.filter((item) => item.categoria === categoriaProducto);
      }
    } else {
      if (tipo === 'SERVICIO') items = contexto.servicios || [];
      if (tipo === 'PRODUCTO') items = contexto.productos || [];
      if (tipo === 'MEMBRESIA') {
        items = cliente
          ? (contexto.membresias || [])
            .filter((item) => Number(item.cliente_id) === Number(cliente.id))
            .map((item) => ({
              ...item,
              cobro_bloqueado: item.cobro_disponible === false,
              precio: cotizacionesCliente[item.id]?.datos?.precio_base ?? item.precio,
              precio_final: cotizacionesCliente[item.id]?.datos?.total,
              descuento_aplicado: cotizacionesCliente[item.id]?.datos?.importe_descuento,
              descuento_programado: cotizacionesCliente[item.id]?.datos?.beneficio_programado,
              beneficio_estado: cotizacionesCliente[item.id]?.datos?.beneficio_estado,
              error_cotizacion: cotizacionesCliente[item.id]?.error,
            }))
          : [];
      }
      if (tipo === 'PASE_DIARIO') items = (contexto.planes || []).filter((item) => item.tipo_producto === 'PASE_DIARIO');
    }

    if (!texto) return items;
    return items.filter((item) =>
      `${item.nombre || ''} ${item.codigo || ''} ${item.categoria || ''} ${item.descripcion || ''}`
        .toLowerCase()
        .includes(texto),
    );
  }, [tipo, contexto, busqueda, esCuentaAbierta, categoriaProducto, cliente, cotizacionesCliente]);

  const agregar = (item) => {
    const tipoActual = esCuentaAbierta ? 'PRODUCTO' : tipo;

    if (tipoActual === 'PASE_DIARIO') {
      if (!cliente) {
        avisar('Selecciona el deportista antes de agregar el Pase Diario.', 'warning');
        return;
      }
      if (item.requiere_entrenador) {
        avisar('El Pase Diario Dirigido necesita entrenador y horario. Asígnalo desde Membresías antes de cobrar.', 'warning');
        return;
      }
      if (carrito.length > 0) {
        avisar('Para crear el acceso de un día, vende el Pase Diario por separado.', 'warning');
        return;
      }
    }
    if (carrito.some((fila) => fila.tipo === 'PASE_DIARIO')) {
      avisar('El Pase Diario se vende individualmente. Finaliza este pase antes de añadir otro ítem.', 'warning');
      return;
    }

    if (tipoActual === 'MEMBRESIA' && item.cobro_disponible === false) {
      avisar(item.motivo_bloqueo
        || 'Esta membresía ya tiene una venta asociada. Consulta la cuenta abierta para continuar el cobro.', 'warning');
      return;
    }
    if (tipoActual === 'MEMBRESIA' && !cliente) {
      avisar('Selecciona primero al cliente para consultar sus membresías.', 'warning');
      return;
    }

    if (item.precio === null || item.precio === undefined || Number(item.precio) <= 0) {
      avisar('Este ítem aún no tiene un precio comercial configurado para la sede.', 'warning');
      return;
    }
    const clave = `${tipoActual}-${item.id}`;
    setCarrito((actual) => {
      const existe = actual.find((fila) => fila.clave === clave);
      if (existe) {
        if (tipoActual === 'MEMBRESIA' || tipoActual === 'PASE_DIARIO') {
          avisar('Esta membresía ya está agregada al carrito.', 'info');
          return actual;
        }
        return actual.map((fila) => {
          if (fila.clave !== clave) return fila;
          const cantidad = Number(fila.cantidad || 0) + 1;
          return { ...fila, cantidad, total_linea: cantidad * Number(fila.precio_unitario || 0) };
        });
      }
      return [...actual, {
        clave,
        tipo: tipoActual,
        referencia_id: tipoActual === 'MEMBRESIA' ? item.plan_id : item.id,
        membresia_id: tipoActual === 'MEMBRESIA' ? item.id : null,
        producto_id: tipoActual === 'PRODUCTO' ? item.id : null,
        descripcion: tipoActual === 'MEMBRESIA'
          ? `${item.nombre} · ${item.codigo || 'Membresía'}`
          : item.nombre,
        cantidad: 1,
        precio_unitario: Number(item.precio),
        total_linea: Number(item.precio),
        bloqueado: tipoActual === 'MEMBRESIA' || tipoActual === 'PASE_DIARIO',
      }];
    });
  };

  const cambiarCantidad = (clave, cantidad) => {
    const valor = Math.max(1, Number(cantidad || 1));
    setCarrito((actual) => actual.map((item) =>
      item.clave === clave
        ? (item.bloqueado
            ? item
            : { ...item, cantidad: valor, total_linea: valor * Number(item.precio_unitario || 0) })
        : item,
    ));
  };

  const ajustarCantidad = (clave, delta) => {
    setCarrito((actual) => actual.map((item) => {
      if (item.clave !== clave || item.bloqueado) return item;
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
    if (claveBeneficio && (cotizandoBeneficio || beneficioPos?.clave !== claveBeneficio || errorBeneficio)) {
      avisar(errorBeneficio || 'Se está verificando la tarifa y el beneficio. Intenta nuevamente.', 'warning');
      return;
    }
    if (cobrar) {
      if (totalPagos <= 0) {
        avisar('Registra al menos un pago mayor que cero.', 'warning');
        return;
      }
      if (excedentePagos > 0.00001) {
        avisar('La suma de los pagos no puede superar el saldo pendiente.', 'warning');
        return;
      }
      const efectivoInvalido = pagos.some((pago) => (
        pago.metodo_pago === 'EFECTIVO'
        && pago.recibido !== ''
        && Number(pago.recibido || 0) < Number(pago.monto || 0)
      ));
      if (efectivoInvalido) {
        avisar('En efectivo, el valor recibido no puede ser menor que el monto aplicado.', 'warning');
        return;
      }
    }
    setGuardando(true);
    try {
      const membresiaCarrito = carrito.find((item) => item.tipo === 'MEMBRESIA' && item.membresia_id);
      const payloadVenta = {
        cliente_id: cliente?.id || null,
        membresia_id: membresiaCarrito?.membresia_id || null,
        descuento: Number(descuento || 0),
        impuesto: Number(impuesto || 0),
        observaciones: observacionesVista || null,
        detalles: carrito.map(({ clave, bloqueado, ...item }) => item),
      };

      const payloadCobro = {
        ...payloadVenta,
        pagos: pagos
          .filter((pago) => Number(pago.monto || 0) > 0)
          .map(({ montoManual, recibidoManual, ...pago }) => {
            const monto = Number(pago.monto || 0);
            const recibidoEfectivo = pago.metodo_pago === 'EFECTIVO'
              ? (pago.recibido === '' ? monto : Number(pago.recibido))
              : null;
            const cambioEfectivo = pago.metodo_pago === 'EFECTIVO'
              ? Math.max(0, recibidoEfectivo - monto)
              : 0;

            return {
              metodo_pago: pago.metodo_pago,
              monto,
              efectivo_recibido: pago.metodo_pago === 'EFECTIVO' ? recibidoEfectivo : null,
              cambio_entregado: pago.metodo_pago === 'EFECTIVO' ? cambioEfectivo : null,
              referencia: pago.referencia || null,
              observaciones: pago.metodo_pago === 'EFECTIVO'
                ? `Cobro POS. Recibido ${dinero(recibidoEfectivo)}. Cambio ${dinero(cambioEfectivo)}.`
                : 'Cobro registrado desde POS.',
            };
          }),
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
        const saldoResultado = Number(venta.saldo_pendiente || 0);
        avisar(
          saldoResultado > 0
            ? `Pago registrado en ${venta.numero || 'la venta'}. Saldo pendiente ${dinero(saldoResultado)}.`
            : `${esCuentaAbierta ? 'Cuenta' : 'Venta'} ${venta.numero || ''} pagada correctamente${comprobante}.`,
          'success',
        );
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
  const otrasSedesCliente = (contexto.membresias_otras_sedes || []).filter((m) => Number(m.cliente_id) === Number(cliente?.id));

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
        {ventaInicial?.membresia_estado === 'CANCELADA' && ventaInicial?.membresia_tipo_producto === 'PASE_DIARIO' ? (
          <Alert severity="warning" sx={{ mb: 2 }}>Pase cancelado: este cobro salda la deuda, pero no habilita el acceso ni admite más consumos.</Alert>
        ) : null}
        {!cargando && !errorContexto && !turno?.id ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tienes un turno de caja abierto. Abre un turno antes de registrar ventas.
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.75fr) minmax(380px, .82fr)' }, gap: 2.2, alignItems: 'start' }}>
          <Stack spacing={2}>
            <SeccionPos titulo="Cliente" icono={<PersonOutlineOutlinedIcon />} descripcion="Selecciona un cliente o registra la venta como consumidor final.">
              {!cliente ? <Autocomplete
                options={contexto.clientes || []}
                value={cliente}
                onChange={(_, value) => {
                  setCliente(value);
                  setCarrito((actual) => actual.filter((item) => item.tipo !== 'MEMBRESIA'));
                  setTipo('MEMBRESIA');
                  setBusqueda('');

                  if (value) {
                    const tieneMembresiaPendiente = (contexto.membresias || [])
                      .some((item) => Number(item.cliente_id) === Number(value.id));

                    if (tieneMembresiaPendiente) {
                      setTipo('MEMBRESIA');
                      setBusqueda('');
                    }
                  }
                }}
                disabled={esCuentaAbierta}
                getOptionLabel={(item) => [
                  item.identificacion,
                  item.nombre,
                  item.codigo,
                  item.telefono,
                ].filter(Boolean).join(' · ')}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                noOptionsText="No se encontraron clientes"
                slotProps={{ listbox: { sx: { py: 0.75, maxHeight: 360 } }, paper: { sx: { mt: 0.7, border: '1px solid #e6dfcf', borderRadius: 2, boxShadow: '0 14px 32px rgba(16, 24, 40, .12)' } } }}
                renderOption={(props, item) => (
                  <Box
                    component="li"
                    {...props}
                    key={item.id}
                    sx={{
                      display: 'flex !important',
                      alignItems: 'center',
                      gap: 1.3,
                      mx: 0.75,
                      my: 0.3,
                      px: '10px !important',
                      py: '9px !important',
                      borderRadius: '10px',
                      transition: 'background-color .15s ease',
                      '&[aria-selected="true"]': { bgcolor: `${DORADO_SUAVE} !important` },
                      '&:hover': { bgcolor: '#f8f4eb !important' },
                    }}
                  >
                    <Avatar
                      src={fotoCliente(item)}
                      alt={item.nombre || 'Cliente'}
                      sx={{
                        width: 43, height: 43, flexShrink: 0,
                        bgcolor: '#f1e6c9', color: '#795a15',
                        border: '1px solid #e9d8aa', fontSize: 13, fontWeight: 850,
                      }}
                    >
                      {inicialesCliente(item.nombre)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 850, color: NEGRO_REVIVE, lineHeight: 1.35 }} noWrap>
                        {item.nombre || 'Cliente'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, fontSize: 11.5 }} noWrap>
                        {detalleCliente(item)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Buscar por cédula, nombre, código o teléfono" />}
              /> : null}
              {cliente ? (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.4, flexWrap: 'wrap',
                  px: 1.5, py: 1.1, bgcolor: '#fffdf8',
                  border: '1px solid #eadfca', borderRadius: 1,
                }}>
                  <Avatar
                    src={fotoCliente(cliente)}
                    alt={cliente.nombre || 'Cliente'}
                    sx={{
                      width: 50, height: 50, flexShrink: 0, bgcolor: '#f1e6c9',
                      color: '#795a15', fontWeight: 850, fontSize: 15,
                      border: '1px solid #e9d8aa',
                    }}
                  >
                    {inicialesCliente(cliente.nombre)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: NEGRO_REVIVE }} noWrap>
                      {cliente.nombre || 'Cliente'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }} noWrap>
                      {detalleCliente(cliente)}
                    </Typography>
                    {cliente.email ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {cliente.email}
                      </Typography>
                    ) : null}
                  </Box>
                  {!esCuentaAbierta && <Button size="small" variant="outlined" startIcon={<SwapHorizOutlinedIcon />}
                    onClick={() => { setCliente(null); setCarrito((actual) => actual.filter((item) => item.tipo !== 'MEMBRESIA')); setBusqueda(''); }}
                    sx={{ ...dbanuStyles.backButton, minHeight: 32, height: 32, flexShrink: 0 }}>Cambiar</Button>}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Sin cliente: la venta se registra como consumidor final.
                </Typography>
              )}
            </SeccionPos>

            <SeccionPos
              titulo={esCuentaAbierta ? `Productos · ${turno?.sede_nombre || 'sede actual'}` : `Catálogo · ${turno?.sede_nombre || 'sede actual'}`}
              icono={<AppsOutlinedIcon />}
              descripcion={esCuentaAbierta ? 'Productos disponibles del inventario de esta sede.' : 'Servicios, productos y opciones disponibles para esta sede.'}
            >
              {esCuentaAbierta ? (
                <ToggleButtonGroup
                  value={categoriaProducto}
                  exclusive
                  onChange={(_, value) => { if (value) { setCategoriaProducto(value); setBusqueda(''); } }}
                  size="small"
                  sx={{ mb: 1.4, display: 'flex', flexWrap: 'wrap', gap: .75, '& .MuiToggleButtonGroup-grouped': { minHeight: 38, border: '1px solid #e1e5ea !important', borderRadius: '9px !important', px: 1.5, py: .7, textTransform: 'none', fontWeight: 900, color: '#4b5563', bgcolor: '#f8fafc', '&:hover': { borderColor: `${DORADO_REVIVE} !important`, bgcolor: DORADO_SUAVE, color: DORADO_REVIVE_OSCURO }, '&.Mui-selected': { background: `linear-gradient(135deg, ${DORADO_REVIVE} 0%, ${DORADO_REVIVE_OSCURO} 100%)`, borderColor: `${DORADO_REVIVE} !important`, color: '#fff', '&:hover': { bgcolor: DORADO_REVIVE_OSCURO, color: '#fff' } } } }}
                >
                  {categoriasProducto.map((categoria) => (
                    <ToggleButton key={categoria} value={categoria}>
                      <Typography variant="caption" sx={{ fontWeight: 900 }}>
                        {categoria === 'TODAS' ? 'Todos' : categoria}
                      </Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              ) : (
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
              )}

              <>
                <TextField
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={esCuentaAbierta ? 'Buscar producto...' : `Buscar ${tiposVisibles.find((item) => item.value === tipo)?.label?.toLowerCase() || 'ítem'}...`}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" sx={{ color: DORADO_REVIVE }} /></InputAdornment> } }}
                />
                {!esCuentaAbierta && tipo === 'MEMBRESIA' ? (
                  <Alert severity="info" sx={{ mt: 1.15, py: .15 }}>
                    {cliente
                      ? `Membresías y pases del cliente habilitados en ${turno?.sede_nombre || 'esta sede'}.`
                      : 'Selecciona un cliente para ver sus membresías y pases.'}
                  </Alert>
                ) : null}
                {!esCuentaAbierta && tipo === 'MEMBRESIA' && cliente && otrasSedesCliente.length ? (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {otrasSedesCliente.map((m) => {
                      const fin = m.vigencia_fin ? String(m.vigencia_fin).slice(0, 10).split('-').reverse().join('/') : null;
                      const terminada = m.vigencia_fin && String(m.vigencia_fin).slice(0, 10) < hoyEcuador();
                      return (
                        <Typography key={m.id} variant="body2" sx={{ '& + &': { mt: .5 } }}>
                          <strong>{m.nombre}</strong> ({m.codigo}) está habilitado solo en {m.sedes || 'otra sede'}.
                          {` Para venderlo en ${turno?.sede_nombre || 'esta sede'}, agrega la sede en la membresía del cliente.`}
                          {terminada ? ` Además, su vigencia terminó el ${fin}: edítala en Acciones del contrato.` : ''}
                        </Typography>
                      );
                    })}
                  </Alert>
                ) : null}
                <Box sx={{ mt: 1.65, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 1.15, justifyContent: 'start', maxHeight: { lg: 'calc(100vh - 355px)', xs: 520 }, overflowY: 'auto', pr: .5 }}>
                  {disponibles.map((item) => <CatalogoCard key={`${esCuentaAbierta ? 'PRODUCTO' : tipo}-${item.id}`} item={item} tipo={esCuentaAbierta ? 'PRODUCTO' : tipo} onAgregar={() => agregar(item)} />)}
                </Box>
                {disponibles.length === 0 ? <Box sx={{ textAlign: 'center', py: 5 }}><Typography variant="body2" color="text.secondary">No hay ítems disponibles para este filtro.</Typography></Box> : null}
              </>
            </SeccionPos>
          </Stack>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
            <Box sx={{ border: '1px solid #e3e6ea', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 14px 30px rgba(23, 23, 23, .08)' }}>
              <Box sx={{ px: 1.7, py: 1.3, borderBottom: '1px solid #edf1f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: .8 }}>
                  <ReceiptLongOutlinedIcon sx={{ fontSize: 21, color: DORADO_REVIVE_OSCURO }} />
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: NEGRO_REVIVE }}>Cobro</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: .5, minWidth: 0 }}
                  title={`${turno?.sede_nombre || 'Sede pendiente'} · ${turno?.caja_nombre || 'Caja pendiente'} · Turno #${turno?.id || '—'} · ${turno?.cajero_nombre || 'Usuario actual'}`}>
                  <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />
                  <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {turno?.sede_nombre || 'Sede pendiente'} · {turno?.caja_nombre || 'Caja pendiente'} · Turno #{turno?.id || '—'}
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ p: 1.7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.15 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .7 }}><ShoppingCartOutlinedIcon sx={{ fontSize: 20, color: DORADO_REVIVE }} /><Typography variant="subtitle2" fontWeight={900} sx={{ color: NEGRO_REVIVE }}>Detalle</Typography></Box>
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
                            <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center' }}><Typography variant="body2" color="text.secondary">{claveBeneficio && Number(descuento) > 0 ? 'Descuento · beneficio vigente' : 'Descuento'}</Typography><TextField size="small" type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} disabled={Boolean(claveBeneficio)} helperText={claveBeneficio ? 'Automático' : ''} slotProps={{ htmlInput: { min: 0 } }} /></Box>
                  {cotizandoBeneficio && <Alert severity="info" sx={{ py: 0 }}>Validando precio y descuento del deportista...</Alert>}
                  {errorBeneficio && <Alert severity="warning" sx={{ py: 0 }}>{errorBeneficio}</Alert>}
                  {beneficioPos?.clave === claveBeneficio && beneficioPos?.beneficio_programado && (
                    <Alert severity="warning" sx={{ py: .4 }}>
                      El descuento de la membresía empieza el {String(beneficioPos.beneficio_programado.fecha_inicio).slice(0, 10).split('-').reverse().join('/')}.
                      No se aplica al cobro actual.
                    </Alert>
                  )}
                  {beneficioPos?.clave === claveBeneficio && claveBeneficio && (
                    <Typography variant="caption" color="success.main">
                      Tarifa original {dinero(beneficioPos.precio_base)} · Descuento autorizado {dinero(beneficioPos.importe_descuento)} · Total del pase {dinero(beneficioPos.total)}
                    </Typography>
                  )}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 1, alignItems: 'center' }}><Typography variant="body2" color="text.secondary">Impuesto</Typography><TextField size="small" type="number" value={impuesto} onChange={(e) => setImpuesto(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} /></Box>
                </Stack>

                <Box sx={{ mt: 1.3, pt: 1.25, borderTop: '1px solid #dfe4ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6" fontWeight={900} sx={{ color: NEGRO_REVIVE }}>Total</Typography><Typography variant="h4" fontWeight={900} sx={{ color: NEGRO_REVIVE }}>{dinero(total)}</Typography></Box>

                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e6e6e6' }}>
                  <Typography variant="subtitle2" sx={{ color: '#171717', fontWeight: 950, mb: 1.2 }}>
                    Método de pago
                  </Typography>
                  <Stack spacing={1.25}>
                    {pagos.map((pago, indice) => {
                      const monto = Number(pago.monto || 0);
                      const recibidoEfectivo = pago.recibido === '' ? monto : Number(pago.recibido || 0);
                      const cambioEfectivo = pago.metodo_pago === 'EFECTIVO'
                        ? Math.max(0, recibidoEfectivo - monto) : 0;
                      return (
                        <Box key={pago.clave} sx={{
                          border: pagos.length > 1 ? '1px solid #e4e4e4' : 'none',
                          borderRadius: 1.5, p: pagos.length > 1 ? 1.2 : 0,
                          bgcolor: '#fff',
                        }}>
                          {pagos.length > 1 && (
                            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#545454' }}>Pago {indice + 1}</Typography>
                              <IconButton size="small" title="Quitar este pago" onClick={() => quitarPago(pago.clave)}
                                sx={{ color: '#a32121' }}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton>
                            </Stack>
                          )}
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                            {METODOS_PAGO.map(({ codigo, etiqueta, Icono }) => {
                              const activo = pago.metodo_pago === codigo;
                              return (
                                <Button key={codigo} type="button" fullWidth
                                  aria-pressed={activo} variant={activo ? 'contained' : 'outlined'}
                                  startIcon={<Icono sx={{ fontSize: 19 }} />}
                                  onClick={() => actualizarPago(pago.clave, 'metodo_pago', codigo)}
                                  sx={{
                                    height: 42, px: 1, minWidth: 0, fontSize: 12.5,
                                    borderRadius: 0.5, fontWeight: 900, textTransform: 'none',
                                    bgcolor: activo ? DORADO_SUAVE : '#fff',
                                    color: activo ? DORADO_REVIVE_OSCURO : '#404040', border: '1px solid',
                                    borderColor: activo ? DORADO_REVIVE : '#d8d8d8',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: activo ? DORADO_SUAVE : '#fafafa', borderColor: activo ? DORADO_REVIVE : '#bdbdbd', boxShadow: 'none' },
                                  }}>{etiqueta}</Button>
                              );
                            })}
                          </Box>
                          <Box sx={{ mt: 1.4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.3, alignItems: 'start' }}>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#404040', display: 'block', mb: .7 }}>
                                Valor que se va a cobrar
                              </Typography>
                              <TextField size="small" type="number" fullWidth
                                value={pago.monto} onChange={(e) => actualizarPago(pago.clave, 'monto', e.target.value)}
                                slotProps={{ htmlInput: { min: 0, step: '0.01', 'aria-label': 'Valor que se va a cobrar' } }}
                                sx={{ ...dbanuStyles.field, '& .MuiOutlinedInput-root': { borderRadius: 1.4, bgcolor: '#fff' } }} />
                            </Box>
                            {pago.metodo_pago === 'EFECTIVO' ? (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#171717', display: 'block', mb: .7 }}>
                                  Efectivo recibido
                                </Typography>
                                <TextField size="small" type="number" fullWidth
                                  placeholder="Ej.: 5, 10, 20..."
                                  value={pago.recibido} onChange={(e) => actualizarPago(pago.clave, 'recibido', e.target.value)}
                                  slotProps={{ htmlInput: { min: 0, step: '0.01', 'aria-label': 'Efectivo recibido del cliente' } }}
                                  sx={{
                                    ...dbanuStyles.field,
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: 1.4, bgcolor: '#fffdf5',
                                      '& fieldset': { borderColor: '#D4A017', borderWidth: 2 },
                                      '&:hover fieldset': { borderColor: '#B78400' },
                                      '&.Mui-focused fieldset': { borderColor: '#B78400' },
                                    },
                                  }} />
                                <Stack direction="row" spacing={.6} useFlexGap sx={{ mt: .7, flexWrap: 'wrap' }}>
                                  {[['Exacto', monto], ['$5', 5], ['$10', 10], ['$20', 20]].map(([etiqueta, valor]) => (
                                    <Button key={etiqueta} size="small" variant="outlined"
                                      onClick={() => actualizarPago(pago.clave, 'recibido', Number(valor).toFixed(2))}
                                      sx={{ minWidth: 0, px: 1.1, height: 28, fontSize: 11.5, fontWeight: 800, textTransform: 'none', borderRadius: 0.5, color: '#404040', borderColor: '#d8d8d8' }}>
                                      {etiqueta}
                                    </Button>
                                  ))}
                                </Stack>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 850, color: '#404040', display: 'block', mb: .7 }}>
                                  {pago.metodo_pago === 'TARJETA' ? 'Referencia del voucher' : pago.metodo_pago === 'DEPOSITO' ? 'Número de depósito' : 'Referencia de transferencia'}
                                </Typography>
                                <TextField size="small" fullWidth
                                  placeholder="Número de comprobante"
                                  value={pago.referencia} onChange={(e) => actualizarPago(pago.clave, 'referencia', e.target.value)}
                                  sx={{ ...dbanuStyles.field, '& .MuiOutlinedInput-root': { borderRadius: 1.4 } }} />
                              </Box>
                            )}
                          </Box>
                          {pago.metodo_pago === 'EFECTIVO' && monto > 0 && (
                            <Box sx={{
                              mt: 1.2, px: 1.5, py: 1, border: '1px solid rgba(8, 127, 91, .35)',
                              bgcolor: 'rgba(8, 127, 91, .07)', borderRadius: 0.5,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap',
                            }}>
                              <Typography variant="body2" sx={{ color: uiTokens.colores.exito, fontWeight: 800 }}>
                                Cambio a entregar
                              </Typography>
                              <Typography variant="h6" sx={{ color: uiTokens.colores.exito, fontWeight: 900, lineHeight: 1.2 }}>
                                {dinero(cambioEfectivo)}
                              </Typography>
                              {recibidoEfectivo < monto && (
                                <Typography variant="caption" sx={{ width: '100%', color: '#A04418' }}>
                                  El efectivo recibido es menor que el importe del pago.
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                    <Button variant="text" startIcon={<AddOutlinedIcon />} onClick={agregarPago}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none', color: '#956b00', fontWeight: 850, px: .5 }}>
                      Dividir pago con otro método
                    </Button>
                    <Box sx={{ pt: 1.2, borderTop: '1px solid #ececec' }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: .6 }}>
                        <Typography variant="caption" color="text.secondary">Total a cobrar</Typography>
                        <Typography variant="body2" fontWeight={850}>{dinero(saldoCobro)}</Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: .6 }}>
                        <Typography variant="caption" color="text.secondary">Pagos ingresados</Typography>
                        <Typography variant="body2" fontWeight={850}>{dinero(totalPagos)}</Typography>
                      </Stack>
                      {saldoDespuesPago > 0 && (
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Saldo restante</Typography>
                          <Typography variant="body2" fontWeight={900} color="warning.main">{dinero(saldoDespuesPago)}</Typography>
                        </Stack>
                      )}
                    </Box>
                    {excedentePagos > 0 ? <Alert severity="warning">Los pagos superan el saldo por {dinero(excedentePagos)}.</Alert> : null}
                  </Stack>
                </Box>

                <TextField fullWidth multiline minRows={2} size="small" label="Observaciones" value={observacionesVista} onChange={(e) => { setObservaciones(e.target.value); setObservacionesAuto(false); }} sx={{ mt: 1.4 }} helperText="Se arma con el detalle de la venta; puedes editarla." />
                <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <BotonCancelar onClick={onVolver} disabled={guardando} />
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleOutlinedIcon />}
                    disabled={guardando || cotizandoBeneficio || Boolean(errorBeneficio) || (claveBeneficio && beneficioPos?.clave !== claveBeneficio) || carrito.length === 0 || !turno?.id}
                    onClick={() => guardar(false)}
                    sx={dbanuStyles.backButton}
                  >
                    {esCuentaAbierta ? 'Guardar cuenta' : 'Guardar pendiente'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={guardando ? <CircularProgress size={17} color="inherit" /> : <PointOfSaleOutlinedIcon />}
                    disabled={guardando || cotizandoBeneficio || Boolean(errorBeneficio) || (claveBeneficio && beneficioPos?.clave !== claveBeneficio) || carrito.length === 0 || !turno?.id || totalPagos <= 0 || excedentePagos > 0}
                    onClick={() => guardar(true)}
                    sx={dbanuStyles.saveButton}
                  >
                    {guardando ? 'Cobrando…' : `Cobrar ${dinero(totalPagos)}`}
                  </Button>
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
  const esMembresia = tipo === 'MEMBRESIA';
  const imagenProducto = !esMembresia && typeof item.imagen_url === 'string' ? item.imagen_url.trim() : '';
  const [imagenFallida, setImagenFallida] = useState(false);
  useEffect(() => { setImagenFallida(false); }, [imagenProducto]);
  const esPase = esMembresia && item.tipo_producto === 'PASE_DIARIO';
  const cuentaExistente = esMembresia && item.cobro_bloqueado;
  const precio = Number(item.precio || 0);
  const sinPrecio = !Number.isFinite(precio) || precio <= 0;
  const descuento = Number(item.descuento_aplicado || 0);
  const total = item.precio_final === undefined || item.precio_final === null
    ? null : Number(item.precio_final);
  const bloqueado = sinPrecio || cuentaExistente || Boolean(item.error_cotizacion);
  const Icono = esMembresia ? BadgeOutlinedIcon : Inventory2OutlinedIcon;

  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e1e2e5', borderTop: '3px solid #D4A017',
      borderRadius: 1.8, overflow: 'hidden', minWidth: 0, minHeight: esMembresia ? 248 : 0,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 3px 10px rgba(0,0,0,.04)',
      '&:hover': { borderColor: '#D4A017', boxShadow: '0 6px 15px rgba(0,0,0,.08)' },
    }}>
      {!esMembresia && (
        <Box sx={{
          height: 102, width: '100%', bgcolor: '#fafafa',
          borderBottom: '1px solid #eeeeee', display: 'grid', placeItems: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {imagenProducto && !imagenFallida ? (
            <Box component="img" src={imagenProducto} alt={item.nombre || 'Producto'}
              loading="lazy" onError={() => setImagenFallida(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', p: .75 }} />
          ) : (
            <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', bgcolor: '#fff4d7', borderRadius: 1.3 }}>
              <Inventory2OutlinedIcon sx={{ fontSize: 24, color: '#946a00' }} />
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.3, pt: esMembresia ? 1.4 : .95, pb: .35 }}>
        {esMembresia && (
          <Box sx={{
            width: 35, height: 35, flexShrink: 0, display: 'grid', placeItems: 'center',
            borderRadius: 1.2, bgcolor: '#fff4d7', color: '#946a00',
          }}>
            <Icono sx={{ fontSize: 19 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" title={item.nombre} sx={{
            fontSize: 13, fontWeight: 900, color: '#171717', lineHeight: 1.25,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: esMembresia ? 32 : 31,
          }}>{item.nombre}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 1.3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="caption" sx={{
          fontSize: 10.5, color: '#696969', lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.codigo || item.descripcion || (esMembresia ? 'Membresía' : 'Producto')}</Typography>
        {esPase && item.fecha_uso_pase && (
          <Typography variant="caption" sx={{ mt: .5, fontSize: 10.5, color: '#555', fontWeight: 700 }}>
            Uso: {String(item.fecha_uso_pase).slice(0, 10).split('-').reverse().join('/')}
          </Typography>
        )}
        {cuentaExistente ? (
          item.motivo_bloqueo ? (
            <Alert severity="warning" icon={false} sx={{ mt: 1, py: 0, px: .85, '& .MuiAlert-message': { fontSize: 10.5, lineHeight: 1.35, py: .6 } }}>
              {item.motivo_bloqueo}
            </Alert>
          ) : (
            <FacturaMembresia item={item} />
          )
        ) : item.error_cotizacion ? (
          <Typography variant="caption" sx={{ mt: 1, fontSize: 10.5, color: '#a13516', lineHeight: 1.3 }}>
            {item.error_cotizacion}
          </Typography>
        ) : esMembresia && total !== null && descuento > 0 ? (
          <Box sx={{ mt: 1, py: .65, px: .85, bgcolor: '#fff8e9', borderRadius: 1.1 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontSize: 10.5, color: '#575757' }}>Valor total</Typography>
              <Typography variant="caption" sx={{ fontSize: 10.5, color: '#171717', fontWeight: 850 }}>{dinero(precio)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontSize: 10.5, color: '#575757' }}>Descuento</Typography>
              <Typography variant="caption" sx={{ fontSize: 10.5, color: '#171717', fontWeight: 850 }}>− {dinero(descuento)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontSize: 10.5, color: '#575757' }}>Valor con descuento</Typography>
              <Typography variant="caption" sx={{ fontSize: 11.5, color: '#171717', fontWeight: 950 }}>{dinero(total)}</Typography>
            </Stack>
          </Box>
        ) : null}
        {esMembresia && !cuentaExistente && item.descuento_programado && (
          <Typography variant="caption" sx={{ mt: .4, color: '#845e00', fontSize: 10 }}>
            Descuento programado para otra fecha.
          </Typography>
        )}
        <Box sx={{ mt: esMembresia ? 'auto' : .7, pt: esMembresia ? 1.2 : .35, pb: esMembresia ? .8 : .55, textAlign: esMembresia ? 'left' : 'right' }}>
          {sinPrecio ? (
            <Typography variant="caption" sx={{ color: '#996515', fontWeight: 800 }}>Precio pendiente</Typography>
          ) : (
            <Typography variant="h6" sx={{ color: '#171717', fontWeight: 950, fontSize: 19, lineHeight: 1.2 }}>
              {dinero(esMembresia && total !== null && descuento > 0 ? total : precio)}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ px: 1.3, pb: esMembresia ? 1.3 : .9 }}>
        <Tooltip title={cuentaExistente ? (item.motivo_bloqueo || (item.venta_estado === 'PAGADA'
          ? `El período actual ya está pagado${item.proxima_cuota ? `; la próxima cuota se emite el ${fechaCorta(item.proxima_cuota.fecha_programada_emision)}` : ''}.`
          : `La cuota ${item.venta_numero || ''} está pendiente: cóbrala desde Cuentas abiertas.`)) : sinPrecio ? 'Configura el precio para la sede.' : item.error_cotizacion || 'Agregar al carrito'}>
          <span style={{ display: 'block' }}>
            <Button fullWidth size="small" variant="contained"
              startIcon={<AddShoppingCartOutlinedIcon sx={{ fontSize: 17 }} />}
              onClick={onAgregar} disabled={bloqueado}
              sx={{
                minHeight: 34, borderRadius: 1.15, textTransform: 'none', fontWeight: 850,
                fontSize: 12, bgcolor: '#D4A017', color: '#171717', boxShadow: 'none',
                '&:hover': { bgcolor: '#BD8E0F', boxShadow: 'none' },
                '&.Mui-disabled': { bgcolor: '#eeeeee', color: '#858585' },
              }}>
              {cuentaExistente ? (esPase ? 'No disponible' : (item.venta_estado === 'PAGADA' ? 'Período pagado' : 'Cobrar en Cuentas abiertas')) : 'Agregar'}
            </Button>
          </span>
        </Tooltip>
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

const fechaCorta = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');

/** Explica en la tarjeta qué período se facturó, en qué venta, cuándo y qué cuota sigue. */
function FacturaMembresia({ item }) {
  const pagada = item.venta_estado === 'PAGADA';
  return (
    <Box sx={{ mt: 1, py: .7, px: .85, bgcolor: pagada ? '#edf7f0' : '#fff8e9', borderRadius: 1.1, display: 'grid', gap: .25 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: .5 }}>
        <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 900, color: '#262626' }}>
          {item.periodo_numero ? `Período ${item.periodo_numero}` : 'Período actual'}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 900, color: pagada ? '#1b6b3a' : '#8a5a00' }}>
          {pagada ? 'Pagado' : 'Pendiente de cobro'}
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ fontSize: 10.5, color: '#555' }}>
        {fechaCorta(item.periodo_inicio)} al {fechaCorta(item.periodo_fin)}
      </Typography>
      {item.venta_numero && (
        <>
          <Typography variant="caption" title={item.venta_numero} sx={{ fontSize: 10, color: '#696969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.venta_numero}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 10, color: '#696969' }}>
            Facturada el {fechaCorta(item.venta_fecha)}
          </Typography>
        </>
      )}
      <Typography variant="caption" sx={{ fontSize: 10, color: '#555', fontWeight: 700 }}>
        {item.proxima_cuota
          ? `Próxima cuota: ${fechaCorta(item.proxima_cuota.fecha_programada_emision)}`
          : `Contrato hasta el ${fechaCorta(item.fecha_fin)}`}
      </Typography>
    </Box>
  );
}
