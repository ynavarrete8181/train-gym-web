import { apiClient } from "../../services/apiClient";

export const listCategoriasServicio = async () => {
    const { data } = await apiClient.get("/gimnasio/categoria-servicio");
    return Array.isArray(data) ? data : [];
};

export const getCategoriaServicio = async (id) => {
    const { data } = await apiClient.get(`/gimnasio/categoria-servicio/${id}`);
    return data;
};

export const createCategoriaServicio = async (payload) => {
    const { data } = await apiClient.post("/gimnasio/categoria-servicio", payload);
    return data;
};

export const updateCategoriaServicio = async (id, payload) => {
    const { data } = await apiClient.put(`/gimnasio/categoria-servicio/${id}`, payload);
    return data;
};

export const listServicios = async () => {
    const { data } = await apiClient.get("/gimnasio/servicios");
    return Array.isArray(data) ? data : [];
};

export const getServicio = async (id) => {
    const { data } = await apiClient.get(`/gimnasio/servicios/${id}`);
    return data;
};

export const createServicio = async (payload) => {
    const { data } = await apiClient.post("/gimnasio/servicios", payload);
    return data;
};

export const updateServicio = async (id, payload) => {
    const { data } = await apiClient.put(`/gimnasio/servicios/${id}`, payload);
    return data;
};

export const listServiciosByCategoria = async (categoriaId) => {
    const { data } = await apiClient.get(`/gimnasio/categoria-servicio/${categoriaId}/servicios`);
    return Array.isArray(data) ? data : [];
};

