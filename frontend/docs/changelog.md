# Changelog Frontend

## Estructura Inicial
- Configuración del proyecto con Vite, React y TypeScript.
- Integración de Tailwind CSS para el diseño.
- Configuración de React Router para la navegación.

## Autenticación y Seguridad
- Implementado sistema de Login (`/login`) y Registro (`/registro`).
- Configurado Axios con interceptores para adjuntar automáticamente el token JWT en las peticiones.
- Implementado `authStore` con Zustand para la gestión persistente del estado del usuario y el token.
- Creado componente `ProtectedRoute` para restringir el acceso a rutas privadas si no hay un token válido.

## Módulo de Inicio (Home)
- Página principal con buscador de productos.
- Filtros por supermercado y ordenamiento por precio.
- Implementación de un carrito de compras interactivo con persistencia local.
- Soporte para cambio de tema (Claro/Oscuro).

## Módulo de Mis Listas
- Nueva sección `/mis-listas` para la gestión personal de listas de compras.
- Funcionalidades CRUD completas: crear, listar, editar nombre y eliminar listas.
- Sistema de favoritos (estrellas) con actualización en tiempo real en el backend.
- Diseño optimizado para tema oscuro con efectos hover y feedback visual.

## Mejoras de Interfaz (UI/UX)
- Navegación mejorada en el navbar con enlaces directos.
- Manejo de estados de carga (`loading`) y errores de API (`ERR_CONNECTION_REFUSED`, `403 Forbidden`).
- Estilos consistentes usando variables CSS centralizadas.
