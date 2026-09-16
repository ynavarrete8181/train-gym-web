# Configuración > Estados — alineación con Sistema Base

Fecha: 2026-09-16

## Objetivo

Centralizar los estados funcionales de Revive sin romper las convenciones visuales ni estructurales del Sistema Base.

La pantalla se registra como `EstadosConfiguracionPage` y se mantiene dentro del feature `configuracion` con separación de responsabilidades:

```text
src/features/configuracion/
├── components/
│   └── EstadosConfiguracionTable.jsx
├── pages/
│   └── EstadosConfiguracionPage.jsx
└── services/
    └── configuracionServicio.js
```

No se deben crear tablas, paginadores, filtros ni botones locales cuando ya existe un componente compartido del Sistema Base.

## Regla visual obligatoria del proyecto

Los listados administrativos nuevos deben reutilizar:

- `PageHeader` para encabezado de página;
- `GestionToolbar` para búsqueda, contador y acciones principales;
- `TablaGestion` como contenedor estándar de tabla;
- `FilterHeaderCell` para filtros tipo Excel por columna;
- `PaginacionTabla` a través de `TablaGestion`;
- `TablaEstadoFila` para vacío/carga;
- `StatusChip` para estados visuales;
- `AccionesFormulario`, `BotonGuardar` y `BotonCancelar` en formularios;
- `dbanuStyles.actionEdit` para editar;
- `dbanuStyles.actionDelete` para desactivar/eliminar;
- `dbanuStyles.addButtonRevive` para la acción Añadir.

La paginación inicial de los catálogos administrativos es de **5 registros**, con opciones compartidas **5, 10, 25 y 50**.

## Estados — estructura funcional

El catálogo distingue:

- `codigo`: identificador global estable, por ejemplo `MEM_PENDIENTE_PAGO`;
- `entidad`: dominio funcional, por ejemplo `MEMBRESIA`, `VENTA`, `PAGO`;
- `valor_interno`: valor persistido actualmente por la tabla de negocio, por ejemplo `PENDIENTE_PAGO`;
- `nombre`: texto visible configurable, por ejemplo `Pendiente de pago`;
- `color`: semántica visual;
- `orden`;
- `activo`;
- `es_inicial`;
- `es_final`;
- `protegido_sistema`.

Los estados protegidos permiten cambiar presentación, pero no su código, entidad ni valor interno porque las reglas de negocio pueden depender de esos valores.

## Tabla Estados

La tabla utiliza filtros tipo Excel en los encabezados de:

- Código;
- Entidad;
- Valor interno;
- Nombre visible;
- Color;
- Inicial;
- Final;
- Protegido;
- Estado.

La búsqueda general y los filtros se procesan en servidor. La API devuelve metadatos de paginación y `opciones_filtro`, igual que los demás catálogos del Sistema Base.

## Regla para desarrollo futuro

Antes de crear una vista administrativa nueva:

1. revisar componentes existentes en `src/components/common` y `src/components/tables`;
2. copiar el patrón estructural de un módulo ya validado, no su código de negocio;
3. iniciar listados en 5 registros por página;
4. incorporar filtros de encabezado cuando la columna sea filtrable;
5. mantener estilos y acciones centralizados en `dbanuStyles`;
6. documentar decisiones y pendientes en `docs/` al cerrar cada bloque funcional.

Esta regla aplica a los futuros catálogos de Métodos de pago, Tipos de documento, parámetros y numeraciones.
