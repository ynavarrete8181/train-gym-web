import { apiClient as api } from '../../../services/apiClient.js';

const endpoint = '/base/dashboard/metas';

export const metasComercialesServicio = {
  consultar: async (params = {}) => (await api.get(endpoint, { params })).data,
  detalle: async (id) => (await api.get(`${endpoint}/${id}`)).data,
  catalogos: async (params = {}) => (await api.get(`${endpoint}/catalogos`, { params })).data,
  crear: async (payload) => (await api.post(endpoint, payload)).data,
  actualizar: async (id, payload) => (await api.put(`${endpoint}/${id}`, payload)).data,
};
