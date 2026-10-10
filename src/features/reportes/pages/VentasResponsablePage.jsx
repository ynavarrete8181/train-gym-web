import { useEffect, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ventasResponsableServicio } from '../services/ventas/ventasResponsableServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const porcentaje = (valor) => `${Number(valor || 0).toFixed(2)}%`;

export function VentasResponsablePage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    sede_id: [],
    responsable_id: [],
    responsable: '',
    ventas: '',
    clientes: '',
    total_ventas: '',
    total_cobrado: '',
    saldo: '',
    ticket_promedio: '',
    porcentaje_cobrado: '',
    page: 1,
    per_page: 10,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await ventasResponsableServicio.consultar(params);
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
        titulo="Ventas por responsable"
        descripcion="Desempeño comercial por responsable según período y sedes autorizadas."
        icono={<GroupsOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          mostrarBusqueda={false}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Responsables: ${resumen.responsables || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Ventas: ${resumen.ventas || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Total vendido: ${dinero(resumen.total_ventas)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
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
              <FilterHeaderCell
                value={filtros.responsable_id}
                onChange={(valor) => aplicar({ responsable_id: valor })}
                options={(catalogos.responsables || []).map((r) => ({ value: String(r.id), label: r.nombre }))}
                multiple
              >
                Responsable
              </FilterHeaderCell>
              <FilterHeaderCell
                value={filtros.sede_id}
                onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}
                multiple
              >
                Sede
              </FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.ventas} onChange={(valor) => aplicar({ ventas: valor })}>Ventas</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.clientes} onChange={(valor) => aplicar({ clientes: valor })}>Clientes</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.total_ventas} onChange={(valor) => aplicar({ total_ventas: valor })}>Total vendido</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.total_cobrado} onChange={(valor) => aplicar({ total_cobrado: valor })}>Cobrado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.saldo} onChange={(valor) => aplicar({ saldo: valor })}>Saldo</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.ticket_promedio} onChange={(valor) => aplicar({ ticket_promedio: valor })}>Ticket promedio</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.porcentaje_cobrado} onChange={(valor) => aplicar({ porcentaje_cobrado: valor })}>% cobrado</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.responsable_comercial_id ?? 'sin'}-${index}`} hover>
                <TableCell>{item.responsable}</TableCell>
                <TableCell>{filtros.sede_id.length === 1 ? (catalogos.sedes || []).find((s) => String(s.id) === String(filtros.sede_id[0]))?.nombre || 'Sede seleccionada' : 'Sedes filtradas'}</TableCell>
                <TableCell align="center">{numero(item.ventas)}</TableCell>
                <TableCell align="center">{numero(item.clientes)}</TableCell>
                <TableCell align="center">{dinero(item.total_ventas)}</TableCell>
                <TableCell align="center">{dinero(item.total_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.saldo_pendiente)}</TableCell>
                <TableCell align="center">{dinero(item.ticket_promedio)}</TableCell>
                <TableCell align="center">{porcentaje(item.porcentaje_cobrado)}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={9} texto="No existen ventas por responsable para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
