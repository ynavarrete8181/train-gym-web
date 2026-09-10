import { apiClient } from './apiClient.js'

export async function listarAvisos() {
  const { data } = await apiClient.get('/base/avisos')
  return data.datos
}

export async function marcarAvisoLeido(id) {
  const { data } = await apiClient.patch(`/base/avisos/${id}/leido`)
  return data
}
