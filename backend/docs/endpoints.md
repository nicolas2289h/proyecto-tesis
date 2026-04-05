# Endpoints

## Autenticación
- POST /api/v1/auth/login
  - Descripción: Permite a un usuario autenticarse en el sistema.
  - Request: LoginRequestDto { email, password }
  - Response: LoginResponseDto { token, email, roles }
  - Controlador: AuthController
  - Seguridad: público (permitAll)

## Usuarios
- POST /api/v1/usuarios
  - Descripción: Registra un nuevo usuario en el sistema.
  - Request: UsuarioCreateDto { email, password, nombre, estado }
  - Response: UsuarioDto { id, email, nombre, estado, roles }
  - Controlador: UsersController
  - Seguridad: público (permitAll)

- GET /api/v1/usuarios
  - Descripción: Obtiene una lista de todos los usuarios registrados.
  - Response: List<UsuarioDto> { id, email, nombre, estado, roles }
  - Controlador: UsersController
  - Seguridad: requiere JWT

- POST /api/v1/usuarios/{id}/roles
  - Descripción: Asigna un rol específico a un usuario existente.
  - Request: AssignRoleDto { usuarioId, rolId }
  - Response: ApiResponse<UsuarioDto>
  - Controlador: UsersController
  - Seguridad: requiere JWT y rol adecuado (ajustable)

## Roles
- POST /api/v1/usuarios/roles
  - Descripción: Crea un nuevo rol en el sistema.
  - Request: RolDto { nombre }
  - Response: ApiResponse<Rol>
  - Controlador: UsersController
  - Seguridad: requiere JWT

- GET /api/v1/usuarios/roles
  - Descripción: Obtiene una lista de todos los roles disponibles.
  - Response: ApiResponse<List<Rol>>
  - Controlador: UsersController
  - Seguridad: requiere JWT

## Catálogo Maestro
### Categorías
- POST /api/v1/categorias
  - Descripción: Crea una nueva categoría de producto.
  - Request: CategoriaDto { nombre }
  - Response: ApiResponse<CategoriaDto>
- GET /api/v1/categorias
  - Descripción: Obtiene una lista de todas las categorías de productos.
  - Response: ApiResponse<List<CategoriaDto>>
- GET /api/v1/categorias/{id}
  - Descripción: Obtiene una categoría específica por su ID.
  - Response: ApiResponse<CategoriaDto>
- PUT /api/v1/categorias/{id}
  - Descripción: Actualiza una categoría existente por su ID.
  - Request: CategoriaDto { nombre }
  - Response: ApiResponse<CategoriaDto>
- DELETE /api/v1/categorias/{id}
  - Descripción: Elimina una categoría por su ID.
  - Response: ApiResponse<Void>

### Productos (Maestro)
- POST /api/v1/productos
  - Descripción: Crea un nuevo producto maestro.
  - Request: ProductoDto { nombreGenerico, marca, categoriaId }
  - Response: ApiResponse<ProductoDto>
- GET /api/v1/productos
  - Descripción: Busca y lista productos maestros con opciones de filtrado y paginación.
  - Query Params: nombre, marca, categoriaId, page, size, sort
  - Response: ApiResponse<Page<ProductoDto>>
- GET /api/v1/productos/{id}
  - Descripción: Obtiene un producto maestro específico por su ID.
  - Response: ApiResponse<ProductoDto>
- PUT /api/v1/productos/{id}
  - Descripción: Actualiza un producto maestro existente por su ID.
  - Request: ProductoDto { nombreGenerico, marca, categoriaId }
  - Response: ApiResponse<ProductoDto>
- DELETE /api/v1/productos/{id}
  - Descripción: Elimina un producto maestro por su ID.
  - Response: ApiResponse<Void>

## Estructura de Tiendas
### Supermercados
- POST `/api/v1/supermercados`
  - Descripción: Crea un nuevo supermercado.
  - Request: `SupermercadoDto { nombre, urlBase }`
  - Response: `ApiResponse<SupermercadoDto>`
- GET `/api/v1/supermercados`
  - Descripción: Obtiene una lista de todos los supermercados registrados.
  - Response: `ApiResponse<List<SupermercadoDto>>`
- GET `/api/v1/supermercados/{id}`
  - Descripción: Obtiene un supermercado específico por su ID.
  - Response: `ApiResponse<SupermercadoDto>`
- PUT `/api/v1/supermercados/{id}`
  - Descripción: Actualiza un supermercado existente por su ID.
  - Request: `SupermercadoDto { nombre, urlBase }`
  - Response: `ApiResponse<SupermercadoDto>`
- DELETE `/api/v1/supermercados/{id}`
  - Descripción: Elimina un supermercado por su ID.
  - Response: `ApiResponse<Void>`

### Mapeo de Productos (ProductoTienda)
- POST `/api/v1/productos-tienda`
  - Descripción: Crea un nuevo mapeo entre un producto maestro y un supermercado, incluyendo la URL específica para scraping.
  - Request: `ProductoTiendaDto { productoId, supermercadoId, urlEspecifica, codigoExterno }`
  - Response: `ApiResponse<ProductoTiendaDto>`
- GET `/api/v1/productos-tienda`
  - Descripción: Obtiene una lista de todos los mapeos de productos a tiendas.
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- GET `/api/v1/productos-tienda/{id}`
  - Descripción: Obtiene un mapeo específico por su ID.
  - Response: `ApiResponse<ProductoTiendaDto>`
- GET `/api/v1/productos-tienda/producto/{productoId}`
  - Descripción: Obtiene todos los mapeos para un producto maestro dado su ID.
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- GET `/api/v1/productos-tienda/supermercado/{supermercadoId}`
  - Descripción: Obtiene todos los mapeos para un supermercado dado su ID.
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- PUT `/api/v1/productos-tienda/{id}`
  - Descripción: Actualiza un mapeo existente por su ID.
  - Request: `ProductoTiendaDto { productoId, supermercadoId, urlEspecifica, codigoExterno }`
  - Response: `ApiResponse<ProductoTiendaDto>`
- DELETE `/api/v1/productos-tienda/{id}`
  - Descripción: Elimina un mapeo por su ID.
  - Response: `ApiResponse<Void>`

## Historial Precios
- POST `/api/v1/precios`
  - Descripción: Registra un nuevo precio para un producto específico en una tienda (ProductoTienda).
  - Request: `HistorialPrecioCreateDto { productoTiendaId, precio, fechaRecoleccion }`
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios`
  - Descripción: Obtiene una lista de todos los registros de precios históricos.
  - Response: `ApiResponse<List<HistorialPrecioDto>>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/{id}`
  - Descripción: Obtiene un registro de precio específico por su ID.
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/producto-tienda/{productoTiendaId}`
  - Descripción: Obtiene el historial de precios para un mapeo ProductoTienda específico.
  - Response: `ApiResponse<List<HistorialPrecioDto>>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/producto-tienda/{productoTiendaId}/ultimo`
  - Descripción: Obtiene el último precio registrado para un mapeo ProductoTienda específico.
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT
  - Uso principal: obtener el último precio disponible para comparación y optimización

## Mis Listas
- POST `/api/v1/listas`
  - Descripción: Crea una nueva lista de compras para el usuario autenticado.
  - Request: `ListaCompraCreateDto { nombreLista, favorita }`
  - Response: `ApiResponse<ListaCompraDto> { id, nombreLista, fechaCreacion, favorita }`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- GET `/api/v1/listas`
  - Descripción: Obtiene todas las listas de compras del usuario autenticado, incluyendo el detalle de ítems con precios y el total estimado.
  - Response: `ApiResponse<List<ListaCompraDetalleDto>>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- GET `/api/v1/listas/{id}`
  - Descripción: Obtiene una lista de compras específica del usuario autenticado por su ID, incluyendo el detalle de ítems con precios y el total estimado.
  - Response: `ApiResponse<ListaCompraDetalleDto>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- PUT `/api/v1/listas/{id}`
  - Descripción: Actualiza una lista de compras existente del usuario autenticado por su ID.
  - Request: `ListaCompraCreateDto { nombreLista, favorita }`
  - Response: `ApiResponse<ListaCompraDto>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- DELETE `/api/v1/listas/{id}`
  - Descripción: Elimina una lista de compras del usuario autenticado por su ID, junto con todos sus ítems.
  - Response: `ApiResponse<Void>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- PATCH `/api/v1/listas/{id}/favorita`
  - Descripción: Alterna el estado "favorita" de una lista de compras del usuario autenticado.
  - Response: `ApiResponse<ListaCompraDto>` (Toggle de estado favorita)
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

### Items de Lista
- POST `/api/v1/listas/{listaId}/items`
  - Descripción: Agrega un nuevo producto a una lista de compras específica.
  - Request: `ItemListaCreateDto { productoId, cantidad }`
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- GET `/api/v1/listas/{listaId}/items`
  - Descripción: Obtiene todos los ítems de una lista de compras específica.
  - Response: `ApiResponse<List<ItemListaDto>>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- GET `/api/v1/listas/{listaId}/items/{itemId}`
  - Descripción: Obtiene un ítem específico de una lista de compras por su ID.
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- PUT `/api/v1/listas/{listaId}/items/{itemId}`
  - Descripción: Actualiza un ítem existente en una lista de compras.
  - Request: `ItemListaCreateDto { productoId, cantidad }`
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- DELETE `/api/v1/listas/{listaId}/items/{itemId}`
  - Descripción: Elimina un ítem específico de una lista de compras.
  - Response: `ApiResponse<Void>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- GET `/api/v1/listas/{id}/circuito-optimo`
  - Descripción: Genera un circuito de compra óptimo para una lista de compras, indicando qué productos comprar en cada supermercado para obtener el precio mínimo total y el ahorro total.
  - Response: `ApiResponse<OptimizacionCompraDto>`
  - Controlador: `OptimizacionController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)
