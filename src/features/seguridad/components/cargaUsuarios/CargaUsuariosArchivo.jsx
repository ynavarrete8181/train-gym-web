import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { IconoArchivo } from "../../../../components/common/IconoArchivo.jsx";

export function CargaUsuariosArchivo({
  archivo,
  cargando,
  onDescargar,
  onSeleccionar,
  onQuitar,
}) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 900 }}>
        Archivo y validación
      </Typography>
      <Typography sx={{ my: 1, fontSize: 12.5, color: "text.secondary" }}>
        Nombres, apellidos, cédula, correo, rol y contexto son obligatorios. El
        sistema generará las contraseñas temporales al crear los usuarios.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          variant="outlined"
          startIcon={<IconoArchivo tipo="xlsx" size={17} />}
          onClick={onDescargar}
          disabled={cargando}
        >
          Descargar plantilla Excel
        </Button>
        <Button
          component="label"
          variant="contained"
          startIcon={<UploadFileOutlinedIcon />}
          disabled={cargando}
        >
          {archivo ? "Cambiar archivo" : "Seleccionar archivo"}
          <input
            hidden
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onSeleccionar}
          />
        </Button>
      </Stack>

      {archivo ? (
        <Box sx={{ mt: 1.5 }}>
          <Chip
            label={archivo}
            size="small"
            variant="outlined"
            onDelete={cargando ? undefined : onQuitar}
            sx={{ maxWidth: "100%", bgcolor: "#f6f8fc" }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
