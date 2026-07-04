import { apiClient } from "../../services/apiClient";

export const listProductos = async () => {
    const { data } = await apiClient.get("/inventario/productos");
    return Array.isArray(data) ? data : [];
};

export const getProducto = async (id) => {
    const { data } = await apiClient.get(`/inventario/productos/${id}`);
    return data;
};

export const createProducto = async (payload) => {
    const { data } = await apiClient.post("/inventario/productos", payload, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
};

export const updateProducto = async (id, payload) => {
    const { data } = await apiClient.post(`/inventario/productos/${id}?_method=PUT`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
};

export const deleteProducto = async (id) => {
    const { data } = await apiClient.delete(`/inventario/productos/${id}`);
    return data;
};

export const listCategoriasProducto = async () => {
    const { data } = await apiClient.get("/inventario/categorias-producto");
    return Array.isArray(data) ? data : [];
};

export const listSedesInventario = async () => {
    const { data } = await apiClient.get("/inventario/sedes");
    return Array.isArray(data) ? data : [];
};

export const listMovimientosInventario = async (params = {}) => {
    const { data } = await apiClient.get("/inventario/movimientos", { params });
    return Array.isArray(data) ? data : [];
};

export const registrarEntradaInventario = async (payload) => {
    const { data } = await apiClient.post("/inventario/movimientos/entrada", payload);
    return data;
};

export const registrarSalidaInventario = async (payload) => {
    const { data } = await apiClient.post("/inventario/movimientos/salida", payload);
    return data;
};

export const registrarAjusteInventario = async (payload) => {
    const { data } = await apiClient.post("/inventario/movimientos/ajuste", payload);
    return data;
};

export const registrarBajaInventario = async (payload) => {
    const { data } = await apiClient.post("/inventario/movimientos/baja", payload);
    return data;
};

export const registrarInventarioInicialProducto = async (productoId, payload) => {
    const { data } = await apiClient.post(`/inventario/productos/${productoId}/inventario-inicial`, payload);
    return data;
};

export const listProductoPrecios = async (productoId) => {
    const { data } = await apiClient.get(`/inventario/productos/${productoId}/precios`);
    return Array.isArray(data) ? data : [];
};

export const createProductoPrecio = async (productoId, payload) => {
    const { data } = await apiClient.post(`/inventario/productos/${productoId}/precios`, payload);
    return data;
};

export const updateProductoPrecio = async (precioId, payload) => {
    const { data } = await apiClient.put(`/inventario/producto-precios/${precioId}`, payload);
    return data;
};

export const deleteProductoPrecio = async (precioId) => {
    const { data } = await apiClient.delete(`/inventario/producto-precios/${precioId}`);
    return data;
};
