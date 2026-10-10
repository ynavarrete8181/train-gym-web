import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { uiTokens } from '../../../../styles/uiTokens.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');
const porcentaje = (valor) => `${Number(valor || 0).toFixed(2)}%`;

function Indicador({ label, value, color, fondo }) {
  return (
    <Chip
      variant="outlined"
      label={`${label}: ${value}`}
      sx={{
        height: 36,
        borderRadius: 0.5,
        fontWeight: 900,
        color,
        bgcolor: fondo,
        borderColor: color,
        '& .MuiChip-label': { px: 1.25, fontSize: 11.3 },
      }}
    />
  );
}

function BloqueTabla({ titulo, columnas, filas, renderFila }) {
  return (
    <Box sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 0.75, overflow: 'hidden', minWidth: 0 }}>
      <Box sx={{ px: 1.4, py: 1, bgcolor: 'rgba(15, 23, 42, 0.025)', borderBottom: `1px solid ${uiTokens.colores.borde}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>{titulo}</Typography>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columnas.map((columna) => (
                <TableCell key={columna} sx={{ fontSize: 10.5, fontWeight: 900, py: 0.7, whiteSpace: 'nowrap' }}>{columna}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.length ? filas.map(renderFila) : (
              <TableRow>
                <TableCell colSpan={columnas.length} sx={{ fontSize: 11.5, color: 'text.secondary', py: 1.5 }}>
                  Sin datos para el período seleccionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

export function AnaliticaComercialResumen({ analitica = {}, resumen = {} }) {
  const actual = analitica.periodo_actual || {};
  const anterior = analitica.periodo_anterior || {};
  const variacion = analitica.variacion || {};
  const membresias = analitica.membresias || {};
  const cartera = analitica.cartera_vencida || {};
  const metodos = analitica.metodos_pago || [];
  const responsables = analitica.responsables || [];

  return (
    <Stack spacing={1.4} sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
        <Indicador label="Ventas período" value={dinero(actual.ventas)} color={uiTokens.colores.primario} fondo={uiTokens.colores.primarioSuave} />
        <Indicador label="Transacciones" value={numero(resumen.transacciones)} color={uiTokens.colores.textoFuerte} fondo="rgba(15,23,42,0.035)" />
        <Indicador label="Variación ventas" value={porcentaje(variacion.ventas_porcentaje)} color={uiTokens.colores.info} fondo="rgba(29, 78, 216, 0.06)" />
        <Indicador label="Cobrado período" value={dinero(actual.cobrado)} color={uiTokens.colores.exito} fondo="rgba(8, 127, 91, 0.06)" />
        <Indicador label="Efectivo" value={dinero(resumen.efectivo_cobrado)} color={uiTokens.colores.exito} fondo="rgba(8,127,91,0.04)" />
        <Indicador label="Variación cobros" value={porcentaje(variacion.cobrado_porcentaje)} color={uiTokens.colores.acentoOscuro} fondo={uiTokens.colores.acentoSuave} />
        <Indicador label="Membresías nuevas" value={numero(membresias.nuevas)} color={uiTokens.colores.primario} fondo="rgba(0,73,135,0.05)" />
        <Indicador label="Renovaciones" value={numero(membresias.renovaciones)} color={uiTokens.colores.info} fondo="rgba(29,78,216,0.05)" />
        <Indicador label="Saldo cartera" value={dinero(resumen.saldo_cartera)} color={uiTokens.colores.advertencia} fondo="rgba(183,121,31,0.05)" />
        <Indicador label="Cartera vencida" value={dinero(cartera.saldo)} color={uiTokens.colores.peligro} fondo="rgba(180,35,24,0.06)" />
      </Box>

      <Typography sx={{ fontSize: 11, color: uiTokens.colores.textoMedio }}>
        Comparativo: {actual.desde || '—'} a {actual.hasta || '—'} vs. {anterior.desde || '—'} a {anterior.hasta || '—'}.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.2 }}>
        <BloqueTabla
          titulo="Cobros por método de pago"
          columnas={['Método', 'Operaciones', 'Total']}
          filas={metodos}
          renderFila={(fila) => (
            <TableRow key={fila.metodo}>
              <TableCell sx={{ fontSize: 11.5 }}>{fila.metodo}</TableCell>
              <TableCell sx={{ fontSize: 11.5 }}>{numero(fila.operaciones)}</TableCell>
              <TableCell sx={{ fontSize: 11.5, fontWeight: 900 }}>{dinero(fila.total)}</TableCell>
            </TableRow>
          )}
        />

        <BloqueTabla
          titulo="Desempeño por responsable comercial"
          columnas={['Responsable', 'Ventas', 'Total', 'Cobrado']}
          filas={responsables}
          renderFila={(fila) => (
            <TableRow key={fila.responsable}>
              <TableCell sx={{ fontSize: 11.5 }}>{fila.responsable}</TableCell>
              <TableCell sx={{ fontSize: 11.5 }}>{numero(fila.transacciones)}</TableCell>
              <TableCell sx={{ fontSize: 11.5 }}>{dinero(fila.total_ventas)}</TableCell>
              <TableCell sx={{ fontSize: 11.5, fontWeight: 900 }}>{dinero(fila.total_cobrado)}</TableCell>
            </TableRow>
          )}
        />
      </Box>
    </Stack>
  );
}
