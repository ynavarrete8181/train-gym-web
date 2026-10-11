import { apiClient as api } from '../../../../services/apiClient.js';
import { consultarTodoPaginado, descargarExcelReporte } from '../exportacionReporte.js';

const endpoint = '/base/ventas/reportes/resumen-comercial';

const consultar = async (params = {}) => (
  await api.get(endpoint, { params })
).data;

export const resumenComercialServicio = {
  consultar,
  consultarTodo: async (params = {}) => (await consultar(params)).datos?.por_sede || [],
  exportarExcel: async (params = {}) => descargarExcelReporte(`${endpoint}/excel`, params, 'resumen-comercial'),
};
