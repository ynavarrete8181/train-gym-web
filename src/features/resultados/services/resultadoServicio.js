import { apiClient as api } from '../../../services/apiClient.js';

export const resultadoServicio = {
  obtenerResumen: async () => (await api.get('/base/resultados/resumen')).data,
  obtenerAsistencia: async (params = { page: 1 }) => (await api.get('/base/resultados/asistencia', { params })).data,
  obtenerVentas: async (params = { page: 1 }) => (await api.get('/base/resultados/ventas', { params })).data,
  obtenerProgreso: async (params = { page: 1 }) => (await api.get('/base/resultados/progreso', { params })).data,
};
