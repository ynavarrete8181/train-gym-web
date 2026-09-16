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
import { confirmarAccion } from "../../../utils/confirmacion.js";
import { BotonGuardar } from "../../../components/common/BotonGuardar.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { ContextosUsuarioSelector } from "./contextosUsuario/ContextosUsuarioSelector.jsx";
import { TooltipRequisitosClave } from "../../../components/common/RequisitosClave.jsx";
import { claveEsSegura } from "../../../utils/claveSegura.js";
import { CampoClave } from "../../../components/common/CampoClave.jsx";

const inicial = {
  nombres: "",
  apellidos: "",
  cedula: "",
  email: "",
  password: "",
  password_confirmation: "",
  usr_tipo: "",
  usr_estado: 1,
  contextos: [],
};

const ROLES_SIN_CONTEXTO_OPERATIVO = ["SUPERADMINISTRADOR", "DEPORTISTA", "RESPONSABLE"];
const ROLES_APP_SIN_PERMISOS_WEB = ["DEPORTISTA", "RESPONSABLE"];

export function UsuarioForm({
  usuario,
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
  const formularioInicialRef = useRef(inicial);
  const etapas = ["Información del usuario", "Permisos y confirmación"];
  const rolSeleccionado = roles.find(
    (rol) => String(rol.id_userrole) === String(formulario.usr_tipo),
  );
  const rolNombre = rolSeleccionado?.role || "";
  const requiereContextoOperativo = !ROLES_SIN_CONTEXTO_OPERATIVO.includes(rolNombre);
  const esRolAppSinPermisosWeb = ROLES_APP_SIN_PERMISOS_WEB.includes(rolNombre);

  useEffect(() => {
    setEtapa(0);
    setErrores({});
    onDirtyChange(false);
    const valoresIniciales = {
      nombres: usuario?.nombres || "",
      apellidos: usuario?.apellidos || "",
      cedula: usuario?.cedula || "",
      email: usuario?.email || "",
      password: "",
      password_confirmation: "",
      usr_tipo: usuario?.usr_tipo || roles[0]?.id_userrole || "",
      usr_estado: usuario?.usr_estado ?? 1,
      contextos: usuario?.contextos || [],
    };
    formularioInicialRef.current = valoresIniciales;
    setFormulario(valoresIniciales);
  }, [usuario, roles, onDirtyChange]);

  const cambiar = (campo, valor) => {
    const rolNuevo = roles.find(
      (rol) => String(rol.id_userrole) === String(valor),
    );
    const limpiarContextos =
      campo === "usr_tipo" &&
      ROLES_SIN_CONTEXTO_OPERATIVO.includes(rolNuevo?.role || "");

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

  const validarEtapa = () => {
    const nuevosErrores = {};

    if (etapa === 0) {
      if (!formulario.nombres.trim()) {
        nuevosErrores.nombres = "Ingresa los nombres del usuario.";
      }

      if (!formulario.apellidos.trim()) {
        nuevosErrores.apellidos = "Ingresa los apellidos del usuario.";
      }

      if (!formulario.cedula.trim()) {
        nuevosErrores.cedula = "Ingresa la cédula del usuario.";
      }

      if (!formulario.email.trim()) {
        nuevosErrores.email = "Ingresa el correo de acceso.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
        nuevosErrores.email = "Ingresa un correo válido.";
      }

      if (!usuario && !claveEsSegura(formulario.password)) {
        nuevosErrores.password =
          "La contraseña temporal todavía no cumple todos los requisitos.";
      } else if (
        usuario &&
        formulario.password &&
        !claveEsSegura(formulario.password)
      ) {
        nuevosErrores.password =
          "La nueva contraseña todavía no cumple todos los requisitos.";
      }

      if (!usuario && formulario.password !== formulario.password_confirmation) {
        nuevosErrores.password_confirmation = "Las contraseñas no coinciden.";
      }

      if (!formulario.usr_tipo) nuevosErrores.usr_tipo = "Selecciona un rol.";
      if (requiereContextoOperativo && !formulario.contextos.length) {
        nuevosErrores.contextos = "Agrega al menos una asignación operativa.";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguiente = () => {
    if (validarEtapa())
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
                  <TextField
                    label="Nombres"
                    value={formulario.nombres}
                    onChange={(evento) => cambiar("nombres", evento.target.value)}
                    required
                    error={Boolean(errores.nombres)}
                    helperText={errores.nombres}
                    autoFocus
                  />
                  <TextField
                    label="Apellidos"
                    value={formulario.apellidos}
                    onChange={(evento) => cambiar("apellidos", evento.target.value)}
                    required
                    error={Boolean(errores.apellidos)}
                    helperText={errores.apellidos}
                  />
                  <TextField
                    label="Cédula"
                    value={formulario.cedula}
                    onChange={(evento) => cambiar("cedula", evento.target.value)}
                    required
                    error={Boolean(errores.cedula)}
                    helperText={errores.cedula}
                  />
                </Box>
              </Box>

              <Box sx={formStyles.seccion}>
                <Typography sx={formStyles.modalSeccionTitulo}>
                  Acceso y rol
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
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
                  {!usuario ? <TooltipRequisitosClave valor={formulario.password}>
                    <CampoClave
                      fullWidth
                      label="Contraseña temporal"
                      name="nueva_clave_usuario"
                      autoComplete="new-password"
                      value={formulario.password}
                      onChange={(evento) => cambiar("password", evento.target.value)}
                      required
                      error={Boolean(errores.password)}
                      helperText={errores.password}
                    />
                  </TooltipRequisitosClave> : null}
                  {!usuario ? <CampoClave
                    label="Confirmar contraseña"
                    autoComplete="new-password"
                    value={formulario.password_confirmation}
                    onChange={(evento) => cambiar("password_confirmation", evento.target.value)}
                    required
                    error={Boolean(errores.password_confirmation)}
                    helperText={errores.password_confirmation}
                  /> : null}
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
                  {rolNombre === "SUPERADMINISTRADOR"
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
                tendrá {funcionesSeleccionadas.length} permiso(s) activo(s).
                {esRolAppSinPermisosWeb
                  ? " El acceso administrativo web queda sin permisos."
                  : " Revisa las opciones antes de guardar."}
              </Alert>
              {esRolAppSinPermisosWeb ? null : gruposFunciones.length ? (
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
              disabled={cargando}
              sx={dbanuStyles.addButton}
            >
              Siguiente
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
