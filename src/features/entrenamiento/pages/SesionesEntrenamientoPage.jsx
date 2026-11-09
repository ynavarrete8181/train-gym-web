import { useEffect, useRef, useState } from 'react';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SportsGymnasticsOutlinedIcon from '@mui/icons-material/SportsGymnasticsOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { Box, Button, Chip, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { entrenamientoServicio } from '../services/entrenamientoServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const estados = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];
const opcionesEstado = estados.map((estado) => ({ value: estado, label: estado.replaceAll('_', ' ') }));
const fecha = (valor) => valor ? String(valor).slice(0, 10) : '—';
const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC', { maximumFractionDigits: 2 });

export function SesionesEntrenamientoPage() {
  const pizarraRef = useRef(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', estado: [], page: 1, per_page: 5 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [planes, setPlanes] = useState([]);
  const [selector, setSelector] = useState({ plan_id: '', semana: 1, dia: 'LUNES' });
  const [pizarra, setPizarra] = useState(null);
  const [cargandoPizarra, setCargandoPizarra] = useState(false);
  const [modoPizarra, setModoPizarra] = useState('GENERAL');
  const [selectorGeneral, setSelectorGeneral] = useState({ sede_id: 1, fecha: hoyEcuador() });
  const [pizarraGeneral, setPizarraGeneral] = useState(null);

  const cargar = async (siguientes = filtros) => {
    setCargando(true);
    try {
      const respuesta = await entrenamientoServicio.obtenerSesiones(siguientes);
      setItems(respuesta.datos || []);
      setMeta(respuesta.meta || {});
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo cargar la pizarra de sesiones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    entrenamientoServicio.obtenerPlanes({ page: 1, per_page: 100, estado: 'ACTIVO' }).then((r) => {
      const datos = r.datos || [];
      setPlanes(datos);
      if (datos[0]) setSelector((actual) => ({ ...actual, plan_id: datos[0].id }));
    }).catch(() => setError('No se pudieron cargar los planes para la pizarra.'));
  }, []);

  const cargarPizarra = async (valor = selector) => {
    if (!valor.plan_id) return;
    setCargandoPizarra(true);
    try {
      const respuesta = await entrenamientoServicio.obtenerPizarra(valor);
      setPizarra(respuesta.datos || null);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo cargar la pizarra.');
    } finally {
      setCargandoPizarra(false);
    }
  };

  const cargarPizarraGeneral = async (valor = selectorGeneral) => {
    setCargandoPizarra(true);
    try {
      const respuesta = await entrenamientoServicio.obtenerPizarraGeneral(valor);
      setPizarraGeneral(respuesta.datos || null);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo cargar la pizarra general.');
    } finally {
      setCargandoPizarra(false);
    }
  };

  useEffect(() => { if (selector.plan_id) cargarPizarra(selector); }, [selector.plan_id, selector.semana, selector.dia]);
  useEffect(() => { cargarPizarraGeneral(selectorGeneral); }, [selectorGeneral.sede_id, selectorGeneral.fecha]);

  const aplicar = (cambios) => {
    const siguientes = { ...filtros, ...cambios, page: cambios.page || 1 };
    setFiltros(siguientes);
    cargar(siguientes);
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Pizarra de sesiones"
        descripcion="Seguimiento operativo de rutinas programadas y completadas por deportista."
        icono={<SportsGymnasticsOutlinedIcon />}
      />
      <Paper ref={pizarraRef} elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: '#0f172a', color: 'white' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box><Typography variant="h5" fontWeight="900">Pizarra de entrenamiento</Typography><Typography variant="body2" sx={{ color: 'rgba(255,255,255,.7)' }}>{modoPizarra === 'GENERAL' ? 'Rutina común para pases diarios y acceso general.' : 'Planes personalizados con series, %RM, kg/lb y transferencias.'}</Typography><Stack direction="row" spacing={1} sx={{ mt: 1.2 }}><Button size="small" variant={modoPizarra === 'GENERAL' ? 'contained' : 'outlined'} color="warning" onClick={() => setModoPizarra('GENERAL')}>Pizarra general</Button><Button size="small" variant={modoPizarra === 'PERSONAL' ? 'contained' : 'outlined'} color="warning" onClick={() => setModoPizarra('PERSONAL')}>Planes personalizados</Button></Stack></Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {modoPizarra === 'GENERAL' ? <>
              <TextField select size="small" label="Sede" value={selectorGeneral.sede_id} onChange={(e) => setSelectorGeneral({ ...selectorGeneral, sede_id: Number(e.target.value) })} sx={{ minWidth: 190, bgcolor: 'white', borderRadius: 1 }}><MenuItem value={1}>Revive Home</MenuItem><MenuItem value={2}>Revive Xpadel</MenuItem></TextField>
              <TextField size="small" type="date" label="Fecha" value={selectorGeneral.fecha} onChange={(e) => setSelectorGeneral({ ...selectorGeneral, fecha: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 155, bgcolor: 'white', borderRadius: 1 }} />
            </> : <>
            <TextField select size="small" label="Plan / deportista" value={selector.plan_id} onChange={(e) => setSelector({ ...selector, plan_id: e.target.value })} sx={{ minWidth: 260, bgcolor: 'white', borderRadius: 1 }}>
              {planes.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.cliente_nombre} · {plan.nombre}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Semana" value={selector.semana} onChange={(e) => setSelector({ ...selector, semana: Number(e.target.value) })} sx={{ minWidth: 110, bgcolor: 'white', borderRadius: 1 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((semana) => <MenuItem key={semana} value={semana}>Semana {semana}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Día" value={selector.dia} onChange={(e) => setSelector({ ...selector, dia: e.target.value })} sx={{ minWidth: 135, bgcolor: 'white', borderRadius: 1 }}>
              {dias.map((dia) => <MenuItem key={dia} value={dia}>{dia}</MenuItem>)}
            </TextField>
            </>}
            <Button variant="outlined" color="inherit" onClick={() => modoPizarra === 'GENERAL' ? cargarPizarraGeneral() : cargarPizarra()} startIcon={<RefreshOutlinedIcon />} sx={{ flexShrink: 0, whiteSpace: 'nowrap', width: 'auto' }}>Actualizar</Button>
            <Button variant="outlined" color="inherit" onClick={() => pizarraRef.current?.requestFullscreen?.()} startIcon={<FullscreenOutlinedIcon />} sx={{ flexShrink: 0, whiteSpace: 'nowrap', width: 'auto' }}>Pantalla</Button>
          </Stack>
        </Stack>
        {modoPizarra === 'PERSONAL' && pizarra?.plan ? <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }}><Chip label={pizarra.plan.deportista_nombre} color="warning" /><Chip label={pizarra.plan.nombre} sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'white' }} /><Chip label={`${selector.dia} · Semana ${selector.semana}`} sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'white' }} /></Stack> : null}
        {modoPizarra === 'GENERAL' && pizarraGeneral?.pizarra ? <Box sx={{ mt: 2 }}><Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Chip label={pizarraGeneral.pizarra.sede_nombre} color="warning" /><Chip label={pizarraGeneral.pizarra.nombre} sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'white' }} /><Chip label={`${(pizarraGeneral.asistentes || []).length} asistentes habilitados`} color="success" /></Stack><Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,.75)' }}>{pizarraGeneral.pizarra.objetivo}</Typography>{(pizarraGeneral.asistentes || []).length ? <Stack direction="row" spacing={.7} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.2 }}>{pizarraGeneral.asistentes.map((a) => <Chip key={a.membresia_id} size="small" label={`${a.name} · ${a.membresia}${a.ingreso_at ? ' · ingresó' : ''}`} sx={{ bgcolor: a.ingreso_at ? '#dcfce7' : '#fff7ed', color: '#0f172a' }} />)}</Stack> : null}</Box> : null}
        <Box sx={{ mt: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))', xl: 'repeat(3,minmax(0,1fr))' } }}>
          {modoPizarra === 'GENERAL' ? (pizarraGeneral?.ejercicios || []).map((ejercicio) => <Paper key={ejercicio.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc' }}><Typography fontWeight="900" color="#0f172a">{ejercicio.orden}. {ejercicio.ejercicio_nombre}</Typography><Typography variant="caption" color="text.secondary">{ejercicio.bloque} · {ejercicio.grupo_muscular} · {ejercicio.equipamiento}</Typography><Stack direction="row" spacing={.8} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}><Chip size="small" label={`${ejercicio.series} series`} /><Chip size="small" label={ejercicio.repeticiones ? `${ejercicio.repeticiones} reps` : `${ejercicio.tiempo_segundos}s`} color="warning" />{ejercicio.descanso_segundos ? <Chip size="small" label={`Descanso ${ejercicio.descanso_segundos}s`} /> : null}</Stack><Typography variant="body2" sx={{ mt: 1.3, color: '#475569' }}>{ejercicio.indicaciones}</Typography></Paper>) : (pizarra?.rutinas || []).map((rutina) => <Paper key={rutina.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}><Box><Typography fontWeight="900" color="#0f172a">{rutina.orden}. {rutina.ejercicio_nombre}</Typography><Typography variant="caption" color="text.secondary">{rutina.bloque || 'General'} · {rutina.grupo_muscular}</Typography></Box>{rutina.rm_estimado ? <Chip size="small" label={`RM ${numero(rutina.rm_estimado)} kg`} color="success" /> : null}</Stack>
            <Stack spacing={0.7} sx={{ mt: 1.5 }}>{(rutina.series_detalle || []).map((serie) => <Box key={serie.id} sx={{ px: 1.2, py: .8, borderRadius: 1.5, bgcolor: 'white', border: '1px solid #e2e8f0' }}><Typography variant="body2" fontWeight="800">S{serie.numero_serie} · {serie.repeticiones || '—'} reps · {serie.porcentaje_rm != null ? `${numero(serie.porcentaje_rm)}% RM` : serie.tipo_carga}</Typography><Typography variant="caption" color="text.secondary">{serie.carga_kg != null ? `${numero(serie.carga_kg)} kg · ${numero(serie.carga_lb)} lb` : 'Carga libre'}{serie.descanso_segundos ? ` · descanso ${serie.descanso_segundos}s` : ''}</Typography></Box>)}</Stack>
            {(rutina.transferencias || []).map((transferencia) => <Box key={transferencia.id} sx={{ mt: 1.2, p: 1.1, borderRadius: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}><Stack direction="row" spacing={.7} sx={{ alignItems: 'center' }}><SwapHorizOutlinedIcon fontSize="small" color="warning" /><Typography variant="body2" fontWeight="900">{transferencia.ejercicio_nombre}</Typography></Stack><Typography variant="caption" color="text.secondary">Después de cada serie · {(transferencia.series || []).map((s) => s.repeticiones ? `${s.repeticiones} reps` : s.distancia_metros ? `${s.distancia_metros} m` : `${s.tiempo_segundos}s`).join(' / ')}</Typography></Box>)}
          </Paper>)}
        </Box>
        {!cargandoPizarra && modoPizarra === 'PERSONAL' && pizarra && !(pizarra.rutinas || []).length ? <Typography sx={{ mt: 2, color: 'rgba(255,255,255,.7)' }}>No hay ejercicios configurados para esta semana y día.</Typography> : null}
        {!cargandoPizarra && modoPizarra === 'GENERAL' && !pizarraGeneral?.pizarra ? <Typography sx={{ mt: 2, color: 'rgba(255,255,255,.7)' }}>No existe una pizarra general configurada para esta sede y fecha.</Typography> : null}
        {cargandoPizarra ? <Typography sx={{ mt: 2 }}>Actualizando pizarra…</Typography> : null}
      </Paper>
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || items.length}
          busqueda={filtros.busqueda}
          onBusqueda={(busqueda) => aplicar({ busqueda })}
        />
        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5}
          onPageChange={(page) => aplicar({ page })}
          onRowsPerPageChange={(per_page) => aplicar({ per_page })}
          cargando={cargando}
        >
          <TableHead>
            <TableRow>
              <TableCell>Deportista</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Semana / día</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Ejercicios</TableCell>
              <FilterHeaderCell value={filtros.estado} onChange={(estado) => aplicar({ estado })} options={opcionesEstado}>Estado</FilterHeaderCell>
              <TableCell>Resultado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell><Typography variant="body2" fontWeight="600">{item.deportista_nombre}</Typography><Typography variant="caption" color="text.secondary">{item.codigo_deportista}</Typography></TableCell>
                <TableCell>{item.plan_nombre || item.nombre}</TableCell>
                <TableCell>Semana {item.semana} · {item.dia}</TableCell>
                <TableCell>{fecha(item.fecha_programada)}</TableCell>
                <TableCell>{item.total_ejercicios}</TableCell>
                <TableCell><StatusChip estado={String(item.estado || '').toLowerCase()} /></TableCell>
                <TableCell>{item.estado === 'COMPLETADA' ? `${Math.round((item.duracion_segundos || 0) / 60)} min · RPE ${item.rpe_sesion || '—'}` : 'Pendiente de ejecución'}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TablaEstadoFila colSpan={7} cargando={cargando} texto="No hay sesiones para los filtros aplicados." />}
          </TableBody>
        </TablaGestion>
      </Paper>
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError('')} />
    </Box>
  );
}
