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

## Modelo y persistencia
- Entidades JPA: Usuario, Rol, UsuarioRol.
- Entidades del Módulo de Catálogo Maestro: Categoria, Supermercado, Producto, ProductoTienda.
- Entidades del Módulo de Precios: HistorialPrecio (Series de tiempo).
- Entidades del Módulo de Listas de Compras: ListaCompra, ItemLista.
- Repositorios JPA: UsuarioRepository, RolRepository, UsuarioRolRepository.
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

## Configuración
- application.properties con datasource PostgreSQL y JPA.
- Opción de uso de Supabase como base de datos (sslmode=require) mediante variables de entorno.

## Validación
- Compilaciones Maven tras cada cambio relevante (sin tests).
