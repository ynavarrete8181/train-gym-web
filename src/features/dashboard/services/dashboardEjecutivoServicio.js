import { apiClient as api } from '../../../services/apiClient.js';

const endpoint = '/base/dashboard/ejecutivo';

export const dashboardEjecutivoServicio = {
  consultar: async (params = {}) => (await api.get(endpoint, { params })).data,
};
