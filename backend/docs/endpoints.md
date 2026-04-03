# Endpoints

## Autenticación
- POST /api/v1/auth/login
  - Request: LoginRequestDto { email, password }
  - Response: LoginResponseDto { token, email, roles }
  - Controlador: AuthController
  - Seguridad: público (permitAll)

## Usuarios
- POST /api/v1/usuarios
  - Request: UsuarioCreateDto { email, password, nombre, estado }
  - Response: UsuarioDto { id, email, nombre, estado, roles }
  - Controlador: UsersController
  - Seguridad: público (permitAll)

- GET /api/v1/usuarios
  - Response: List<UsuarioDto> { id, email, nombre, estado, roles }
  - Controlador: UsersController
  - Seguridad: requiere JWT

- POST /api/v1/usuarios/{id}/roles
  - Request: AssignRoleDto { usuarioId, rolId }
  - Response: ApiResponse<UsuarioDto>
  - Controlador: UsersController
  - Seguridad: requiere JWT y rol adecuado (ajustable)

## Roles
- POST /api/v1/usuarios/roles
  - Request: RolDto { nombre }
  - Response: ApiResponse<Rol>
  - Controlador: UsersController
  - Seguridad: requiere JWT

- GET /api/v1/usuarios/roles
  - Response: ApiResponse<List<Rol>>
  - Controlador: UsersController
  - Seguridad: requiere JWT

## Catálogo Maestro
### Categorías
- POST /api/v1/categorias
  - Request: CategoriaDto { nombre }
  - Response: ApiResponse<CategoriaDto>
- GET /api/v1/categorias
  - Response: ApiResponse<List<CategoriaDto>>
- GET /api/v1/categorias/{id}
  - Response: ApiResponse<CategoriaDto>
- PUT /api/v1/categorias/{id}
  - Request: CategoriaDto { nombre }
  - Response: ApiResponse<CategoriaDto>
- DELETE /api/v1/categorias/{id}
  - Response: ApiResponse<Void>

### Productos (Maestro)
- POST /api/v1/productos
  - Request: ProductoDto { nombreGenerico, marca, categoriaId }
  - Response: ApiResponse<ProductoDto>
- GET /api/v1/productos
  - Query Params: nombre, marca, categoriaId, page, size, sort
  - Response: ApiResponse<Page<ProductoDto>>
- GET /api/v1/productos/{id}
  - Response: ApiResponse<ProductoDto>
- PUT /api/v1/productos/{id}
  - Request: ProductoDto { nombreGenerico, marca, categoriaId }
  - Response: ApiResponse<ProductoDto>
- DELETE /api/v1/productos/{id}
  - Response: ApiResponse<Void>

## Estructura de Tiendas
### Supermercados
- POST `/api/v1/supermercados`
  - Request: `SupermercadoDto { nombre, urlBase }`
  - Response: `ApiResponse<SupermercadoDto>`
- GET `/api/v1/supermercados`
  - Response: `ApiResponse<List<SupermercadoDto>>`
- GET `/api/v1/supermercados/{id}`
  - Response: `ApiResponse<SupermercadoDto>`
- PUT `/api/v1/supermercados/{id}`
  - Request: `SupermercadoDto { nombre, urlBase }`
  - Response: `ApiResponse<SupermercadoDto>`
- DELETE `/api/v1/supermercados/{id}`
  - Response: `ApiResponse<Void>`

### Mapeo de Productos (ProductoTienda)
- POST `/api/v1/productos-tienda`
  - Request: `ProductoTiendaDto { productoId, supermercadoId, urlEspecifica, codigoExterno }`
  - Response: `ApiResponse<ProductoTiendaDto>`
- GET `/api/v1/productos-tienda`
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- GET `/api/v1/productos-tienda/{id}`
  - Response: `ApiResponse<ProductoTiendaDto>`
- GET `/api/v1/productos-tienda/producto/{productoId}`
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- GET `/api/v1/productos-tienda/supermercado/{supermercadoId}`
  - Response: `ApiResponse<List<ProductoTiendaDto>>`
- PUT `/api/v1/productos-tienda/{id}`
  - Request: `ProductoTiendaDto { productoId, supermercadoId, urlEspecifica, codigoExterno }`
  - Response: `ApiResponse<ProductoTiendaDto>`
- DELETE `/api/v1/productos-tienda/{id}`
  - Response: `ApiResponse<Void>`

## Precios
- POST `/api/v1/precios`
  - Request: `HistorialPrecioCreateDto { productoTiendaId, precio, fechaRecoleccion }`
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios`
  - Response: `ApiResponse<List<HistorialPrecioDto>>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/{id}`
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/producto-tienda/{productoTiendaId}`
  - Response: `ApiResponse<List<HistorialPrecioDto>>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT

- GET `/api/v1/precios/producto-tienda/{productoTiendaId}/ultimo`
  - Response: `ApiResponse<HistorialPrecioDto>`
  - Controlador: `HistorialPrecioController`
  - Seguridad: requiere JWT
  - Uso principal: obtener el último precio disponible para comparación y optimización

## Mis Listas
- POST `/api/v1/listas`
  - Request: `ListaCompraCreateDto { nombreLista, favorita }`
  - Response: `ApiResponse<ListaCompraDto> { id, nombreLista, fechaCreacion, favorita }`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- GET `/api/v1/listas`
  - Response: `ApiResponse<List<ListaCompraDetalleDto>>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- GET `/api/v1/listas/{id}`
  - Response: `ApiResponse<ListaCompraDetalleDto>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- PUT `/api/v1/listas/{id}`
  - Request: `ListaCompraCreateDto { nombreLista, favorita }`
  - Response: `ApiResponse<ListaCompraDto>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- DELETE `/api/v1/listas/{id}`
  - Response: `ApiResponse<Void>`
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

- PATCH `/api/v1/listas/{id}/favorita`
  - Response: `ApiResponse<ListaCompraDto>` (Toggle de estado favorita)
  - Controlador: `ListaCompraController`
  - Seguridad: requiere JWT (Principal)

### Items de Lista
- POST `/api/v1/listas/{listaId}/items`
  - Request: `ItemListaCreateDto { productoId, cantidad }`
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- GET `/api/v1/listas/{listaId}/items`
  - Response: `ApiResponse<List<ItemListaDto>>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- GET `/api/v1/listas/{listaId}/items/{itemId}`
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- PUT `/api/v1/listas/{listaId}/items/{itemId}`
  - Request: `ItemListaCreateDto { productoId, cantidad }`
  - Response: `ApiResponse<ItemListaDto>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

- DELETE `/api/v1/listas/{listaId}/items/{itemId}`
  - Response: `ApiResponse<Void>`
  - Controlador: `ItemListaController`
  - Seguridad: requiere JWT (Principal y propietario de la lista)

## Roles
- Roles soportados: USUARIO, ADMINISTRADOR, COMERCIANTE, MODERADOR
- Tabla: rol
- Relación: N–N mediante tabla `usuario_rol`
