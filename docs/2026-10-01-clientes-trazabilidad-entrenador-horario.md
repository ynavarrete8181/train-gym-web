# Clientes — trazabilidad de entrenador y horario

Fecha de actualización: 2026-10-01

Este documento define el flujo estándar de Revive para las asignaciones de entrenador y horario de un cliente/deportista.

## Principio de trazabilidad

Las asignaciones no se sobrescriben.

Cuando un cliente deja de trabajar con un entrenador, cambia de horario o termina el periodo de asignación:

1. La asignación vigente se conserva.
2. Su estado pasa de `ACTIVO` a `FINALIZADO`.
3. Se registra `fecha_fin`.
4. La nueva asignación se crea mediante un registro nuevo.
5. El nuevo registro queda en estado `ACTIVO`.

La tabla operativa e histórica es:

- `entrenamiento.asignaciones_entrenador_cliente`

No se crea una tabla duplicada de historial. La misma tabla conserva la trazabilidad mediante estados y fechas.

## Relación con el horario del entrenador

Las nuevas asignaciones utilizan:

- `entrenador_id`
- `entrenador_horario_id`
- `deportista_id`
- `fecha_inicio`
- `fecha_fin`
- `estado`
- `observaciones`

`entrenador_horario_id` referencia la configuración vigente del entrenador en `agenda.entrenador_horarios`.

El campo histórico `horario_bloque_id` se mantiene solo para compatibilidad con registros anteriores.

## Capacidad

Cada configuración vigente de horario del entrenador posee una capacidad máxima.

La disponibilidad se calcula en backend:

`disponibles = capacidad - asignaciones activas`

La reserva de una hora concreta es un flujo posterior y no debe confundirse con la asignación general cliente-entrenador.

## Interfaz

En la ficha del cliente, pestaña `Entrenador y horario`:

- Nueva asignación.
- Resumen de disponibilidad vigente.
- Tabla de asignaciones activas.
- Tabla de historial de horarios.

Las dos tablas deben utilizar el componente global:

- `TablaGestion`

No se deben construir tablas locales con estilos independientes cuando exista el componente global.

## Reportabilidad

Este modelo permite consultar posteriormente:

- entrenadores históricos por cliente;
- periodos de asignación;
- sede;
- disponibilidad/horario asignado;
- cambios de entrenador;
- cambios de horario;
- duración por entrenador;
- asignaciones vigentes y finalizadas.

## Convención general

Este patrón debe mantenerse alineado con las convenciones globales de interfaz de Revive y con la filosofía de versionado usada en los horarios de entrenadores: el registro anterior se cierra y el nuevo se crea, sin destruir la historia.
