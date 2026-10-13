import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { conectarGmail, configurarGmail, desconectarGmail, obtenerEstadoGmail } from '../services/integracionService.js'

export function GmailConexion() {
  const [estado, setEstado] = useState(null)
  const [form, setForm] = useState({ client_id: '', client_secret: '', sender: 'ynavarrete8181@gmail.com' })
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargar = async () => setEstado(await obtenerEstadoGmail())
  useEffect(() => { cargar().catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo consultar Gmail.' })) }, [])

  const ejecutar = async (accion) => {
    setOcupado(true)
    setMensaje(null)
    try {
      await accion()
      await cargar()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error?.response?.data?.mensaje || 'No se pudo completar la operación.' })
    } finally {
      setOcupado(false)
    }
  }

  return <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography fontWeight={800}>Correo de Revive · Gmail API</Typography>
          <Typography variant="body2" color="text.secondary">Autoriza Gmail para enviar invitaciones y notificaciones por HTTPS.</Typography>
        </Box>
        <Chip size="small" variant="outlined" color={estado?.conectado ? 'success' : 'default'} label={estado?.conectado ? 'Conectado' : 'Sin conectar'} />
      </Stack>
      {mensaje && <Alert severity={mensaje.tipo}>{mensaje.texto}</Alert>}
      <Typography variant="body2">Remitente: {estado?.remitente || form.sender}</Typography>
      {!estado?.conectado && <>
        <TextField size="small" fullWidth label="Correo remitente" value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} />
        <TextField size="small" fullWidth label="Client ID de Google OAuth" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} />
        <TextField size="small" fullWidth type="password" autoComplete="off" label="Client Secret (no se volverá a mostrar)" value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} />
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="outlined" disabled={ocupado || !form.client_id || !form.client_secret || !form.sender} onClick={() => ejecutar(async () => { await configurarGmail(form); setForm((prev) => ({ ...prev, client_secret: '' })); setMensaje({ tipo: 'success', texto: 'Cliente OAuth configurado.' }) })}>Guardar cliente OAuth</Button>
          <Button variant="contained" disabled={ocupado || !estado?.configurado} onClick={() => ejecutar(async () => { const { url } = await conectarGmail(); if (url) window.location.assign(url) })}>Conectar con Google</Button>
        </Stack>
      </>}
      {estado?.conectado && <Button sx={{ alignSelf: 'flex-start' }} color="error" variant="outlined" disabled={ocupado} onClick={() => ejecutar(desconectarGmail)}>Desconectar Gmail</Button>}
      <Typography variant="caption" color="text.secondary">El backend conserva las credenciales cifradas. Debes habilitar Gmail API y registrar la URL de retorno OAuth en Google Cloud. La conexión no cambia automáticamente el transporte activo en producción.</Typography>
    </Stack>
  </Paper>
}
