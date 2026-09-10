import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import { Box, Paper, Typography } from '@mui/material'

export function PageHeader({ titulo, descripcion, acciones, icono }) {
  return (
    <Paper
      className="page-header-container"
      elevation={0}
      sx={(theme) => ({
        position: 'sticky',
        top: { xs: 72, sm: 80 },
        zIndex: theme.zIndex.appBar - 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,.97)' : 'rgba(255,255,255,.97)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Box className="page-header-icon-box">
          {icono || <AssignmentTurnedInOutlinedIcon />}
        </Box>
        <Box sx={{ ml: 2, minWidth: 0 }}>
          <Typography className="page-header-title">{titulo}</Typography>
          {descripcion ? <Typography className="page-header-subtitle">{descripcion}</Typography> : null}
        </Box>
      </Box>
      {acciones}
    </Paper>
  )
}
