import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { formStyles } from "../../../styles/formStyles.js";
import { FuncionesUsuarioPanel } from "./FuncionesUsuarioPanel.jsx";
import { verificarDisponibilidadUsuario } from "../services/usuarioService.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import { BotonGuardar } from "../../../components/common/BotonGuardar.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { ContextosUsuarioSelector } from "./contextosUsuario/ContextosUsuarioSelector.jsx";

const inicial = {
  persona_id: "",
  nombres: "",
  apellidos: "",
  cedula: "",
  email: "",
  usr_tipo: "",
  usr_estado: 1,
  contextos: [],
};

const ROLES_SIN_CONTEXTO_OPERATIVO = ["ROOT", "SUPERADMINISTRADOR", "DEPORTISTA", "RESPONSABLE"];
const ROLES_APP_SIN_PERMISOS_WEB = ["DEPORTISTA", "RESPONSABLE"];
const normalizarRol = (rol) => String(rol ?? "").trim().toUpperCase();

export function UsuarioForm({
  usuario,
  clientesDisponibles = [],
  roles,
  estructura,
  gruposFunciones,
  funcionesRolBase,
  funcionesSeleccionadas,
  cargando,
  error,
  onGuardar,
  onToggleFuncion,
  onRolChange,
  onSincronizar,
  onDirtyChange,
}) {
  const [formulario, setFormulario] = useState(inicial);
  const [etapa, setEtapa] = useState(0);
  const [errores, setErrores] = useState({});
  const [avisoDisponibilidad, setAvisoDisponibilidad] = useState("");
  const [verificando, setVerificando] = useState(false);
  const formularioInicialRef = useRef(inicial);
  const etapas = ["Información del usuario", "Permisos y confirmación"];
  const rolSeleccionado = roles.find(
    (rol) => String(rol.id_userrole) === String(formulario.usr_tipo),
  );
  const rolNombre = normalizarRol(rolSeleccionado?.role ?? usuario?.rol_nombre);
  const requiereContextoOperativo = !ROLES_SIN_CONTEXTO_OPERATIVO.includes(rolNombre);
  const esRolAppSinPermisosWeb = ROLES_APP_SIN_PERMISOS_WEB.includes(rolNombre);
  const esRolGlobal = ["ROOT", "SUPERADMINISTRADOR"].includes(rolNombre);

  useEffect(() => {
    setEtapa(0);
    setErrores({});
    setAvisoDisponibilidad("");
    onDirtyChange(false);
    const valoresIniciales = {
      persona_id: usuario?.persona_id || "",
      nombres: usuario?.nombres || "",
      apellidos: usuario?.apellidos || "",
      cedula: usuario?.cedula || "",
      email: usuario?.email || "",
      usr_tipo: usuario?.usr_tipo || roles[0]?.id_userrole || "",
      usr_estado: usuario?.usr_estado ?? 1,
      contextos: usuario?.contextos || [],
    };
    formularioInicialRef.current = valoresIniciales;
    setFormulario(valoresIniciales);
  }, [usuario, roles, onDirtyChange]);

  const cambiar = (campo, valor) => {
    if (campo === "email" || campo === "persona_id") setAvisoDisponibilidad("");
    const rolNuevo = roles.find(
      (rol) => String(rol.id_userrole) === String(valor),
    );
    const limpiarContextos =
      campo === "usr_tipo" &&
      ROLES_SIN_CONTEXTO_OPERATIVO.includes(normalizarRol(rolNuevo?.role));

    setFormulario((actual) => {
      const siguiente = {
        ...actual,
        [campo]: valor,
        ...(limpiarContextos ? { contextos: [] } : {}),
      };
      onDirtyChange(
        JSON.stringify(normalizarFormulario(siguiente)) !==
          JSON.stringify(normalizarFormulario(formularioInicialRef.current)),
      );
      return siguiente;
    });
    setErrores((actual) => ({ ...actual, [campo]: "" }));

    if (campo === "usr_tipo") onRolChange(Number(valor));
  };

  const seleccionarPersona = (personaId) => {
    setAvisoDisponibilidad("");
    const cliente = clientesDisponibles.find(
      (item) => String(item.persona_id) === String(personaId),
    );

    setFormulario((actual) => {
      const siguiente = {
        ...actual,
        persona_id: personaId,
        nombres: cliente?.nombres || cliente?.nombre_completo || "",
        apellidos: cliente?.apellidos || "",
        cedula: cliente?.identificacion || "",
        email: cliente?.email || actual.email || "",
      };
      onDirtyChange(
        JSON.stringify(normalizarFormulario(siguiente)) !==
          JSON.stringify(normalizarFormulario(formularioInicialRef.current)),
      );
      return siguiente;
    });
    setErrores((actual) => ({ ...actual, persona_id: "" }));
  };

  const validarEtapa = () => {
    const nuevosErrores = {};

    if (etapa === 0) {
      if (!usuario && !formulario.persona_id) {
        nuevosErrores.persona_id = "Selecciona el cliente o persona.";
      }

      if (!formulario.email.trim()) {
        nuevosErrores.email = "Ingresa el correo de acceso.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
        nuevosErrores.email = "Ingresa un correo válido.";
      }


      if (!formulario.usr_tipo) nuevosErrores.usr_tipo = "Selecciona un rol.";
      if (requiereContextoOperativo && !formulario.contextos.length) {
        nuevosErrores.contextos = "Agrega al menos una asignación operativa.";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguiente = async () => {
    if (!validarEtapa()) return;
    if (!usuario && etapa === 0) {
      setVerificando(true);
      setAvisoDisponibilidad("");
      try {
        const disponibilidad = await verificarDisponibilidadUsuario(formulario.persona_id, formulario.email.trim());
        if (!disponibilidad.disponible) {
          setAvisoDisponibilidad(disponibilidad.mensaje);
          return;
        }
      } catch (error) {
        setAvisoDisponibilidad(error.response?.data?.mensaje || "No se pudo comprobar si la cuenta ya existe. Intenta nuevamente.");
        return;
      } finally {
        setVerificando(false);
      }
    }
    setEtapa((actual) => Math.min(actual + 1, etapas.length - 1));
  };

  const usarPermisosRol = async () => {
    const confirmado = await confirmarAccion({
      titulo: "Restaurar permisos del rol",
      texto:
        "Se descartarán los ajustes personalizados realizados en esta pantalla y se cargarán nuevamente los permisos del rol.",
      textoConfirmar: "Sí, restaurar",
      icono: "warning",
    });
    if (!confirmado) return;

    onDirtyChange(true);
    onSincronizar(Number(formulario.usr_tipo));
  };

  return (
    <Paper
      className="page-content-container"
      elevation={0}
      sx={{ overflow: "hidden" }}
    >
      <Box sx={{ bgcolor: "#f6f8fc", px: 2.5, py: 2.5, minHeight: 390 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {avisoDisponibilidad ? <Alert severity="info" variant="outlined">{avisoDisponibilidad}</Alert> : null}

          <Stepper
            activeStep={etapa}
            alternativeLabel
            sx={{ px: { xs: 0, md: 3 }, pb: 0.5 }}
          >
            {etapas.map((nombre) => (
              <Step key={nombre}>
                <StepLabel>{nombre}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {etapa === 0 ? (
            <Stack spacing={2}>
              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>
                  Datos personales
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  {!usuario ? (
                    <TextField
                      select
                      label="Cliente / Persona"
                      value={formulario.persona_id || ""}
                      onChange={(evento) => seleccionarPersona(evento.target.value)}
                      required
                      error={Boolean(errores.persona_id)}
                      helperText={errores.persona_id || "Selecciona una persona ya registrada como cliente."}
                      sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
                    >
                      {clientesDisponibles.map((cliente) => (
                        <MenuItem key={cliente.persona_id} value={cliente.persona_id}>
                          {cliente.nombre_completo} · {cliente.codigo_deportista}
                          {cliente.identificacion ? ` · ${cliente.identificacion}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                  <TextField label="Nombres" value={formulario.nombres} disabled />
                  <TextField label="Apellidos" value={formulario.apellidos} disabled />
                  <TextField label="Identificación" value={formulario.cedula} disabled />
                </Box>
              </Box>

              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>
                  Acceso y rol
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  <TextField
                    label="Correo de acceso"
                    type="email"
                    value={formulario.email}
                    onChange={(evento) => cambiar("email", evento.target.value)}
                    required
                    error={Boolean(errores.email)}
                    helperText={errores.email}
                    autoComplete="off"
                  />
                  <TextField
                    select
                    label="Rol"
                    value={formulario.usr_tipo}
                    onChange={(evento) => cambiar("usr_tipo", evento.target.value)}
                    required
                    error={Boolean(errores.usr_tipo)}
                    helperText={errores.usr_tipo}
                  >
                    {roles.map((rol) => (
                      <MenuItem key={rol.id_userrole} value={rol.id_userrole}>
                        {rol.role}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Estado"
                    value={formulario.usr_estado}
                    onChange={(evento) => cambiar("usr_estado", evento.target.value)}
                  >
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </TextField>
                </Box>
                {!usuario ? (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
                    El usuario recibirá un enlace seguro en su correo para establecer su propia contraseña. El administrador no define ni conoce la contraseña.
                  </Alert>
                ) : null}
              </Box>

              {requiereContextoOperativo ? <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>
                  Asignación operativa
                </Typography>
                <ContextosUsuarioSelector
                  estructura={estructura}
                  value={formulario.contextos}
                  onChange={(valor) => cambiar("contextos", valor)}
                  error={Boolean(errores.contextos)}
                  helperText={errores.contextos}
                  disabled={cargando}
                />
              </Box> : (
                <Alert severity="info" variant="outlined">
                  {["ROOT", "SUPERADMINISTRADOR"].includes(rolNombre)
                    ? "Este rol tiene alcance global y no requiere una asignación operativa por sede."
                    : "Este rol pertenece a la experiencia de cliente/app y su sede se determina por membresías, reservas o relaciones del negocio; no por una asignación operativa interna."}
                </Alert>
              )}
            </Stack>
          ) : null}

          {etapa === 1 ? (
            <Stack spacing={2}>
              <Alert severity="info" variant="outlined">
                <strong>{formulario.nombres} {formulario.apellidos}</strong>{" "}
                {esRolGlobal
                  ? " tiene acceso global a todas las funciones activas del sistema, sin depender de permisos individuales."
                  : ` tendrá ${funcionesSeleccionadas.length} permiso(s) activo(s).`}
                {esRolAppSinPermisosWeb
                  ? " El acceso administrativo web queda sin permisos."
                  : " Revisa las opciones antes de guardar."}
              </Alert>
              {esRolGlobal || esRolAppSinPermisosWeb ? null : gruposFunciones.length ? (
                <FuncionesUsuarioPanel
                  grupos={gruposFunciones}
                  funcionesRolBase={funcionesRolBase}
                  seleccionadas={funcionesSeleccionadas}
                  disabled={cargando}
                  onToggle={onToggleFuncion}
                  onSincronizar={usarPermisosRol}
                />
              ) : (
                <Alert severity="warning">
                  El rol seleccionado no tiene permisos disponibles.
                </Alert>
              )}
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ ...dbanuStyles.dialogActions, display: "flex" }}>
        <Stack direction="row" spacing={1.2}>
          {etapa > 0 ? (
            <BotonVolver
              texto="Anterior"
              onClick={() => setEtapa((actual) => actual - 1)}
              disabled={cargando}
            />
          ) : null}
          {etapa < etapas.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardOutlinedIcon />}
              onClick={siguiente}
              disabled={cargando || verificando}
              sx={dbanuStyles.addButton}
            >
              {verificando ? "Verificando..." : "Siguiente"}
            </Button>
          ) : (
            <BotonGuardar
              texto={usuario ? "Guardar cambios" : "Crear usuario"}
              onClick={() => onGuardar(formulario)}
              guardando={cargando}
            />
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function normalizarFormulario(formulario) {
  return {
    ...formulario,
    usr_tipo: String(formulario.usr_tipo ?? ""),
    usr_estado: Number(formulario.usr_estado),
    contextos: (formulario.contextos || []).map(Number),
  };
}
