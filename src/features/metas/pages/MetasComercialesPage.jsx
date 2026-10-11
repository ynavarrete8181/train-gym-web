import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { Box, Button, Paper, Stack } from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { CampoSelectIcono } from '../../../components/common/CampoSelectIcono.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { ReporteExportaciones } from '../../reportes/components/ReporteExportaciones.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { MetaComercialFormulario } from '../components/MetaComercialFormulario.jsx';
import { MetaComercialSeguimiento } from '../components/MetaComercialSeguimiento.jsx';
import { MetasComercialesTable } from '../components/MetasComercialesTable.jsx';
import { metasComercialesServicio } from '../services/metasComercialesServicio.js';

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const dinero = (valor) => Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

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
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [catalogos, setCatalogos] = useState({ sedes: [], responsables: [], estados: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial());
  const [editandoId, setEditandoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });
  const [filtros, setFiltros] = useState({
    busqueda: '',
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
    estado: '',
    sede_id: [],
    periodo: '',
    ventas: '',
    cobros: '',
    nuevas: '',
    renovaciones: '',
    page: 1,
    per_page: 10,
  });

  const avisar = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await metasComercialesServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
      if (response.meta?.catalogos) {
        setCatalogos((actual) => ({ ...actual, ...response.meta.catalogos }));
      }
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'No se pudieron cargar las metas comerciales.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogos = async (sedeId = null) => {
    try {
      const response = await metasComercialesServicio.catalogos(sedeId ? { sede_id: sedeId } : {});
      const datos = response.datos || {};
      setCatalogos((actual) => ({ ...actual, ...datos }));
      return datos;
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'No se pudieron cargar los catálogos de metas.', 'error');
      return {};
    }
  };

  useEffect(() => {
    cargar();
    cargarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (campo, valor) => {
    const nuevos = { ...filtros, [campo]: valor, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const volverLista = () => {
    setVista('lista');
    setEditandoId(null);
    setDetalle(null);
    setFormulario(formularioInicial());
  };

  const nuevaMeta = async () => {
    const datosCatalogos = await cargarCatalogos();
    const sedesDisponibles = datosCatalogos.sedes || [];
    const sedeAutomatica = sedesDisponibles.length === 1 ? sedesDisponibles[0].id : '';

    setEditandoId(null);

    if (sedeAutomatica) {
      const catalogosSede = await cargarCatalogos(sedeAutomatica);
      setCatalogos((actual) => ({ ...actual, ...catalogosSede }));
    }

    setFormulario({
      ...formularioInicial(),
      sede_id: sedeAutomatica,
    });

    setVista('formulario');
  };

  const editarMeta = async (item) => {
    try {
      const response = await metasComercialesServicio.detalle(item.id);
      const datos = response.datos || {};
      const metaActual = datos.meta || {};
      setCatalogos((actual) => ({ ...actual, ...(datos.catalogos || {}) }));
      setEditandoId(item.id);
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
      setVista('formulario');
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'No se pudo cargar la meta comercial.', 'error');
    }
  };

  const verSeguimiento = async (item) => {
    try {
      const response = await metasComercialesServicio.detalle(item.id);
      setDetalle(response.datos || null);
      setVista('seguimiento');
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'No se pudo cargar el seguimiento de la meta.', 'error');
    }
  };

  const cambiarSede = async (sedeId) => {
    setFormulario((actual) => ({ ...actual, sede_id: sedeId, responsables: [] }));
    await cargarCatalogos(sedeId);
  };

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const agregarResponsable = (usuarioId) => {
    if (!usuarioId) return;
    setFormulario((actual) => {
      if ((actual.responsables || []).some((r) => Number(r.usuario_id) === Number(usuarioId))) return actual;
      return {
        ...actual,
        responsables: [
          ...(actual.responsables || []),
          {
            usuario_id: Number(usuarioId),
            meta_ventas: '',
            meta_cobros: '',
            meta_membresias_nuevas: '',
            meta_renovaciones: '',
          },
        ],
      };
    });
  };

  const actualizarResponsable = (usuarioId, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      responsables: (actual.responsables || []).map((r) =>
        Number(r.usuario_id) === Number(usuarioId) ? { ...r, [campo]: valor } : r
      ),
    }));
  };

  const quitarResponsable = (usuarioId) => {
    setFormulario((actual) => ({
      ...actual,
      responsables: (actual.responsables || []).filter((r) => Number(r.usuario_id) !== Number(usuarioId)),
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
        responsables: (formulario.responsables || []).map((r) => ({
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
        avisar('Meta comercial actualizada correctamente.', 'success');
      } else {
        await metasComercialesServicio.crear(payload);
        avisar('Meta comercial creada correctamente.', 'success');
      }

      volverLista();
      await cargar({ ...filtros, page: 1 });
    } catch (error) {
      const errores = error.response?.data?.errores;
      const primerError = errores ? Object.values(errores).flat()[0] : null;
      avisar(primerError || error.response?.data?.mensaje || 'No se pudo guardar la meta comercial.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const columnasPdf = useMemo(() => [
    { label: 'Sede', value: 'sede', align: 'left' },
    { label: 'Período', value: (fila) => `${meses[Number(fila.mes || 1) - 1]} ${fila.anio}` },
    { label: 'Meta ventas', value: (fila) => dinero(fila.meta_ventas) },
    { label: 'Ventas reales', value: (fila) => dinero(fila.real_ventas) },
    { label: '% ventas', value: (fila) => `${Number(fila.cumplimiento_ventas || 0).toFixed(1)}%` },
    { label: 'Meta cobros', value: (fila) => dinero(fila.meta_cobros) },
    { label: 'Cobros reales', value: (fila) => dinero(fila.real_cobros) },
    { label: '% cobros', value: (fila) => `${Number(fila.cumplimiento_cobros || 0).toFixed(1)}%` },
    { label: 'Meta nuevas', value: 'meta_membresias_nuevas' },
    { label: 'Nuevas reales', value: 'real_membresias_nuevas' },
    { label: '% nuevas', value: (fila) => `${Number(fila.cumplimiento_membresias_nuevas || 0).toFixed(1)}%` },
    { label: 'Meta renovaciones', value: 'meta_renovaciones' },
    { label: 'Renovaciones reales', value: 'real_renovaciones' },
    { label: '% renovaciones', value: (fila) => `${Number(fila.cumplimiento_renovaciones || 0).toFixed(1)}%` },
    { label: 'Estado', value: 'estado' },
  ], []);

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={editandoId ? 'Editar meta comercial' : 'Nueva meta comercial'}
          descripcion="Defina los objetivos mensuales de la sede y, si corresponde, distribúyalos por responsable."
          icono={<TrackChangesOutlinedIcon />}
          acciones={<BotonVolver onClick={volverLista} disabled={guardando} />}
        />

        <MetaComercialFormulario
          formulario={formulario}
          catalogos={catalogos}
          guardando={guardando}
          onChange={cambiarCampo}
          onCambiarSede={cambiarSede}
          onAgregarResponsable={agregarResponsable}
          onActualizarResponsable={actualizarResponsable}
          onQuitarResponsable={quitarResponsable}
          onGuardar={guardar}
          onCancelar={volverLista}
        />

        <NotificacionSnackbar
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))}
        />
      </Box>
    );
  }

  if (vista === 'seguimiento' && detalle) {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo="Seguimiento de meta comercial"
          descripcion="Consulte el avance real de la sede y el cumplimiento individual de sus responsables."
          icono={<VisibilityOutlinedIcon />}
          acciones={<BotonVolver onClick={volverLista} />}
        />

        <MetaComercialSeguimiento detalle={detalle} />

        <NotificacionSnackbar
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))}
        />
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Metas comerciales"
        descripcion="Configure objetivos mensuales y supervise su cumplimiento por sede y responsable."
        icono={<TrackChangesOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicarFiltro('busqueda', valor)}
          acciones={(
            <>
              <Button startIcon={<AddOutlinedIcon />} onClick={nuevaMeta} sx={dbanuStyles.addButtonRevive}>
                Añadir
              </Button>
              <ReporteExportaciones
                titulo="Metas comerciales"
                descripcion="Seguimiento de objetivos comerciales por sede y período."
                filtros={filtros}
                columnas={columnasPdf}
                filaTotal={['TOTAL', (filas) => `${filas.length} metas`]}
                obtenerFilas={() => metasComercialesServicio.consultarTodo(filtros)}
                exportarExcel={() => metasComercialesServicio.exportarExcel(filtros)}
              />
            </>
          )}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <CampoSelectIcono
            icono={<EventOutlinedIcon />}
            label="Año"
            value={filtros.anio}
            onChange={(e) => aplicarFiltro('anio', e.target.value)}
            sx={{ minWidth: 160 }}
            options={[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((anio) => ({
              value: anio,
              label: String(anio),
              description: 'Año de consulta',
              icono: <EventOutlinedIcon />,
            }))}
          />

          <CampoSelectIcono
            icono={<CalendarMonthOutlinedIcon />}
            label="Mes"
            value={filtros.mes}
            onChange={(e) => aplicarFiltro('mes', e.target.value)}
            sx={{ minWidth: 190 }}
            options={meses.map((nombre, index) => ({
              value: index + 1,
              label: nombre,
              description: 'Período mensual',
              icono: <CalendarMonthOutlinedIcon />,
            }))}
          />
        </Stack>

        <MetasComercialesTable
          items={items}
          meta={meta}
          filtros={filtros}
          cargando={cargando}
          onFiltro={aplicarFiltro}
          onEditar={editarMeta}
          onVer={verSeguimiento}
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
        />
      </Paper>

      <NotificacionSnackbar
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))}
      />
    </Box>
  );
}
