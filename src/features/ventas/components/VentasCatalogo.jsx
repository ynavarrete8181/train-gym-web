import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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

const tiposVenta = ['PRODUCTO', 'MEMBRESIA', 'SERVICIO', 'OTRO'];
const metodosPago = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'DEPOSITO', 'OTRO'];
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const opcionesEstados = (valores = []) => valores.map((item) => ({ value: String(item.valor_interno), label: String(item.nombre || item.valor_interno) }));
const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : 'Sin fecha';
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');
const estadoTexto = (valor) => String(valor || '').toLowerCase().replace('pagada', 'activo').replace('confirmado', 'activo').replace('emitido', 'activo');

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
    titulo: 'Pagos', singular: 'Pago', descripcion: 'Registra abonos y pagos confirmados de ventas.', icono: <PaymentsOutlinedIcon />,
    obtener: 'obtenerPagos', crear: 'crearPago', actualizar: null,
    inicial: { id: null, venta_id: '', caja_id: '', metodo_pago: 'EFECTIVO', monto: '', estado: 'CONFIRMADO', referencia: '', observaciones: '' },
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
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const showNotificacion = (mensaje, tipoAviso = 'info') => setNotificacion({ mensaje, tipo: tipoAviso });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await ventaServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch {
      showNotificacion(`Error al cargar ${config.titulo.toLowerCase()}`, 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setVista('lista');
    setFormData(config.inicial);
    setFiltros({ busqueda: '', page: 1, per_page: 5 });
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

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna, catalogos), [tipo, meta, filtrosColumna, catalogos]);

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
        <TablaVentas items={items} columnas={columnas} meta={meta} cargando={cargando} editable={Boolean(config.actualizar)} onEditar={handleEditar} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} />
      </Paper>
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
      <FormControlLabel control={<Switch name="activa" checked={Boolean(formData.activa)} onChange={onChange} />} label="Activa" sx={{ alignSelf: 'center' }} />
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

function TablaVentas({ items, columnas, meta, cargando, editable, onEditar, onPageChange, onRowsPerPageChange }) {
  return <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
    <TableHead><TableRow>{columnas.map((columna) => columna.header)}{editable ? <TableCell align="right">Acciones</TableCell> : null}</TableRow></TableHead>
    <TableBody>{items.map((item) => <TableRow key={item.id} hover>{columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}{editable ? <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></TableCell> : null}</TableRow>)}{items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + (editable ? 1 : 0)} cargando={cargando} texto="No hay registros para los filtros aplicados." /> : null}</TableBody>
  </TablaGestion>;
}

function columnasPorTipo(tipo, meta, filtros, onFiltro, catalogos) {
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
    { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(catalogos.estados_venta)), render: (item) => <StatusChip estado={estadoTexto(item.estado_nombre || item.estado)} /> },
  ];
  if (tipo === 'pagos') return [
    { key: 'comprobante', header: filtro('comprobante', 'Comprobante', null), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.numero_comprobante}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.fecha_pago)}</Typography></Box> },
    { key: 'venta', header: <TableCell key="venta">Venta</TableCell>, render: (item) => item.venta_numero },
    { key: 'metodo', header: filtro('metodo', 'Método', opciones(meta.opciones_filtro?.metodo)), render: (item) => item.metodo_pago },
    { key: 'monto', header: <TableCell key="monto">Monto</TableCell>, render: (item) => dinero(item.monto) },
    { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(catalogos.estados_pago)), render: (item) => <StatusChip estado={estadoTexto(item.estado_nombre || item.estado)} /> },
  ];
  return [
    { key: 'numero', header: filtro('numero', 'Comprobante', null), render: (item) => <Typography variant="body2" fontWeight="600">{item.numero}</Typography> },
    { key: 'venta', header: <TableCell key="venta">Venta</TableCell>, render: (item) => item.venta_numero },
    { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => item.cliente_nombre || 'Consumidor final' },
    { key: 'concepto', header: <TableCell key="concepto">Concepto</TableCell>, render: (item) => item.concepto },
    { key: 'total', header: <TableCell key="total">Total</TableCell>, render: (item) => dinero(item.total) },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'BORRADOR', label: 'Borrador' }, { value: 'EMITIDO', label: 'Emitido' }, { value: 'ANULADO', label: 'Anulado' }]), render: (item) => <StatusChip estado={estadoTexto(item.estado)} /> },
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
