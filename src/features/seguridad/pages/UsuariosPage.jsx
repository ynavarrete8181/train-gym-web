import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import { Box, Button, Paper, Stack } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { NotificacionSnackbar } from "../../../components/common/NotificacionSnackbar.jsx";
import { GestionToolbar } from "../../../components/tables/GestionToolbar.jsx";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import { UsuarioForm } from "../components/UsuarioForm.jsx";
import { UsuarioDetalle } from "../components/UsuarioDetalle.jsx";
import { CargaMasivaUsuariosPage } from "./CargaMasivaUsuariosPage.jsx";
import { UsuariosTable } from "../components/UsuariosTable.jsx";
import {
  actualizarUsuario,
  restablecerClaveUsuario,
  cambiarEstadoUsuario,
  crearUsuario,
  listarFuncionesDisponibles,
  listarFuncionesRol,
  listarFuncionesUsuario,
  listarRoles,
  listarUsuarios,
  obtenerUsuario,
} from "../services/usuarioService.js";
import { listarEstructura } from "../../institucional/services/estructuraInstitucionalService.js";

const filtrosIniciales = {
  busqueda: "",
  usuario: [], correo: [], cedula: [], rol: [], estado: [],
  page: 1,
  per_page: 5,
};
const filtrosColumnaIniciales = {
  usuario: [], correo: [], cedula: [], rol: [], estado: [],
};
const metaInicial = {
  pagina_actual: 1,
  por_pagina: 5,
  total: 0,
  ultima_pagina: 1,
  opciones_filtro: { usuario: [], correo: [], cedula: [] },
};

function obtenerMensajeError(error, fallback) {
  const data = error.response?.data;
  const primerError =
    data?.errores && Object.values(data.errores).flat().find(Boolean);
  return primerError || data?.mensaje || fallback;
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [estructura, setEstructura] = useState({
    sedes: [],
    unidades: [],
    carreras_areas: [],
    contextos: [],
  });
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [filtrosColumna, setFiltrosColumna] = useState(filtrosColumnaIniciales);
  const [meta, setMeta] = useState(metaInicial);
  const [cargando, setCargando] = useState(false);
  const [dialogoUsuario, setDialogoUsuario] = useState({
    abierto: false,
    usuario: null,
  });
  const [detalleUsuario, setDetalleUsuario] = useState(null);
  const [gruposFunciones, setGruposFunciones] = useState([]);
  const [funcionesRolBase, setFuncionesRolBase] = useState([]);
  const [funcionesSeleccionadas, setFuncionesSeleccionadas] = useState([]);
  const [errorDialogo, setErrorDialogo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formularioModificado, setFormularioModificado] = useState(false);
  const [permisosModificados, setPermisosModificados] = useState(false);
  const hayCambios = formularioModificado || permisosModificados;
  const [modoCargaMasiva, setModoCargaMasiva] = useState(false);
  const marcarFormularioModificado = useCallback(
    (modificado) => setFormularioModificado(modificado),
    [],
  );

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (!dialogoUsuario.abierto || !hayCambios) return undefined;

    const prevenirSalida = (evento) => {
      evento.preventDefault();
      evento.returnValue = "";
    };

    window.addEventListener("beforeunload", prevenirSalida);
    return () => window.removeEventListener("beforeunload", prevenirSalida);
  }, [dialogoUsuario.abierto, hayCambios]);

  const cargarCatalogos = async () => {
    const [rolesData, estructura] = await Promise.all([
      listarRoles(),
      listarEstructura(),
    ]);
    setRoles(rolesData);
    setEstructura(estructura);
    await cargarUsuarios(filtrosIniciales);
  };

  const cargarUsuarios = async (parametros = filtros) => {
    setCargando(true);
    try {
      const respuesta = await listarUsuarios(parametros);
      setUsuarios(respuesta.datos);
      setMeta(respuesta.meta);
    } finally {
      setCargando(false);
    }
  };

  const buscar = (parametros = filtros) => {
    const nuevosFiltros = { ...parametros, page: 1 };
    setFiltros(nuevosFiltros);
    cargarUsuarios(nuevosFiltros);
  };

  const abrirNuevo = async () => {
    setErrorDialogo("");
    setFormularioModificado(false);
    setPermisosModificados(false);
    setCargando(true);
    try {
      await cargarFuncionesNuevo(roles[0]?.id_userrole);
      setDialogoUsuario({ abierto: true, usuario: null });
    } catch (error) {
      setMensaje(obtenerMensajeError(error, "No se pudieron cargar los permisos disponibles."));
    } finally {
      setCargando(false);
    }
  };

  const abrirEditar = async (usuario) => {
    setErrorDialogo("");
    setFormularioModificado(false);
    setPermisosModificados(false);
    setCargando(true);
    try {
      const [detalle, estructuraActualizada, datosFunciones] = await Promise.all([
        obtenerUsuario(usuario.id),
        listarEstructura(),
        obtenerFuncionesEdicion(usuario),
      ]);
      setEstructura(estructuraActualizada);
      aplicarFunciones(datosFunciones);
      setDialogoUsuario({
        abierto: true,
        usuario: {
          ...usuario,
          ...(detalle.usuario || {}),
          contextos: (detalle.contextos || []).map(Number),
        },
      });
    } catch (error) {
      setMensaje(obtenerMensajeError(error, "No se pudieron cargar los datos y permisos del usuario."));
    } finally {
      setCargando(false);
    }
  };
  const abrirDetalleUsuario = async (usuario) => {
    const [detalle, estructuraActualizada] = await Promise.all([obtenerUsuario(usuario.id), listarEstructura()]);
    setEstructura(estructuraActualizada);
    setDetalleUsuario({ ...detalle, usuario: { ...usuario, ...(detalle.usuario || {}) } });
  };

  const cargarFuncionesPorRol = async (idRol) => {
    if (esRolDeportista(idRol, roles)) {
      setFuncionesRolBase([]);
      setFuncionesSeleccionadas([]);
      setPermisosModificados(true);
      return;
    }

    const gruposRol = await listarFuncionesRol(idRol);
    const codigosRol = obtenerCodigos(gruposRol);
    setFuncionesRolBase(codigosRol);
    setFuncionesSeleccionadas(codigosRol);
    setPermisosModificados(true);
  };

  const obtenerFuncionesEdicion = async (usuario) => {
    const esDeportista = esRolDeportista(usuario.usr_tipo, roles);
    const [grupos, gruposRol, funcionesUsuario] = await Promise.all([
      listarFuncionesDisponibles(),
      usuario.usr_tipo && !esDeportista
        ? listarFuncionesRol(usuario.usr_tipo)
        : Promise.resolve([]),
      esDeportista ? Promise.resolve([]) : listarFuncionesUsuario(usuario.id),
    ]);
    return { grupos, gruposRol, funcionesUsuario };
  };

  const aplicarFunciones = ({ grupos, gruposRol, funcionesUsuario }) => {
    setGruposFunciones(grupos);
    setFuncionesRolBase(obtenerCodigos(gruposRol));
    setFuncionesSeleccionadas(obtenerCodigosUnicos(funcionesUsuario));
  };

  const cargarFuncionesNuevo = async (idRol) => {
    const [gruposDisponibles, gruposRol] = await Promise.all([
      listarFuncionesDisponibles(),
      idRol ? listarFuncionesRol(idRol) : Promise.resolve([]),
    ]);

    setGruposFunciones(gruposDisponibles);
    const codigosRol = obtenerCodigos(gruposRol);
    setFuncionesRolBase(codigosRol);
    setFuncionesSeleccionadas(codigosRol);
  };

  const guardarUsuario = async (formulario) => {
    setCargando(true);
    setErrorDialogo("");

    try {
      const payload = {
        ...formulario,
        usr_tipo: Number(formulario.usr_tipo),
        usr_estado: Number(formulario.usr_estado),
        funciones: funcionesSeleccionadas,
      };

      if (dialogoUsuario.usuario) {
        if (!payload.password) delete payload.password;
        await actualizarUsuario(dialogoUsuario.usuario.id, payload);
        setMensaje("Usuario actualizado correctamente.");
      } else {
        await crearUsuario(payload);
        setMensaje("Usuario creado correctamente.");
      }

      setDialogoUsuario({ abierto: false, usuario: null });
      setFormularioModificado(false);
      setPermisosModificados(false);
      await cargarUsuarios();
    } catch (error) {
      setErrorDialogo(
        obtenerMensajeError(error, "No se pudo guardar el usuario."),
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (usuario) => {
    const nuevoEstado = Number(usuario.usr_estado) === 1 ? 0 : 1;
    setCargando(true);
    try {
      await cambiarEstadoUsuario(usuario.id, nuevoEstado);
      setMensaje(
        nuevoEstado === 1
          ? "Usuario activado correctamente."
          : "Usuario inactivado correctamente.",
      );
      await cargarUsuarios();
    } finally {
      setCargando(false);
    }
  };

  const restablecerClave = async (usuario) => {
    const confirmado = await confirmarAccion({
      titulo: "Restablecer contraseña",
      texto: `Se enviará a ${usuario.email} un enlace seguro para crear una nueva contraseña.`,
      textoConfirmar: "Sí, enviar",
      icono: "warning",
    });
    if (!confirmado) return;

    setCargando(true);
    setErrorDialogo("");
    try {
      await restablecerClaveUsuario(usuario.id);
      setMensaje("Correo de restablecimiento programado correctamente.");
    } catch (error) {
      setErrorDialogo(
        obtenerMensajeError(error, "No se pudo solicitar el restablecimiento."),
      );
    } finally {
      setCargando(false);
    }
  };

  const alternarFuncion = (codigo) => {
    setPermisosModificados(true);
    setFuncionesSeleccionadas((actual) =>
      actual.includes(codigo)
        ? actual.filter((item) => item !== codigo)
        : [...actual, codigo],
    );
  };

  const restaurarFuncionesRol = async (idRol) => {
    if (!idRol) return;

    await cargarFuncionesPorRol(idRol);
  };

  const cambiarFiltroColumna = (campo, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [campo]: valor };
    setFiltrosColumna(nuevosFiltrosColumna);

    const nuevosFiltros = {
      ...filtros,
      usuario: nuevosFiltrosColumna.usuario,
      correo: nuevosFiltrosColumna.correo,
      cedula: nuevosFiltrosColumna.cedula,
      rol: nuevosFiltrosColumna.rol,
      estado: nuevosFiltrosColumna.estado,
      page: 1,
    };

    setFiltros(nuevosFiltros);
    cargarUsuarios(nuevosFiltros);
  };

  const volverListado = async () => {
    if (hayCambios) {
      const confirmado = await confirmarAccion({
        titulo: "Salir sin guardar",
        texto:
          "Tienes cambios sin guardar. Si vuelves al listado, se perderán.",
        textoConfirmar: "Sí, salir",
        textoCancelar: "Continuar editando",
        icono: "warning",
      });
      if (!confirmado) return;
    }

    setFormularioModificado(false);
    setPermisosModificados(false);
    setDialogoUsuario({ abierto: false, usuario: null });
  };

  if (detalleUsuario) {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={detalleUsuario.usuario?.name || "Detalle del usuario"}
          descripcion="Consulta la información, asignaciones operativas y permisos asignados."
          icono={<ManageAccountsOutlinedIcon />}
          acciones={<BotonVolver texto="Volver a usuarios" onClick={() => setDetalleUsuario(null)} />}
        />
        <UsuarioDetalle detalle={detalleUsuario} estructura={estructura} />
      </Box>
    );
  }

  if (dialogoUsuario.abierto) {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={dialogoUsuario.usuario ? "Editar usuario" : "Nuevo usuario"}
          descripcion={
            dialogoUsuario.usuario
              ? "Actualiza la información, el rol y los permisos asignados."
              : "Registra la información de acceso y configura los permisos iniciales."
          }
          icono={<ManageAccountsOutlinedIcon />}
          acciones={<BotonVolver onClick={volverListado} />}
        />

        <UsuarioForm
          usuario={dialogoUsuario.usuario}
          roles={roles}
          estructura={estructura}
          gruposFunciones={gruposFunciones}
          funcionesRolBase={funcionesRolBase}
          funcionesSeleccionadas={funcionesSeleccionadas}
          cargando={cargando}
          error={errorDialogo}
          onGuardar={guardarUsuario}
          onToggleFuncion={alternarFuncion}
          onRolChange={cargarFuncionesPorRol}
          onSincronizar={restaurarFuncionesRol}
          onDirtyChange={marcarFormularioModificado}
        />
      </Box>
    );
  }

  if (modoCargaMasiva) {
    return (
      <CargaMasivaUsuariosPage
        onVolver={() => {
          setModoCargaMasiva(false);
          cargarUsuarios();
        }}
        onFinalizado={(cantidad) =>
          setMensaje(`${cantidad} usuario(s) creado(s) mediante carga masiva.`)
        }
      />
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Administración de usuarios"
        descripcion="Gestiona cuentas, roles y accesos del sistema."
        icono={<ManageAccountsOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => buscar({ ...filtros, busqueda: valor })}
          acciones={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<GroupAddOutlinedIcon />}
                sx={dbanuStyles.backButton}
                onClick={() => setModoCargaMasiva(true)}
              >
                Carga masiva
              </Button>
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                sx={dbanuStyles.addButtonRevive}
                onClick={abrirNuevo}
              >
                Añadir
              </Button>
            </Stack>
          }
        />

        <UsuariosTable
          usuarios={usuarios}
          meta={meta}
          cargando={cargando}
          roles={roles}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={cambiarFiltroColumna}
          onVer={abrirDetalleUsuario}
          onEditar={abrirEditar}
          onCambiarEstado={cambiarEstado}
          onCambiarClave={restablecerClave}
          onPageChange={(page) => {
            const nuevosFiltros = { ...filtros, page };
            setFiltros(nuevosFiltros);
            cargarUsuarios(nuevosFiltros);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevosFiltros = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevosFiltros);
            cargarUsuarios(nuevosFiltros);
          }}
        />
      </Paper>

      <NotificacionSnackbar mensaje={mensaje} onClose={() => setMensaje("")} />
    </Box>
  );
}

function obtenerCodigos(grupos) {
  return obtenerCodigosUnicos(grupos.flatMap((grupo) => grupo.funciones));
}

function obtenerCodigosUnicos(funciones) {
  return [...new Set(funciones.map((funcion) => funcion.id_menu))];
}

function esRolDeportista(idRol, roles) {
  return roles.some(
    (rol) =>
      String(rol.id_userrole) === String(idRol) && rol.role === "DEPORTISTA",
  );
}
