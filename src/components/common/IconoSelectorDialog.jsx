import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { uiTokens } from '../../styles/uiTokens.js'
import { IconoMaterial } from './IconoMaterial.jsx'

const iconos = [
  'dashboard',
  'home',
  'school',
  'menu_book',
  'groups',
  'person',
  'manage_accounts',
  'admin_panel_settings',
  'shield',
  'account_tree',
  'view_sidebar',
  'widgets',
  'settings',
  'event',
  'event_note',
  'fact_check',
  'assignment',
  'assignment_turned_in',
  'checklist',
  'edit_note',
  'article',
  'description',
  'analytics',
  'bar_chart',
  'monitoring',
  'notifications',
  'mail',
  'database',
  'cloud_sync',
  'sync',
  'calendar_month',
  'schedule',
  'badge',
  'workspace_premium',
  'verified_user',
  'lock',
  'key',
  'folder',
  'inventory_2',
  'download',
  'upload',
  'print',
  'delete',
]

export function IconoSelectorDialog({ open, valor, onClose, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('')
  const iconosFiltrados = useMemo(
    () => iconos.filter((icono) => icono.includes(busqueda.trim().toLowerCase())),
    [busqueda],
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Typography sx={{ fontSize: 18, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>Seleccionar ícono</Typography>
        <Typography sx={{ fontSize: 12.5, color: uiTokens.colores.textoMedio }}>
          Íconos cargados desde Material Symbols. Se guarda el nombre técnico en base de datos.
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f6f8fc' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar ícono"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1.5 }}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 1 }}>
          {iconosFiltrados.map((icono) => {
            const activo = icono === valor

            return (
              <Button
                key={icono}
                variant={activo ? 'contained' : 'outlined'}
                onClick={() => onSeleccionar(icono)}
                sx={{
                  height: 78,
                  flexDirection: 'column',
                  gap: 0.5,
                  borderColor: activo ? uiTokens.colores.primario : uiTokens.colores.borde,
                  bgcolor: activo ? uiTokens.colores.primario : '#fff',
                }}
              >
                <IconoMaterial nombre={icono} />
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {icono}
                </Typography>
              </Button>
            )
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" startIcon={<CloseOutlinedIcon />} onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
