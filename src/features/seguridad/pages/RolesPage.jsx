import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { IconoMaterial } from "../../../components/common/IconoMaterial.jsx";
import { LoadingState } from "../../../components/common/LoadingState.jsx";
import { NotificacionSnackbar } from "../../../components/common/NotificacionSnackbar.jsx";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { EstadoToggleCell } from "../../../components/tables/EstadoToggleCell.jsx";
import { FilterHeaderCell } from "../../../components/tables/FilterHeaderCell.jsx";
import { GestionToolbar } from "../../../components/tables/GestionToolbar.jsx";
import { TablaEstadoFila } from "../../../components/tables/TablaEstadoFila.jsx";
import { TablaGestion } from "../../../components/tables/TablaGestion.jsx";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { formStyles } from "../../../styles/formStyles.js";
import { tableStyles } from "../../../styles/tableStyles.js";
import { uiTokens } from "../../../styles/uiTokens.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import {
  asignarFuncionRol,
  cambiarEstadoRol,
  detalleRol,
  guardarRol,
  listarFuncionesDisponibles,
  listarRoles,
  quitarFuncionRol,
  sincronizarRol,
} from "../services/rolPermisoService.js";

const inicial = { role: "", activo: true };

function mensajeError(error, fallback) {
  return (
    error.response?.data?.mensaje ||
    Object.values(error.response?.data?.errores || {})
      .flat()
      .find(Boolean) ||
    fallback
  );
}

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [rolActual, setRolActual] = useState(null);
  const [detalle, setDetalle] = useState({ funciones_agrupadas: [] });
  const [catalogo, setCatalogo] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(false);
  const [modoDetalle, setModoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaMenus, setBusquedaMenus] = useState("");
  const [busquedaSubmenus, setBusquedaSubmenus] = useState("");
  const [menuSeleccionado, setMenuSeleccionado] = useState("");
  const [filtrosColumna, setFiltrosColumna] = useState({
    role: [], estado: [],
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pagePermisos, setPagePermisos] = useState(1);
  const [rowsPermisos, setRowsPermisos] = useState(5);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const rolesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return roles.filter((rol) => {
      const estado = rol.activo ? "activo" : "inactivo";
      const coincideGlobal =
        !texto || [rol.role, estado].join(" ").toLowerCase().includes(texto);
      const coincideRol = !filtrosColumna.role.length || filtrosColumna.role.includes(rol.role);
      const coincideEstado = !filtrosColumna.estado.length || filtrosColumna.estado.includes(estado);
      return coincideGlobal && coincideRol && coincideEstado;
    });
  }, [busqueda, filtrosColumna, roles]);
  const opcionesFiltro = useMemo(() => ({
    role: [...new Set(roles.map((rol) => rol.role))].sort((a, b) => a.localeCompare(b, "es")).map((valor) => ({ value: valor, label: valor })),
    estado: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }],
  }), [roles]);

  const totalPages = Math.max(
    1,
    Math.ceil(rolesFiltrados.length / rowsPerPage),
  );
  const rolesPagina = useMemo(
    () => rolesFiltrados.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [page, rolesFiltrados, rowsPerPage],
  );
  const codigosAsignados = useMemo(
    () =>
      new Set(
        detalle.funciones_agrupadas?.flatMap((grupo) =>
          grupo.funciones
            .filter((funcion) => funcion.activo)
            .map((funcion) => funcion.id_menu),
        ) || [],
      ),
    [detalle],
  );
  const catalogoFiltrado = useMemo(() => {
    const texto = busquedaMenus.trim().toLowerCase();
    if (!texto) return catalogo;

    return catalogo.filter((grupo) => grupo.menu.toLowerCase().includes(texto));
  }, [busquedaMenus, catalogo]);
  const grupoActual = useMemo(() => {
    if (!catalogoFiltrado.length) return null;
    return (
      catalogoFiltrado.find(
        (grupo) => String(grupo.id_usermenu) === String(menuSeleccionado),
      ) || catalogoFiltrado[0]
    );
  }, [catalogoFiltrado, menuSeleccionado]);
  const funcionesFiltradas = useMemo(() => {
    const texto = busquedaSubmenus.trim().toLowerCase();
    const funciones = grupoActual?.funciones || [];
    if (!texto) return funciones;

    return funciones.filter((funcion) =>
      [funcion.nombre, funcion.id_menu].join(" ").toLowerCase().includes(texto),
    );
  }, [busquedaSubmenus, grupoActual]);
  const totalPermisosPages = Math.max(
    1,
    Math.ceil(funcionesFiltradas.length / rowsPermisos),
  );
  const funcionesPagina = useMemo(() => {
    return funcionesFiltradas.slice(
      (pagePermisos - 1) * rowsPermisos,
      pagePermisos * rowsPermisos,
    );
  }, [funcionesFiltradas, pagePermisos, rowsPermisos]);

  const cargarRoles = async () => {
    setCargando(true);
    try {
      setRoles(await listarRoles());
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  useEffect(() => {
    setPagePermisos(1);
  }, [grupoActual?.id_usermenu, busquedaSubmenus]);

  const cargarDetalle = async (rol) => {
    setCargando(true);
    try {
      const [detalleData, catalogoData] = await Promise.all([
        detalleRol(rol.id_userrole),
        listarFuncionesDisponibles(),
      ]);
      setRolActual(rol);
      setDetalle(detalleData);
      setCatalogo(catalogoData);
      setMenuSeleccionado(
        (actual) => actual || catalogoData[0]?.id_usermenu || "",
      );
    } finally {
      setCargando(false);
    }
  };

  const abrirDetalle = async (rol) => {
    await cargarDetalle(rol);
    setModoDetalle(true);
    setModoFormulario(false);
  };

  const volverListado = () => {
    setModoDetalle(false);
    setModoFormulario(false);
    setRolActual(null);
    setDetalle({ funciones_agrupadas: [] });
    setBusquedaMenus("");
    setBusquedaSubmenus("");
    setMenuSeleccionado("");
    setPagePermisos(1);
  };

  const nuevo = () => {
    setEditando(null);
    setFormulario(inicial);
    setModoFormulario(true);
    setModoDetalle(false);
  };

  const editar = (rol) => {
    setEditando(rol);
    setFormulario({ role: rol.role, activo: Boolean(rol.activo) });
    setModoFormulario(true);
    setModoDetalle(false);
  };

  const guardar = async () => {
    try {
      await guardarRol(formulario, editando?.id_userrole);
      setMensaje(
        editando
          ? "Rol actualizado correctamente."
          : "Rol creado correctamente.",
      );
      setModoFormulario(false);
      await cargarRoles();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el rol."));
    }
  };

  const alternar = async (rol) => {
    await cambiarEstadoRol(rol.id_userrole, !rol.activo);
    setMensaje(!rol.activo ? "Rol activado." : "Rol inactivado.");
    await cargarRoles();
  };

  const alternarFuncion = async (funcion) => {
    try {
      if (codigosAsignados.has(funcion.id_menu)) {
        await quitarFuncionRol(rolActual.id_userrole, funcion.id_menu);
        setMensaje("Opción retirada correctamente.");
      } else {
        await asignarFuncionRol(rolActual.id_userrole, funcion.id_menu);
        setMensaje("Opción asignada correctamente.");
      }

      await cargarDetalle(rolActual);
    } catch (err) {
      setError(mensajeError(err, "No se pudo actualizar la asignación."));
    }
  };

  const alternarMenu = async (grupo) => {
    try {
      const algunaAsignada = grupo.funciones.some((funcion) =>
        codigosAsignados.has(funcion.id_menu),
      );
      const acciones = algunaAsignada
        ? grupo.funciones.map((funcion) =>
            quitarFuncionRol(rolActual.id_userrole, funcion.id_menu),
          )
        : grupo.funciones
            .filter((funcion) => !codigosAsignados.has(funcion.id_menu))
            .map((funcion) =>
              asignarFuncionRol(rolActual.id_userrole, funcion.id_menu),
            );

      await Promise.all(acciones);
      setMensaje(
        algunaAsignada
          ? "Opciones retiradas correctamente."
          : "Opciones asignadas correctamente.",
      );
      await cargarDetalle(rolActual);
    } catch (err) {
      setError(mensajeError(err, "No se pudo actualizar el menú."));
    }
  };

  const sincronizar = async () => {
    const confirmado = await confirmarAccion({
      titulo: "Actualizar permisos de usuarios",
      texto: `Se reemplazarán los permisos personalizados de los usuarios del rol ${rolActual.role} por la configuración actual del rol.`,
      textoConfirmar: "Sí, actualizar",
      icono: "warning",
    });
    if (!confirmado) return;

    const data = await sincronizarRol(rolActual.id_userrole);
    setMensaje(
      `Rol sincronizado con ${data.usuarios_sincronizados} usuario(s).`,
    );
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo={modoDetalle ? rolActual?.role || "Configurar rol" : "Roles"}
        descripcion={
          modoDetalle
            ? "Gestiona opciones asignadas al perfil."
            : "Administra perfiles de acceso y permisos base."
        }
        icono={<SecurityOutlinedIcon />}
        acciones={
          modoFormulario || modoDetalle ? (
            <BotonVolver
              onClick={
                modoDetalle ? volverListado : () => setModoFormulario(false)
              }
            />
          ) : null
        }
      />

      <Paper className="page-content-container" elevation={0}>
        {modoFormulario ? (
          <Paper elevation={0} sx={formStyles.seccion}>
            <Stack
              direction="row"
              sx={{
                mb: 2,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography fontWeight={900}>
                  {editando ? "Editar registro" : "Nuevo registro"}
                </Typography>
                <Typography
                  sx={{ fontSize: 12, color: uiTokens.colores.textoMedio }}
                >
                  Define el nombre y estado del perfil.
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 220px" },
                gap: 1.5,
              }}
            >
              <TextField
                label="Nombre"
                value={formulario.role}
                onChange={(e) =>
                  setFormulario({ ...formulario, role: e.target.value })
                }
              />
              <TextField
                select
                label="Estado"
                value={formulario.activo ? "1" : "0"}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    activo: e.target.value === "1",
                  })
                }
              >
                <MenuItem value="1">Activo</MenuItem>
                <MenuItem value="0">Inactivo</MenuItem>
              </TextField>
            </Box>
            <AccionesFormulario
              onCancelar={() => setModoFormulario(false)}
              onGuardar={guardar}
            />
          </Paper>
        ) : null}

        {!modoFormulario && !modoDetalle ? (
          <>
            <GestionToolbar
              total={rolesFiltrados.length}
              busqueda={busqueda}
              onBusqueda={(valor) => {
                setBusqueda(valor);
                setPage(1);
              }}
              acciones={
                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  sx={dbanuStyles.addButtonRevive}
                  onClick={nuevo}
                >
                  Añadir
                </Button>
              }
            />
            <TablaGestion
              total={roles.length}
              filtrados={rolesFiltrados.length}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              cargando={cargando}
              onRowsPerPageChange={(valor) => {
                setRowsPerPage(valor);
                setPage(1);
              }}
            >
              <TableHead>
                <TableRow>
                  <FilterHeaderCell
                    value={filtrosColumna.role}
                    options={opcionesFiltro.role}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, role: valor });
                      setPage(1);
                    }}
                  >
                    Rol
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.estado}
                    multiple
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, estado: valor });
                      setPage(1);
                    }}
                    options={opcionesFiltro.estado}
                    sx={{ width: 120 }}
                  >
                    Estado
                  </FilterHeaderCell>
                  <TableCell align="right" sx={{ width: 132 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rolesPagina.length ? (
                  rolesPagina.map((rol) => (
                    <TableRow key={rol.id_userrole} hover>
                      <TableCell sx={{ fontWeight: 800 }}>{rol.role}</TableCell>
                      <TableCell>
                        <EstadoToggleCell
                          activo={Boolean(rol.activo)}
                          onToggle={() => alternar(rol)}
                          confirmacion={{
                            titulo: rol.activo
                              ? "Inactivar rol"
                              : "Activar rol",
                            texto: rol.activo
                              ? `Se inactivará el rol ${rol.role} y se cerrarán las sesiones de sus usuarios.`
                              : `El rol ${rol.role} volverá a permitir el acceso de sus usuarios.`,
                            textoConfirmar: rol.activo
                              ? "Sí, inactivar"
                              : "Sí, activar",
                            icono: rol.activo ? "warning" : "question",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Configurar">
                          <IconButton
                            sx={dbanuStyles.actionView}
                            onClick={() => abrirDetalle(rol)}
                          >
                            <TuneOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            sx={dbanuStyles.actionEdit}
                            onClick={() => editar(rol)}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TablaEstadoFila
                    colSpan={3}
                    cargando={cargando}
                    texto="No existen roles por ahora."
                  />
                )}
              </TableBody>
            </TablaGestion>
          </>
        ) : null}

        {modoDetalle ? (
          <Stack spacing={2}>
            {catalogoFiltrado.length && grupoActual ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "280px minmax(0, 1fr)",
                  },
                  gap: 1.5,
                  alignItems: "stretch",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    ...tableStyles.panel,
                    height: { xs: "auto", lg: 520 },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack sx={tableStyles.panelHeader}>
                    <Box>
                      <Typography fontWeight={900}>Menús</Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: uiTokens.colores.textoMedio,
                        }}
                      >
                        {catalogoFiltrado.length} grupo(s)
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      px: 1,
                      py: 1,
                      borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
                    }}
                  >
                    <TextField
                      size="small"
                      label="Buscar"
                      value={busquedaMenus}
                      onChange={(evento) =>
                        setBusquedaMenus(evento.target.value)
                      }
                      sx={dbanuStyles.field}
                    />
                  </Box>
                  <Stack
                    spacing={0.5}
                    sx={{ p: 1, overflowY: "auto", flex: 1 }}
                  >
                    {catalogoFiltrado.map((grupo) => {
                      const activoGrupo = grupo.funciones.some((funcion) =>
                        codigosAsignados.has(funcion.id_menu),
                      );
                      const seleccionado =
                        String(grupo.id_usermenu) ===
                        String(grupoActual.id_usermenu);

                      return (
                        <Box
                          key={grupo.id_usermenu}
                          role="button"
                          tabIndex={0}
                          onClick={() => setMenuSeleccionado(grupo.id_usermenu)}
                          onKeyDown={(evento) => {
                            if (evento.key === "Enter" || evento.key === " ")
                              setMenuSeleccionado(grupo.id_usermenu);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            minHeight: 44,
                            px: 1.2,
                            borderRadius: 0.5,
                            textTransform: "none",
                            fontWeight: seleccionado ? 900 : 800,
                            color: seleccionado
                              ? uiTokens.colores.primario
                              : uiTokens.colores.textoFuerte,
                            bgcolor: seleccionado
                              ? uiTokens.colores.primarioSuave
                              : "#fff",
                            border: `1px solid ${seleccionado ? uiTokens.colores.primario : uiTokens.colores.bordeSuave}`,
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: uiTokens.colores.primarioSuave,
                              borderColor: uiTokens.colores.primario,
                            },
                          }}
                        >
                          <span>{grupo.menu}</span>
                          <EstadoToggleCell
                            activo={activoGrupo}
                            tituloActivo="Quitar menú"
                            tituloInactivo="Asignar menú"
                            onToggle={() => alternarMenu(grupo)}
                            confirmacion={{
                              titulo: activoGrupo
                                ? "Quitar opciones del menú"
                                : "Asignar menú al rol",
                              texto: activoGrupo
                                ? `Se retirarán las opciones de ${grupo.menu}.`
                                : `Se asignarán las opciones de ${grupo.menu}.`,
                              textoConfirmar: activoGrupo
                                ? "Sí, quitar"
                                : "Sí, asignar",
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    ...tableStyles.panel,
                    height: { xs: "auto", lg: 520 },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.2}
                    sx={{
                      ...tableStyles.panelHeader,
                      justifyContent: "space-between",
                      alignItems: { xs: "stretch", md: "center" },
                    }}
                  >
                    <Box>
                      <Typography fontWeight={900}>
                        {grupoActual.menu}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: uiTokens.colores.textoMedio,
                        }}
                      >
                        {funcionesFiltradas.length} opción(es)
                      </Typography>
                    </Box>
                    <Tooltip title="Aplica la configuración actual del rol a todos sus usuarios.">
                      <span>
                        <Button
                          variant="outlined"
                          startIcon={<RestartAltOutlinedIcon />}
                          sx={dbanuStyles.backButton}
                          disabled={!rolActual}
                          onClick={sincronizar}
                        >
                          Actualizar usuarios
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 1,
                      borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
                    }}
                  >
                    <TextField
                      size="small"
                      label="Buscar"
                      value={busquedaSubmenus}
                      onChange={(evento) =>
                        setBusquedaSubmenus(evento.target.value)
                      }
                      sx={{
                        ...dbanuStyles.field,
                        width: { xs: "100%", md: 260 },
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 1.2, pt: 1, flex: 1, minHeight: 0 }}>
                    <TablaGestion
                      total={grupoActual.funciones.length}
                      filtrados={funcionesFiltradas.length}
                      page={pagePermisos}
                      totalPages={totalPermisosPages}
                      onPageChange={setPagePermisos}
                      rowsPerPage={rowsPermisos}
                      cargando={cargando}
                      onRowsPerPageChange={(valor) => {
                        setRowsPermisos(valor);
                        setPagePermisos(1);
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Opción</TableCell>
                          <TableCell>Código</TableCell>
                          <TableCell align="center">Asignado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {funcionesPagina.length ? (
                          funcionesPagina.map((funcion) => {
                            const asignado = codigosAsignados.has(
                              funcion.id_menu,
                            );

                            return (
                              <TableRow key={funcion.id_menu} hover>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ alignItems: "center" }}
                                  >
                                    <IconoMaterial nombre={funcion.icono} />{" "}
                                    <span>{funcion.nombre}</span>
                                  </Stack>
                                </TableCell>
                                <TableCell>{funcion.id_menu}</TableCell>
                                <TableCell align="center">
                                  <EstadoToggleCell
                                    activo={asignado}
                                    tituloActivo="Quitar opción"
                                    tituloInactivo="Asignar opción"
                                    onToggle={() => alternarFuncion(funcion)}
                                    confirmacion={{
                                      titulo: asignado
                                        ? "Quitar opción del rol"
                                        : "Asignar opción al rol",
                                      texto: asignado
                                        ? `Se retirará ${funcion.nombre}.`
                                        : `Se asignará ${funcion.nombre}.`,
                                      textoConfirmar: asignado
                                        ? "Sí, quitar"
                                        : "Sí, asignar",
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TablaEstadoFila
                            colSpan={3}
                            cargando={cargando}
                            texto="No existen opciones por ahora."
                          />
                        )}
                      </TableBody>
                    </TablaGestion>
                  </Box>
                </Paper>
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{ ...formStyles.seccion, textAlign: "center", py: 6 }}
              >
                {cargando ? (
                  <LoadingState />
                ) : (
                  <Typography
                    sx={{ fontWeight: 900, color: uiTokens.colores.textoMedio }}
                  >
                    No existen registros por ahora.
                  </Typography>
                )}
              </Paper>
            )}
          </Stack>
        ) : null}
      </Paper>

      <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje("")} />
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError("")} />
    </Box>
  );
}
