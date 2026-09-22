import { useEffect, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const fecha = (v) => String(v || '').slice(0, 10);
const hora = (v) => String(v || '').slice(0, 5);

const inicial = {
  id: null,
  entrenador_id: '',
  sede_id: '',
  jornada_id: '',
  receso_id: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: '',
  activo: true,
  observaciones: '',
};

export function AsignacionHorariosPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [form, setForm] = useState(inicial);
  const [catalogos, setCatalogos] = useState({ entrenadores: [], sedes: [], jornadas: [], recesos: [] });
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const r = await gimnasioServicio.obtenerAsignacionesHorario(params);
      setItems(r.datos || []);
      setMeta(r.meta || {});
    } catch (e) {
      setNotificacion({ mensaje: 'No se pudieron cargar las asignaciones de horario.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const r = await gimnasioServicio.obtenerCatalogosAsignacionHorario();
      setCatalogos(r.datos || {});
    } catch (e) {
      setNotificacion({ mensaje: 'No se pudieron cargar los catálogos de asignación.', tipo: 'error' });
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (vista === 'formulario') cargarCatalogos();
  }, [vista]);

  const guardar = async () => {
    if (!form.entrenador_id || !form.sede_id || !form.jornada_id || !form.fecha_inicio) {
      setNotificacion({ mensaje: 'Selecciona entrenador, sede, jornada y fecha de inicio.', tipo: 'warning' });
      return;
    }

    const payload = {
      entrenador_id: Number(form.entrenador_id),
      sede_id: Number(form.sede_id),
      jornada_id: Number(form.jornada_id),
      receso_id: form.receso_id ? Number(form.receso_id) : null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      activo: Boolean(form.activo),
      observaciones: form.observaciones || null,
    };

    try {
      if (form.id) await gimnasioServicio.actualizarAsignacionHorario(form.id, payload);
      else await gimnasioServicio.crearAsignacionHorario(payload);

      setNotificacion({ mensaje: 'Asignación guardada correctamente.', tipo: 'success' });
      setVista('lista');
      setForm(inicial);
      cargar({ ...filtros, page: 1 });
    } catch (e) {
      const mensaje = e.response?.data?.errores
        ? Object.values(e.response.data.errores).flat().join(' ')
        : (e.response?.data?.mensaje || 'No se pudo guardar la asignación.');
      setNotificacion({ mensaje, tipo: 'error' });
    }
  };

  const editar = (item) => {
    setForm({
      id: item.id,
      entrenador_id: item.entrenador_id,
      sede_id: item.sede_id,
      jornada_id: item.jornada_id,
      receso_id: item.receso_id || '',
      fecha_inicio: fecha(item.fecha_inicio),
      fecha_fin: fecha(item.fecha_fin),
      activo: item.activo !== false,
      observaciones: item.observaciones || '',
    });
    setVista('formulario');
  };

  if (vista === 'formulario') {
    const jornada = (catalogos.jornadas || []).find((j) => String(j.id) === String(form.jornada_id));
    const receso = (catalogos.recesos || []).find((r) => String(r.id) === String(form.receso_id));

    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={form.id ? 'Editar asignación de horario' : 'Nueva asignación de horario'}
          descripcion="Define dónde y en qué jornada trabaja el entrenador. El sistema impide cruces entre sedes."
          icono={<CalendarMonthOutlinedIcon />}
          acciones={<BotonVolver onClick={() => setVista('lista')} />}
        />
        <Paper className="page-content-container" elevation={0} sx={{ mt: 2 }}>
          <Box sx={formStyles.seccion}>
            <Typography sx={formStyles.modalSeccionTitulo}>Asignación del entrenador</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 1.5 }}>
              <TextField select label="Entrenador" size="small" value={form.entrenador_id} onChange={(e) => setForm((a) => ({ ...a, entrenador_id: e.target.value }))} required>
                {(catalogos.entrenadores || []).map((e) => <MenuItem key={e.id} value={e.id}>{e.name}{e.especialidad ? ` · ${e.especialidad}` : ''}</MenuItem>)}
              </TextField>

              <TextField select label="Sede" size="small" value={form.sede_id} onChange={(e) => setForm((a) => ({ ...a, sede_id: e.target.value }))} required>
                {(catalogos.sedes || []).map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
              </TextField>

              <TextField select label="Jornada" size="small" value={form.jornada_id} onChange={(e) => setForm((a) => ({ ...a, jornada_id: e.target.value }))} required>
                {(catalogos.jornadas || []).map((j) => <MenuItem key={j.id} value={j.id}>{j.nombre}</MenuItem>)}
              </TextField>

              <TextField select label="Receso" size="small" value={form.receso_id} onChange={(e) => setForm((a) => ({ ...a, receso_id: e.target.value }))}>
                <MenuItem value="">Sin receso</MenuItem>
                {(catalogos.recesos || []).map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre} · {hora(r.hora_inicio)}-{hora(r.hora_fin)}</MenuItem>)}
              </TextField>

              <TextField label="Vigente desde" type="date" size="small" value={form.fecha_inicio} onChange={(e) => setForm((a) => ({ ...a, fecha_inicio: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} required />
              <TextField label="Vigente hasta" type="date" size="small" value={form.fecha_fin} onChange={(e) => setForm((a) => ({ ...a, fecha_fin: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} helperText="Vacío = sin fecha final" />

              <TextField label="Observaciones" size="small" value={form.observaciones} onChange={(e) => setForm((a) => ({ ...a, observaciones: e.target.value }))} multiline minRows={2} sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} />
              <FormControlLabel control={<Switch checked={Boolean(form.activo)} onChange={(e) => setForm((a) => ({ ...a, activo: e.target.checked }))} />} label="Asignación activa" />
            </Box>

            {jornada ? (
              <Box sx={{ mt: 2, border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1.5, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" fontWeight={900}>{jornada.nombre}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: .8 }}>
                  <Resumen icono={<ScheduleOutlinedIcon />} label="Horario" valor={`${hora(jornada.hora_inicio)} - ${hora(jornada.hora_fin)}`} />
                  <Resumen icono={<CalendarMonthOutlinedIcon />} label="Días" valor={(jornada.dias_semana || []).map((d) => d.slice(0,3)).join(' · ')} />
                  {receso ? <Resumen icono={<CoffeeOutlinedIcon />} label="Receso" valor={`${receso.nombre} · ${hora(receso.hora_inicio)}-${hora(receso.hora_fin)}`} /> : null}
                </Stack>
              </Box>
            ) : null}
          </Box>

          <AccionesFormulario onGuardar={guardar} onCancelar={() => setVista('lista')} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((a) => ({ ...a, mensaje: '' }))} />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Asignación de horarios"
        descripcion="Asigna a cada entrenador una sede, jornada, receso opcional y vigencia."
        icono={<CalendarMonthOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || items.length}
          busqueda={filtros.busqueda}
          onBusqueda={(busqueda) => {
            const n = { ...filtros, busqueda, page: 1 };
            setFiltros(n);
            cargar(n);
          }}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => { setForm(inicial); setVista('formulario'); }} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5}
          cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(per_page) => { const n = { ...filtros, page: 1, per_page }; setFiltros(n); cargar(n); }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Entrenador</TableCell>
              <TableCell>Sede</TableCell>
              <TableCell>Jornada</TableCell>
              <TableCell>Días / horario</TableCell>
              <TableCell>Receso</TableCell>
              <TableCell>Vigencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={.7} alignItems="center">
                    <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{item.entrenador_nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.entrenador_especialidad || 'Entrenador'}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell><Stack direction="row" spacing={.6} alignItems="center"><LocationOnOutlinedIcon sx={{ fontSize: 17 }} /><span>{item.sede_nombre}</span></Stack></TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{item.jornada_nombre}</Typography></TableCell>
                <TableCell><Typography variant="body2">{(item.dias_semana || []).map((d) => d.slice(0,3)).join(' · ')}</Typography><Typography variant="caption" color="text.secondary">{hora(item.hora_inicio)} - {hora(item.hora_fin)}</Typography></TableCell>
                <TableCell>{item.receso_nombre ? <><Typography variant="body2">{item.receso_nombre}</Typography><Typography variant="caption" color="text.secondary">{hora(item.receso_hora_inicio)}-{hora(item.receso_hora_fin)}</Typography></> : 'Sin receso'}</TableCell>
                <TableCell><Typography variant="body2">{fecha(item.fecha_inicio)}</Typography><Typography variant="caption" color="text.secondary">{item.fecha_fin ? `hasta ${fecha(item.fecha_fin)}` : 'sin fecha final'}</Typography></TableCell>
                <TableCell><StatusChip estado={item.activo ? 'activo' : 'inactivo'} /></TableCell>
                <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={() => editar(item)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip></TableCell>
              </TableRow>
            ))}
            {!items.length ? <TablaEstadoFila colSpan={8} cargando={cargando} texto="No existen horarios asignados a entrenadores." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion((a) => ({ ...a, mensaje: '' }))} />
    </Box>
  );
}

function Resumen({ icono, label, valor }) {
  return <Stack direction="row" spacing={.7} alignItems="center">
    <Box sx={{ display: 'flex', color: '#8a6500', '& svg': { fontSize: 18 } }}>{icono}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{valor || '—'}</Typography>
    </Box>
  </Stack>;
}
