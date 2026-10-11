import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { formStyles } from "../../../styles/formStyles.js";

export function UsuarioDetalle({ detalle, estructura }) {
  const usuario = detalle?.usuario || {};
  const contextos = (detalle?.contextos || [])
    .map((id) => estructura.contextos?.find((item) => String(item.id_contexto) === String(id)))
    .filter(Boolean);

  return (
    <Paper className="page-content-container" elevation={0} sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack spacing={2}>
        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Información general</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
            <Dato etiqueta="Nombres" valor={usuario.nombres} />
            <Dato etiqueta="Apellidos" valor={usuario.apellidos} />
            <Dato etiqueta="Cédula" valor={usuario.cedula} />
            <Dato etiqueta="Correo de acceso" valor={usuario.email} />
            <Dato etiqueta="Rol" valor={usuario.rol_nombre || usuario.role} />
            <Dato etiqueta="Estado" valor={Number(usuario.usr_estado) === 1 ? "Activo" : "Inactivo"} />
          </Box>
        </Box>

        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Asignaciones operativas</Typography>
          <Stack spacing={1.25} divider={<Divider flexItem />}>
            {contextos.length ? contextos.map((contexto, indice) => (
              <Box key={contexto.id_contexto}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{contexto.sede_nombre}</Typography>
                  {indice === 0 ? <Chip size="small" color="primary" label="Principal" /> : null}
                </Stack>
                <Typography sx={{ mt: 0.25, fontSize: 11.5, color: "text.secondary" }}>
                  {contexto.unidad_nombre}{contexto.carrera_area_nombre ? ` · ${contexto.carrera_area_nombre}` : " · Toda el área"}
                </Typography>
              </Box>
            )) : <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Sin asignaciones operativas.</Typography>}
          </Stack>
        </Box>

        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Permisos asignados</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              gap: 0.75,
              width: "100%",
              minWidth: 0,
            }}
          >
            {(detalle?.funciones || []).length
              ? detalle.funciones.map((funcion) => (
                <Chip
                  key={funcion.id_menu || funcion.codigo}
                  size="small"
                  label={funcion.nombre || funcion.label || funcion.id_menu || funcion.codigo}
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    height: "auto",
                    justifyContent: "flex-start",
                    borderRadius: 1.5,
                    "& .MuiChip-label": {
                      display: "block",
                      width: "100%",
                      py: 0.65,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      textAlign: "left",
                    },
                  }}
                />
              ))
              : <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Sin permisos personalizados.</Typography>}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

function Dato({ etiqueta, valor }) {
  return <Box><Typography sx={{ fontSize: 10.8, color: "text.secondary" }}>{etiqueta}</Typography><Typography sx={{ mt: 0.2, fontSize: 12.5, fontWeight: 750 }}>{valor || "—"}</Typography></Box>;
}
