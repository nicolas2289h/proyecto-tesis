# Changelog Frontend

## Estructura Inicial
- Configuración del proyecto con Vite, React y TypeScript.
- Integración de Tailwind CSS para el diseño.
- Configuración de React Router para la navegación.
- Tipado estricto TypeScript con interfaces centralizadas en `types/Supermercado.ts`: `Supermercado`, `ProductoBusqueda`, `ApiResponse<T>`, `ListaCompra`, `ItemLista`, `ListaCompraDetalle`, `ProductoOptimo`, `TiendaOptima`, `OptimizacionCompra`.
- Rutas definidas: `/home`, `/mis-listas`, `/mis-listas/:id` (detalle), `/login`, `/registro`, wildcard redirige a `/home`.

## Autenticación y Seguridad
- Implementado sistema de Login (`/login`) y Registro (`/registro`).
- Validación cliente en formularios: formato de email (regex), contraseña mínima 6 caracteres, coincidencia de contraseñas en registro, campos obligatorios.
- Manejo de errores de API con banners visuales (error-banner) y estados `submitting` para deshabilitar botones durante peticiones.
- Configurado Axios con interceptores para adjuntar automáticamente el token JWT en las peticiones (`Bearer token`).
- Configuración base URL: `http://localhost:8080/api/v1`.
- Implementado `authStore` con Zustand para la gestión persistente del estado del usuario y el token en `localStorage`.
- Creado componente `ProtectedRoute` para restringir el acceso a rutas privadas si no hay un token válido.
- **Auto-login Demo**: Componente `DemoAutoLogin` con flag `MOCK_ENABLED = false` por defecto (desactivado) para que no pise tokens JWT reales del backend. Activa `MOCK_ENABLED = true` localmente si no tenés backend corriendo.

## Capa de API Modularizada (alineada con endpoints del backend)
- `api/axios.ts`: Instancia Axios centralizada con interceptor de token.
- `api/productoApi.ts`: Endpoint `buscar(nombre?, supermercadoId?)` → `GET /precios/buscar` con filtros por query params + **normalizador robusto `normalizeProducto`** que acepta distintos nombres de campos (`id`/`productoId`/`productoMaestroId`, `precio`/`precioActual`, `nombreSupermercado`/`supermercado`/`supermercadoNombre`, `nombreGenerico`/`nombre`, `descripcion`). Filtra resultados inválidos.
- `api/supermercadoApi.ts`: Endpoint `getAll()` → `GET /supermercados` con normalización (`id`, `nombre`, `urlBase`) y filtrado de IDs inválidos.
- `api/listaApi.ts`: Módulo completo con:
  - `getAll()` → `GET /listas` (todas las listas del usuario con detalle e ítems).
  - `getById(id)` → `GET /listas/:id`.
  - `create(nombreLista, favorita)` → `POST /listas`.
  - `update(id, nombreLista, favorita)` → `PUT /listas/:id`.
  - `remove(id)` → `DELETE /listas/:id`.
  - `toggleFavorita(id)` → `PATCH /listas/:id/favorita`.
  - `addItem(listaId, productoId, cantidad)` → `POST /listas/:listaId/items`.
  - `getItems(listaId)` → `GET /listas/:listaId/items`.
  - `updateItem(listaId, itemId, productoId, cantidad)` → `PUT /listas/:listaId/items/:itemId`.
  - `removeItem(listaId, itemId)` → `DELETE /listas/:listaId/items/:itemId`.
  - `getCircuitoOptimo(id)` → `GET /listas/:id/circuito-optimo`.

## Módulo de Inicio (Home) — Grilla de productos desde la base de datos
- **Sin datos mock**: Eliminados `MOCK_PRODUCTS` y `MOCK_SUPERMARKETS`. El Home trae productos reales desde la base de datos mediante `GET /precios/buscar`.
- **Flujo de carga**:
  1. Carga inicial paralela (`Promise.all`): `supermercadoApi.getAll()` + `listaApi.getAll()` para supermercados y listas.
  2. `fetchProducts()` dispara `productoApi.buscar(nombre?, supermercadoId?)` con los filtros del usuario.
- **Búsqueda SERVER-SIDE con debounce 400ms**: Al escribir en el input, el término se envía como query param `nombre` al backend (no se filtra en cliente). Evita requests spam mientras tipeás.
- **Filtro por supermercado SERVER-SIDE**: Ahora el select usa el `id` real del supermercado y envía `supermercadoId` al endpoint (antes comparaba strings de nombre). Opción "Todos" = sin filtro.
- **Ordenamiento por precio CLIENTE**: selector Por defecto / Menor a Mayor / Mayor a Menor aplicado sobre los resultados ya filtrados del backend.
- **Skeleton de carga animado**: 6 tarjetas shimmer mientras carga el Home inicial (reemplaza el texto "Cargando productos...").
- **Estado "Buscando..."** en el contador de resultados para búsqueda/filtros asíncronos (para distinguir del loading inicial).
- **Banner de error + botón Reintentar** cuando falla la conexión al backend.
- **Contador de resultados**: "Mostrando X productos filtrados" cuando hay búsqueda/filtro activos.
- **Cuadrícula responsive `grid-template-columns: repeat(auto-fill, minmax(270px, 1fr))`** con gap 1.75rem, max-width 1400px centrado.
- Cada tarjeta: imagen `object-fit: cover` con `loading="lazy"` + **fallback doble con dataset `fallback` para evitar loops** si falla la URL, badge de supermercado, marca en uppercase, nombre (altura mínima 2.8rem), descripción truncada 3 líneas, precio formateado `es-AR` + botón "Agregar".
- Hover en tarjeta: `translateY(-6px)` + sombra suave.
- Key única `producto.id + nombreSupermercado` para evitar colisiones (mismo producto maestro en distintas tiendas).

## Agregar Producto a Lista (desde Home)
- Modal emergente al hacer click en "Agregar" en cualquier tarjeta de producto.
- Vista previa del producto: imagen, nombre, marca, supermercado y precio.
- Caso sin listas: aviso amarillo con botón directo para "Crear mi primera lista" (navega a `/mis-listas`).
- Caso con listas: selector desplegable de listas disponibles (muestra ⭐ en favoritas) + input numérico de cantidad (mínimo 1).
- Confirmación asíncrona con `listaApi.addItem()` + estado `adding` para deshabilitar botones.
- Mensaje de éxito verde ("✅ producto agregado correctamente.") y auto-cierre del modal a los 1.2s.
- Cierre del modal al hacer click fuera (overlay).
- Icono de carrito 🛒 en navbar (placeholder UI).

## Módulo de Mis Listas
- Sección `/mis-listas` con datos reales consumidos desde `listaApi.getAll()`.
- **CRUD completo** refactorizado usando `listaApi`:
  - Crear lista: `listaApi.create(nombre, favorita)` con formulario inline.
  - Editar lista: `listaApi.update(id, ...)` con scroll suave al top + stopPropagation para no abrir detalle.
  - Eliminar lista: `listaApi.remove(id)` con confirmación `alert()`.
  - Listar todas: `listaApi.getAll()` → `ListaCompraDetalle[]` con items y total estimado.
- **Sistema de favoritos**: `listaApi.toggleFavorita(id)` con actualización optimista + rollback en caso de error.
- Highlight visual en listas favoritas (borde dorado `#fbbf24` y estrella rellena ⭐).
- Fecha de creación formateada con `toLocaleDateString()` **+ cantidad de productos + total estimado** en el subtítulo de cada tarjeta.
- **Navegación al detalle**: clickear cualquier parte de la tarjeta navega a `/mis-listas/:id` (excluye los botones Editar/Eliminar/Estrella mediante `stopPropagation`).
- Estados de carga (`Cargando listas...`), error banner y vacío con emoji 📋 + mensaje.
- Efectos hover en tarjetas de lista (`translateY(-2px)`) y cursor pointer.

## Módulo de Detalle de Lista y Optimización de Compra
- Página `ListDetail.tsx` **conectada por ruta** en App.tsx: `/mis-listas/:id` (dentro de ProtectedRoute + Layout).
- Consume datos reales con `listaApi.getById(id)` y `listaApi.getCircuitoOptimo(id)`.
- Encabezado con botón "← Volver", título de la lista + estrella favorita y **botón "+ Agregar productos"** que navega a `/home`.
- Tabla de items responsive con `overflowX: auto` + nuevas columnas: Supermercado.
- Precios formateados con `toLocaleString('es-AR')`.
- **Eliminar item**: `listaApi.removeItem(listaId, itemId)` con confirmación y reset del resultado de optimización.
- Botón **"🚀 Optimizar Compra"** que llama a `getCircuitoOptimo()` con estado `Optimizing...`.
- **Visualización de resultados de optimización** (tarjeta verde con borde):
  - Tarjetas resumen: Total Óptimo, Ahorro Total (verde), Total más caro (rojo).
  - **📍 Hoja de Ruta**: Desglose por supermercado con los productos a comprar en cada tienda y subtotal por tienda (borde izquierdo verde).
  - **⚠️ Productos sin precio**: Aviso naranja con lista de productos sin precio disponible en ningún supermercado.
- Precios formateados con separador de miles `es-AR`.

## Sistema de Tema Claro / Oscuro
- Implementado mediante atributo `data-theme` en `<html>` y variables CSS centralizadas.
- **Tema Claro** (`:root`): brand-blue `#8ca4b8`, brand-peach `#fcece4`, fondo `#f1f3f5`, texto `#2b3a67`.
- **Tema Oscuro** (`[data-theme='dark']`): brand-blue `#5d7a96`, brand-peach `#2d2d3a`, fondo `#121212`, texto `#e0e0e0`, sombras más marcadas.
- Persistencia del tema en `localStorage.getItem('theme')`.
- Toggle en navbar con iconos 🌙/☀️ y animación `scale(1.1)` en hover.
- Transiciones CSS globales smooth (0.3s) en background-color, color, border-color y box-shadow.

## Componentes de Layout y Navegación
- **`Layout.tsx`**: Wrapper de páginas protegidas que incluye Navbar + fondo del tema.
- **`Navbar.tsx`**: Barra de navegación sticky (`top:0, z-index:100`) con:
  - Logo "AhorraYa" con imagen `/Image/Logo.png`.
  - Enlaces directos: Inicio (`/home`), Mis Listas (`/mis-listas`).
  - Acciones: Toggle tema 🌙/☀️, Carrito 🛒 (cierre automático al hacer click fuera).
  - **Información del usuario en sesión**: Avatar circular con la inicial del nombre + nombre completo visible. Tooltip con el email del usuario. Fallback al email si no hay nombre. Diseño tipo "pill" con fondo translúcido.
  - Botón "Salir" con logout y redirección a `/login`.
  - Diseño responsive: oculta el nombre del logo y el nombre del usuario en pantallas menores a 600px (solo muestra el avatar).

## Mejoras de Interfaz (UI/UX)
- Navegación mejorada en el navbar con enlaces directos.
- Manejo de estados de carga (`loading`) y errores de API con `alert()` y mensajes amigables.
- Estilos consistentes usando variables CSS centralizadas.
- Formularios reutilizables: clases `.container`, `.title`, `.subtitle`, `.field`, `.label`, `.input`, `.btn`, `.error`, `.switch`, `.link`, `.btn-secondary`.
- Botones con estados: hover (`brightness(1.1)`), active (`scale(0.98)`), disabled (`background: #ced4da, cursor: not-allowed`).
- Responsive design con media queries (breakpoint 600px).
- Formateo uniforme de precios argentinos: `toLocaleString('es-AR')` en todo el front.
