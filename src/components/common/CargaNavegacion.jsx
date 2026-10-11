import { Box, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { uiTokens } from "../../styles/uiTokens.js";

export function CargaNavegacion({ visible, texto = "Cargando módulo..." }) {
  if (!visible) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "absolute",
        inset: "64px 0 0",
        zIndex: 20,
        bgcolor: "rgba(245, 248, 252, 0.72)",
        backdropFilter: "blur(1.5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <LinearProgress
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
        }}
      />
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          py: 1.8,
          borderRadius: 2,
          border: `1px solid ${uiTokens.colores.borde}`,
          boxShadow: "0 14px 35px rgba(15, 42, 70, 0.12)",
        }}
      >
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
          <CircularProgress size={22} thickness={4.5} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: uiTokens.colores.textoMedio }}>
            {texto}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
