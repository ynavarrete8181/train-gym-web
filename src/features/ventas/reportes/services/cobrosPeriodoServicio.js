import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../../../reportes/services/exportacionReporte.js';

const endpoint = '/base/ventas/reportes/cobros-periodo';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const cobrosPeriodoServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'cobros-periodo'),
};
