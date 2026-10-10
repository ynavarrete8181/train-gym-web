import { Chip } from '@mui/material';
import { uiTokens } from '../../../../styles/uiTokens.js';
import { dinero } from '../../config/carteraConfig.js';

function ResumenChip({ label, value, color, fondo }) {
  return (
    <Chip
      variant="outlined"
      label={`${label}: ${value}`}
      sx={{
        height: 38,
        borderRadius: 0.5,
        fontWeight: 900,
        color,
        bgcolor: fondo,
        borderColor: color,
        '& .MuiChip-label': {
          px: 1.35,
          fontSize: 11.5,
          whiteSpace: 'nowrap',
        },
      }}
    />
  );
}

export function CarteraResumen({ resumen = {} }) {
  return (
    <>
      <ResumenChip
        label="Cuentas abiertas"
        value={Number(resumen.cuentas_abiertas || 0).toLocaleString('es-EC')}
        color={uiTokens.colores.primario}
        fondo={uiTokens.colores.primarioSuave}
      />
      <ResumenChip
        label="Saldo por cobrar"
        value={dinero(resumen.saldo_total)}
        color={uiTokens.colores.info}
        fondo="rgba(29, 78, 216, 0.06)"
      />
      <ResumenChip
        label="Cuentas vencidas"
        value={Number(resumen.vencidas || 0).toLocaleString('es-EC')}
        color={uiTokens.colores.peligro}
        fondo="rgba(180, 35, 24, 0.06)"
      />
      <ResumenChip
        label="Saldo vencido"
        value={dinero(resumen.saldo_vencido)}
        color={uiTokens.colores.advertencia}
        fondo="rgba(183, 121, 31, 0.07)"
      />
      <ResumenChip
        label="Compromisos pendientes"
        value={Number(resumen.compromisos_pendientes || 0).toLocaleString('es-EC')}
        color={uiTokens.colores.exito}
        fondo="rgba(8, 127, 91, 0.06)"
      />
    </>
  );
}
