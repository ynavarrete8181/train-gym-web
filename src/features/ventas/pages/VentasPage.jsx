import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Box, Button, IconButton, Paper, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { VentaPosFormulario } from '../components/VentaPosFormulario.jsx';
import { ventaServicio } from '../services/ventaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : 'Sin fecha';
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
const opcionesEstados = (valores = []) => valores.map((item) => ({ value: String(item.valor_interno), label: String(item.nombre || item.valor_interno) }));
const estadoTexto = (valor) => String(valor || '').toLowerCase().replace('pagada', 'activo').replace('emitido', 'activo');

export function VentasPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventaServicio.obtenerVentas(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.mensaje || 'Error al cargar ventas.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const buscar = (params) => {
    const nuevos = { ...params, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltro = (columna, valor) => {
    const columnas = { ...filtrosColumna, [columna]: valor };
    const nuevos = { ...filtros, ...columnas, [columna]: valor, page: 1 };
    setFiltrosColumna(columnas);
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const columnas = useMemo(() => {
    const filtro = (key, label, opts) => <FilterHeaderCell key={key} value={filtrosColumna[key]} onChange={(value) => aplicarFiltro(key, value)} options={opts}>{label}</FilterHeaderCell>;
    return [
      { key: 'numero', header: filtro('numero', 'Venta', opciones(meta.opciones_filtro?.numero)), render: (item) => <Box><Typography variant="body2" fontWeight={700}>{item.numero}</Typography><Typography variant="caption" color="text.secondary">{fecha(item.fecha_venta)}</Typography></Box> },
      { key: 'cliente', header: filtro('cliente', 'Cliente', opciones(meta.opciones_filtro?.cliente)), render: (item) => item.cliente_nombre || 'Consumidor final' },
      { key: 'concepto', header: <TableCell key="concepto">Concepto</TableCell>, render: (item) => item.concepto },
      { key: 'tipo', header: filtro('tipo', 'Tipo', opciones(meta.opciones_filtro?.tipo)), render: (item) => item.tipo_venta },
      { key: 'total', header: <TableCell key="total">Total</TableCell>, render: (item) => dinero(item.total) },
      { key: 'estado', header: filtro('estado', 'Estado', opcionesEstados(meta.catalogos?.estados_venta || [])), render: (item) => <StatusChip estado={estadoTexto(item.estado_nombre || item.estado)} /> },
    ];
  }, [meta, filtrosColumna]);

  if (vista === 'pos') {
    return <VentaPosFormulario onVolver={() => setVista('lista')} onGuardado={() => { setVista('lista'); cargar({ ...filtros, page: 1 }); }} />;
  }

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Ventas" descripcion="Facturación y punto de venta de servicios, productos y operaciones comerciales." icono={<ShoppingCartOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || items.length}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => setVista('pos')} sx={dbanuStyles.addButtonRevive}>Nueva venta</Button>}
        />
        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5}
          onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }}
          onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }}
          cargando={cargando}
        >
          <TableHead><TableRow>{columnas.map((columna) => columna.header)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => <TableRow key={item.id} hover>{columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}<TableCell align="right"><Tooltip title="Detalle disponible en la siguiente iteración"><span><IconButton size="small" disabled><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip></TableCell></TableRow>)}
            {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto="No hay ventas para los filtros aplicados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))} />
    </Box>
  );
}
