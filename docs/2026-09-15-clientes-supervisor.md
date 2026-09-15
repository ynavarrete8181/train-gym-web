# Clientes - permisos por backend conservando Sistema Base

Fecha: 2026-09-15

## Contexto

Durante la validación del usuario Karol Cajero con rol `SUPERVISOR DE VENTAS`, la ficha de Clientes abría correctamente pero algunas consultas complementarias devolvían 403. Inicialmente se intentó resolver creando una vista comercial separada por rol. Ese enfoque se descartó porque rompe la convención del proyecto: una misma funcionalidad debe conservar la estructura, componentes y estilos del Sistema Base.

## Criterio definitivo

`DeportistasPage` continúa siendo la única pantalla de Clientes. No se mantienen vistas ni routers alternos por rol.

La autorización se resuelve en backend:

- el frontend conserva la misma estructura visual y únicamente consume/dibuja los datos autorizados;
- las operaciones `GET` necesarias para construir la ficha integral del cliente pueden autorizarse con `GIMNASIO-DEPORTISTAS` además del permiso específico del módulo consultado;
- las operaciones de escritura `POST`, `PUT`, `PATCH` y `DELETE` conservan sus permisos específicos;
- no se abre el endpoint general de Seguridad > Usuarios para roles comerciales;
- se usa un catálogo seguro de usuarios con rol `DEPORTISTA` para la creación de Clientes.

## Cambios aplicados

Se retiraron `ClientesSupervisorPage.jsx` y `ClientesRouterPage.jsx`, y `paginasSistema.js` volvió al registro dinámico estándar del Sistema Base.

`gimnasioServicio.obtenerUsuarios()` usa el endpoint seguro `/base/gimnasio/clientes/usuarios-disponibles` cuando la pantalla solicita usuarios con rol `DEPORTISTA`.

El backend separa lectura y escritura en Planes, Entrenadores, asignaciones y módulos de Entrenamiento para que la ficha pueda consultarse sin conceder capacidades administrativas adicionales.

## Regla para cambios futuros

No crear una segunda página por rol cuando el módulo base ya existe. Primero revisar permisos, rutas, servicios y reglas de negocio del backend. El frontend debe conservar los componentes compartidos, estilos y estructura de carpetas definidos por el Sistema Base.
