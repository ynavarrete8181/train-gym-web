import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { uiTokens } from '../../styles/uiTokens.js'

export function OrdenCell({ orden, onSubir, onBajar, puedeSubir = true, puedeBajar = true }) {
  const estiloBoton = {
    width: 26,
    height: 26,
    border: `1px solid ${uiTokens.colores.primario}`,
    color: uiTokens.colores.primario,
    bgcolor: '#fff',
    '&:hover': {
      bgcolor: 'rgba(0,73,135,0.08)',
      borderColor: uiTokens.colores.primario,
    },
    '&.Mui-disabled': {
      color: uiTokens.colores.textoMedio,
      borderColor: uiTokens.colores.bordeSuave,
      bgcolor: 'rgba(148, 163, 184, 0.08)',
    },
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ minWidth: 24, textAlign: 'center', fontSize: 12, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>
        {orden}
      </Typography>
      <Stack direction="row" spacing={0.4}>
        <Tooltip title="Subir">
          <span>
            <IconButton size="small" sx={estiloBoton} disabled={!puedeSubir} onClick={onSubir}>
              <KeyboardArrowUpOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bajar">
          <span>
            <IconButton size="small" sx={estiloBoton} disabled={!puedeBajar} onClick={onBajar}>
              <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
