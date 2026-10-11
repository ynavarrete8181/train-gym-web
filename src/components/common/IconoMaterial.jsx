import { Box } from '@mui/material'

export function IconoMaterial({ nombre, size = 22, sx = {} }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24',
        ...sx,
      }}
    >
      {nombre || 'widgets'}
    </Box>
  )
}
