import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { Avatar, Box, Button, Chip, Divider, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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
              <Formulario tipo={tipo} formData={formData} catalogos={catalogos} onChange={handleChange} setFormData={setFormData} onNotificar={showNotificacion} />
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
    return <Box sx={grid}><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /></Box>;
  }

  if (tipo === 'proveedores') {
    return <Box sx={grid}><TextField label="RUC" name="ruc" value={formData.ruc || ''} onChange={onChange} size="small" /><TextField label="Nombre" name="nombre" value={formData.nombre || ''} onChange={onChange} required size="small" /><TextField label="Teléfono" name="telefono" value={formData.telefono || ''} onChange={onChange} size="small" /><TextField label="Email" name="email" value={formData.email || ''} onChange={onChange} size="small" /><FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" /><TextField label="Dirección" name="direccion" value={formData.direccion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} /></Box>;
  }

  if (tipo === 'productos') {
    const sedes = catalogos.sedes || [];
    const actualizarSede = (clave, sedeId, campo, valor) => {
      setFormData((actual) => ({
        ...actual,
        [clave]: (actual[clave] || []).map((fila) => Number(fila.sede_id) === Number(sedeId) ? { ...fila, [campo]: valor } : fila),
      }));
    };
    const agregarLote = () => setFormData((actual) => ({
      ...actual,
      lotes: [...(actual.lotes || []), { id: null, sede_id: sedes[0]?.id || '', codigo_lote: '', fecha_elaboracion: '', fecha_vencimiento: '', cantidad_inicial: 0, stock_actual: 0, costo_unitario: '', activo: true }],
    }));
    const actualizarLote = (indice, campo, valor) => setFormData((actual) => ({
      ...actual,
      lotes: (actual.lotes || []).map((lote, i) => i === indice ? { ...lote, [campo]: valor } : lote),
    }));
    const quitarLote = (indice) => setFormData((actual) => ({ ...actual, lotes: (actual.lotes || []).filter((_, i) => i !== indice) }));

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
          <TextField label="Stock mínimo base" name="stock_minimo" type="number" value={formData.stock_minimo || 0} onChange={onChange} required size="small" />
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
                <Stack alignItems="center" spacing={.6} sx={{ color: 'text.secondary' }}>
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
          <FormControlLabel control={<Switch name="controla_stock" checked={Boolean(formData.controla_stock)} onChange={onChange} />} label="Controla stock" />
          <FormControlLabel control={<Switch name="maneja_lotes" checked={Boolean(formData.maneja_lotes)} onChange={onChange} />} label="Maneja lotes / vencimiento" />
          <FormControlLabel control={<Switch name="activo" checked={Boolean(formData.activo)} onChange={onChange} />} label="Activo" />
          <TextField label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onChange} size="small" multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }} />
        </Box>

        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 1.6, py: 1.1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" fontWeight={900}>Precios y stock por sede</Typography>
            <Typography variant="caption" color="text.secondary">Cada sede puede vender al precio configurado y mantener su propio inventario.</Typography>
          </Box>
          <Stack divider={<Divider flexItem />} sx={{ px: 1.4 }}>
            {sedes.map((sede) => {
              const precio = (formData.precios_sede || []).find((x) => Number(x.sede_id) === Number(sede.id)) || {};
              const stock = (formData.stocks_sede || []).find((x) => Number(x.sede_id) === Number(sede.id)) || {};
              return (
                <Box key={sede.id} sx={{ py: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(180px,1.4fr) 1fr 1fr 1fr' }, gap: 1, alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={900}>{sede.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">Operación comercial e inventario</Typography>
                  </Box>
                  <TextField label="Precio venta" type="number" size="small" value={precio.precio ?? formData.precio_venta ?? 0} onChange={(e) => actualizarSede('precios_sede', sede.id, 'precio', e.target.value)} />
                  <TextField label="Stock actual" type="number" size="small" value={stock.stock_actual ?? 0} onChange={(e) => actualizarSede('stocks_sede', sede.id, 'stock_actual', e.target.value)} disabled={!formData.controla_stock} />
                  <TextField label="Stock mínimo" type="number" size="small" value={stock.stock_minimo ?? formData.stock_minimo ?? 0} onChange={(e) => actualizarSede('stocks_sede', sede.id, 'stock_minimo', e.target.value)} disabled={!formData.controla_stock} />
                </Box>
              );
            })}
          </Stack>
        </Box>

        {formData.maneja_lotes ? (
          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 1.6, py: 1.1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={900}>Lotes y vencimientos</Typography>
                <Typography variant="caption" color="text.secondary">Opcional para bebidas, suplementos u otros productos con trazabilidad por lote.</Typography>
              </Box>
              <Button size="small" startIcon={<AddOutlinedIcon />} onClick={agregarLote} sx={dbanuStyles.addButtonRevive}>Añadir lote</Button>
            </Box>
            <Stack divider={<Divider flexItem />} sx={{ px: 1.4 }}>
              {(formData.lotes || []).map((lote, indice) => (
                <Box key={lote.id || `nuevo-${indice}`} sx={{ py: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr 1fr 1fr 1fr 1fr auto' }, gap: 1, alignItems: 'center' }}>
                  <TextField select label="Sede" size="small" value={lote.sede_id || ''} onChange={(e) => actualizarLote(indice, 'sede_id', e.target.value)}>{sedes.map((sede) => <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>)}</TextField>
                  <TextField label="Código lote" size="small" value={lote.codigo_lote || ''} onChange={(e) => actualizarLote(indice, 'codigo_lote', e.target.value)} />
                  <TextField label="Fecha elaboración" type="date" size="small" value={lote.fecha_elaboracion || ''} onChange={(e) => actualizarLote(indice, 'fecha_elaboracion', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Vencimiento" type="date" size="small" value={lote.fecha_vencimiento || ''} onChange={(e) => actualizarLote(indice, 'fecha_vencimiento', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Cantidad inicial" type="number" size="small" value={lote.cantidad_inicial ?? 0} onChange={(e) => actualizarLote(indice, 'cantidad_inicial', e.target.value)} />
                  <TextField label="Stock lote" type="number" size="small" value={lote.stock_actual ?? 0} onChange={(e) => actualizarLote(indice, 'stock_actual', e.target.value)} />
                  <Button size="small" color="error" onClick={() => quitarLote(indice)}>Quitar</Button>
                </Box>
              ))}
              {(formData.lotes || []).length === 0 ? <Typography variant="caption" color="text.secondary" sx={{ py: 1.4 }}>Sin lotes registrados.</Typography> : null}
            </Stack>
          </Box>
        ) : null}
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
          {lotesDisponibles.map((lote) => <MenuItem key={lote.id} value={lote.id}>{lote.codigo_lote} · {lote.sede_nombre} · stock {numero(lote.stock_actual)}{lote.fecha_vencimiento ? ` · vence ${lote.fecha_vencimiento}` : ''}</MenuItem>)}
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
    { key: 'producto', header: filtro('producto', 'Producto', opciones(meta.opciones_filtro?.producto)), render: (item) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Avatar variant="rounded" src={item.imagen_url || undefined} sx={{ width: 34, height: 44, bgcolor: '#f3f4f6' }}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></Avatar><Box><Typography variant="body2" fontWeight="700">{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo} · {item.marca || 'Sin marca'}</Typography></Box></Box> },
    { key: 'categoria', header: filtro('categoria', 'Categoría', opciones(meta.opciones_filtro?.categoria)), render: (item) => item.categoria_nombre || 'Sin categoría' },
    { key: 'sedes', header: <TableCell key="sedes">Precio / stock por sede</TableCell>, render: (item) => <Stack spacing={.25}>{(item.precios_sede || []).map((precio) => { const stock = (item.stocks_sede || []).find((x) => Number(x.sede_id) === Number(precio.sede_id)); return <Typography key={precio.sede_id} variant="caption"><b>{precio.sede_nombre}:</b> {dinero(precio.precio)} · stock {numero(stock?.stock_actual || 0)}</Typography>; })}</Stack> },
    { key: 'lotes', header: <TableCell key="lotes">Lotes</TableCell>, render: (item) => item.maneja_lotes ? <Chip size="small" label={`${(item.lotes || []).length} activos`} variant="outlined" /> : <Typography variant="caption" color="text.secondary">No aplica</Typography> },
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
      return actual || { sede_id: sede.id, sede_nombre: sede.nombre, stock_actual: stockDefecto, stock_minimo: Number(base.stock_minimo || 0) };
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
