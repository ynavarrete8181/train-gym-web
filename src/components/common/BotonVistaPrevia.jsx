import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined';
import { Button, CircularProgress } from '@mui/material';
import { dbanuStyles } from '../../styles/dbanuStyles.js';
import { uiTokens } from '../../styles/uiTokens.js';

export function BotonVistaPrevia({ onClick, disabled = false, cargando = false, texto = 'Vista previa', sx = {} }) {
  return <Button variant="contained" onClick={onClick} disabled={disabled || cargando}
    startIcon={cargando ? <CircularProgress size={17} color="inherit"/> : <PreviewOutlinedIcon/>}
    sx={{
      ...dbanuStyles.saveButton,
      bgcolor: uiTokens.colores.acento,
      color: uiTokens.colores.textoFuerte,
      border: `1px solid ${uiTokens.colores.acentoOscuro}`,
      boxShadow: 'none',
      '&:hover': { bgcolor: uiTokens.colores.acentoOscuro, boxShadow: 'none' },
      '&.Mui-disabled': { bgcolor: uiTokens.colores.acentoSuave, color: uiTokens.colores.textoMedio },
      ...sx,
    }}>
    {cargando ? 'Calculando…' : texto}
  </Button>;
}
