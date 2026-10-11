import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { Alert, Box, Button, LinearProgress, Paper, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { BotonVolver } from "../../../components/common/BotonVolver.jsx";
import { EVENTO_TIEMPO_REAL } from "../../../services/tiempoRealService.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import { CargaUsuariosArchivo } from "../components/cargaUsuarios/CargaUsuariosArchivo.jsx";
import { CargaUsuariosConfirmacion } from "../components/cargaUsuarios/CargaUsuariosConfirmacion.jsx";
import { CargaUsuariosProgresoDialog } from "../components/cargaUsuarios/CargaUsuariosProgresoDialog.jsx";
import { CargaUsuariosResultado } from "../components/cargaUsuarios/CargaUsuariosResultado.jsx";
import { CargaUsuariosVistaPrevia } from "../components/cargaUsuarios/CargaUsuariosVistaPrevia.jsx";
import { descargarPlantillaCargaUsuarios, listarCargasMasivasUsuariosRecientes, obtenerEstadoCargaMasivaUsuarios, procesarCargaMasivaUsuarios, validarCargaMasivaUsuarios } from "../services/usuarioService.js";

const estadosFinales = ["COMPLETADO", "COMPLETADO_CON_ERRORES", "ERROR"];
const RESULTADO_VISTO_KEY = "revive:carga-masiva-resultado-visto";
const escapar = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
const descargarCsv = (nombre, filas) => {
  const contenido = `\uFEFF${filas.map((fila) => fila.map(escapar).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a"); enlace.href = url; enlace.download = nombre; enlace.click(); URL.revokeObjectURL(url);
};

const convertirResultado = (carga) => ({
  resumen: { total: carga?.total || 0, creados: carga?.creados || 0, errores: carga?.errores || 0, notificaciones_encoladas: carga?.notificaciones_encoladas || 0, notificaciones_error: carga?.notificaciones_error || 0 },
  creados: (carga?.detalles || []).filter((item) => item.estado === "CREADO").map((item) => ({ fila: item.fila, id: item.usuario_id, nombre: item.nombre, email: item.email, estado_notificacion: item.estado_notificacion })),
  errores: (carga?.detalles || []).filter((item) => item.estado === "ERROR").map((item) => ({ fila: item.fila, estado: "error", datos: { nombres: item.nombre, email: item.email }, errores: [item.error || "Error no especificado."] })),
});

export function CargaMasivaUsuariosPage({ onVolver, onFinalizado, cargaInicialId = null }) {
  const [filas, setFilas] = useState([]);
  const [validacion, setValidacion] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [carga, setCarga] = useState(null);
  const [modalProgreso, setModalProgreso] = useState(false);
  const [archivo, setArchivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [notificar, setNotificar] = useState(false);
  const finalizadoNotificado = useRef(null);

  useEffect(() => {
    let activo = true;
    const recuperar = async () => {
      try {
        if (cargaInicialId) {
          const actual = await obtenerEstadoCargaMasivaUsuarios(cargaInicialId);
          if (!activo) return;
          setCarga(actual);
          if (estadosFinales.includes(actual.estado)) setResultado(convertirResultado(actual));
          setModalProgreso(true);
          return;
        }
        const recientes = await listarCargasMasivasUsuariosRecientes();
        if (!activo || !recientes.length) return;
        const pendiente = recientes.find((item) => !estadosFinales.includes(item.estado));
        if (pendiente) {
          const actual = await obtenerEstadoCargaMasivaUsuarios(pendiente.id);
          if (!activo) return;
          setCarga(actual); setModalProgreso(true); return;
        }
        const ultima = recientes[0];
        const ultimoResultadoVisto = Number(window.sessionStorage.getItem(RESULTADO_VISTO_KEY) || 0);
        if (!estadosFinales.includes(ultima.estado) || ultimoResultadoVisto === Number(ultima.id)) return;
        const actual = await obtenerEstadoCargaMasivaUsuarios(ultima.id);
        if (!activo) return;
        setCarga(actual); setResultado(convertirResultado(actual)); setModalProgreso(true); finalizadoNotificado.current = actual.id;
      } catch { /* recuperación auxiliar */ }
    };
    recuperar();
    return () => { activo = false; };
  }, [cargaInicialId]);

  useEffect(() => {
    const recibir = (evento) => {
      if (evento.detail?.tipo !== "CARGA_MASIVA_USUARIOS") return;
      const actual = evento.detail?.datos;
      if (!actual?.id || (carga?.id && Number(actual.id) !== Number(carga.id))) return;

      setCarga(actual);
      if (estadosFinales.includes(actual.estado)) {
        setResultado(convertirResultado(actual));
        setModalProgreso(true);
        if (finalizadoNotificado.current !== actual.id) {
          finalizadoNotificado.current = actual.id;
          onFinalizado?.(actual.creados);
        }
      }
    };

    window.addEventListener(EVENTO_TIEMPO_REAL, recibir);
    return () => window.removeEventListener(EVENTO_TIEMPO_REAL, recibir);
  }, [carga?.id, onFinalizado]);

  const descargarPlantilla = async () => {
    setCargando(true); setError("");
    try { const blob = await descargarPlantillaCargaUsuarios(); const url = URL.createObjectURL(blob); const enlace = document.createElement("a"); enlace.href = url; enlace.download = "plantilla_usuarios.xlsx"; enlace.click(); URL.revokeObjectURL(url); }
    catch { setError("No se pudo generar la plantilla Excel."); } finally { setCargando(false); }
  };

  const seleccionarArchivo = async (evento) => {
    const seleccionado = evento.target.files?.[0]; if (!seleccionado) return;
    setCargando(true); setError(""); setResultado(null); setCarga(null);
    try { const data = await validarCargaMasivaUsuarios(seleccionado); setArchivo(seleccionado.name); setFilas(data.filas_procesar); setValidacion(data); }
    catch (err) { setFilas([]); setValidacion(null); setError(err.response?.data?.mensaje || "No se pudo validar el archivo Excel."); }
    finally { setCargando(false); evento.target.value = ""; }
  };

  const quitarArchivo = () => { setArchivo(""); setFilas([]); setValidacion(null); setResultado(null); setCarga(null); setError(""); };

  const procesar = async () => {
    const validos = validacion?.resumen?.validos || 0;
    const confirmado = await confirmarAccion({ titulo: "Crear usuarios masivamente", texto: `Se enviarán ${validos} usuario(s) a procesamiento en segundo plano. Las filas con errores serán registradas y omitidas.`, textoConfirmar: "Sí, procesar usuarios", icono: "warning" });
    if (!confirmado) return;
    setCargando(true); setError("");
    try { const data = await procesarCargaMasivaUsuarios(filas, notificar); setCarga(data); setModalProgreso(true); setResultado(null); finalizadoNotificado.current = null; }
    catch (err) { setError(err.response?.data?.mensaje || "No se pudo iniciar la carga."); } finally { setCargando(false); }
  };

  const descargarResultado = () => {
    const datos = resultado || convertirResultado(carga);
    descargarCsv("resultado_carga_usuarios.csv", [["fila", "nombre", "email", "estado_notificacion", "estado", "detalle"], ...(datos?.creados || []).map((item) => [item.fila, item.nombre, item.email, item.estado_notificacion, "CREADO", ""]), ...(datos?.errores || []).map((item) => [item.fila, item.datos?.nombres, item.datos?.email, "", "ERROR", item.errores.join(" | ")])]);
  };

  const cerrarProgreso = () => {
    if (carga?.id && estadosFinales.includes(carga.estado)) window.sessionStorage.setItem(RESULTADO_VISTO_KEY, String(carga.id));
    setModalProgreso(false);
  };

  const filasVista = resultado ? [...resultado.creados.map((item) => ({ fila: item.fila, datos: item, estado: "creado", errores: [] })), ...resultado.errores] : validacion?.filas || [];
  const procesando = carga && !estadosFinales.includes(carga.estado);

  return <Box className="page-wrapper">
    <PageHeader titulo="Carga masiva de usuarios" descripcion="Valida la plantilla y procesa la creación en segundo plano para evitar tiempos de espera del servidor." icono={<GroupAddOutlinedIcon />} acciones={<BotonVolver onClick={onVolver} />} />
    <Paper className="page-content-container" elevation={0}>
      {cargando ? <LinearProgress /> : null}
      <Stack spacing={2} sx={{ p: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {procesando && !modalProgreso ? <Alert severity="info" action={<Button size="small" onClick={() => setModalProgreso(true)}>Ver progreso</Button>}>Hay una carga masiva en procesamiento.</Alert> : null}
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <CargaUsuariosArchivo archivo={archivo} cargando={cargando || Boolean(procesando)} onDescargar={descargarPlantilla} onSeleccionar={seleccionarArchivo} onQuitar={quitarArchivo} />
          {!resultado ? <CargaUsuariosConfirmacion resumen={validacion?.resumen} cargando={cargando || Boolean(procesando)} notificar={notificar} onNotificar={setNotificar} onProcesar={procesar} /> : <CargaUsuariosResultado resultado={resultado} onDescargar={descargarResultado} />}
        </Paper>
        <CargaUsuariosVistaPrevia filas={filasVista} />
      </Stack>
    </Paper>
    <CargaUsuariosProgresoDialog abierto={modalProgreso} carga={carga} onCerrar={cerrarProgreso} onDescargar={estadosFinales.includes(carga?.estado) ? descargarResultado : null} />
  </Box>;
}
