import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Stack,
  TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { DialogRenovacionMembresia } from './DialogRenovacionMembresia.jsx';

const fecha = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : '—';
const importe = value => value == null ? '—' :
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value));

/** Listado real de renovaciones, con alta y detalle internos al Paper 2. */
export function RenovacionesMembresiaCliente({ membresia, onActualizado }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [vista, setVista] = useState('listado');
  const [seleccionada, setSeleccionada] = useState(null);
  const id = membresia?.id;
  const congelada = String(membresia?.estado || '').toUpperCase() === 'CONGELADA';
  const puedeRenovar = membresia?.cantidad_periodos_contratados != null && !congelada;

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError('');
    try {
      const respuesta = await gimnasioServicio.obtenerHistorialIntegralMembresia(id);
      setHistorial((respuesta?.eventos || []).filter(item => item.tipo === 'RENOVACION_MANUAL'));
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
    setPagina(1);
    cargar();
  }, [cargar]);

  const filtradas = useMemo(() => historial.filter(item => [
    item.fecha, item.autor_nombre, item.motivo,
    item.detalle?.numero_periodo_nuevo, item.detalle?.fecha_inicio, item.detalle?.fecha_fin,
  ].some(valor => String(valor || '').toLowerCase().includes(busqueda.toLowerCase()))), [historial, busqueda]);
  const paginaActual = Math.max(1, Math.min(pagina, Math.ceil(filtradas.length / porPagina) || 1));
  const visibles = filtradas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  if (vista === 'formulario') return <DialogRenovacionMembresia
    abierto membresia={membresia} integrado
    onCerrar={() => setVista('listado')}
    onActualizado={async () => {
      await onActualizado?.();
      await cargar();
    }} />;

  if (vista === 'detalle' && seleccionada) {
    const d = seleccionada.detalle || {};
    return <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Detalle de renovación</Typography>
        <BotonVolver onClick={() => { setSeleccionada(null); setVista('listado'); }}/>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
        {[
          ['Fecha del movimiento', fecha(seleccionada.fecha)],
          ['Responsable', seleccionada.autor_nombre || 'Sistema / no disponible'],
          ['Período agregado', d.numero_periodo_nuevo ?? '—'],
          ['Fecha de inicio', fecha(d.fecha_inicio)],
          ['Fecha de finalización', fecha(d.fecha_fin)],
          ['Importe registrado', importe(d.precio)],
        ].map(([titulo, valor]) => <Box key={titulo}>
          <Typography variant="caption" color="text.secondary">{titulo}</Typography>
          <Typography variant="body2" fontWeight={800}>{valor}</Typography>
        </Box>)}
      </Box>
      {seleccionada.motivo && <Typography variant="body2" sx={{ mt: 2 }}>
        {seleccionada.motivo}
      </Typography>}
    </Box>;
  }

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
    {cargando && <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
      <CircularProgress size={18}/><Typography variant="body2">Consultando renovaciones…</Typography>
    </Stack>}
    <GestionToolbar total={filtradas.length} busqueda={busqueda}
      onBusqueda={valor => { setBusqueda(valor); setPagina(1); }}
      acciones={<Button startIcon={<AddOutlinedIcon />} disabled={!puedeRenovar}
        onClick={() => setVista('formulario')}>Añadir</Button>} />
    <TablaGestion total={historial.length} filtrados={filtradas.length} cargando={cargando}
      page={paginaActual} onPageChange={setPagina} rowsPerPage={porPagina}
      onRowsPerPageChange={valor => { setPorPagina(valor); setPagina(1); }}>
      <TableHead><TableRow>
        <TableCell>Fecha</TableCell>
        <TableCell>Período</TableCell>
        <TableCell>Vigencia</TableCell>
        <TableCell>Importe</TableCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {visibles.map((item, index) => {
          const d = item.detalle || {};
          return <TableRow key={item.id || index} hover>
            <TableCell>{fecha(item.fecha)}</TableCell>
            <TableCell>{d.numero_periodo_nuevo ?? '—'}</TableCell>
            <TableCell>{fecha(d.fecha_inicio)} – {fecha(d.fecha_fin)}</TableCell>
            <TableCell>{importe(d.precio)}</TableCell>
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
            {busqueda ? 'Sin renovaciones coincidentes.' : 'Este contrato no tiene renovaciones registradas.'}
          </TableCell>
        </TableRow>}
      </TableBody>
    </TablaGestion>
    {congelada && <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
      Reactiva la membresía antes de renovarla.
    </Typography>}
  </Box>;
}
