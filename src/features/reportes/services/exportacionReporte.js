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

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
