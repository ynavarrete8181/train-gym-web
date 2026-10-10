import { apiClient } from '../../../services/apiClient.js';

export async function consultarTodoPaginado(consultar, params = {}) {
  let pagina = 1;
  let ultimaPagina = 1;
  const filas = [];

  do {
    const respuesta = await consultar({ ...params, page: pagina, per_page: 50 });
    filas.push(...(respuesta.datos || []));
    ultimaPagina = Number(respuesta.meta?.ultima_pagina || 1);
    pagina += 1;
  } while (pagina <= ultimaPagina);

  return filas;
}

export async function descargarExcelReporte(endpoint, params = {}, nombreBase = 'reporte') {
  const response = await apiClient.get(endpoint, { params, responseType: 'blob' });
  const disposition = response.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const nombre = match?.[1] || `${nombreBase}.xlsx`;

  const url = URL.createObjectURL(response.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
