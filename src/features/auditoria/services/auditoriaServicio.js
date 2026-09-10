import { apiClient as api } from '../../../services/apiClient.js';

export const auditoriaServicio = {
  obtenerEventos: async (params = { page: 1 }) => (await api.get('/base/auditoria/eventos', { params })).data,
  obtenerAccesos: async (params = { page: 1 }) => (await api.get('/base/auditoria/accesos', { params })).data,
  obtenerResumen: async () => (await api.get('/base/auditoria/resumen')).data,
  obtenerLogs: async (params = { page: 1 }) => (await api.get('/base/auditoria/logs', { params })).data,
};
