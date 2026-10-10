import { apiClient as api } from '../../../services/apiClient.js';

const endpoint = '/base/auditoria/reportes';

export const reportesAuditoriaServicio = {
  consultar: async (params = {}) => (await api.get(endpoint, { params })).data,
};
