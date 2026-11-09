export function formatearFechaLocal(valor, opciones) {
  if (!valor) return '—'

  const texto = String(valor)
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  // Las fechas sin zona ya están guardadas en hora de Ecuador.
  const fecha = new Date(tieneZona ? texto : `${texto.replace(' ', 'T')}-05:00`)

  if (Number.isNaN(fecha.getTime())) return texto

  return fecha.toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    ...opciones,
  })
}

/** Fecha de hoy (AAAA-MM-DD) en Ecuador; toISOString daría el día siguiente desde las 19:00. */
export function hoyEcuador() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
}
