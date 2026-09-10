import { apiClient } from '../../../services/apiClient.js'

export async function iniciarSesion(credenciales) {
  const { data } = await apiClient.post('/base/auth/login', credenciales)
  return data.datos
}

export async function obtenerUsuarioActual() {
  const { data } = await apiClient.get('/base/auth/me')
  return data.datos
}

export async function cerrarSesion() {
  await apiClient.post('/base/auth/logout')
}

export async function cambiarClavePropia(payload) {
  const { data } = await apiClient.post('/base/auth/cambiar-clave', payload)
  return data
}
