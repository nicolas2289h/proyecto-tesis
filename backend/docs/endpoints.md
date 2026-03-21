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
  - Response: UsuarioDto { id, email, nombre, estado }
  - Controlador: UsersController
  - Seguridad: público (permitAll)

- GET /api/v1/usuarios
  - Response: List<UsuarioDto>
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

## Roles
- Roles soportados: USUARIO, ADMINISTRADOR, COMERCIANTE, MODERADOR
- Tabla: rol
- Relación: N–N mediante tabla `usuario_rol`