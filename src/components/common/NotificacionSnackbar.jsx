import { Alert, Snackbar } from "@mui/material";

export function NotificacionSnackbar({
  mensaje,
  tipo = "success",
  onClose,
  duracion,
}) {
  return (
    <Snackbar
      open={Boolean(mensaje)}
      autoHideDuration={duracion || (tipo === "error" ? 5000 : 3500)}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{ mt: { xs: 1, sm: 8.5 }, mr: { xs: 0, sm: 1 } }}
    >
      <Alert
        onClose={onClose}
        severity={tipo}
        variant="filled"
        elevation={6}
        sx={{
          minWidth: { xs: 280, sm: 360 },
          maxWidth: 520,
          alignItems: "center",
          fontWeight: 750,
        }}
      >
        {mensaje}
      </Alert>
    </Snackbar>
  );
}
