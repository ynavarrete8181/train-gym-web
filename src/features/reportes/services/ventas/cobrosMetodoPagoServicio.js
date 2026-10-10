import { apiClient as api } from '../../../../services/apiClient.js';

export const cobrosMetodoPagoServicio = {
  consultar: async (params = { page: 1, per_page: 10 }) => (
    await api.get('/base/ventas/reportes/cobros-metodo-pago', { params })
  ).data,
};
