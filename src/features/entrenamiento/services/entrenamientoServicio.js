import { apiClient as api } from '../../../services/apiClient.js';

export const entrenamientoServicio = {
  obtenerEjercicios: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/entrenamiento/ejercicios', { params });
    return data;
  },
  crearEjercicio: async (payload) => {
    const { data } = await api.post('/base/entrenamiento/ejercicios', payload);
    return data;
  },
  actualizarEjercicio: async (id, payload) => {
    const { data } = await api.put(`/base/entrenamiento/ejercicios/${id}`, payload);
    return data;
  },
  obtenerPlanes: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/entrenamiento/planes', { params });
    return data;
  },
  crearPlan: async (payload) => {
    const { data } = await api.post('/base/entrenamiento/planes', payload);
    return data;
  },
  actualizarPlan: async (id, payload) => {
    const { data } = await api.put(`/base/entrenamiento/planes/${id}`, payload);
    return data;
  },
  obtenerRutinas: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/entrenamiento/rutinas', { params });
    return data;
  },
  crearRutina: async (payload) => {
    const { data } = await api.post('/base/entrenamiento/rutinas', payload);
    return data;
  },
  actualizarRutina: async (id, payload) => {
    const { data } = await api.put(`/base/entrenamiento/rutinas/${id}`, payload);
    return data;
  },
  obtenerRegistrosRm: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/entrenamiento/registros-rm', { params });
    return data;
  },
  obtenerUltimosRm: async (clienteId) => {
    const { data } = await api.get('/base/entrenamiento/registros-rm/ultimos', { params: { cliente_id: clienteId } });
    return data;
  },
  crearRegistroRm: async (payload) => {
    const { data } = await api.post('/base/entrenamiento/registros-rm', payload);
    return data;
  },
  actualizarRegistroRm: async (id, payload) => {
    const { data } = await api.put(`/base/entrenamiento/registros-rm/${id}`, payload);
    return data;
  },
  obtenerProgreso: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/entrenamiento/progreso', { params });
    return data;
  },
  crearProgreso: async (payload) => {
    const { data } = await api.post('/base/entrenamiento/progreso', payload);
    return data;
  },
  actualizarProgreso: async (id, payload) => {
    const { data } = await api.put(`/base/entrenamiento/progreso/${id}`, payload);
    return data;
  },
  eliminarProgreso: async (id) => {
    const { data } = await api.delete(`/base/entrenamiento/progreso/${id}`);
    return data;
  },
};
