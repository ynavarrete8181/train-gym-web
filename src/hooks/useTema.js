import { useContext } from 'react'
import { TemaContext } from '../contexts/temaContextBase.js'

export function useTema() {
  const contexto = useContext(TemaContext)
  if (!contexto) throw new Error('useTema debe utilizarse dentro de TemaProvider')
  return contexto
}
