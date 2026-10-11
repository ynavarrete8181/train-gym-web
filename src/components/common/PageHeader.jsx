import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import { Box, Paper, Typography } from '@mui/material'

export function PageHeader({ titulo, descripcion, acciones, icono, compact = false }) {
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
        gap: compact ? 1.25 : 2,
        flexWrap: 'wrap',
        borderRadius: 2,
        py: compact ? 1.25 : undefined,
        px: compact ? 1.5 : undefined,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,.97)' : 'rgba(255,255,255,.97)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Box
          className="page-header-icon-box"
          sx={compact ? { width: 34, height: 34, minWidth: 34, '& svg': { fontSize: 19 } } : undefined}
        >
          {icono || <AssignmentTurnedInOutlinedIcon />}
        </Box>
        <Box sx={{ ml: compact ? 1.25 : 2, minWidth: 0 }}>
          <Typography
            className="page-header-title"
            sx={compact ? { fontSize: '1rem', lineHeight: 1.2 } : undefined}
          >
            {titulo}
          </Typography>
          {descripcion ? (
            <Typography
              className="page-header-subtitle"
              sx={compact ? { fontSize: '.78rem', lineHeight: 1.25, mt: .15 } : undefined}
            >
              {descripcion}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {acciones}
    </Paper>
  )
}
