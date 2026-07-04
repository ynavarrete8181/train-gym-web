import { apiClient } from "../../services/apiClient";

export const listHorarios = async () => {
    const { data } = await apiClient.get("/gimnasio/horarios");
    return Array.isArray(data) ? data : [];
};

export const getHorario = async (id) => {
    const { data } = await apiClient.get(`/gimnasio/horarios/${id}`);
    return data;
};

export const createHorario = async (payload) => {
    const { data } = await apiClient.post("/gimnasio/horarios", payload);
    return data;
};

export const updateHorario = async (id, payload) => {
    const { data } = await apiClient.put(`/gimnasio/horarios/${id}`, payload);
    return data;
};

