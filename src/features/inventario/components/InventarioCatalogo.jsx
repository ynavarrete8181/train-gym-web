import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { Avatar, Badge, Box, Button, Chip, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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
import { CampoActivo } from '../../../components/common/CampoActivo.jsx';

const tiposMovimiento = ['AJUSTE_INICIAL', 'ENTRADA', 'SALIDA', 'AJUSTE', 'BAJA'];
const TIPOS_VENTA = { SALIDA: 'SALIDA POR VENTA', REVERSO_VENTA: 'REVERSO POR EDICIÓN DE VENTA', REVERSO_ANULACION: 'REVERSO POR ANULACIÓN' };
const textoTipoMovimiento = (item) => {
  if (item.tipo_movimiento === 'SALIDA') return item.venta_id ? TIPOS_VENTA.SALIDA : 'SALIDA';
  return TIPOS_VENTA[item.tipo_movimiento] || item.tipo_movimiento;
};
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const estadoBool = (valor) => (valor ? 'activo' : 'cerrado');
const colorEstado = (color) => ['default', 'info', 'success', 'warning', 'error'].includes(color) ? color : 'default';

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
    inicial: { id: null, categoria_id: '', proveedor_id: '', codigo: '', nombre: '', descripcion: '', marca: '', imagen_url: '', imagen_path: '', unidad_medida: 'UNIDAD', precio_costo: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 0, controla_stock: true, maneja_lotes: false, activo: true, precios_sede: [], stocks_sede: [], lotes: [] },
  },
  movimientos: {
    titulo: 'Movimientos / Kardex',
    singular: 'Movimiento',
    descripcion: 'Registra entradas, salidas, ajustes y bajas de inventario.',
    icono: <SwapHorizOutlinedIcon />,
    obtener: 'obtenerMovimientos',
    crear: 'crearMovimiento',
    actualizar: null,
    inicial: { id: null, producto_id: '', sede_id: '', lote_id: '', tipo_movimiento: 'ENTRADA', cantidad: '', referencia: '', observaciones: '' },
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

  const handleNuevo = () => {
    setFormData(tipo === 'productos' ? prepararProductoSedes(config.inicial, catalogos.sedes || []) : config.inicial);
    setVista('formulario');
  };
  const handleEditar = (item) => {
    const base = { ...config.inicial, ...item, activo: item.activo !== false, controla_stock: item.controla_stock !== false, maneja_lotes: item.maneja_lotes === true };
    setFormData(tipo === 'productos' ? prepararProductoSedes(base, catalogos.sedes || []) : base);
    setVista('formulario');
  };

  const handleInventario = (item) => {
    const base = { ...config.inicial, ...item, activo: item.activo !== false, controla_stock: item.controla_stock !== false, maneja_lotes: item.maneja_lotes === true };
    setFormData(prepararProductoSedes(base, catalogos.sedes || []));
    setVista('inventario');
  };

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
        const respuesta = await inventarioServicio[config.crear](payload);
        const creado = respuesta?.datos || respuesta;
        if (tipo === 'productos' && creado?.id) {
          // El producto recién creado pasa directo a su inventario para cargar el stock inicial.
          showNotificacion('Producto creado. Registra ahora su inventario inicial por sede.', 'success');
          handleInventario(creado);
          cargar();
          return;
        }
        showNotificacion(`${config.singular} creado correctamente`, 'success');
      }

      setVista('lista');
      cargar();
    } catch (error) {
      // Las reglas de stock y lotes llegan como validación: se muestra el motivo real.
      const datos = error.response?.data || {};
      const primerError = Object.values(datos.errors || datos.errores || {}).flat()[0];
      showNotificacion(primerError || datos.mensaje || datos.message || `Error al guardar ${config.singular.toLowerCase()}`, 'error');
    }
  };

  const columnas = useMemo(() => columnasPorTipo(tipo, meta, filtrosColumna, aplicarFiltroColumna, handleInventario), [tipo, meta, filtrosColumna, catalogos]);

  if (vista === 'inventario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={`Inventario · ${formData.nombre || ''}`} descripcion="Stock por sede, lotes y vencimientos del producto." icono={<WarehouseOutlinedIcon />} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper className="page-content-container" elevation={0} sx={{ mt: 2, overflow: 'hidden', bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ px: { xs: 1.5, md: 2.25 }, py: { xs: 1.5, md: 2 } }}>
            <VistaInventario sedes={catalogos.sedes || []} formData={formData} setFormData={setFormData} onChange={handleChange} />
          </Box>
          <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #eef1f4' }}>
            <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
          </Box>
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo={`${formData.id ? 'Editar' : 'Nuevo'} ${config.singular}`} descripcion={config.descripcion} icono={config.icono} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper
          className="page-content-container"
          elevation={0}
          sx={{
            mt: 2,
            overflow: 'hidden',
            bgcolor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
          }}
        >
          <Box sx={{ px: { xs: 1.5, md: 2.25 }, py: { xs: 1.5, md: 2 }, bgcolor: '#fff' }}>
            <Box sx={{ ...formStyles.seccion, bgcolor: '#fff', m: 0 }}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de {config.singular.toLowerCase()}</Typography>
              <Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} setFormData={setFormData} onNotificar={showNotificacion} />
            </Box>
          </Box>
          <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #eef1f4' }}>
            <AccionesFormulario onGuardar={handleGuardar} onCancelar={() => setVista('lista')} />
          </Box>
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

function Formulario({ tipo, formData, catalogos, onChange, setFormData, onNotificar }) {
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 };

  const cargarImagenProducto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      onNotificar?.('Selecciona un archivo de imagen válido.', 'warning');
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      onNotificar?.('La imagen no puede superar 5 MB.', 'warning');
      return;
    }

    setSubiendoImagen(true);
    try {
      const response = await inventarioServicio.subirImagenProducto(archivo);
      const datos = response.datos || response;
      setFormData((actual) => ({
        ...actual,
        imagen_url: datos.imagen_url || '',
        imagen_path: datos.imagen_path || '',
      }));
      onNotificar?.('Imagen cargada correctamente.', 'success');
    } catch (error) {
      onNotificar?.(error.response?.data?.mensaje || 'No se pudo cargar la imagen.', 'error');
    } finally {
      setSubiendoImagen(false);
    }
  };

  if (tipo === 'categorias') {
    return <Box sx={grid}><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /><CampoActivo name="activo" checked={formData.activo} onChange={onChange} /></Box>;
  }

  if (tipo === 'proveedores') {
    return <Box sx={grid}><TextField label="RUC" name="ruc" value={formData.ruc || ''} onChange={onChange} size="small" /><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Teléfono" name="telefono" value={formData.telefono || ''} onChange={onChange} size="small" /><TextField label="Email" name="email" value={formData.email || ''} onChange={onChange} size="small" /><TextField label="Dirección" name="direccion" value={formData.direccion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /><CampoActivo name="activo" checked={formData.activo} onChange={onChange} /></Box>;
  }

  if (tipo === 'productos') {
    const sedes = catalogos.sedes || [];
    const actualizarSede = (clave, sedeId, campo, valor) => {
      setFormData((actual) => ({
        ...actual,
        [clave]: (actual[clave] || []).map((fila) => Number(fila.sede_id) === Number(sedeId) ? { ...fila, [campo]: valor } : fila),
      }));
    };
    return (
      <Stack spacing={2}>
        <Box sx={grid}>
          <TextField select label="Categoría" name="categoria_id" value={formData.categoria_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin categoría</MenuItem>{(catalogos.categorias || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
          <TextField select label="Proveedor" name="proveedor_id" value={formData.proveedor_id || ''} onChange={onChange} size="small"><MenuItem value="">Sin proveedor</MenuItem>{(catalogos.proveedores || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
          <TextField label="Código" name="codigo" value={formData.codigo || ''} onChange={onChange} required size="small" />
          <TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" />
          <TextField label="Marca" name="marca" value={formData.marca || ''} onChange={onChange} size="small" />
          <TextField label="Unidad" name="unidad_medida" value={formData.unidad_medida || 'UNIDAD'} onChange={onChange} required size="small" />
          <TextField label="Costo referencial" name="precio_costo" type="number" value={formData.precio_costo || 0} onChange={onChange} required size="small" />
          <TextField label="Precio base" name="precio_venta" type="number" value={formData.precio_venta || 0} onChange={onChange} required size="small" helperText="Se usa como respaldo si una sede no tiene precio propio." />
          <Box sx={{ gridColumn: { xs: 'auto', md: 'span 3' }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '170px minmax(0, 1fr)' }, gap: 1.5, alignItems: 'stretch' }}>
            <Box
              sx={{
                minHeight: 210,
                border: '1px solid #dfe4ea',
                borderRadius: 2,
                bgcolor: '#f8fafc',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
              }}
            >
              {formData.imagen_url ? (
                <Box component="img" src={formData.imagen_url} alt={formData.nombre || 'Producto'} sx={{ width: '100%', height: 210, objectFit: 'cover' }} />
              ) : (
                <Stack spacing={.6} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                  <PhotoCameraOutlinedIcon sx={{ fontSize: 38 }} />
                  <Typography variant="caption">Sin foto</Typography>
                </Stack>
              )}
            </Box>

            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={900}>Imagen del producto</Typography>
              <Typography variant="caption" color="text.secondary">
                Selecciona una foto JPG, PNG o WEBP de hasta 5 MB. Puedes reemplazarla cuando necesites actualizar el producto.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  component="label"
                  variant="contained"
                  disabled={subiendoImagen}
                  startIcon={<PhotoCameraOutlinedIcon />}
                  sx={{ ...dbanuStyles.addButtonRevive, textTransform: 'none' }}
                >
                  {subiendoImagen ? 'Cargando...' : formData.imagen_url ? 'Cambiar foto' : 'Seleccionar foto'}
                  <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={cargarImagenProducto} />
                </Button>
                {formData.imagen_url ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setFormData((actual) => ({ ...actual, imagen_url: '', imagen_path: '' }))}
                  >
                    Quitar foto
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Box>
          <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
          <CampoActivo name="activo" checked={formData.activo} onChange={onChange} />
        </Box>

        <PreciosSede sedes={sedes} formData={formData} actualizarSede={actualizarSede} />
        <Typography variant="caption" color="text.secondary">
          El stock, los lotes y el tipo de control se gestionan con el botón Inventario de la lista.
        </Typography>
      </Stack>
    );
  }

  const productoSeleccionado = (catalogos.productos || []).find((item) => Number(item.id) === Number(formData.producto_id));
  const lotesDisponibles = (catalogos.lotes || []).filter((lote) =>
    Number(lote.producto_id) === Number(formData.producto_id)
    && (!formData.sede_id || Number(lote.sede_id) === Number(formData.sede_id))
  );

  return (
    <Box sx={grid}>
      <TextField select label="Producto" name="producto_id" value={formData.producto_id || ''} onChange={onChange} required size="small">{(catalogos.productos || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.codigo} - {item.nombre} ({numero(item.stock_actual)})</MenuItem>)}</TextField>
      <TextField select label="Sede" name="sede_id" value={formData.sede_id || ''} onChange={onChange} required size="small"><MenuItem value="">Seleccione sede</MenuItem>{(catalogos.sedes || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
      <TextField select label="Tipo" name="tipo_movimiento" value={formData.tipo_movimiento || 'ENTRADA'} onChange={onChange} required size="small">{tiposMovimiento.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      {productoSeleccionado?.maneja_lotes && !['SALIDA', 'BAJA'].includes(formData.tipo_movimiento) ? (
        <TextField select label="Lote" name="lote_id" value={formData.lote_id || ''} onChange={onChange} required size="small">
          <MenuItem value="">Seleccione lote</MenuItem>
          {lotesDisponibles.map((lote) => <MenuItem key={lote.id} value={lote.id}>{lote.codigo_lote} · {lote.sede_nombre} · stock {numero(lote.stock_actual)}{lote.fecha_vencimiento ? ` · vence ${lote.fecha_vencimiento}` : ''}{lote.estado_nombre ? ` · ${lote.estado_nombre}` : ''}</MenuItem>)}
        </TextField>
      ) : null}
      {productoSeleccionado?.maneja_lotes && ['SALIDA', 'BAJA'].includes(formData.tipo_movimiento) ? (
        <Box sx={{ px: 1.4, py: 1.1, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
          <Typography variant="caption" color="text.secondary">
            El lote se asignará automáticamente por FEFO: primero se descuenta el stock con vencimiento más próximo.
          </Typography>
        </Box>
      ) : null}
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

function columnasPorTipo(tipo, meta, filtros, onFiltro, onInventario) {
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
    { key: 'producto', header: filtro('producto', 'Producto', opciones(meta.opciones_filtro?.producto)), render: (item) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Avatar variant="rounded" src={item.imagen_url || undefined} sx={{ width: 34, height: 44, bgcolor: '#f3f4f6' }}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></Avatar><Box><Typography variant="body2" fontWeight="700">{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo} · {item.marca || 'Sin marca'}</Typography></Box></Box> },
    { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria_nombre || 'Sin categoría' },
    { key: 'lotes', header: <TableCell key="lotes">Lotes</TableCell>, render: (item) => item.maneja_lotes ? (
      <Tooltip title={`${(item.lotes || []).length} lote(s) activo(s): ver en Inventario`}>
        <IconButton sx={dbanuStyles.actionView} onClick={() => onInventario?.(item)} aria-label="Ver lotes">
          <Badge badgeContent={(item.lotes || []).length} color="primary" showZero sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, top: -6, right: -6 } }}><LayersOutlinedIcon sx={{ fontSize: 17 }} /></Badge>
        </IconButton>
      </Tooltip>
    ) : <Chip size="small" label="No" variant="outlined" sx={{ height: 22 }} /> },
    { key: 'stock_total', header: <TableCell key="stock_total">Stock total</TableCell>, render: (item) => { const r = resumenStock(item); return r.controla ? <Typography variant="body2" fontWeight={800} color={r.total <= 0 ? 'error.main' : 'text.primary'}>{numero(r.total)}</Typography> : <Typography variant="caption" color="text.secondary">Sin control</Typography>; } },
    { key: 'sedes_stock', header: <TableCell key="sedes_stock">Sedes con stock</TableCell>, render: (item) => <Tooltip title={(item.stocks_sede || []).map((x) => `${x.sede_nombre}: ${numero(x.stock_actual)}`).join(' · ') || 'Sin stock registrado'}><Typography variant="body2">{(item.stocks_sede || []).filter((x) => Number(x.stock_actual || 0) > 0).length}</Typography></Tooltip> },
    { key: 'vencimiento', header: <TableCell key="vencimiento">Próx. venc.</TableCell>, render: (item) => { const v = resumenStock(item).proximoVencimiento; return v ? fechaCorta(v) : <Typography variant="caption" color="text.secondary">—</Typography>; } },
    { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]), render: (item) => <StatusChip estado={estadoBool(item.activo)} /> },
    { key: 'inventario', header: <TableCell key="inventario" align="center">Inventario</TableCell>, render: (item) => <Box sx={{ textAlign: 'center' }}><Tooltip title="Inventario por sede y lotes"><IconButton sx={{ ...dbanuStyles.actionView, mr: 0 }} onClick={() => onInventario?.(item)} aria-label="Inventario"><WarehouseOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></Box> },
  ];

  return [
    { key: 'producto', header: filtro('producto', 'Producto', opciones(meta.opciones_filtro?.producto)), render: (item) => <Box><Typography variant="body2" fontWeight="600">{item.producto_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.producto_codigo}</Typography></Box> },
    { key: 'tipo', header: filtro('tipo', 'Tipo', opciones([...tiposMovimiento, 'REVERSO_VENTA', 'REVERSO_ANULACION'])), render: textoTipoMovimiento },
    { key: 'cantidad', header: <TableCell key="cantidad">Cantidad</TableCell>, render: (item) => numero(item.cantidad) },
    { key: 'stock', header: <TableCell key="stock">Stock anterior / nuevo</TableCell>, render: (item) => `${numero(item.stock_anterior)} / ${numero(item.stock_nuevo)}` },
    { key: 'sede', header: filtro('sede', 'Sede', opciones(meta.opciones_filtro?.sede)), render: (item) => item.sede_nombre || 'Sin sede' },
    { key: 'estado_movimiento', header: <TableCell key="estado_movimiento">Estado</TableCell>, render: (item) => <Chip size="small" label={item.estado_nombre || item.estado_valor || 'Sin estado'} color={colorEstado(item.estado_color)} variant="outlined" /> },
    { key: 'referencia', header: <TableCell key="referencia">Referencia</TableCell>, render: (item) => (item.venta_numero ? `${item.venta_numero} · ${String(item.venta_estado || '').toLowerCase()}` : item.referencia) || 'Sin referencia' },
  ];
}

function prepararProductoSedes(base, sedes) {
  const preciosExistentes = base.precios_sede || [];
  const stocksExistentes = base.stocks_sede || [];
  const stockDefecto = 0;

  return {
    ...base,
    precios_sede: sedes.map((sede) => {
      const actual = preciosExistentes.find((x) => Number(x.sede_id) === Number(sede.id));
      return actual || { sede_id: sede.id, sede_nombre: sede.nombre, precio: Number(base.precio_venta || 0), activo: true };
    }),
    stocks_sede: sedes.map((sede) => {
      const actual = stocksExistentes.find((x) => Number(x.sede_id) === Number(sede.id));
      return actual
        ? { ...actual, stock_actual: Number(actual.stock_actual || 0), stock_minimo: Number(actual.stock_minimo || 0) }
        : { sede_id: sede.id, sede_nombre: sede.nombre, stock_actual: stockDefecto, stock_minimo: Number(base.stock_minimo || 0), stock_inicial_editable: true };
    }),
    lotes: base.lotes || [],
  };
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
    return { categoria_id: data.categoria_id ? Number(data.categoria_id) : null, proveedor_id: data.proveedor_id ? Number(data.proveedor_id) : null, codigo: data.codigo, nombre: data.nombre, descripcion: data.descripcion || null, marca: data.marca || null, imagen_url: data.imagen_url || null, imagen_path: data.imagen_path || null, unidad_medida: data.unidad_medida, precio_costo: Number(data.precio_costo || 0), precio_venta: Number(data.precio_venta || 0), stock_actual: Number(data.stock_actual || 0), stock_minimo: Number(data.stock_minimo || 0), controla_stock: Boolean(data.controla_stock), maneja_lotes: Boolean(data.maneja_lotes), activo: Boolean(data.activo), precios_sede: (data.precios_sede || []).map((x) => ({ sede_id: Number(x.sede_id), precio: Number(x.precio || 0), activo: x.activo !== false })), stocks_sede: (data.stocks_sede || []).map((x) => ({ sede_id: Number(x.sede_id), stock_actual: Number(x.stock_actual || 0), stock_minimo: Number(x.stock_minimo || 0) })), lotes: data.maneja_lotes ? (data.lotes || []).filter((x) => x.sede_id && x.codigo_lote).map((x) => ({ id: x.id || null, sede_id: Number(x.sede_id), codigo_lote: x.codigo_lote, fecha_vencimiento: x.fecha_vencimiento || null, cantidad_inicial: Number(x.cantidad_inicial || 0), stock_actual: Number(x.stock_actual || 0), fecha_elaboracion: x.fecha_elaboracion || null, costo_unitario: x.costo_unitario === '' || x.costo_unitario == null ? null : Number(x.costo_unitario), activo: x.activo !== false })) : [] };
  }
  if (!data.producto_id || !data.tipo_movimiento || !data.cantidad) return null;
  return { producto_id: Number(data.producto_id), sede_id: data.sede_id ? Number(data.sede_id) : null, lote_id: data.lote_id ? Number(data.lote_id) : null, tipo_movimiento: data.tipo_movimiento, cantidad: Number(data.cantidad), referencia: data.referencia || null, observaciones: data.observaciones || null };
}

const fechaCorta = (valor) => {
  if (!valor) return '';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return dia ? `${dia}/${mes}/${anio}` : String(valor);
};

/** Totales del producto para la lista y las tarjetas del inventario. */
function resumenStock(item) {
  const stocks = item.stocks_sede || [];
  const lotes = (item.lotes || []).filter((lote) => lote.activo !== false);
  const vencimientos = lotes
    .filter((lote) => lote.fecha_vencimiento && Number(lote.stock_actual || 0) > 0)
    .map((lote) => String(lote.fecha_vencimiento).slice(0, 10))
    .sort();
  return {
    controla: item.controla_stock !== false,
    total: stocks.reduce((suma, x) => suma + Number(x.stock_actual || 0), 0),
    sedesConStock: `${stocks.filter((x) => Number(x.stock_actual || 0) > 0).length} de ${stocks.length}`,
    lotesActivos: lotes.length,
    proximoVencimiento: vencimientos[0] || null,
  };
}

const encabezadoSeccion = (icono, titulo, detalle, accion = null) => (
  <Box sx={{ px: 2, py: 1.3, display: 'flex', alignItems: 'center', gap: 1.2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fafafa' }}>
    <Box sx={{ width: 32, height: 32, borderRadius: 1.2, display: 'grid', placeItems: 'center', bgcolor: '#fff4d7', color: '#946a00', flexShrink: 0 }}>{icono}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={900}>{titulo}</Typography>
      {detalle ? <Typography variant="caption" color="text.secondary">{detalle}</Typography> : null}
    </Box>
    {accion}
  </Box>
);

const cajaSeccion = { border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' };
const celdaEncabezado = { fontSize: 11, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: '#64748b', bgcolor: '#f8fafc', py: 1 };

/** Editar producto: solo el precio de venta de cada sede. */
function PreciosSede({ sedes, formData, actualizarSede }) {
  return (
    <Box sx={cajaSeccion}>
      {encabezadoSeccion(<StorefrontOutlinedIcon sx={{ fontSize: 18 }} />, 'Precio de venta por sede', 'Cada sede vende a su propio precio.')}
      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        {sedes.map((sede) => {
          const precio = (formData.precios_sede || []).find((x) => Number(x.sede_id) === Number(sede.id)) || {};
          return (
            <TextField
              key={sede.id} label={sede.nombre} type="number" size="small"
              value={precio.precio ?? formData.precio_venta ?? 0}
              onChange={(e) => actualizarSede('precios_sede', sede.id, 'precio', e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function estadoSede({ controla, conLotes, conKardex, stock, minimo }) {
  if (!controla) return { texto: 'Sin control de stock', icono: null, color: '#64748b', fondo: '#f1f5f9' };
  if (stock <= 0) return { texto: 'Sin stock', icono: <WarningAmberOutlinedIcon />, color: '#b91c1c', fondo: '#fef2f2' };
  if (minimo > 0 && stock <= minimo) return { texto: 'Stock bajo', icono: <WarningAmberOutlinedIcon />, color: '#9a3412', fondo: '#fff7ed' };
  if (conKardex) return { texto: 'Con Kardex', icono: <LockOutlinedIcon />, color: '#475569', fondo: '#f1f5f9' };
  if (conLotes) return { texto: 'Según lotes', icono: <LayersOutlinedIcon />, color: '#1e40af', fondo: '#eff6ff' };
  return { texto: 'Editable', icono: <EditNoteOutlinedIcon />, color: '#166534', fondo: '#f0fdf4' };
}

const chipEstado = (estado, ayuda) => (
  <Tooltip title={ayuda} placement="top" arrow>
    <Chip size="small" icon={estado.icono || undefined} label={estado.texto} sx={{ height: 24, fontWeight: 800, fontSize: 11.5, color: estado.color, bgcolor: estado.fondo, '& .MuiChip-icon': { color: estado.color, fontSize: 15 } }} />
  </Tooltip>
);

/** Inventario del producto: tipo de control, stock por sede y lotes. */
function VistaInventario({ sedes, formData, setFormData, onChange }) {
  const controla = Boolean(formData.controla_stock);
  const conLotes = Boolean(formData.maneja_lotes);
  const lotes = formData.lotes || [];
  const stockDe = (sedeId) => (formData.stocks_sede || []).find((x) => Number(x.sede_id) === Number(sedeId)) || {};
  const conKardexEn = (sedeId) => stockDe(sedeId).stock_inicial_editable === false;
  const lotesDe = (sedeId) => lotes.filter((lote) => Number(lote.sede_id) === Number(sedeId) && lote.activo !== false);
  const sumaLotes = (sedeId) => lotesDe(sedeId).reduce((total, lote) => total + Number(lote.stock_actual || 0), 0);
  // Un lote ya guardado en una sede con movimientos solo cambia por Kardex.
  const loteBloqueado = (lote) => Boolean(lote.id) && conKardexEn(lote.sede_id);

  const actualizarStock = (sedeId, campo, valor) => setFormData((actual) => ({
    ...actual,
    stocks_sede: (actual.stocks_sede || []).map((fila) => Number(fila.sede_id) === Number(sedeId) ? { ...fila, [campo]: valor } : fila),
  }));
  const agregarLote = () => setFormData((actual) => ({
    ...actual,
    lotes: [...(actual.lotes || []), { id: null, sede_id: sedes[0]?.id || '', codigo_lote: '', fecha_elaboracion: '', fecha_vencimiento: '', cantidad_inicial: 0, stock_actual: 0, costo_unitario: '', activo: true }],
  }));
  const actualizarLote = (indice, campo, valor) => setFormData((actual) => ({
    ...actual,
    lotes: (actual.lotes || []).map((lote, i) => {
      if (i !== indice) return lote;
      // La cantidad registrada es a la vez la cantidad inicial y el stock del lote.
      return campo === 'cantidad' ? { ...lote, cantidad_inicial: valor, stock_actual: valor } : { ...lote, [campo]: valor };
    }),
  }));
  const quitarLote = (indice) => setFormData((actual) => ({ ...actual, lotes: (actual.lotes || []).filter((_, i) => i !== indice) }));

  const resumen = resumenStock({ ...formData, stocks_sede: sedes.map((sede) => ({ ...stockDe(sede.id), stock_actual: conLotes && !conKardexEn(sede.id) ? sumaLotes(sede.id) : stockDe(sede.id).stock_actual })) });
  const tarjetas = [
    { titulo: 'Stock total', valor: controla ? numero(resumen.total) : '—' },
    { titulo: 'Sedes con stock', valor: resumen.sedesConStock },
    { titulo: 'Lotes activos', valor: conLotes ? resumen.lotesActivos : 'No aplica' },
    { titulo: 'Próximo vencimiento', valor: resumen.proximoVencimiento ? fechaCorta(resumen.proximoVencimiento) : '—' },
  ];

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {tarjetas.map((tarjeta) => (
          <Box key={tarjeta.titulo} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2, py: 1.4, bgcolor: '#fff' }}>
            <Typography variant="caption" color="text.secondary">{tarjeta.titulo}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.3 }}>{tarjeta.valor}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={cajaSeccion}>
        {encabezadoSeccion(<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />, 'Tipo de control', conLotes ? 'Por sede y por lote con vencimiento.' : controla ? 'Por sede, sin lotes.' : 'El producto no descuenta stock.')}
        <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <FormControlLabel control={<Switch name="controla_stock" checked={controla} onChange={onChange} />} label="Controla stock" />
          <FormControlLabel control={<Switch name="maneja_lotes" checked={conLotes} onChange={onChange} disabled={!controla} />} label="Maneja lotes y vencimiento" />
        </Box>
      </Box>

      <Box sx={cajaSeccion}>
        {encabezadoSeccion(<StorefrontOutlinedIcon sx={{ fontSize: 18 }} />, 'Stock por sede', conLotes ? 'El stock de cada sede es la suma de sus lotes.' : 'El stock inicial se corrige hasta el primer movimiento; después se cambia en Movimientos / Kardex.')}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {['Sede', conLotes ? 'Stock (lotes)' : 'Stock', 'Stock mínimo', 'Lotes', 'Próx. venc.', 'Estado'].map((titulo) => <TableCell key={titulo} sx={celdaEncabezado}>{titulo}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {sedes.map((sede) => {
                const fila = stockDe(sede.id);
                const conKardex = conKardexEn(sede.id);
                const stock = conLotes && !conKardex ? sumaLotes(sede.id) : Number(fila.stock_actual || 0);
                const minimo = Number(fila.stock_minimo ?? formData.stock_minimo ?? 0);
                const editable = controla && !conLotes && !conKardex;
                const vence = resumenStock({ lotes: lotesDe(sede.id) }).proximoVencimiento;
                const ayuda = !controla ? 'El producto no controla stock.'
                  : conKardex ? 'Ya tiene movimientos: cambia el stock con ENTRADA, AJUSTE o BAJA en Movimientos / Kardex.'
                    : conLotes ? 'Se calcula con los lotes de esta sede.' : 'Puedes corregir el stock inicial hasta el primer movimiento.';
                return (
                  <TableRow key={sede.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={800}>{sede.nombre}</Typography></TableCell>
                    <TableCell sx={{ width: 150 }}>
                      {editable
                        ? <TextField type="number" size="small" value={fila.stock_actual ?? 0} onChange={(e) => actualizarStock(sede.id, 'stock_actual', e.target.value)} slotProps={{ htmlInput: { min: 0, 'aria-label': `Stock inicial en ${sede.nombre}` } }} sx={{ width: 120 }} />
                        : <Typography variant="body2" fontWeight={800}>{controla ? numero(stock) : '—'}</Typography>}
                    </TableCell>
                    <TableCell sx={{ width: 150 }}>
                      <TextField type="number" size="small" value={fila.stock_minimo ?? formData.stock_minimo ?? 0} onChange={(e) => actualizarStock(sede.id, 'stock_minimo', e.target.value)} disabled={!controla} slotProps={{ htmlInput: { min: 0, 'aria-label': `Stock mínimo en ${sede.nombre}` } }} sx={{ width: 110 }} />
                    </TableCell>
                    <TableCell>{conLotes ? lotesDe(sede.id).length : '—'}</TableCell>
                    <TableCell>{vence ? fechaCorta(vence) : '—'}</TableCell>
                    <TableCell>{chipEstado(estadoSede({ controla, conLotes, conKardex, stock, minimo }), ayuda)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {conLotes ? (
        <Box sx={cajaSeccion}>
          {encabezadoSeccion(
            <LayersOutlinedIcon sx={{ fontSize: 18 }} />,
            'Lotes y vencimientos',
            'Un lote nuevo en una sede con movimientos entra como ENTRADA en el Kardex. Para bajar stock usa BAJA en Movimientos / Kardex.',
            <Button size="small" startIcon={<AddOutlinedIcon />} onClick={agregarLote} sx={dbanuStyles.addButtonRevive}>Agregar lote</Button>,
          )}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  {['Sede', 'Código lote', 'Elaboración', 'Vencimiento', 'Cantidad', 'Estado', ''].map((titulo, i) => <TableCell key={i} sx={celdaEncabezado}>{titulo}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {lotes.map((lote, indice) => {
                  const bloqueado = loteBloqueado(lote);
                  return (
                    <TableRow key={lote.id || `nuevo-${indice}`} hover>
                      <TableCell sx={{ minWidth: 160 }}>
                        {bloqueado || lote.id ? <Typography variant="body2">{lote.sede_nombre || sedes.find((s) => Number(s.id) === Number(lote.sede_id))?.nombre}</Typography>
                          : <TextField select size="small" fullWidth value={lote.sede_id || ''} onChange={(e) => actualizarLote(indice, 'sede_id', e.target.value)}>{sedes.map((sede) => <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>)}</TextField>}
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}><TextField size="small" fullWidth value={lote.codigo_lote || ''} onChange={(e) => actualizarLote(indice, 'codigo_lote', e.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Código de lote' } }} /></TableCell>
                      <TableCell sx={{ minWidth: 150 }}><TextField type="date" size="small" fullWidth value={(lote.fecha_elaboracion || '').slice(0, 10)} onChange={(e) => actualizarLote(indice, 'fecha_elaboracion', e.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Fecha de elaboración' } }} /></TableCell>
                      <TableCell sx={{ minWidth: 150 }}><TextField type="date" size="small" fullWidth value={(lote.fecha_vencimiento || '').slice(0, 10)} onChange={(e) => actualizarLote(indice, 'fecha_vencimiento', e.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Fecha de vencimiento' } }} /></TableCell>
                      <TableCell sx={{ width: 120 }}>
                        {bloqueado ? <Typography variant="body2" fontWeight={800}>{numero(lote.stock_actual)}</Typography>
                          : <TextField type="number" size="small" value={lote.stock_actual ?? 0} onChange={(e) => actualizarLote(indice, 'cantidad', e.target.value)} slotProps={{ htmlInput: { min: 0, 'aria-label': 'Cantidad del lote' } }} sx={{ width: 100 }} />}
                      </TableCell>
                      <TableCell>
                        {bloqueado ? chipEstado({ texto: 'Con movimientos', icono: <LockOutlinedIcon />, color: '#475569', fondo: '#f1f5f9' }, 'Su stock cambia solo con movimientos de Kardex.')
                          : lote.estado_nombre ? <Chip size="small" label={lote.estado_nombre} color={colorEstado(lote.estado_color)} variant="outlined" />
                            : chipEstado({ texto: 'Nuevo', icono: <EditNoteOutlinedIcon />, color: '#166534', fondo: '#f0fdf4' }, 'Se guarda al pulsar Guardar.')}
                      </TableCell>
                      <TableCell align="right">
                        {bloqueado ? null : <Tooltip title="Quitar lote"><IconButton sx={dbanuStyles.actionDelete} onClick={() => quitarLote(indice)} aria-label="Quitar lote"><DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {lotes.length === 0 ? <TableRow><TableCell colSpan={7} align="center"><Typography variant="caption" color="text.secondary">No hay lotes agregados.</Typography></TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
