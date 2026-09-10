import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { NotificacionSnackbar } from "../../../components/common/NotificacionSnackbar.jsx";
import { IconoSelectorDialog } from "../../../components/common/IconoSelectorDialog.jsx";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { EstadoToggleCell } from "../../../components/tables/EstadoToggleCell.jsx";
import { FilterHeaderCell } from "../../../components/tables/FilterHeaderCell.jsx";
import { GestionToolbar } from "../../../components/tables/GestionToolbar.jsx";
import { OrdenCell } from "../../../components/tables/OrdenCell.jsx";
import { TablaEstadoFila } from "../../../components/tables/TablaEstadoFila.jsx";
import { TablaGestion } from "../../../components/tables/TablaGestion.jsx";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { formStyles } from "../../../styles/formStyles.js";
import { uiTokens } from "../../../styles/uiTokens.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import {
  cambiarEstadoFuncion,
  detalleRol,
  eliminarFuncionRol,
  guardarFuncionRol,
  listarMenus,
  listarRoles,
  moverFuncionRol,
} from "../services/rolPermisoService.js";

const inicial = {
  id_userroles: [],
  id_usermenu: "",
  nombre: "",
  icono: "account_tree",
  activo: true,
};

function mensajeError(error, fallback) {
  return (
    error.response?.data?.mensaje ||
    Object.values(error.response?.data?.errores || {})
      .flat()
      .find(Boolean) ||
    fallback
  );
}

export function SubmenusPage() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [submenus, setSubmenus] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(false);
  const [selectorIcono, setSelectorIcono] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrosColumna, setFiltrosColumna] = useState({
    nombre: [], menu: [], rol: [], codigo: [], orden: [], estado: [],
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const rolesSeleccionados = roles.filter((rol) =>
    formulario.id_userroles.map(String).includes(String(rol.id_userrole)),
  );
  const submenusFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return submenus.filter((submenu) => {
      const estado = submenu.activo ? "activo" : "inactivo";
      const coincide = (seleccion, valor) => !seleccion.length || seleccion.includes(String(valor || ""));
      const coincideMenu = coincide(filtrosColumna.menu, submenu.id_usermenu);
      const coincideTexto =
        !texto ||
        [
          submenu.nombre,
          submenu.menu,
          submenu.role,
          submenu.id_menu,
          submenu.accion,
          submenu.icono,
          submenu.activo ? "activo" : "inactivo",
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideNombre = coincide(filtrosColumna.nombre, submenu.nombre);
      const coincideRol = coincide(filtrosColumna.rol, submenu.role);
      const coincideCodigo = coincide(filtrosColumna.codigo, submenu.id_menu);
      const coincideOrden = coincide(filtrosColumna.orden, submenu.orden);
      const coincideEstado = coincide(filtrosColumna.estado, estado);
      return (
        coincideMenu &&
        coincideTexto &&
        coincideNombre &&
        coincideRol &&
        coincideCodigo &&
        coincideOrden &&
        coincideEstado
      );
    });
  }, [busqueda, filtrosColumna, submenus]);
  const opcionesFiltro = useMemo(() => {
    const crear = (valores) => [...new Set(valores.map((v) => String(v || "")))].filter(Boolean).sort((a, b) => a.localeCompare(b, "es")).map((v) => ({ value: v, label: v }));
    return { nombre: crear(submenus.map((s) => s.nombre)), menu: menus.map((m) => ({ value: String(m.id_usermenu), label: m.menu })), rol: crear(submenus.map((s) => s.role)), codigo: crear(submenus.map((s) => s.id_menu)), orden: crear(submenus.map((s) => s.orden)), estado: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] };
  }, [submenus, menus]);
  const totalPages = Math.max(
    1,
    Math.ceil(submenusFiltrados.length / rowsPerPage),
  );
  const submenusPagina = useMemo(
    () => submenusFiltrados.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [page, rowsPerPage, submenusFiltrados],
  );

  const cargar = async () => {
    setCargando(true);
    try {
      const [rolesData, menusData] = await Promise.all([
        listarRoles(),
        listarMenus(),
      ]);
      const detalles = await Promise.all(
        rolesData.map((rol) => detalleRol(rol.id_userrole)),
      );
      setRoles(rolesData);
      setMenus(menusData);
      setSubmenus(
        detalles.flatMap((detalle) =>
          detalle.funciones.map((funcion) => ({
            ...funcion,
            role: detalle.rol?.role,
          })),
        ),
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const nuevo = () => {
    const primerMenu = menus[0]?.id_usermenu || "";
    setEditando(null);
    setFormulario({
      ...inicial,
      id_usermenu: primerMenu,
      id_userroles: roles[0]?.id_userrole ? [roles[0].id_userrole] : [],
    });
    setModoFormulario(true);
  };

  const editar = (submenu) => {
    setEditando(submenu);
    setFormulario({
      id_userroles: [submenu.id_userrole],
      id_usermenu: submenu.id_usermenu,
      nombre: submenu.nombre,
      icono: submenu.icono || "account_tree",
      activo: Boolean(submenu.activo),
    });
    setModoFormulario(true);
  };

  const cambiar = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardar = async () => {
    try {
      const payload = editando
        ? { ...formulario, id_userrole: editando.id_userrole }
        : formulario;
      await guardarFuncionRol(payload, editando?.id_userrf);
      setMensaje(
        editando
          ? "Submenú actualizado correctamente."
          : "Submenú creado correctamente.",
      );
      setModoFormulario(false);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el submenú."));
    }
  };

  const alternar = async (submenu) => {
    await cambiarEstadoFuncion(submenu.id_userrf, !submenu.activo);
    setMensaje(!submenu.activo ? "Submenú activado." : "Submenú inactivado.");
    await cargar();
  };

  const eliminar = async (submenu) => {
    const confirmado = await confirmarAccion({
      titulo: "Eliminar submenú",
      texto: `¿Deseas eliminar "${submenu.nombre}"? Solo será posible si no está asignado a usuarios.`,
      textoConfirmar: "Sí, eliminar",
      icono: "warning",
    });
    if (!confirmado) return;

    try {
      await eliminarFuncionRol(submenu.id_userrf);
      setMensaje("Submenú eliminado correctamente.");
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo eliminar el submenú."));
    }
  };

  const moverOrden = async (submenu, direccion) => {
    try {
      await moverFuncionRol(submenu.id_userrf, direccion);
      setMensaje(
        direccion === "arriba"
          ? "Submenú movido hacia arriba."
          : "Submenú movido hacia abajo.",
      );
      await cargar();
    } catch (err) {
      setError(
        mensajeError(err, "No se pudo actualizar el orden del submenú."),
      );
    }
  };

  const obtenerGrupoOrden = (submenu) =>
    submenus
      .filter(
        (item) =>
          String(item.id_userrole) === String(submenu.id_userrole) &&
          String(item.id_usermenu) === String(submenu.id_usermenu),
      )
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  const puedeMover = (submenu, direccion) => {
    const grupo = obtenerGrupoOrden(submenu);
    const indice = grupo.findIndex(
      (item) => String(item.id_userrf) === String(submenu.id_userrf),
    );
    if (indice < 0) return false;
    return direccion === "arriba" ? indice > 0 : indice < grupo.length - 1;
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Submenús"
        descripcion="Asigna accesos de navegación a los roles."
        icono={<AccountTreeOutlinedIcon />}
        acciones={
          modoFormulario ? (
            <BotonVolver onClick={() => setModoFormulario(false)} />
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
                  Selecciona el destino, define el nombre y configura su estado.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {!editando ? (
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={roles}
                  value={rolesSeleccionados}
                  getOptionLabel={(option) => option.role || ""}
                  isOptionEqualToValue={(option, value) =>
                    String(option.id_userrole) === String(value.id_userrole)
                  }
                  onChange={(_, seleccionados) =>
                    cambiar(
                      "id_userroles",
                      seleccionados.map((rol) => rol.id_userrole),
                    )
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox size="small" checked={selected} />
                      {option.role}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Roles destino" />
                  )}
                  sx={{ gridColumn: { md: "1 / -1" } }}
                />
              ) : null}
              <TextField
                select
                label="Menú principal"
                value={formulario.id_usermenu}
                onChange={(e) => cambiar("id_usermenu", e.target.value)}
              >
                {menus.map((menu) => (
                  <MenuItem key={menu.id_usermenu} value={menu.id_usermenu}>
                    {menu.menu}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Nombre"
                value={formulario.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
              />
              <TextField
                label="Ícono"
                value={formulario.icono}
                slotProps={{
                  input: {
                    startAdornment: (
                      <IconoMaterial
                        nombre={formulario.icono}
                        sx={{ mr: 1, color: uiTokens.colores.primario }}
                      />
                    ),
                  },
                }}
                onClick={() => setSelectorIcono(true)}
                onChange={(e) => cambiar("icono", e.target.value)}
              />
              <TextField
                select
                label="Estado"
                value={formulario.activo ? "1" : "0"}
                onChange={(e) => cambiar("activo", e.target.value === "1")}
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
        ) : (
          <>
            <GestionToolbar
              total={submenusFiltrados.length}
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
              total={submenus.length}
              filtrados={submenusFiltrados.length}
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
                    value={filtrosColumna.nombre}
                    options={opcionesFiltro.nombre}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, nombre: valor });
                      setPage(1);
                    }}
                  >
                    Submenú
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.menu}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, menu: valor });
                      setPage(1);
                    }}
                    options={opcionesFiltro.menu}
                  >
                    Menú
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.rol}
                    options={opcionesFiltro.rol}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, rol: valor });
                      setPage(1);
                    }}
                  >
                    Rol
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.codigo}
                    options={opcionesFiltro.codigo}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, codigo: valor });
                      setPage(1);
                    }}
                  >
                    Código
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.orden}
                    options={opcionesFiltro.orden}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, orden: valor });
                      setPage(1);
                    }}
                  >
                    Orden
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.estado}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, estado: valor });
                      setPage(1);
                    }}
                    options={opcionesFiltro.estado}
                  >
                    Estado
                  </FilterHeaderCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submenusPagina.length ? (
                  submenusPagina.map((submenu) => (
                    <TableRow key={submenu.id_userrf} hover>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <IconoMaterial nombre={submenu.icono} />{" "}
                          <span>{submenu.nombre}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>{submenu.menu}</TableCell>
                      <TableCell>{submenu.role}</TableCell>
                      <TableCell>{submenu.id_menu}</TableCell>
                      <TableCell align="center">
                        <OrdenCell
                          orden={submenu.orden}
                          puedeSubir={puedeMover(submenu, "arriba")}
                          puedeBajar={puedeMover(submenu, "abajo")}
                          onSubir={() => moverOrden(submenu, "arriba")}
                          onBajar={() => moverOrden(submenu, "abajo")}
                        />
                      </TableCell>
                      <TableCell>
                        <EstadoToggleCell
                          activo={Boolean(submenu.activo)}
                          onToggle={() => alternar(submenu)}
                          confirmacion={{
                            titulo: submenu.activo
                              ? "Inactivar submenú"
                              : "Activar submenú",
                            texto: submenu.activo
                              ? `${submenu.nombre} dejará de estar disponible para el rol ${submenu.role}.`
                              : `${submenu.nombre} volverá a estar disponible para el rol ${submenu.role}.`,
                            textoConfirmar: submenu.activo
                              ? "Sí, inactivar"
                              : "Sí, activar",
                            icono: submenu.activo ? "warning" : "question",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Editar">
                          <IconButton
                            sx={dbanuStyles.actionEdit}
                            onClick={() => editar(submenu)}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            sx={dbanuStyles.actionDelete}
                            onClick={() => eliminar(submenu)}
                          >
                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TablaEstadoFila
                    colSpan={7}
                    cargando={cargando}
                    texto="No existen opciones por ahora."
                  />
                )}
              </TableBody>
            </TablaGestion>
          </>
        )}
      </Paper>

      <IconoSelectorDialog
        open={selectorIcono}
        valor={formulario.icono}
        onClose={() => setSelectorIcono(false)}
        onSeleccionar={(icono) => {
          setFormulario({ ...formulario, icono });
          setSelectorIcono(false);
        }}
      />
      <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje("")} />
      <NotificacionSnackbar mensaje={error} tipo="error" onClose={() => setError("")} />
    </Box>
  );
}
