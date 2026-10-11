import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { metasComercialesServicio } from '../services/metasComercialesServicio.js';

const meses = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const dinero = (valor) => Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');

function Progreso({ valor = 0 }) {
  const porcentaje = Number(valor || 0);
  const visual = Math.min(100, Math.max(0, porcentaje));
  return (
    <Box sx={{ minWidth: 115 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
        <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>{porcentaje.toFixed(1)}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={visual}
        sx={{ height: 5, borderRadius: 999 }}
      />
    </Box>
  );
}

const formularioInicial = () => ({
  sede_id: '',
  anio: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  meta_ventas: '',
  meta_cobros: '',
  meta_membresias_nuevas: '',
  meta_renovaciones: '',
  estado: 'ACTIVA',
  observaciones: '',
  responsables: [],
});

export function MetasComercialesPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({ sedes: [], responsables: [], estados: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial());
  const [seguimientoResponsables, setSeguimientoResponsables] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
    estado: '',
    sede_id: [],
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await metasComercialesServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      if (response.meta?.catalogos) {
        setCatalogos((actual) => ({ ...actual, ...response.meta.catalogos }));
      }
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogos = async (sedeId = null) => {
    const response = await metasComercialesServicio.catalogos(sedeId ? { sede_id: sedeId } : {});
    setCatalogos((actual) => ({ ...actual, ...(response.datos || {}) }));
    return response.datos || {};
  };

  useEffect(() => {
    cargar();
    cargarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicar = (campo, valor) => {
    const nuevos = { ...filtros, [campo]: valor, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const abrirNueva = async () => {
    await cargarCatalogos();
    setEditandoId(null);
    setSeguimientoResponsables([]);
    setFormulario(formularioInicial());
    setDialogo(true);
  };

  const abrirEditar = async (id) => {
    const response = await metasComercialesServicio.detalle(id);
    const datos = response.datos || {};
    const metaActual = datos.meta || {};
    setEditandoId(id);
    setSeguimientoResponsables(datos.responsables || []);
    setCatalogos((actual) => ({ ...actual, ...(datos.catalogos || {}) }));
    setFormulario({
      sede_id: metaActual.sede_id || '',
      anio: metaActual.anio || hoy.getFullYear(),
      mes: metaActual.mes || hoy.getMonth() + 1,
      meta_ventas: metaActual.meta_ventas ?? '',
      meta_cobros: metaActual.meta_cobros ?? '',
      meta_membresias_nuevas: metaActual.meta_membresias_nuevas ?? '',
      meta_renovaciones: metaActual.meta_renovaciones ?? '',
      estado: metaActual.estado || 'ACTIVA',
      observaciones: metaActual.observaciones || '',
      responsables: (datos.responsables || []).map((r) => ({
        usuario_id: r.usuario_id,
        meta_ventas: r.meta_ventas,
        meta_cobros: r.meta_cobros,
        meta_membresias_nuevas: r.meta_membresias_nuevas,
        meta_renovaciones: r.meta_renovaciones,
      })),
    });
    setDialogo(true);
  };

  const cambiarSede = async (sedeId) => {
    const nuevos = { ...formulario, sede_id: sedeId, responsables: [] };
    setFormulario(nuevos);
    await cargarCatalogos(sedeId);
  };

  const agregarResponsable = (usuarioId) => {
    if (!usuarioId || formulario.responsables.some((r) => Number(r.usuario_id) === Number(usuarioId))) return;
    setFormulario((actual) => ({
      ...actual,
      responsables: [
        ...actual.responsables,
        {
          usuario_id: Number(usuarioId),
          meta_ventas: '',
          meta_cobros: '',
          meta_membresias_nuevas: '',
          meta_renovaciones: '',
        },
      ],
    }));
  };

  const actualizarResponsable = (usuarioId, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      responsables: actual.responsables.map((r) => Number(r.usuario_id) === Number(usuarioId) ? { ...r, [campo]: valor } : r),
    }));
  };

  const quitarResponsable = (usuarioId) => {
    setFormulario((actual) => ({
      ...actual,
      responsables: actual.responsables.filter((r) => Number(r.usuario_id) !== Number(usuarioId)),
    }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...formulario,
        sede_id: Number(formulario.sede_id),
        anio: Number(formulario.anio),
        mes: Number(formulario.mes),
        meta_ventas: Number(formulario.meta_ventas || 0),
        meta_cobros: Number(formulario.meta_cobros || 0),
        meta_membresias_nuevas: Number(formulario.meta_membresias_nuevas || 0),
        meta_renovaciones: Number(formulario.meta_renovaciones || 0),
        responsables: formulario.responsables.map((r) => ({
          ...r,
          usuario_id: Number(r.usuario_id),
          meta_ventas: Number(r.meta_ventas || 0),
          meta_cobros: Number(r.meta_cobros || 0),
          meta_membresias_nuevas: Number(r.meta_membresias_nuevas || 0),
          meta_renovaciones: Number(r.meta_renovaciones || 0),
        })),
      };

      if (editandoId) {
        await metasComercialesServicio.actualizar(editandoId, payload);
      } else {
        await metasComercialesServicio.crear(payload);
      }

      setDialogo(false);
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const responsablesDisponibles = useMemo(
    () => (catalogos.responsables || []).filter((u) => !formulario.responsables.some((r) => Number(r.usuario_id) === Number(u.id))),
    [catalogos.responsables, formulario.responsables],
  );

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Metas comerciales"
        descripcion="Configure objetivos mensuales por sede y responsable, y compare su cumplimiento con resultados reales."
        icono={<TrackChangesOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar('busqueda', valor)}
          acciones={(
            <Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={abrirNueva}>
              Añadir
            </Button>
          )}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
          <TextField select size="small" label="Año" value={filtros.anio} onChange={(e) => aplicar('anio', e.target.value)} sx={{ minWidth: 120 }}>
            {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((anio) => <MenuItem key={anio} value={anio}>{anio}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Mes" value={filtros.mes} onChange={(e) => aplicar('mes', e.target.value)} sx={{ minWidth: 160 }}>
            {meses.map((nombre, index) => <MenuItem key={nombre} value={index + 1}>{nombre}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Estado" value={filtros.estado} onChange={(e) => aplicar('estado', e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">Todos</MenuItem>
            {(catalogos.estados || []).map((estado) => <MenuItem key={estado} value={estado}>{estado}</MenuItem>)}
          </TextField>
        </Stack>

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 10}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          cargando={cargando}
        >
          <TableHead>
            <TableRow>
              <FilterHeaderCell
                value={filtros.sede_id}
                onChange={(valor) => aplicar('sede_id', valor)}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}
                multiple
              >
                Sede
              </FilterHeaderCell>
              <TableCell align="center">Período</TableCell>
              <TableCell align="center">Ventas</TableCell>
              <TableCell align="center">Cobros</TableCell>
              <TableCell align="center">Nuevas</TableCell>
              <TableCell align="center">Renovaciones</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={8} texto="No existen metas configuradas para los filtros seleccionados." />
            ) : null}

            {items.map((item) => (
              <TableRow hover key={item.id}>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{meses[item.mes - 1]} {item.anio}</TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 11.3, fontWeight: 800 }}>{dinero(item.real_ventas)} / {dinero(item.meta_ventas)}</Typography>
                  <Progreso valor={item.cumplimiento_ventas} />
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 11.3, fontWeight: 800 }}>{dinero(item.real_cobros)} / {dinero(item.meta_cobros)}</Typography>
                  <Progreso valor={item.cumplimiento_cobros} />
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 11.3, fontWeight: 800 }}>{numero(item.real_membresias_nuevas)} / {numero(item.meta_membresias_nuevas)}</Typography>
                  <Progreso valor={item.cumplimiento_membresias_nuevas} />
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 11.3, fontWeight: 800 }}>{numero(item.real_renovaciones)} / {numero(item.meta_renovaciones)}</Typography>
                  <Progreso valor={item.cumplimiento_renovaciones} />
                </TableCell>
                <TableCell align="center">
                  <Chip label={item.estado} color={item.estado === 'ACTIVA' ? 'success' : 'default'} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar meta y responsables">
                    <IconButton size="small" onClick={() => abrirEditar(item.id)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TablaGestion>
      </Paper>

      <Dialog open={dialogo} onClose={() => !guardando && setDialogo(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 15 }}>
          {editandoId ? 'Editar meta comercial' : 'Nueva meta comercial'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.2 }}>
            <TextField select size="small" label="Sede" value={formulario.sede_id} onChange={(e) => cambiarSede(e.target.value)}>
              {(catalogos.sedes || []).map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
            </TextField>
            <TextField type="number" size="small" label="Año" value={formulario.anio} onChange={(e) => setFormulario({ ...formulario, anio: e.target.value })} />
            <TextField select size="small" label="Mes" value={formulario.mes} onChange={(e) => setFormulario({ ...formulario, mes: e.target.value })}>
              {meses.map((nombre, index) => <MenuItem key={nombre} value={index + 1}>{nombre}</MenuItem>)}
            </TextField>
            <TextField type="number" size="small" label="Meta ventas ($)" value={formulario.meta_ventas} onChange={(e) => setFormulario({ ...formulario, meta_ventas: e.target.value })} />
            <TextField type="number" size="small" label="Meta cobros ($)" value={formulario.meta_cobros} onChange={(e) => setFormulario({ ...formulario, meta_cobros: e.target.value })} />
            <TextField type="number" size="small" label="Membresías nuevas" value={formulario.meta_membresias_nuevas} onChange={(e) => setFormulario({ ...formulario, meta_membresias_nuevas: e.target.value })} />
            <TextField type="number" size="small" label="Renovaciones" value={formulario.meta_renovaciones} onChange={(e) => setFormulario({ ...formulario, meta_renovaciones: e.target.value })} />
            <TextField select size="small" label="Estado" value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value })}>
              <MenuItem value="ACTIVA">ACTIVA</MenuItem>
              <MenuItem value="INACTIVA">INACTIVA</MenuItem>
            </TextField>
            <TextField size="small" label="Observaciones" value={formulario.observaciones} onChange={(e) => setFormulario({ ...formulario, observaciones: e.target.value })} />
          </Box>

          <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${uiTokens.colores.borde}` }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 0.4 }}>Metas por responsable</Typography>
            <Typography sx={{ fontSize: 10.8, color: uiTokens.colores.textoMedio, mb: 1.2 }}>
              Opcional. Distribuya objetivos individuales dentro de la sede seleccionada.
            </Typography>

            <TextField
              select
              size="small"
              label="Agregar responsable"
              value=""
              onChange={(e) => agregarResponsable(e.target.value)}
              disabled={!formulario.sede_id}
              sx={{ minWidth: 320, mb: 1.2 }}
            >
              {responsablesDisponibles.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.nombre} · {r.rol}</MenuItem>
              ))}
            </TextField>

            {formulario.responsables.map((r) => {
              const usuario = (catalogos.responsables || []).find((u) => Number(u.id) === Number(r.usuario_id));
              const seguimiento = seguimientoResponsables.find((s) => Number(s.usuario_id) === Number(r.usuario_id));
              return (
                <Paper key={r.usuario_id} variant="outlined" sx={{ p: 1.1, mb: 1, borderColor: uiTokens.colores.borde }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 900, minWidth: 180 }}>{usuario?.nombre || 'Responsable'}</Typography>
                    <TextField type="number" size="small" label="Ventas $" value={r.meta_ventas} onChange={(e) => actualizarResponsable(r.usuario_id, 'meta_ventas', e.target.value)} />
                    <TextField type="number" size="small" label="Cobros $" value={r.meta_cobros} onChange={(e) => actualizarResponsable(r.usuario_id, 'meta_cobros', e.target.value)} />
                    <TextField type="number" size="small" label="Nuevas" value={r.meta_membresias_nuevas} onChange={(e) => actualizarResponsable(r.usuario_id, 'meta_membresias_nuevas', e.target.value)} />
                    <TextField type="number" size="small" label="Renovaciones" value={r.meta_renovaciones} onChange={(e) => actualizarResponsable(r.usuario_id, 'meta_renovaciones', e.target.value)} />
                    <Button size="small" color="error" onClick={() => quitarResponsable(r.usuario_id)}>Quitar</Button>
                  </Stack>
                  {seguimiento ? (
                    <Typography sx={{ mt: 0.8, fontSize: 10.8, color: uiTokens.colores.textoMedio }}>
                      Real: ventas {dinero(seguimiento.real_ventas)} ({Number(seguimiento.cumplimiento_ventas || 0).toFixed(1)}%) ·
                      cobros {dinero(seguimiento.real_cobros)} ({Number(seguimiento.cumplimiento_cobros || 0).toFixed(1)}%) ·
                      nuevas {numero(seguimiento.real_membresias_nuevas)} ({Number(seguimiento.cumplimiento_membresias_nuevas || 0).toFixed(1)}%) ·
                      renovaciones {numero(seguimiento.real_renovaciones)} ({Number(seguimiento.cumplimiento_renovaciones || 0).toFixed(1)}%)
                    </Typography>
                  ) : null}
                </Paper>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando || !formulario.sede_id}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
