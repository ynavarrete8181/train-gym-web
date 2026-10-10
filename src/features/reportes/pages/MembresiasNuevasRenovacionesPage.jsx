import { useEffect, useState } from 'react';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { membresiasNuevasRenovacionesServicio } from '../services/ventas/membresiasNuevasRenovacionesServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function MembresiasNuevasRenovacionesPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    fecha_movimiento: '',
    sede_id: [],
    tipo_movimiento: [],
    codigo_contrato: '',
    cliente: '',
    plan: '',
    modalidad: '',
    numero_periodo: '',
    estado_periodo: [],
    precio: '',
    cobrado: '',
    saldo: '',
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await membresiasNuevasRenovacionesServicio.consultar(params);
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

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Membresías nuevas y renovaciones"
        descripcion="Consulta altas y renovaciones de membresías por período, sede, plan y estado."
        icono={<AutorenewOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Nuevas: ${resumen.nuevas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Renovaciones: ${resumen.renovaciones || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Facturado: ${dinero(resumen.total_facturado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Cobrado: ${dinero(resumen.total_cobrado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
              <Chip variant="outlined" label={`Saldo: ${dinero(resumen.saldo_pendiente)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
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
              <FilterHeaderCell align="center" value={filtros.fecha_movimiento} onChange={(valor) => aplicar({ fecha_movimiento: valor })}>Fecha</FilterHeaderCell>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tipo_movimiento} onChange={(valor) => aplicar({ tipo_movimiento: valor })} options={catalogos.tipos_movimiento || []} multiple>Movimiento</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.codigo_contrato} onChange={(valor) => aplicar({ codigo_contrato: valor })}>Contrato</FilterHeaderCell>
              <FilterHeaderCell value={filtros.cliente} onChange={(valor) => aplicar({ cliente: valor })}>Cliente</FilterHeaderCell>
              <FilterHeaderCell value={filtros.plan} onChange={(valor) => aplicar({ plan: valor })}>Plan</FilterHeaderCell>
              <FilterHeaderCell value={filtros.modalidad} onChange={(valor) => aplicar({ modalidad: valor })}>Modalidad</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.numero_periodo} onChange={(valor) => aplicar({ numero_periodo: valor })}>Período</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado_periodo} onChange={(valor) => aplicar({ estado_periodo: valor })} options={opciones(catalogos.estados_periodo)} multiple>Estado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.precio} onChange={(valor) => aplicar({ precio: valor })}>Precio</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.cobrado} onChange={(valor) => aplicar({ cobrado: valor })}>Cobrado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.saldo} onChange={(valor) => aplicar({ saldo: valor })}>Saldo</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center">{fecha(item.fecha_movimiento)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.tipo_movimiento === 'RENOVACION' ? 'Renovación' : 'Nueva'}</TableCell>
                <TableCell align="center">{item.codigo_contrato}</TableCell>
                <TableCell>{item.cliente}<br /><small>{item.identificacion}</small></TableCell>
                <TableCell>{item.plan}</TableCell>
                <TableCell>{item.modalidad}</TableCell>
                <TableCell align="center">{item.numero_periodo}</TableCell>
                <TableCell align="center">{item.estado_periodo}</TableCell>
                <TableCell align="center">{dinero(item.precio)}</TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={12} texto="No existen membresías nuevas o renovaciones para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
