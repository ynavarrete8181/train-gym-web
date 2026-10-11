import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import { Alert, Box, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx'
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx'
import { TooltipRequisitosClave } from '../../../components/common/RequisitosClave.jsx'
import { claveEsSegura } from '../../../utils/claveSegura.js'
import { cambiarClavePropia } from '../services/authService.js'
import { CampoClave } from '../../../components/common/CampoClave.jsx'

export function CambiarClavePropiaDialog({ open, onClose, onSuccess }) {
  const [formulario, setFormulario] = useState({ password_actual: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open) {
      setFormulario({ password_actual: '', password: '', password_confirmation: '' })
      setError('')
    }
  }, [open])

  const guardar = async () => {
    if (!claveEsSegura(formulario.password)) return setError('La nueva contraseña no cumple los requisitos de seguridad.')
    if (formulario.password !== formulario.password_confirmation) return setError('La confirmación no coincide con la nueva contraseña.')
    setGuardando(true)
    setError('')
    try {
      await cambiarClavePropia(formulario)
      onSuccess()
    } catch (e) {
      const datos = e.response?.data
      setError(Object.values(datos?.errores || {}).flat()[0] || datos?.mensaje || 'No se pudo cambiar la contraseña.')
    } finally {
      setGuardando(false)
    }
  }

  return <Dialog
    open={open}
    onClose={guardando ? undefined : onClose}
    fullWidth
    maxWidth="sm"
    slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: 'hidden' } } }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 3, py: 2.25 }}>
      <Box sx={{ display: 'grid', placeItems: 'center', width: 46, height: 46, flexShrink: 0, borderRadius: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <LockResetOutlinedIcon />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Cambiar mi contraseña</Typography>
        <Typography variant="body2" color="text.secondary">Confirma tu contraseña actual y define una nueva.</Typography>
      </Box>
    </Box>
    <DialogContent dividers sx={{ bgcolor: '#f6f8fc', px: 3, py: 2.5 }}>
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <CampoClave label="Contraseña actual" autoComplete="current-password" value={formulario.password_actual} onChange={(e) => setFormulario({ ...formulario, password_actual: e.target.value })} required />
        <TooltipRequisitosClave valor={formulario.password}>
          <CampoClave fullWidth label="Nueva contraseña" autoComplete="new-password" value={formulario.password} onChange={(e) => setFormulario({ ...formulario, password: e.target.value })} required />
        </TooltipRequisitosClave>
        <CampoClave label="Confirmar nueva contraseña" autoComplete="new-password" value={formulario.password_confirmation} onChange={(e) => setFormulario({ ...formulario, password_confirmation: e.target.value })} required />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><BotonCancelar onClick={onClose} disabled={guardando} /><BotonGuardar texto="Cambiar contraseña" onClick={guardar} guardando={guardando} /></DialogActions>
  </Dialog>
}
