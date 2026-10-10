import { Box, Paper, Typography } from '@mui/material';
import { dinero } from '../../config/carteraConfig.js';

function ResumenItem({ label, value, secondary }) {
  return (
    <Paper elevation={0} sx={{ p: 1.35, border: 1, borderColor: 'divider', borderRadius: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.2, mt: 0.25 }}>
        {value}
      </Typography>
      {secondary ? (
        <Typography variant="caption" color="text.secondary">{secondary}</Typography>
      ) : null}
    </Paper>
  );
}

export function CarteraResumen({ resumen = {} }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 1.25,
        mt: 2,
        mb: 1.5,
      }}
    >
      <ResumenItem label="Cuentas abiertas" value={resumen.cuentas_abiertas || 0} />
      <ResumenItem label="Saldo por cobrar" value={dinero(resumen.saldo_total)} />
      <ResumenItem label="Cuentas vencidas" value={resumen.vencidas || 0} />
      <ResumenItem
        label="Saldo vencido"
        value={dinero(resumen.saldo_vencido)}
        secondary={`${resumen.compromisos_pendientes || 0} compromisos pendientes`}
      />
    </Box>
  );
}
