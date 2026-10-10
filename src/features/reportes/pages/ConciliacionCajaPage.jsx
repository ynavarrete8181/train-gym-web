import { useEffect, useState } from 'react';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import { Box, Chip, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { conciliacionCajaServicio } from '../services/ventas/conciliacionCajaServicio.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-EC') : '—';
const hora = (valor) => valor ? new Date(valor).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—';
const opciones = (items = []) => (items || []).map((item) => ({ value: String(item), label: String(item) }));

export function ConciliacionCajaPage() {
  const hoy = new Date();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    fecha: '',
    sede_id: [],
    caja: '',
    cajero: '',
    apertura: '',
    cierre: '',
    saldo_inicial: '',
    efectivo_cobrado: '',
    efectivo_esperado: '',
    efectivo_contado: '',
    diferencia: '',
    transferencia: '',
    tarjeta: '',
    deposito: '',
    otros: '',
    tipo_cierre: [],
    estado_conciliacion: [],
    page: 1,
    per_page: 10,
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
              <FilterHeaderCell align="center" value={filtros.fecha} onChange={(valor) => aplicar({ fecha: valor })}>Fecha</FilterHeaderCell>
              <FilterHeaderCell value={filtros.sede_id} onChange={(valor) => aplicar({ sede_id: valor })} options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))} multiple>Sede</FilterHeaderCell>
              <FilterHeaderCell value={filtros.caja} onChange={(valor) => aplicar({ caja: valor })}>Caja</FilterHeaderCell>
              <FilterHeaderCell value={filtros.cajero} onChange={(valor) => aplicar({ cajero: valor })}>Cajero</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.apertura} onChange={(valor) => aplicar({ apertura: valor })}>Apertura</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.cierre} onChange={(valor) => aplicar({ cierre: valor })}>Cierre</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.saldo_inicial} onChange={(valor) => aplicar({ saldo_inicial: valor })}>Saldo inicial</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.efectivo_cobrado} onChange={(valor) => aplicar({ efectivo_cobrado: valor })}>Efectivo cobrado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.efectivo_esperado} onChange={(valor) => aplicar({ efectivo_esperado: valor })}>Efectivo esperado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.efectivo_contado} onChange={(valor) => aplicar({ efectivo_contado: valor })}>Efectivo contado</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.diferencia} onChange={(valor) => aplicar({ diferencia: valor })}>Diferencia</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.transferencia} onChange={(valor) => aplicar({ transferencia: valor })}>Transferencias</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tarjeta} onChange={(valor) => aplicar({ tarjeta: valor })}>Tarjetas</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.deposito} onChange={(valor) => aplicar({ deposito: valor })}>Depósitos</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.otros} onChange={(valor) => aplicar({ otros: valor })}>Otros</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.tipo_cierre} onChange={(valor) => aplicar({ tipo_cierre: valor })} options={opciones(catalogos.tipos_cierre)} multiple>Tipo cierre</FilterHeaderCell>
              <FilterHeaderCell align="center" value={filtros.estado_conciliacion} onChange={(valor) => aplicar({ estado_conciliacion: valor })} options={catalogos.estados_conciliacion || []} multiple>Conciliación</FilterHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell align="center">{fecha(item.fecha_cierre)}</TableCell>
                <TableCell>{item.sede}</TableCell>
                <TableCell>{item.caja_nombre}<br /><small>{item.caja_codigo}</small></TableCell>
                <TableCell>{item.cajero}</TableCell>
                <TableCell align="center">{hora(item.fecha_apertura)}</TableCell>
                <TableCell align="center">{hora(item.fecha_cierre)}</TableCell>
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
