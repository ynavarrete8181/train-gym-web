import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { BotonVolver } from '../../../../components/common/BotonVolver.jsx'
import { PageHeader } from '../../../../components/common/PageHeader.jsx'
import { formatearFechaLocal } from '../../../../utils/fechaLocal.js'

const fecha = formatearFechaLocal

export function DetalleHistorial({ tipo, datos, onVolver }) {
  const acceso = tipo === 'ACCESO'
  const principal = acceso ? datos.notificacion : datos.campania
  const intentos = datos.intentos || []
  return <Box className="page-wrapper"><PageHeader titulo={acceso ? 'Invitación de acceso' : principal.nombre} descripcion="Consulta el contenido y la trazabilidad del envío sin modificar el registro original." icono={<VisibilityOutlinedIcon />} acciones={<BotonVolver texto="Volver al historial" onClick={onVolver} />} /><Paper className="page-content-container" elevation={0} sx={{ p: 2 }}><Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>{principal.asunto || principal.plantilla_nombre || 'Notificación'}</Typography><Typography sx={{ mt: .5, fontSize: 12, color: 'text.secondary' }}>{acceso ? `${principal.usuario_nombre} · ${principal.correo_destino}` : `${principal.total_destinatarios} destinatario(s) · ${fecha(principal.finalizada_at || principal.iniciada_at)}`}</Typography></Paper>
    {principal.cuerpo_html ? <Paper variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800 }}>Contenido</Typography><Box component="iframe" title="Contenido enviado" sandbox="" srcDoc={principal.cuerpo_html} sx={{ width: '100%', minHeight: 300, border: '1px solid #dbe5f0', borderRadius: 1.5 }} /></Paper> : null}
    {!acceso ? <Paper variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800 }}>Destinatarios</Typography>{(datos.destinatarios || []).map((d) => <Typography key={d.id} sx={{ py: .45, fontSize: 12 }}>{d.nombre_destinatario || 'Sin nombre'} · {d.correo_destino} · {d.estado}</Typography>)}</Paper> : null}
    <Paper variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800 }}>Intentos y errores</Typography>{intentos.length ? intentos.map((i) => <Box key={i.id} sx={{ py: .7, borderBottom: '1px solid #edf1f5' }}><Typography sx={{ fontSize: 12, fontWeight: 750 }}>Intento {i.numero_intento} · {i.estado} · {fecha(i.finalizado_at || i.iniciado_at)}</Typography><Typography sx={{ mt: .25, fontSize: 11.5, color: i.mensaje_error ? 'error.main' : 'text.secondary' }}>{i.mensaje_error || `HTTP ${i.http_status || '—'}`}</Typography></Box>) : <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>No existen intentos registrados.</Typography>}</Paper>
  </Stack></Paper></Box>
}
