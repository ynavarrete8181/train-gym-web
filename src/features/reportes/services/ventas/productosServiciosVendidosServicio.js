import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../exportacionReporte.js';

const endpoint = '/base/ventas/reportes/productos-servicios-vendidos';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const productosServiciosVendidosServicio = {
  consultar,
  consultarTodo: async (params = {}) => consultarTodoPaginado(consultar, params),
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'productos-servicios-vendidos'),
};
