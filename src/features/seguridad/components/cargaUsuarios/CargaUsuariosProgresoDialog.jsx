import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { IconoArchivo } from '../../../../components/common/IconoArchivo.jsx'
import { dbanuStyles } from '../../../../styles/dbanuStyles.js'
import { formStyles } from '../../../../styles/formStyles.js'
import { uiTokens } from '../../../../styles/uiTokens.js'

const finalizados = ['COMPLETADO', 'COMPLETADO_CON_ERRORES', 'ERROR']
const etiquetaEstado = (estado) => ({ EN_COLA: 'En cola', PROCESANDO: 'Procesando', NOTIFICANDO: 'Notificando', COMPLETADO: 'Completado', COMPLETADO_CON_ERRORES: 'Completado con errores', ERROR: 'Error' }[estado] || estado)

function colorEstado(carga, terminado) {
  if (carga.estado === 'ERROR') return uiTokens.colores.peligro
  if (carga.estado === 'COMPLETADO_CON_ERRORES') return uiTokens.colores.advertencia
  if (terminado) return uiTokens.colores.exito
  return uiTokens.colores.primario
}

export function CargaUsuariosProgresoDialog({ abierto, carga, onCerrar, onDescargar }) {
  if (!carga) return null
  const terminado = finalizados.includes(carga.estado)
  const errores = (carga.detalles || []).filter((item) => item.estado === 'ERROR' || item.estado_notificacion === 'ERROR')
  const porcentaje = Math.min(100, Math.max(0, Number(carga.porcentaje || 0)))
  const color = colorEstado(carga, terminado)

  return (
    <Dialog open={abierto} onClose={terminado ? onCerrar : undefined} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={formStyles.modalHeader}>
        <Box sx={{ ...formStyles.modalIcono, bgcolor: color }}><GroupAddOutlinedIcon /></Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: uiTokens.colores.textoFuerte, lineHeight: 1.2 }}>Procesamiento de usuarios</Typography>
              <Typography sx={{ mt: .35, fontSize: 12.5, color: uiTokens.colores.textoMedio }}>Lote #{carga.id}</Typography>
            </Box>
            <Chip size="small" label={etiquetaEstado(carga.estado)} variant="outlined" sx={{ flex: '0 0 auto', fontWeight: 850, color, borderColor: color, bgcolor: '#fff' }} />
          </Stack>
        </Box>
      </Box>

      <DialogContent dividers sx={{ bgcolor: uiTokens.colores.fondoPagina, px: 2.5, py: 2.4 }}>
        <Stack spacing={2}>
          <Box sx={{ p: 2, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 10px 28px rgba(15, 58, 107, 0.07)' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: uiTokens.colores.textoMedio }}>Progreso general</Typography>
            <Typography sx={{ mt: .15, mb: 1.2, fontSize: 13.5, fontWeight: 900, color: uiTokens.colores.textoFuerte }}>
              {carga.notificar ? 'Creación de cuentas y envío de invitaciones' : `${carga.procesados} de ${carga.total} usuarios procesados`}
            </Typography>
            <Box sx={{ position: 'relative', height: 30, overflow: 'hidden', borderRadius: 999, bgcolor: '#dfe8f2', border: '1px solid #d5e0ec', boxShadow: 'inset 0 1px 2px rgba(15, 58, 107, 0.08)' }}>
              <Box sx={{ position: 'absolute', inset: 0, width: `${porcentaje}%`, borderRadius: 999, background: terminado ? `linear-gradient(90deg, ${color}, ${color})` : `linear-gradient(90deg, ${uiTokens.colores.primarioOscuro} 0%, ${uiTokens.colores.primario} 55%, #2389cf 100%)`, transition: 'width 650ms cubic-bezier(.4,0,.2,1)', overflow: 'hidden', '&::after': !terminado ? { content: '""', position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,.32) 42%, transparent 64%)', transform: 'translateX(-100%)', animation: 'cargaMasivaBrillo 1.55s ease-in-out infinite' } : undefined, '@keyframes cargaMasivaBrillo': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } } }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Box sx={{ minWidth: 54, px: 1, py: .25, borderRadius: 999, bgcolor: 'rgba(255,255,255,.94)', boxShadow: '0 2px 8px rgba(15,58,107,.16)', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 950, color, lineHeight: 1.25 }}>{porcentaje}%</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: carga.notificar ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }, gap: 1.1 }}>
            <Dato titulo="Creados" valor={carga.creados} color={uiTokens.colores.exito} />
            {carga.notificar ? <Dato titulo="Enviadas" valor={carga.notificaciones_enviadas} color={uiTokens.colores.exito} /> : null}
            {carga.notificar ? <Dato titulo="En cola" valor={carga.notificaciones_encoladas} color={uiTokens.colores.info} /> : null}
            <Dato titulo="Errores" valor={(carga.errores || 0) + (carga.notificaciones_error || 0)} color={(carga.errores || carga.notificaciones_error) ? uiTokens.colores.peligro : uiTokens.colores.textoFuerte} />
          </Box>

          {carga.error_general ? <Alert severity="error">{carga.error_general}</Alert> : null}
          {errores.length ? <><Divider /><Box><Typography sx={formStyles.modalSeccionTitulo}>Registros con error</Typography><Stack spacing={.8} sx={{ maxHeight: 180, overflow: 'auto' }}>{errores.slice(0, 50).map((item) => <Box key={item.fila} sx={{ p: 1.1, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5, bgcolor: '#fff' }}><Typography sx={{ fontSize: 11.5, fontWeight: 850, color: uiTokens.colores.textoFuerte }}>Fila {item.fila} · {item.email || item.nombre || 'Sin identificación'}</Typography><Typography sx={{ mt: .25, fontSize: 11.5, color: uiTokens.colores.textoMedio }}>{item.error || 'Error no especificado.'}</Typography></Box>)}</Stack></Box></> : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={dbanuStyles.dialogActions}>
        {terminado && onDescargar ? <Tooltip title="Descargar resultado CSV"><IconButton aria-label="Descargar resultado CSV" onClick={onDescargar} sx={{ ...dbanuStyles.actionView, width: 38, height: 38 }}><IconoArchivo tipo="csv" size={19} /></IconButton></Tooltip> : null}
        <Button variant="outlined" onClick={onCerrar} sx={formStyles.botonModal}>{terminado ? 'Cerrar' : 'Ocultar'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function Dato({ titulo, valor, color }) {
  return <Box sx={{ minHeight: 82, p: 1.3, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.8, bgcolor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Typography sx={{ fontSize: 11.5, fontWeight: 750, color: uiTokens.colores.textoMedio, lineHeight: 1.2 }}>{titulo}</Typography><Typography sx={{ mt: .55, fontWeight: 950, fontSize: 21, color, lineHeight: 1 }}>{valor ?? 0}</Typography></Box>
}
