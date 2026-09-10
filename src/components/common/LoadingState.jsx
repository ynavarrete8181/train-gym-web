import { CircularProgress, Stack, Typography } from '@mui/material'
import { uiTokens } from '../../styles/uiTokens.js'

export function LoadingState({ texto = 'Cargando información...' }) {
  return (
    <Stack spacing={1.2} sx={{ minHeight: 180, color: uiTokens.colores.primario, alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={28} thickness={4} />
      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: uiTokens.colores.textoMedio }}>
        {texto}
      </Typography>
    </Stack>
  )
}
