import { apiClient as api } from '../../../services/apiClient.js';

export const configuracionServicio = {
  obtenerEstados: async (params = {}) => {
    const { data } = await api.get('/base/configuracion/estados', { params });
    return data;
  },
  crearEstado: async (payload) => {
    const { data } = await api.post('/base/configuracion/estados', payload);
    return data;
  },
  actualizarEstado: async (id, payload) => {
    const { data } = await api.put(`/base/configuracion/estados/${id}`, payload);
    return data;
  },
  desactivarEstado: async (id) => {
    const { data } = await api.patch(`/base/configuracion/estados/${id}/desactivar`);
    return data;
  },
};
