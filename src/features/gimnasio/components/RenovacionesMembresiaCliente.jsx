import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Stack,
  TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { DialogRenovacionMembresia } from './DialogRenovacionMembresia.jsx';
import { ComoSeRenueva } from './ComoSeRenueva.jsx';
import { DialogDetalleRenovacion } from './DialogDetalleRenovacion.jsx';

const fecha = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : '—';
const importe = value => value == null ? '—' :
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value));

/** Listado real de renovaciones, con alta y detalle internos al Paper 2. */
const COLUMNAS_RENOVACIONES = {
  fecha: (item) => fecha(item.fecha),
  periodo: (item) => String(item.detalle?.numero_periodo_nuevo ?? '—'),
  vigencia: (item) => `${fecha(item.detalle?.fecha_inicio)} – ${fecha(item.detalle?.fecha_fin)}`,
  importe: (item) => importe(item.detalle?.precio),
};
const OPCIONES_RENOVACIONES = { sinOrdenar: ['fecha', 'vigencia'] };

export function RenovacionesMembresiaCliente({ membresia, onActualizado }) {
  const [historial, setHistorial] = useState([]);
  const [anulaciones, setAnulaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState('listado');
  const [seleccionada, setSeleccionada] = useState(null);
  const id = membresia?.id;
  const esPaseDiario = String(membresia?.plan_tipo_producto || membresia?.tipo_producto || '').toUpperCase() === 'PASE_DIARIO';
  const estadoContrato = String(membresia?.estado || '').toUpperCase();
  const puedeRenovar = estadoContrato === 'ACTIVA' && membresia?.cantidad_periodos_contratados != null;
  const motivoBloqueo = estadoContrato !== 'ACTIVA'
    ? 'La membresía debe estar activa para renovarse.'
    : 'Este contrato no admite renovación manual por períodos.';

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError('');
    try {
      const respuesta = await gimnasioServicio.obtenerHistorialIntegralMembresia(id);
      const eventos = respuesta?.eventos || [];
      setHistorial(eventos.filter(item => ['RENOVACION_MANUAL', 'RENOVACION_AUTOMATICA'].includes(item.tipo)));
      setAnulaciones(eventos.filter(item => item.tipo === 'RENOVACION_ANULADA' && item.categoria !== 'OPERATIVO'));
    } catch (e) {
      setError(e?.response?.data?.mensaje || 'No se pudo consultar el historial de renovaciones.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    setVista('listado');
    setSeleccionada(null);
    setBusqueda('');
    cargar();
  }, [cargar]);

  const filtradas = useMemo(() => historial.filter(item => [
    item.fecha, item.autor_nombre, item.motivo,
    item.detalle?.numero_periodo_nuevo, item.detalle?.fecha_inicio, item.detalle?.fecha_fin,
  ].some(valor => String(valor || '').toLowerCase().includes(busqueda.toLowerCase()))), [historial, busqueda]);
  const tabla = useTablaLocal(filtradas, COLUMNAS_RENOVACIONES, OPCIONES_RENOVACIONES);
  const { visibles } = tabla;

  const anulacionDe = (item) => anulaciones.find((a) => Number(a.detalle?.periodo_id) === Number(item?.detalle?.periodo_id));
  // Solo la última renovación vigente, aún programada y sin venta, se puede anular.
  const ultimaVigente = [...historial].filter((item) => !anulacionDe(item))
    .sort((a, b) => Number(b.detalle?.numero_periodo_nuevo || 0) - Number(a.detalle?.numero_periodo_nuevo || 0))[0];
  const periodoDe = (item) => (membresia?.periodos || []).find((p) => Number(p.id) === Number(item?.detalle?.periodo_id));
  const puedeAnular = (item) => {
    if (!item || anulacionDe(item) || item !== ultimaVigente) return false;
    const p = periodoDe(item);
    return !p || (String(p.estado || '').toUpperCase() === 'PROGRAMADO' && !p.venta_id);
  };

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    {!esPaseDiario && <ComoSeRenueva membresia={membresia} onActualizado={onActualizado} />}
    {/* Renovar a mano: pocos datos, en un modal sobre el listado. */}
    <DialogRenovacionMembresia
      abierto={vista === 'formulario'} membresia={membresia}
      onCerrar={() => setVista('listado')}
      onActualizado={async () => {
        await onActualizado?.();
        await cargar();
      }} />
    <DialogDetalleRenovacion renovacion={vista === 'detalle' ? seleccionada : null}
      anulacion={anulacionDe(seleccionada)} puedeAnular={puedeAnular(seleccionada)} membresia={membresia}
      onCerrar={() => { setSeleccionada(null); setVista('listado'); }}
      onAnulada={async () => { setSeleccionada(null); setVista('listado'); await onActualizado?.(); await cargar(); }} />
    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
    {cargando && <Stack direction="row" gap={1} sx={{ alignItems: 'center', mb: 1 }}>
      <CircularProgress size={18}/><Typography variant="body2">Consultando renovaciones…</Typography>
    </Stack>}
    <GestionToolbar total={filtradas.length} busqueda={busqueda}
      onBusqueda={setBusqueda}
      acciones={<Tooltip title={puedeRenovar ? 'Añadir renovación' : motivoBloqueo}>
        <span><Button startIcon={<AddOutlinedIcon />} disabled={!puedeRenovar}
          onClick={() => setVista('formulario')}>Añadir</Button></span>
      </Tooltip>} />
    <TablaGestion {...tabla.propsTabla} total={historial.length} cargando={cargando}>
      <TableHead><TableRow>
        <FilterHeaderCell {...tabla.filtro('fecha')}>Fecha</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('periodo')}>Período</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('vigencia')}>Vigencia</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('importe')}>Importe</FilterHeaderCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {visibles.map((item, index) => {
          const d = item.detalle || {};
          return <TableRow key={item.id || index} hover>
            <TableCell>{fecha(item.fecha)}</TableCell>
            <TableCell>{d.numero_periodo_nuevo ?? '—'}</TableCell>
            <TableCell>{fecha(d.fecha_inicio)} – {fecha(d.fecha_fin)}</TableCell>
            <TableCell>{importe(d.precio)}{anulacionDe(item) ? <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>· Anulada</Typography> : null}</TableCell>
            <TableCell align="center"><Tooltip title="Ver renovación">
              <IconButton aria-label="Ver renovación" size="small" sx={dbanuStyles.actionView}
                onClick={() => { setSeleccionada(item); setVista('detalle'); }}>
                <VisibilityOutlinedIcon sx={{ fontSize: 18 }}/>
              </IconButton>
            </Tooltip></TableCell>
          </TableRow>;
        })}
        {!cargando && !visibles.length && <TableRow>
          <TableCell colSpan={5} align="center">
            {historial.length ? 'Sin renovaciones coincidentes.' : 'Este contrato no tiene renovaciones registradas.'}
          </TableCell>
        </TableRow>}
      </TableBody>
    </TablaGestion>
    {!puedeRenovar && <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
      {motivoBloqueo}
    </Typography>}
  </Box>;
}
