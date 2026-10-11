import { apiClient } from '../../../services/apiClient.js'
export async function listarPlantillas(){const{data}=await apiClient.get('/base/notificaciones/plantillas');return data.datos}
export async function listarEventosPlantilla(){const{data}=await apiClient.get('/base/notificaciones/plantillas/eventos');return data.datos}
export async function guardarPlantilla(payload,id){const{data}=id?await apiClient.put(`/base/notificaciones/plantillas/${id}`,payload):await apiClient.post('/base/notificaciones/plantillas',payload);return data.datos}
export async function vistaPreviaPlantilla(payload){const{data}=await apiClient.post('/base/notificaciones/plantillas/vista-previa',payload);return data.datos}
