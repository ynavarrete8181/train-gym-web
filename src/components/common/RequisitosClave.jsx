import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import { Box, Tooltip, Typography } from "@mui/material";
import { requisitosClave } from "../../utils/claveSegura.js";

export function RequisitosClave({ valor = "", mostrar = true }) {
  if (!mostrar) return null;

  return (
    <Box sx={{ mt: 0.75, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 0.55 }}>
      {requisitosClave.map((requisito) => {
        const cumple = requisito.cumple(valor);
        const Icono = cumple ? CheckCircleOutlineOutlinedIcon : RadioButtonUncheckedOutlinedIcon;

        return (
          <Box key={requisito.id} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Icono sx={{ fontSize: 16, color: cumple ? "success.main" : "text.disabled" }} />
            <Typography sx={{ fontSize: 11.5, color: cumple ? "success.dark" : "text.secondary" }}>
              {requisito.texto}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export function TooltipRequisitosClave({ valor = "", children }) {
  return (
    <Tooltip
      arrow
      placement="bottom-start"
      enterDelay={250}
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography sx={{ mb: 0.65, fontSize: 11.5, fontWeight: 800 }}>
            La contraseña debe incluir:
          </Typography>
          {requisitosClave.map((requisito) => {
            const cumple = requisito.cumple(valor);
            const Icono = cumple ? CheckCircleOutlineOutlinedIcon : RadioButtonUncheckedOutlinedIcon;
            return (
              <Box key={requisito.id} sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.35 }}>
                <Icono sx={{ fontSize: 15, color: cumple ? "#78d79b" : "#cbd5e1" }} />
                <Typography sx={{ fontSize: 11, color: "inherit" }}>{requisito.texto}</Typography>
              </Box>
            );
          })}
        </Box>
      }
    >
      <Box>{children}</Box>
    </Tooltip>
  );
}
