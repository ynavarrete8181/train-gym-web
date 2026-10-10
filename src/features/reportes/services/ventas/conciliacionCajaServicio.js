import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../exportacionReporte.js';

const endpoint = '/base/ventas/reportes/conciliacion-caja';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const conciliacionCajaServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'conciliacion-caja'),
};
