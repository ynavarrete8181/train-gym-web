import { apiClient } from "../../../services/apiClient.js";

const normalizarNullable = (valor) => {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string' && valor.trim() === '') return null;
  return valor;
};

function prepararSede(payload) {
  return {
    ...payload,
    codigo: normalizarNullable(payload.codigo),
    direccion: normalizarNullable(payload.direccion),
    ciudad: normalizarNullable(payload.ciudad),
    provincia: normalizarNullable(payload.provincia),
    telefono: normalizarNullable(payload.telefono),
    whatsapp: normalizarNullable(payload.whatsapp),
    email: normalizarNullable(payload.email),
    hora_apertura: normalizarNullable(payload.hora_apertura),
    hora_cierre: normalizarNullable(payload.hora_cierre),
  };
}

export async function listarEstructura() {
  const { data } = await apiClient.get("/base/institucional/estructura");
  return data.datos;
}

export async function guardarSede(payload, id) {
  const { data } = await apiClient[id ? "put" : "post"](
    `/base/institucional/sedes${id ? `/${id}` : ""}`,
    prepararSede(payload),
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
