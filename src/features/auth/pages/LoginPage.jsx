import { Box, Paper, Stack, Typography } from '@mui/material'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
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
          minHeight: { xs: 320, sm: 420, md: '100vh' },
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(180deg, rgba(5,5,5,0.20) 0%, rgba(5,5,5,0.12) 34%, rgba(5,5,5,0.78) 74%, rgba(5,5,5,0.96) 100%), linear-gradient(90deg, rgba(5,5,5,0.45) 0%, rgba(5,5,5,0.10) 52%, rgba(5,5,5,0.18) 100%), url(${imagenFondo})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: { xs: 3, sm: 4.5, md: 5 },
            py: { xs: 3, sm: 4, md: 4.5 },
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: { xs: 42, sm: 46, md: 50 },
              height: { xs: 42, sm: 46, md: 50 },
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              borderRadius: 1,
              boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
            }}
          >
            <Box
              component="img"
              src={reviveLogo}
              alt="Revive"
              sx={{
                width: { xs: 118, sm: 136, md: 150 },
                height: 'auto',
                display: 'block',
                flexShrink: 0,
              }}
            />
          </Box>

          <Box sx={{ maxWidth: 560, color: '#fff' }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 36, sm: 48, md: 56 },
                lineHeight: 0.98,
                fontWeight: 950,
                letterSpacing: -1.4,
                textShadow: '0 4px 20px rgba(0,0,0,0.45)',
              }}
            >
              ENTRENA.
              <br />
              PROGRESA.
              <br />
              <Box component="span" sx={{ color: amarilloRevive }}>
                REVIVE.
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 2,
                maxWidth: 420,
                fontSize: { xs: 13, sm: 15, md: 16 },
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.86)',
                textShadow: '0 2px 10px rgba(0,0,0,0.45)',
              }}
            >
              Todo lo que necesitas para impulsar tu entrenamiento y gestionar tu experiencia deportiva desde un solo lugar.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 3 }}
              sx={{
                mt: 3,
                pt: 2.2,
                borderTop: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {[
                { icono: FitnessCenterOutlinedIcon, titulo: 'Entrenamiento', texto: 'seguimiento deportivo' },
                { icono: BadgeOutlinedIcon, titulo: 'Membresías', texto: 'control y acceso' },
                { icono: DescriptionOutlinedIcon, titulo: 'Gestión', texto: 'servicios integrados' },
              ].map(({ icono: Icono, titulo, texto }) => (
                <Stack key={titulo} direction="row" spacing={1.1} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      border: `1px solid rgba(245,196,0,0.42)`,
                      display: 'grid',
                      placeItems: 'center',
                      color: amarilloRevive,
                      borderRadius: 1,
                      bgcolor: 'rgba(0,0,0,0.16)',
                      flexShrink: 0,
                    }}
                  >
                    <Icono sx={{ fontSize: 17 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                      {titulo}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: 'rgba(255,255,255,0.58)', lineHeight: 1.25 }}>
                      {texto}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>

            <Typography sx={{ mt: 2.2, fontSize: 10.5, color: 'rgba(255,255,255,0.46)' }}>
              © 2026 Revive Sports. Todos los derechos reservados.
            </Typography>
          </Box>
        </Box>
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
