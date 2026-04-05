# Historial de tareas ejecutadas

## Seguridad y autenticación
- Añadidas dependencias de Spring Security y JWT en pom.xml.
- Implementado JwtService para generar/validar tokens.
- Creado JwtAuthenticationFilter para procesar Authorization Bearer.
- Configurado SecurityConfig: stateless, filtros y rutas públicas.
- Endpoint de login: POST /api/v1/auth/login (AuthController + AuthService/Impl).
- Refactor: lógica de login movida a AuthService/Impl.
- Creado paquete dto y DTOs de autenticación (LoginRequestDto, LoginResponseDto).
- Se habilitó CORS para React y se activó en SecurityConfig.
- **Corrección**: Actualizado `JwtAuthenticationFilter` para manejar correctamente el prefijo `ROLE_` en los roles del token, solucionando errores 403 (Forbidden).

## Modelo y persistencia
- Entidades JPA: Usuario, Rol, UsuarioRol.
- Entidades del Módulo de Catálogo Maestro: Categoria, Supermercado, Producto, ProductoTienda.
- Entidades del Módulo de Precios: HistorialPrecio (Series de tiempo).
- Entidades del Módulo de Listas de Compras: ListaCompra (actualizada con campo `favorita`), ItemLista.
- Repositorios JPA: UsuarioRepository, RolRepository, UsuarioRolRepository, ListaCompraRepository.
- Método existsByUsuarioAndRol en UsuarioRolRepository para evitar duplicados.

## Usuarios y roles
- UsersController con endpoints:
  - POST /api/v1/usuarios (registro público).
  - GET /api/v1/usuarios (listado con JWT).
  - POST /api/v1/usuarios/{id}/roles (asignación de rol).
  - POST /api/v1/usuarios/roles (crear rol).
  - GET /api/v1/usuarios/roles (listar roles).
- UsuarioService/Impl: registrar, listar, asignarRol, crearRol, listarRoles.
- DTOs para usuarios: UsuarioCreateDto, UsuarioDto, AssignRoleDto, RolDto.
- ApiResponse agregado para estandarizar respuestas con status numérico, message y data.
- **Mejora**: `UsuarioDto` ahora incluye la lista de roles del usuario.

## Mis Listas 
- Creado `ListaCompraController` con CRUD completo para la gestión de listas personales.
- Implementado `ListaCompraService` y `ListaCompraServiceImpl` con lógica de negocio y validación de propietario.
- Añadidos DTOs: `ListaCompraDto` y `ListaCompraCreateDto`.
- Endpoint `PATCH /api/v1/listas/{id}/favorita` para marcar listas destacadas.
- Integración de `Principal` en el controlador para una identificación robusta del usuario autenticado.
- **Mejora**: Los endpoints `GET /api/v1/listas` y `GET /api/v1/listas/{id}` ahora devuelven `ListaCompraDetalleDto`, incluyendo los ítems de la lista con sus precios unitarios, totales y el supermercado del último precio conocido, así como el total estimado de la lista.
- **Mejora**: `ListaCompraService` ahora utiliza `HistorialPrecioService` para obtener el último precio de cada producto maestro en la lista.

## Estructura de Tiendas
- Implementado Módulo de Estructura de Tiendas (Supermercados y ProductoTienda).
- Creados DTOs: `SupermercadoDto`, `ProductoTiendaDto`.
- Creados servicios e implementaciones: `SupermercadoService`, `ProductoTiendaService`.
- Creados controladores: `SupermercadoController`, `ProductoTiendaController`.
- Endpoints añadidos para gestión CRUD de supermercados y mapeo de productos para scraping.
- Documentación de endpoints actualizada en `endpoints.md`.

## Precios
- Implementado `HistorialPrecioRepository` para persistir la serie temporal de capturas del scraper.
- Añadidos DTOs: `HistorialPrecioCreateDto` y `HistorialPrecioDto`.
- Implementados `HistorialPrecioService` y `HistorialPrecioServiceImpl`.
- Creado `HistorialPrecioController` con endpoints para registrar capturas, consultar historial y obtener el último precio disponible.
- El registro de precios utiliza `producto_tienda` como pivote entre el producto maestro y la tienda origen.
- Documentación de endpoints actualizada para soportar el flujo futuro del scraper.

## Items de Lista
- Implementado `ItemListaRepository` para gestionar el detalle de productos dentro de cada lista.
- Añadidos DTOs: `ItemListaCreateDto` y `ItemListaDto`.
- Implementados `ItemListaService` y `ItemListaServiceImpl` con validación de propietario de la lista.
- Creado `ItemListaController` con CRUD completo para los items de una lista.
- Se evita duplicar el mismo producto maestro dentro de una misma lista.
- La eliminación de listas ahora limpia previamente sus items para mantener integridad referencial.

## Optimizador de Compras
- Implementado `OptimizacionService` y `OptimizacionServiceImpl` con la lógica del algoritmo de circuito de compra óptimo.
- Creados DTOs: `ProductoOptimoDto`, `TiendaOptimaDto`, `OptimizacionCompraDto`.
- Creado `OptimizacionController` con el endpoint `GET /api/v1/listas/{id}/circuito-optimo`.
- El algoritmo selecciona el supermercado con el precio más bajo para cada ítem, con una heurística para priorizar tiendas ya seleccionadas en caso de empate.
- Calcula el ahorro total comparado con el escenario más caro.
- Maneja productos sin precio disponible.

## Configuración
- application.properties con datasource PostgreSQL y JPA.
- Opción de uso de Supabase como base de datos (sslmode=require) mediante variables de entorno.

## Validación
- Compilaciones Maven tras cada cambio relevante (sin tests).
