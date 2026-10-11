# Convenciones globales de interfaz — Revive

Fecha de actualización: 2026-09-22

Estas reglas deben aplicarse en las vistas nuevas y en las refactorizaciones para mantener consistencia con el sistema base.

## Encabezado principal de vista

El primer `Paper` de una vista se reserva para el encabezado de página mediante `PageHeader`.

Debe contener únicamente:

- Título funcional de la vista.
- Descripción breve de la finalidad de la vista.
- Icono representativo.
- Botón `Volver` cuando la navegación interna lo requiera.

Ejemplo correcto:

- Título: `Configuración del entrenador`
- Descripción: `Consulta servicios, sedes, horarios y excepciones del entrenador.`
- Acción: `Volver`

### No duplicar datos de la entidad en el encabezado

El nombre de la persona, cliente, entrenador, membresía u otra entidad pertenece al contenido de la ficha y no debe repetirse como título del `PageHeader` cuando ya se presenta dentro del cuerpo.

Incorrecto:

- Encabezado: `Daniel Palma`
- Cuerpo: `Daniel Palma`

Correcto:

- Encabezado: `Configuración del entrenador`
- Cuerpo: `Daniel Palma · COACH · Activo`

## Acciones del PageHeader

Las acciones operativas como `Editar`, `Eliminar`, `Asignar`, `Cobrar`, etc. no deben agregarse al encabezado por defecto.

El encabezado debe mantenerse limpio. Las acciones de gestión deben ubicarse en el contenido, toolbar o sección correspondiente, salvo que exista un patrón global explícito del sistema base que indique lo contrario.

## Componentes globales

Cuando un patrón se repita en varios módulos:

1. Reutilizar componentes comunes existentes.
2. Evitar estilos locales duplicados.
3. Si el patrón aún no existe, crear un componente común o token global antes de copiarlo en múltiples vistas.
4. Documentar la nueva convención en este archivo.

Componentes base prioritarios:

- `PageHeader`
- `BotonVolver`
- `GestionToolbar`
- `TablaGestion`
- `AccionesFormulario`
- `StatusChip`


## Estructura de módulos frontend

Las páginas nuevas deben actuar como contenedores de coordinación y no concentrar tablas, formularios, diálogos y reglas visuales en un solo archivo.

Patrón recomendado:

```
src/features/<modulo>/
├── pages/
│   └── <Vista>Page.jsx
├── components/
│   └── <submodulo>/
├── services/
│   └── <submodulo>Servicio.js
└── config/
    └── <submodulo>Config.js
```

Reglas:

1. `pages/` coordina carga, estado, navegación interna y composición.
2. `components/` contiene tablas, formularios, diálogos y bloques reutilizables.
3. `services/` concentra las llamadas HTTP del submódulo; evitar mezclar endpoints no relacionados en un servicio general cuando el dominio ya tiene entidad propia.
4. `config/` contiene formateadores, catálogos visuales y configuración estática del submódulo cuando sea necesario.
5. Los estados visuales deben reutilizar `StatusChip` y los estilos de `dbanuStyles` antes de definir estilos locales.
6. Las reglas de negocio, permisos, alcance por sede y validaciones permanecen en backend; el frontend renderiza y captura datos.

## Criterio general

La interfaz debe conservar:

- jerarquía visual clara;
- una sola fuente de verdad para títulos y acciones;
- mínimo contenido repetido;
- navegación interna consistente;
- estilos compartidos en lugar de estilos aislados por módulo.
