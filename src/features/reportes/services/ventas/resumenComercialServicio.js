import { apiClient as api } from '../../../../services/apiClient.js';

export const resumenComercialServicio = {
  consultar: async (params = {}) => (
    await api.get('/base/ventas/reportes/resumen-comercial', { params })
  ).data,
};
