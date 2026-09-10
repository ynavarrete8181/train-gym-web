export function obtenerMensajeError(error, respaldo = 'No se pudo completar la operación.') {
  const estado = error?.response?.status
  const errores = error?.response?.data?.errors
  const primerError = errores ? Object.values(errores).flat()[0] : null

  if (primerError) return primerError
  if (!error?.response) return 'No fue posible comunicarse con el servidor. Verifica la conexión e inténtalo nuevamente.'
  if (estado === 401) return 'Tu sesión terminó. Ingresa nuevamente para continuar.'
  if (estado === 403) return 'No tienes permisos para realizar esta acción.'
  if (estado === 404) return 'No encontramos la información solicitada.'
  if (estado === 409) return error.response?.data?.mensaje || 'La operación entra en conflicto con información existente.'
  if (estado === 422) return error.response?.data?.mensaje || respaldo
  if (estado >= 500) return respaldo

  return error.response?.data?.mensaje || respaldo
}
