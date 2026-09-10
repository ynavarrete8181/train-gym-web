import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
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
import { inventarioServicio } from '../services/inventarioServicio.js';

const tiposMovimiento = ['ENTRADA', 'SALIDA', 'AJUSTE', 'BAJA'];
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');

const configs = {
  categorias: {
    titulo: 'Categorías de inventario',
    singular: 'Categoría',
    descripcion: 'Clasifica productos para ventas, compras y control de stock.',
    icono: <CategoryOutlinedIcon />,
    obtener: 'obtenerCategorias',
    crear: 'crearCategoria',
    actualizar: 'actualizarCategoria',
    inicial: { id: null, nombre: '', descripcion: '', activo: true },
  },
  proveedores: {
    titulo: 'Proveedores',
    singular: 'Proveedor',
    descripcion: 'Registra contactos comerciales para compras e ingresos.',
    icono: <LocalShippingOutlinedIcon />,
    obtener: 'obtenerProveedores',
    crear: 'crearProveedor',
    actualizar: 'actualizarProveedor',
    inicial: { id: null, ruc: '', nombre: '', telefono: '', email: '', direccion: '', activo: true },
  },
  productos: {
    titulo: 'Productos',
    singular: 'Producto',
    descripcion: 'Catálogo comercial con precios, stock y estado operativo.',
    icono: <Inventory2OutlinedIcon />,
    obtener: 'obtenerProductos',
    crear: 'crearProducto',
    actualizar: 'actualizarProducto',
    inicial: { id: null, categoria_id: '', proveedor_id: '', codigo: '', nombre: '', descripcion: '', marca: '', unidad_medida: 'UNIDAD', precio_costo: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 0, controla_stock: true, activo: true },
  },
  movimientos: {
    titulo: 'Movimientos / Kardex',
    singular: 'Movimiento',
    descripcion: 'Registra entradas, salidas, ajustes y bajas de inventario.',
    icono: <SwapHorizOutlinedIcon />,
    obtener: 'obtenerMovimientos',
    crear: 'crearMovimiento',
    actualizar: null,
    inicial: { id: null, producto_id: '', sede_id: '', tipo_movimiento: 'ENTRADA', cantidad: '', referencia: '', observaciones: '' },
  },
};

export function InventarioCatalogo({ tipo }) {
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
      const response = await inventarioServicio[config.obtener](parametros);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch (error) {
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

  const buscar = (parametros) => {
    const nuevos = { ...parametros, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevosFiltros = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const handleNuevo = () => { setFormData(config.inicial); setVista('formulario'); };
  const handleEditar = (item) => { setFormData({ ...config.inicial, ...item, activo: item.activo !== false, controla_stock: item.controla_stock !== false }); setVista('formulario'); };

  const handleChange = (evento) => {
    const { name, value, checked, type: inputType } = evento.target;
    setFormData((actual) => ({ ...actual, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async () => {
    try {
      const payload = normalizar(tipo, formData);
      if (!payload) {
        showNotificacion('Complete los campos obligatorios', 'warning');
        return;
      }

      if (formData.id && config.actualizar) {
        await inventarioServicio[config.actualizar](formData.id, payload);
        showNotificacion(`${config.singular} actualizado correctamente`, 'success');
      } else {
        await inventarioServicio[config.crear](payload);
        showNotificacion(`${config.singular} creado correctamente`, 'success');
      }

      setVista('lista');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || `Error al guardar ${config.singular.toLowerCase()}`, 'error');
    }
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna), [tipo, meta, filtrosColumna]);

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={`${formData.id ? 'Editar' : 'Nuevo'} ${config.singular}`} descripcion={config.descripcion} icono={config.icono} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#f6f8fc', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de {config.singular.toLowerCase()}</Typography>
              <Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} />
            </Box>
          </Box>
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
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevo} sx={dbanuStyles.addButtonRevive}>Añadir</Button>} />
        <TablaInventario items={items} columnas={columnas} meta={meta} cargando={cargando} editable={tipo !== 'movimientos'} onEditar={handleEditar} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}

function Formulario({ tipo, formData, catalogos, onChange }) {
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };

  if (tipo === 'categorias') {
    return <Box sx={grid}><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /></Box>;
  }

  if (tipo === 'proveedores') {
    return <Box sx={grid}><TextField label="RUC" name="ruc" value={formData.ruc || ''} onChange={onChange} size="small" /><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Teléfono" name="telefono" value={formData.telefono || ''} onChange={onChange} size="small" /><TextField label="Email" name="email" value={formData.email || ''} onChange={onChange} size="small" /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /><TextField label="Dirección" name="direccion" value={formData.direccion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /></Box>;
  }

  if (tipo === 'productos') {
    return (
      <Box sx={grid}>
        <TextField select label="Categoría" name="categoria_id" value={formData.categoria_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin categoría</MenuItem>{(catalogos.categorias || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
        <TextField select label="Proveedor" name="proveedor_id" value={formData.proveedor_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin proveedor</MenuItem>{(catalogos.proveedores || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
        <TextField label="Código" name="codigo" value={formData.codigo || ''} onChange={onChange} required size="small" />
        <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
        <TextField label="Marca" name="marca" value={formData.marca || ''} onChange={onChange} size="small" />
        <TextField label="Unidad" name="unidad_medida" value={formData.unidad_medida || 'UNIDAD'} onChange={onChange} required size="small" />
        <TextField label="Costo" name="precio_costo" type="number" value={formData.precio_costo || 0} onChange={onChange} required size="small" />
        <TextField label="Venta" name="precio_venta" type="number" value={formData.precio_venta || 0} onChange={onChange} required size="small" />
        <TextField label="Stock actual" name="stock_actual" type="number" value={formData.stock_actual || 0} onChange={onChange} required size="small" />
        <TextField label="Stock mínimo" name="stock_minimo" type="number" value={formData.stock_minimo || 0} onChange={onChange} required size="small" />
        <FormControlLabel control={<Switch name="controla_stock" checked={Boolean(formData.controla_stock)} onChange={onChange} />} label="Controla stock" />
        <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
        <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
      </Box>
    );
  }

  return (
    <Box sx={grid}>
      <TextField select label="Producto" name="producto_id" value={formData.producto_id || ''} onChange={onChange} required size="small">{(catalogos.productos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.codigo} - {item.nombre} ({numero(item.stock_actual)})</MenuItem>)}</TextField>
      <TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin sede</MenuItem>{(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
      <TextField select label="Tipo" name="tipo_movimiento" value={formData.tipo_movimiento || 'ENTRADA'} onChange={onChange} required size="small">{tiposMovimiento.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField label="Cantidad" name="cantidad" type="number" value={formData.cantidad || ''} onChange={onChange} required size="small" />
      <TextField label="Referencia" name="referencia" value={formData.referencia || ''} onChange={onChange} size="small" />
      <TextField label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
    </Box>
  );
}

function TablaInventario({ items, columnas, meta, cargando, editable, onEditar, onPageChange, onRowsPerPageChange }) {
  return (
    <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} cargando={cargando}>
      <TableHead><TableRow>{columnas.map((columna) => columna.header)}{editable ? <TableCell align="right">Acciones</TableCell> : null}</TableRow></TableHead>
      <TableBody>
        {items.map((item) => <TableRow key={item.id} hover>{columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}{editable ? <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></TableCell> : null}</TableRow>)}
        {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + (editable ? 1 : 0)} cargando={cargando} texto="No hay registros para los filtros aplicados." /> : null}
      </TableBody>
    </TablaGestion>
  );
}

function columnasPorTipo(tipo, meta, filtros, onFiltro) {
  const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtros[key]} onChange={(v) => onFiltro(key, v)} options={opts}>{label}</FilterHeaderCell>;

  if (tipo === 'categorias') return [
    { key: 'nombre', header: filtro('nombre', 'Nombre', opciones(meta.opciones_filtro?.nombre)), render: (item) => <Typography variant="body2" fontWeight="600">{item.nombre}</Typography> },
    { key: 'descripcion', header: <TableCell key="descripcion">Descripción</TableCell>, render: (item) => item.descripcion || 'Sin descripción' },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];

  if (tipo === 'proveedores') return [
    { key: 'nombre', header: filtro('nombre', 'Proveedor', opciones(meta.opciones_filtro?.proveedor)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.ruc || 'Sin RUC'}</Typography></Box> },
    { key: 'contacto', header: <TableCell key="contacto">Contacto</TableCell>, render: (item) => <Box><Typography variant="body2">{item.telefono || 'Sin teléfono'}</Typography><Typography variant="caption" color="text.secondary">{item.email || 'Sin email'}</Typography></Box> },
    { key: 'direccion', header: <TableCell key="direccion">Dirección</TableCell>, render: (item) => item.direccion || 'Sin dirección' },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];

  if (tipo === 'productos') return [
    { key: 'producto', header: filtro('producto', 'Producto', opciones(meta.opciones_filtro?.producto)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo} · {item.marca || 'Sin marca'}</Typography></Box> },
    { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria_nombre || 'Sin categoría' },
    { key: 'precios', header: <TableCell key="precios">Costo / venta</TableCell>, render: (item) => `${dinero(item.precio_costo)} / ${dinero(item.precio_venta)}` },
    { key: 'stock', header: <TableCell key="stock">Stock</TableCell>, render: (item) => `${numero(item.stock_actual)} min. ${numero(item.stock_minimo)}` },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
  ];

  return [
    { key: 'producto', header: filtro('producto', 'Producto', opciones(meta.opciones_filtro?.producto)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.producto_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.producto_codigo}</Typography></Box> },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(tiposMovimiento)), render: (item) => item.tipo_movimiento },
    { key: 'cantidad', header: <TableCell key="cantidad">Cantidad</TableCell>, render: (item) => numero(item.cantidad) },
    { key: 'stock', header: <TableCell key="stock">Stock anterior / nuevo</TableCell>, render: (item) => `${numero(item.stock_anterior)} / ${numero(item.stock_nuevo)}` },
    { key: 'sede', header: filtro('sede', 'Sede', opciones(meta.opciones_filtro?.sede)), render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'referencia', header: <TableCell key="referencia">Referencia</TableCell>, render: (item) => item.referencia || 'Sin referencia' },
  ];
}

function normalizar(tipo, data) {
  if (tipo === 'categorias') {
    if (!data.nombre) return null;
    return { nombre: data.nombre, descripcion: data.descripcion || null, activo: Boolean(data.activo) };
  }
  if (tipo === 'proveedores') {
    if (!data.nombre) return null;
    return { ruc: data.ruc || null, nombre: data.nombre, telefono: data.telefono || null, email: data.email || null, direccion: data.direccion || null, activo: Boolean(data.activo) };
  }
  if (tipo === 'productos') {
    if (!data.codigo || !data.nombre || !data.unidad_medida) return null;
    return { categoria_id: data.categoria_id ? Number(data.categoria_id) : null, proveedor_id: data.proveedor_id ? Number(data.proveedor_id) : null, codigo: data.codigo, nombre: data.nombre, descripcion: data.descripcion || null, marca: data.marca || null, unidad_medida: data.unidad_medida, precio_costo: Number(data.precio_costo || 0), precio_venta: Number(data.precio_venta || 0), stock_actual: Number(data.stock_actual || 0), stock_minimo: Number(data.stock_minimo || 0), controla_stock: Boolean(data.controla_stock), activo: Boolean(data.activo) };
  }
  if (!data.producto_id || !data.tipo_movimiento || !data.cantidad) return null;
  return { producto_id: Number(data.producto_id), sede_id: data.sede_id ? Number(data.sede_id) : null, tipo_movimiento: data.tipo_movimiento, cantidad: Number(data.cantidad), referencia: data.referencia || null, observaciones: data.observaciones || null };
}
