import { FormControlLabel, Switch } from "@mui/material";

/**
 * Interruptor único para estados binarios (activo o inactivo). Va como último
 * campo del formulario. No usar para estados de negocio con más de dos valores.
 * onChange recibe el evento, por lo que event.target.checked trae el valor.
 */
export function CampoActivo({ checked, onChange, name, label = "Activo", disabled = false, sx = {} }) {
  return (
    <FormControlLabel
      sx={{ m: 0, alignSelf: "center", justifySelf: "start", ...sx }}
      control={<Switch name={name} checked={Boolean(checked)} onChange={onChange} disabled={disabled} />}
      label={label}
    />
  );
}
