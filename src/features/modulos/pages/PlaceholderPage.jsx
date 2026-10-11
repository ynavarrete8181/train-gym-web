import { Paper, Typography } from '@mui/material'
import { PageHeader } from '../../../components/common/PageHeader.jsx'

export function PlaceholderPage({ funcion }) {
  return (
    <>
      <PageHeader
        titulo={funcion?.nombre || 'Módulo'}
        descripcion="Este módulo ya está habilitado en el menú. La funcionalidad específica se construirá en la siguiente etapa."
      />
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Código de permiso
        </Typography>
        <Typography variant="h6" fontWeight={800}>
          {funcion?.id_menu || 'SIN-CODIGO'}
        </Typography>
      </Paper>
    </>
  )
}
