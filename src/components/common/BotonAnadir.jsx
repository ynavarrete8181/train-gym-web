import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button } from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";

export function BotonAnadir({ onClick, disabled = false, sx = {} }) {
  return (
    <Button
      variant="outlined"
      startIcon={<AddOutlinedIcon />}
      disabled={disabled}
      onClick={onClick}
      sx={{ ...dbanuStyles.addButtonRevive, ...sx }}
    >
      Añadir
    </Button>
  );
}
