import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined';
import { Button, CircularProgress } from '@mui/material';
import { dbanuStyles } from '../../styles/dbanuStyles.js';

export function BotonVistaPrevia({ onClick, disabled = false, cargando = false, texto = 'Vista previa', sx = {} }) {
  return <Button variant="outlined" onClick={onClick} disabled={disabled || cargando}
    startIcon={cargando ? <CircularProgress size={17} color="inherit"/> : <PreviewOutlinedIcon/>}
    sx={{ ...dbanuStyles.saveButton, ...sx }}>
    {cargando ? 'Calculando…' : texto}
  </Button>;
}
