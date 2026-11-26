import { useEffect, useState } from 'react';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, IconButton, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../../components/common/PageHeader.jsx';
import { VisorPdf } from '../../../../components/common/VisorPdf.jsx';
import { FilterHeaderCell } from '../../../../components/tables/FilterHeaderCell.jsx';
import { GestionToolbar } from '../../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../../styles/uiTokens.js';
import { hoyEcuador } from '../../../../utils/fechaLocal.js';
import { ventaServicio } from '../../services/ventaServicio.js';
import { FiltroColumna } from '../../../reportes/components/FiltroColumna.jsx';
import { ReporteExportaciones } from '../../../reportes/components/ReporteExportaciones.jsx';
import { cobrosPeriodoServicio } from '../services/cobrosPeriodoServicio.js';
import { TarjetaReporte as Tarjeta } from '../../../reportes/components/TarjetaReporte.jsx';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—');
const METODOS = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', DEPOSITO: 'Depósito' };
const metodoTexto = (valor) => String(valor || '').split(', ').map((m) => METODOS[m] || m).join(', ');


/**
 * Cobros del período para administración: una fila por cobro (lo que un tutor paga junto es un
 * solo cobro), con quién pagó, qué cuentas, método, comprobante, banco, cajero y sede.
 */
export function CobrosPeriodoPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({
    desde: `${hoyEcuador().slice(0, 7)}-01`,
    hasta: hoyEcuador(),
    sede_id: [],
    metodo_pago: [],
    columnas: {},
    page: 1,
    per_page: 5,
  });
  const [cargando, setCargando] = useState(true);
  const [pdf, setPdf] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await cobrosPeriodoServicio.consultar(params);
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const verComprobante = async (item) => {
    setPdf(null);
    setCargandoPdf(true);
    try {
      const blob = await ventaServicio.obtenerComprobanteCobroPdf(item.codigo_cobro);
      setPdf({ blob, url: URL.createObjectURL(blob), nombre: `${item.codigo_cobro}.pdf` });
    } finally {
      setCargandoPdf(false);
    }
  };
  const cerrarPdf = () => {
    if (pdf?.url) URL.revokeObjectURL(pdf.url);
    setPdf(null);
  };

  const resumen = meta.resumen || {};
  const metodoActivo = (filtros.metodo_pago || []).length === 1 ? filtros.metodo_pago[0] : null;
  const catalogos = meta.catalogos || {};
  const columna = (nombre, titulo, props = {}) => (
    <FiltroColumna columna={nombre} filtros={filtros} opciones={meta.opciones_filtro} aplicar={aplicar} {...props}>{titulo}</FiltroColumna>
  );

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Cobros del período"
        descripcion="Cada cobro con quién pagó, las cuentas que pagó, método, comprobante, banco y cajero."
        icono={<ReceiptLongOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda=""
          mostrarBusqueda={false}
          mostrarTotal={false}
          acciones={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde}
                onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta}
                onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <ReporteExportaciones
                titulo="Cobros del período"
                descripcion="Cada cobro con quién pagó, las cuentas que pagó, método, comprobante, banco y cajero."
                filtros={filtros}
                columnas={[
                  { label: 'Fecha', value: (f) => `${fecha(f.fecha)} ${f.hora || ''}` },
                  { label: 'Cobro', value: 'codigo_cobro' },
                  { label: 'Pagado por', value: 'pagado_por', align: 'left' },
                  { label: 'Cuentas pagadas', value: 'cuentas', align: 'left' },
                  { label: 'Método', value: (f) => metodoTexto(f.metodo_pago) },
                  { label: 'N.º comprobante', value: (f) => f.referencia || '' },
                  { label: 'Banco', value: (f) => f.banco || '' },
                  { label: 'Cajero', value: 'cajero', align: 'left' },
                  { label: 'Total', value: (f) => dinero(f.total) },
                ]}
                obtenerFilas={() => cobrosPeriodoServicio.consultarTodo(filtros)}
                exportarExcel={() => cobrosPeriodoServicio.exportarExcel(filtros)}
              />
            </Stack>
          )}
        />

        {/* Indicadores: al tocar un método o "Por completar" se filtra la tabla. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${2 + (resumen.por_metodo || []).length}, minmax(0, 1fr))` }, gap: 1.25, mb: 1.5 }}>
          <Tarjeta titulo="Total cobrado" valor={dinero(resumen.total_cobrado)} detalle={`${resumen.cobros || 0} cobros · ${resumen.cuentas || 0} cuentas`} color={uiTokens.colores.exito} />
          {(resumen.por_metodo || []).map((m) => (
            <Tarjeta key={m.metodo} titulo={metodoTexto(m.metodo)} valor={dinero(m.total)} color={uiTokens.colores.primario}
              detalle={metodoActivo === m.metodo ? 'Filtrado · toca para quitar' : 'Toca para ver solo estos'}
              activo={metodoActivo === m.metodo}
              onClick={() => aplicar({ metodo_pago: metodoActivo === m.metodo ? [] : [m.metodo] })} />
          ))}
          <Tarjeta titulo="Por completar" valor={`${resumen.por_completar?.cobros || 0}`}
            detalle={`Transferencias sin número o banco · ${dinero(resumen.por_completar?.total)}`}
            color={uiTokens.colores.acentoOscuro} activo={Boolean(filtros.por_completar)}
            onClick={() => aplicar({ por_completar: filtros.por_completar ? undefined : 1 })} />
        </Box>

        <TablaGestion total={meta.total || 0} filtrados={meta.total || 0} page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 5} cargando={cargando}
          onPageChange={(page) => { const n = { ...filtros, page }; setFiltros(n); cargar(n); }}
          onRowsPerPageChange={(perPage) => { const n = { ...filtros, page: 1, per_page: perPage }; setFiltros(n); cargar(n); }}>
          <TableHead>
            <TableRow>
              {columna('fecha', 'Fecha', { align: 'center', formato: fecha })}
              {columna('codigo_cobro', 'Cobro', { align: 'center' })}
              {columna('pagado_por', 'Pagado por')}
              {columna('cuentas', 'Cuentas pagadas')}
              {columna('banco', 'Pago')}
              <FilterHeaderCell value={filtros.sede_id} multiple onChange={(valor) => aplicar({ sede_id: valor })}
                options={(catalogos.sedes || []).map((s) => ({ value: String(s.id), label: s.nombre }))}>Cajero · sede</FilterHeaderCell>
              {columna('total', 'Total', { align: 'center', formato: dinero })}
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.operacion} hover>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {fecha(item.fecha)}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.hora}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{item.codigo_cobro || '—'}</TableCell>
                <TableCell>{item.pagado_por}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  {String(item.cuentas || '').split(', ').map((c) => {
                    const [cliente, contrato] = c.split(' · ');
                    // Si el cliente pagó su propia cuenta no se repite su nombre: basta el contrato.
                    const mismo = cliente === item.pagado_por;
                    return <Box key={c} sx={{ fontSize: 'inherit', lineHeight: 1.35 }}>
                      {mismo ? contrato : cliente}
                      {!mismo && contrato ? <Typography component="span" variant="caption" color="text.secondary"> · {contrato}</Typography> : null}
                    </Box>;
                  })}
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <Box sx={{ fontSize: 'inherit' }}>{metodoTexto(item.metodo_pago)}</Box>
                  {(item.referencia || item.banco) && <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.3,
                    color: /Sin (número|banco)/.test(`${item.referencia} ${item.banco}`) ? 'warning.dark' : 'text.secondary' }}>
                    {[item.referencia, item.banco].filter(Boolean).join(' · ')}
                  </Typography>}
                </TableCell>
                <TableCell>
                  <Box sx={{ fontSize: 'inherit' }}>{item.cajero}</Box>
                  <Typography variant="caption" color="text.secondary">{item.sede}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{dinero(item.total)}</TableCell>
                <TableCell align="center">
                  {item.codigo_cobro ? (
                    <Tooltip title="Ver comprobante del cobro">
                      <IconButton aria-label="Ver comprobante del cobro" size="small" sx={dbanuStyles.actionView} onClick={() => verComprobante(item)}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {!cargando && items.length === 0 ? <TablaEstadoFila colSpan={8} texto="No hay cobros para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
      <VisorPdf titulo="Comprobante de cobro" pdf={pdf} cargando={cargandoPdf} onCerrar={cerrarPdf} />
    </Box>
  );
}
