import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";
import { formStyles } from "../../styles/formStyles.js";
import { uiTokens } from "../../styles/uiTokens.js";
import { BotonCancelar } from "./BotonCancelar.jsx";

export function ModalConfirmacion({
  open,
  titulo,
  descripcion,
  icono,
  children,
  textoCancelar = "Cancelar",
  textoConfirmar = "Sí, confirmar",
  colorConfirmar = "success",
  iconoConfirmar,
  cargando = false,
  onClose,
  onConfirmar,
}) {
  return (
    <Dialog
      open={open}
      onClose={cargando ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        <Box sx={formStyles.modalHeader}>
          <Box sx={formStyles.modalIcono}>
            {icono || <HelpOutlineOutlinedIcon />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.2 }}>
              {titulo}
            </Typography>
            {descripcion ? (
              <Typography sx={{ mt: 0.4, fontSize: 12.5, lineHeight: 1.45, color: uiTokens.colores.textoMedio }}>
                {descripcion}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>

      {children ? (
        <DialogContent dividers sx={{ bgcolor: "#f6f8fc", px: 2.5, py: 2.25 }}>
          <Stack spacing={1.25}>{children}</Stack>
        </DialogContent>
      ) : null}

      <DialogActions sx={dbanuStyles.dialogActions}>
        <BotonCancelar texto={textoCancelar} onClick={onClose} disabled={cargando} />
        <Button
          variant="outlined"
          color={colorConfirmar}
          startIcon={iconoConfirmar || <CheckCircleOutlineOutlinedIcon />}
          onClick={onConfirmar}
          disabled={cargando}
          sx={{ minWidth: 128, fontWeight: 800 }}
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
