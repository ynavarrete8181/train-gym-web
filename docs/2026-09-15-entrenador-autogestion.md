# Entrenador - Mis deportistas y Mi agenda

Fecha: 2026-09-15

Se incorporan dos páginas del Sistema Base para el trabajo diario del entrenador:

- `MisDeportistasPage`
- `MiAgendaEntrenadorPage`

Ambas reutilizan el componente compartido `TrabajoEntrenadorPanel.jsx` y los estilos/componentes existentes de Material UI y `PageHeader`.

El frontend no decide el acceso por nombre de rol. Consume endpoints protegidos por backend:

- `/base/gimnasio/mi-entrenamiento/deportistas`
- `/base/gimnasio/mi-entrenamiento/agenda`

`gimnasioServicio.js` expone:

- `obtenerMisDeportistasEntrenador()`
- `obtenerMiAgendaEntrenador()`

La navegación se genera desde los permisos efectivos `ENTRENADOR-MIS-DEPORTISTAS` y `ENTRENADOR-MI-AGENDA` registrados en backend.

`Mis deportistas` presenta únicamente asignaciones activas del entrenador autenticado, con deportista, código, servicio, sede, días, horario y estado.

`Mi agenda` presenta únicamente horarios activos asignados al entrenador autenticado, con horario, servicio, sede, días, hora y capacidad.

No se reutilizan las pantallas administrativas de Clientes ni Horarios para evitar conceder acciones de edición, desactivación o eliminación a un entrenador.
