import { Box, Paper, Stack, Typography } from '@mui/material'
import { LoginForm } from '../components/LoginForm.jsx'
import reviveLogo from '../../../assets/brand/revive-logo.jpeg'

export function LoginPage({ cargando, error, onLogin }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 58%) minmax(420px, 42%)' },
        gridTemplateRows: { xs: 'auto minmax(0, 1fr)', md: '1fr' },
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 190, sm: 240, md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.18), transparent 28%), linear-gradient(135deg, rgba(0, 73, 135, 0.98), rgba(10, 91, 144, 0.86) 48%, rgba(11, 31, 58, 0.96))',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          px: { xs: 3, sm: 5, md: 'clamp(48px, 8vw, 150px)' },
          py: { xs: 3, md: 6 },
        }}
      >
        <Stack spacing={{ xs: 1.5, md: 3 }} sx={{ color: '#fff', maxWidth: 650 }}>
          <Stack direction="row" spacing={1.8} sx={{ alignItems: 'center' }}>
            <Box
              component="img"
              src={reviveLogo}
              alt="Revive Sports"
              sx={{
                width: { xs: 168, sm: 220, md: 276 },
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 1.5,
                boxShadow: '0 18px 48px rgba(0,0,0,0.32)',
              }}
            />
            <Box sx={{ display: { xs: 'none', md: 'block' }, width: 3, height: 64, bgcolor: '#fff', borderRadius: 1, opacity: 0.78 }} />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1 }}>
                Train Gym
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: 0 }}>
                Gestión deportiva
              </Typography>
            </Box>
          </Stack>
          <Box>
            <Typography
              variant="overline"
              sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800, letterSpacing: 0 }}
            >
              Plataforma de gestión deportiva
            </Typography>
            <Typography
              component="h1"
              sx={{
                mt: { xs: 0.5, md: 1 },
                fontSize: { xs: 30, sm: 40, md: 64 },
                lineHeight: 1.02,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              Revive Sports
            </Typography>
            <Typography
              sx={{
                display: { xs: 'none', sm: 'block' },
                mt: 2,
                fontSize: { sm: 17, md: 21 },
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.84)',
              }}
            >
              Controla clientes, membresías, reservas, asistencia, ventas, inventario y entrenamiento desde una sola operación.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fff',
          px: { xs: 2.5, sm: 5, md: 6 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 430,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            boxShadow: '0 18px 50px rgba(15, 42, 70, 0.12)',
          }}
        >
          <Stack spacing={1.2} sx={{ mb: 3 }}>
            <Typography component="h2" variant="h4" fontWeight={900}>
              Iniciar sesión
            </Typography>
            <Typography color="text.secondary">
              Ingresa con tu usuario asignado para cargar el menú y los permisos disponibles.
            </Typography>
          </Stack>
          <LoginForm cargando={cargando} error={error} onSubmit={onLogin} />
        </Paper>
      </Box>
    </Box>
  )
}
