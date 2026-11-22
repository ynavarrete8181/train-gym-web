import { useEffect, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { cobrosPeriodoServicio } from '../services/ventas/cobrosPeriodoServicio.js';
import { ventasResponsableServicio } from '../services/ventas/ventasResponsableServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const METODOS = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', DEPOSITO: 'Depósito' };
const metodoTexto = (valor) => String(valor || '').split(', ').map((m) => METODOS[m] || m).join(', ');

function Tarjeta({ titulo, valor, detalle, color }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, borderLeft: `4px solid ${color}`, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color, fontSize: { xs: 16, md: 19 } }} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{detalle}</Typography>
    </Box>
  );
}

/** Cobros de una persona en el período, para revisar en detalle lo que recibió. */
function DialogCobrosUsuario({ fila, filtros, onCerrar }) {
  const [cobros, setCobros] = useState([]);
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    if (!fila) return;
    setCargando(true);
    cobrosPeriodoServicio.consultarTodo({ desde: filtros.desde, hasta: filtros.hasta, sede_id: filtros.sede_id, columnas: { cajero: [fila.usuario] } })
      .then((filas) => setCobros(filas || []))
      .finally(() => setCargando(false));
  }, [fila]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!fila) return null;
  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="md" slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}>
      <DialogTitle sx={{ ...formStyles.modalHeader, py: 1.25 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>Cobros de {fila.usuario}</Typography>
          <Typography variant="caption" color="text.secondary">
            {fecha(filtros.desde)} al {fecha(filtros.hasta)} · {fila.cobros} cobros · {dinero(fila.total_cobrado)} (efectivo {dinero(fila.efectivo)}, transferencia {dinero(fila.transferencia)})
          </Typography>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2 }}>
        {cargando ? <Typography variant="body2">Cargando cobros…</Typography> : cobros.length === 0
          ? <Alert severity="info">No hay cobros en estas fechas.</Alert>
          : (
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Fecha</TableCell><TableCell>Cobro</TableCell><TableCell>Pagado por</TableCell>
                <TableCell>Pago</TableCell><TableCell align="right">Total</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {cobros.map((c) => (
                  <TableRow key={c.operacion}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fecha(c.fecha)} {c.hora}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.codigo_cobro || '—'}</TableCell>
                    <TableCell>{c.pagado_por}</TableCell>
                    <TableCell>
                      {metodoTexto(c.metodo_pago)}
                      {(c.referencia || c.banco) && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{[c.referencia, c.banco].filter(Boolean).join(' · ')}</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{dinero(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </DialogContent>
      <Divider />
      <DialogActions sx={dbanuStyles.dialogActions}><BotonCancelar texto="Cerrar" onClick={onCerrar} /></DialogActions>
    </Dialog>
  );
}

/** Ventas y cobros por usuario: cuánto registró y cuánto cobró cada persona; "Sistema" agrupa lo automático. */
export function VentasResponsablePage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [filtros, setFiltros] = useState({
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventasResponsableServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const resumen = meta.resumen || {};
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Ventas y cobros por usuario" descripcion="Cuánto registró y cuánto cobró cada persona, en efectivo y transferencia."
        icono={<GroupsOutlinedIcon />} />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda=""
          mostrarBusqueda={false}
          mostrarTotal={false}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Ventas y cobros por usuario"
                descripcion="Ventas registradas y dinero cobrado por cada usuario, en efectivo y transferencia."
                filtros={filtros}
                columnas={[
                  { label: 'Usuario', value: 'usuario', align: 'left' },
                  { label: 'Rol', value: 'rol', align: 'left' },
                  { label: 'Ventas', value: 'ventas' },
                  { label: 'Vendido', value: (f) => dinero(f.total_ventas) },
                  { label: 'Cobros', value: 'cobros' },
                  { label: 'Cobrado', value: (f) => dinero(f.total_cobrado) },
                  { label: 'Efectivo', value: (f) => dinero(f.efectivo) },
                  { label: 'Transferencia', value: (f) => dinero(f.transferencia) },
                ]}
                obtenerFilas={() => ventasResponsableServicio.consultarTodo(filtros)}
                exportarExcel={() => ventasResponsableServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Vendido" valor={dinero(resumen.total_ventas)} detalle={`${resumen.ventas || 0} ventas registradas`} color={uiTokens.colores.primario} />
          <Tarjeta titulo="Cobrado" valor={dinero(resumen.total_cobrado)} detalle={`${resumen.cobros || 0} cobros`} color={uiTokens.colores.exito} />
          <Tarjeta titulo="Efectivo" valor={dinero(resumen.efectivo)} detalle="Dinero recibido en mano" color={uiTokens.colores.acentoOscuro} />
          <Tarjeta titulo="Transferencia" valor={dinero(resumen.transferencia)} detalle="Transferencias y depósitos" color={uiTokens.colores.info} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('usuario', 'Usuario')}
              {columna('ventas', 'Ventas', { align: 'center' })}
              {columna('total_ventas', 'Vendido', { align: 'center', formato: dinero })}
              {columna('cobros', 'Cobros', { align: 'center' })}
              {columna('total_cobrado', 'Cobrado', { align: 'center', formato: dinero })}
              {columna('efectivo', 'Efectivo', { align: 'center', formato: dinero })}
              {columna('transferencia', 'Transferencia', { align: 'center', formato: dinero })}
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.usuario_id ?? 'sistema'} hover>
                <TableCell>
                  <Box sx={{ fontSize: 'inherit', fontWeight: 700 }}>{item.usuario}</Box>
                  <Typography variant="caption" color="text.secondary">{item.rol}</Typography>
                </TableCell>
                <TableCell align="center">{item.ventas}</TableCell>
                <TableCell align="center">{dinero(item.total_ventas)}</TableCell>
                <TableCell align="center">{item.cobros}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: 'success.dark' }}>{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.efectivo)}</TableCell>
                <TableCell align="center">{dinero(item.transferencia)}</TableCell>
                <TableCell align="center">
                  {Number(item.cobros) > 0 ? (
                    <Tooltip title="Ver sus cobros">
                      <IconButton aria-label="Ver sus cobros" size="small" sx={dbanuStyles.actionView} onClick={() => setDetalle(item)}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  ) : <Typography variant="caption" color="text.secondary">Sin cobros</Typography>}
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay ventas ni cobros para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
      <DialogCobrosUsuario fila={detalle} filtros={filtros} onCerrar={() => setDetalle(null)} />
    </Box>
  );
}
