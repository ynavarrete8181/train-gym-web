import { Box } from '@mui/material'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { DashboardCard } from '../components/DashboardCard.jsx'

const metricas = [
  { titulo: 'Usuarios', valor: '0', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Roles', valor: '0', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Menús', valor: '0', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Funciones', valor: '0', detalle: 'Indicador pendiente de integración' },
]

export function DashboardPage() {
  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descripcion="Vista inicial del Revive."
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {metricas.map((metrica) => (
          <Box key={metrica.titulo}>
            <DashboardCard {...metrica} />
          </Box>
        ))}
      </Box>
    </>
  )
}
