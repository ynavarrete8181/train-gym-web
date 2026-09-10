import FirstPageOutlinedIcon from '@mui/icons-material/FirstPageOutlined'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined'
import LastPageOutlinedIcon from '@mui/icons-material/LastPageOutlined'
import { Box, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material'
import { uiTokens } from '../../styles/uiTokens.js'

const formatoNumero = (valor) => Number(valor || 0).toLocaleString('es-EC')

export function PaginacionTabla({ total, page, rowsPerPage, onPageChange, onRowsPerPageChange, rowsPerPageOptions = [5, 10, 25, 50], integrada = false }) {
  const totalRegistros = Math.max(Number(total || 0), 0)
  const porPagina = Math.max(Number(rowsPerPage || rowsPerPageOptions[0]), 1)
  const totalPaginas = Math.max(Math.ceil(totalRegistros / porPagina), 1)
  const paginaActual = Math.min(Math.max(Number(page || 1), 1), totalPaginas)
  const desde = totalRegistros ? ((paginaActual - 1) * porPagina) + 1 : 0
  const hasta = Math.min(paginaActual * porPagina, totalRegistros)
  const esPrimera = paginaActual <= 1
  const esUltima = paginaActual >= totalPaginas || totalRegistros === 0

  const irA = (pagina) => {
    const destino = Math.min(Math.max(pagina, 1), totalPaginas)
    if (destino !== paginaActual) onPageChange(destino)
  }

  const estiloBoton = {
    width: 32,
    height: 32,
    borderRadius: 1,
    border: 1,
    borderColor: 'divider',
    color: uiTokens.colores.primario,
    bgcolor: 'background.paper',
    '&:hover': { bgcolor: uiTokens.colores.primarioSuave },
    '&.Mui-disabled': { borderColor: uiTokens.colores.bordeSuave, color: '#a8b3c2' },
  }

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 1.2, md: 2 }}
      sx={{
        px: 1.5,
        py: 1.2,
        borderTop: 1,
        borderLeft: integrada ? 0 : 1,
        borderRight: integrada ? 0 : 1,
        borderBottom: integrada ? 0 : 1,
        borderColor: 'divider',
        borderRadius: integrada ? 0 : '0 0 4px 4px',
        mt: integrada ? 0 : '-1px',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Mostrando <strong>{formatoNumero(desde)}–{formatoNumero(hasta)}</strong> de <strong>{formatoNumero(totalRegistros)}</strong> registros
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' }, flexWrap: 'wrap', rowGap: 1 }}>
        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 12, color: 'text.secondary' }}>
            Registros por página
          </Typography>
          <Select
            size="small"
            value={porPagina}
            onChange={(evento) => onRowsPerPageChange(Number(evento.target.value))}
            inputProps={{ 'aria-label': 'Registros por página' }}
            sx={{ height: 32, minWidth: 66, fontSize: 12, borderRadius: 1, bgcolor: 'background.paper' }}
          >
            {rowsPerPageOptions.map((opcion) => <MenuItem key={opcion} value={opcion}>{opcion}</MenuItem>)}
          </Select>
        </Stack>

        <Typography sx={{ minWidth: 82, textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'text.primary' }}>
          Página {paginaActual} de {totalPaginas}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.6 }}>
          <Tooltip title="Primera página"><span><IconButton aria-label="Primera página" disabled={esPrimera} onClick={() => irA(1)} sx={estiloBoton}><FirstPageOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Página anterior"><span><IconButton aria-label="Página anterior" disabled={esPrimera} onClick={() => irA(paginaActual - 1)} sx={estiloBoton}><KeyboardArrowLeftOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Página siguiente"><span><IconButton aria-label="Página siguiente" disabled={esUltima} onClick={() => irA(paginaActual + 1)} sx={estiloBoton}><KeyboardArrowRightOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Última página"><span><IconButton aria-label="Última página" disabled={esUltima} onClick={() => irA(totalPaginas)} sx={estiloBoton}><LastPageOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
        </Box>
      </Stack>
    </Stack>
  )
}
