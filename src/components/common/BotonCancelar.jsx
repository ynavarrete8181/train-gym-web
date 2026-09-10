import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Button } from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";

export function BotonCancelar({
  onClick,
  texto = "Cancelar",
  disabled = false,
  sx = {},
}) {
  return (
    <Button
      variant="outlined"
      startIcon={<CloseOutlinedIcon />}
      disabled={disabled}
      onClick={onClick}
      sx={{ ...dbanuStyles.cancelButton, ...sx }}
    >
      {texto}
    </Button>
  );
}
