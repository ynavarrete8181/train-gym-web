import { LinearProgress, Paper, Stack, Table, TableContainer, Typography } from '@mui/material'
import { dbanuStyles } from '../../styles/dbanuStyles.js'
import { PaginacionTabla } from './PaginacionTabla.jsx'

export function TablaGestion({ children, total, filtrados, page, onPageChange, rowsPerPage, onRowsPerPageChange, textoResumen, cargando = false }) {
  return (
    <Paper elevation={0} sx={dbanuStyles.tablePaper}>
      {cargando ? <LinearProgress sx={{ height: 3 }} /> : null}
      <TableContainer>
        <Table stickyHeader size="small" sx={dbanuStyles.table}>
          {children}
        </Table>
      </TableContainer>
      {rowsPerPage && onRowsPerPageChange ? (
        <PaginacionTabla
          total={filtrados}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          integrada
        />
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {textoResumen || `${Number(filtrados || 0).toLocaleString('es-EC')} de ${Number(total || 0).toLocaleString('es-EC')} registros consultados`}
          </Typography>
        </Stack>
      )}
    </Paper>
  )
}
