import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { useState } from 'react'

const amarilloRevive = '#f5c400'
const amarilloReviveHover = '#ddb100'

const estilosEtiqueta = {
  bgcolor: '#fff',
  px: 0.65,
  borderRadius: 0.75,
  color: '#5f6368',
  fontWeight: 700,
  '&.Mui-focused': {
    color: '#171717',
  },
}

const estilosCampo = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: 2,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(23,23,23,0.45)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: amarilloRevive,
      borderWidth: 2,
    },
  },
}

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
          sx={estilosCampo}
          slotProps={{
            htmlInput: { 'aria-label': 'Correo de acceso' },
            inputLabel: { sx: estilosEtiqueta },
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
          sx={estilosCampo}
          slotProps={{
            htmlInput: { 'aria-label': 'Contraseña' },
            inputLabel: { sx: estilosEtiqueta },
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
          sx={{
            mt: 0.5,
            minHeight: 48,
            bgcolor: amarilloRevive,
            color: '#111',
            fontWeight: 900,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: amarilloReviveHover,
              boxShadow: '0 8px 22px rgba(245,196,0,0.24)',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(245,196,0,0.45)',
              color: 'rgba(17,17,17,0.58)',
            },
          }}
        >
          {cargando ? 'Validando acceso...' : 'Iniciar sesión'}
        </Button>
      </Stack>
    </Box>
  )
}
