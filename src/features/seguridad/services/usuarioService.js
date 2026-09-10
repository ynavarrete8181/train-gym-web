import { apiClient } from '../../../services/apiClient.js'
import { EVENTO_TIEMPO_REAL } from '../../../services/tiempoRealService.js'

const invalidarMenuLocal = (usuarioId) => window.dispatchEvent(new CustomEvent(EVENTO_TIEMPO_REAL, {
  detail: { tipo: 'MENU_ACTUALIZADO', datos: { usuario_id: Number(usuarioId), origen: 'local' } },
}))

export async function listarUsuarios(parametros = {}) {
  const { data } = await apiClient.get('/base/seguridad/usuarios', { params: parametros })
  return data
}

export async function crearUsuario(payload) {
  const { data } = await apiClient.post('/base/seguridad/usuarios', payload)
  return data.datos
}

export async function actualizarUsuario(id, payload) {
  const { data } = await apiClient.put(`/base/seguridad/usuarios/${id}`, payload)
  return data.datos
}

export async function cambiarEstadoUsuario(id, usrEstado) {
  const { data } = await apiClient.patch(`/base/seguridad/usuarios/${id}/estado`, { usr_estado: usrEstado })
  return data.datos
}

export async function restablecerClaveUsuario(id) {
  const { data } = await apiClient.post(`/base/seguridad/usuarios/${id}/restablecer-clave`)
  return data
}

export async function listarRoles() {
  const { data } = await apiClient.get('/base/seguridad/roles')
  return data.datos
}

export async function listarFuncionesRol(rol) {
  const { data } = await apiClient.get('/base/seguridad/funciones-rol', { params: { rol } })
  return data.datos
}

export async function listarFuncionesDisponibles() {
  const { data } = await apiClient.get('/base/seguridad/funciones-disponibles')
  return data.datos
}

export async function listarFuncionesUsuario(id) {
  const { data } = await apiClient.get(`/base/seguridad/usuarios/${id}/funciones`)
  return data.datos.funciones
}

export async function guardarFuncionesUsuario(id, funciones) {
  const { data } = await apiClient.put(`/base/seguridad/usuarios/${id}/funciones`, { funciones })
  invalidarMenuLocal(id)
  return data
}

export async function guardarAccesosUsuario(id, usrTipo, funciones) {
  const { data } = await apiClient.put(`/base/seguridad/usuarios/${id}/accesos`, { usr_tipo: usrTipo, funciones })
  invalidarMenuLocal(id)
  return data
}

export async function sincronizarFuncionesRol(id) {
  const { data } = await apiClient.post(`/base/seguridad/usuarios/${id}/sincronizar-rol`)
  return data
}
export async function obtenerUsuario(id) { const { data } = await apiClient.get(`/base/seguridad/usuarios/${id}`); return data.datos }

export async function descargarPlantillaCargaUsuarios() {
  const { data } = await apiClient.get('/base/seguridad/usuarios/carga-masiva/plantilla', { responseType: 'blob' })
  return data
}

export async function validarCargaMasivaUsuarios(archivo) {
  const formulario = new FormData()
  formulario.append('archivo', archivo)
  const { data } = await apiClient.post('/base/seguridad/usuarios/carga-masiva/validar', formulario)
  return data.datos
}

export async function procesarCargaMasivaUsuarios(filas, notificarCredenciales = false) {
  const { data } = await apiClient.post('/base/seguridad/usuarios/carga-masiva/procesar', { filas, notificar_credenciales: notificarCredenciales })
  return data.datos
}

export async function obtenerEstadoCargaMasivaUsuarios(id) {
  const { data } = await apiClient.get(`/base/seguridad/usuarios/carga-masiva/${id}`)
  return data.datos
}

export async function listarCargasMasivasUsuariosRecientes() {
  const { data } = await apiClient.get('/base/seguridad/usuarios/carga-masiva/recientes')
  return data.datos
}
