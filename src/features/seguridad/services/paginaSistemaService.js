import { apiClient } from '../../../services/apiClient.js'

export const EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS = 'base:paginas-sistema-actualizadas'

export async function listarPaginasSistema() {
  const { data } = await apiClient.get('/base/seguridad/paginas-sistema')
  return data.datos
}

export async function asociarPaginaSistema(codigo, clavePagina) {
  const { data } = await apiClient.put(`/base/seguridad/paginas-sistema/${encodeURIComponent(codigo)}`, {
    clave_pagina: clavePagina,
  })
  window.dispatchEvent(new CustomEvent(EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS))
  return data.datos
}

export async function desasociarPaginaSistema(codigo) {
  const { data } = await apiClient.delete(`/base/seguridad/paginas-sistema/${encodeURIComponent(codigo)}`)
  window.dispatchEvent(new CustomEvent(EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS))
  return data
}
