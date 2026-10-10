import { apiClient as api } from '../../../../services/apiClient.js';

export const productosServiciosVendidosServicio = {
  consultar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/reportes/productos-servicios-vendidos', { params })
  ).data,
};
