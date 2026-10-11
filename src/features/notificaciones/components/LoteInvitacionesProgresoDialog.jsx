import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { dbanuStyles } from '../../../styles/dbanuStyles.js'
import { formStyles } from '../../../styles/formStyles.js'
import { uiTokens } from '../../../styles/uiTokens.js'

const finales = ['COMPLETADO', 'COMPLETADO_CON_ERRORES', 'ERROR']
const etiqueta = (e) => ({ EN_COLA: 'En cola', PROCESANDO: 'Procesando', COMPLETADO: 'Completado', COMPLETADO_CON_ERRORES: 'Completado con errores', ERROR: 'Error' }[e] || e)

export function LoteInvitacionesProgresoDialog({ abierto, lote, onCerrar }) {
  if (!lote) return null
  const terminado = finales.includes(lote.estado)
  const porcentaje = Math.min(100, Math.max(0, Number(lote.porcentaje || 0)))
  const color = lote.estado === 'ERROR' ? uiTokens.colores.peligro : lote.estado === 'COMPLETADO_CON_ERRORES' ? uiTokens.colores.advertencia : terminado ? uiTokens.colores.exito : uiTokens.colores.primario
  const errores = (lote.detalles || []).filter((d) => d.estado === 'ERROR')

  return <Dialog open={abierto} onClose={terminado ? onCerrar : undefined} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
    <Box sx={formStyles.modalHeader}>
      <Box sx={{ ...formStyles.modalIcono, bgcolor: color }}><MarkEmailUnreadOutlinedIcon /></Box>
      <Box sx={{ minWidth: 0, flex: 1 }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography sx={{ fontSize: 18, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>Invitaciones de acceso</Typography><Typography sx={{ mt: .35, fontSize: 12.5, color: uiTokens.colores.textoMedio }}>Lote #{lote.id}</Typography></Box><Chip size="small" label={etiqueta(lote.estado)} variant="outlined" sx={{ fontWeight: 850, color, borderColor: color }} /></Stack></Box>
    </Box>
    <DialogContent dividers sx={{ bgcolor: uiTokens.colores.fondoPagina, px: 2.5, py: 2.4 }}>
      <Stack spacing={2}>
        <Box sx={{ p: 2, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 2, bgcolor: '#fff' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: uiTokens.colores.textoMedio }}>Progreso general</Typography>
          <Typography sx={{ mt: .15, mb: 1.2, fontSize: 13.5, fontWeight: 900 }}>{lote.procesados} de {lote.total} invitaciones finalizadas</Typography>
          <Box sx={{ position: 'relative', height: 30, borderRadius: 999, overflow: 'hidden', bgcolor: '#dfe8f2' }}>
            <Box sx={{ position: 'absolute', inset: 0, width: `${porcentaje}%`, borderRadius: 999, background: terminado ? color : `linear-gradient(90deg, ${uiTokens.colores.primarioOscuro}, ${uiTokens.colores.primario}, #2389cf)`, transition: 'width 650ms cubic-bezier(.4,0,.2,1)' }} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Box sx={{ minWidth: 54, px: 1, py: .25, borderRadius: 999, bgcolor: 'rgba(255,255,255,.94)', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,58,107,.16)' }}><Typography sx={{ fontSize: 12.5, fontWeight: 950, color }}>{porcentaje}%</Typography></Box></Box>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 1.1 }}>
          <Dato titulo="Enviadas" valor={lote.enviadas} color={uiTokens.colores.exito} />
          <Dato titulo="En cola" valor={lote.en_cola} color={uiTokens.colores.info} />
          <Dato titulo="Errores" valor={lote.errores} color={lote.errores ? uiTokens.colores.peligro : uiTokens.colores.textoFuerte} />
          <Dato titulo="Pendientes" valor={lote.pendientes} color={uiTokens.colores.textoFuerte} />
        </Box>
        {lote.error_general ? <Alert severity="error">{lote.error_general}</Alert> : null}
        {errores.length ? <Box><Typography sx={formStyles.modalSeccionTitulo}>Registros con error</Typography><Stack spacing={.7} sx={{ maxHeight: 170, overflow: 'auto' }}>{errores.slice(0, 40).map((d) => <Box key={d.usuario_id} sx={{ p: 1, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.4, bgcolor: '#fff' }}><Typography sx={{ fontSize: 11.5, fontWeight: 850 }}>{d.email || d.name || `Usuario ${d.usuario_id}`}</Typography><Typography sx={{ fontSize: 11.5, color: uiTokens.colores.textoMedio }}>{d.error}</Typography></Box>)}</Stack></Box> : null}
      </Stack>
    </DialogContent>
    <DialogActions sx={dbanuStyles.dialogActions}><Button variant="outlined" onClick={onCerrar} sx={formStyles.botonModal}>{terminado ? 'Cerrar' : 'Ocultar'}</Button></DialogActions>
  </Dialog>
}

function Dato({ titulo, valor, color }) { return <Box sx={{ minHeight: 78, p: 1.3, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.8, bgcolor: '#fff' }}><Typography sx={{ fontSize: 11.5, color: uiTokens.colores.textoMedio, fontWeight: 750 }}>{titulo}</Typography><Typography sx={{ mt: .55, fontSize: 21, fontWeight: 950, color }}>{valor ?? 0}</Typography></Box> }
