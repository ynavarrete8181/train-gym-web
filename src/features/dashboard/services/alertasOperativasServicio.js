import { apiClient as api } from '../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../../reportes/services/exportacionReporte.js';

const endpoint = '/base/dashboard/alertas';

const consultar = async (params = {}) => (await api.get(endpoint, { params })).data;

export const alertasOperativasServicio = {
  consultar,
  procesar: async () => (await api.post(`${endpoint}/procesar`)).data,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(
    `${endpoint}/excel`,
    params,
    'alertas-operativas',
  ),
};
