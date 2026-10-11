import { apiClient } from '../../../services/apiClient.js'

export async function listarRoles() {
  const { data } = await apiClient.get('/base/seguridad/roles')
  return data.datos
}

export async function guardarRol(payload, idRol = null) {
  const metodo = idRol ? 'put' : 'post'
  const url = idRol ? `/base/seguridad/roles/${idRol}` : '/base/seguridad/roles'
  const { data } = await apiClient[metodo](url, payload)
  return data.datos
}

export async function cambiarEstadoRol(idRol, activo) {
  const { data } = await apiClient.patch(`/base/seguridad/roles/${idRol}/estado`, { activo })
  return data.datos
}

export async function detalleRol(idRol) {
  const { data } = await apiClient.get(`/base/seguridad/roles/${idRol}/detalle`)
  return data.datos
}

export async function listarFuncionesDisponibles() {
  const { data } = await apiClient.get('/base/seguridad/funciones-disponibles')
  return data.datos
}

export async function asignarFuncionRol(idRol, codigo) {
  const { data } = await apiClient.post(`/base/seguridad/roles/${idRol}/funciones`, { id_menu: codigo })
  return data.datos
}

export async function quitarFuncionRol(idRol, codigo) {
  const { data } = await apiClient.delete(`/base/seguridad/roles/${idRol}/funciones/${codigo}`)
  return data
}

export async function sincronizarRol(idRol) {
  const { data } = await apiClient.post(`/base/seguridad/roles/${idRol}/sincronizar`)
  return data.datos
}

export async function listarMenus() {
  const { data } = await apiClient.get('/base/seguridad/menus')
  return data.datos
}

export async function guardarMenu(payload, idMenu = null) {
  const metodo = idMenu ? 'put' : 'post'
  const url = idMenu ? `/base/seguridad/menus/${idMenu}` : '/base/seguridad/menus'
  const { data } = await apiClient[metodo](url, payload)
  return data.datos
}

export async function cambiarEstadoMenu(idMenu, activo) {
  const { data } = await apiClient.patch(`/base/seguridad/menus/${idMenu}/estado`, { activo })
  return data.datos
}

export async function moverMenu(idMenu, direccion) {
  const { data } = await apiClient.patch(`/base/seguridad/menus/${idMenu}/orden`, { direccion })
  return data.datos
}

export async function eliminarMenu(idMenu) {
  const { data } = await apiClient.delete(`/base/seguridad/menus/${idMenu}`)
  return data
}

export async function guardarFuncionRol(payload, idFuncion = null) {
  const metodo = idFuncion ? 'put' : 'post'
  const url = idFuncion ? `/base/seguridad/funciones-rol/${idFuncion}` : '/base/seguridad/funciones-rol'
  const { data } = await apiClient[metodo](url, payload)
  return data.datos
}

export async function cambiarEstadoFuncion(idFuncion, activo) {
  const { data } = await apiClient.patch(`/base/seguridad/funciones-rol/${idFuncion}/estado`, { activo })
  return data.datos
}

export async function moverFuncionRol(idFuncion, direccion) {
  const { data } = await apiClient.patch(`/base/seguridad/funciones-rol/${idFuncion}/orden`, { direccion })
  return data.datos
}

export async function eliminarFuncionRol(idFuncion) {
  const { data } = await apiClient.delete(`/base/seguridad/funciones-rol/${idFuncion}`)
  return data
}
