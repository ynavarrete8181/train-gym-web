import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Box, Button, MenuItem, Paper, TextField } from '@mui/material'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { formStyles } from '../../../styles/formStyles.js'

export function UsuarioFiltros({ filtros, roles, onChange, onBuscar, onLimpiar }) {
  return (
    <Paper elevation={0} sx={formStyles.filtros}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr auto auto' }, gap: 1.5, alignItems: 'center' }}>
        <TextField
          label="Buscar"
          placeholder="Nombre, correo o cédula"
          value={filtros.busqueda}
          onChange={(evento) => onChange({ ...filtros, busqueda: evento.target.value })}
          sx={dbanuStyles.field}
        />
        <TextField select label="Rol" value={filtros.rol} onChange={(evento) => onChange({ ...filtros, rol: evento.target.value })} sx={dbanuStyles.field}>
          <MenuItem value="">Todos</MenuItem>
          {roles.map((rol) => (
            <MenuItem key={rol.id_userrole} value={rol.id_userrole}>
              {rol.role}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Estado" value={filtros.estado} onChange={(evento) => onChange({ ...filtros, estado: evento.target.value })} sx={dbanuStyles.field}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="1">Activos</MenuItem>
          <MenuItem value="0">Inactivos</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<SearchOutlinedIcon />} onClick={onBuscar} sx={{ ...formStyles.botonAccion, ...dbanuStyles.addButton }}>
          Consultar
        </Button>
        <Button variant="outlined" onClick={onLimpiar} sx={{ ...formStyles.botonAccion, ...dbanuStyles.backButton }}>
          Limpiar
        </Button>
      </Box>
    </Paper>
  )
}
