import { Box, Paper, Stack, Typography } from '@mui/material'
import { LoginForm } from '../components/LoginForm.jsx'
import reviveLogo from '../../../assets/brand/revive-logo.jpeg'

const imagenFondo = 'https://revivesport.up.railway.app/assets/gym-bg-B6Up4T8B.jpg'
const amarilloRevive = '#f5c400'

export function LoginPage({ cargando, error, onLogin }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 58%) minmax(420px, 42%)' },
        gridTemplateRows: { xs: 'auto minmax(0, 1fr)', md: '1fr' },
        bgcolor: '#f7f7f5',
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 220, sm: 280, md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `radial-gradient(circle at 18% 18%, rgba(245,196,0,0.18), transparent 28%), linear-gradient(90deg, rgba(8,8,8,0.94) 0%, rgba(8,8,8,0.84) 48%, rgba(8,8,8,0.62) 100%), url(${imagenFondo})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          px: { xs: 3, sm: 5, md: 'clamp(48px, 8vw, 150px)' },
          py: { xs: 4, md: 6 },
        }}
      >
        <Stack spacing={{ xs: 2, md: 3 }} sx={{ color: '#fff', maxWidth: 680, position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src={reviveLogo}
            alt="Revive Sports"
            sx={{
              width: { xs: 170, sm: 220, md: 276 },
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 1.5,
              boxShadow: '0 22px 60px rgba(0,0,0,0.5)',
            }}
          />

          <Box>
            <Typography
              variant="overline"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 900,
                color: amarilloRevive,
                letterSpacing: 0.5,
              }}
            >
              Plataforma de gestión deportiva
            </Typography>

            <Typography
              component="h1"
              sx={{
                mt: { xs: 0.5, md: 1 },
                fontSize: { xs: 32, sm: 42, md: 64 },
                lineHeight: 1.02,
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 3px 18px rgba(0,0,0,0.4)',
              }}
            >
              Revive{' '}
              <Box component="span" sx={{ color: amarilloRevive }}>
                Sports
              </Box>
            </Typography>

            <Typography
              sx={{
                display: { xs: 'none', sm: 'block' },
                mt: 2,
                maxWidth: 620,
                fontSize: { sm: 17, md: 20 },
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.86)',
                textShadow: '0 2px 12px rgba(0,0,0,0.45)',
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
          bgcolor: '#f7f7f5',
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
            bgcolor: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderTop: `4px solid ${amarilloRevive}`,
            borderRadius: 3,
            boxShadow: '0 22px 60px rgba(12,12,12,0.10)',
          }}
        >
          <Stack spacing={1.2} sx={{ mb: 3 }}>
            <Typography component="h2" variant="h4" fontWeight={900} sx={{ color: '#151515' }}>
              Iniciar sesión
            </Typography>
            <Typography color="text.secondary">
              Ingresa con tu usuario asignado para acceder a Revive Sports.
            </Typography>
          </Stack>
          <LoginForm cargando={cargando} error={error} onSubmit={onLogin} />
        </Paper>
      </Box>
    </Box>
  )
}
