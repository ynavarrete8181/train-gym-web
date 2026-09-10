import { apiClient as api } from '../../../services/apiClient.js';

export const ventaServicio = {
  obtenerCajas: async (params = { page: 1 }) => (await api.get('/base/ventas/cajas', { params })).data,
  crearCaja: async (payload) => (await api.post('/base/ventas/cajas', payload)).data,
  actualizarCaja: async (id, payload) => (await api.put(`/base/ventas/cajas/${id}`, payload)).data,
  obtenerVentas: async (params = { page: 1 }) => (await api.get('/base/ventas/ventas', { params })).data,
  crearVenta: async (payload) => (await api.post('/base/ventas/ventas', payload)).data,
  actualizarVenta: async (id, payload) => (await api.put(`/base/ventas/ventas/${id}`, payload)).data,
  obtenerPagos: async (params = { page: 1 }) => (await api.get('/base/ventas/pagos', { params })).data,
  crearPago: async (payload) => (await api.post('/base/ventas/pagos', payload)).data,
  obtenerComprobantes: async (params = { page: 1 }) => (await api.get('/base/ventas/comprobantes', { params })).data,
};
