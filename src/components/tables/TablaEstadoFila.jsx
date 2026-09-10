import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { CircularProgress, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { uiTokens } from '../../styles/uiTokens.js'

export function TablaEstadoFila({ colSpan, cargando = false, texto = 'No existen registros por ahora.' }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 7 }}>
        <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          {cargando ? (
            <CircularProgress size={26} thickness={4} />
          ) : (
            <InboxOutlinedIcon sx={{ fontSize: 30, color: uiTokens.colores.textoMedio }} />
          )}
          <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: uiTokens.colores.textoMedio }}>
            {cargando ? 'Cargando información...' : texto}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
