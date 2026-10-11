import { Paper, Typography } from '@mui/material'

export function DashboardCard({ titulo, valor, detalle }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 1, height: '100%' }}>
      <Typography variant="body2" color="text.secondary">
        {titulo}
      </Typography>
      <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>
        {valor}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {detalle}
      </Typography>
    </Paper>
  )
}
