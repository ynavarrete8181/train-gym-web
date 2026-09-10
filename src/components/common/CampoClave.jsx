import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
import { useState } from 'react'

export function CampoClave({ slotProps = {}, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps.input || {}),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <IconButton
                  edge="end"
                  type="button"
                  size="small"
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVisible((actual) => !actual)}
                  onMouseDown={(evento) => evento.preventDefault()}
                  sx={{ p: 0.45, mr: 0.15 }}
                >
                  {visible ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
