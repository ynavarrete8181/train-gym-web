import { apiClient } from '../../../services/apiClient.js'

export async function obtenerIntegraciones() {
  const { data } = await apiClient.get('/base/integraciones')
  return data.datos
}

export async function guardarProveedor(payload, id) {
  const { data } = id
    ? await apiClient.put(`/base/integraciones/proveedores/${id}`, payload)
    : await apiClient.post('/base/integraciones/proveedores', payload)
  return data.datos
}

export async function guardarServicio(payload, id) {
  const { data } = id
    ? await apiClient.put(`/base/integraciones/servicios/${id}`, payload)
    : await apiClient.post('/base/integraciones/servicios', payload)
  return data.datos
}

export async function guardarCredencial(payload, id) {
  const { data } = id
    ? await apiClient.put(`/base/integraciones/credenciales/${id}`, payload)
    : await apiClient.post('/base/integraciones/credenciales', payload)
  return data.datos
}

export async function obtenerCredencial(id) {
  const { data } = await apiClient.get(`/base/integraciones/credenciales/${id}`)
  return data.datos
}

export async function probarCredencial(id) {
  const { data } = await apiClient.post(`/base/integraciones/credenciales/${id}/probar`)
  return data.datos
}
