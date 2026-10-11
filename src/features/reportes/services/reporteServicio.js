import { apiClient as api } from '../../../services/apiClient.js';

export const reporteServicio = {
  obtenerDisponibles: async (params = { page: 1 }) => (await api.get('/base/reportes/disponibles', { params })).data,
  obtenerHistorial: async (params = { page: 1 }) => (await api.get('/base/reportes/historial', { params })).data,
  generar: async (payload) => (await api.post('/base/reportes/ejecuciones', payload)).data,
};
