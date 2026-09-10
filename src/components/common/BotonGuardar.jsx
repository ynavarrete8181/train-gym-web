import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Button, CircularProgress } from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";

export function BotonGuardar({
  onClick,
  texto = "Guardar",
  guardando = false,
  disabled = false,
  sx = {},
}) {
  return (
    <Button
      variant="outlined"
      startIcon={
        guardando ? (
          <CircularProgress size={17} color="inherit" />
        ) : (
          <SaveOutlinedIcon />
        )
      }
      disabled={guardando || disabled}
      onClick={onClick}
      sx={{ ...dbanuStyles.saveButton, ...sx }}
    >
      {guardando ? "Guardando…" : texto}
    </Button>
  );
}
