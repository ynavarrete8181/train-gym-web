import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { LoadingState } from '../components/common/LoadingState.jsx'
import { NotificacionSnackbar } from '../components/common/NotificacionSnackbar.jsx'
import { LoginPage } from '../features/auth/pages/LoginPage.jsx'
import { cerrarSesion, iniciarSesion, obtenerUsuarioActual } from '../features/auth/services/authService.js'
import { API_EVENTO_ACCESO_DENEGADO, API_EVENTO_SESION_EXPIRADA } from '../services/apiEvents.js'
import { conectarTiempoRealUsuario, EVENTO_TIEMPO_REAL } from '../services/tiempoRealService.js'
import { obtenerPaginaSistema } from './paginasSistema.js'
import { EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS } from '../features/seguridad/services/paginaSistemaService.js'

const PlaceholderPage = lazy(() => import('../features/modulos/pages/PlaceholderPage.jsx').then((m) => ({ default: m.PlaceholderPage })))
const CargaMasivaUsuariosPage = lazy(() => import('../features/seguridad/pages/CargaMasivaUsuariosPage.jsx').then((m) => ({ default: m.CargaMasivaUsuariosPage })))

const leerJsonLocal = (clave, respaldo) => { try { return JSON.parse(localStorage.getItem(clave)) || respaldo } catch { return respaldo } }
const obtenerPrimeraFuncion = (menuItems) => menuItems.flatMap((grupo) => grupo.subItems || [])[0] || null
const clavesCompatibilidad = { DASHBOARD: 'DashboardPage', 'SEGURIDAD-USUARIOS': 'UsuariosPage', 'SEGURIDAD-MENUS': 'MenusPage', 'SEGURIDAD-SUBMENUS': 'SubmenusPage', 'SEGURIDAD-ROLES': 'RolesPage', 'INSTITUCIONAL-SEDES': 'SedesPage', 'INSTITUCIONAL-UNIDADES': 'UnidadesPage', 'INSTITUCIONAL-CARRERAS-AREAS': 'CarrerasAreasPage', 'INSTITUCIONAL-CAMPOS-AMPLIOS': 'CamposAmpliosPage', 'INTEGRACIONES-CONFIG': 'IntegracionesPage', 'NOTIFICACIONES-COMUNICADOS': 'CampaniasNotificacionPage', 'NOTIFICACIONES-ACCESO': 'NotificacionesUsuariosPage', 'NOTIFICACIONES-PLANTILLAS': 'PlantillasCorreoPage', 'NOTIFICACIONES-HISTORIAL': 'HistorialNotificacionesPage' }

function SistemaRoutes() {
  const [token, setToken] = useState(() => localStorage.getItem('base_token'))
  const [usuario, setUsuario] = useState(() => leerJsonLocal('base_usuario', null))
  const [menuItems, setMenuItems] = useState(() => leerJsonLocal('base_menu', []))
  const [vistaActual, setVistaActual] = useState(() => localStorage.getItem('base_vista_actual') || 'DASHBOARD')
  const [referenciaProceso, setReferenciaProceso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(null)
  const [navegando, setNavegando] = useState(false)
  const funciones = useMemo(() => menuItems.flatMap((grupo) => grupo.subItems || []), [menuItems])
  const funcionActual = funciones.find((funcion) => funcion.id_menu === vistaActual) || obtenerPrimeraFuncion(menuItems)
  const clavePagina = funcionActual?.clave_pagina || clavesCompatibilidad[funcionActual?.id_menu]
  const VistaActual = referenciaProceso?.tipo === 'CARGA_MASIVA_USUARIOS' ? CargaMasivaUsuariosPage : (obtenerPaginaSistema(clavePagina) || PlaceholderPage)

  const limpiarSesion = useCallback(() => { localStorage.removeItem('base_token'); localStorage.removeItem('base_usuario'); localStorage.removeItem('base_menu'); localStorage.removeItem('base_vista_actual'); setToken(null); setUsuario(null); setMenuItems([]); setVistaActual('DASHBOARD'); setReferenciaProceso(null) }, [])

  useEffect(() => {
    const sesionExpirada = () => { limpiarSesion(); setError('') }
    const accesoDenegado = (evento) => setAviso({ severidad: 'warning', mensaje: evento.detail?.mensaje || 'No tienes permiso para realizar esta acción.' })
    window.addEventListener(API_EVENTO_SESION_EXPIRADA, sesionExpirada); window.addEventListener(API_EVENTO_ACCESO_DENEGADO, accesoDenegado)
    return () => { window.removeEventListener(API_EVENTO_SESION_EXPIRADA, sesionExpirada); window.removeEventListener(API_EVENTO_ACCESO_DENEGADO, accesoDenegado) }
  }, [limpiarSesion])

  const refrescarUsuario = useCallback(() => {
    if (!token) return Promise.resolve()
    return obtenerUsuarioActual().then((datos) => { setUsuario(datos.usuario); setMenuItems(datos.menuItems || []); localStorage.setItem('base_usuario', JSON.stringify(datos.usuario)); localStorage.setItem('base_menu', JSON.stringify(datos.menuItems || [])) }).catch(limpiarSesion)
  }, [token, limpiarSesion])
  useEffect(() => { refrescarUsuario() }, [refrescarUsuario])
  useEffect(() => {
    if (!token || !usuario?.id) return undefined
    return conectarTiempoRealUsuario(usuario.id)
  }, [token, usuario?.id])
  useEffect(() => {
    window.addEventListener(EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS, refrescarUsuario)
    return () => window.removeEventListener(EVENTO_PAGINAS_SISTEMA_ACTUALIZADAS, refrescarUsuario)
  }, [refrescarUsuario])
  useEffect(() => {
    const actualizarMenu = (evento) => {
      if (evento.detail?.tipo !== 'MENU_ACTUALIZADO') return

      const usuarioDestino = Number(evento.detail?.datos?.usuario_id || 0)
      if (!usuarioDestino || usuarioDestino === Number(usuario?.id)) refrescarUsuario()
    }
    window.addEventListener(EVENTO_TIEMPO_REAL, actualizarMenu)
    return () => window.removeEventListener(EVENTO_TIEMPO_REAL, actualizarMenu)
  }, [refrescarUsuario, usuario?.id])
  useEffect(() => {
    if (!menuItems.length || funciones.some((funcion) => funcion.id_menu === vistaActual)) return
    const primeraFuncion = obtenerPrimeraFuncion(menuItems)
    const nuevaVista = primeraFuncion?.id_menu || 'DASHBOARD'
    setVistaActual(nuevaVista)
    localStorage.setItem('base_vista_actual', nuevaVista)
  }, [funciones, menuItems, vistaActual])
  useEffect(() => { if (!navegando) return undefined; const temporizador = window.setTimeout(() => setNavegando(false), 350); return () => window.clearTimeout(temporizador) }, [vistaActual, navegando])

const procesarLogin = async (credenciales) => {
    setCargando(true); setError('')
    try { const datos = await iniciarSesion(credenciales); const primeraFuncion = obtenerPrimeraFuncion(datos.menuItems || []); localStorage.setItem('base_token', datos.token); localStorage.setItem('base_usuario', JSON.stringify(datos.usuario)); localStorage.setItem('base_menu', JSON.stringify(datos.menuItems || [])); localStorage.setItem('base_vista_actual', primeraFuncion?.id_menu || 'DASHBOARD'); setToken(datos.token); setUsuario(datos.usuario); setMenuItems(datos.menuItems || []); setVistaActual(primeraFuncion?.id_menu || 'DASHBOARD') } catch (err) { setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión. Revisa tus credenciales.') } finally { setCargando(false) }
  }
  const procesarLogout = async () => { try { await cerrarSesion() } finally { limpiarSesion() } }
  const navegar = (funcion) => { setReferenciaProceso(null); if (funcion.id_menu === vistaActual) return; setNavegando(true); setVistaActual(funcion.id_menu); localStorage.setItem('base_vista_actual', funcion.id_menu) }
  const navegarAviso = (avisoSeleccionado) => {
    if (!avisoSeleccionado?.vista) return
    const funcion = funciones.find((item) => item.id_menu === avisoSeleccionado.vista)
    if (!funcion) return
    setReferenciaProceso({ tipo: avisoSeleccionado.referencia_tipo, id: avisoSeleccionado.referencia_id, nonce: Date.now() })
    if (funcion.id_menu !== vistaActual) { setNavegando(true); setVistaActual(funcion.id_menu); localStorage.setItem('base_vista_actual', funcion.id_menu) }
  }

  useEffect(() => {
    const fnNavegar = (e) => {
      const { id_menu } = e.detail;
      const f = funciones.find(x => x.id_menu === id_menu);
      if (f) navegar(f);
    };
    window.addEventListener('APP_NAVEGAR', fnNavegar);
    return () => window.removeEventListener('APP_NAVEGAR', fnNavegar);
  }, [funciones, navegar]);

  if (!token) return <LoginPage cargando={cargando} error={error} onLogin={procesarLogin} />
  const propsVista = referenciaProceso?.tipo === 'CARGA_MASIVA_USUARIOS'
    ? { cargaInicialId: referenciaProceso.id, onVolver: () => setReferenciaProceso(null) }
    : { funcion: funcionActual, referenciaProceso }

  return <><AppLayout menuItems={menuItems} vistaActual={funcionActual?.id_menu} tituloVista={funcionActual?.nombre} usuario={usuario} navegando={navegando} onNavigate={navegar} onLogout={procesarLogout} onAvisoNavigate={navegarAviso}><Suspense fallback={navegando ? null : <LoadingState texto="Cargando módulo..." />}><VistaActual {...propsVista} /></Suspense></AppLayout><NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.severidad || 'info'} duracion={5000} onClose={() => setAviso(null)} /></>
}

export function AppRoutes() { return <SistemaRoutes /> }
