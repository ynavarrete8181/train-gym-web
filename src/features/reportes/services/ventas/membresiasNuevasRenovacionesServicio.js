import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../exportacionReporte.js';

const endpoint = '/base/ventas/reportes/membresias-nuevas-renovaciones';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const membresiasNuevasRenovacionesServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'membresias-nuevas-renovaciones'),
};
