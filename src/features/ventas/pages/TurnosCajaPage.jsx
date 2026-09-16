import { useEffect, useMemo, useState } from 'react';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Button, MenuItem, Paper, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fechaHora = (valor) => valor ? new Date(valor).toLocaleString('es-EC') : '—';
const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));

export function TurnosCajaPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [formApertura, setFormApertura] = useState({ caja_id: '', saldo_inicial: 0, observaciones: '' });
  const [turnoCerrar, setTurnoCerrar] = useState(null);
  const [formCierre, setFormCierre] = useState({ efectivo_contado: '', observaciones: '' });

  const showNotificacion = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventaServicio.obtenerTurnosCaja(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      setCatalogos(response.meta?.catalogos || {});
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al cargar los turnos de caja', 'error');
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

  const abrirFormulario = () => {
    setFormApertura({ caja_id: '', saldo_inicial: 0, observaciones: '' });
    setVista('abrir');
  };

  const abrirTurno = async () => {
    if (!formApertura.caja_id) {
      showNotificacion('Selecciona una caja.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await ventaServicio.abrirTurnoCaja({
        caja_id: Number(formApertura.caja_id),
        saldo_inicial: Number(formApertura.saldo_inicial || 0),
        observaciones: formApertura.observaciones || null,
      });
      showNotificacion('Turno de caja abierto correctamente.', 'success');
      setVista('lista');
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo abrir el turno de caja.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const prepararCierre = (turno) => {
    setTurnoCerrar(turno);
    setFormCierre({ efectivo_contado: '', observaciones: '' });
    setVista('cerrar');
  };

  const cerrarTurno = async () => {
    if (formCierre.efectivo_contado === '') {
      showNotificacion('Ingresa el efectivo contado.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await ventaServicio.cerrarTurnoCaja(turnoCerrar.id, {
        efectivo_contado: Number(formCierre.efectivo_contado),
        observaciones: formCierre.observaciones || null,
      });
      showNotificacion('Turno de caja cerrado correctamente.', 'success');
      setVista('lista');
      setTurnoCerrar(null);
      cargar();
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'No se pudo cerrar el turno de caja.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const columnas = useMemo(() => {
    const filtro = (key, label, opts) => (
      <FilterHeaderCell key={key} value={filtrosColumna[key]} onChange={(v) => aplicarFiltro(key, v)} options={opts}>{label}</FilterHeaderCell>
    );
    return [
      { key: 'caja', header: filtro('caja', 'Caja', opciones(meta.opciones_filtro?.caja)), render: (item) => <Box><Typography variant="body2" fontWeight={600}>{item.caja_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.caja_codigo}</Typography></Box> },
      { key: 'sede', header: filtro('sede', 'Sede', opciones(meta.opciones_filtro?.sede)), render: (item) => item.sede_nombre },
      { key: 'cajero', header: filtro('cajero', 'Cajero', opciones(meta.opciones_filtro?.cajero)), render: (item) => item.cajero_nombre },
      { key: 'apertura', header: <TableCell key="apertura">Apertura</TableCell>, render: (item) => fechaHora(item.fecha_apertura) },
      { key: 'cierre', header: <TableCell key="cierre">Cierre</TableCell>, render: (item) => fechaHora(item.fecha_cierre) },
      { key: 'inicial', header: <TableCell key="inicial">Saldo inicial</TableCell>, render: (item) => dinero(item.saldo_inicial) },
      { key: 'diferencia', header: <TableCell key="diferencia">Diferencia</TableCell>, render: (item) => item.diferencia === null ? '—' : dinero(item.diferencia) },
      { key: 'estado', header: filtro('estado', 'Estado', [{ value: 'ABIERTA', label: 'Abierta' }, { value: 'CERRADA', label: 'Cerrada' }]), render: (item) => <StatusChip estado={item.estado === 'ABIERTA' ? 'activo' : 'cerrado'} /> },
    ];
  }, [meta, filtrosColumna]);

  if (vista === 'abrir') {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo="Abrir turno de caja" descripcion="Inicia una sesión operativa para registrar cobros y ventas del turno." icono={<LockOpenOutlinedIcon />} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#f6f8fc', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Datos de apertura</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                <TextField select label="Caja *" value={formApertura.caja_id} onChange={(e) => setFormApertura((a) => ({ ...a, caja_id: e.target.value }))} size="small">
                  {(catalogos.cajas || []).map((caja) => <MenuItem key={caja.id} value={caja.id}>{caja.codigo} - {caja.nombre}</MenuItem>)}
                </TextField>
                <TextField label="Saldo inicial *" type="number" value={formApertura.saldo_inicial} onChange={(e) => setFormApertura((a) => ({ ...a, saldo_inicial: e.target.value }))} size="small" inputProps={{ min: 0, step: '0.01' }} />
                <TextField label="Observaciones de apertura" value={formApertura.observaciones} onChange={(e) => setFormApertura((a) => ({ ...a, observaciones: e.target.value }))} multiline minRows={2} size="small" sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} />
              </Box>
            </Box>
          </Box>
          <AccionesFormulario onCancelar={() => setVista('lista')} onGuardar={abrirTurno} guardando={guardando} textoGuardar="Abrir caja" />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  if (vista === 'cerrar' && turnoCerrar) {
    return (
      <Box className="page-wrapper">
        <PageHeader titulo="Cerrar turno de caja" descripcion="Registra el efectivo contado y confirma el cierre del turno." icono={<LockOutlinedIcon />} acciones={<BotonVolver onClick={() => setVista('lista')} />} />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#f6f8fc', px: 2.5, py: 2.5 }}>
            <Box sx={formStyles.seccion}>
              <Typography sx={formStyles.modalSeccionTitulo}>Resumen del turno</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                <TextField label="Caja" value={turnoCerrar.caja_nombre || ''} size="small" disabled />
                <TextField label="Sede" value={turnoCerrar.sede_nombre || ''} size="small" disabled />
                <TextField label="Saldo inicial" value={dinero(turnoCerrar.saldo_inicial)} size="small" disabled />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                <TextField label="Efectivo contado *" type="number" value={formCierre.efectivo_contado} onChange={(e) => setFormCierre((a) => ({ ...a, efectivo_contado: e.target.value }))} size="small" inputProps={{ min: 0, step: '0.01' }} />
                <TextField label="Observaciones de cierre" value={formCierre.observaciones} onChange={(e) => setFormCierre((a) => ({ ...a, observaciones: e.target.value }))} size="small" />
              </Box>
            </Box>
          </Box>
          <AccionesFormulario onCancelar={() => setVista('lista')} onGuardar={cerrarTurno} guardando={guardando} textoGuardar="Cerrar turno" />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
      </Box>
    );
  }

  const turnoActual = catalogos.turno_abierto;

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Turnos de caja" descripcion="Apertura, operación y cierre de las sesiones de caja por cajero y sede." icono={<AccessTimeOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        {turnoActual?.id ? (
          <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Turno abierto</Typography>
              <Typography variant="body2" color="text.secondary">{turnoActual.caja_nombre} · {turnoActual.sede_nombre} · desde {fechaHora(turnoActual.fecha_apertura)}</Typography>
            </Box>
            <Button variant="outlined" color="error" startIcon={<LockOutlinedIcon />} onClick={() => prepararCierre(turnoActual)}>Cerrar turno</Button>
          </Box>
        ) : null}
        <GestionToolbar total={meta.total || items.length} busqueda={filtros.busqueda} onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })} acciones={!turnoActual?.id ? <Button startIcon={<LockOpenOutlinedIcon />} onClick={abrirFormulario} sx={dbanuStyles.addButtonRevive}>Abrir turno</Button> : null} />
        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1} rowsPerPage={meta.por_pagina || 5} onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }} onRowsPerPageChange={(perPage) => { const nuevos = { ...filtros, page: 1, per_page: perPage }; setFiltros(nuevos); cargar(nuevos); }} cargando={cargando}>
          <TableHead><TableRow>{columnas.map((columna) => columna.header)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => <TableRow key={item.id} hover>{columnas.map((columna) => <TableCell key={columna.key}>{columna.render(item)}</TableCell>)}<TableCell align="right">{item.estado === 'ABIERTA' ? <Tooltip title="Cerrar turno"><Button size="small" variant="outlined" color="error" onClick={() => prepararCierre(item)}>Cerrar</Button></Tooltip> : '—'}</TableCell></TableRow>)}
            {items.length === 0 ? <TablaEstadoFila colSpan={columnas.length + 1} cargando={cargando} texto="No hay turnos de caja registrados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: '' })} />
    </Box>
  );
}
