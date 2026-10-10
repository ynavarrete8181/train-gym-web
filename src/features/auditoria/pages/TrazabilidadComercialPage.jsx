import { useEffect, useMemo, useState } from 'react';
import ManageHistoryOutlinedIcon from '@mui/icons-material/ManageHistoryOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../../reportes/components/ReporteExportaciones.jsx';
import { trazabilidadComercialServicio } from '../services/trazabilidadComercialServicio.js';

const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));
const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : '—');

const colorAccion = (accion) => {
  const valor = String(accion || '').toUpperCase();
  if (valor.includes('CREAR') || valor.includes('ABRIR') || valor.includes('RENOVAR')) return 'success';
  if (valor.includes('ELIMINAR') || valor.includes('ANULAR')) return 'error';
  if (valor.includes('CERRAR') || valor.includes('CONCILIAR')) return 'warning';
  return 'info';
};

function formatearJson(valor) {
  if (!valor) return 'Sin datos.';
  try {
    const objeto = typeof valor === 'string' ? JSON.parse(valor) : valor;
    return JSON.stringify(objeto, null, 2);
  } catch {
    return String(valor);
  }
}

export function TrazabilidadComercialPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    sede_id: [],
    proceso: [],
    accion: [],
    usuario: [],
    rol: [],
    referencia: '',
    descripcion: '',
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await trazabilidadComercialServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};

  const columnasPdf = useMemo(() => [
    { label: 'Fecha', value: (fila) => fecha(fila.created_at) },
    { label: 'Sede', value: 'sede', align: 'left' },
    { label: 'Proceso', value: 'proceso' },
    { label: 'Referencia', value: 'referencia' },
    { label: 'Acción', value: 'accion' },
    { label: 'Usuario', value: 'usuario_nombre', align: 'left' },
    { label: 'Rol', value: 'rol' },
    { label: 'Descripción', value: 'descripcion', align: 'left' },
  ], []);

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Trazabilidad comercial"
        descripcion="Audita acciones sobre ventas, pagos, caja, cartera y membresías."
        icono={<ManageHistoryOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Eventos: ${resumen.total_eventos || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
              <Chip variant="outlined" label={`Ventas: ${resumen.ventas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Pagos: ${resumen.pagos || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
              <Chip variant="outlined" label={`Membresías: ${resumen.membresias || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Caja: ${resumen.cajas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
              <Chip variant="outlined" label={`Cartera: ${resumen.cartera || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Trazabilidad comercial"
                descripcion="Historial de acciones sobre ventas, pagos, caja, cartera y membresías."
                filtros={filtros}
                columnas={columnasPdf}
                filaTotal={[
                  'TOTAL',
                  '',
                  '',
                  '',
                  '',
                  '',
                  '',
                  (filas) => `${filas.length} eventos`,
                ]}
                obtenerFilas={() => trazabilidadComercialServicio.consultarTodo(filtros)}
                exportarExcel={() => trazabilidadComercialServicio.exportarExcel(filtros)}
              />
            </Stack>
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
              <FilterHeaderCell align="center">Fecha</FilterHeaderCell>
              <FilterHeaderCell
                value={filtros.sede_id}
                onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((sede) => ({ value: String(sede.id), label: sede.nombre }))}
                multiple
              >
                Sede
              </FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.proceso} onChange={(valor) => aplicar({ proceso: valor })} options={opciones(catalogos.procesos)} multiple>Proceso</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.referencia} onChange={(valor) => aplicar({ referencia: valor })}>Referencia</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.accion} onChange={(valor) => aplicar({ accion: valor })} options={opciones(catalogos.acciones)} multiple>Acción</FilterHeaderCell>
              <FilterHeaderCell value={filtros.usuario} onChange={(valor) => aplicar({ usuario: valor })} options={opciones(catalogos.usuarios)} multiple>Usuario</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.rol} onChange={(valor) => aplicar({ rol: valor })} options={opciones(catalogos.roles)} multiple>Rol</FilterHeaderCell>
              <FilterHeaderCell value={filtros.descripcion} onChange={(valor) => aplicar({ descripcion: valor })}>Descripción</FilterHeaderCell>
              <TableCell align="center">Detalle</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={9} texto="No existen eventos comerciales para los filtros seleccionados." />
            ) : null}

            {items.map((item) => (
              <TableRow hover key={item.id}>
                <TableCell align="center">{fecha(item.created_at)}</TableCell>
                <TableCell>{item.sede || 'Sin sede'}</TableCell>
                <TableCell align="center">{item.proceso}</TableCell>
                <TableCell align="center">{item.referencia || '—'}</TableCell>
                <TableCell align="center"><Chip label={item.accion} color={colorAccion(item.accion)} size="small" variant="outlined" /></TableCell>
                <TableCell>{item.usuario_nombre || 'Sistema'}</TableCell>
                <TableCell align="center">{item.rol || '—'}</TableCell>
                <TableCell>{item.descripcion || '—'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver datos antes y después">
                    <IconButton size="small" onClick={() => setDetalle(item)} sx={dbanuStyles.actionEdit}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TablaGestion>
      </Paper>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 15 }}>
          {detalle ? `${detalle.proceso} · ${detalle.referencia || detalle.registro_id} · ${detalle.accion}` : ''}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, mb: 1.5, color: uiTokens.colores.textoMedio }}>
            {detalle?.descripcion || 'Evento comercial auditado.'}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 900, mb: 0.5 }}>ANTES</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1, fontSize: 11, overflowX: 'auto', maxHeight: 380 }}>
                {formatearJson(detalle?.datos_antes)}
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 900, mb: 0.5 }}>DESPUÉS</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1, fontSize: 11, overflowX: 'auto', maxHeight: 380 }}>
                {formatearJson(detalle?.datos_despues)}
              </Box>
            </Box>
          </Box>

          <Typography sx={{ fontSize: 10.5, mt: 1.5, color: uiTokens.colores.textoMedio }}>
            IP: {detalle?.ip || '—'}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
