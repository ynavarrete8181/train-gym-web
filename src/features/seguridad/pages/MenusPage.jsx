import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
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
import { IconoSelectorDialog } from "../../../components/common/IconoSelectorDialog.jsx";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { NotificacionSnackbar } from "../../../components/common/NotificacionSnackbar.jsx";
import { AccionesFormulario } from "../../../components/common/AccionesFormulario.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { FilterHeaderCell } from "../../../components/tables/FilterHeaderCell.jsx";
import { GestionToolbar } from "../../../components/tables/GestionToolbar.jsx";
import { EstadoToggleCell } from "../../../components/tables/EstadoToggleCell.jsx";
import { OrdenCell } from "../../../components/tables/OrdenCell.jsx";
import { TablaEstadoFila } from "../../../components/tables/TablaEstadoFila.jsx";
import { TablaGestion } from "../../../components/tables/TablaGestion.jsx";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { formStyles } from "../../../styles/formStyles.js";
import { uiTokens } from "../../../styles/uiTokens.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import {
  cambiarEstadoMenu,
  eliminarMenu,
  guardarMenu,
  listarMenus,
  moverMenu,
} from "../services/rolPermisoService.js";

const inicial = { menu: "", icono: "view_sidebar", activo: true };

function mensajeError(error, fallback) {
  return (
    error.response?.data?.mensaje ||
    Object.values(error.response?.data?.errores || {})
      .flat()
      .find(Boolean) ||
    fallback
  );
}

export function MenusPage() {
  const [menus, setMenus] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(false);
  const [selectorIcono, setSelectorIcono] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrosColumna, setFiltrosColumna] = useState({
    menu: [], icono: [], orden: [], estado: [],
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const menusFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return menus.filter((menu) => {
      const estado = menu.activo ? "activo" : "inactivo";
      const coincideGlobal =
        !texto ||
        [menu.menu, menu.icono, menu.orden, estado]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincide = (seleccion, valor) => !seleccion.length || seleccion.includes(String(valor || ""));
      const coincideMenu = coincide(filtrosColumna.menu, menu.menu);
      const coincideIcono = coincide(filtrosColumna.icono, menu.icono);
      const coincideOrden = coincide(filtrosColumna.orden, menu.orden);
      const coincideEstado = coincide(filtrosColumna.estado, estado);
      return (
        coincideGlobal &&
        coincideMenu &&
        coincideIcono &&
        coincideOrden &&
        coincideEstado
      );
    });
  }, [busqueda, filtrosColumna, menus]);
  const opcionesFiltro = useMemo(() => {
    const crear = (valores) => [...new Set(valores.map(String))].sort((a, b) => a.localeCompare(b, "es")).map((valor) => ({ value: valor, label: valor }));
    return { menu: crear(menus.map((m) => m.menu)), icono: crear(menus.map((m) => m.icono || "")), orden: crear(menus.map((m) => m.orden)), estado: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] };
  }, [menus]);
  const totalPages = Math.max(
    1,
    Math.ceil(menusFiltrados.length / rowsPerPage),
  );
  const menusPagina = useMemo(
    () => menusFiltrados.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [menusFiltrados, page, rowsPerPage],
  );
  const menusOrdenados = useMemo(
    () =>
      [...menus].sort(
        (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0),
      ),
    [menus],
  );

  const cargar = async () => {
    setCargando(true);
    try {
      setMenus(await listarMenus());
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const nuevo = () => {
    setEditando(null);
    setFormulario(inicial);
    setModoFormulario(true);
  };

  const editar = (menu) => {
    setEditando(menu);
    setFormulario({
      menu: menu.menu,
      icono: menu.icono || "view_sidebar",
      activo: Boolean(menu.activo),
    });
    setModoFormulario(true);
  };

  const guardar = async () => {
    try {
      await guardarMenu(formulario, editando?.id_usermenu);
      setMensaje(
        editando
          ? "Menú actualizado correctamente."
          : "Menú creado correctamente.",
      );
      setModoFormulario(false);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el menú."));
    }
  };

  const alternar = async (menu) => {
    await cambiarEstadoMenu(menu.id_usermenu, !menu.activo);
    setMensaje(!menu.activo ? "Menú activado." : "Menú inactivado.");
    await cargar();
  };

  const eliminar = async (menu) => {
    const confirmado = await confirmarAccion({
      titulo: "Eliminar menú",
      texto: `¿Deseas eliminar "${menu.menu}"? Solo será posible si no tiene submenús asociados.`,
      textoConfirmar: "Sí, eliminar",
      icono: "warning",
    });
    if (!confirmado) return;

    try {
      await eliminarMenu(menu.id_usermenu);
      setMensaje("Menú eliminado correctamente.");
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo eliminar el menú."));
    }
  };

  const moverOrden = async (menu, direccion) => {
    try {
      await moverMenu(menu.id_usermenu, direccion);
      setMensaje(
        direccion === "arriba"
          ? "Menú movido hacia arriba."
          : "Menú movido hacia abajo.",
      );
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo actualizar el orden del menú."));
    }
  };

  const puedeMover = (menu, direccion) => {
    const indice = menusOrdenados.findIndex(
      (item) => String(item.id_usermenu) === String(menu.id_usermenu),
    );
    if (indice < 0) return false;
    return direccion === "arriba"
      ? indice > 0
      : indice < menusOrdenados.length - 1;
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Menús"
        descripcion="Organiza los grupos principales de navegación."
        icono={<ViewSidebarOutlinedIcon />}
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
                  Define el nombre, ícono y estado visible en la navegación.
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr 0.7fr" },
                gap: 1.5,
              }}
            >
              <TextField
                label="Nombre"
                value={formulario.menu}
                onChange={(e) =>
                  setFormulario({ ...formulario, menu: e.target.value })
                }
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
                onChange={(e) =>
                  setFormulario({ ...formulario, icono: e.target.value })
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
        ) : (
          <>
            <GestionToolbar
              total={menusFiltrados.length}
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
              total={menus.length}
              filtrados={menusFiltrados.length}
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
                    value={filtrosColumna.menu}
                    options={opcionesFiltro.menu}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, menu: valor });
                      setPage(1);
                    }}
                  >
                    Menú
                  </FilterHeaderCell>
                  <FilterHeaderCell
                    value={filtrosColumna.icono}
                    options={opcionesFiltro.icono}
                    onChange={(valor) => {
                      setFiltrosColumna({ ...filtrosColumna, icono: valor });
                      setPage(1);
                    }}
                  >
                    Ícono
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
                    multiple
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
                {menusPagina.length ? (
                  menusPagina.map((menu) => (
                    <TableRow key={menu.id_usermenu} hover>
                      <TableCell>{menu.menu}</TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <IconoMaterial nombre={menu.icono} />{" "}
                          <span>{menu.icono}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <OrdenCell
                          orden={menu.orden}
                          puedeSubir={puedeMover(menu, "arriba")}
                          puedeBajar={puedeMover(menu, "abajo")}
                          onSubir={() => moverOrden(menu, "arriba")}
                          onBajar={() => moverOrden(menu, "abajo")}
                        />
                      </TableCell>
                      <TableCell>
                        <EstadoToggleCell
                          activo={Boolean(menu.activo)}
                          onToggle={() => alternar(menu)}
                          confirmacion={{
                            titulo: menu.activo
                              ? "Inactivar menú"
                              : "Activar menú",
                            texto: menu.activo
                              ? `El menú ${menu.menu} dejará de mostrarse junto con sus opciones.`
                              : `El menú ${menu.menu} volverá a estar disponible.`,
                            textoConfirmar: menu.activo
                              ? "Sí, inactivar"
                              : "Sí, activar",
                            icono: menu.activo ? "warning" : "question",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Editar">
                          <IconButton
                            sx={dbanuStyles.actionEdit}
                            onClick={() => editar(menu)}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            sx={dbanuStyles.actionDelete}
                            onClick={() => eliminar(menu)}
                          >
                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TablaEstadoFila
                    colSpan={5}
                    cargando={cargando}
                    texto="No existen menús por ahora."
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
