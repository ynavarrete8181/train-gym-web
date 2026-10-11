import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { ModalConfirmacion } from '../../../../components/common/ModalConfirmacion.jsx'

export function ConfirmarEnvioCampaniaDialog({ campania, onClose, onConfirmar }) {
  const total = campania?.total_destinatarios || 0

  return <ModalConfirmacion
    open={Boolean(campania)}
    titulo="Enviar comunicado"
    descripcion="Confirma el procesamiento."
    icono={<CampaignOutlinedIcon />}
    textoCancelar="Dejar borrador"
    textoConfirmar="Sí, enviar"
    iconoConfirmar={<SendOutlinedIcon />}
    onClose={onClose}
    onConfirmar={onConfirmar}
  >
    <Box sx={{ p: 1.6, border: '1px solid #d7e2f0', borderRadius: 2, bgcolor: '#fff' }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Destinatarios</Typography>
      <Typography sx={{ mt: .25, fontSize: 18, fontWeight: 900, color: 'primary.main' }}>{total}</Typography>
      <Stack direction="row" spacing={.6} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {campania?.canal_interno && <Chip size="small" label="Sistema" />}
        {campania?.canal_correo && <Chip size="small" label="Correo" />}
        {campania?.canal_push && <Chip size="small" label="App push" />}
        {campania?.publicar_inicio_app && <Chip size="small" color="primary" label="Carrusel app" />}
      </Stack>
    </Box>
  </ModalConfirmacion>
}
