import { apiClient as api } from '../../../../services/apiClient.js';

export const membresiasNuevasRenovacionesServicio = {
  consultar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/reportes/membresias-nuevas-renovaciones', { params })
  ).data,
};
