import axios from 'axios'
import { API_EVENTO_ACCESO_DENEGADO, API_EVENTO_SESION_EXPIRADA } from './apiEvents.js'
import { obtenerMensajeError } from './mensajeError.js'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('base_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const estado = error.response?.status
    const mensaje = error.response?.data?.mensaje

    error.mensajeUsuario = obtenerMensajeError(error)

    if (estado >= 500 && error.response?.data) {
      error.response.data.mensaje = error.mensajeUsuario
    }

    if (!error.response) {
      error.message = error.mensajeUsuario
    }

    if (estado === 401 && localStorage.getItem('base_token')) {
      window.dispatchEvent(new CustomEvent(API_EVENTO_SESION_EXPIRADA, { detail: { mensaje } }))
    }

    if (estado === 403) {
      window.dispatchEvent(new CustomEvent(API_EVENTO_ACCESO_DENEGADO, { detail: { mensaje } }))
    }

    return Promise.reject(error)
  },
)
