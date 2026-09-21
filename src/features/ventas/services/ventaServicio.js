import { apiClient as api } from '../../../services/apiClient.js';

export const ventaServicio = {
  obtenerCajas: async (params = { page: 1 }) => (await api.get('/base/ventas/cajas', { params })).data,
  crearCaja: async (payload) => (await api.post('/base/ventas/cajas', payload)).data,
  actualizarCaja: async (id, payload) => (await api.put(`/base/ventas/cajas/${id}`, payload)).data,

  obtenerTurnosCaja: async (params = { page: 1, per_page: 5 }) => (await api.get('/base/ventas/turnos-caja', { params })).data,
  obtenerTurnoCajaActual: async () => (await api.get('/base/ventas/turnos-caja/actual')).data,
  abrirTurnoCaja: async (payload) => (await api.post('/base/ventas/turnos-caja/abrir', payload)).data,
  cerrarTurnoCaja: async (id, payload) => (await api.post(`/base/ventas/turnos-caja/${id}/cerrar`, payload)).data,

  obtenerVentas: async (params = { page: 1 }) => (await api.get('/base/ventas/ventas', { params })).data,
  obtenerContextoPos: async () => (await api.get('/base/ventas/pos/contexto')).data,
  crearVentaPos: async (payload) => (await api.post('/base/ventas/pos', payload)).data,
  cobrarVentaPos: async (payload) => (await api.post('/base/ventas/pos/cobrar', payload)).data,
  crearVenta: async (payload) => (await api.post('/base/ventas/ventas', payload)).data,
  actualizarVenta: async (id, payload) => (await api.put(`/base/ventas/ventas/${id}`, payload)).data,
  obtenerPagos: async (params = { page: 1 }) => (await api.get('/base/ventas/pagos', { params })).data,
  crearPago: async (payload) => (await api.post('/base/ventas/pagos', payload)).data,
  obtenerComprobantes: async (params = { page: 1 }) => (await api.get('/base/ventas/comprobantes', { params })).data,
};
