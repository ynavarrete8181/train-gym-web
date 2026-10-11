export function formatearFechaLocal(valor, opciones) {
  if (!valor) return '—'

  const texto = String(valor)
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  const fecha = new Date(tieneZona ? texto : `${texto.replace(' ', 'T')}Z`)

  if (Number.isNaN(fecha.getTime())) return texto

  return fecha.toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    ...opciones,
  })
}
