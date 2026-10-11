import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Chip, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { NotificacionSnackbar } from "../../../components/common/NotificacionSnackbar.jsx";
import { PageHeader } from "../../../components/common/PageHeader.jsx";
import { TablaEstadoFila } from "../../../components/tables/TablaEstadoFila.jsx";
import { TablaGestion } from "../../../components/tables/TablaGestion.jsx";
import { dbanuStyles } from "../../../styles/dbanuStyles.js";
import { confirmarAccion } from "../../../utils/confirmacion.js";
import { formatearFechaLocal } from "../../../utils/fechaLocal.js";
import { DetalleHistorial as DetalleHistorialComponente } from "../components/historial/DetalleHistorial.jsx";
import { duplicarComunicadoHistorial, listarHistorialNotificaciones, obtenerDetalleHistorial, reenviarInvitacionHistorial } from "../services/campaniaService.js";

const colores = { ENVIADA: "success", COMPLETADA: "success", COMPLETADA_CON_ERRORES: "warning", ERROR: "error", EN_COLA: "info", PROCESANDO: "info", PENDIENTE: "default" };
const etiquetas = { COMPLETADA: "ENVIADO", COMPLETADA_CON_ERRORES: "ENVIADO CON ERRORES", EN_COLA: "EN COLA" };

export function HistorialNotificacionesPage() {
  const [lista, setLista] = useState({ data: [], total: 0, current_page: 1, per_page: 10 });
  const [filtros, setFiltros] = useState({ tipo: "", estado: "" });
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async (page = 1, perPage = lista.per_page, nuevos = filtros) => {
    setCargando(true);
    try {
      setLista(await listarHistorialNotificaciones({ page, per_page: perPage, ...nuevos }));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrar = (campo, valor) => {
    const nuevos = { ...filtros, [campo]: valor };
    setFiltros(nuevos);
    cargar(1, lista.per_page, nuevos);
  };

  const ver = async (item) => setDetalle({ tipo: item.categoria, datos: await obtenerDetalleHistorial(item.categoria, item.id) });

  const reenviarAcceso = async (item) => {
    const ok = await confirmarAccion({ titulo: "Reenviar invitación", texto: "Se invalidará cualquier enlace anterior pendiente y se generará uno nuevo.", textoConfirmar: "Sí, reenviar", icono: "warning" });
    if (!ok) return;
    await reenviarInvitacionHistorial(item.id);
    await cargar();
    setAviso({ tipo: "success", mensaje: "Invitación nueva enviada a procesamiento." });
  };

  const reutilizar = async (item) => {
    const ok = await confirmarAccion({ titulo: "Usar como nueva campaña", texto: "Se creará un borrador independiente. El comunicado original no será modificado.", textoConfirmar: "Sí, crear borrador", icono: "question" });
    if (!ok) return;
    await duplicarComunicadoHistorial(item.id);
    setAviso({ tipo: "success", mensaje: "Borrador creado. Puedes editarlo desde Comunicados." });
  };

  if (detalle) return <DetalleHistorialComponente tipo={detalle.tipo} datos={detalle.datos} onVolver={() => setDetalle(null)} />;

  return (
    <Box className="page-wrapper">
      <PageHeader titulo="Historial de notificaciones" descripcion="Consulta invitaciones de acceso y comunicados enviados desde el sistema." icono={<HistoryOutlinedIcon />} />
      <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mb: 1.5 }}>
          <TextField select size="small" label="Tipo" value={filtros.tipo} onChange={(e) => filtrar("tipo", e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ACCESO">Invitaciones de acceso</MenuItem>
            <MenuItem value="COMUNICADO">Comunicados</MenuItem>
          </TextField>
          <TextField select size="small" label="Estado" value={filtros.estado} onChange={(e) => filtrar("estado", e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="EN_COLA">En cola</MenuItem>
            <MenuItem value="PROCESANDO">Procesando</MenuItem>
            <MenuItem value="ENVIADA">Enviada</MenuItem>
            <MenuItem value="COMPLETADA">Enviado</MenuItem>
            <MenuItem value="COMPLETADA_CON_ERRORES">Enviado con errores</MenuItem>
            <MenuItem value="ERROR">Error</MenuItem>
          </TextField>
        </Stack>

        <TablaGestion
          total={lista.total}
          filtrados={lista.total}
          page={lista.current_page}
          rowsPerPage={lista.per_page}
          cargando={cargando}
          onPageChange={(p) => cargar(p)}
          onRowsPerPageChange={(n) => cargar(1, n)}
        >
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Notificación</TableCell>
              <TableCell>Destinatario</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.data.map((item) => (
              <TableRow key={`${item.categoria}-${item.id}`} hover>
                <TableCell><Chip size="small" variant="outlined" label={item.categoria === "ACCESO" ? "Acceso" : "Comunicado"} /></TableCell>
                <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{item.titulo}</Typography></TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 12 }}>{item.destinatario}</Typography>
                  {item.correo_destino ? <Typography sx={{ fontSize: 10.8, color: "text.secondary" }}>{item.correo_destino}</Typography> : null}
                </TableCell>
                <TableCell>{item.enviados} enviados · {item.errores} errores</TableCell>
                <TableCell><Chip size="small" label={etiquetas[item.estado] || item.estado} color={colores[item.estado] || "default"} /></TableCell>
                <TableCell>{formatearFechaLocal(item.fecha)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.4} justifyContent="flex-end" flexWrap="nowrap">
                    <Tooltip title="Ver detalle">
                      <IconButton sx={dbanuStyles.actionView} onClick={() => ver(item)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
                    </Tooltip>
                    {item.categoria === "ACCESO" ? (
                      <Tooltip title="Reenviar invitación">
                        <IconButton sx={dbanuStyles.actionView} onClick={() => reenviarAcceso(item)}><ReplayOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Usar como nueva campaña">
                        <IconButton sx={dbanuStyles.actionView} onClick={() => reutilizar(item)}><ContentCopyOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!lista.data.length ? <TablaEstadoFila colSpan={7} cargando={cargando} texto="No existen notificaciones para los filtros seleccionados." /> : null}
          </TableBody>
        </TablaGestion>
      </Paper>
      <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
    </Box>
  );
}
