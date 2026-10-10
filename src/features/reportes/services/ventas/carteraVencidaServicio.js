import { apiClient as api } from '../../../../services/apiClient.js';

export const carteraVencidaServicio = {
  consultar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/reportes/cartera-vencida', { params })
  ).data,
};
