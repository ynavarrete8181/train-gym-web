import { useEffect, useMemo, useState } from 'react'
import { TemaContext } from './temaContextBase.js'

const CLAVE_TEMA = 'base_tema'
const PREFERENCIAS_VALIDAS = new Set(['automatico', 'light', 'dark'])
function obtenerPreferenciaInicial() {
  const guardada = localStorage.getItem(CLAVE_TEMA)
  if (guardada === 'sistema') return 'automatico'
  return PREFERENCIAS_VALIDAS.has(guardada) ? guardada : 'automatico'
}

function obtenerModoSistema() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function TemaProvider({ children }) {
  const [preferencia, setPreferencia] = useState(obtenerPreferenciaInicial)
  const [modoSistema, setModoSistema] = useState(obtenerModoSistema)

  useEffect(() => {
    const consultaTema = window.matchMedia('(prefers-color-scheme: dark)')
    const actualizar = (evento) => setModoSistema(evento.matches ? 'dark' : 'light')
    consultaTema.addEventListener('change', actualizar)
    return () => consultaTema.removeEventListener('change', actualizar)
  }, [])

  const cambiarPreferencia = (nuevaPreferencia) => {
    if (!PREFERENCIAS_VALIDAS.has(nuevaPreferencia)) return
    localStorage.setItem(CLAVE_TEMA, nuevaPreferencia)
    setPreferencia(nuevaPreferencia)
  }

  const valor = useMemo(() => ({
    preferencia,
    modoResuelto: preferencia === 'automatico' ? modoSistema : preferencia,
    cambiarPreferencia,
  }), [preferencia, modoSistema])

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>
}
