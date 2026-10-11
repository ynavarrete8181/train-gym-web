import { InputAdornment, TextField } from '@mui/material';
import { dbanuStyles } from '../../styles/dbanuStyles.js';
import { uiTokens } from '../../styles/uiTokens.js';

export function CampoSelectIcono({
  icono,
  children,
  sx = {},
  slotProps = {},
  ...props
}) {
  return (
    <TextField
      select
      size="small"
      {...props}
      sx={{
        ...dbanuStyles.field,
        '& .MuiInputAdornment-root': {
          color: uiTokens.colores.primario,
          mr: 0.8,
        },
        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
          fontSize: 18,
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
        },
        ...sx,
      }}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps.input || {}),
          startAdornment: icono ? (
            <InputAdornment position="start">
              {icono}
            </InputAdornment>
          ) : slotProps.input?.startAdornment,
        },
      }}
    >
      {children}
    </TextField>
  );
}
