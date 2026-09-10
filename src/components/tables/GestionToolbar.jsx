import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Box, Chip, InputAdornment, Stack, TextField } from '@mui/material'
import { Children, cloneElement, isValidElement } from 'react'
import { dbanuStyles } from '../../styles/dbanuStyles.js'
import { uiTokens } from '../../styles/uiTokens.js'

function normalizarAccion(elemento) {
  if (!isValidElement(elemento)) return elemento

  const hijos = elemento.props.children
  const texto = typeof hijos === 'string' ? hijos.trim() : ''
  const esAccionAgregar = Boolean(elemento.props.startIcon) && /^(añadir|agregar|crear|nuev[oa])/i.test(texto)

  if (esAccionAgregar) {
    return cloneElement(elemento, {
      variant: 'outlined',
      sx: { ...dbanuStyles.addButtonRevive, ...(elemento.props.sx || {}) },
    }, 'Añadir')
  }

  if (hijos) {
    const hijosNormalizados = Children.map(hijos, normalizarAccion)
    return cloneElement(elemento, {}, hijosNormalizados)
  }

  return elemento
}

export function GestionToolbar({ total, busqueda, onBusqueda, acciones = null, etiqueta = 'RESULTADOS' }) {
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ flex: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
        <TextField
          size="small"
          label="Buscar"
          value={busqueda}
          onChange={(evento) => onBusqueda(evento.target.value)}
          sx={{ ...dbanuStyles.field, width: { xs: '100%', sm: 260, md: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Chip
          variant="outlined"
          label={`${Number(total || 0).toLocaleString('es-EC')} ${etiqueta}`}
          sx={{
            height: 38,
            borderRadius: 0.5,
            fontWeight: 900,
            color: uiTokens.colores.textoFuerte,
            bgcolor: 'transparent',
            borderColor: uiTokens.colores.borde,
            '& .MuiChip-label': { px: 1.4, fontSize: 11.5 },
          }}
        />
      </Stack>
      {acciones ? <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>{normalizarAccion(acciones)}</Box> : null}
    </Stack>
  )
}
