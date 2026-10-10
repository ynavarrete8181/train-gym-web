import { apiClient as api } from '../../../../services/apiClient.js';

export const ventasResponsableServicio = {
  consultar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/reportes/ventas-responsable', { params })
  ).data,
};
