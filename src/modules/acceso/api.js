import { apiClient } from "../../services/apiClient";

export const listarSedesAcceso = async () => {
    const { data } = await apiClient.get("/inventario/sedes");
    return Array.isArray(data) ? data : [];
};

export const validarQrAcceso = async ({ codigoQr, sedeId, origen = "WEB" }) => {
    const { data } = await apiClient.post("/gimnasio/acceso/validar-qr", {
        codigo_qr: codigoQr,
        sede_id: sedeId,
        origen,
        registrar_asistencia: true,
    });

    return data?.data ?? data;
};
