import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import { Autocomplete, Box, Button, Checkbox, Divider, FormControlLabel, IconButton, Popover, Stack, TableCell, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { dbanuStyles } from '../../styles/dbanuStyles.js'
import { uiTokens } from '../../styles/uiTokens.js'

const normalizarOpciones = (options = []) => (options || [])
  .filter((option) => option && option.value !== undefined && option.value !== null && option.value !== '')
  .map((option) => ({ value: String(option.value), label: String(option.label ?? option.value) }))

export function FilterHeaderCell({ children, value = '', onChange, options = [], align = 'left', sx = {}, multiple }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionTemporal, setSeleccionTemporal] = useState([])
  const abierto = Boolean(anchorEl)
  const opciones = useMemo(() => normalizarOpciones(options), [options])
  const modoExcel = multiple ?? Array.isArray(value)
  const modoOpciones = opciones.length > 0

  const seleccion = useMemo(() => {
    if (Array.isArray(value)) return value.map(String)
    if (value === '' || value === null || value === undefined) return []
    return [String(value)]
  }, [value])
  const activo = seleccion.length > 0

  useEffect(() => {
    if (abierto) setSeleccionTemporal(seleccion)
  }, [abierto, seleccion])

  const opcionesVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return opciones
    return opciones.filter((option) => option.label.toLowerCase().includes(texto))
  }, [opciones, busqueda])

  const visiblesSeleccionadas = opcionesVisibles.length > 0 && opcionesVisibles.every((option) => seleccionTemporal.includes(option.value))
  const visiblesParciales = opcionesVisibles.some((option) => seleccionTemporal.includes(option.value)) && !visiblesSeleccionadas
  const opcionSeleccionada = opciones.find((option) => option.value === seleccion[0]) || null

  const alternarValor = (valor) => setSeleccionTemporal((actual) => actual.includes(valor) ? actual.filter((item) => item !== valor) : [...actual, valor])
  const alternarTodosVisibles = () => setSeleccionTemporal((actual) => {
    const visibles = opcionesVisibles.map((option) => option.value)
    if (visibles.every((valor) => actual.includes(valor))) return actual.filter((valor) => !visibles.includes(valor))
    return Array.from(new Set([...actual, ...visibles]))
  })

  const limpiarFiltro = () => {
    setSeleccionTemporal([])
    setBusqueda('')
    onChange?.(modoExcel ? [] : '')
  }

  const aplicar = () => {
    if (modoExcel) onChange?.(seleccionTemporal)
    else if (modoOpciones) onChange?.(seleccionTemporal[0] || '')
    else onChange?.(busqueda)
    setAnchorEl(null)
  }

  return (
    <TableCell align={align} sx={sx}>
      <Stack direction="row" spacing={0.5} sx={{ minHeight: 28, alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <Typography noWrap sx={{ fontSize: 12, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.2 }}>{children}</Typography>
        {onChange ? (
          <Tooltip title={activo ? `Filtro aplicado${modoExcel ? ` (${seleccion.length})` : ''}` : 'Filtrar columna'}>
            <IconButton
              size="small"
              onClick={(evento) => { setBusqueda(modoOpciones ? '' : String(value || '')); setAnchorEl(evento.currentTarget) }}
              sx={{ width: '24px !important', height: '24px !important', minWidth: 24, p: 0.25, ml: 0.25, border: 'none !important', borderRadius: '4px !important', color: activo ? uiTokens.colores.primario : uiTokens.colores.textoMedio, bgcolor: activo ? 'rgba(0,73,135,0.09) !important' : 'transparent !important', '&:hover': { color: uiTokens.colores.primario, bgcolor: 'rgba(0,73,135,0.10) !important' }, '& .MuiSvgIcon-root': { fontSize: '16px !important' } }}
            ><FilterListRoundedIcon /></IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      <Popover open={abierto} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { p: 2, width: 340, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, border: `1px solid ${uiTokens.colores.borde}`, boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)', overflow: 'visible' } } }}>
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>Filtrar: {children}</Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)} sx={{ width: 28, height: 28, color: uiTokens.colores.textoMedio }}><CloseOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
          </Stack>

          {!modoOpciones ? (
            <TextField autoFocus fullWidth size="small" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder={`Buscar en ${String(children).toLowerCase()}`} sx={dbanuStyles.field} />
          ) : modoExcel ? (
            <>
              <TextField autoFocus fullWidth size="small" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar dentro de esta columna" sx={dbanuStyles.field} />
              <Box sx={{ border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5, overflow: 'hidden' }}>
                <FormControlLabel sx={{ m: 0, px: 1.2, py: 0.35, width: '100%', bgcolor: '#f8fafc' }} control={<Checkbox size="small" checked={visiblesSeleccionadas} indeterminate={visiblesParciales} onChange={alternarTodosVisibles} />} label={<Typography sx={{ fontSize: 12, fontWeight: 800 }}>Seleccionar todo lo visible</Typography>} />
                <Divider />
                <Box sx={{ maxHeight: 240, overflowY: 'auto', py: 0.5 }}>
                  {opcionesVisibles.length ? opcionesVisibles.map((option) => <FormControlLabel key={option.value} sx={{ m: 0, px: 1.2, py: 0.15, width: '100%', '&:hover': { bgcolor: '#f8fafc' } }} control={<Checkbox size="small" checked={seleccionTemporal.includes(option.value)} onChange={() => alternarValor(option.value)} />} label={<Typography sx={{ fontSize: 12 }}>{option.label}</Typography>} />) : <Typography sx={{ px: 1.5, py: 2, fontSize: 12, color: uiTokens.colores.textoMedio }}>No hay coincidencias.</Typography>}
                </Box>
              </Box>
            </>
          ) : (
            <Autocomplete
              fullWidth size="small" value={opcionSeleccionada} options={opciones}
              getOptionLabel={(option) => option?.label || ''}
              isOptionEqualToValue={(option, selected) => option.value === selected.value}
              onChange={(_, option) => setSeleccionTemporal(option ? [option.value] : [])}
              noOptionsText="No hay coincidencias" clearText="Limpiar" openText="Abrir" closeText="Cerrar"
              renderInput={(params) => <TextField {...params} autoFocus placeholder={`Escriba o seleccione ${String(children).toLowerCase()}`} sx={dbanuStyles.field} />}
            />
          )}

          <Stack direction="row" spacing={1} sx={{ pt: 0.5, justifyContent: 'space-between' }}>
            <Button size="small" startIcon={<FilterAltOffOutlinedIcon />} onClick={limpiarFiltro} sx={{ height: 32, px: 1.5, fontSize: 11, fontWeight: 800, color: uiTokens.colores.textoMedio }}>Limpiar</Button>
            <Button size="small" variant="contained" sx={{ ...dbanuStyles.addButton, fontSize: 11, height: 32, minWidth: 92 }} onClick={aplicar}>Aplicar</Button>
          </Stack>
        </Stack>
      </Popover>
    </TableCell>
  )
}
