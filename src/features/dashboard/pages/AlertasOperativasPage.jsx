import { useEffect, useMemo, useState } from 'react';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Box, Button, Chip, Paper, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { ReporteExportaciones } from '../../reportes/components/ReporteExportaciones.jsx';
import { alertasOperativasServicio } from '../services/alertasOperativasServicio.js';

const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item).replaceAll('_', ' ') }));
const fechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : '—');

const colorNivel = (nivel) => {
  const valor = String(nivel || '').toUpperCase();
  if (valor === 'ERROR') return 'error';
  if (valor === 'WARNING') return 'warning';
  return 'info';
};

const colorEstado = (estado) => String(estado || '').toUpperCase() === 'ACTIVA' ? 'warning' : 'success';

export function AlertasOperativasPage({ referenciaProceso = null }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [filtros, setFiltros] = useState({
    id: referenciaProceso?.id || '',
    busqueda: '',
    estado: ['ACTIVA'],
    tipo: [],
    nivel: [],
    sede_id: [],
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await alertasOperativasServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const iniciales = {
      ...filtros,
      id: referenciaProceso?.id || '',
      estado: referenciaProceso?.id ? [] : ['ACTIVA'],
      page: 1,
    };
    setFiltros(iniciales);
    cargar(iniciales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenciaProceso?.id]);

  const aplicar = (campo, valor) => {
    const nuevos = { ...filtros, [campo]: valor, id: campo === 'id' ? valor : '', page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const actualizarAlertas = async () => {
    setProcesando(true);
    try {
      await alertasOperativasServicio.procesar();
      const nuevos = { ...filtros, id: '', page: 1 };
      setFiltros(nuevos);
      await cargar(nuevos);
    } finally {
      setProcesando(false);
    }
  };

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};

  const columnasPdf = useMemo(() => [
    { label: 'Sede', value: 'sede', align: 'left' },
    { label: 'Tipo', value: (fila) => String(fila.tipo || '').replaceAll('_', ' ') },
    { label: 'Nivel', value: 'nivel' },
    { label: 'Título', value: 'titulo', align: 'left' },
    { label: 'Detalle', value: 'mensaje', align: 'left' },
    { label: 'Estado', value: 'estado' },
    { label: 'Detectada', value: (fila) => fechaHora(fila.detectada_at) },
    { label: 'Última detección', value: (fila) => fechaHora(fila.ultima_deteccion_at) },
    { label: 'Resuelta', value: (fila) => fechaHora(fila.resuelta_at) },
  ], []);

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Alertas operativas"
        descripcion="Condiciones detectadas automáticamente en cartera, membresías y caja."
        icono={<NotificationImportantOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar('busqueda', valor)}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Activas: ${resumen.activas || 0}`} color="warning" sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
              <Chip variant="outlined" label={`Críticas: ${resumen.criticas || 0}`} color="error" sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
              <Chip variant="outlined" label={`Advertencias: ${resumen.advertencias || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
              <Chip variant="outlined" label={`Resueltas: ${resumen.resueltas || 0}`} color="success" sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
            </>
          )}
          acciones={(
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshOutlinedIcon />}
                disabled={procesando}
                onClick={actualizarAlertas}
                sx={{ minHeight: 38, textTransform: 'none', fontWeight: 800 }}
              >
                {procesando ? 'Actualizando...' : 'Actualizar alertas'}
              </Button>
              <ReporteExportaciones
                titulo="Alertas operativas"
                descripcion="Alertas detectadas automáticamente por Revive y su estado de resolución."
                filtros={filtros}
                columnas={columnasPdf}
                filaTotal={['TOTAL', (filas) => `${filas.length} alertas`]}
                obtenerFilas={() => alertasOperativasServicio.consultarTodo(filtros)}
                exportarExcel={() => alertasOperativasServicio.exportarExcel(filtros)}
              />
            </>
          )}
        />

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
              <FilterHeaderCell value={filtros.tipo} onChange={(valor) => aplicar('tipo', valor)} options={opciones(catalogos.tipos)} multiple>Tipo</FilterHeaderCell>
              <FilterHeaderCell value={filtros.nivel} onChange={(valor) => aplicar('nivel', valor)} options={opciones(catalogos.niveles)} multiple>Nivel</FilterHeaderCell>
              <FilterHeaderCell>Título / detalle</FilterHeaderCell>
              <FilterHeaderCell value={filtros.estado} onChange={(valor) => aplicar('estado', valor)} options={opciones(catalogos.estados)} multiple>Estado</FilterHeaderCell>
              <FilterHeaderCell align="center">Detectada</FilterHeaderCell>
              <FilterHeaderCell align="center">Última detección</FilterHeaderCell>
              <FilterHeaderCell align="center">Resuelta</FilterHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={8} texto="No existen alertas para los filtros seleccionados." />
            ) : null}

            {items.map((item) => (
              <TableRow hover key={item.id}>
                <TableCell>{item.sede || 'Sin sede'}</TableCell>
                <TableCell>
                  <Tooltip title={item.tipo || ''}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>{String(item.tipo || '').replaceAll('_', ' ')}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell><Chip label={item.nivel} color={colorNivel(item.nivel)} size="small" variant="outlined" /></TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 11.8, fontWeight: 900 }}>{item.titulo}</Typography>
                  <Typography sx={{ fontSize: 10.8, color: 'text.secondary' }}>{item.mensaje}</Typography>
                </TableCell>
                <TableCell><Chip label={item.estado} color={colorEstado(item.estado)} size="small" variant="outlined" /></TableCell>
                <TableCell align="center">{fechaHora(item.detectada_at)}</TableCell>
                <TableCell align="center">{fechaHora(item.ultima_deteccion_at)}</TableCell>
                <TableCell align="center">{fechaHora(item.resuelta_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
