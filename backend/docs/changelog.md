# Historial de tareas ejecutadas

## [v2.3] - Buscador de Productos con Precios
- Creado `ProductoBusquedaDto` para aplanar la respuesta de la información del producto, el supermercado y el precio actual.
- Añadida consulta JPQL optimizada en `HistorialPrecioRepository` para extraer el último precio de cada tienda mediante subconsultas.
- Expuesto nuevo endpoint `GET /api/v1/productos/busqueda` que une el maestro de productos con su último precio registrado y es accesible por cualquier usuario autenticado.
## [v2.2] - Persistencia de Imágenes de Productos
- Añadido el campo `urlImagen` al modelo `ProductoTienda` (columna `url_imagen` tipo `TEXT`) para persistir la URL de la imagen del producto obtenida directamente del supermercado.
- Actualizado `ItemIngestaDto` para recibir `urlImagen` en el payload de ingesta masiva desde el scraper.
- Modificado `IngestaServiceImpl` para guardar la URL de la imagen al crear nuevos mapeos o actualizarla si difiere de la existente.
- Actualizado `ProductoTiendaDto` y el mapeo en `ProductoTiendaServiceImpl` para devolver `urlImagen` en las respuestas de la API.

## [v2.1] - Validación Semántica y Filtro Léxico en Ingesta Masiva
- Agregado el método `esItemCompatible` en `NormalizacionService` e implementado en `NormalizacionServiceImpl` para validar que el texto crudo del producto corresponda a la palabra clave buscada.
  - **Filtro Positivo:** Requiere que el título contenga la palabra clave o su singular (ej: "sardina" o "sardinas"). Flexibilidad añadida para que "chocolatada" acepte "chocolate" + "leche"/"bebida".
  - **Filtro Negativo:** Excluye falsos positivos semánticos en categorías propensas a agrupamiento en buscadores (ej: excluye "atún", "caballa", "anchoa" si la búsqueda era "sardinas"; excluye "paté" si la búsqueda era "picadillo").
- Refactorizado `IngestaServiceImpl` para invocar la validación antes de crear o asociar productos.
- Mejorado el manejo de excepciones en la ingesta masiva: los descartes por validación semántica lanzan `IllegalArgumentException` y se registran como advertencias (`log.warn`) limpias sin trazas de excepción en la consola del servidor, mientras que los errores inesperados siguen registrando trazas de error completas.

## [v2.0] - Descubrimiento y Poblamiento Automático de Catálogo con Normalización Inteligente

### Nueva Tabla y Entidad: criterios_busqueda
- Creada la entidad JPA `CriterioBusqueda` (tabla `criterios_busqueda`) con campos `id`, `termino_busqueda` y FK `categoria_id`.
- Creado `CriterioBusquedaRepository` con consultas por categoría y búsqueda por término.
- Creados `CriterioBusquedaService`, `CriterioBusquedaServiceImpl`, `CriterioBusquedaDto`.
- Creado `CriterioBusquedaController` con CRUD completo en `/api/v1/criterios-busqueda`.

### Modificación del Catálogo Maestro (tabla productos)
- Añadidos 3 campos atómicos a la entidad `Producto`: `variante_especifica` (String), `peso_valor` (Double), `peso_unidad` (String).
- Actualizado `ProductoDto` con los nuevos campos.
- Refactorizado `ProductoServiceImpl`: método `mapDtoToEntity()` centraliza el mapeo; `toDto()` es ahora `public` para reutilización interna.
- Añadida query `findAllByNombreGenericoIgnoreCase()` en `ProductoRepository` para carga de candidatos en similitud.

### Módulo de Normalización Inteligente
- Creado `NormalizacionService` e `NormalizacionServiceImpl` implementando:
  - **Regex de peso/volumen**: parsea "500g", "500 gr", "500 gramos", "x 500 Gr", "1kg", "1 kilo", "750ml", "1 litro", "750cc" → (`pesoValor`, `pesoUnidad`).
  - **Algoritmo Jaro-Winkler en Java puro** (sin dependencias externas), umbral configurable (default 0.92).
  - **Heurística de extracción marca/variante**: tokenización del texto restante tras quitar keyword y peso.
  - Método `esSimilar()` para comparación completa (peso exacto + Jaro-Winkler en marca/variante).
- Creado `ProductoNormalizadoDto` como DTO interno del pipeline de normalización.

### Módulo de Ingesta Masiva
- Creado `ItemIngestaDto` (DTO de entrada del scraper): `textoCrudoTienda`, `urlEspecifica`, `precioActual`, `disponibilidad`, `supermercadoId`, `palabraClaveBuscada`.
- Creado `IngestaResultadoDto` (DTO de respuesta): `procesados`, `nuevosProductos`, `productosUnificados`, `preciosRegistrados`, `errores`.
- Creados `IngestaService` e `IngestaServiceImpl` con pipeline transaccional de 6 pasos:
  1. Normalizar texto crudo → campos atómicos.
  2. Buscar candidatos por `nombreGenerico` + similitud Jaro-Winkler.
  3. Crear o reusar `Producto` maestro.
  4. Resolver `Supermercado` por ID.
  5. Crear o actualizar `ProductoTienda` (con URL).
  6. Persistir `HistorialPrecio`.
- Creado `ExtractorController` con endpoints:
  - `GET /api/v1/extractor/targets`: producto cartesiano `supermercados × criterios_busqueda`.
  - `POST /api/v1/extractor/ingesta-masiva`: ingesta batch con resumen estadístico.

---

## Flexibilización de URLs y Scraping por Nombre
- Modificado `ProductoTiendaDto` para quitar la validación `@NotBlank` de `urlEspecifica`, permitiendo asociar un producto a un supermercado sin requerir una URL de antemano.
- Agregados los campos `productoMarca` y `supermercadoUrlBase` en `ProductoTiendaDto`.
- Modificado `ProductoTiendaServiceImpl` para mapear los nuevos campos en `mapToDto`.

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
- **Corrección**: Se resolvió un error de compilación en `OptimizacionServiceImpl.java` relacionado con el uso de variables no finales en expresiones lambda.

## Dashboard de Tendencias
- Implementado el seguimiento de historial de precios por Producto Maestro.
- Nuevo método `listarHistoricoPorProductoMaestro` en `HistorialPrecioService` e `HistorialPrecioServiceImpl`.
- El servicio consolida historiales de precios de todos los supermercados vinculados a un producto genérico y los ordena cronológicamente.
- Nuevo endpoint `GET /api/v1/precios/producto-maestro/{productoId}/historico` en `HistorialPrecioController`.

## Configuración
- application.properties con datasource PostgreSQL y JPA.
- Opción de uso de Supabase como base de datos (sslmode=require) mediante variables de entorno.

## Validación
- Compilaciones Maven tras cada cambio relevante (sin tests).
