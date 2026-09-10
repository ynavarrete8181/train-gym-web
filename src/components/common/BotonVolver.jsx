import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Button } from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";

export function BotonVolver({ onClick, disabled = false, sx = {} }) {
  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBackOutlinedIcon />}
      disabled={disabled}
      onClick={onClick}
      sx={{ ...dbanuStyles.backButton, ...sx }}
    >
      Volver
    </Button>
  );
}
