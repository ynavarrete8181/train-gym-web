# Revive Web

Frontend administrativo React/Vite para el Revive.

## Stack

- React 19
- Vite 8
- Material UI 9
- Axios
- TanStack React Query
- React Hook Form + Yup

## Núcleo funcional

- Login y sesión.
- Layout administrativo.
- Dashboard inicial.
- Gestión de usuarios.
- Gestión de roles.
- Gestión de menús.
- Gestión de submenús y funciones.
- Tema claro/oscuro.

## Organización

Los módulos viven en `src/features`. Los servicios específicos pueden vivir dentro de cada feature y todas las llamadas HTTP deben reutilizar `src/services/apiClient.js`.

Las páginas se cargan de forma diferida para evitar incluir todos los módulos en el paquete inicial.

## Interfaces en preparación

Existen pantallas y servicios cliente para módulos como Institucional, Integraciones y Notificaciones. Mientras su backend, datos y permisos no estén implementados y verificados de extremo a extremo, deben tratarse como scaffolding y no habilitarse en el catálogo de menús de una instalación base.

El estado oficial de cada módulo se documenta en `train-gym-docs/09-estado-modulos.md`.

## Desarrollo local

```bash
npm install
npm run dev
```

Configura la URL del backend en `.env` tomando como referencia `.env.example`.

## Verificación

```bash
npm run lint
npm run build
```
