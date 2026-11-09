import { useEffect, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { ventasResponsableServicio } from '../services/ventas/ventasResponsableServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

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
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    responsable_id: [],
    responsable: '',
    page: 1,
    per_page: 5,
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
              <ReporteExportaciones
                titulo="Ventas por responsable"
                descripcion="Desempeño comercial por responsable y sede."
                filtros={filtros}
                columnas={[
                  { label: 'Responsable', value: 'responsable', align: 'left' },
                  { label: 'Sede', value: 'sede', align: 'left' },
                  { label: 'Ventas', value: (fila) => numero(fila.ventas) },
                  { label: 'Clientes', value: (fila) => numero(fila.clientes) },
                  { label: 'Total vendido', value: (fila) => dinero(fila.total_ventas) },
                  { label: 'Cobrado', value: (fila) => dinero(fila.total_cobrado) },
                  { label: 'Saldo', value: (fila) => dinero(fila.saldo_pendiente) },
                  { label: 'Ticket promedio', value: (fila) => dinero(fila.ticket_promedio) },
                  { label: '% cobrado', value: (fila) => porcentaje(fila.porcentaje_cobrado) },
                ]}
                obtenerFilas={() => ventasResponsableServicio.consultarTodo(filtros)}
                exportarExcel={() => ventasResponsableServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5}
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
              <FiltroColumna align="center" columna="ventas" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={numero}>Ventas</FiltroColumna>
              <FiltroColumna align="center" columna="clientes" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={numero}>Clientes</FiltroColumna>
              <FiltroColumna align="center" columna="total_ventas" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Total vendido</FiltroColumna>
              <FiltroColumna align="center" columna="total_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Cobrado</FiltroColumna>
              <FiltroColumna align="center" columna="saldo_pendiente" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Saldo</FiltroColumna>
              <FiltroColumna align="center" columna="ticket_promedio" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Ticket promedio</FiltroColumna>
              <FiltroColumna align="center" columna="porcentaje_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={porcentaje}>% cobrado</FiltroColumna>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.responsable_comercial_id ?? 'sin'}-${index}`} hover>
                <TableCell>{item.responsable}</TableCell>
                <TableCell>{item.sede}</TableCell>
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
