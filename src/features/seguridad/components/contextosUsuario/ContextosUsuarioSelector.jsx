import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const seleccionInicial = { sede: "", unidad: "", carreraArea: "" };
const arregloVacio = [];

export function ContextosUsuarioSelector({
  estructura,
  value,
  onChange,
  error,
  helperText,
  disabled,
}) {
  const [seleccion, setSeleccion] = useState(seleccionInicial);
  const [editor, setEditor] = useState(null);
  const [errorEditor, setErrorEditor] = useState("");
  const contextos = estructura.contextos || arregloVacio;

  const sedes = useMemo(
    () => (estructura.sedes || []).filter((sede) => sede.activo),
    [estructura.sedes],
  );

  const unidades = useMemo(
    () =>
      (estructura.unidades || []).filter(
        (unidad) =>
          unidad.activo &&
          seleccion.sede &&
          contextos.some(
            (contexto) =>
              mismoId(contexto.id_sede, seleccion.sede) &&
              mismoId(contexto.id_unidad, unidad.id_unidad),
          ),
      ),
    [estructura.unidades, contextos, seleccion.sede],
  );

  const carrerasAreas = useMemo(
    () =>
      (estructura.carreras_areas || []).filter(
        (item) =>
          item.activo &&
          seleccion.sede &&
          seleccion.unidad &&
          contextos.some(
            (contexto) =>
              mismoId(contexto.id_sede, seleccion.sede) &&
              mismoId(contexto.id_unidad, seleccion.unidad) &&
              mismoId(contexto.id_carrera_area, item.id_carrera_area),
          ),
      ),
    [estructura.carreras_areas, contextos, seleccion.sede, seleccion.unidad],
  );

  const seleccionados = value
    .map((id) => contextos.find((contexto) => mismoId(contexto.id_contexto, id)))
    .filter(Boolean);

  const abrirNuevo = () => {
    setSeleccion(seleccionInicial);
    setErrorEditor("");
    setEditor({ tipo: "nuevo", idOriginal: null });
  };

  const abrirEditar = (contexto) => {
    setSeleccion({
      sede: contexto.id_sede,
      unidad: contexto.id_unidad,
      carreraArea: contexto.id_carrera_area ?? "",
    });
    setErrorEditor("");
    setEditor({ tipo: "editar", idOriginal: contexto.id_contexto });
  };

  const cerrarEditor = () => {
    setSeleccion(seleccionInicial);
    setErrorEditor("");
    setEditor(null);
  };

  const cambiarSede = (sede) => {
    setSeleccion({ sede, unidad: "", carreraArea: "" });
    setErrorEditor("");
  };

  const cambiarUnidad = (unidad) => {
    setSeleccion((actual) => ({ ...actual, unidad, carreraArea: "" }));
    setErrorEditor("");
  };

  const guardarAsignacion = () => {
    const contexto = contextos.find(
      (item) =>
        mismoId(item.id_sede, seleccion.sede) &&
        mismoId(item.id_unidad, seleccion.unidad) &&
        (seleccion.carreraArea
          ? mismoId(item.id_carrera_area, seleccion.carreraArea)
          : item.id_carrera_area === null),
    );

    if (!contexto) {
      setErrorEditor("La combinación seleccionada no está disponible.");
      return;
    }

    const repetido = value.some(
      (id) =>
        mismoId(id, contexto.id_contexto) &&
        !mismoId(id, editor?.idOriginal),
    );
    if (repetido) {
      setErrorEditor("Esta asignación ya fue agregada al usuario.");
      return;
    }

    if (editor?.tipo === "editar") {
      onChange(
        value.map((id) =>
          mismoId(id, editor.idOriginal) ? Number(contexto.id_contexto) : Number(id),
        ),
      );
    } else {
      onChange([...value.map(Number), Number(contexto.id_contexto)]);
    }

    cerrarEditor();
  };

  const quitar = (id) => {
    if (mismoId(editor?.idOriginal, id)) cerrarEditor();
    onChange(value.filter((item) => !mismoId(item, id)));
  };

  const establecerPrincipal = (id) => {
    onChange([
      Number(id),
      ...value.filter((item) => !mismoId(item, id)).map(Number),
    ]);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#f8fafc", borderColor: "#dbe5f0" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        sx={{ mb: 1.5, alignItems: { xs: "stretch", sm: "center" } }}
        spacing={1}
      >
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
            Asignaciones operativas
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: 11, color: "text.secondary" }}>
            La primera asignación se considera principal.
          </Typography>
        </Box>
        {!editor ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={abrirNuevo}
            disabled={disabled}
          >
            Añadir asignación
          </Button>
        ) : null}
      </Stack>

      {seleccionados.length ? (
        <Stack spacing={1}>
          {seleccionados.map((contexto, indice) => (
            <Paper
              key={contexto.id_contexto}
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1.2,
                display: "flex",
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 1,
                flexDirection: { xs: "column", sm: "row" },
                borderColor: indice === 0 ? "#9ebbd6" : "divider",
                bgcolor: indice === 0 ? "#f3f7fb" : "#fff",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.35, fontWeight: 800 }}>
                    {contexto.sede_nombre}
                  </Typography>
                  {indice === 0 ? (
                    <Chip
                      size="small"
                      color="primary"
                      icon={<StarOutlinedIcon />}
                      label="Principal"
                      sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                    />
                  ) : null}
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11, lineHeight: 1.4 }}>
                  {contexto.unidad_nombre}
                  {contexto.carrera_area_nombre
                    ? ` · ${contexto.carrera_area_nombre}`
                    : " · Toda la unidad"}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                {indice > 0 ? (
                  <Button
                    size="small"
                    startIcon={<StarOutlinedIcon />}
                    onClick={() => establecerPrincipal(contexto.id_contexto)}
                    disabled={disabled}
                  >
                    Hacer principal
                  </Button>
                ) : null}
                <Tooltip title="Editar asignación">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={() => abrirEditar(contexto)}
                      disabled={disabled}
                      aria-label="Editar asignación operativa"
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Quitar asignación">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => quitar(contexto.id_contexto)}
                      disabled={disabled}
                      aria-label="Quitar asignación operativa"
                    >
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error" variant="outlined">
          {helperText}
        </Alert>
      ) : (
        <Box sx={{ px: 2, py: 1.5, border: "1px dashed #c5d3e3", borderRadius: 2, textAlign: "center", color: "text.secondary", bgcolor: "#fff" }}>
          <Typography sx={{ fontSize: 12 }}>
            Todavía no hay asignaciones operativas agregadas.
          </Typography>
        </Box>
      )}

      {editor ? (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #dbe5f0" }}>
          <Typography sx={{ mb: 1.25, fontSize: 12, fontWeight: 800 }}>
            {editor.tipo === "editar" ? "Editar asignación" : "Nueva asignación"}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
            <TextField select label="Sede" value={seleccion.sede} onChange={(evento) => cambiarSede(evento.target.value)} disabled={disabled}>
              {sedes.map((sede) => (
                <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Área operativa" value={seleccion.unidad} onChange={(evento) => cambiarUnidad(evento.target.value)} disabled={disabled || !seleccion.sede || !unidades.length}>
              {unidades.map((unidad) => (
                <MenuItem key={unidad.id_unidad} value={unidad.id_unidad}>{unidad.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Línea de servicio (opcional)" value={seleccion.carreraArea} onChange={(evento) => setSeleccion((actual) => ({ ...actual, carreraArea: evento.target.value }))} disabled={disabled || !seleccion.unidad}>
              <MenuItem value="">Toda el área operativa</MenuItem>
              {carrerasAreas.map((item) => (
                <MenuItem key={item.id_carrera_area} value={item.id_carrera_area}>{item.nombre}</MenuItem>
              ))}
            </TextField>
          </Box>

          {seleccion.sede && !unidades.length ? (
            <Alert severity="warning" variant="outlined" sx={{ mt: 1.25 }}>
              Esta sede todavía no tiene áreas operativas asociadas.
            </Alert>
          ) : null}
          {errorEditor ? <Alert severity="error" variant="outlined" sx={{ mt: 1.25 }}>{errorEditor}</Alert> : null}

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.25 }}>
            <Button variant="text" startIcon={<CloseOutlinedIcon />} onClick={cerrarEditor} disabled={disabled}>
              Cancelar
            </Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={guardarAsignacion} disabled={disabled || !seleccion.sede || !seleccion.unidad}>
              {editor.tipo === "editar" ? "Actualizar" : "Añadir"}
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}

function mismoId(izquierda, derecha) {
  return String(izquierda ?? "") === String(derecha ?? "");
}
