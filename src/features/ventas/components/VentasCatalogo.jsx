import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Box, Button, CircularProgress, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { ventaServicio } from '../services/ventaServicio.js';
import { CampoActivo } from '../../../components/common/CampoActivo.jsx';
import { ModalConfirmacion } from '../../../components/common/ModalConfirmacion.jsx';
import { VisorPdf } from '../../../components/common/VisorPdf.jsx';

const tiposVenta = ['PRODUCTO', 'MEMBRESIA', 'SERVICIO', 'OTRO'];
const metodosPago = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'DEPOSITO', 'OTRO'];
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const opcionesEstados = (valores = []) => valores.map((item) => ({ value: String(item.valor_interno), label: String(item.nombre || item.valor_interno) }));
const dinero = (valor) => `${Number(valor || 0).toFixed(2)}`;
const hoyEcuador = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : 'Sin fecha';
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');
// estadoTexto solo elige el color del chip; el texto visible es el nombre del catálogo de estados.
const estadoTexto = (valor) => String(valor || '').toLowerCase().replace('pagada', 'activo').replace('confirmado', 'activo').replace('emitido', 'activo');
const nombreEstado = (catalogo = [], valor) => catalogo.find((item) => String(item.valor_interno).toUpperCase() === String(valor || '').toUpperCase())?.nombre;
const textoComprobante = { BORRADOR: 'Borrador', EMITIDO: 'Emitido', ANULADO: 'Anulado' };

const descripcionCajaGeneral = (sedeNombre) => sedeNombre
  ? `Caja operativa para la gestión de cobros y ventas de la sede ${sedeNombre}.`
  : '';

const codigoCajaVista = (formData, catalogos) => {
  if (formData.codigo) return formData.codigo;
  const sede = (catalogos.sedes || []).find((item) => String(item.id) === String(formData.sede_id));
  if (!sede?.nombre) return 'Se generará al guardar';

  const sedeCodigo = String(sede.nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^REVIVE[\s_-]+/, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `CAJA-${sedeCodigo || 'SEDE'}-###`;
};

const configs = {
  cajas: {
    titulo: 'Cajas', singular: 'Caja', descripcion: 'Administra puntos de cobro permanentes por sede.', icono: <PointOfSaleOutlinedIcon />,
    obtener: 'obtenerCajas', crear: 'crearCaja', actualizar: 'actualizarCaja',
    inicial: { id: null, sede_id: '', codigo: '', nombre: '', descripcion: '', activa: true },
  },
  ventas: {
    titulo: 'Ventas', singular: 'Venta', descripcion: 'Registra ventas de productos, servicios y membresías.', icono: <ShoppingCartOutlinedIcon />,
    obtener: 'obtenerVentas', crear: 'crearVenta', actualizar: 'actualizarVenta',
    inicial: { id: null, cliente_id: '', membresia_id: '', caja_id: '', tipo_venta: 'PRODUCTO', concepto: '', subtotal: 0, descuento: 0, impuesto: 0, total: 0, estado: 'PENDIENTE', observaciones: '', detalle: { producto_id: '', cantidad: 1, precio_unitario: 0 } },
  },
  pagos: {
    titulo: 'Cobros', singular: 'Cobro', descripcion: 'Pagos recibidos y registrados en caja, por fecha y método de pago.', icono: <PaymentsOutlinedIcon />,
    obtener: 'obtenerPagos', crear: null, actualizar: null,
    inicial: {},
  },
  comprobantes: {
    titulo: 'Comprobantes', singular: 'Comprobante', descripcion: 'Consulta recibos generados por ventas y pagos.', icono: <ReceiptLongOutlinedIcon />,
    obtener: 'obtenerComprobantes', crear: null, actualizar: null, inicial: {},
  },
};

export function VentasCatalogo({ tipo }) {
  const config = configs[tipo];
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({});
  const [formData, setFormData] = useState(config.inicial);
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5, ...(tipo === 'pagos' ? { fecha_pago: hoyEcuador() } : {}) });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [reenviandoId, setReenviandoId] = useState(null);
  const [ventaAnular, setVentaAnular] = useState(null);
  const [comprobantePdf, setComprobantePdf] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [motivoAnular, setMotivoAnular] = useState('');
  const [anulando, setAnulando] = useState(false);

  const showNotificacion = (mensaje, tipoAviso = 'info') => setNotificacion({ mensaje, tipo: tipoAviso });
  // Corrección del método de un cobro (solo administradores).
  const [correccion, setCorreccion] = useState(null);
  const [guardandoCorreccion, setGuardandoCorreccion] = useState(false);
  const metodoActual = (item) => ['efectivo', 'transferencia', 'tarjeta', 'deposito', 'otros']
    .find((m) => Number(item[m] || 0) > 0)?.toUpperCase().replace('OTROS', 'OTRO') || 'EFECTIVO';
  const abrirCorreccion = (item) => setCorreccion({ item, metodo_pago: metodoActual(item) === 'EFECTIVO' ? 'TRANSFERENCIA' : 'EFECTIVO', referencia: '', motivo: '', motivo_auto: true });
  // Motivo sugerido con los datos del cobro; se actualiza hasta que el usuario lo edita.
  const textoCorreccion = (c) => {
    const actual = metodoActual(c.item).toLowerCase();
    const nuevo = c.metodo_pago.toLowerCase();
    const ref = c.referencia.trim() ? ` con comprobante/referencia ${c.referencia.trim()}` : '';
    return actual === nuevo
      ? `Se completa la referencia del cobro ${c.item.codigo_cobro || ''} de ${c.item.cliente_nombre || 'cliente'} por $${dinero(c.item.total_cobrado)}, pagado por ${nuevo}${ref}.`
      : `Corrección del método de pago del cobro ${c.item.codigo_cobro || ''} de ${c.item.cliente_nombre || 'cliente'} por $${dinero(c.item.total_cobrado)}: se registró como ${actual} por error, el pago real fue por ${nuevo}${ref}.`;
  };
  const motivoCorreccion = correccion ? (correccion.motivo_auto ? textoCorreccion(correccion) : correccion.motivo) : '';
  const motivoVentaAnular = (v) => `Anulación de la venta ${v.venta_numero || ''} de ${v.cliente_nombre || 'consumidor final'} por $${dinero(v.venta_total)}: el dinero se devuelve desde el turno de caja por el mismo método de pago, los productos regresan al stock y el comprobante queda anulado.`;
  const guardarCorreccion = async () => {
    setGuardandoCorreccion(true);
    try {
      await ventaServicio.corregirMetodoPago(correccion.item.id, {
        metodo_pago: correccion.metodo_pago, referencia: correccion.referencia.trim() || null, motivo: motivoCorreccion.trim(),
      });
      showNotificacion('Método de pago corregido. Si el turno ya estaba cerrado, quedó pendiente de conciliar.', 'success');
      setCorreccion(null);
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      showNotificacion((errores && Object.values(errores).flat()[0]) || error.response?.data?.mensaje || 'No se pudo corregir el cobro.', 'error');
    } finally {
      setGuardandoCorreccion(false);
    }
  };

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await ventaServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch (error) {
      const errores = error.response?.data?.errors;
      const detalle = errores ? Object.values(errores).flat()[0] : null;
      const mensaje = detalle || error.response?.data?.mensaje || error.response?.data?.message;
      showNotificacion(mensaje || `Error al cargar ${config.titulo.toLowerCase()}. Revisa el servidor.`, 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setVista('lista');
    setFormData(config.inicial);
    setFiltros({ busqueda: '', page: 1, per_page: 5, ...(tipo === 'pagos' ? { fecha_pago: hoyEcuador() } : {}) });
    setFiltrosColumna({});
  }, [tipo]);

  useEffect(() => { cargar(); }, [tipo]);

  const buscar = (parametros) => { const nuevos = { ...parametros, page: 1 }; setFiltros(nuevos); cargar(nuevos); };
  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna); setFiltros(nuevosFiltros); cargar(nuevosFiltros);
  };

  const handleNuevo = () => { setFormData(config.inicial); setVista('formulario'); };
  const handleEditar = (item) => { setFormData({ ...config.inicial, ...item, activa: item.activa !== false }); setVista('formulario'); };
  const handleChange = (evento) => {
    const { name, value, checked, type: inputType } = evento.target;
    if (name.startsWith('detalle.')) {
      const key = name.replace('detalle.', '');
      setFormData((actual) => ({ ...actual, detalle: { ...(actual.detalle || {}), [key]: value } }));
      return;
    }

    if (tipo === 'cajas' && name === 'sede_id') {
      setFormData((actual) => {
        const sedeAnterior = (catalogos.sedes || []).find((item) => String(item.id) === String(actual.sede_id));
        const sedeNueva = (catalogos.sedes || []).find((item) => String(item.id) === String(value));
        const descripcionAnteriorAuto = descripcionCajaGeneral(sedeAnterior?.nombre);
        const puedeAutocompletar = !String(actual.descripcion || '').trim() || actual.descripcion === descripcionAnteriorAuto;

        return {
          ...actual,
          sede_id: value,
          descripcion: puedeAutocompletar ? descripcionCajaGeneral(sedeNueva?.nombre) : actual.descripcion,
        };
      });
      return;
    }

    setFormData((actual) => ({ ...actual, [name]: inputType === 'checkbox' ? checked : value }));
  };

  // El comprobante se abre en el visor de la página (iframe), con descarga e impresión.
  const handleVerPdf = async (item) => {
    setComprobantePdf(null);
    setCargandoPdf(true);
    try {
      const blob = await ventaServicio.obtenerComprobantePdf(item.venta_id);
      setComprobantePdf({ blob, url: URL.createObjectURL(blob), nombre: `${item.numero || item.venta_numero || 'comprobante'}.pdf` });
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo abrir el comprobante PDF', 'error');
    } finally {
      setCargandoPdf(false);
    }
  };

  const cerrarPdf = () => {
    if (comprobantePdf?.url) URL.revokeObjectURL(comprobantePdf.url);
    setComprobantePdf(null);
  };

  const handleReenviarComprobante = async (item) => {
    if (reenviandoId) return;

    setReenviandoId(item.id);
    try {
      const response = await ventaServicio.reenviarComprobante(item.id);
      showNotificacion(
        response.datos?.correo_destino
          ? `Comprobante reenviado a ${response.datos.correo_destino}`
          : 'Comprobante reenviado correctamente',
        'success',
      );
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      showNotificacion(primero || error.response?.data?.mensaje || 'No se pudo reenviar el comprobante', 'error');
    } finally {
      setReenviandoId(null);
    }
  };

  const anularVentaPagada = async () => {
    setAnulando(true);
    try {
      const response = await ventaServicio.anularVentaPagada(ventaAnular.venta_id, motivoAnular.trim());
      const devolucion = response.datos?.devolucion || {};
      const devuelto = (devolucion.pagos || []).map((p) => `${String(p.metodo_pago).toLowerCase()} $${dinero(p.monto)}`).join(', ');
      showNotificacion(
        `Venta ${ventaAnular.venta_numero} anulada.${devuelto ? ` Devolución: ${devuelto}.` : ''}${devolucion.inventario_revertido ? ' El inventario regresó al stock.' : ''}`,
        'success',
      );
      setVentaAnular(null);
      setMotivoAnular('');
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      showNotificacion(primero || error.response?.data?.mensaje || 'No se pudo anular la venta.', 'error');
    } finally {
      setAnulando(false);
    }
  };

  const handleGuardar = async () => {
    try {
      const payload = normalizar(tipo, formData);
      if (!payload) { showNotificacion('Complete los campos obligatorios', 'warning'); return; }
      if (formData.id && config.actualizar) {
        await ventaServicio[config.actualizar](formData.id, payload);
        showNotificacion(`${config.singular} actualizada correctamente`, 'success');
      } else {
        await ventaServicio[config.crear](payload);
        showNotificacion(`${config.singular} registrada correctamente`, 'success');
      }
      setVista('lista'); cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || `Error al guardar ${config.singular.toLowerCase()}`, 'error');
    }
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna, catalogos, abrirCorreccion), [tipo, meta, filtrosColumna, catalogos]);

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={`${formData.id ? 'Editar' : 'Nueva'} ${config.singular}`} descripcion={config.descripcion} icono={config.icono} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#f6f8fc', px: 2.5, py: 2.5 }}><Box sx={formStyles.seccion}><Typography sx={formStyles.modalSeccionTitulo}>Datos de {config.singular.toLowerCase()}</Typography><Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} /></Box></Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={config.crear ? <Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button> : null} />
        {tipo === 'pagos' && (
          <Box sx={{ px: { xs: 1.5, md: 2 }, pb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" label="Fecha del cobro" type="date"
              value={filtros.fecha_pago || ''}
              onChange={(e) => buscar({ ...filtros, fecha_pago: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 190 } }} />
            <Button size="small" variant={filtros.fecha_pago === hoyEcuador() ? 'contained' : 'outlined'}
              onClick={() => buscar({ ...filtros, fecha_pago: hoyEcuador() })}>Hoy</Button>
            <Button size="small" variant={!filtros.fecha_pago ? 'contained' : 'outlined'}
              onClick={() => buscar({ ...filtros, fecha_pago: '' })}>Todos</Button>
          </Box>
        )}
        <TablaVentas
          tipo={tipo}
          items={items}
          columnas={columnas}
          meta={meta}
          cargando={cargando}
          editable={Boolean(config.actualizar)}
          onEditar={handleEditar}
          onVerPdf={handleVerPdf}
          onReenviar={handleReenviarComprobante}
          reenviandoId={reenviandoId}
          puedeAnular={Boolean(catalogos.puede_anular_pagadas)}
          onAnular={(item) => { setVentaAnular(item); setMotivoAnular(motivoVentaAnular(item)); }}
          onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }}
          onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }}
        />
      </Paper>
      <VisorPdf titulo="Comprobante de venta" pdf={comprobantePdf} cargando={cargandoPdf} onCerrar={cerrarPdf} />
      <ModalConfirmacion
        open={Boolean(correccion)}
        titulo="Corregir método de pago"
        descripcion={correccion ? `${correccion.item.codigo_cobro} · ${correccion.item.cliente_nombre || 'Cliente'} · ${dinero(correccion.item.total_cobrado)}. Registrado como ${metodoActual(correccion.item).toLowerCase()}. El monto no cambia; queda en el historial con el motivo.` : ''}
        textoConfirmar="Sí, corregir"
        cargando={guardandoCorreccion}
        confirmarDeshabilitado={!correccion || motivoCorreccion.trim().length < 8 || correccion.metodo_pago === metodoActual(correccion.item) && !correccion.referencia.trim()}
        onClose={() => !guardandoCorreccion && setCorreccion(null)}
        onConfirmar={guardarCorreccion}
      >
        {correccion && <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField select size="small" label="Método correcto" value={correccion.metodo_pago}
            onChange={(e) => setCorreccion((c) => ({ ...c, metodo_pago: e.target.value }))}>
            {[['EFECTIVO', 'Efectivo'], ['TRANSFERENCIA', 'Transferencia'], ['TARJETA', 'Tarjeta'], ['DEPOSITO', 'Depósito'], ['OTRO', 'Otro']]
              .map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField>
          {correccion.metodo_pago !== 'EFECTIVO' && <TextField size="small" label="N.º de comprobante / referencia" value={correccion.referencia}
            onChange={(e) => setCorreccion((c) => ({ ...c, referencia: e.target.value }))} placeholder="Ej. 602185233" />}
          <TextField multiline minRows={2} size="small" required label="Motivo u observación" value={motivoCorreccion}
            onChange={(e) => setCorreccion((c) => ({ ...c, motivo: e.target.value, motivo_auto: false }))}
            helperText="Escribe al menos 8 caracteres. Ej. Se registró en efectivo pero fue transferencia." />
        </Stack>}
      </ModalConfirmacion>
      <ModalConfirmacion
        open={Boolean(ventaAnular)}
        titulo="Anular venta cobrada"
        descripcion={`${ventaAnular?.venta_numero || ''} · ${ventaAnular?.cliente_nombre || 'Consumidor final'} · $${dinero(ventaAnular?.venta_total)}. El dinero se devuelve desde tu turno de caja por el mismo método de pago, los productos regresan al stock y a sus lotes, y el comprobante queda anulado. No se puede deshacer.`}
        textoConfirmar="Sí, anular y devolver"

        cargando={anulando}
        confirmarDeshabilitado={motivoAnular.trim().length < 8}
        onClose={() => !anulando && setVentaAnular(null)}
        onConfirmar={anularVentaPagada}
      >
        <TextField autoFocus fullWidth multiline minRows={2} size="small" required label="Motivo"
          helperText="Escribe al menos 8 caracteres." value={motivoAnular}
          onChange={(e) => setMotivoAnular(e.target.value)} sx={{ mt: 1 }} />
      </ModalConfirmacion>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function Formulario({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };
  if (tipo === 'cajas') {
    return <Box sx={grid}>
      <TextField
        label="Código generado"
        value={codigoCajaVista(formData, catalogos)}
        size="small"
        helperText="Se genera automáticamente según la sede y el consecutivo disponible."
        slotProps={{ input: { readOnly: true } }}
      />
      <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
      <TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} required size="small">
        <MenuItem value="">Seleccione una sede</MenuItem>
        {(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
      </TextField>
      <TextField
        label="Descripción"
        name="descripcion"
        value={formData.descripcion || ''}
        onChange={onChange}
        size="small"
        multiline
        minRows={2}
        helperText="Se propone automáticamente una descripción general al seleccionar la sede; puedes ajustarla."
        sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }}
      />
      <CampoActivo name="activa" checked={formData.activa} onChange={onChange} label="Activa" />
    </Box>;
  }

  if (tipo === 'ventas') {
    const estados = catalogos.estados_venta || [];
    return <Box sx={grid}>
      <TextField select label="Cliente" name="cliente_id" value={formData.cliente_id || ''} onChange={onChange} size="small"><MenuItem value="">Consumidor final</MenuItem>{(catalogos.clientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre || 'Cliente'} - {item.codigo_deportista}</MenuItem>)}</TextField>
      <TextField select label="Caja" name="caja_id" value={formData.caja_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin caja</MenuItem>{(catalogos.cajas || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
      <TextField select label="Tipo" name="tipo_venta" value={formData.tipo_venta || 'PRODUCTO'} onChange={onChange} required size="small">{tiposVenta.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField label="Concepto" name="concepto" value={formData.concepto || ''} onChange={onChange} required size="small" sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} />
      <TextField select label="Producto" name="detalle.producto_id" value={formData.detalle?.producto_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin producto</MenuItem>{(catalogos.productos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.codigo} - {item.nombre} ({dinero(item.precio_venta)})</MenuItem>)}</TextField>
      <TextField label="Subtotal" name="subtotal" type="number" value={formData.subtotal || 0} onChange={onChange} size="small" />
      <TextField label="Descuento" name="descuento" type="number" value={formData.descuento || 0} onChange={onChange} size="small" />
      <TextField label="Impuesto" name="impuesto" type="number" value={formData.impuesto || 0} onChange={onChange} size="small" />
      <TextField label="Total" name="total" type="number" value={formData.total || 0} onChange={onChange} required size="small" />
      <TextField select label="Estado" name="estado" value={formData.estado || 'PENDIENTE'} onChange={onChange} required size="small">{estados.map((item) => <MenuItem key={item.id} value={item.valor_interno}>{item.nombre}</MenuItem>)}</TextField>
      <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
    </Box>;
  }

  const estados = catalogos.estados_pago || [];
  return <Box sx={grid}>
    <TextField select label="Venta" name="venta_id" value={formData.venta_id || ''} onChange={onChange} required size="small" sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }}>{(catalogos.ventas_pendientes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.numero} - {item.concepto} ({dinero(item.total)})</MenuItem>)}</TextField>
    <TextField select label="Caja" name="caja_id" value={formData.caja_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin caja</MenuItem>{(catalogos.cajas || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
    <TextField select label="Método" name="metodo_pago" value={formData.metodo_pago || 'EFECTIVO'} onChange={onChange} required size="small">{metodosPago.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
    <TextField label="Monto" name="monto" type="number" value={formData.monto || ''} onChange={onChange} required size="small" />
    <TextField select label="Estado" name="estado" value={formData.estado || 'CONFIRMADO'} onChange={onChange} required size="small">{estados.map((item) => <MenuItem key={item.id} value={item.valor_interno}>{item.nombre}</MenuItem>)}</TextField>
    <TextField label="Referencia" name="referencia" value={formData.referencia || ''} onChange={onChange} size="small" />
    <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
  </Box>;
}

function TablaVentas({ tipo, items, columnas, meta, cargando, editable, onEditar, onVerPdf, onReenviar, reenviandoId, puedeAnular, onAnular, onPageChange, onRowsPerPageChange }) {
  const tieneAcciones = editable || tipo === 'comprobantes';

  return <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
    <TableHead><TableRow>{columnas.map((columna) => columna.header)}{tieneAcciones ? <TableCell align="right">Acciones</TableCell> : null}</TableRow></TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id} hover>
          {columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}
          {tieneAcciones ? (
            <TableCell align="right">
              {editable ? <Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip> : null}
              {tipo === 'comprobantes' ? (
                <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                  <Tooltip title="Ver comprobante (PDF)">
                    <IconButton aria-label="Ver comprobante" sx={{ ...dbanuStyles.actionView, mr: 0 }} onClick={() => onVerPdf(item)}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={String(item.estado || '').toUpperCase() === 'EMITIDO' ? 'Reenviar comprobante' : 'Disponible al emitir el comprobante'}>
                    <span>
                      <IconButton
                        aria-label="Reenviar comprobante"
                        sx={{ ...dbanuStyles.actionEdit, mr: 0 }}
                        disabled={
                          String(item.estado || '').toUpperCase() !== 'EMITIDO'
                          || reenviandoId === item.id
                        }
                        onClick={() => onReenviar(item)}
                      >
                        {reenviandoId === item.id
                          ? <CircularProgress size={16} thickness={5} />
                          : <SendOutlinedIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  {puedeAnular && item.anulable ? (
                    <Tooltip title="Anular venta cobrada">
                      <IconButton aria-label="Anular venta cobrada" sx={dbanuStyles.actionDelete} onClick={() => onAnular(item)}>
                        <BlockOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              ) : null}
            </TableCell>
          ) : null}
        </TableRow>
      ))}
      {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + (tieneAcciones ? 1 : 0)} cargando={cargando} texto="No hay registros para los filtros aplicados." /> : null}
    </TableBody>
  </TablaGestion>;
}

function columnasPorTipo(tipo, meta, filtros, onFiltro, catalogos, onCorregir) {
  const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtros[key]} onChange={(v) => onFiltro(key, v)} options={opts}>{label}</FilterHeaderCell>;
  if (tipo === 'cajas') return [
    { key: 'codigo', header: <TableCell key="codigo">Código</TableCell>, render: (item) => <Typography variant="body2" fontWeight="600">{item.codigo}</Typography> },
    { key: 'nombre', header: filtro('nombre', 'Caja', opciones(meta.opciones_filtro?.caja)), render: (item) => item.nombre },
    { key: 'sede', header: <TableCell key="sede">Sede</TableCell>, render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'descripcion', header: <TableCell key="descripcion">Descripción</TableCell>, render: (item) => item.descripcion || 'Sin descripción' },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activa' }, { value: 'false', label: 'Inactiva' }]), render: (item) => <StatusChip estado={estadoBool(item.activa)} /> },
  ];
  if (tipo === 'ventas') return [
    { key: 'numero', header: filtro('numero', 'Venta', opciones(meta.opciones_filtro?.numero)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.numero}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.fecha_venta)}</Typography></Box> },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => item.cliente_nombre || 'Consumidor final' },
    { key: 'concepto', header: <TableCell key="concepto">Concepto</TableCell>, render: (item) => item.concepto },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(meta.opciones_filtro?.tipo)), render: (item) => item.tipo_venta },
    { key: 'total', header: <TableCell key="total">Total</TableCell>, render: (item) => dinero(item.total) },
    { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(catalogos.estados_venta)), render: (item) => <StatusChip estado={estadoTexto(item.estado)} label={item.estado_nombre || nombreEstado(catalogos.estados_venta, item.estado)} /> },
  ];
  if (tipo === 'pagos') return [
    { key: 'operacion', header: <TableCell key="operacion">Cobro</TableCell>, render: (item) => <Box><Typography variant="body2" fontWeight="700">{item.codigo_cobro || item.operacion_cobro_id}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.fecha_pago)}</Typography></Box> },
    { key: 'venta', header: <TableCell key="venta">Venta / Comprobante</TableCell>, render: (item) => (
      <Box>
        <Typography variant="body2">{item.venta_numero || '—'}</Typography>
        {item.comprobante_numero ? <Typography variant="caption" color="text.secondary">{item.comprobante_numero}</Typography> : null}
      </Box>
    ) },
    { key: 'cliente', header: <TableCell key="cliente">Cliente</TableCell>, render: (item) => <Box><Typography variant="body2">{item.cliente_nombre || 'Consumidor final'}</Typography><Typography variant="caption" color="text.secondary">{item.cliente_identificacion || 'Sin identificación'}</Typography></Box> },
    { key: 'cobrador', header: <TableCell key="cobrador">Responsables</TableCell>, render: (item) => (
      <Box sx={{ minWidth: 160 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Venta generada por</Typography>
        <Typography variant="body2" fontWeight={650}>
          {item.generado_por_nombre || 'Sin usuario'}
          {item.generado_por_rol ? ` · ${item.generado_por_rol}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Cobró</Typography>
        <Typography variant="body2" fontWeight={650}>
          {item.cobrado_por_nombre || 'Sin usuario'}
          {item.cobrado_por_rol ? ` · ${item.cobrado_por_rol}` : ''}
        </Typography>
      </Box>
    ) },
    { key: 'efectivo', header: <TableCell key="efectivo" align="right">Efectivo</TableCell>, render: (item) => dinero(item.efectivo) },
    { key: 'cambio', header: <TableCell key="cambio" align="right">Efectivo entregado / Cambio</TableCell>, render: (item) =>
      Number(item.efectivo || 0) > 0 ? (
        <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <Typography variant="caption" sx={{ color: '#171717', display: 'block', fontWeight: 800 }}>
            Recibido: {dinero(item.efectivo_recibido)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Cambio: {dinero(item.cambio_entregado)}
          </Typography>
        </Box>
      ) : '—' },
    { key: 'transferencia', header: <TableCell key="transferencia" align="right">Transferencia</TableCell>, render: (item) => dinero(item.transferencia) },
    { key: 'tarjeta', header: <TableCell key="tarjeta" align="right">Tarjeta</TableCell>, render: (item) => dinero(item.tarjeta) },
    { key: 'deposito', header: <TableCell key="deposito" align="right">Depósito</TableCell>, render: (item) => dinero(item.deposito) },
    { key: 'otros', header: <TableCell key="otros" align="right">Otros</TableCell>, render: (item) => dinero(item.otros) },
    { key: 'total', header: <TableCell key="total" align="right">Total</TableCell>, render: (item) => <Typography variant="body2" fontWeight="800">{dinero(item.total_cobrado)}</Typography> },
    { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(catalogos.estados_pago)), render: (item) => <StatusChip estado={estadoTexto(item.estado)} label={nombreEstado(catalogos.estados_pago, item.estado)} /> },
    // Solo administradores: corregir el método de un cobro mal registrado.
    ...(catalogos.puede_anular_pagadas ? [{ key: 'acciones', header: <TableCell key="acciones" align="center">Acciones</TableCell>, render: (item) => (
      item.estado === 'CONFIRMADO' && Number(item.total_cobrado || 0) > 0
        ? <Tooltip title="Corregir método de pago"><IconButton aria-label="Corregir método de pago" sx={{ ...dbanuStyles.actionEdit, mr: 0 }} onClick={() => onCorregir(item)}>
            <EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
        : '—'
    ) }] : []),
  ];
  return [
    { key: 'numero', header: filtro('numero', 'Comprobante', null), render: (item) => <Box><Typography variant="body2" fontWeight="700">{item.numero}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.emitido_at || item.created_at)}</Typography></Box> },
    { key: 'venta', header: <TableCell key="venta">Venta</TableCell>, render: (item) => item.venta_numero || '—' },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => <Box><Typography variant="body2">{item.cliente_nombre || 'Consumidor final'}</Typography><Typography variant="caption" color="text.secondary">{item.cliente_identificacion || 'Sin identificación'}</Typography></Box> },
    { key: 'correo', header: <TableCell key="correo">Correo</TableCell>, render: (item) => item.cliente_email || item.correo_destino || 'Sin correo' },
    { key: 'total', header: <TableCell key="total">Total</TableCell>, render: (item) => dinero(item.total) },
    { key: 'envio', header: <TableCell key="envio">Envío</TableCell>, render: (item) => <Box><Typography variant="body2">{Number(item.cantidad_envios || 0) > 0 ? `Enviado · ${item.cantidad_envios}` : 'Sin enviar'}</Typography><Typography variant="caption" color="text.secondary">{item.ultimo_envio_at ? fecha(item.ultimo_envio_at) : '—'}</Typography></Box> },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'BORRADOR', label: 'Borrador' }, { value: 'EMITIDO', label: 'Emitido' }, { value: 'ANULADO', label: 'Anulado' }]), render: (item) => <StatusChip estado={estadoTexto(item.estado)} label={textoComprobante[String(item.estado || '').toUpperCase()]} /> },
  ];
}

function normalizar(tipo, data) {
  if (tipo === 'cajas') {
    if (!data.sede_id || !data.nombre) return null;
    return { sede_id: Number(data.sede_id), nombre: data.nombre.trim(), descripcion: String(data.descripcion || '').trim() || null, activa: Boolean(data.activa) };
  }
  if (tipo === 'ventas') {
    if (!data.tipo_venta || !data.concepto || !data.total) return null;
    return { cliente_id: data.cliente_id ? Number(data.cliente_id) : null, membresia_id: data.membresia_id ? Number(data.membresia_id) : null, caja_id: data.caja_id ? Number(data.caja_id) : null, tipo_venta: data.tipo_venta, concepto: data.concepto, subtotal: Number(data.subtotal || data.total || 0), descuento: Number(data.descuento || 0), impuesto: Number(data.impuesto || 0), total: Number(data.total || 0), estado: data.estado || 'PENDIENTE', observaciones: data.observaciones || null, detalle: { producto_id: data.detalle?.producto_id ? Number(data.detalle.producto_id) : null, descripcion: data.concepto, cantidad: Number(data.detalle?.cantidad || 1), precio_unitario: Number(data.detalle?.precio_unitario || data.total || 0), total_linea: Number(data.total || 0) } };
  }
  if (!data.venta_id || !data.metodo_pago || !data.monto) return null;
  return { venta_id: Number(data.venta_id), caja_id: data.caja_id ? Number(data.caja_id) : null, metodo_pago: data.metodo_pago, monto: Number(data.monto), estado: data.estado || 'CONFIRMADO', referencia: data.referencia || null, observaciones: data.observaciones || null };
}
