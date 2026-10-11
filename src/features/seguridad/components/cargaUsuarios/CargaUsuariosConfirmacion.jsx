import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { Alert, Box, Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

export function CargaUsuariosConfirmacion({ resumen, cargando, notificar, onNotificar, onProcesar }) {
  if (!resumen) return null;

  return (
    <Box sx={{ px: 2, py: 1.5, bgcolor: "#f8fafc", borderTop: "1px solid #dbe5f0" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { xs: "stretch", md: "center" } }}
      >
        <Alert
          severity={resumen.errores ? "warning" : "success"}
          sx={{
            flex: 1,
            py: 0.15,
            "& .MuiAlert-message": { fontSize: 12, lineHeight: 1.45, fontWeight: 650 },
          }}
        >
          Validación completada: {resumen.validos} válida(s) y {resumen.errores} con errores.
        </Alert>
        <Box sx={{ px: 1.5, py: .65, border: '1px solid #dbe5f0', borderRadius: 1.2, bgcolor: '#fff' }}>
          <FormControlLabel control={<Switch size="small" checked={notificar} onChange={(e) => onNotificar(e.target.checked)} />} label={<Box><Typography sx={{ fontSize: 12, fontWeight: 800 }}>Notificar acceso por correo</Typography><Typography sx={{ fontSize: 10.8, color: 'text.secondary' }}>Envía un enlace seguro para establecer contraseña.</Typography></Box>} />
        </Box>
        <Button
          variant="contained"
          startIcon={<GroupAddOutlinedIcon />}
          disabled={cargando || !resumen.validos}
          onClick={onProcesar}
          sx={{ minWidth: 190, minHeight: 42 }}
        >
          Crear {resumen.validos} usuario(s)
        </Button>
      </Stack>
    </Box>
  );
}
