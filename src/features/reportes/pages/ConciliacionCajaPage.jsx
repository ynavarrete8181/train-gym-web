import { useEffect, useState } from 'react';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { FiltroColumna } from '../components/FiltroColumna.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { ReporteExportaciones } from '../components/ReporteExportaciones.jsx';
import { conciliacionCajaServicio } from '../services/ventas/conciliacionCajaServicio.js';
import { hoyEcuador } from '../../../utils/fechaLocal.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fechaDia = (valor) => new Date(`${valor}T00:00:00`).toLocaleDateString('es-EC');
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function ConciliacionCajaPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoyEcuador(),
    sede_id: [],
    columnas: {},
    tipo_cierre: [],
    estado_conciliacion: [],
    page: 1,
    per_page: 5,
  });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await conciliacionCajaServicio.consultar(params);
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
        titulo="Conciliación de caja"
        descripcion="Consulta cierres de caja, efectivo esperado, efectivo contado y diferencias por sede."
        icono={<BalanceOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          mostrarTotal={false}
          resumen={(
            <>
              <Chip variant="outlined" label={`Turnos cerrados: ${resumen.turnos_cerrados || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.textoFuerte, borderColor: uiTokens.colores.borde }} />
              <Chip variant="outlined" label={`Esperado: ${dinero(resumen.efectivo_esperado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.primario, borderColor: uiTokens.colores.primario }} />
              <Chip variant="outlined" label={`Contado: ${dinero(resumen.efectivo_contado)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.exito, borderColor: uiTokens.colores.exito }} />
              <Chip variant="outlined" label={`Diferencia: ${dinero(resumen.diferencia_total)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: Number(resumen.diferencia_total || 0) === 0 ? uiTokens.colores.exito : uiTokens.colores.peligro, borderColor: Number(resumen.diferencia_total || 0) === 0 ? uiTokens.colores.exito : uiTokens.colores.peligro }} />
              <Chip variant="outlined" label={`No efectivo: ${dinero(resumen.no_efectivo)}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.info, borderColor: uiTokens.colores.info }} />
              <Chip variant="outlined" label={`Pendientes: ${resumen.pendientes_conciliacion || 0}`} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900, color: uiTokens.colores.advertencia, borderColor: uiTokens.colores.advertencia }} />
            </>
          )}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Conciliación de caja"
                descripcion="Cierres de caja, efectivo esperado, efectivo contado y diferencias."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (fila) => fechaDia(fila.fecha) },
                  { label: 'Sede', value: 'sede', align: 'left' },
                  { label: 'Caja', value: (fila) => `${fila.caja_nombre || ''} ${fila.caja_codigo || ''}`, align: 'left' },
                  { label: 'Cajero', value: 'cajero', align: 'left' },
                  { label: 'Apertura', value: 'hora_apertura' },
                  { label: 'Cierre', value: 'hora_cierre' },
                  { label: 'Saldo inicial', value: (fila) => dinero(fila.saldo_inicial) },
                  { label: 'Efectivo cobrado', value: (fila) => dinero(fila.efectivo_cobrado) },
                  { label: 'Esperado', value: (fila) => dinero(fila.efectivo_esperado) },
                  { label: 'Contado', value: (fila) => dinero(fila.efectivo_contado) },
                  { label: 'Diferencia', value: (fila) => dinero(fila.diferencia) },
                  { label: 'Transferencias', value: (fila) => dinero(fila.transferencia_cobrada) },
                  { label: 'Tarjetas', value: (fila) => dinero(fila.tarjeta_cobrada) },
                  { label: 'Depósitos', value: (fila) => dinero(fila.deposito_cobrado) },
                  { label: 'Otros', value: (fila) => dinero(fila.otros_cobrado) },
                  { label: 'Tipo cierre', value: 'tipo_cierre' },
                  { label: 'Conciliación', value: (fila) => fila.requiere_arqueo ? 'Pendiente' : 'Conciliado' },
                ]}
                obtenerFilas={() => conciliacionCajaServicio.consultarTodo(filtros)}
                exportarExcel={() => conciliacionCajaServicio.exportarExcel(filtros)}
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
              <FiltroColumna align="center" columna="fecha" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={fechaDia}>Fecha</FiltroColumna>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FiltroColumna columna="caja_nombre" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Caja</FiltroColumna>
              <FiltroColumna columna="cajero" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Cajero</FiltroColumna>
              <FiltroColumna align="center" columna="hora_apertura" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Apertura</FiltroColumna>
              <FiltroColumna align="center" columna="hora_cierre" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar}>Cierre</FiltroColumna>
              <FiltroColumna align="center" columna="saldo_inicial" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Saldo inicial</FiltroColumna>
              <FiltroColumna align="center" columna="efectivo_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Efectivo cobrado</FiltroColumna>
              <FiltroColumna align="center" columna="efectivo_esperado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Efectivo esperado</FiltroColumna>
              <FiltroColumna align="center" columna="efectivo_contado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Efectivo contado</FiltroColumna>
              <FiltroColumna align="center" columna="diferencia" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Diferencia</FiltroColumna>
              <FiltroColumna align="center" columna="transferencia_cobrada" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Transferencias</FiltroColumna>
              <FiltroColumna align="center" columna="tarjeta_cobrada" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Tarjetas</FiltroColumna>
              <FiltroColumna align="center" columna="deposito_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Depósitos</FiltroColumna>
              <FiltroColumna align="center" columna="otros_cobrado" filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} formato={dinero}>Otros</FiltroColumna>
              <FilterHeaderCell align="center" value={filtros.tipo_cierre} onChange={(valor) => aplicar({ tipo_cierre: valor })} options={opciones(catalogos.tipos_cierre)} multiple>Tipo cierre</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado_conciliacion} onChange={(valor) => aplicar({ estado_conciliacion: valor })} options={catalogos.estados_conciliacion || []} multiple>Conciliación</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center">{fechaDia(item.fecha)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell>{item.caja_nombre}<br /><small>{item.caja_codigo}</small></TableCell>
                <TableCell>{item.cajero}</TableCell>
                <TableCell align="center">{item.hora_apertura}</TableCell>
                <TableCell align="center">{item.hora_cierre}</TableCell>
                <TableCell align="center">{dinero(item.saldo_inicial)}</TableCell>
                <TableCell align="center">{dinero(item.efectivo_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.efectivo_esperado)}</TableCell>
                <TableCell align="center">{dinero(item.efectivo_contado)}</TableCell>
                <TableCell align="center">{dinero(item.diferencia)}</TableCell>
                <TableCell align="center">{dinero(item.transferencia_cobrada)}</TableCell>
                <TableCell align="center">{dinero(item.tarjeta_cobrada)}</TableCell>
                <TableCell align="center">{dinero(item.deposito_cobrado)}</TableCell>
                <TableCell align="center">{dinero(item.otros_cobrado)}</TableCell>
                <TableCell align="center">{item.tipo_cierre || '—'}</TableCell>
                <TableCell align="center">{item.requiere_arqueo ? 'Pendiente' : 'Conciliado'}</TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={17} texto="No existen cierres de caja para los filtros seleccionados." />
            ) : null}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
