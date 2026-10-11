import { apiClient as api } from '../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../../reportes/services/exportacionReporte.js';

const endpoint = '/base/metas';

const consultar = async (params = {}) => (await api.get(endpoint, { params })).data;

export const metasComercialesServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  detalle: async (id) => (await api.get(`${endpoint}/${id}`)).data,
  catalogos: async (params = {}) => (await api.get(`${endpoint}/catalogos`, { params })).data,
  crear: async (payload) => (await api.post(endpoint, payload)).data,
  actualizar: async (id, payload) => (await api.put(`${endpoint}/${id}`, payload)).data,
  exportarExcel: async (params = {}) => descargarExcelReporte(
    `${endpoint}/excel`,
    params,
    'metas-comerciales',
  ),
};
