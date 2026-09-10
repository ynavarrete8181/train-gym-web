import { Stack } from "@mui/material";
import { dbanuStyles } from "../../styles/dbanuStyles.js";
import { BotonCancelar } from "./BotonCancelar.jsx";
import { BotonGuardar } from "./BotonGuardar.jsx";

export function AccionesFormulario({
  onCancelar,
  onGuardar,
  guardando = false,
  disabled = false,
  textoCancelar = "Cancelar",
  textoGuardar = "Guardar",
  sx = {},
}) {
  const bloqueado = guardando || disabled;
  return (
    <Stack direction="row" sx={{ ...dbanuStyles.formActions, ...sx }}>
      <BotonCancelar
        texto={textoCancelar}
        disabled={bloqueado}
        onClick={onCancelar}
      />
      <BotonGuardar
        texto={textoGuardar}
        guardando={guardando}
        disabled={disabled}
        onClick={onGuardar}
      />
    </Stack>
  );
}
