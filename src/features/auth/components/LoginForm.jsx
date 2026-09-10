import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { useState } from 'react'

export function LoginForm({ cargando, error, onSubmit }) {
  const [formulario, setFormulario] = useState({ email: '', password: '' })
  const [mostrarClave, setMostrarClave] = useState(false)

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  const enviar = (evento) => {
    evento.preventDefault()
    onSubmit(formulario)
  }

  return (
    <Box component="form" onSubmit={enviar}>
      <Stack spacing={2.2}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          autoFocus
          fullWidth
          label="Correo de acceso"
          name="email"
          type="email"
          value={formulario.email}
          onChange={(evento) => cambiarCampo('email', evento.target.value)}
          required
          slotProps={{
            htmlInput: { 'aria-label': 'Correo de acceso' },
          }}
        />

        <TextField
          fullWidth
          label="Contraseña"
          name="password"
          type={mostrarClave ? 'text' : 'password'}
          value={formulario.password}
          onChange={(evento) => cambiarCampo('password', evento.target.value)}
          required
          slotProps={{
            htmlInput: { 'aria-label': 'Contraseña' },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    edge="end"
                    onClick={() => setMostrarClave((actual) => !actual)}
                  >
                    {mostrarClave ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={cargando}
          startIcon={<LoginOutlinedIcon />}
          sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: '#d60000' } }}
        >
          {cargando ? 'Validando acceso...' : 'Iniciar sesión'}
        </Button>
      </Stack>
    </Box>
  )
}
