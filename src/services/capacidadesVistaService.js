import { apiClient as api } from './apiClient.js'

const endpointsPorVista = {
  'GIMNASIO-DEPORTISTAS': '/base/gimnasio/clientes/capacidades',
}

export function vistaTieneCapacidadesBackend(vista) {
  return Boolean(endpointsPorVista[vista])
}

export async function obtenerCapacidadesVista(vista) {
  const endpoint = endpointsPorVista[vista]
  if (!endpoint) return null

  const { data } = await api.get(endpoint)
  return data?.datos || null
}
