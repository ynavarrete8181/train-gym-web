import { apiClient as api } from '../../../services/apiClient.js';

export const carteraServicio = {
  listar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/cartera', { params })
  ).data,

  detalle: async (id) => (
    await api.get(`/base/ventas/cartera/${id}`)
  ).data,

  actualizar: async (id, payload) => (
    await api.put(`/base/ventas/cartera/${id}`, payload)
  ).data,

  registrarGestion: async (id, payload) => (
    await api.post(`/base/ventas/cartera/${id}/gestiones`, payload)
  ).data,

  registrarCompromiso: async (id, payload) => (
    await api.post(`/base/ventas/cartera/${id}/compromisos`, payload)
  ).data,

  actualizarCompromiso: async (id, payload) => (
    await api.patch(`/base/ventas/cartera/compromisos/${id}`, payload)
  ).data,
};
