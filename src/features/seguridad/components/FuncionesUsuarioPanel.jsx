import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import DeselectOutlinedIcon from '@mui/icons-material/DeselectOutlined'
import SelectAllOutlinedIcon from '@mui/icons-material/SelectAllOutlined'
import { Box, Checkbox, Chip, Divider, FormControlLabel, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { formStyles } from '../../../styles/formStyles.js'
import { uiTokens } from '../../../styles/uiTokens.js'

export function FuncionesUsuarioPanel({ grupos, funcionesRolBase = [], seleccionadas, disabled, onToggle, onSincronizar, controlRol = null }) {
  const todosCodigos = grupos.flatMap((grupo) => grupo.funciones.map((funcion) => funcion.id_menu))
  const todosSeleccionados = todosCodigos.length > 0 && todosCodigos.every((codigo) => seleccionadas.includes(codigo))
  const alternarConjunto = (codigos) => {
    const conjuntoCompleto = codigos.every((codigo) => seleccionadas.includes(codigo))
    codigos.filter((codigo) => conjuntoCompleto ? seleccionadas.includes(codigo) : !seleccionadas.includes(codigo)).forEach(onToggle)
  }

  return (
    <Paper elevation={0} sx={formStyles.seccion}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pb: 1.5, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography fontWeight={900}>Permisos del usuario</Typography>
          <Typography sx={{ fontSize: 12.5, color: uiTokens.colores.textoMedio }}>
            Las opciones del rol aparecen marcadas. Puedes activar permisos adicionales para este usuario.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          {controlRol}
          <Tooltip title={todosSeleccionados ? 'Desmarcar todos los permisos' : 'Seleccionar todos los permisos'}>
            <span>
              <IconButton aria-label={todosSeleccionados ? 'Desmarcar todos los permisos' : 'Seleccionar todos los permisos'} disabled={disabled || !todosCodigos.length} onClick={() => alternarConjunto(todosCodigos)} sx={{ border: 1, borderColor: 'divider', color: 'primary.main' }}>
                {todosSeleccionados ? <DeselectOutlinedIcon /> : <SelectAllOutlinedIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Restaurar permisos del rol">
            <span>
              <IconButton aria-label="Restaurar permisos del rol" disabled={disabled} onClick={onSincronizar} sx={{ border: 1, borderColor: 'divider', color: 'primary.main' }}>
                <RestartAltOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1.5 }} />

      <Stack spacing={1.5}>
        {grupos.map((grupo) => {
          const codigosGrupo = grupo.funciones.map((funcion) => funcion.id_menu)
          const grupoCompleto = codigosGrupo.length > 0 && codigosGrupo.every((codigo) => seleccionadas.includes(codigo))
          const grupoParcial = codigosGrupo.some((codigo) => seleccionadas.includes(codigo)) && !grupoCompleto
          return <Box key={grupo.id_usermenu} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper' }}>
            <Stack direction="row" sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={900}>{grupo.menu}</Typography>
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Checkbox size="small" checked={grupoCompleto} indeterminate={grupoParcial} disabled={disabled} onChange={() => alternarConjunto(codigosGrupo)} />}
                label={<Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>Seleccionar todos</Typography>}
              />
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 0.7 }}>
              {grupo.funciones.map((funcion) => {
                const perteneceAlRol = funcionesRolBase.includes(funcion.id_menu)

                return (
                  <Box
                    key={funcion.id_menu}
                    sx={{
                      minHeight: 38,
                      px: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 0.5,
                      borderRadius: 1,
                      border: '1px solid transparent',
                      bgcolor: seleccionadas.includes(funcion.id_menu) ? 'rgba(0,73,135,.025)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(0,73,135,.045)', borderColor: 'divider' },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={seleccionadas.includes(funcion.id_menu)}
                          disabled={disabled}
                          onChange={() => onToggle(funcion.id_menu)}
                        />
                      }
                      label={funcion.nombre}
                      sx={{
                        m: 0,
                        minWidth: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 12.5,
                          fontWeight: perteneceAlRol ? 800 : 600,
                          color: 'text.primary',
                        },
                      }}
                    />
                    {perteneceAlRol ? (
                      <Chip
                        size="small"
                        label="Rol"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 900, color: uiTokens.colores.primario, bgcolor: uiTokens.colores.primarioSuave }}
                      />
                    ) : null}
                  </Box>
                )
              })}
            </Box>
          </Box>
        })}
      </Stack>
    </Paper>
  )
}
