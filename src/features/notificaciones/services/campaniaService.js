import { apiClient } from '../../../services/apiClient.js'

export async function listarCampanias(params = {}) {
  const ruta = params.historial ? '/base/notificaciones/historial' : '/base/notificaciones/campanias'
  const { data } = await apiClient.get(ruta, { params })
  return data.datos
}
export async function listarHistorialNotificaciones(params = {}) {
  const { data } = await apiClient.get('/base/notificaciones/historial', { params })
  return data.datos
}
export async function obtenerDetalleHistorial(tipo, id) {
  const { data } = await apiClient.get(`/base/notificaciones/historial/${tipo}/${id}`)
  return data.datos
}
export async function reenviarInvitacionHistorial(id) {
  const { data } = await apiClient.post(`/base/notificaciones/historial/ACCESO/${id}/reenviar`)
  return data
}
export async function duplicarComunicadoHistorial(id) {
  const { data } = await apiClient.post(`/base/notificaciones/historial/COMUNICADO/${id}/duplicar`)
  return data.datos
}
export async function obtenerCatalogosCampania() {
  const { data } = await apiClient.get('/base/notificaciones/campanias/catalogos')
  return data.datos
}
export async function calcularDestinatarios(criterios, canales) {
  const { data } = await apiClient.post('/base/notificaciones/campanias/vista-previa', { criterios, canales })
  return data.datos
}
export async function subirImagenPublicacionApp(archivo) {
  const formulario = new FormData()
  formulario.append('imagen', archivo)
  const { data } = await apiClient.post('/base/notificaciones/campanias/imagen-app', formulario)
  return data.datos
}
export async function crearCampania(payload) {
  const { data } = await apiClient.post('/base/notificaciones/campanias', payload)
  return data.datos
}
export async function actualizarCampania(id, payload) {
  const { data } = await apiClient.put(`/base/notificaciones/campanias/${id}`, payload)
  return data.datos
}
export async function obtenerCampania(id, historial = false) {
  const { data } = await apiClient.get(`/base/notificaciones/${historial ? 'historial' : 'campanias'}/${id}`)
  return data.datos
}
export async function enviarCampania(id) {
  const { data } = await apiClient.post(`/base/notificaciones/campanias/${id}/enviar`)
  return data
}
export async function eliminarCampania(id) {
  const { data } = await apiClient.delete(`/base/notificaciones/campanias/${id}`)
  return data
}
export async function reenviarErroresCampania(id) {
  const { data } = await apiClient.post(`/base/notificaciones/campanias/${id}/reenviar-errores`)
  return data
}
