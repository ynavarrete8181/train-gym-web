import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiClient } from './apiClient.js'

export const EVENTO_TIEMPO_REAL = 'revive:tiempo-real'

let echo = null
let usuarioConectado = null

function instanciaEcho() {
  if (echo) return echo

  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http'
  const host = import.meta.env.VITE_REVERB_HOST || '127.0.0.1'
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)

  window.Pusher = Pusher

  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'revive-local-key',
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        apiClient.post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        }).then(({ data }) => callback(false, data)).catch((error) => callback(true, error))
      },
    }),
  })

  return echo
}

export function conectarTiempoRealUsuario(usuarioId) {
  if (!usuarioId) return () => {}

  const cliente = instanciaEcho()
  if (usuarioConectado && usuarioConectado !== Number(usuarioId)) {
    cliente.leave(`usuario.${usuarioConectado}`)
  }

  usuarioConectado = Number(usuarioId)
  cliente.private(`usuario.${usuarioConectado}`)
    .listen('.sistema.actualizado', (evento) => {
      window.dispatchEvent(new CustomEvent(EVENTO_TIEMPO_REAL, { detail: evento }))
    })

  cliente.private('sistema.navegacion')
    .listen('.sistema.actualizado', (evento) => {
      window.dispatchEvent(new CustomEvent(EVENTO_TIEMPO_REAL, { detail: evento }))
    })

  return () => {
    if (usuarioConectado === Number(usuarioId)) {
      cliente.leave(`usuario.${usuarioConectado}`)
      cliente.leave('sistema.navegacion')
      usuarioConectado = null
    }
  }
}
