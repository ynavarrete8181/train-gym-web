# Clientes - ficha comercial por rol

Fecha: 2026-09-15

## Contexto

Durante la validación del usuario Karol Cajero con rol `SUPERVISOR DE VENTAS`, la ficha de Clientes abría correctamente pero el frontend intentaba cargar también APIs de Entrenadores, Progreso y Entrenamiento. Esos accesos no forman parte de la matriz del Supervisor de Ventas y el middleware devolvía 403, mostrando el aviso global `No tienes permiso para realizar esta acción`.

## Ajuste aplicado

Se creó una vista comercial específica para `SUPERVISOR DE VENTAS`:

- listado de Clientes;
- ficha con pestaña `Datos del cliente`;
- ficha con pestaña `Membresía`;
- edición de datos comerciales permitidos;
- consulta de membresías ya asociadas al cliente;
- no se ejecutan llamadas a Entrenadores, Progreso ni Entrenamiento.

La página `ClientesRouterPage` decide qué vista usar a partir del rol almacenado en `base_usuario`:

- `SUPERVISOR DE VENTAS` -> `ClientesSupervisorPage`;
- demás roles -> `DeportistasPage` existente.

`paginasSistema.js` mantiene la clave registrada `DeportistasPage`, pero la resuelve mediante el router de Clientes para no alterar los bindings de páginas existentes en base de datos.

## Criterio de seguridad

No se otorgaron nuevos permisos deportivos al Supervisor de Ventas. La corrección se realiza en la capa de presentación para que el frontend no solicite recursos que el rol no está autorizado a consultar.

## Pendiente

La creación/renovación completa de membresías desde esta ficha comercial se revisará cuando se dividan permisos de lectura/escritura para Planes y Membresías. Por ahora el Supervisor puede consultar las membresías asociadas sin ampliar acceso a configuración de planes.
