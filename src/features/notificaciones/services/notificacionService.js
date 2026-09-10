import { apiClient } from '../../../services/apiClient.js'

export async function listarNotificacionesUsuarios(params = {}) {
  const { data } = await apiClient.get('/base/notificaciones/usuarios', { params })
  return data
}
export async function seleccionarNotificacionesUsuarios(params = {}) {
  const { data } = await apiClient.get('/base/notificaciones/usuarios/seleccion', { params })
  return data.datos
}
export async function enviarNotificacionUsuario(id, forzar = false) {
  const { data } = await apiClient.post(`/base/notificaciones/usuarios/${id}/enviar`, { forzar })
  return data
}
export async function enviarNotificacionesUsuarios(usuarios, forzar = false) {
  const { data } = await apiClient.post('/base/notificaciones/usuarios/enviar', { usuarios, forzar })
  return data
}
export async function obtenerLoteInvitaciones(id) {
  const { data } = await apiClient.get(`/base/notificaciones/usuarios/lotes/${id}`)
  return data.datos
}
export async function listarLotesInvitacionesRecientes() {
  const { data } = await apiClient.get('/base/notificaciones/usuarios/lotes/recientes')
  return data.datos
}
export async function obtenerHistorialNotificacion(id) {
  const { data } = await apiClient.get(`/base/notificaciones/usuarios/${id}/historial`)
  return data.datos
}
