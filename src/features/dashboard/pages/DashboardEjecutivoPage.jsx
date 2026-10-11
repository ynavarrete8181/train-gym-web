import { useEffect, useMemo, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { dashboardEjecutivoServicio } from '../services/dashboardEjecutivoServicio.js';

const dinero = (valor) => Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const fecha = (valor) => {
  if (!valor) return '—';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
};

function Indicador({ titulo, valor, detalle, icono, cargando = false }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: 92,
        p: 1.4,
        borderRadius: 1.2,
        borderColor: uiTokens.colores.borde,
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: uiTokens.colores.textoMedio, textTransform: 'uppercase', letterSpacing: 0.25 }}>
            {titulo}
          </Typography>
          {cargando ? (
            <Skeleton width={85} height={32} />
          ) : (
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.2, mt: 0.3 }}>
              {valor}
            </Typography>
          )}
          <Typography sx={{ fontSize: 10.8, color: uiTokens.colores.textoMedio, mt: 0.4 }}>
            {detalle}
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1 }}>
          {icono}
        </Box>
      </Stack>
    </Paper>
  );
}

function Bloque({ titulo, descripcion, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.2, borderColor: uiTokens.colores.borde, boxShadow: 'none' }}>
      <Box sx={{ mb: 1.2 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>{titulo}</Typography>
        <Typography sx={{ fontSize: 10.8, color: uiTokens.colores.textoMedio }}>{descripcion}</Typography>
      </Box>
      {children}
    </Paper>
  );
}

function TablaCompacta({ columnas, filas, vacio = 'Sin información para el período seleccionado.' }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columnas.map((columna) => (
              <TableCell
                key={columna.key}
                align={columna.align || 'left'}
                sx={{ py: 0.8, fontSize: 10.5, fontWeight: 900, bgcolor: '#f8fafc', whiteSpace: 'nowrap' }}
              >
                {columna.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnas.length} align="center" sx={{ py: 2.5, fontSize: 11.5, color: uiTokens.colores.textoMedio }}>
                {vacio}
              </TableCell>
            </TableRow>
          ) : filas.map((fila, indice) => (
            <TableRow hover key={fila.id || fila.sede || fila.item || fila.responsable || indice}>
              {columnas.map((columna) => (
                <TableCell key={columna.key} align={columna.align || 'left'} sx={{ py: 0.75, fontSize: 11.5 }}>
                  {columna.render ? columna.render(fila) : (fila[columna.key] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function DashboardEjecutivoPage() {
  const hoy = new Date();
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    sede_id: '',
  });

  const cargar = async (parametros = filtros) => {
    setCargando(true);
    try {
      const response = await dashboardEjecutivoServicio.consultar(parametros);
      setDatos(response.datos || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const actualizar = (clave, valor) => {
    const nuevos = { ...filtros, [clave]: valor };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const indicadores = datos.indicadores || {};
  const catalogos = datos.catalogos || {};

  const variacionVentas = Number(indicadores.variacion_ventas || 0);
  const variacionCobros = Number(indicadores.variacion_cobros || 0);

  const tarjetas = useMemo(() => [
    {
      titulo: 'Ventas',
      valor: dinero(indicadores.ventas),
      detalle: `${numero(indicadores.transacciones)} transacciones · ${variacionVentas >= 0 ? '+' : ''}${variacionVentas.toFixed(1)}% vs. período anterior`,
      icono: variacionVentas >= 0 ? <TrendingUpOutlinedIcon fontSize="small" /> : <TrendingDownOutlinedIcon fontSize="small" />,
    },
    {
      titulo: 'Cobrado',
      valor: dinero(indicadores.cobrado),
      detalle: `${variacionCobros >= 0 ? '+' : ''}${variacionCobros.toFixed(1)}% vs. período anterior`,
      icono: <AttachMoneyOutlinedIcon fontSize="small" />,
    },
    {
      titulo: 'Ticket promedio',
      valor: dinero(indicadores.ticket_promedio),
      detalle: 'Promedio por transacción',
      icono: <SellOutlinedIcon fontSize="small" />,
    },
    {
      titulo: 'Membresías activas',
      valor: numero(indicadores.membresias_activas),
      detalle: `${numero(indicadores.membresias_nuevas)} nuevas · ${numero(indicadores.renovaciones)} renovaciones`,
      icono: <AutorenewOutlinedIcon fontSize="small" />,
    },
    {
      titulo: 'Cartera vencida',
      valor: dinero(indicadores.cartera_vencida),
      detalle: `${numero(indicadores.cuentas_vencidas)} cuentas vencidas`,
      icono: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
    },
    {
      titulo: 'Caja',
      valor: numero(indicadores.turnos_abiertos),
      detalle: `${numero(indicadores.conciliaciones_pendientes)} conciliaciones pendientes`,
      icono: <PointOfSaleOutlinedIcon fontSize="small" />,
    },
  ], [indicadores, variacionVentas, variacionCobros]);

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Dashboard ejecutivo"
        descripcion="Indicadores comerciales, membresías, cartera y caja consolidados por período y sede."
        icono={<SpaceDashboardOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          sx={{ mb: 1.5, alignItems: { xs: 'stretch', md: 'center' } }}
        >
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filtros.desde}
            onChange={(e) => actualizar('desde', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filtros.hasta}
            onChange={(e) => actualizar('hasta', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            select
            size="small"
            label="Sede"
            value={filtros.sede_id}
            onChange={(e) => actualizar('sede_id', e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todas las sedes permitidas</MenuItem>
            {(catalogos.sedes || []).map((sede) => (
              <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
            ))}
          </TextField>
          <Chip
            variant="outlined"
            label={`${fecha(datos.periodo?.desde)} - ${fecha(datos.periodo?.hasta)}`}
            sx={{ height: 40, borderRadius: 0.7, fontWeight: 900 }}
          />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 1, mb: 1.5 }}>
          {tarjetas.map((tarjeta) => <Indicador key={tarjeta.titulo} {...tarjeta} cargando={cargando} />)}
        </Box>

        {(datos.alertas || []).length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1, mb: 1.5 }}>
            {(datos.alertas || []).map((alerta, indice) => (
              <Alert
                key={`${alerta.tipo}-${indice}`}
                severity={alerta.nivel || 'info'}
                variant="outlined"
                icon={<WarningAmberOutlinedIcon fontSize="small" />}
                sx={{ py: 0.2, '& .MuiAlert-message': { py: 0.4 } }}
              >
                <Typography sx={{ fontSize: 11.5, fontWeight: 900 }}>{alerta.titulo}</Typography>
                <Typography sx={{ fontSize: 10.8 }}>{alerta.detalle}</Typography>
              </Alert>
            ))}
          </Box>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.2, mb: 1.2 }}>
          <Bloque titulo="Ventas por sede" descripcion="Comportamiento comercial dentro del período seleccionado.">
            <TablaCompacta
              columnas={[
                { key: 'sede', label: 'Sede' },
                { key: 'transacciones', label: 'Ventas', align: 'center', render: (f) => numero(f.transacciones) },
                { key: 'total_ventas', label: 'Total', align: 'center', render: (f) => dinero(f.total_ventas) },
              ]}
              filas={datos.ventas_por_sede || []}
            />
          </Bloque>

          <Bloque titulo="Top responsables comerciales" descripcion="Responsables ordenados por total vendido.">
            <TablaCompacta
              columnas={[
                { key: 'responsable', label: 'Responsable' },
                { key: 'ventas', label: 'Ventas', align: 'center', render: (f) => numero(f.ventas) },
                { key: 'total_ventas', label: 'Total', align: 'center', render: (f) => dinero(f.total_ventas) },
                { key: 'porcentaje_cobrado', label: 'Cobrado', align: 'center', render: (f) => `${Number(f.porcentaje_cobrado || 0).toFixed(1)}%` },
              ]}
              filas={datos.top_responsables || []}
            />
          </Bloque>
        </Box>

        {(datos.metas_comerciales || []).length > 0 ? (
          <Box sx={{ mb: 1.2 }}>
            <Bloque titulo="Cumplimiento de metas comerciales" descripcion="Seguimiento mensual por sede según el mes correspondiente al período seleccionado.">
              <TablaCompacta
                columnas={[
                  { key: 'sede', label: 'Sede' },
                  { key: 'ventas', label: 'Ventas', align: 'center', render: (f) => `${dinero(f.real_ventas)} / ${dinero(f.meta_ventas)} · ${Number(f.cumplimiento_ventas || 0).toFixed(1)}%` },
                  { key: 'cobros', label: 'Cobros', align: 'center', render: (f) => `${dinero(f.real_cobros)} / ${dinero(f.meta_cobros)} · ${Number(f.cumplimiento_cobros || 0).toFixed(1)}%` },
                  { key: 'nuevas', label: 'Nuevas', align: 'center', render: (f) => `${numero(f.real_membresias_nuevas)} / ${numero(f.meta_membresias_nuevas)} · ${Number(f.cumplimiento_membresias_nuevas || 0).toFixed(1)}%` },
                  { key: 'renovaciones', label: 'Renovaciones', align: 'center', render: (f) => `${numero(f.real_renovaciones)} / ${numero(f.meta_renovaciones)} · ${Number(f.cumplimiento_renovaciones || 0).toFixed(1)}%` },
                ]}
                filas={datos.metas_comerciales || []}
              />
            </Bloque>
          </Box>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.2, mb: 1.2 }}>
          <Bloque titulo="Productos y servicios más vendidos" descripcion="Ranking por valor vendido en el período.">
            <TablaCompacta
              columnas={[
                { key: 'item', label: 'Producto / servicio' },
                { key: 'tipo_item', label: 'Tipo', align: 'center' },
                { key: 'cantidad', label: 'Cantidad', align: 'center', render: (f) => numero(f.cantidad) },
                { key: 'total_vendido', label: 'Total', align: 'center', render: (f) => dinero(f.total_vendido) },
              ]}
              filas={datos.top_productos_servicios || []}
            />
          </Bloque>

          <Bloque titulo="Membresías próximas a vencer" descripcion="Próximos 30 días; prioriza seguimiento y renovación.">
            <TablaCompacta
              columnas={[
                { key: 'cliente', label: 'Cliente' },
                { key: 'plan', label: 'Plan' },
                { key: 'fecha_fin', label: 'Vence', align: 'center', render: (f) => fecha(f.fecha_fin) },
                { key: 'dias_restantes', label: 'Días', align: 'center', render: (f) => numero(f.dias_restantes) },
              ]}
              filas={datos.membresias_proximas_vencer || []}
            />
          </Bloque>
        </Box>

        <Bloque titulo="Cartera crítica" descripcion="Primeras cuentas vencidas que requieren atención comercial.">
          <TablaCompacta
            columnas={[
              { key: 'venta_numero', label: 'Venta', align: 'center' },
              { key: 'cliente', label: 'Cliente' },
              { key: 'sede', label: 'Sede' },
              { key: 'fecha_vencimiento', label: 'Vencimiento', align: 'center', render: (f) => fecha(f.fecha_vencimiento) },
              { key: 'dias_vencidos', label: 'Días vencidos', align: 'center', render: (f) => numero(f.dias_vencidos) },
              { key: 'saldo_pendiente', label: 'Saldo', align: 'center', render: (f) => dinero(f.saldo_pendiente) },
              { key: 'responsable', label: 'Responsable' },
            ]}
            filas={datos.cartera_critica || []}
          />
        </Bloque>
      </Paper>
    </Box>
  );
}
