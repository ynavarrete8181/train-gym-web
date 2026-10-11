import { Alert, Box, IconButton, Stack, Tooltip } from '@mui/material'
import { IconoArchivo } from '../../../../components/common/IconoArchivo.jsx'
import { dbanuStyles } from '../../../../styles/dbanuStyles.js'

export function CargaUsuariosResultado({ resultado, onDescargar }) {
  if (!resultado) return null

  return (
    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #dbe5f0' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Alert severity="success" sx={{ flex: 1, py: .25 }}>
          Carga finalizada: {resultado.resumen.creados} usuario(s) creado(s) y {resultado.resumen.errores} fila(s) omitida(s).
        </Alert>
        <Tooltip title="Descargar resultado CSV">
          <IconButton onClick={onDescargar} sx={{ ...dbanuStyles.actionView, width: 40, height: 40, flex: '0 0 auto' }} aria-label="Descargar resultado CSV">
            <IconoArchivo tipo="csv" size={20} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  )
}
