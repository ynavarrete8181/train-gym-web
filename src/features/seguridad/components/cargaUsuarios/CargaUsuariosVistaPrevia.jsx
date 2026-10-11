import {
  Box,
  ButtonBase,
  Chip,
  Divider,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function CargaUsuariosVistaPrevia({ filas = [] }) {
  const [contextoVisible, setContextoVisible] = useState({ anchor: null, texto: "" });

  if (!filas.length) return null;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          bgcolor: "#f8fafc",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>Vista previa</Typography>
        <Chip size="small" variant="outlined" label={`${filas.length} fila(s)`} />
      </Box>
      <Divider />
      <TableContainer
        sx={{
          maxHeight: 430,
          pb: 1.25,
          bgcolor: "#fff",
          "&::-webkit-scrollbar": { height: 10, width: 10 },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fila</TableCell>
              <TableCell>Nombres</TableCell>
              <TableCell>Apellidos</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Contexto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Detalle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((item) => (
              <TableRow key={item.fila}>
                <TableCell>{item.fila}</TableCell>
                <TableCell>{item.datos.nombres || item.datos.nombre}</TableCell>
                <TableCell>{item.datos.apellidos}</TableCell>
                <TableCell>{item.datos.cedula}</TableCell>
                <TableCell>{item.datos.email}</TableCell>
                <TableCell>{item.datos.rol_nombre || item.datos.rol}</TableCell>
                <TableCell sx={{ maxWidth: 210 }}>
                  <ButtonBase
                    onClick={(evento) =>
                      setContextoVisible({
                        anchor: evento.currentTarget,
                        texto: item.datos.contexto || "",
                      })
                    }
                    title="Ver contexto completo"
                    sx={{
                      display: "block",
                      width: "100%",
                      maxWidth: 190,
                      textAlign: "left",
                      borderRadius: 1,
                      "&:hover": { color: "primary.main", textDecoration: "underline" },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                      }}
                    >
                      {item.datos.contexto || "—"}
                    </Typography>
                  </ButtonBase>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={item.estado === "error" ? "error" : "success"}
                    label={
                      item.estado === "error"
                        ? "Error"
                        : item.estado === "creado"
                          ? "Creado"
                          : "Válido"
                    }
                  />
                </TableCell>
                <TableCell>{item.errores?.join(" ") || "Procesado correctamente"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Popover
        open={Boolean(contextoVisible.anchor)}
        anchorEl={contextoVisible.anchor}
        onClose={() => setContextoVisible({ anchor: null, texto: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              p: 1.5,
              width: "min(420px, calc(100vw - 32px))",
              borderRadius: 2,
              border: "1px solid #dbe5f0",
              boxShadow: "0 12px 30px rgba(15, 42, 70, 0.16)",
            },
          },
        }}
      >
        <Typography sx={{ mb: 0.5, fontSize: 11, fontWeight: 800, color: "text.secondary" }}>
          Asignación operativa
        </Typography>
        <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, overflowWrap: "anywhere" }}>
          {contextoVisible.texto}
        </Typography>
      </Popover>
    </Paper>
  );
}
