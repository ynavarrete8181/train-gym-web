import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const criteriosVacios = {
  todos: false,
  usuarios: [],
  roles: [],
  sedes: [],
  unidades: [],
  carreras_areas: [],
  externos: [],
  vinculaciones: [],
};

const grupos = [
  ["roles", "Roles"],
  ["sedes", "Sedes"],
  ["unidades", "Facultades / Direcciones"],
  ["carreras_areas", "Carreras / Áreas"],
];

const filtroUsuarios = createFilterOptions({
  stringify: (opcion) =>
    `${opcion.name || ""} ${opcion.email || ""} ${opcion.cedula || ""}`,
});

export function SelectorDestinatariosCampania({ catalogos, criterios, onChange, soloUsuariosApp = false }) {
  const [tipo, setTipo] = useState(() => obtenerTipoInicial(criterios));
  const [externo, setExterno] = useState({ nombre: "", correo: "" });

  const cambiar = (campo, valor) => onChange({ ...criterios, [campo]: valor });

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setExterno({ nombre: "", correo: "" });
    onChange({
      ...criteriosVacios,
      todos: nuevoTipo === "TODOS",
      vinculaciones: tiposVinculacion[nuevoTipo] ? [tiposVinculacion[nuevoTipo]] : [],
    });
  };

  const agregarExterno = () => {
    if (!externo.correo) return;
    cambiar("externos", [...(criterios.externos || []), externo]);
    setExterno({ nombre: "", correo: "" });
  };

  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label="Tipo de destinatarios"
        value={tipo}
        onChange={(evento) => cambiarTipo(evento.target.value)}
      >
        <MenuItem value="" disabled>Selecciona una opción</MenuItem>
        <MenuItem value="TODOS">{soloUsuariosApp ? "Todos los usuarios de la app" : "Todos los usuarios activos"}</MenuItem>
        <MenuItem value="USUARIOS">Usuarios específicos</MenuItem>
        {soloUsuariosApp && <MenuItem value="ESTUDIANTES">Estudiantes</MenuItem>}
        {soloUsuariosApp && <MenuItem value="DOCENTES">Docentes</MenuItem>}
        {soloUsuariosApp && <MenuItem value="ADMINISTRATIVOS">Administrativos</MenuItem>}
        <MenuItem value="GRUPOS">Grupos operativos</MenuItem>
        {!soloUsuariosApp && <MenuItem value="EXTERNOS">Destinatarios externos</MenuItem>}
      </TextField>

      {tipo === "TODOS" ? (
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, bgcolor: "#f8fafc" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>
            {soloUsuariosApp ? "Se incluirán todos los usuarios que hayan ingresado a la app." : "Se incluirán todos los usuarios activos que tengan un correo válido."}
          </Typography>
        </Paper>
      ) : null}

      {tipo === "USUARIOS" ? (
        <SelectorMultiple
          campo="usuarios"
          etiqueta="Buscar usuarios"
          catalogo={(soloUsuariosApp ? catalogos.usuarios_app : catalogos.usuarios) || []}
          seleccion={criterios.usuarios || []}
          onChange={cambiar}
          filtro={filtroUsuarios}
          mostrarDetalle
        />
      ) : null}

      {tiposVinculacion[tipo] ? (
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, bgcolor: "#f8fafc" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>
            Se incluirán usuarios de la app con vinculación {tiposVinculacion[tipo].toLowerCase()}.
          </Typography>
        </Paper>
      ) : null}

      {tipo === "GRUPOS" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          {grupos.map(([campo, etiqueta]) => (
            <SelectorMultiple
              key={campo}
              campo={campo}
              etiqueta={etiqueta}
              catalogo={catalogos[campo] || []}
              seleccion={criterios[campo] || []}
              onChange={cambiar}
            />
          ))}
        </Box>
      ) : null}

      {tipo === "EXTERNOS" ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 850, mb: 1 }}>
            Destinatarios externos
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              size="small"
              fullWidth
              label="Nombre"
              value={externo.nombre}
              onChange={(evento) => setExterno({ ...externo, nombre: evento.target.value })}
            />
            <TextField
              size="small"
              fullWidth
              label="Correo"
              value={externo.correo}
              onChange={(evento) => setExterno({ ...externo, correo: evento.target.value })}
            />
            <Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={agregarExterno}>
              Añadir
            </Button>
          </Stack>
          {(criterios.externos || []).map((item, index) => (
            <Stack
              key={`${item.correo}-${index}`}
              direction="row"
              sx={{ mt: 1, px: 1.2, py: 0.7, bgcolor: "#f8fafc", borderRadius: 1, alignItems: "center" }}
            >
              <Typography sx={{ flex: 1, fontSize: 12 }}>
                {item.nombre || "Sin nombre"} · {item.correo}
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => cambiar("externos", criterios.externos.filter((_, indice) => indice !== index))}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Paper>
      ) : null}
    </Stack>
  );
}

function SelectorMultiple({
  campo,
  etiqueta,
  catalogo,
  seleccion,
  onChange,
  filtro,
  mostrarDetalle = false,
}) {
  return (
    <Autocomplete
      multiple
      size="small"
      options={catalogo}
      filterOptions={filtro}
      getOptionLabel={(opcion) => opcion.nombre || opcion.name || ""}
      isOptionEqualToValue={(opcion, valor) => String(opcion.id) === String(valor.id)}
      value={catalogo.filter((opcion) =>
        seleccion.some((id) => String(id) === String(opcion.id)),
      )}
      onChange={(_, valores) => onChange(campo, valores.map((opcion) => opcion.id))}
      limitTags={3}
      noOptionsText="No se encontraron resultados"
      renderOption={(props, opcion) => (
        <Box component="li" {...props} key={opcion.id}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
              {opcion.nombre || opcion.name}
            </Typography>
            {mostrarDetalle ? (
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                {[opcion.email, opcion.cedula, opcion.vinculaciones].filter(Boolean).join(" · ")}
              </Typography>
            ) : null}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label={etiqueta} placeholder="Escribe para buscar" />
      )}
    />
  );
}

function obtenerTipoInicial(criterios) {
  if (criterios.todos) return "TODOS";
  const vinculacion = criterios.vinculaciones?.[0];
  if (vinculacion === "ESTUDIANTE") return "ESTUDIANTES";
  if (vinculacion === "DOCENTE") return "DOCENTES";
  if (vinculacion === "ADMINISTRATIVO") return "ADMINISTRATIVOS";
  if (criterios.externos?.length) return "EXTERNOS";
  if (criterios.usuarios?.length) return "USUARIOS";
  return "";
}

const tiposVinculacion = {
  ESTUDIANTES: "ESTUDIANTE",
  DOCENTES: "DOCENTE",
  ADMINISTRATIVOS: "ADMINISTRATIVO",
};
