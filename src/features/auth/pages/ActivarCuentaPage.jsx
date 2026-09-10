import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { TooltipRequisitosClave } from '../../../components/common/RequisitosClave.jsx'
import { CampoClave } from '../../../components/common/CampoClave.jsx'
import { apiClient } from '../../../services/apiClient.js'
import { claveEsSegura } from '../../../utils/claveSegura.js'

const limpiarSesionLocal = () => {
  ['base_token', 'base_usuario', 'base_menu', 'base_vista_actual'].forEach((clave) => localStorage.removeItem(clave))
}

export function ActivarCuentaPage() {
  const referencia = window.location.pathname.split('/').filter(Boolean)[1] || ''
  const [token] = useState(() => {
    const tokenFragmento = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token')
    const tokenLegado = new URLSearchParams(window.location.search).get('token')
    return tokenFragmento || tokenLegado || ''
  })
  const [form, setForm] = useState({ codigo: '', password: '', password_confirmation: '' })
  const [estado, setEstado] = useState({ verificando: true, valido: false, cargando: false, error: '', listo: false })

  useEffect(() => {
    limpiarSesionLocal()
    if (token) {
      window.history.replaceState({}, document.title, '/activar-cuenta')
      setEstado({ verificando: false, valido: true, cargando: false, error: '', listo: false })
      return
    }

    if (!referencia) {
      setEstado({ verificando: false, valido: false, cargando: false, error: 'El enlace no corresponde a una solicitud activa.', listo: false })
      return
    }

    apiClient.post('/base/notificaciones/activar-cuenta/validar', { referencia })
      .then(() => setEstado({ verificando: false, valido: true, cargando: false, error: '', listo: false }))
      .catch((error) => setEstado({ verificando: false, valido: false, cargando: false, error: error.response?.data?.mensaje || 'El enlace no es válido, ya fue utilizado o ha expirado.', listo: false }))
  }, [referencia, token])

  const enviar = async (evento) => {
    evento.preventDefault()
    setEstado((actual) => ({ ...actual, cargando: true, error: '', listo: false }))

    try {
      await apiClient.post('/base/notificaciones/activar-cuenta', { token: token || form.codigo.trim().toUpperCase(), referencia: referencia || null, password: form.password, password_confirmation: form.password_confirmation })
      limpiarSesionLocal()
      setEstado({ verificando: false, valido: false, cargando: false, error: '', listo: true })
      window.setTimeout(() => window.location.replace('/'), 1400)
    } catch (error) {
      const puedeReintentar = error.response?.status === 422
      setEstado({
        verificando: false,
        valido: puedeReintentar,
        cargando: false,
        error: error.response?.data?.message || error.response?.data?.mensaje || 'El enlace no es válido, ya fue utilizado o ha expirado.',
        listo: false,
      })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f7fb', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper component="form" onSubmit={enviar} elevation={0} sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4 }, border: '1px solid #d7e2f0', borderRadius: 3, boxShadow: '0 20px 60px rgba(15,45,75,.10)' }}>
        <Stack spacing={2}>
          <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: '#005b9f', color: '#fff', display: 'grid', placeItems: 'center' }}><LockResetOutlinedIcon /></Box>
          <Box>
            <Typography variant="h5" fontWeight={900}>Establecer contraseña</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Define una nueva contraseña para tu cuenta.</Typography>
          </Box>
          {estado.verificando ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={20} /><Typography color="text.secondary">Comprobando enlace...</Typography></Stack> : null}
          {estado.error ? <Alert severity="error">{estado.error}</Alert> : null}
          {estado.listo ? (
            <Alert severity="success">Contraseña guardada. Te llevaremos al inicio de sesión.</Alert>
          ) : estado.valido ? (
            <>
              {!token ? <TextField label="Código de verificación" value={form.codigo} onChange={(e) => { setForm((actual) => ({ ...actual, codigo: e.target.value.toUpperCase() })); setEstado((actual) => ({ ...actual, error: '' })) }} inputProps={{ maxLength: 10 }} required autoFocus /> : null}
              <TooltipRequisitosClave valor={form.password}>
                <CampoClave fullWidth label="Nueva contraseña" required value={form.password} onChange={(e) => setForm((actual) => ({ ...actual, password: e.target.value }))} />
              </TooltipRequisitosClave>
              <CampoClave label="Confirmar contraseña" required value={form.password_confirmation} onChange={(e) => setForm((actual) => ({ ...actual, password_confirmation: e.target.value }))} />
              <Button type="submit" variant="contained" disabled={estado.cargando || (!token && form.codigo.trim().length !== 10) || !claveEsSegura(form.password) || form.password !== form.password_confirmation}>
                {estado.cargando ? 'Comprobando...' : estado.error ? 'Volver a intentar' : 'Establecer contraseña'}
              </Button>
            </>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  )
}
