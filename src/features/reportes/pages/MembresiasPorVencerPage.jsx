import { useEffect, useMemo, useState } from 'react';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { membresiasPorVencerServicio } from '../services/ventas/membresiasPorVencerServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC') : '—';
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

function sumarDias(fechaBase, dias) {
  const [anio, mes, dia] = fechaBase.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function MembresiasPorVencerPage() {
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    vence_desde: hoy,
    vence_hasta: sumarDias(hoy, 30),
    sede_id: [],
    codigo_contrato: '',
    cliente: '',
    plan: '',
    modalidad: '',
    numero_periodo: '',
    fecha_fin: '',
    dias_restantes: '',
    renovable: [],
    estado_periodo: [],
    saldo: '',
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await membresiasPorVencerServicio.consultar(params);
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
        titulo="Membresías por vencer"
        descripcion="Seguimiento de períodos vigentes próximos a finalizar para gestión de renovación."
        icono={<EventAvailableOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Por vencer: ${resumen.total_por_vencer || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`≤ 7 días: ${resumen.vence_7_dias || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.peligro, borderColor: uiTokens.colores.peligro }} />
              <Chip variant="outlined" label={`≤ 15 días: ${resumen.vence_15_dias || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
              <Chip variant="outlined" label={`Renovables: ${resumen.renovables || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Saldo: ${dinero(resumen.saldo_pendiente)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Vence desde" value={filtros.vence_desde} onChange={(e) => aplicar({ vence_desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Vence hasta" value={filtros.vence_hasta} onChange={(e) => aplicar({ vence_hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
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
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.codigo_contrato} onChange={(valor) => aplicar({ codigo_contrato: valor })}>Contrato</FilterHeaderCell>
              <FilterHeaderCell value={filtros.cliente} onChange={(valor) => aplicar({ cliente: valor })}>Cliente</FilterHeaderCell>
              <FilterHeaderCell value={filtros.plan} onChange={(valor) => aplicar({ plan: valor })}>Plan</FilterHeaderCell>
              <FilterHeaderCell value={filtros.modalidad} onChange={(valor) => aplicar({ modalidad: valor })}>Modalidad</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.numero_periodo} onChange={(valor) => aplicar({ numero_periodo: valor })}>Período</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.fecha_fin} onChange={(valor) => aplicar({ fecha_fin: valor })}>Vence</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.dias_restantes} onChange={(valor) => aplicar({ dias_restantes: valor })}>Días restantes</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.renovable} onChange={(valor) => aplicar({ renovable: valor })} options={catalogos.renovable || []} multiple>Renovable</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado_periodo} onChange={(valor) => aplicar({ estado_periodo: valor })} options={opciones(catalogos.estados_periodo)} multiple>Estado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.saldo} onChange={(valor) => aplicar({ saldo: valor })}>Saldo</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.sede}</TableCell>
                <TableCell align="center">{item.codigo_contrato}</TableCell>
                <TableCell>{item.cliente}<br /><small>{item.identificacion}</small></TableCell>
                <TableCell>{item.plan}</TableCell>
                <TableCell>{item.modalidad}</TableCell>
                <TableCell align="center">{item.numero_periodo}</TableCell>
                <TableCell align="center">{fecha(item.fecha_fin)}</TableCell>
                <TableCell align="center">{item.dias_restantes}</TableCell>
                <TableCell align="center">{item.renovable ? 'Sí' : 'No'}</TableCell>
                <TableCell align="center">{item.estado_periodo}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={11} texto="No existen membresías próximas a vencer para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
