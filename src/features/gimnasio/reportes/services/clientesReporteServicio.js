import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../../../reportes/services/exportacionReporte.js';

const endpoint = '/base/gimnasio/reportes/clientes';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const clientesReporteServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'clientes'),
};
