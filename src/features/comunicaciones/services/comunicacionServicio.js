import { apiClient as api } from '../../../services/apiClient.js';

export const comunicacionServicio = {
  obtenerTipos: async (params = { page: 1 }) => (await api.get('/base/comunicaciones/tipos', { params })).data,
  crearTipo: async (payload) => (await api.post('/base/comunicaciones/tipos', payload)).data,
  actualizarTipo: async (id, payload) => (await api.put(`/base/comunicaciones/tipos/${id}`, payload)).data,
  obtenerSegmentos: async (params = { page: 1 }) => (await api.get('/base/comunicaciones/segmentos', { params })).data,
  crearSegmento: async (payload) => (await api.post('/base/comunicaciones/segmentos', payload)).data,
  actualizarSegmento: async (id, payload) => (await api.put(`/base/comunicaciones/segmentos/${id}`, payload)).data,
  obtenerMensajes: async (params = { page: 1 }) => (await api.get('/base/comunicaciones/mensajes', { params })).data,
  crearMensaje: async (payload) => (await api.post('/base/comunicaciones/mensajes', payload)).data,
  actualizarMensaje: async (id, payload) => (await api.put(`/base/comunicaciones/mensajes/${id}`, payload)).data,
  obtenerProgramaciones: async (params = { page: 1 }) => (await api.get('/base/comunicaciones/programaciones', { params })).data,
  crearProgramacion: async (payload) => (await api.post('/base/comunicaciones/programaciones', payload)).data,
  actualizarProgramacion: async (id, payload) => (await api.put(`/base/comunicaciones/programaciones/${id}`, payload)).data,
};
