import { apiClient as api } from '../../../services/apiClient.js';

export const accesoServicio = {
  obtenerDispositivos: async (params = { page: 1 }) => (await api.get('/base/acceso/dispositivos', { params })).data,
  crearDispositivo: async (payload) => (await api.post('/base/acceso/dispositivos', payload)).data,
  actualizarDispositivo: async (id, payload) => (await api.put(`/base/acceso/dispositivos/${id}`, payload)).data,
  obtenerCredenciales: async (params = { page: 1 }) => (await api.get('/base/acceso/credenciales', { params })).data,
  crearCredencial: async (payload) => (await api.post('/base/acceso/credenciales', payload)).data,
  actualizarCredencial: async (id, payload) => (await api.put(`/base/acceso/credenciales/${id}`, payload)).data,
  obtenerEventos: async (params = { page: 1 }) => (await api.get('/base/acceso/eventos', { params })).data,
  registrarEvento: async (payload) => (await api.post('/base/acceso/eventos', payload)).data,
  obtenerAsistencias: async (params = { page: 1 }) => (await api.get('/base/acceso/asistencias', { params })).data,
  registrarAsistencia: async (payload) => (await api.post('/base/acceso/asistencias', payload)).data,
};
