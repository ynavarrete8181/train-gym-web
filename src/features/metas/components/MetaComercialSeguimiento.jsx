import { Box, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';

const dinero = (valor) => Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');

function Indicador({ titulo, real, meta, porcentaje, moneda = false }) {
  const valor = Number(porcentaje || 0);
  return (
    <Box sx={{ p: 1.5, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5 }}>
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>{titulo}</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 900, mt: .35 }}>
        {moneda ? dinero(real) : numero(real)} / {moneda ? dinero(meta) : numero(meta)}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: .7 }}>
        <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, valor))} sx={{ flex: 1, height: 6, borderRadius: 99 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 900 }}>{valor.toFixed(1)}%</Typography>
      </Stack>
    </Box>
  );
}

export function MetaComercialSeguimiento({ detalle }) {
  const meta = detalle?.meta || {};
  const responsables = detalle?.responsables || [];

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Box sx={{ px: 2.5, py: 2.3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.8 }}>
          <Box>
            <Typography variant="h6" fontWeight={950}>{meta.sede || 'Meta comercial'}</Typography>
            <Typography variant="body2" color="text.secondary">Seguimiento consolidado del período {String(meta.mes || '').padStart(2, '0')}/{meta.anio}.</Typography>
          </Box>
          <StatusChip estado={meta.estado === 'ACTIVA' ? 'activo' : 'cerrado'} label={meta.estado || '—'} />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, gap: 1.2, mb: 2 }}>
          <Indicador titulo="Ventas" real={meta.real_ventas} meta={meta.meta_ventas} porcentaje={meta.cumplimiento_ventas} moneda />
          <Indicador titulo="Cobros" real={meta.real_cobros} meta={meta.meta_cobros} porcentaje={meta.cumplimiento_cobros} moneda />
          <Indicador titulo="Membresías nuevas" real={meta.real_membresias_nuevas} meta={meta.meta_membresias_nuevas} porcentaje={meta.cumplimiento_membresias_nuevas} />
          <Indicador titulo="Renovaciones" real={meta.real_renovaciones} meta={meta.meta_renovaciones} porcentaje={meta.cumplimiento_renovaciones} />
        </Box>

        <Box sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 1.6, py: 1.1, bgcolor: '#f8fafc', borderBottom: `1px solid ${uiTokens.colores.borde}` }}>
            <Typography variant="subtitle2" fontWeight={900}>Cumplimiento por responsable</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Responsable</TableCell>
                <TableCell align="center">Ventas</TableCell>
                <TableCell align="center">Cobros</TableCell>
                <TableCell align="center">Nuevas</TableCell>
                <TableCell align="center">Renovaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {responsables.map((r) => (
                <TableRow hover key={r.usuario_id}>
                  <TableCell>{r.responsable}</TableCell>
                  <TableCell align="center">{dinero(r.real_ventas)} / {dinero(r.meta_ventas)} · {Number(r.cumplimiento_ventas || 0).toFixed(1)}%</TableCell>
                  <TableCell align="center">{dinero(r.real_cobros)} / {dinero(r.meta_cobros)} · {Number(r.cumplimiento_cobros || 0).toFixed(1)}%</TableCell>
                  <TableCell align="center">{numero(r.real_membresias_nuevas)} / {numero(r.meta_membresias_nuevas)} · {Number(r.cumplimiento_membresias_nuevas || 0).toFixed(1)}%</TableCell>
                  <TableCell align="center">{numero(r.real_renovaciones)} / {numero(r.meta_renovaciones)} · {Number(r.cumplimiento_renovaciones || 0).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {responsables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2.5, color: 'text.secondary' }}>
                    Sin metas individuales configuradas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>

        {meta.observaciones ? (
          <Box sx={{ mt: 1.5, p: 1.4, bgcolor: '#f8fafc', border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={900}>Observaciones</Typography>
            <Typography variant="body2" color="text.secondary">{meta.observaciones}</Typography>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
