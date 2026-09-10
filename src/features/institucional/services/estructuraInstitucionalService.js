import { apiClient } from "../../../services/apiClient.js";

export async function listarEstructura() {
  const { data } = await apiClient.get("/base/institucional/estructura");
  return data.datos;
}

export async function guardarSede(payload, id) {
  const { data } = await apiClient[id ? "put" : "post"](
    `/base/institucional/sedes${id ? `/${id}` : ""}`,
    payload,
  );
  return data.datos;
}

export async function guardarUnidad(payload, id) {
  const { data } = await apiClient[id ? "put" : "post"](
    `/base/institucional/unidades${id ? `/${id}` : ""}`,
    payload,
  );
  return data.datos;
}

export async function guardarCarreraArea(payload, id) {
  const { data } = await apiClient[id ? "put" : "post"](
    `/base/institucional/carreras-areas${id ? `/${id}` : ""}`,
    payload,
  );
  return data.datos;
}

export async function cambiarEstadoInstitucional(tipo, id, activo) {
  await apiClient.patch(`/base/institucional/${tipo}/${id}/estado`, { activo });
}

export async function listarCamposFormacion() {
  const { data } = await apiClient.get('/base/institucional/campos-formacion');
  return data.datos;
}

export async function guardarCampoAmplio(payload, id) {
  const { data } = await apiClient[id ? 'put' : 'post'](
    `/base/institucional/campos-formacion/amplios${id ? `/${id}` : ''}`,
    payload,
  );
  return data.datos;
}

export async function cambiarEstadoCampoAmplio(id, activo) {
  await apiClient.patch(`/base/institucional/campos-formacion/amplios/${id}/estado`, { activo });
}
