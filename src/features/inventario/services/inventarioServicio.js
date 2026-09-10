import { apiClient as api } from '../../../services/apiClient.js';

export const inventarioServicio = {
  obtenerCategorias: async (params = { page: 1 }) => (await api.get('/base/inventario/categorias', { params })).data,
  crearCategoria: async (payload) => (await api.post('/base/inventario/categorias', payload)).data,
  actualizarCategoria: async (id, payload) => (await api.put(`/base/inventario/categorias/${id}`, payload)).data,
  obtenerProveedores: async (params = { page: 1 }) => (await api.get('/base/inventario/proveedores', { params })).data,
  crearProveedor: async (payload) => (await api.post('/base/inventario/proveedores', payload)).data,
  actualizarProveedor: async (id, payload) => (await api.put(`/base/inventario/proveedores/${id}`, payload)).data,
  obtenerProductos: async (params = { page: 1 }) => (await api.get('/base/inventario/productos', { params })).data,
  crearProducto: async (payload) => (await api.post('/base/inventario/productos', payload)).data,
  actualizarProducto: async (id, payload) => (await api.put(`/base/inventario/productos/${id}`, payload)).data,
  obtenerMovimientos: async (params = { page: 1 }) => (await api.get('/base/inventario/movimientos', { params })).data,
  crearMovimiento: async (payload) => (await api.post('/base/inventario/movimientos', payload)).data,
};
