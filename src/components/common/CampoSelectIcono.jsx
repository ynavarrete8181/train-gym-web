import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { dbanuStyles } from '../../styles/dbanuStyles.js';
import { uiTokens } from '../../styles/uiTokens.js';

export function CampoSelectIcono({
  icono,
  options = null,
  getOptionLabel = (option) => option?.label ?? '',
  getOptionDescription = (option) => option?.description ?? '',
  getOptionValue = (option) => option?.value ?? '',
  getOptionIcon = (option) => option?.icono ?? icono,
  children,
  value = '',
  sx = {},
  slotProps = {},
  SelectProps = {},
  ...props
}) {
  const opciones = Array.isArray(options) ? options : null;
  const seleccionada = opciones?.find(
    (option) => String(getOptionValue(option)) === String(value),
  ) || null;

  return (
    <TextField
      select
      size="small"
      value={value}
      {...props}
      sx={{
        ...dbanuStyles.field,
        '& .MuiInputBase-root': {
          ...(dbanuStyles.field?.['& .MuiInputBase-root'] || {}),
          minHeight: 40,
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
        },
        ...sx,
      }}
      slotProps={slotProps}
      SelectProps={{
        IconComponent: KeyboardArrowDownRoundedIcon,
        ...SelectProps,
        renderValue: opciones
          ? () => {
              if (!seleccionada) return '';

              const selectedIcon = getOptionIcon(seleccionada);
              const selectedDescription = getOptionDescription(seleccionada);

              return (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.35,
                    minWidth: 0,
                    width: '100%',
                    pr: 0.5,
                  }}
                >
                  {selectedIcon ? (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flex: '0 0 32px',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1,
                        color: uiTokens.colores.primario,
                        bgcolor: 'rgba(20, 73, 133, 0.07)',
                        border: '1px solid rgba(20, 73, 133, 0.16)',
                        '& .MuiSvgIcon-root': { fontSize: 17 },
                      }}
                    >
                      {selectedIcon}
                    </Box>
                  ) : null}

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      component="span"
                      noWrap
                      sx={{
                        display: 'block',
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 850,
                        color: uiTokens.colores.textoFuerte,
                      }}
                    >
                      {getOptionLabel(seleccionada)}
                    </Typography>

                    {selectedDescription ? (
                      <Typography
                        component="span"
                        noWrap
                        sx={{
                          display: 'block',
                          mt: 0.15,
                          fontSize: 10.2,
                          lineHeight: 1.15,
                          color: uiTokens.colores.textoMedio,
                        }}
                      >
                        {selectedDescription}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              );
            }
          : SelectProps.renderValue,
        MenuProps: {
          ...(SelectProps.MenuProps || {}),
          PaperProps: {
            ...(SelectProps.MenuProps?.PaperProps || {}),
            sx: {
              mt: 0.65,
              border: `1px solid ${uiTokens.colores.borde}`,
              borderRadius: 1.5,
              boxShadow: '0 12px 28px rgba(15, 58, 107, 0.14)',
              overflow: 'hidden',
              '& .MuiList-root': {
                py: 0.5,
              },
              '& .MuiMenuItem-root': {
                minHeight: 48,
                px: 1.25,
                py: 0.75,
                mx: 0.5,
                my: 0.2,
                borderRadius: 1,
                gap: 1.25,
              },
              '& .MuiMenuItem-root:hover': {
                bgcolor: 'rgba(20, 73, 133, 0.055)',
              },
              '& .MuiMenuItem-root.Mui-selected': {
                bgcolor: 'rgba(20, 73, 133, 0.085)',
              },
              '& .MuiMenuItem-root.Mui-selected:hover': {
                bgcolor: 'rgba(20, 73, 133, 0.12)',
              },
              ...(SelectProps.MenuProps?.PaperProps?.sx || {}),
            },
          },
        },
      }}
    >
      {opciones
        ? opciones.map((option) => {
            const optionValue = getOptionValue(option);
            const selected = String(optionValue) === String(value);
            const descripcion = getOptionDescription(option);
            const optionIcon = getOptionIcon(option);

            return (
              <MenuItem key={String(optionValue)} value={optionValue}>
                {optionIcon ? (
                  <ListItemIcon
                    sx={{
                      minWidth: '32px !important',
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'grid',
                      placeItems: 'center',
                      color: selected ? uiTokens.colores.primario : uiTokens.colores.textoMedio,
                      bgcolor: selected ? 'rgba(20, 73, 133, 0.09)' : '#f8fafc',
                      border: `1px solid ${selected ? 'rgba(20,73,133,.22)' : uiTokens.colores.borde}`,
                      mr: 0.35,
                      '& .MuiSvgIcon-root': { fontSize: 17 },
                    }}
                  >
                    {optionIcon}
                  </ListItemIcon>
                ) : null}

                <ListItemText
                  sx={{ minWidth: 0, my: 0 }}
                  primary={
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 12,
                        lineHeight: 1.25,
                        fontWeight: selected ? 900 : 750,
                        color: uiTokens.colores.textoFuerte,
                      }}
                    >
                      {getOptionLabel(option)}
                    </Typography>
                  }
                  secondary={descripcion ? (
                    <Typography
                      noWrap
                      sx={{
                        mt: 0.15,
                        fontSize: 10.2,
                        lineHeight: 1.2,
                        color: uiTokens.colores.textoMedio,
                      }}
                    >
                      {descripcion}
                    </Typography>
                  ) : null}
                />

                <Box sx={{ width: 22, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                  {selected ? (
                    <CheckRoundedIcon sx={{ fontSize: 18, color: uiTokens.colores.primario }} />
                  ) : null}
                </Box>
              </MenuItem>
            );
          })
        : children}
    </TextField>
  );
}
