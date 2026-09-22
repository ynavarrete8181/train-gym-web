import { apiClient as api } from '../../../services/apiClient.js';

export const gimnasioServicio = {
  obtenerUsuarios: async (parametros = {}) => {
    const esCatalogoDeportistas = String(parametros?.rol || '').toUpperCase() === 'DEPORTISTA';
    const endpoint = esCatalogoDeportistas
      ? '/base/gimnasio/clientes/usuarios-disponibles'
      : '/base/seguridad/usuarios';
    const { data } = await api.get(endpoint, { params: esCatalogoDeportistas ? {} : parametros });
    return data;
  },
  obtenerEstructuraOperativa: async () => {
    const { data } = await api.get('/base/institucional/estructura');
    return data;
  },

  // --- Entrenadores ---
  obtenerEntrenadores: async (parametros) => {
    const { data } = await api.get('/base/gimnasio/entrenadores', { params: parametros });
    return data;
  },
  obtenerTurnosEntrenador: async (entrenadorId, sedeId = null) => {
    const { data } = await api.get(`/base/gimnasio/entrenadores/${entrenadorId}/turnos`, { params: sedeId ? { sede_id: sedeId } : {} });
    return data;
  },
  obtenerHorariosDisponiblesEntrenador: async (entrenadorId) => {
    const { data } = await api.get(`/base/gimnasio/entrenadores/${entrenadorId}/horarios-disponibles`);
    return data;
  },
  asignarHorarioEntrenador: async (entrenadorId, horarioBloqueId) => {
    const { data } = await api.post(`/base/gimnasio/entrenadores/${entrenadorId}/turnos`, { horario_bloque_id: horarioBloqueId });
    return data;
  },
  eliminarTurnoEntrenador: async (entrenadorId, horarioBloqueId) => {
    const { data } = await api.delete(`/base/gimnasio/entrenadores/${entrenadorId}/turnos/${horarioBloqueId}`);
    return data;
  },
  obtenerMisDeportistasEntrenador: async () => {
    const { data } = await api.get('/base/gimnasio/mi-entrenamiento/deportistas');
    return data;
  },
  obtenerMiAgendaEntrenador: async () => {
    const { data } = await api.get('/base/gimnasio/mi-entrenamiento/agenda');
    return data;
  },

  // --- Asignaciones entrenador - cliente ---
  obtenerAsignacionesEntrenador: async (params) => {
    const { data } = await api.get('/base/gimnasio/asignaciones-entrenador', { params });
    return data;
  },
  crearAsignacionEntrenador: async (datos) => {
    const { data } = await api.post('/base/gimnasio/asignaciones-entrenador', datos);
    return data;
  },
  finalizarAsignacionEntrenador: async (id) => {
    const { data } = await api.patch(`/base/gimnasio/asignaciones-entrenador/${id}/finalizar`);
    return data;
  },

  crearEntrenador: async (datos) => {
    const { data } = await api.post('/base/gimnasio/entrenadores', datos);
    return data;
  },
  actualizarEntrenador: async (id, datos) => {
    const { data } = await api.put(`/base/gimnasio/entrenadores/${id}`, datos);
    return data;
  },

  // --- Planes ---
  obtenerPlanes: async (params = {}) => {
    const { data } = await api.get('/base/gimnasio/planes', { params });
    return data;
  },
  obtenerPlanPorId: async (id) => {
    const { data } = await api.get(`/base/gimnasio/planes/${id}`);
    return data;
  },
  crearPlan: async (payload) => {
    const { data } = await api.post('/base/gimnasio/planes', payload);
    return data;
  },
  eliminarPlan: async (id) => {
    const { data } = await api.delete(`/base/gimnasio/planes/${id}`);
    return data;
  },
  actualizarPlan: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/planes/${id}`, payload);
    return data;
  },

  // --- Deportistas ---
  obtenerDeportistas: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/clientes', { params });
    return data;
  },
  obtenerDeportistaPorId: async (id) => {
    const { data } = await api.get(`/base/gimnasio/clientes/${id}`);
    return data;
  },
  crearDeportista: async (payload) => {
    const { data } = await api.post('/base/gimnasio/clientes', payload);
    return data;
  },
  actualizarDeportista: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/clientes/${id}`, payload);
    return data;
  },

  // --- Membresías ---
  obtenerMembresias: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/membresias', { params });
    return data;
  },
  crearMembresia: async (payload) => {
    const { data } = await api.post('/base/gimnasio/membresias', payload);
    return data;
  },
  actualizarMembresia: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/membresias/${id}`, payload);
    return data;
  },
  eliminarMembresia: async (id) => {
    const { data } = await api.delete(`/base/gimnasio/membresias/${id}`);
    return data;
  },

  // --- Configuración de Agenda ---
  obtenerJornadas: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/agenda/jornadas', { params });
    return data;
  },
  crearJornada: async (payload) => {
    const { data } = await api.post('/base/gimnasio/agenda/jornadas', payload);
    return data;
  },
  actualizarJornada: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/agenda/jornadas/${id}`, payload);
    return data;
  },
  obtenerRecesos: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/agenda/recesos', { params });
    return data;
  },
  crearReceso: async (payload) => {
    const { data } = await api.post('/base/gimnasio/agenda/recesos', payload);
    return data;
  },
  actualizarReceso: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/agenda/recesos/${id}`, payload);
    return data;
  },
  obtenerAsignacionesHorario: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/agenda/asignaciones-horario', { params });
    return data;
  },
  obtenerCatalogosAsignacionHorario: async (params = {}) => {
    const { data } = await api.get('/base/gimnasio/agenda/asignaciones-horario/catalogos', { params });
    return data;
  },
  buscarEntrenadoresAgenda: async (params = {}) => {
    const { data } = await api.get('/base/gimnasio/agenda/asignaciones-horario/entrenadores', { params });
    return data;
  },
  crearAsignacionHorario: async (payload) => {
    const { data } = await api.post('/base/gimnasio/agenda/asignaciones-horario', payload);
    return data;
  },
  actualizarAsignacionHorario: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/agenda/asignaciones-horario/${id}`, payload);
    return data;
  },

  // --- Operación de Agenda ---
  obtenerCatalogosAgenda: async () => {
    const { data } = await api.get('/base/gimnasio/agenda/catalogos-operacion');
    return data;
  },
  obtenerDisponibilidadAgenda: async (params) => {
    const { data } = await api.get('/base/gimnasio/agenda/disponibilidad', { params });
    return data;
  },
  obtenerReservasAgenda: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/agenda/reservas', { params });
    return data;
  },
  obtenerExcepcionesAgenda: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/agenda/excepciones', { params });
    return data;
  },
  crearExcepcionAgenda: async (payload) => {
    const { data } = await api.post('/base/gimnasio/agenda/excepciones', payload);
    return data;
  },
  actualizarExcepcionAgenda: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/agenda/excepciones/${id}`, payload);
    return data;
  },

  // --- Servicios y Agenda ---
  obtenerCategoriasServicio: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/categorias-servicio', { params });
    return data;
  },
  crearCategoriaServicio: async (payload) => {
    const { data } = await api.post('/base/gimnasio/categorias-servicio', payload);
    return data;
  },
  actualizarCategoriaServicio: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/categorias-servicio/${id}`, payload);
    return data;
  },
  obtenerServicios: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/servicios', { params });
    return data;
  },
  crearServicio: async (payload) => {
    const { data } = await api.post('/base/gimnasio/servicios', payload);
    return data;
  },
  actualizarServicio: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/servicios/${id}`, payload);
    return data;
  },
  obtenerHorarios: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/horarios', { params });
    return data;
  },
  crearHorario: async (payload) => {
    const { data } = await api.post('/base/gimnasio/horarios', payload);
    return data;
  },
  actualizarHorario: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/horarios/${id}`, payload);
    return data;
  },
  obtenerDetalleHorario: async (id) => {
    const { data } = await api.get(`/base/gimnasio/horarios/${id}/detalle`);
    return data;
  },
  desactivarHorario: async (id) => {
    const { data } = await api.patch(`/base/gimnasio/horarios/${id}/desactivar`);
    return data;
  },
  eliminarHorario: async (id) => {
    const { data } = await api.delete(`/base/gimnasio/horarios/${id}`);
    return data;
  },
  obtenerReservasDia: async (params = { page: 1 }) => {
    const { data } = await api.get('/base/gimnasio/reservas-dia', { params });
    return data;
  },
  crearReservaDia: async (payload) => {
    const { data } = await api.post('/base/gimnasio/reservas-dia', payload);
    return data;
  },
  actualizarReservaDia: async (id, payload) => {
    const { data } = await api.put(`/base/gimnasio/reservas-dia/${id}`, payload);
    return data;
  },
};
