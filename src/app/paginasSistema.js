import { lazy } from 'react'

const modulosPagina = import.meta.glob([
  '../features/**/pages/*Page.jsx',
  '!../features/auth/**',
  '!../features/modulos/**',
  '!../features/seguridad/pages/CargaMasivaUsuariosPage.jsx',
])

const nombresPaginas = {
  DashboardPage: 'Dashboard',
  UsuariosPage: 'Usuarios',
  PermisosUsuariosPage: 'Permisos de usuarios',
  MenusPage: 'Menús',
  SubmenusPage: 'Submenús',
  RolesPage: 'Roles y permisos',
  PaginasSistemaPage: 'Páginas del sistema',
  SedesPage: 'Sedes',
  UnidadesPage: 'Facultades / Direcciones',
  CarrerasAreasPage: 'Carreras / Áreas',
  CamposAmpliosPage: 'Campos amplios',
  EstructuraInstitucionalPage: 'Estructura operativa',
  IntegracionesPage: 'Configuración de APIs',
  CampaniasNotificacionPage: 'Campañas y envíos',
  NotificacionesUsuariosPage: 'Invitaciones de acceso',
  PlantillasCorreoPage: 'Plantillas de correo',
  HistorialNotificacionesPage: 'Historial de notificaciones',
  EntrenadoresPage: 'Entrenadores',
  DeportistasPage: 'Clientes',
  PlanesPage: 'Planes de membresía',
  MembresiasPage: 'Asignar membresía',
  CategoriasServicioPage: 'Categorías de servicio',
  ServiciosPage: 'Servicios',
  HorariosPage: 'Horarios',
  ReservasDiaPage: 'Reservas del Día',
  EjerciciosEntrenamientoPage: 'Ejercicios',
  PlanesEntrenamientoPage: 'Planes de entrenamiento',
  RutinasPage: 'Rutinas',
  RegistrosRmPage: 'Registros RM',
  CategoriasInventarioPage: 'Categorías de inventario',
  ProveedoresPage: 'Proveedores',
  ProductosPage: 'Productos',
  MovimientosInventarioPage: 'Movimientos / Kardex',
  CajasPage: 'Cajas',
  VentasPage: 'Ventas',
  PagosPage: 'Pagos',
  ComprobantesPage: 'Comprobantes',
  DispositivosAccesoPage: 'Dispositivos',
  CredencialesAccesoPage: 'Credenciales',
  EventosAccesoPage: 'Eventos',
  AsistenciaPage: 'Asistencia',
  ResumenResultadosPage: 'Resumen operativo',
  ResultadosAsistenciaPage: 'Asistencia',
  ResultadosVentasPage: 'Ventas',
  ResultadosProgresoPage: 'Progreso físico',
  TiposComunicacionPage: 'Tipos',
  SegmentosComunicacionPage: 'Segmentos',
  MensajesComunicacionPage: 'Mensajes',
  ProgramacionesComunicacionPage: 'Programaciones',
  ReportesDisponiblesPage: 'Reportes disponibles',
  HistorialReportesPage: 'Historial de reportes',
  RegistroActividadPage: 'Registro de actividad',
  AccesosSistemaPage: 'Accesos al sistema',
  ResumenAuditoriaPage: 'Resumen de auditoría',
  LogsTecnicosPage: 'Errores del sistema',
}

function claveDesdeRuta(ruta) {
  return ruta.split('/').pop().replace(/\.jsx$/, '')
}

function nombreDesdeClave(clave) {
  return clave
    .replace(/Page$/, '')
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
    .replace(/^./, (letra) => letra.toUpperCase())
}

const entradas = Object.entries(modulosPagina).map(([ruta, cargar]) => {
  const clave = claveDesdeRuta(ruta)
  const Componente = lazy(async () => {
    const modulo = await cargar()
    const vista = modulo[clave]
    if (!vista) throw new Error(`La página ${clave} no exporta un componente con ese nombre.`)
    return { default: vista }
  })

  return [clave, { clave, nombre: nombresPaginas[clave] || nombreDesdeClave(clave), ruta, Componente }]
})

const registroPaginas = Object.fromEntries(entradas)

export const catalogoPaginasSistema = Object.values(registroPaginas)
  .map(({ clave, nombre, ruta }) => ({ clave, nombre, ruta }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

export function obtenerPaginaSistema(clave) {
  return registroPaginas[clave]?.Componente || null
}
