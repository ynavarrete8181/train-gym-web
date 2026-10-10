import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../exportacionReporte.js';

const endpoint = '/base/ventas/reportes/cartera-vencida';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const carteraVencidaServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'cartera-vencida'),
};
